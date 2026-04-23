import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const GestureGuide = () => {
  useEffect(() => {
    document.title = "Gesture Guide — OmniPoint HCI";
    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };
    setMeta("description", "Animated guide to OmniPoint hand gestures: cursor, click, drag, scroll, idle and emergency stop.");
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground scan-grid">
      <Header />
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-8">
        <div className="font-mono text-[10px] tracking-[0.5em] text-primary mb-4">
          INTERACTIVE TUTORIAL · v1.0
        </div>
        <h1 className="font-mono text-3xl sm:text-5xl tracking-tight leading-[1.1] max-w-3xl">
          Learn the gestures with <span className="text-emerald-glow">live animations</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground leading-relaxed">
          Each card below demonstrates exactly how your hand should move. Practice in front
          of the camera until the on-screen telemetry matches the gesture name.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24 grid gap-6 md:grid-cols-2">
        <GestureCard
          step="01"
          name="INDEX MOVE"
          action="Move cursor"
          tip="Keep your wrist relaxed. Slow movements = pixel precision."
        >
          <IndexMoveAnim />
        </GestureCard>

        <GestureCard
          step="02"
          name="PINCH"
          action="Left click"
          tip="Tap thumb + index briefly. Release within ~200 ms to register a click."
        >
          <PinchAnim />
        </GestureCard>

        <GestureCard
          step="03"
          name="SUSTAINED PINCH"
          action="Drag"
          tip="Hold the pinch and move. Release to drop."
        >
          <DragAnim />
        </GestureCard>

        <GestureCard
          step="04"
          name="TWO-FINGER SCROLL"
          action="Scroll up / down"
          tip="Extend index + middle. Move them up to scroll up, down to scroll down."
        >
          <ScrollAnim />
        </GestureCard>

        <GestureCard
          step="05"
          name="OPEN PALM"
          action="Idle / park"
          tip="Spread all five fingers to release input safely."
        >
          <PalmAnim />
        </GestureCard>

        <GestureCard
          step="06"
          name="FIST"
          action="Emergency stop"
          tip="Make a tight fist for 500 ms to instantly disable the bridge."
        >
          <FistAnim />
        </GestureCard>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <div className="panel p-6 sm:p-10 glow-emerald">
          <div className="font-mono text-[10px] tracking-[0.3em] text-emerald-glow mb-3">▣ READY?</div>
          <h2 className="font-mono text-2xl sm:text-3xl">Try it live.</h2>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Launch the demo, allow camera access, and start with INDEX MOVE.
            The telemetry panel on the right tells you exactly which gesture is detected.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/demo"
              className="font-mono text-xs tracking-[0.35em] h-12 px-6 inline-flex items-center border border-primary bg-primary/10 text-primary hover:bg-primary/20 led transition-colors"
              style={{ boxShadow: "0 0 18px hsl(var(--primary) / 0.4)" }}
            >
              ▶ LAUNCH DEMO
            </Link>
            <Link
              to="/"
              className="font-mono text-xs tracking-[0.35em] h-12 px-6 inline-flex items-center border hairline text-foreground hover:bg-card transition-colors"
            >
              ← BACK HOME
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b hairline bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-14">
        <Link to="/" className="flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-primary led anim-pulse-soft" />
          <span className="text-emerald-glow text-[11px] tracking-[0.4em]">OMNIPOINT</span>
          <span className="text-muted-foreground text-[11px] tracking-[0.3em]">// GUIDE</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 font-mono text-[11px] tracking-[0.25em] text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">HOME</Link>
          <Link to="/guide" className="text-foreground">GUIDE</Link>
          <Link to="/demo" className="hover:text-foreground transition-colors">DEMO</Link>
        </nav>
        <Link
          to="/demo"
          className="font-mono text-[11px] tracking-[0.3em] px-3 h-9 inline-flex items-center border border-primary text-primary hover:bg-primary/10 transition-colors"
        >
          ▶ LAUNCH
        </Link>
      </div>
    </header>
  );
}

