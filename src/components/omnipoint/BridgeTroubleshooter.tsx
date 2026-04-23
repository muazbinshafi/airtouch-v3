import { useEffect, useState } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";

interface Props {
  open: boolean;
  onClose: () => void;
  bridgeUrl: string;
  onTestBridge: () => Promise<void> | void;
}

type CheckId = "secure" | "url" | "ws" | "probe";
type CheckState = "pending" | "running" | "pass" | "fail" | "warn";

interface Check {
  id: CheckId;
  label: string;
  state: CheckState;
  detail: string;
}

function detectOS(): "linux" | "mac" | "windows" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("linux") && !ua.includes("android")) return "linux";
  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "windows";
  return "other";
}

export function BridgeTroubleshooter({ open, onClose, bridgeUrl, onTestBridge }: Props) {
  const t = useTelemetry();
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(false);
  const os = detectOS();

  const runDiagnostics = async () => {
    setRunning(true);
    const results: Check[] = [
      { id: "secure", label: "Secure context", state: "running", detail: "" },
      { id: "url", label: "Endpoint URL", state: "pending", detail: "" },
      { id: "ws", label: "WebSocket support", state: "pending", detail: "" },
      { id: "probe", label: "Bridge handshake", state: "pending", detail: "" },
    ];
    setChecks([...results]);

    // 1. Secure context (only required for wss:// over the public web)
    const isLocal = /^wss?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(bridgeUrl);
    if (typeof window !== "undefined" && !window.isSecureContext && !isLocal) {
      results[0] = { ...results[0], state: "warn", detail: "Insecure context — browsers may block ws:// from https pages" };
    } else {
      results[0] = { ...results[0], state: "pass", detail: isLocal ? "Loopback bridge — secure context not required" : "OK" };
    }
    setChecks([...results]);

    // 2. URL parse
    results[1] = { ...results[1], state: "running" };
    setChecks([...results]);
    let parsed: URL | null = null;
    try {
      parsed = new URL(bridgeUrl);
      if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
        results[1] = { ...results[1], state: "fail", detail: `Protocol ${parsed.protocol} — must be ws:// or wss://` };
      } else {
        results[1] = { ...results[1], state: "pass", detail: `${parsed.protocol}//${parsed.host}` };
      }
    } catch {
      results[1] = { ...results[1], state: "fail", detail: "Invalid URL format" };
    }
    setChecks([...results]);

    // 3. WS available
    results[2] = { ...results[2], state: "running" };
    setChecks([...results]);
    if (typeof WebSocket === "undefined") {
      results[2] = { ...results[2], state: "fail", detail: "WebSocket API missing in this browser" };
    } else {
      results[2] = { ...results[2], state: "pass", detail: "Available" };
    }
    setChecks([...results]);

    // 4. Probe
    results[3] = { ...results[3], state: "running", detail: "Probing endpoint…" };
    setChecks([...results]);
    if (parsed && results[1].state === "pass") {
      await onTestBridge();
      const snap = (await import("@/lib/omnipoint/TelemetryStore")).TelemetryStore.get();
      if (snap.bridgeProbe === "ok") {
        results[3] = { ...results[3], state: "pass", detail: `${snap.bridgeProbeMsg} · ${snap.bridgeProbeRttMs}ms` };
      } else {
        results[3] = { ...results[3], state: "fail", detail: snap.bridgeProbeMsg };
      }
    } else {
      results[3] = { ...results[3], state: "fail", detail: "Skipped — fix URL first" };
    }
    setChecks([...results]);
    setRunning(false);
  };

  useEffect(() => {
    if (open) runDiagnostics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const dotFor = (s: CheckState) => {
    switch (s) {
      case "pass": return "bg-primary shadow-[0_0_8px_hsl(var(--primary))]";
      case "fail": return "bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]";
      case "warn": return "bg-yellow-400";
      case "running": return "bg-yellow-400 animate-pulse";
      default: return "bg-muted-foreground/40";
    }
  };

  const probeFailed = checks.find((c) => c.id === "probe")?.state === "fail";

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="panel w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b hairline px-4 h-11">
          <div className="font-mono text-[12px] tracking-[0.25em] text-emerald-glow">
            ▣ BRIDGE DIAGNOSTICS
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[11px] text-muted-foreground hover:text-foreground tracking-[0.2em]"
          >
            ✕ CLOSE
          </button>
        </div>

        <div className="p-4 border-b hairline">
          <div className="font-mono text-[10px] text-muted-foreground tracking-[0.25em] mb-2">TARGET ENDPOINT</div>
          <div className="font-mono text-sm text-foreground bg-input border border-border px-3 h-9 flex items-center">
            {bridgeUrl}
          </div>
        </div>

        <div className="p-4 border-b hairline">
          <div className="font-mono text-[10px] text-muted-foreground tracking-[0.25em] mb-3">CHECKS</div>
          <ul className="space-y-2">
            {checks.map((c) => (
              <li key={c.id} className="flex items-start gap-3 font-mono text-[11px]">
                <span className={`mt-1.5 inline-block w-2 h-2 rounded-full shrink-0 ${dotFor(c.state)}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-foreground tracking-[0.15em]">{c.label.toUpperCase()}</div>
                  <div className="text-muted-foreground text-[10px] truncate" title={c.detail}>
                    {c.detail || "—"}
                  </div>
                </div>
                <span
                  className={`font-mono text-[10px] tracking-[0.25em] shrink-0 ${
                    c.state === "pass" ? "text-emerald-glow" :
                    c.state === "fail" ? "text-destructive" :
                    c.state === "warn" ? "text-yellow-400" :
                    c.state === "running" ? "text-yellow-400" :
                    "text-muted-foreground"
                  }`}
                >
                  {c.state.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={runDiagnostics}
            disabled={running}
            className="mt-4 w-full h-9 font-mono text-[11px] tracking-[0.25em] border border-primary/60 text-primary hover:bg-primary/10 disabled:opacity-60"
          >
            {running ? "◌ RE-RUNNING…" : "↻ RE-RUN DIAGNOSTICS"}
          </button>
        </div>

        {probeFailed && (
          <div className="p-4 border-b hairline">
            <div className="font-mono text-[10px] text-destructive tracking-[0.25em] mb-2">⚠ HANDSHAKE FAILED — LIKELY CAUSES</div>
            <ol className="font-mono text-[11px] text-muted-foreground space-y-2 leading-relaxed list-decimal list-inside">
              <li>
                <span className="text-foreground">The Python bridge daemon isn't running.</span> The web app
                cannot move your real cursor on its own — a small local helper must be active on this machine.
              </li>
              <li>
                <span className="text-foreground">Wrong host or port.</span> Default is{" "}
                <span className="text-primary">ws://localhost:8765</span>. If you changed{" "}
                <span className="text-foreground">--port</span>, update the endpoint above.
              </li>
              <li>
                <span className="text-foreground">Firewall / loopback blocked.</span> macOS may prompt; allow
                Python to accept incoming connections.
              </li>
              <li>
                <span className="text-foreground">Browser blocks ws:// from https://.</span> Mixed-content
                policy blocks insecure WebSockets from secure pages. Open the app from{" "}
                <span className="text-primary">http://localhost</span> for testing, or terminate TLS in front
                of the bridge.
              </li>
            </ol>
          </div>
        )}

        <div className="p-4 border-b hairline">
          <div className="font-mono text-[10px] text-emerald-glow tracking-[0.25em] mb-2">▸ START THE BRIDGE</div>
          <div className="font-mono text-[10px] text-muted-foreground mb-2 tracking-[0.2em]">
            DETECTED OS — {os.toUpperCase()}
          </div>

          <div className="font-mono text-[10px] text-muted-foreground mb-1 mt-3">1 · Install once</div>
          <pre className="font-mono text-[11px] bg-input border border-border p-3 overflow-x-auto whitespace-pre text-foreground">
{`cd bridge
python3 -m venv .venv
source .venv/bin/activate    ${os === "windows" ? "# Windows: .venv\\Scripts\\activate" : ""}
pip install -r requirements.txt`}
          </pre>

          {os === "linux" && (
            <>
              <div className="font-mono text-[10px] text-muted-foreground mb-1 mt-3">2 · Linux: load uinput once per boot</div>
              <pre className="font-mono text-[11px] bg-input border border-border p-3 overflow-x-auto text-foreground">
{`sudo modprobe uinput`}
              </pre>
            </>
          )}

          <div className="font-mono text-[10px] text-muted-foreground mb-1 mt-3">
            {os === "linux" ? "3" : "2"} · Run the daemon
          </div>
          <pre className="font-mono text-[11px] bg-input border border-border p-3 overflow-x-auto text-foreground">
{`python3 omnipoint_bridge.py --host 127.0.0.1 --port 8765`}
          </pre>

          {os === "mac" && (
            <p className="font-mono text-[10px] text-muted-foreground mt-3 leading-relaxed">
              <span className="text-yellow-400">macOS:</span> grant your terminal{" "}
              <span className="text-foreground">Accessibility</span> permission in System Settings → Privacy &
              Security → Accessibility, then restart the daemon.
            </p>
          )}
        </div>

        <div className="p-4 flex items-center justify-between gap-2">
          <div className="font-mono text-[10px] text-muted-foreground tracking-[0.2em]">
            STATE · <span className="text-foreground">{t.wsState.toUpperCase()}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={runDiagnostics}
              disabled={running}
              className="h-9 px-4 font-mono text-[11px] tracking-[0.25em] border border-primary/60 text-primary hover:bg-primary/10 disabled:opacity-60"
            >
              ◉ RETEST
            </button>
            <button
              onClick={onClose}
              className="h-9 px-4 font-mono text-[11px] tracking-[0.25em] border border-border text-muted-foreground hover:text-foreground"
            >
              DISMISS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
