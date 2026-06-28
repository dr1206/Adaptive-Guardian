import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { OpsTable } from "@/components/admin/ops-table";
import { MetricCell } from "@/components/admin/metric-cell";
import { challenges, challengeReasons, seedSeries } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/challenges")({
  component: ChallengesPage,
});

function ChallengesPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Identity ops · challenges</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Challenge center</h1>
        <p className="text-sm text-muted-foreground mt-1">Every step-up authentication, with outcome and reason taxonomy</p>
      </header>

      <div className="grid grid-cols-4 gap-3">
        <MetricCell label="Issued today" value={1010} delta={-42} signal="ok" series={seedSeries(21)} />
        <MetricCell label="Pass rate" value={94.2} suffix="%" delta={+1.1} signal="ok" series={seedSeries(22)} />
        <MetricCell label="Avg duration" value={18} suffix="" delta={-2} signal="ok" series={seedSeries(23)} />
        <MetricCell label="Failed" value={47} delta={-8} signal="ok" series={seedSeries(24)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <InstrumentPanel eyebrow="Recent" title="Challenge ledger">
            <OpsTable
              rows={challenges}
              rowKey={(r) => r.id}
              density="compact"
              columns={[
                { key: "id", label: "ID", width: "0.8fr", render: (r) => <span className="font-mono text-[11px] text-muted-foreground">{r.id}</span> },
                { key: "user", label: "User", width: "1.2fr", render: (r) => <span className="text-xs truncate">{r.user}</span> },
                { key: "reason", label: "Reason", width: "1.2fr", render: (r) => <span className="text-xs text-muted-foreground">{r.reason}</span> },
                { key: "conf", label: "Conf", width: "0.6fr", render: (r) => <span data-numeric className="text-xs">{(r.confidence*100).toFixed(1)}%</span> },
                { key: "out", label: "Outcome", width: "0.7fr", render: (r) => {
                  const m: Record<string,string> = { passed: "text-emerald-300 bg-emerald-500/10", failed: "text-rose-300 bg-rose-500/10", abandoned: "text-amber-300 bg-amber-500/10" };
                  return <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${m[r.outcome]}`}>{r.outcome}</span>;
                }},
                { key: "dur", label: "Dur", width: "0.5fr", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.duration}</span> },
                { key: "when", label: "When", width: "0.7fr", align: "right", render: (r) => <span className="font-mono text-[11px] text-muted-foreground">{r.when}</span> },
              ]}
            />
          </InstrumentPanel>
        </div>

        <InstrumentPanel eyebrow="Why challenges fire" title="Reason taxonomy">
          <div className="space-y-3">
            {challengeReasons.map((r) => (
              <div key={r.reason}>
                <div className="flex items-center justify-between text-xs">
                  <span>{r.reason}</span>
                  <span data-numeric className="text-muted-foreground">{r.count}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full gradient-cyber" style={{ width: `${r.rate * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </InstrumentPanel>
      </div>
    </div>
  );
}
