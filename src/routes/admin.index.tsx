import { createFileRoute, Link } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { MetricCell } from "@/components/admin/metric-cell";
import { RiverChart } from "@/components/admin/river-chart";
import { PipelineFlow } from "@/components/admin/pipeline-flow";
import { LiveTape } from "@/components/admin/live-tape";
import { SignalDot } from "@/components/admin/signal-dot";
import { seedSeries, signalTone } from "@/lib/admin-signal";
import { useAdminIncidents, useAdminKpis, useAdminLiveSessions } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { AlertOctagon, ChevronRight, Cpu, MemoryStick, HardDrive, Activity } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: PulsePage,
});

function PulsePage() {
  const kpisQ = useAdminKpis();
  const sessionsQ = useAdminLiveSessions();
  const incidentsQ = useAdminIncidents();
  const kpis = kpisQ.data ?? [];
  const liveSessions = sessionsQ.data ?? [];
  const incidents = incidentsQ.data ?? [];

  const river = seedSeries(901, 96, 0.86, 0.99, 0.7);
  const pins = [
    { at: 18, severity: "watch" as const },
    { at: 42, severity: "alert" as const },
    { at: 71, severity: "critical" as const },
    { at: 88, severity: "ok" as const },
  ];

  return (
    <AsyncBoundary
      isLoading={kpisQ.isLoading || sessionsQ.isLoading || incidentsQ.isLoading}
      error={(kpisQ.error ?? sessionsQ.error ?? incidentsQ.error) as Error | null}
    >
      <div className="space-y-6">
        {/* Hero */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
              Today's overview · Sun 28 Jun
            </div>
            <h1 className="text-3xl font-semibold mt-1 tracking-tight">Cockpit</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Behavioral biometrics in production · 124,891 enrolled users · model v2.4.1
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            aegis online · 1.24k predictions/s
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <MetricCell
              key={k.id}
              label={k.label}
              value={k.value}
              suffix={k.suffix}
              delta={k.delta}
              signal={k.signal}
              series={k.series}
            />
          ))}
        </div>

        {/* Confidence river */}
        <InstrumentPanel
          eyebrow="Continuous authentication · 24h"
          title="Confidence River"
          actions={
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
              <span>min 0.86</span>
              <span>·</span>
              <span>max 0.99</span>
              <span>·</span>
              <span className="text-emerald-300">stable</span>
            </div>
          }
        >
          <RiverChart series={river} pins={pins} height={180} />
        </InstrumentPanel>

        {/* Live sessions + AI pulse */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <InstrumentPanel
              eyebrow="Right now"
              title="Live sessions"
              actions={
                <Link
                  to="/admin/sessions"
                  className="text-xs text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-0.5"
                >
                  View all
                  <ChevronRight className="size-3" />
                </Link>
              }
            >
              <LiveTape
                columns={[
                  { label: "User", width: "1.6fr" },
                  { label: "Page", width: "1.4fr" },
                  { label: "Conf", width: "0.8fr" },
                  { label: "Risk", width: "0.6fr" },
                  { label: "Activity", width: "1.2fr" },
                  { label: "Last", width: "0.6fr" },
                ]}
                rows={liveSessions.slice(0, 8).map((s) => ({
                  id: s.id,
                  signal: s.signal,
                  cells: [
                    <span className="flex items-center gap-2">
                      <span className="size-6 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[10px] font-mono">
                        {s.initials}
                      </span>
                      <span className="truncate">{s.user}</span>
                    </span>,
                    <span className="font-mono text-xs text-muted-foreground">{s.page}</span>,
                    <span className="flex items-center gap-1.5">
                      <SignalDot signal={s.signal} pulse={false} size={6} />
                      <span data-numeric>{(s.confidence * 100).toFixed(1)}%</span>
                    </span>,
                    <span
                      data-numeric
                      className={s.risk > 0.5 ? "text-rose-300" : "text-muted-foreground"}
                    >
                      {s.risk.toFixed(2)}
                    </span>,
                    <span className="text-xs text-muted-foreground">{s.activity}</span>,
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {s.lastEvent}
                    </span>,
                  ],
                }))}
              />
            </InstrumentPanel>
          </div>

          <InstrumentPanel eyebrow="AI pulse" title="Model engine">
            <div className="flex flex-col items-center text-center py-2">
              <div className="relative size-40 mb-3">
                <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="white"
                    strokeOpacity="0.06"
                    strokeWidth="4"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="oklch(0.71 0.135 215)"
                    strokeWidth="4"
                    strokeDasharray="263.9"
                    strokeDashoffset="2.6"
                    strokeLinecap="round"
                    className="transition-all"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
                    healthy
                  </div>
                  <div data-numeric className="text-3xl font-semibold mt-1">
                    99.2%
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">v2.4.1</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full text-center">
                <div className="rounded-lg border border-white/[0.05] py-2">
                  <div data-numeric className="text-sm font-semibold">
                    1.24k
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">pred/s</div>
                </div>
                <div className="rounded-lg border border-white/[0.05] py-2">
                  <div data-numeric className="text-sm font-semibold">
                    12 ms
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">p50</div>
                </div>
                <div className="rounded-lg border border-white/[0.05] py-2">
                  <div data-numeric className="text-sm font-semibold">
                    38 ms
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">p99</div>
                </div>
              </div>
            </div>
            <Link
              to="/admin/ai/live"
              className="mt-4 block text-center text-xs text-cyan-300 hover:text-cyan-200"
            >
              Open Live AI Monitor →
            </Link>
          </InstrumentPanel>
        </div>

        {/* Decision pipeline */}
        <InstrumentPanel
          eyebrow="Inference pipeline · live"
          title="Decision flow"
          actions={
            <span className="text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              all stages green
            </span>
          }
        >
          <PipelineFlow active={3} />
        </InstrumentPanel>

        {/* Attention lane + system health */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <InstrumentPanel
              eyebrow="Attention lane"
              title="Open incidents"
              actions={
                <Link
                  to="/admin/notifications"
                  className="text-xs text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-0.5"
                >
                  All
                  <ChevronRight className="size-3" />
                </Link>
              }
            >
              <div className="space-y-2">
                {incidents.slice(0, 5).map((i) => {
                  const tone = signalTone[i.severity];
                  return (
                    <div
                      key={i.id}
                      className={`flex items-start gap-3 rounded-xl border border-white/[0.05] p-3 hover:bg-white/[0.03] transition-colors`}
                    >
                      <div
                        className={`size-8 rounded-lg ${tone.bg} flex items-center justify-center shrink-0`}
                      >
                        <AlertOctagon className={`size-4 ${tone.fg}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-muted-foreground">{i.id}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${tone.bg} ${tone.fg} uppercase tracking-wider`}
                          >
                            {tone.label}
                          </span>
                          <span className="text-muted-foreground">{i.source}</span>
                          <span className="text-muted-foreground">· {i.age} ago</span>
                        </div>
                        <div className="text-sm mt-1 truncate">{i.title}</div>
                      </div>
                      <button className="text-[11px] rounded-md border border-white/[0.06] hover:border-cyan-400/40 hover:text-cyan-300 px-2 py-1 transition-colors">
                        Triage
                      </button>
                    </div>
                  );
                })}
              </div>
            </InstrumentPanel>
          </div>

          <div className="lg:col-span-2">
            <InstrumentPanel eyebrow="System health" title="Right now">
              <div className="space-y-3">
                {[
                  { label: "CPU", value: 38, icon: Cpu },
                  { label: "Memory", value: 62, icon: MemoryStick },
                  { label: "Disk", value: 41, icon: HardDrive },
                  { label: "Inference", value: 71, icon: Activity },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Icon className="size-3.5" />
                          {m.label}
                        </span>
                        <span data-numeric>{m.value}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${m.value}%`,
                            background:
                              m.value > 75
                                ? "linear-gradient(90deg,#fb7185,#f43f5e)"
                                : "linear-gradient(90deg,oklch(0.71 0.135 215),oklch(0.655 0.195 258))",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                to="/admin/infra"
                className="mt-4 block text-center text-xs text-cyan-300 hover:text-cyan-200"
              >
                Open infrastructure →
              </Link>
            </InstrumentPanel>
          </div>
        </div>
      </div>
    </AsyncBoundary>
  );
}
