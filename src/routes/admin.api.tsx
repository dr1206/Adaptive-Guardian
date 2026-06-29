import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { signalTone } from "@/lib/admin-signal";
import { useAdminApiServices } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";

export const Route = createFileRoute("/admin/api")({
  component: ApiHealthPage,
});

function ApiHealthPage() {
  const servicesQ = useAdminApiServices();
  const services = servicesQ.data ?? [];
  return (
    <AsyncBoundary
      isLoading={servicesQ.isLoading}
      error={servicesQ.error as Error | null}
      isEmpty={services.length === 0}
    >
      <div className="space-y-6">
        <header>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
            Platform · api health
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">API health</h1>
          <p className="text-sm text-muted-foreground mt-1">
            8 services · 99.97% overall uptime · 4 incidents this month
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {services.map((s) => {
            const tone = signalTone[s.status];
            const w = 100,
              h = 30;
            const min = Math.min(...s.series),
              max = Math.max(...s.series);
            const d = s.series
              .map(
                (v, i) =>
                  `${i === 0 ? "M" : "L"}${(i / (s.series.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`,
              )
              .join(" ");
            return (
              <InstrumentPanel key={s.name} dense eyebrow={tone.label} title={s.name}>
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
                  <path
                    d={d}
                    fill="none"
                    strokeWidth="1.5"
                    className={tone.fg.replace("text-", "stroke-")}
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div data-numeric className="text-sm">
                      {s.latency.p50}
                      <span className="text-[10px] text-muted-foreground"> ms</span>
                    </div>
                    <div className="text-[9px] uppercase font-mono text-muted-foreground tracking-wider">
                      p50
                    </div>
                  </div>
                  <div>
                    <div data-numeric className="text-sm">
                      {s.latency.p95}
                      <span className="text-[10px] text-muted-foreground"> ms</span>
                    </div>
                    <div className="text-[9px] uppercase font-mono text-muted-foreground tracking-wider">
                      p95
                    </div>
                  </div>
                  <div>
                    <div data-numeric className="text-sm">
                      {s.latency.p99}
                      <span className="text-[10px] text-muted-foreground"> ms</span>
                    </div>
                    <div className="text-[9px] uppercase font-mono text-muted-foreground tracking-wider">
                      p99
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>err {(s.errorRate * 100).toFixed(2)}%</span>
                  <span>{s.uptime.toFixed(2)}% up</span>
                </div>
              </InstrumentPanel>
            );
          })}
        </div>
      </div>
    </AsyncBoundary>
  );
}
