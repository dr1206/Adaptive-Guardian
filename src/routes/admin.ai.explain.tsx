import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { useDecisions } from "@/services/hooks";

export const Route = createFileRoute("/admin/ai/explain")({
  component: ExplainPage,
});

const DEFAULT_FEATURES = [
  {
    name: "keys_per_sec",
    contrib: -0.24,
    plain: "Keystroke frequency matches enrolled cadence",
  },
  { name: "velocity_std", contrib: -0.19, plain: "Mouse velocity dispersion is normal" },
  {
    name: "dwell_mean_ms",
    contrib: -0.14,
    plain: "Average key press dwell time matches baseline",
  },
  { name: "curvature_mean", contrib: +0.08, plain: "Trajectory curvature deviates slightly" },
  {
    name: "flight_mean_ms",
    contrib: -0.11,
    plain: "Flight time between consecutive keys matches profile",
  },
  {
    name: "acceleration_std",
    contrib: +0.05,
    plain: "Jerk and acceleration variation slightly higher",
  },
  { name: "click_count", contrib: -0.02, plain: "Mouse button clicking cadence matches history" },
];

function ExplainPage() {
  const [mode, setMode] = useState<"plain" | "tech">("plain");
  const decisionsQ = useDecisions();
  const decisions = decisionsQ.data ?? [];
  const latestDecision = decisions[0];

  // Derive feature contributions from real backend topFeatures (TreeSHAP) if available
  const features =
    latestDecision?.topFeatures && latestDecision.topFeatures.length > 0
      ? latestDecision.topFeatures.map((f) => {
          const isRisk = f.contribution > 0;
          return {
            name: f.name,
            contrib: f.contribution,
            plain: isRisk
              ? `${f.name.replace(/_/g, " ")} drifted from historical biometric baseline (+risk)`
              : `${f.name.replace(/_/g, " ")} closely matches verified biometric baseline (-risk)`,
          };
        })
      : DEFAULT_FEATURES;

  const confidenceScore = latestDecision
    ? latestDecision.action === "allow"
      ? 0.94
      : latestDecision.action === "challenge"
        ? 0.42
        : 0.15
    : 0.92;
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
            AI core · explainability
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Explainability</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Why the model decided what it decided · session S-50A2F
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] p-1 flex gap-1 text-xs">
          {(["plain", "tech"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg ${mode === m ? "bg-white/[0.08] text-foreground" : "text-muted-foreground"}`}
            >
              {m === "plain" ? "Plain English" : "Technical"}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InstrumentPanel
          eyebrow="Decision"
          title={
            latestDecision
              ? `${latestDecision.action.toUpperCase()} · ${latestDecision.reason || "Behavior evaluation"}`
              : "Allowed · continuous verification"
          }
        >
          <div className="text-center py-6">
            <div
              data-numeric
              className={`text-5xl font-semibold ${confidenceScore >= 0.7 ? "text-emerald-300" : confidenceScore >= 0.4 ? "text-amber-300" : "text-rose-400"}`}
            >
              {confidenceScore.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-2 font-mono">
              confidence · threshold 0.70
            </div>
            <div className="mt-4 text-sm text-foreground/90 leading-relaxed">
              {latestDecision?.reason
                ? latestDecision.reason
                : "Continuous behavioral authentication evaluates 14 keystroke and pointer dynamics features via One-Class SVM and calibrated LightGBM with real-time TreeSHAP risk attribution."}
            </div>
          </div>
        </InstrumentPanel>

        <div className="lg:col-span-2">
          <InstrumentPanel eyebrow="SHAP · waterfall" title="Feature contributions">
            <div className="space-y-2">
              {features.map((f) => {
                const positive = f.contrib > 0;
                const pct = Math.min(45, Math.abs(f.contrib) * 200);
                return (
                  <div key={f.name} className="flex items-center gap-3">
                    <div className="w-1/2 min-w-0">
                      <div className="text-xs">
                        {mode === "plain" ? f.plain : <span className="font-mono">{f.name}</span>}
                      </div>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 flex justify-end">
                        {!positive && (
                          <div
                            className="h-2 rounded-l-full bg-rose-400/70"
                            style={{ width: `${pct}%` }}
                          />
                        )}
                      </div>
                      <div className="w-px h-4 bg-white/30" />
                      <div className="flex-1">
                        {positive && (
                          <div
                            className="h-2 rounded-r-full bg-emerald-400/70"
                            style={{ width: `${pct}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <div
                      data-numeric
                      className={`text-xs font-mono w-12 text-right ${positive ? "text-emerald-300" : "text-rose-300"}`}
                    >
                      {positive ? "+" : ""}
                      {f.contrib.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </InstrumentPanel>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InstrumentPanel eyebrow="Comparison" title="This decision vs cohort median">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">This session</span>
              <span data-numeric>0.91</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">User median (30d)</span>
              <span data-numeric>0.96</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cohort median</span>
              <span data-numeric>0.94</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Population median</span>
              <span data-numeric>0.95</span>
            </div>
          </div>
        </InstrumentPanel>
        <InstrumentPanel eyebrow="Historical" title="Last 10 decisions · same user">
          <div className="flex items-end gap-1 h-32">
            {[0.95, 0.96, 0.94, 0.97, 0.96, 0.93, 0.91, 0.95, 0.94, 0.91].map((c, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-500/30 to-cyan-300/80"
                style={{ height: `${c * 100}%` }}
                title={`${c.toFixed(2)}`}
              />
            ))}
          </div>
        </InstrumentPanel>
      </div>
    </div>
  );
}
