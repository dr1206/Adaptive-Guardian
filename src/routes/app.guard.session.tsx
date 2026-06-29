import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { ConfidenceRing } from "@/components/guard/confidence-ring";
import { AuroraStrip } from "@/components/guard/aurora-strip";
import { Sparkline } from "@/components/banking/sparkline";

export const Route = createFileRoute("/app/guard/session")({
  component: Session,
});

const WIN = [
  { label: "Tab focus", value: "92%" },
  { label: "Idle periods", value: "3" },
  { label: "Input bursts", value: "14" },
  { label: "Navigation", value: "Calm" },
  { label: "Form engagement", value: "High" },
  { label: "Action cadence", value: "Steady" },
];

function Session() {
  return (
    <>
      <PageHeader
        eyebrow="Behavior"
        title="Session Intelligence"
        subtitle="The current session as a behavioral object."
      />

      <section className="grid gap-5 lg:grid-cols-12">
        <SigilCard className="lg:col-span-5" eyebrow="Session" title="Consistency">
          <div className="grid place-items-center py-2">
            <ConfidenceRing value={96.2} size="lg" label="Consistency" />
            <div className="mt-5 w-full">
              <AuroraStrip />
            </div>
          </div>
        </SigilCard>

        <SigilCard className="lg:col-span-7" eyebrow="Last hour" title="Behavior overlay">
          <Sparkline
            points={[80, 85, 88, 90, 92, 91, 93, 94, 95, 96, 95, 96]}
            width={600}
            height={120}
          />
        </SigilCard>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WIN.map((w) => (
          <SigilCard key={w.label} eyebrow={w.label}>
            <div className="font-numeric text-[28px] font-semibold tabular-nums">{w.value}</div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full w-3/4 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.655 0.195 258), oklch(0.715 0.135 215))",
                }}
              />
            </div>
          </SigilCard>
        ))}
      </section>
    </>
  );
}
