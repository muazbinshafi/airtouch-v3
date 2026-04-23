#!/usr/bin/env python3
"""
OmniPoint Bridge Daemon
-----------------------
Receives gesture packets from the OmniPoint web app over a local WebSocket
and translates them into real Linux mouse events via python-evdev/uinput.

Packet format (JSON):
  { "type": "move",   "x": 0.0-1.0, "y": 0.0-1.0 }
  { "type": "click",  "button": "left" | "right" }
  { "type": "down",   "button": "left" }
  { "type": "up",     "button": "left" }
  { "type": "scroll", "dx": int, "dy": int }
  { "type": "ping" }                           -> replies { "type": "pong" }

Run:
  sudo modprobe uinput
  python3 omnipoint_bridge.py --host 127.0.0.1 --port 8765
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from typing import Any

try:
    import websockets
except ImportError:
    sys.exit("Missing dependency: pip install websockets")

try:
    from evdev import UInput, ecodes as e
except ImportError:
    sys.exit("Missing dependency: pip install evdev")

log = logging.getLogger("omnipoint-bridge")


def screen_size() -> tuple[int, int]:
    """Best-effort screen size detection (X11/Wayland)."""
    try:
        from screeninfo import get_monitors
        m = get_monitors()[0]
        return m.width, m.height
    except Exception:
        return 1920, 1080


SCREEN_W, SCREEN_H = screen_size()


class LinuxMouseBridge:
    def __init__(self) -> None:
        capabilities = {
            e.EV_KEY: [e.BTN_LEFT, e.BTN_RIGHT],
            e.EV_REL: [e.REL_X, e.REL_Y, e.REL_WHEEL, e.REL_HWHEEL],
        }
        try:
            self.ui = UInput(capabilities, name="OmniPoint Virtual Mouse")
        except PermissionError:
            sys.exit(
                "Cannot open /dev/uinput. Run 'sudo modprobe uinput' and ensure your user has access to /dev/uinput."
            )
        except OSError as exc:
            sys.exit(f"Failed to initialize uinput: {exc}")
        self.last_x = SCREEN_W // 2
        self.last_y = SCREEN_H // 2
        self.left_down = False

    def _emit_sync(self) -> None:
        self.ui.syn()

    def move_abs(self, x_norm: float, y_norm: float) -> None:
        target_x = int(max(0.0, min(1.0, x_norm)) * (SCREEN_W - 1))
        target_y = int(max(0.0, min(1.0, y_norm)) * (SCREEN_H - 1))
        dx = target_x - self.last_x
        dy = target_y - self.last_y
        if dx:
            self.ui.write(e.EV_REL, e.REL_X, dx)
        if dy:
            self.ui.write(e.EV_REL, e.REL_Y, dy)
        if dx or dy:
            self._emit_sync()
            self.last_x = target_x
            self.last_y = target_y

    def button_down(self, button: str = "left") -> None:
        code = e.BTN_RIGHT if button == "right" else e.BTN_LEFT
        if code == e.BTN_LEFT and self.left_down:
            return
        self.ui.write(e.EV_KEY, code, 1)
        self._emit_sync()
        if code == e.BTN_LEFT:
            self.left_down = True

    def button_up(self, button: str = "left") -> None:
        code = e.BTN_RIGHT if button == "right" else e.BTN_LEFT
        if code == e.BTN_LEFT and not self.left_down:
            return
        self.ui.write(e.EV_KEY, code, 0)
        self._emit_sync()
        if code == e.BTN_LEFT:
            self.left_down = False

    def click(self, button: str = "left") -> None:
        self.button_down(button)
        self.button_up(button)

    def scroll(self, dx: int, dy: int) -> None:
        if dx:
            self.ui.write(e.EV_REL, e.REL_HWHEEL, int(dx))
        if dy:
            self.ui.write(e.EV_REL, e.REL_WHEEL, int(dy))
        if dx or dy:
            self._emit_sync()


mouse = LinuxMouseBridge()
log.info("Screen size: %dx%d", SCREEN_W, SCREEN_H)


def handle_packet(pkt: dict[str, Any]) -> dict[str, Any] | None:
    # Accept both schemas:
    #   1. {"type": "...", ...}                       (native daemon protocol)
    #   2. {"event": "...", "data": {...}}            (web app MotionPayload)
    t = pkt.get("type") or pkt.get("event")
    data = pkt.get("data") if isinstance(pkt.get("data"), dict) else pkt

    if t == "ping":
        return {"type": "pong"}
    if t == "heartbeat":
        return None
    if t in ("move", "motion"):
        x = max(0.0, min(1.0, float(data.get("x", 0))))
        y = max(0.0, min(1.0, float(data.get("y", 0))))
        mouse.move_abs(x, y)
        # Map gesture-driven press/release if the web app included one.
        gesture = data.get("gesture")
        if gesture == "pinch":
            mouse.button_down("left")
        elif gesture in ("release", "open", "idle"):
            mouse.button_up("left")
    elif t == "click":
        mouse.click(data.get("button", "left"))
    elif t == "down":
        mouse.button_down("left")
    elif t == "up":
        mouse.button_up("left")
    elif t == "scroll":
        mouse.scroll(int(data.get("dx", 0)), int(data.get("dy", 0)))
    else:
        log.warning("Unknown packet type: %s", t)
    return None


async def session(ws):
    peer = ws.remote_address
    log.info("Client connected: %s", peer)
    try:
        async for raw in ws:
            try:
                pkt = json.loads(raw)
            except json.JSONDecodeError:
                log.warning("Bad JSON from %s", peer)
                continue
            reply = handle_packet(pkt)
            if reply is not None:
                await ws.send(json.dumps(reply))
    except websockets.ConnectionClosed:
        pass
    finally:
        log.info("Client disconnected: %s", peer)


async def main_async(host: str, port: int) -> None:
    log.info("OmniPoint bridge listening on ws://%s:%d", host, port)
    async with websockets.serve(session, host, port):
        await asyncio.Future()  # run forever


def main() -> None:
    p = argparse.ArgumentParser(description="OmniPoint local HID bridge")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    try:
        asyncio.run(main_async(args.host, args.port))
    except KeyboardInterrupt:
        log.info("Shutting down.")


if __name__ == "__main__":
    main()
