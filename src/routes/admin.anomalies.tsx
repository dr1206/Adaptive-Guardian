import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { signalTone } from "@/lib/admin-signal";
import { useAdminAnomalySignatures, useAdminIncidents } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { AlertOctagon } from "lucide-react";

export const Route = createFileRoute("/admin/anomalies")({
  component: AnomaliesPage,
});

function AnomaliesPage() {
  const sigsQ = useAdminAnomalySignatures();
  const incidentsQ = useAdminIncidents();
  const signatures = sigsQ.data ?? [];
  const incidents = incidentsQ.data ?? [];
  return (
    <AsyncBoundary
      isLoading={sigsQ.isLoading || incidentsQ.isLoading}
      error={(sigsQ.error ?? incidentsQ.error) as Error | null}
    >
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Defense · anomalies</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Anomaly detection</h1>
        <p className="text-sm text-muted-foreground mt-1">Grouped by signature · triage, suppress or convert to rule</p>
      </header>

      <InstrumentPanel eyebrow="Signatures · last 24h" title="Detected anomalies">
        <div className="space-y-2">
          {signatures.map((s) => {
            const tone = signalTone[s.severity];
            return (
              <div key={s.name} className="rounded-xl border border-white/[0.05] p-3 flex items-center gap-3 hover:bg-white/[0.03]">
                <div className={`size-9 rounded-lg ${tone.bg} flex items-center justify-center`}><AlertOctagon className={`size-4 ${tone.fg}`} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{s.count} events · last {s.last}</div>
                </div>
                <div className="flex gap-1.5">
                  <button className="rounded-md border border-white/[0.06] hover:border-white/[0.12] px-2.5 py-1 text-[11px]">Acknowledge</button>
                  <button className="rounded-md border border-white/[0.06] hover:border-white/[0.12] px-2.5 py-1 text-[11px]">Escalate</button>
                  <button className="rounded-md border border-cyan-400/30 hover:bg-cyan-500/10 text-cyan-300 px-2.5 py-1 text-[11px]">Make rule</button>
                </div>
              </div>
            );
          })}
        </div>
      </InstrumentPanel>

      <InstrumentPanel eyebrow="Recent" title="Incident feed">
        <div className="space-y-2">
          {incidents.map((i) => {
            const tone = signalTone[i.severity];
            return (
              <div key={i.id} className="flex items-start gap-3 rounded-xl border border-white/[0.05] p-3">
                <div className="size-2 rounded-full mt-2" style={{ background: tone.fg.includes("emerald") ? "#34d399" : tone.fg.includes("amber") ? "#fbbf24" : tone.fg.includes("rose") ? "#fb7185" : "#e879f9" }} />
                <div className="flex-1">
                  <div className="text-[10px] font-mono text-muted-foreground">{i.id} · {i.source} · {i.age} ago</div>
                  <div className="text-sm mt-0.5">{i.title}</div>
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${tone.bg} ${tone.fg}`}>{i.status}</span>
              </div>
            );
          })}
        </div>
      </InstrumentPanel>
    </div>
    </AsyncBoundary>
  );
}
