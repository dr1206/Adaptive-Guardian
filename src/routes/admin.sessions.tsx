import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { OpsTable } from "@/components/admin/ops-table";
import { MetricCell } from "@/components/admin/metric-cell";
import { HeatGrid } from "@/components/admin/heat-grid";
import { SignalDot } from "@/components/admin/signal-dot";
import { seedHeat, seedSeries, signalTone } from "@/lib/admin-signal";
import { useAdminLiveSessions } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";

export const Route = createFileRoute("/admin/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const [mode, setMode] = useState<"table" | "timeline" | "heatmap">("table");
  const sessionsQ = useAdminLiveSessions();
  const liveSessions = sessionsQ.data ?? [];
  return (
    <AsyncBoundary isLoading={sessionsQ.isLoading} error={sessionsQ.error as Error | null}>
      <div className="space-y-6">
        <header className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
              Identity ops · sessions
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Authentication sessions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              3,210 active · 47 challenges issued today · 99.6% success
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] p-1 flex gap-1 text-xs">
            {(["table", "timeline", "heatmap"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg capitalize ${mode === m ? "bg-white/[0.08] text-foreground" : "text-muted-foreground"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <MetricCell label="Online" value={3210} delta={+82} signal="ok" series={seedSeries(11)} />
          <MetricCell
            label="Avg confidence"
            value={98.6}
            suffix="%"
            delta={-0.3}
            signal="watch"
            series={seedSeries(12)}
          />
          <MetricCell
            label="Challenges"
            value={47}
            delta={-12}
            signal="ok"
            series={seedSeries(13)}
          />
          <MetricCell label="Failures" value={4} delta={-1} signal="ok" series={seedSeries(14)} />
        </div>

        {mode === "table" && (
          <OpsTable
            rows={liveSessions}
            rowKey={(r) => r.id}
            columns={[
              {
                key: "user",
                label: "User",
                width: "1.4fr",
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-white/[0.06] border border-white/10 text-[10px] flex items-center justify-center font-mono">
                      {r.initials}
                    </div>
                    <span className="truncate">{r.user}</span>
                  </div>
                ),
              },
              {
                key: "device",
                label: "Device",
                width: "1.2fr",
                render: (r) => (
                  <span className="text-xs text-muted-foreground truncate">{r.device}</span>
                ),
              },
              {
                key: "page",
                label: "Page",
                width: "1fr",
                render: (r) => (
                  <span className="font-mono text-xs text-muted-foreground">{r.page}</span>
                ),
              },
              {
                key: "conf",
                label: "Conf",
                width: "0.7fr",
                render: (r) => (
                  <span data-numeric className="text-xs">
                    {(r.confidence * 100).toFixed(1)}%
                  </span>
                ),
              },
              {
                key: "risk",
                label: "Risk",
                width: "0.7fr",
                render: (r) => (
                  <span className="flex items-center gap-1.5">
                    <SignalDot signal={r.signal} pulse={false} size={6} />
                    <span data-numeric className={`text-xs ${signalTone[r.signal].fg}`}>
                      {r.risk.toFixed(2)}
                    </span>
                  </span>
                ),
              },
              {
                key: "stab",
                label: "Behavior",
                width: "0.7fr",
                render: (r) => (
                  <span data-numeric className="text-xs">
                    {r.behavior.toFixed(2)}
                  </span>
                ),
              },
              {
                key: "dur",
                label: "Duration",
                width: "0.7fr",
                render: (r) => (
                  <span className="font-mono text-xs text-muted-foreground">{r.duration}</span>
                ),
              },
              {
                key: "last",
                label: "Last event",
                width: "0.8fr",
                align: "right",
                render: (r) => (
                  <span className="font-mono text-[11px] text-muted-foreground">{r.lastEvent}</span>
                ),
              },
            ]}
          />
        )}

        {mode === "timeline" && (
          <InstrumentPanel eyebrow="24h ribbon" title="Sessions over time">
            <div className="space-y-2">
              {liveSessions.slice(0, 10).map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-32 text-xs truncate">{s.user}</div>
                  <div className="flex-1 h-6 rounded-md bg-white/[0.03] relative overflow-hidden">
                    <div
                      className="absolute h-full rounded-md"
                      style={{
                        left: `${Math.random() * 40}%`,
                        width: `${20 + Math.random() * 40}%`,
                        background:
                          signalTone[s.signal].bg === "bg-emerald-500/10"
                            ? "linear-gradient(90deg,#34d39966,#34d39933)"
                            : "linear-gradient(90deg,#fb718566,#fb718533)",
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground w-14 text-right">
                    {(s.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </InstrumentPanel>
        )}

        {mode === "heatmap" && (
          <InstrumentPanel eyebrow="Weekly · cell = mean confidence" title="Session heatmap">
            <HeatGrid data={seedHeat(55)} />
          </InstrumentPanel>
        )}
      </div>
    </AsyncBoundary>
  );
}
