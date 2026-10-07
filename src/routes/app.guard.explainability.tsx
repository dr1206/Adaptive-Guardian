import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { ConfidenceRing } from "@/components/guard/confidence-ring";
import { DecisionWaterfall, type Petal } from "@/components/guard/decision-waterfall";
import { WaveformTrace } from "@/components/guard/waveform-trace";
import { useDecisions } from "@/services/hooks";

export const Route = createFileRoute("/app/guard/explainability")({
  component: Explainability,
});

const DEFAULT_PLAIN: Petal[] = [
  {
    label: "Familiar typing rhythm",
    weight: 42,
    sentence: "Your inter-key timing and dwell duration match your verified biometric signature.",
  },
  {
    label: "Recognized pointer movement",
    weight: 28,
    sentence: "Mouse velocity dispersion and trajectory smoothness conform to baseline.",
  },
  {
    label: "Typing cadence consistency",
    weight: 18,
    sentence: "Keys per second cadence aligns with historical enrolled sessions.",
  },
  {
    label: "Interaction trajectory",
    weight: 12,
    sentence: "Pointer jerk profile and curvature metrics reflect biological baseline.",
  },
];

const DEFAULT_TECH: Petal[] = [
  {
    label: "keys_per_sec (SHAP)",
    weight: 42,
    sentence: "Key frequency SHAP impact = -0.24 (high confidence signal).",
  },
  {
    label: "velocity_std (SHAP)",
    weight: 28,
    sentence: "Mouse velocity standard deviation SHAP impact = -0.19.",
  },
  {
    label: "dwell_mean_ms (SHAP)",
    weight: 18,
    sentence: "Dwell time SHAP impact = -0.14.",
  },
  {
    label: "curvature_mean (SHAP)",
    weight: 12,
    sentence: "Trajectory curvature SHAP impact = +0.08.",
  },
];

const COUNTER = [
  { label: "Typing speed dropped 40%", note: "Would trigger an automated behavioral challenge." },
  {
    label: "Robotic mouse trajectory (0 curvature)",
    note: "Would flag potential synthetic automation.",
  },
  { label: "Flight time drift > 3σ", note: "Would require biometric re-confirmation." },
];

function Explainability() {
  const [tech, setTech] = useState(false);
  const decisionsQ = useDecisions();
  const decisions = decisionsQ.data ?? [];
  const latestDecision = decisions[0];

  const plainPetals: Petal[] =
    latestDecision?.topFeatures && latestDecision.topFeatures.length > 0
      ? latestDecision.topFeatures.slice(0, 4).map((f) => ({
          label: `${f.name.replace(/_/g, " ")} consistency`,
          weight: Math.round(Math.abs(f.contribution) * 100),
          sentence:
            f.contribution <= 0
              ? `${f.name.replace(/_/g, " ")} conforms closely to your verified biometric baseline.`
              : `${f.name.replace(/_/g, " ")} showed slight statistical deviation from your usual pattern.`,
        }))
      : DEFAULT_PLAIN;

  const techPetals: Petal[] =
    latestDecision?.topFeatures && latestDecision.topFeatures.length > 0
      ? latestDecision.topFeatures.slice(0, 4).map((f) => ({
          label: `${f.name} (SHAP)`,
          weight: Math.round(Math.abs(f.contribution) * 100),
          sentence: `SHAP risk impact = ${f.contribution >= 0 ? "+" : ""}${f.contribution.toFixed(4)}.`,
        }))
      : DEFAULT_TECH;

  const confidenceValue = latestDecision
    ? latestDecision.action === "allow"
      ? 98.4
      : latestDecision.action === "challenge"
        ? 42.1
        : 12.0
    : 98.4;
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
            <ConfidenceRing value={confidenceValue} size="lg" label="Why we trusted you" />
          </div>
          <div>
            <h2 className="font-display text-[22px] font-medium leading-tight">
              {latestDecision?.action === "allow"
                ? "Key biometric signals confirming your identity."
                : latestDecision?.action === "challenge"
                  ? "Signals requiring biometric re-confirmation."
                  : "Continuous behavioral verification status."}
            </h2>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Adaptive Guardian continuously evaluates 14 behavioral signals (typing cadence,
              pointer velocity, jerk smoothness) with TreeSHAP mathematical risk explainability.
            </p>
            <div className="mt-5">
              <DecisionWaterfall petals={tech ? techPetals : plainPetals} />
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
