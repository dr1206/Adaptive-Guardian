import { useEffect, useState } from "react";
import { Shield } from "@/components/brand/shield";

const WHISPERS = [
  "Session stable.",
  "You're recognized.",
  "Behavior matches your signature.",
  "Encryption refreshed 4 min ago.",
  "Aegis is watching.",
];

export function AegisWidget({ value = 99.2 }: { value?: number }) {
  const [whisper, setWhisper] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setWhisper((v) => (v + 1) % WHISPERS.length), 6000);
    return () => clearInterval(i);
  }, []);

  const r = 64;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/[0.06] bg-[oklch(0.225_0.035_264/0.55)] p-6 backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Aegis · Continuous
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-medium text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success [animation:pulse_2s_ease-in-out_infinite]" />
          Recognized
        </span>
      </div>

      <div className="relative mx-auto mt-5 grid h-[170px] w-[170px] place-items-center">
        <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="80" cy="80" r={r} stroke="oklch(1 0 0 / 0.06)" strokeWidth="6" fill="none" />
          <defs>
            <linearGradient id="aegis-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.655 0.195 258)" />
              <stop offset="60%" stopColor="oklch(0.715 0.135 215)" />
              <stop offset="100%" stopColor="oklch(0.635 0.215 295)" />
            </linearGradient>
          </defs>
          <circle
            cx="80"
            cy="80"
            r={r}
            stroke="url(#aegis-ring)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
            style={{
              filter: "drop-shadow(0 0 12px oklch(0.715 0.135 215 / 0.4))",
              animation: "aegis-breathe 6s ease-in-out infinite",
              transformOrigin: "80px 80px",
            }}
          />
        </svg>
        <div className="text-center">
          <Shield size={22} className="mx-auto opacity-70" />
          <div className="mt-1 font-numeric text-[34px] font-semibold tracking-tight">
            {value.toFixed(1)}
            <span className="ml-0.5 text-[14px] text-muted-foreground">%</span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Confidence
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
        <Row k="Trust" v="High" />
        <Row k="Session" v="02:14" mono />
        <Row k="Device" v="Trusted" />
        <Row k="Behavior" v="Stable" tone="success" />
        <Row k="Risk" v="0.04" mono />
        <Row k="Latency" v="12 ms" mono />
      </dl>

      <div className="mt-auto pt-5">
        <p
          key={whisper}
          className="text-[12px] leading-relaxed text-muted-foreground [animation:whisper-fade_.4s_ease-out]"
        >
          <span className="text-accent">Aegis · </span>
          {WHISPERS[whisper]}
        </p>
      </div>

      <style>{`
        @keyframes aegis-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.012); }
        }
        @keyframes whisper-fade {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </article>
  );
}

function Row({ k, v, mono, tone }: { k: string; v: string; mono?: boolean; tone?: "success" }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd
        className={`text-right ${mono ? "font-numeric" : ""} ${tone === "success" ? "text-success" : "text-foreground"}`}
      >
        {v}
      </dd>
    </>
  );
}
