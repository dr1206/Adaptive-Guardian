import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { MetricCell } from "@/components/admin/metric-cell";
import { PipelineFlow } from "@/components/admin/pipeline-flow";
import { LiveTape } from "@/components/admin/live-tape";
import { RiverChart } from "@/components/admin/river-chart";
import { seedSeries, liveSessions } from "@/lib/admin-data";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin/ai/live")({
  component: LiveAIPage,
});

function LiveAIPage() {
  const [active, setActive] = useState(2);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % 6), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">AI core · live monitoring</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Live AI monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">Watch the engine think — every stage, every window, every decision</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="rounded-full bg-emerald-500/10 text-emerald-300 px-2.5 py-1 uppercase tracking-wider">healthy</span>
          <span className="text-muted-foreground">v2.4.1 · queue depth 7 · 1.24k pred/s</span>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCell label="Predictions / s" value={1247} delta={+38} signal="ok" series={seedSeries(41, 32, 1100, 1300)} />
        <MetricCell label="Inference p50" value={12} suffix="" delta={-1} signal="ok" series={seedSeries(42)} />
        <MetricCell label="Inference p99" value={38} suffix="" delta={+4} signal="watch" series={seedSeries(43)} />
        <MetricCell label="Queue depth" value={7} delta={-2} signal="ok" series={seedSeries(44)} />
      </div>

      <InstrumentPanel eyebrow="Decision pipeline" title="Live flow">
        <PipelineFlow active={active} />
      </InstrumentPanel>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <InstrumentPanel eyebrow="Live tape" title="Current windows · 60s">
            <LiveTape
              columns={[
                { label: "Session", width: "1fr" },
                { label: "Features", width: "0.6fr" },
                { label: "Score", width: "0.6fr" },
                { label: "Action", width: "0.8fr" },
                { label: "When", width: "0.5fr" },
              ]}
              rows={liveSessions.slice(0, 10).map((s, i) => ({
                id: `${s.id}-${i}`,
                cells: [
                  <span className="font-mono text-[11px] text-muted-foreground">{s.id}</span>,
                  <span data-numeric className="text-xs">188</span>,
                  <span data-numeric className={s.confidence < 0.9 ? "text-amber-300" : "text-emerald-300"}>{s.confidence.toFixed(3)}</span>,
                  <span className="text-xs">{s.confidence > 0.92 ? "allow" : s.confidence > 0.84 ? "soft challenge" : "step-up"}</span>,
                  <span className="font-mono text-[11px] text-muted-foreground">{i * 3 + 1}s ago</span>,
                ],
              }))}
            />
          </InstrumentPanel>
        </div>
        <InstrumentPanel eyebrow="Distribution" title="Confidence density · live">
          <svg viewBox="0 0 100 60" className="w-full h-44">
            <defs>
              <linearGradient id="conf-dist" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.71 0.135 215)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="oklch(0.71 0.135 215)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 60 Q15 55 30 45 Q50 18 70 12 Q85 8 100 55 L100 60 Z" fill="url(#conf-dist)" />
            <path d="M0 60 Q15 55 30 45 Q50 18 70 12 Q85 8 100 55" fill="none" stroke="oklch(0.71 0.135 215)" strokeWidth="0.8" />
            <line x1="70" x2="70" y1="0" y2="60" stroke="oklch(0.71 0.135 215)" strokeOpacity="0.4" strokeDasharray="2 2" />
            <text x="72" y="10" fontSize="4" fill="oklch(0.84 0.018 250)" fontFamily="monospace">μ 0.94</text>
          </svg>
        </InstrumentPanel>
      </div>

      <InstrumentPanel eyebrow="Inference time · 24h" title="Latency river">
        <RiverChart series={seedSeries(91, 96, 8, 42)} height={160} />
      </InstrumentPanel>
    </div>
  );
}
