import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { Sparkline } from "@/components/banking/sparkline";
import { Shield } from "@/components/brand/shield";

export const Route = createFileRoute("/app/guard/mouse")({
  component: Mouse,
});

const KPI = [
  { label: "Speed", value: "1.4×", spark: [1.2, 1.3, 1.3, 1.4, 1.4, 1.5, 1.4] },
  { label: "Precision", value: "94%", spark: [88, 90, 91, 92, 93, 94, 94] },
  { label: "Click rhythm", value: "0.82", spark: [0.7, 0.74, 0.78, 0.8, 0.82, 0.82, 0.82] },
  { label: "Smoothness", value: "96%", spark: [90, 92, 93, 94, 95, 95, 96] },
];

function Mouse() {
  return (
    <>
      <PageHeader
        eyebrow="Behavior · Biometrics"
        title="Mouse Intelligence"
        subtitle="The shape of your hand on the screen."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI.map((k) => (
          <SigilCard key={k.label} eyebrow={k.label}>
            <div className="font-numeric text-[28px] font-semibold tabular-nums">{k.value}</div>
            <div className="mt-2">
              <Sparkline points={k.spark} width={200} height={28} />
            </div>
          </SigilCard>
        ))}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-12">
        <SigilCard className="lg:col-span-7" eyebrow="Last session" title="Cursor trail" live>
          <CursorTrail />
        </SigilCard>
        <SigilCard className="lg:col-span-5" eyebrow="Today" title="Movement density">
          <Heatmap />
        </SigilCard>
      </section>

      <section className="mt-6">
        <SigilCard eyebrow="Speed" title="Movement graph">
          <SpeedGraph />
        </SigilCard>
      </section>

      <SigilCard className="mt-6" eyebrow="Aegis observation">
        <div className="flex items-start gap-3">
          <Shield size={28} live />
          <p className="text-[14px] leading-relaxed text-foreground/90">
            Your pointer moves with familiar confidence. No hesitation, no jitter.
          </p>
        </div>
      </SigilCard>
    </>
  );
}

function CursorTrail() {
  const paths = [
    "M20 200 C 90 80, 200 260, 320 140 S 540 220, 700 120 S 900 60, 980 180",
    "M40 260 C 140 180, 260 80, 380 200 S 600 280, 760 180 S 900 100, 980 260",
    "M30 80 C 120 200, 280 140, 420 240 S 660 120, 800 220 S 920 200, 980 80",
  ];
  return (
    <svg viewBox="0 0 1000 320" className="block w-full">
      <defs>
        <pattern id="ct-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#D9E1EA" strokeOpacity="0.4" />
        </pattern>
        <linearGradient id="ct-line" x1="0" x2="1">
          <stop offset="0%" stopColor="#0B3A82" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#0B3A82" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2563A6" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect width="1000" height="320" fill="url(#ct-grid)" />
      {paths.map((p, i) => (
        <path
          key={i}
          d={p}
          fill="none"
          stroke="url(#ct-line)"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ opacity: 0.5 + i * 0.25 }}
        />
      ))}
    </svg>
  );
}

function Heatmap() {
  const cols = 16;
  const rows = 10;
  const cells = Array.from({ length: cols * rows }, (_, i) => {
    const x = Math.sin(i * 0.7) * 0.5 + 0.5;
    const y = Math.cos(i * 0.3) * 0.5 + 0.5;
    return Math.max(0, x * y - 0.25);
  });
  return (
    <div
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
    >
      {cells.map((v, i) => (
        <div
          key={i}
          className="aspect-square rounded-[3px]"
          style={{
            background:
              v < 0.02
                ? "rgba(11, 58, 130, 0.04)"
                : `rgba(11, 58, 130, ${0.15 + v * 0.75})`,
          }}
        />
      ))}
    </div>
  );
}

function SpeedGraph() {
  const N = 80;
  let p = "";
  let s = "";
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * 1000;
    const j = Math.sin(i * 0.5) * 30 + (Math.random() - 0.5) * 25;
    const smooth = Math.sin(i * 0.18) * 28;
    p += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${(100 + j).toFixed(1)} `;
    s += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${(100 + smooth).toFixed(1)} `;
  }
  return (
    <svg viewBox="0 0 1000 200" className="block w-full">
      <path d={p} fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
      <path d={s} fill="none" stroke="#0B3A82" strokeWidth="2.5" />
    </svg>
  );
}
