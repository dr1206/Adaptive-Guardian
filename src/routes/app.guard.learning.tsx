import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { DriftBandChart } from "@/components/guard/drift-band-chart";
import { ConfidenceRing } from "@/components/guard/confidence-ring";
import { Eye, Brain, RefreshCw, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/app/guard/learning")({
  component: Learning,
});

const LEARNED = [
  { label: "Adapted to your new keyboard rhythm", time: "Yesterday" },
  { label: "Recognized you on iPad Air", time: "2 days ago" },
  { label: "Learned Lisbon evenings as trusted", time: "5 days ago" },
  { label: "Adjusted scroll cadence baseline", time: "1 week ago" },
];

const STEPS = [
  { icon: Eye, label: "Observe", note: "Quietly watches behavior during normal use." },
  { icon: Brain, label: "Compare", note: "Compares the moment to your signature." },
  { icon: RefreshCw, label: "Update", note: "Slowly adapts to natural change." },
  { icon: ShieldCheck, label: "Recognize", note: "Trusts you faster next time." },
];

function Learning() {
  return (
    <>
      <PageHeader
        eyebrow="Behavior · Drift"
        title="Adaptive Learning"
        subtitle="Behavior naturally changes — the Guardian learns with you."
      />

      <section className="grid gap-5 lg:grid-cols-12">
        <SigilCard
          className="lg:col-span-7"
          eyebrow="Today vs your baseline"
          title="Behavior drift"
        >
          <DriftBandChart seed={11} height={220} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px]">
            <div className="flex items-center gap-4">
              <Legend color="oklch(0.715 0.135 215)" label="Today" />
              <Legend color="oklch(0.655 0.195 258 / 0.6)" label="Expected range" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/12 px-2.5 py-1 text-[11px] text-accent">
              Δ 1.4% · Within expected range
            </span>
          </div>
        </SigilCard>

        <SigilCard className="lg:col-span-5" eyebrow="Then ↔ Now" title="Your signature">
          <div className="relative grid place-items-center py-2">
            <div className="absolute">
              <ConfidenceRing value={92} size="lg" label="Then" />
            </div>
            <div className="opacity-90">
              <ConfidenceRing value={98.4} size="lg" label="Now" />
            </div>
          </div>
          <p className="mt-2 text-center text-[12.5px] text-muted-foreground">
            The Guardian is learning your evolving habits — calmly and gradually.
          </p>
        </SigilCard>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <SigilCard eyebrow="Recent learning" title="What changed in the model">
          <ul className="space-y-2">
            {LEARNED.map((l, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
              >
                <span className="grid h-7 w-7 place-items-center rounded-md bg-accent/10 text-accent">
                  <RefreshCw className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-[12.5px]">{l.label}</span>
                <span className="font-numeric text-[11px] tabular-nums text-muted-foreground">
                  {l.time}
                </span>
              </li>
            ))}
          </ul>
        </SigilCard>

        <SigilCard eyebrow="Health" title="Model status">
          <div className="grid grid-cols-3 gap-4">
            {[
              { l: "Coverage", v: 96 },
              { l: "Confidence", v: 98 },
              { l: "Freshness", v: 94 },
            ].map((r) => (
              <div key={r.l} className="flex flex-col items-center">
                <ConfidenceRing value={r.v} size="md" label={r.l} />
              </div>
            ))}
          </div>
        </SigilCard>
      </section>

      <SigilCard className="mt-6" eyebrow="How it learns" title="A calm loop">
        <div className="grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.label}
              className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="absolute right-3 top-3 font-numeric text-[10px] tabular-nums text-muted-foreground/60">
                0{i + 1}
              </div>
              <s.icon className="h-5 w-5 text-accent" />
              <div className="mt-2 font-display text-[15px] font-medium">{s.label}</div>
              <p className="mt-1 text-[12px] text-muted-foreground">{s.note}</p>
            </div>
          ))}
        </div>
      </SigilCard>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
