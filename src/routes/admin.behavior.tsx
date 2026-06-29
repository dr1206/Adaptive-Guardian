import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { HeatGrid } from "@/components/admin/heat-grid";
import { MetricCell } from "@/components/admin/metric-cell";
import { RiverChart } from "@/components/admin/river-chart";
import { seedSeries, seedHeat } from "@/lib/admin-signal";

export const Route = createFileRoute("/admin/behavior")({
  component: BehaviorPage,
});

function BehaviorPage() {
  const [tab, setTab] = useState<"typing"|"mouse"|"drift"|"cohorts">("typing");
  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Identity ops · behavior</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Behavior analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Population-level signal across typing, mouse, drift and cohort overlays</p>
      </header>

      <div className="grid grid-cols-4 gap-3">
        <MetricCell label="Avg stability" value={0.987} delta={+0.004} signal="ok" series={seedSeries(31)} />
        <MetricCell label="Typing rhythm" value={0.94} delta={+0.01} signal="ok" series={seedSeries(32)} />
        <MetricCell label="Mouse fidelity" value={0.92} delta={-0.02} signal="watch" series={seedSeries(33)} />
        <MetricCell label="Outliers (24h)" value={28} delta={+4} signal="watch" series={seedSeries(34)} />
      </div>

      <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] p-1 w-fit text-xs">
        {(["typing","mouse","drift","cohorts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg capitalize ${tab === t ? "bg-white/[0.08] text-foreground" : "text-muted-foreground"}`}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InstrumentPanel eyebrow={`${tab} · distribution`} title="Population density">
          <div className="h-48 relative">
            <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="violin" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.71 0.135 215)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="oklch(0.655 0.195 258)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 25 Q25 5 50 8 T100 25 L100 50 L0 50 Z" fill="url(#violin)" />
              <path d="M0 25 Q25 5 50 8 T100 25" fill="none" stroke="oklch(0.71 0.135 215)" strokeWidth="0.6" />
            </svg>
          </div>
        </InstrumentPanel>
        <InstrumentPanel eyebrow={`${tab} · trend · 30d`} title="Stability over time">
          <RiverChart series={seedSeries(99 + tab.length, 96, 0.85, 0.99)} height={180} />
        </InstrumentPanel>
      </div>

      <InstrumentPanel eyebrow="Heatmap · 7×24" title="Behavior consistency by hour">
        <HeatGrid data={seedHeat(77 + tab.length)} />
      </InstrumentPanel>
    </div>
  );
}
