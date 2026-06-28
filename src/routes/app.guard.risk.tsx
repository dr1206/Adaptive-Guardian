import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { RiskHeatmap } from "@/components/guard/risk-heatmap";
import { Sparkline } from "@/components/banking/sparkline";

export const Route = createFileRoute("/app/guard/risk")({
  component: Risk,
});

const DIST = [
  { label: "Behavior", value: 38 },
  { label: "Device", value: 22 },
  { label: "Network", value: 14 },
  { label: "Velocity", value: 16 },
  { label: "Geography", value: 10 },
];

const BLIPS = [
  { t: "10:52", label: "Large amount", risk: 0.05, note: "Confidence restored in 3s." },
  { t: "09:14", label: "New ISP", risk: 0.04, note: "Recognized via behavior + device." },
  { t: "Yesterday", label: "Off-hours session", risk: 0.07, note: "Allowed silently." },
];

function Risk() {
  return (
    <>
      <PageHeader
        eyebrow="Decisions"
        title="Risk Center"
        subtitle="A calm view of risk over time — mostly quiet, always watched."
      />

      <section className="grid gap-5 lg:grid-cols-12">
        <SigilCard className="lg:col-span-4" eyebrow="Now" title="Current risk">
          <div className="flex items-end justify-between">
            <div className="font-numeric text-[64px] font-semibold leading-none tracking-tight">0.04</div>
            <span className="rounded-full bg-success/12 px-2.5 py-1 text-[11px] text-success">Low</span>
          </div>
          <div className="mt-4">
            <Sparkline points={[0.12, 0.09, 0.07, 0.06, 0.05, 0.04, 0.04]} width={300} height={40} />
          </div>
          <p className="mt-3 text-[11.5px] text-muted-foreground">30-day trend — steadily lower as the model learns.</p>
        </SigilCard>

        <SigilCard className="lg:col-span-4" eyebrow="By source" title="Risk distribution">
          <ul className="space-y-2.5">
            {DIST.map((d) => (
              <li key={d.label} className="flex items-center gap-3">
                <span className="w-20 text-[12px]">{d.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.value}%`,
                      background: "linear-gradient(90deg, oklch(0.655 0.195 258), oklch(0.715 0.135 215))",
                    }}
                  />
                </div>
                <span className="font-numeric w-8 text-right text-[11px] tabular-nums text-muted-foreground">{d.value}%</span>
              </li>
            ))}
          </ul>
        </SigilCard>

        <SigilCard className="lg:col-span-4" eyebrow="Last 14 days" title="Recent blips">
          <ul className="space-y-2">
            {BLIPS.map((b, i) => (
              <li key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-medium">{b.label}</span>
                  <span className="font-numeric text-[11px] tabular-nums text-muted-foreground">risk {b.risk.toFixed(2)}</span>
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">{b.t} · {b.note}</div>
              </li>
            ))}
          </ul>
        </SigilCard>
      </section>

      <section className="mt-6">
        <SigilCard eyebrow="Week × Hour" title="Risk heatmap">
          <RiskHeatmap />
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            Most of the grid is dark — the absence of color is the message.
          </p>
        </SigilCard>
      </section>
    </>
  );
}