function GestureCard({
  step, name, action, tip, children,
}: {
  step: string;
  name: string;
  action: string;
  tip: string;
  children: React.ReactNode;
}) {
  const [playing, setPlaying] = useState(true);
  return (
    <div className="panel overflow-hidden flex flex-col">
      <div className="border-b hairline px-3 h-9 flex items-center justify-between">
        <div className="font-mono text-[10px] tracking-[0.3em] text-emerald-glow">
          STEP {step} // {name}
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors"
        >
          {playing ? "❚❚ PAUSE" : "▶ PLAY"}
        </button>
      </div>
      <div className={`relative aspect-video bg-black scan-grid overflow-hidden ${playing ? "" : "opacity-60"}`}>
        <div className={playing ? "" : "[&_*]:!animation-play-state-paused"} style={{ animationPlayState: playing ? "running" : "paused" }}>
          {children}
        </div>
        <div className="absolute top-2 right-2 font-mono text-[9px] tracking-[0.25em] text-emerald-glow">
          ● LIVE
        </div>
      </div>
      <div className="p-4 border-t hairline">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">ACTION →</span>
          <span className="font-mono text-sm text-foreground tracking-[0.1em]">{action}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}

/* ------------------------------- ANIMATIONS ------------------------------- */
/* Each animation is an inline SVG with CSS keyframes scoped via <style>.    */

function IndexMoveAnim() {
  return (
    <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
      <style>{`
        .gm-hand { animation: gm-move 4s ease-in-out infinite; transform-origin: center; }
        @keyframes gm-move {
          0%   { transform: translate(-30px, 10px); }
          50%  { transform: translate(30px, -15px); }
          100% { transform: translate(-30px, 10px); }
        }
        .gm-cursor { animation: gm-cursor 4s ease-in-out infinite; }
        @keyframes gm-cursor {
          0%   { transform: translate(40px, 80px); }
          50%  { transform: translate(140px, 40px); }
          100% { transform: translate(40px, 80px); }
        }
        .gm-trail { stroke-dasharray: 4 6; animation: gm-dash 1s linear infinite; }
        @keyframes gm-dash { to { stroke-dashoffset: -20; } }
      `}</style>
      <path d="M 40 80 Q 90 30 140 40" fill="none" stroke="hsl(var(--primary) / 0.6)" strokeWidth="0.8" className="gm-trail" />
      <g className="gm-hand">
        <Hand pointing />
      </g>
      <g className="gm-cursor">
        <path d="M 0 0 L 0 12 L 3 9 L 6 14 L 8 13 L 5 8 L 9 8 Z" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="0.5" />
      </g>
    </svg>
  );
}

function PinchAnim() {
  return (
    <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
      <style>{`
        .pn-thumb { animation: pn-thumb 1.6s ease-in-out infinite; transform-origin: 100px 70px; }
        .pn-index { animation: pn-index 1.6s ease-in-out infinite; transform-origin: 100px 70px; }
        @keyframes pn-thumb { 0%,100% { transform: rotate(-18deg); } 45%,55% { transform: rotate(0deg); } }
        @keyframes pn-index { 0%,100% { transform: rotate(18deg); } 45%,55% { transform: rotate(0deg); } }
        .pn-spark { opacity: 0; animation: pn-spark 1.6s ease-in-out infinite; transform-origin: center; }
        @keyframes pn-spark { 45% { opacity: 0; transform: scale(0.4);} 50% { opacity: 1; transform: scale(1.6);} 60% { opacity: 0; transform: scale(2);} }
        .pn-click { opacity: 0; animation: pn-click 1.6s ease-in-out infinite; }
        @keyframes pn-click { 50% { opacity: 1; } 70% { opacity: 0; } }
      `}</style>
      <g transform="translate(100 70)">
        <line className="pn-index" x1="0" y1="0" x2="0" y2="-40" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
        <line className="pn-thumb" x1="0" y1="0" x2="-22" y2="-30" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
        <circle cx="0" cy="0" r="8" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" strokeWidth="1" />
      </g>
      <g transform="translate(100 30)">
        <circle className="pn-spark" r="6" fill="hsl(var(--primary) / 0.6)" />
        <circle className="pn-spark" r="3" fill="hsl(var(--primary))" />
      </g>
      <text x="100" y="108" textAnchor="middle" className="pn-click" fill="hsl(var(--primary))" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="3">CLICK</text>
    </svg>
  );
}

function DragAnim() {
  return (
    <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
      <style>{`
        .dg-hand { animation: dg-move 3.5s ease-in-out infinite; }
        @keyframes dg-move {
          0%   { transform: translate(20px, 60px); }
          100% { transform: translate(120px, 30px); }
        }
        .dg-box { animation: dg-box 3.5s ease-in-out infinite; }
        @keyframes dg-box {
          0%   { transform: translate(20px, 60px); }
          100% { transform: translate(120px, 30px); }
        }
      `}</style>
      <rect x="20" y="20" width="40" height="30" fill="none" stroke="hsl(var(--border))" strokeDasharray="3 3" strokeWidth="0.5" />
      <g className="dg-box">
        <rect x="-10" y="-15" width="40" height="30" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="0.8" />
      </g>
      <g className="dg-hand">
        <circle r="8" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" strokeWidth="1" />
        <line x1="0" y1="0" x2="0" y2="-25" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
        <line x1="0" y1="0" x2="-15" y2="-20" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="110" textAnchor="middle" fill="hsl(var(--primary))" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="3">HOLD + MOVE</text>
    </svg>
  );
}

function ScrollAnim() {
  return (
    <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
      <style>{`
        .sc-fingers { animation: sc-fingers 2.4s ease-in-out infinite; transform-origin: 100px 90px; }
        @keyframes sc-fingers {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-30px); }
        }
        .sc-line { stroke-dasharray: 3 4; animation: sc-dash 0.8s linear infinite; }
        @keyframes sc-dash { to { stroke-dashoffset: -14; } }
        .sc-arrow-up { animation: sc-up 2.4s ease-in-out infinite; }
        .sc-arrow-down { animation: sc-down 2.4s ease-in-out infinite; }
        @keyframes sc-up { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.15; } }
        @keyframes sc-down { 0%, 50% { opacity: 0.15; } 51%, 100% { opacity: 1; } }
      `}</style>
      <line x1="100" y1="20" x2="100" y2="100" stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.6" className="sc-line" />
      <g transform="translate(40 60)" className="sc-arrow-up">
        <path d="M 0 0 L 8 -8 L 16 0" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <text x="8" y="14" textAnchor="middle" fill="hsl(var(--primary))" fontFamily="ui-monospace, monospace" fontSize="7" letterSpacing="2">UP</text>
      </g>
      <g transform="translate(150 60)" className="sc-arrow-down">
        <path d="M 0 0 L 8 8 L 16 0" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <text x="8" y="-4" textAnchor="middle" fill="hsl(var(--primary))" fontFamily="ui-monospace, monospace" fontSize="7" letterSpacing="2">DN</text>
      </g>
      <g className="sc-fingers">
        <line x1="92" y1="90" x2="92" y2="50" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
        <line x1="108" y1="90" x2="108" y2="50" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="92" r="10" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" strokeWidth="1" />
      </g>
    </svg>
  );
}

function PalmAnim() {
  return (
    <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
      <style>{`
        .pl-pulse { animation: pl-pulse 2.5s ease-in-out infinite; transform-origin: 100px 65px; }
        @keyframes pl-pulse { 0%,100% { transform: scale(1);} 50% { transform: scale(1.05);} }
        .pl-ring { animation: pl-ring 2.5s ease-out infinite; transform-origin: 100px 65px; }
        @keyframes pl-ring { 0% { opacity: 0.6; transform: scale(0.6);} 100% { opacity: 0; transform: scale(2);} }
      `}</style>
      <circle cx="100" cy="65" r="30" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" className="pl-ring" />
      <g className="pl-pulse">
        {/* palm */}
        <circle cx="100" cy="70" r="14" fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary))" strokeWidth="1" />
        {/* 5 fingers */}
        <line x1="100" y1="70" x2="78" y2="55" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="70" x2="88" y2="35" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="70" x2="100" y2="28" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="70" x2="112" y2="35" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="70" x2="122" y2="55" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="110" textAnchor="middle" fill="hsl(var(--primary))" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="3">IDLE / PARK</text>
    </svg>
  );
}

