import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { InstrumentPanel } from "@/components/admin/instrument-panel";

export const Route = createFileRoute("/admin/ai/explain")({
  component: ExplainPage,
});

const features = [
  { name: "typing.rhythm_variance",  contrib: +0.21, plain: "Typing rhythm closely matches baseline" },
  { name: "mouse.curvature",          contrib: +0.14, plain: "Mouse paths trace familiar curves" },
  { name: "device.fingerprint_match", contrib: +0.12, plain: "Recognized device with stable hardware id" },
  { name: "session.dwell_entropy",    contrib: +0.08, plain: "Time spent per screen is consistent" },
  { name: "geo.distance_km",          contrib: -0.18, plain: "Connecting from a new geographic region" },
  { name: "behavior.drift_3sigma",    contrib: -0.11, plain: "Behavior drifted slightly outside the comfort band" },
  { name: "tap.pressure_var",         contrib: -0.04, plain: "Touch pressure varies more than usual" },
];

function ExplainPage() {
  const [mode, setMode] = useState<"plain" | "tech">("plain");
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">AI core · explainability</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Explainability</h1>
          <p className="text-sm text-muted-foreground mt-1">Why the model decided what it decided · session S-50A2F</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] p-1 flex gap-1 text-xs">
          {(["plain","tech"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-lg ${mode === m ? "bg-white/[0.08] text-foreground" : "text-muted-foreground"}`}>{m === "plain" ? "Plain English" : "Technical"}</button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InstrumentPanel eyebrow="Decision" title="Allowed · soft challenge">
          <div className="text-center py-6">
            <div data-numeric className="text-5xl font-semibold text-emerald-300">0.91</div>
            <div className="text-xs text-muted-foreground mt-2 font-mono">confidence · threshold 0.85</div>
            <div className="mt-4 text-sm text-foreground/90 leading-relaxed">
              The user looks like themselves, mostly. Typing and mouse match baseline, but they're in a new region — so we issued a soft challenge to be safe.
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
                      <div className="text-xs">{mode === "plain" ? f.plain : <span className="font-mono">{f.name}</span>}</div>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 flex justify-end">
                        {!positive && <div className="h-2 rounded-l-full bg-rose-400/70" style={{ width: `${pct}%` }} />}
                      </div>
                      <div className="w-px h-4 bg-white/30" />
                      <div className="flex-1">
                        {positive && <div className="h-2 rounded-r-full bg-emerald-400/70" style={{ width: `${pct}%` }} />}
                      </div>
                    </div>
                    <div data-numeric className={`text-xs font-mono w-12 text-right ${positive ? "text-emerald-300" : "text-rose-300"}`}>
                      {positive ? "+" : ""}{f.contrib.toFixed(2)}
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
            <div className="flex items-center justify-between"><span className="text-muted-foreground">This session</span><span data-numeric>0.91</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">User median (30d)</span><span data-numeric>0.96</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Cohort median</span><span data-numeric>0.94</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Population median</span><span data-numeric>0.95</span></div>
          </div>
        </InstrumentPanel>
        <InstrumentPanel eyebrow="Historical" title="Last 10 decisions · same user">
          <div className="flex items-end gap-1 h-32">
            {[0.95,0.96,0.94,0.97,0.96,0.93,0.91,0.95,0.94,0.91].map((c, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-500/30 to-cyan-300/80" style={{ height: `${c * 100}%` }} title={`${c.toFixed(2)}`} />
            ))}
          </div>
        </InstrumentPanel>
      </div>
    </div>
  );
}
