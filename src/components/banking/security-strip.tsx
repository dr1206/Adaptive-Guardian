import { useEffect, useState } from "react";
import { ShieldCheck, Smartphone, Activity, Clock } from "lucide-react";

const WHISPERS = [
  "Session stable.",
  "Behavior matches signature.",
  "Encryption refreshed.",
  "Trusted device.",
  "Aegis is watching.",
];

export function SecurityStrip() {
  const [pulse, setPulse] = useState(false);
  const [w, setW] = useState(0);
  useEffect(() => {
    const a = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 8000);
    const b = setInterval(() => setW((v) => (v + 1) % WHISPERS.length), 5500);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-0 left-0 lg:left-[300px] right-0 z-20 pointer-events-none hidden md:block"
    >
      <div
        className="mx-4 lg:mx-8 mb-3 flex items-center gap-3 lg:gap-4 rounded-full border border-white/[0.06] bg-[oklch(0.13_0.025_264/0.78)] px-4 py-2 text-xs text-muted-foreground backdrop-blur-2xl pointer-events-auto transition-colors overflow-x-auto"
        style={{
          borderColor: pulse ? "oklch(0.715 0.135 215 / 0.5)" : undefined,
        }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="relative grid h-2 w-2 place-items-center">
            <span
              className="absolute inset-0 rounded-full bg-accent/40"
              style={{ animation: "ag-strip-pulse 4s ease-in-out infinite" }}
            />
            <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <span className="font-numeric text-foreground">Aegis 99.2</span>
        </span>
        <Sep />
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-success" /> Behavior stable
        </span>
        <Sep />
        <span className="inline-flex items-center gap-1.5">
          <Smartphone className="h-3 w-3" /> Trusted device
        </span>
        <Sep />
        <span className="inline-flex items-center gap-1.5 font-numeric">
          <Clock className="h-3 w-3" /> Session 02:14
        </span>
        <Sep />
        <span className="inline-flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-accent" />
          <span
            key={w}
            className="text-foreground/80"
            style={{ animation: "ag-strip-fade .4s ease-out" }}
          >
            {WHISPERS[w]}
          </span>
        </span>
        <span className="ml-auto font-numeric text-[10px] text-muted-foreground/60">
          AES-256 · v4.2.1
        </span>
      </div>
      <style>{`
        @keyframes ag-strip-pulse { 0%,100% { transform: scale(1); opacity:.5;} 50% { transform: scale(2.4); opacity:0;} }
        @keyframes ag-strip-fade { from { opacity:0; transform: translateY(2px);} to { opacity:1; transform: translateY(0);} }
      `}</style>
    </div>
  );
}

function Sep() {
  return <span className="h-3 w-px bg-white/[0.06]" />;
}
