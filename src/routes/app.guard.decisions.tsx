import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { ConfidenceRing } from "@/components/guard/confidence-ring";
import { DecisionWaterfall, type Petal } from "@/components/guard/decision-waterfall";
import { WaveformTrace } from "@/components/guard/waveform-trace";

export const Route = createFileRoute("/app/guard/decisions")({
  component: Decisions,
});

type Decision = {
  id: string;
  time: string;
  title: string;
  outcome: "Allowed silently" | "Step-up OTP" | "Trusted";
  confidence: number;
  petals: Petal[];
};

const DECISIONS: Decision[] = [
  {
    id: "1",
    time: "Today · 11:07",
    title: "New beneficiary added",
    outcome: "Step-up OTP",
    confidence: 99.4,
    petals: [
      {
        label: "Behavior match",
        weight: 38,
        sentence: "Typing rhythm and mouse flow match your signature.",
      },
      { label: "Device match", weight: 26, sentence: "MacBook Pro · trusted for 312 days." },
      {
        label: "Historical match",
        weight: 18,
        sentence: "Recognized in 312 of 312 recent sessions.",
      },
      {
        label: "Session consistency",
        weight: 12,
        sentence: "Calm, focused session for the last 2 hours.",
      },
      {
        label: "New beneficiary risk",
        weight: -8,
        sentence: "First transfer to this recipient — one extra proof.",
      },
    ],
  },
  {
    id: "2",
    time: "Today · 10:52",
    title: "Transfer €4,800",
    outcome: "Allowed silently",
    confidence: 98.9,
    petals: [
      {
        label: "Behavior match",
        weight: 42,
        sentence: "Strong rhythm match during press-and-hold.",
      },
      { label: "Device match", weight: 28, sentence: "Same trusted device, same location." },
      { label: "Historical match", weight: 18, sentence: "Similar amounts seen in last 90 days." },
      { label: "Risk delta", weight: -4, sentence: "Slightly above your monthly median." },
    ],
  },
  {
    id: "3",
    time: "Today · 09:14",
    title: "Sign in",
    outcome: "Trusted",
    confidence: 96.2,
    petals: [
      { label: "Behavior match", weight: 36, sentence: "Login rhythm matched immediately." },
      { label: "Device match", weight: 30, sentence: "Primary device, recognized." },
      { label: "Location match", weight: 22, sentence: "Lisbon · usual range." },
      { label: "Time of day", weight: 12, sentence: "Within your normal active hours." },
    ],
  },
];

function Decisions() {
  const [sel, setSel] = useState(DECISIONS[0]);
  return (
    <>
      <PageHeader
        eyebrow="Decisions"
        title="AI Decisions"
        subtitle="Every decision the Guardian made — and exactly why."
      />

      <section className="grid gap-5 lg:grid-cols-12">
        <SigilCard className="lg:col-span-4" eyebrow="Today" title="Recent decisions">
          <ul className="space-y-2">
            {DECISIONS.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => setSel(d)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    sel.id === d.id
                      ? "border-accent/40 bg-accent/5"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-medium">{d.title}</span>
                    <span className="font-numeric text-[11px] tabular-nums text-success">
                      {d.confidence}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{d.time}</span>
                    <span>{d.outcome}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </SigilCard>

        <SigilCard className="lg:col-span-8" eyebrow={sel.time} title={sel.title}>
          <div className="grid items-start gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center">
              <ConfidenceRing value={sel.confidence} size="md" />
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-[11px] text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {sel.outcome}
              </span>
            </div>
            <div>
              <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Decision waterfall
              </div>
              <DecisionWaterfall petals={sel.petals} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Typing snapshot
              </div>
              <div className="mt-2">
                <WaveformTrace seed={sel.id.length + 3} height={70} baseline={false} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Plain English
              </div>
              <p className="mt-2 text-[13px] leading-relaxed">
                The Guardian recognized you immediately. Behavior and device alone were enough —
                risk was minimal.
              </p>
            </div>
          </div>
        </SigilCard>
      </section>
    </>
  );
}