function FistAnim() {
  return (
    <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
      <style>{`
        .fs-fist { animation: fs-shake 0.6s ease-in-out infinite; transform-origin: 100px 65px; }
        @keyframes fs-shake { 0%,100% { transform: translateX(0);} 25% { transform: translateX(-2px);} 75% { transform: translateX(2px);} }
        .fs-flash { animation: fs-flash 1s ease-in-out infinite; }
        @keyframes fs-flash { 0%,100% { opacity: 0.3;} 50% { opacity: 1;} }
      `}</style>
      <rect x="40" y="15" width="120" height="90" fill="none" stroke="hsl(var(--destructive) / 0.5)" strokeWidth="0.8" strokeDasharray="4 4" className="fs-flash" />
      <g className="fs-fist">
        <circle cx="100" cy="65" r="22" fill="hsl(var(--destructive) / 0.25)" stroke="hsl(var(--destructive))" strokeWidth="1.5" />
        <path d="M 82 60 Q 100 50 118 60 L 116 78 Q 100 84 84 78 Z" fill="hsl(var(--destructive) / 0.4)" stroke="hsl(var(--destructive))" strokeWidth="1" />
      </g>
      <text x="100" y="110" textAnchor="middle" fill="hsl(var(--destructive))" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="3" className="fs-flash">⚠ EMERGENCY STOP</text>
    </svg>
  );
}

function Hand({ pointing = false }: { pointing?: boolean }) {
  return (
    <g transform="translate(100 60)">
      <circle cx="0" cy="10" r="12" fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary))" strokeWidth="1" />
      {pointing ? (
        <>
          <line x1="0" y1="10" x2="0" y2="-22" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="-22" r="2.5" fill="hsl(var(--primary))" />
        </>
      ) : null}
      <line x1="0" y1="10" x2="-12" y2="-6" stroke="hsl(var(--primary) / 0.6)" strokeWidth="2" strokeLinecap="round" />
      <line x1="0" y1="10" x2="10" y2="-4" stroke="hsl(var(--primary) / 0.6)" strokeWidth="2" strokeLinecap="round" />
      <line x1="0" y1="10" x2="14" y2="2" stroke="hsl(var(--primary) / 0.6)" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

export default GestureGuide;
