import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { RiskGauge } from "@/components/admin/risk-gauge";
import { HeatGrid } from "@/components/admin/heat-grid";
import { GeoMap } from "@/components/admin/geo-map";
import { MetricCell } from "@/components/admin/metric-cell";
import { RiverChart } from "@/components/admin/river-chart";
import { OpsTable } from "@/components/admin/ops-table";
import { seedHeat, seedSeries, signalTone } from "@/lib/admin-signal";
import { useAdminGeoDots, useAdminUsers } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";

export const Route = createFileRoute("/admin/risk")({
  component: RiskPage,
});

function RiskPage() {
  const usersQ = useAdminUsers();
  const geoQ = useAdminGeoDots();
  const adminUsers = usersQ.data ?? [];
  const geoDots = geoQ.data ?? [];
  const critical = adminUsers.filter((u) => u.risk > 0.5).slice(0, 10);

  return (
    <AsyncBoundary
      isLoading={usersQ.isLoading || geoQ.isLoading}
      error={(usersQ.error ?? geoQ.error) as Error | null}
    >
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Defense · risk center</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Risk center</h1>
        <p className="text-sm text-muted-foreground mt-1">Organization-wide risk index, drift map and high-watermark users</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <InstrumentPanel eyebrow="Org index" title="Current posture" className="xl:col-span-1">
          <div className="flex justify-center"><RiskGauge value={0.34} /></div>
          <p className="text-center text-xs text-muted-foreground mt-3">Slightly elevated · 3 active drivers</p>
        </InstrumentPanel>
        <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCell label="Critical users" value={4} delta={+1} signal="critical" series={seedSeries(51, 32, 0, 0.4)} />
          <MetricCell label="Suspicious sessions" value={28} delta={+6} signal="alert" series={seedSeries(52)} />
          <MetricCell label="Challenge rate" value={1.46} suffix="%" delta={-0.3} signal="ok" series={seedSeries(53)} />
          <MetricCell label="Behavior drift" value={0.018} delta={+0.004} signal="watch" series={seedSeries(54)} />
        </div>
      </div>

      <InstrumentPanel eyebrow="30 days · annotated" title="Risk trend">
        <RiverChart series={seedSeries(61, 96, 0.2, 0.5)} pins={[{ at: 22, severity: "watch" }, { at: 58, severity: "alert" }, { at: 81, severity: "critical" }]} />
      </InstrumentPanel>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <InstrumentPanel eyebrow="Geo · last 5 minutes" title="Live event map">
            <GeoMap dots={[...geoDots]} />
          </InstrumentPanel>
        </div>
        <div className="lg:col-span-2">
          <InstrumentPanel eyebrow="7×24" title="Risk heatmap">
            <HeatGrid data={seedHeat(63)} />
          </InstrumentPanel>
        </div>
      </div>

      <InstrumentPanel eyebrow="Top high-watermark" title="Critical users">
        <OpsTable
          rows={critical}
          rowKey={(r) => r.id}
          density="compact"
          columns={[
            { key: "user", label: "User", width: "1.4fr", render: (r) => <div className="flex items-center gap-2"><div className="size-6 rounded-full bg-white/[0.06] text-[10px] font-mono flex items-center justify-center">{r.initials}</div><span className="text-xs">{r.name}</span></div> },
            { key: "risk", label: "Risk", width: "0.7fr", render: (r) => <span data-numeric className={signalTone[r.signal].fg}>{r.risk.toFixed(2)}</span> },
            { key: "trust", label: "Trust", width: "0.6fr", render: (r) => <span data-numeric>{r.trust.toFixed(2)}</span> },
            { key: "devices", label: "Devices", width: "0.5fr", render: (r) => <span data-numeric>{r.devices}</span> },
            { key: "geo", label: "Geo", width: "0.4fr", render: (r) => <span className="font-mono text-[11px] text-muted-foreground">{r.country}</span> },
            { key: "last", label: "Last", width: "0.7fr", align: "right", render: (r) => <span className="font-mono text-[11px] text-muted-foreground">{r.lastSeen}</span> },
          ]}
        />
      </InstrumentPanel>
    </div>
    </AsyncBoundary>
  );
}
