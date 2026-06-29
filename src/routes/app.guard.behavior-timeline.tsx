import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { ConfidenceRing } from "@/components/guard/confidence-ring";

export const Route = createFileRoute("/app/guard/behavior-timeline")({
  component: BehaviorTimeline,
});

const PARTS = [
  {
    label: "Morning",
    from: "06:00",
    to: "12:00",
    stability: 96,
    note: "Calm start. Recognized immediately.",
  },
  {
    label: "Afternoon",
    from: "12:00",
    to: "18:00",
    stability: 98,
    note: "Peak focus. Typing slightly faster.",
  },
  {
    label: "Evening",
    from: "18:00",
    to: "00:00",
    stability: 94,
    note: "Slower cadence — your usual evening rhythm.",
  },
];

const CELLS = Array.from({ length: 30 }, (_, i) => 88 + Math.round(Math.sin(i * 0.4) * 6 + 4));

function BehaviorTimeline() {
  return (
    <>
      <PageHeader
        eyebrow="Behavior"
        title="Behavior Timeline"
        subtitle="The story of how you behaved over time."
      />

      <SigilCard eyebrow="Today" title="Day river" className="mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          {PARTS.map((p) => (
            <div
              key={p.label}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="uppercase tracking-[0.22em]">{p.label}</span>
                <span className="font-numeric tabular-nums">
                  {p.from} → {p.to}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <ConfidenceRing value={p.stability} size="sm" showShield={false} />
                <span className="text-[12.5px]">Stability {p.stability}%</span>
              </div>
              <p className="mt-3 text-[12px] text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>
      </SigilCard>

      <SigilCard eyebrow="Last 30 days" title="Calendar of recognition">
        <div
          className="grid grid-cols-10 gap-2 sm:grid-cols-15 md:grid-cols-30"
          style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
        >
          {CELLS.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <ConfidenceRing value={v} size="sm" showShield={false} />
              <div className="font-numeric text-[9px] tabular-nums text-muted-foreground/60">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      </SigilCard>
    </>
  );
}
