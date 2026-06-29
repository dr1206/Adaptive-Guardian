import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { ConfidenceRing } from "@/components/guard/confidence-ring";
import { DecisionWaterfall, type Petal } from "@/components/guard/decision-waterfall";
import { WaveformTrace } from "@/components/guard/waveform-trace";

export const Route = createFileRoute("/app/guard/explainability")({
  component: Explainability,
});

const PLAIN: Petal[] = [
  {
    label: "Familiar typing rhythm",
    weight: 42,
    sentence: "Your inter-key timing matched your 30-day signature.",
  },
  { label: "Recognized device", weight: 28, sentence: "MacBook Pro · trusted for 312 days." },
  {
    label: "Usual evening session",
    weight: 18,
    sentence: "You typically bank between 18:00 and 21:00.",
  },
  {
    label: "Consistent mouse precision",
    weight: 12,
    sentence: "Pointer paths matched your previous sessions.",
  },
];

const TECH: Petal[] = [
  {
    label: "rhythm_match (SHAP)",
    weight: 0.42,
    sentence: "Δ flight-time MAE = 6.2 ms vs baseline.",
  } as unknown as Petal,
  {
    label: "device_fp (SHAP)",
    weight: 0.28,
    sentence: "Fingerprint hash stable; cosine sim = 0.998.",
  } as unknown as Petal,
  {
    label: "time_prior (SHAP)",
    weight: 0.18,
    sentence: "P(active|hour) = 0.91.",
  } as unknown as Petal,
  {
    label: "mouse_smoothness (SHAP)",
    weight: 0.12,
    sentence: "Jerk variance within 1σ of baseline.",
  } as unknown as Petal,
].map((p) => ({ ...p, weight: (p.weight as unknown as number) * 100 }));

const COUNTER = [
  { label: "Typing speed dropped 40%", note: "Would trigger a behavioral re-check." },
  { label: "Unrecognized device", note: "Would require a step-up OTP." },
  { label: "Sudden long-distance location", note: "Would ask for biometric re-confirmation." },
];

function Explainability() {
  const [tech, setTech] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="Decisions"
        title="Explainability"
        subtitle="Why the Guardian trusted you — in plain English."
        actions={
          <div className="flex rounded-full border border-white/[0.07] bg-white/[0.02] p-0.5 text-[11px]">
            <button
              onClick={() => setTech(false)}
              className={`rounded-full px-3 py-1 ${!tech ? "bg-white/[0.08] text-foreground" : "text-muted-foreground"}`}
            >
              Plain English
            </button>
            <button
              onClick={() => setTech(true)}
              className={`rounded-full px-3 py-1 ${tech ? "bg-white/[0.08] text-foreground" : "text-muted-foreground"}`}
            >
              Technical
            </button>
          </div>
        }
      />

      <SigilCard className="mb-6">
        <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
          <div className="grid place-items-center">
            <ConfidenceRing value={98.4} size="lg" label="Why we trusted you" />
          </div>
          <div>
            <h2 className="font-display text-[22px] font-medium leading-tight">
              Four reasons the Guardian recognized you.
            </h2>
            <p className="mt-2 text-[13px] text-muted-foreground">
              The Guardian doesn't decide with a single signal. It weighs many quiet ones and
              explains every contribution.
            </p>
            <div className="mt-5">
              <DecisionWaterfall petals={tech ? TECH : PLAIN} />
            </div>
          </div>
        </div>
      </SigilCard>

      <section className="grid gap-5 lg:grid-cols-12">
        <SigilCard
          className="lg:col-span-7"
          eyebrow="What would change the decision"
          title="Counterfactuals"
        >
          <ul className="space-y-2.5">
            {COUNTER.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-warning/10 text-warning text-[12px] font-medium">
                  ?
                </span>
                <div>
                  <div className="text-[13px] font-medium">{c.label}</div>
                  <div className="text-[12px] text-muted-foreground">{c.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </SigilCard>

        <SigilCard
          className="lg:col-span-5"
          eyebrow="You today vs you this week"
          title="Side by side"
        >
          <div className="space-y-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Today
              </div>
              <WaveformTrace seed={5} height={60} baseline={false} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                This week (avg)
              </div>
              <WaveformTrace seed={2} height={60} baseline={false} color="oklch(0.635 0.215 295)" />
            </div>
          </div>
        </SigilCard>
      </section>
    </>
  );
}
