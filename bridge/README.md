# OmniPoint Bridge Daemon

Local WebSocket → OS HID translator. The web app runs vision in your browser
and sends gesture packets here; this daemon moves your real cursor.

## Install

```bash
cd bridge
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
# Linux: ensure the uinput module is loaded once
sudo modprobe uinput

python3 omnipoint_bridge.py --host 127.0.0.1 --port 8765
```

Then in the web app set **Bridge URL** to `ws://127.0.0.1:8765`
and press **TEST BRIDGE**. A green LED + RTT means you're live.

## Autostart (systemd --user)

See `systemd/omnipoint-bridge.service` for a ready-to-use unit:

```bash
mkdir -p ~/.config/systemd/user
cp systemd/omnipoint-bridge.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now omnipoint-bridge
```

## Protocol

JSON over WebSocket. See top of `omnipoint_bridge.py` for the full packet spec.

## Platform notes

- **Linux (X11 / Wayland)** — supported via `evdev` + `/dev/uinput`; if the socket connects but the pointer does not move, verify `ls -l /dev/uinput` and add your user to the input group if needed.
- **macOS / Windows** — this bundled bridge is Linux-focused; use a platform-specific input backend before expecting OS cursor injection there.
