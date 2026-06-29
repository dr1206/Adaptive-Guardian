import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { useAdminAudit } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { Search, Download, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  component: AuditPage,
});

const classTone: Record<string, string> = {
  admin: "text-cyan-300 bg-cyan-500/10",
  ai: "text-purple-300 bg-purple-500/10",
  auth: "text-emerald-300 bg-emerald-500/10",
  policy: "text-amber-300 bg-amber-500/10",
  data: "text-rose-300 bg-rose-500/10",
};

function AuditPage() {
  const auditQ = useAdminAudit();
  const auditLog = auditQ.data ?? [];
  return (
    <AsyncBoundary isLoading={auditQ.isLoading} error={auditQ.error as Error | null} isEmpty={auditLog.length === 0}>
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Defense · audit logs</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Audit logs</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-300" />
            Immutable · cryptographically chained · 2,481,204 entries this quarter
          </p>
        </div>
        <button className="rounded-xl border border-white/[0.06] hover:border-white/[0.12] px-3 py-2 text-xs inline-flex items-center gap-1.5"><Download className="size-3.5" />Export · signed</button>
      </header>

      <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 max-w-xl">
        <Search className="size-3.5 text-muted-foreground" />
        <input placeholder="Filter: actor:omar action:deploy date:24h …" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
      </div>

      <InstrumentPanel eyebrow="Ledger" title="Last 36 entries">
        <div className="divide-y divide-white/[0.04] -mx-1">
          {auditLog.map((e) => (
            <div key={e.id} className="grid grid-cols-[80px_120px_1fr_1.4fr_1fr_80px_60px] gap-3 px-1 py-2.5 text-xs items-center hover:bg-white/[0.02]">
              <span className="font-mono text-muted-foreground">{e.time}</span>
              <span className="font-mono text-muted-foreground truncate">{e.id}</span>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded w-fit ${classTone[e.class]}`}>{e.class}</span>
              <span className="text-foreground/90 truncate">{e.action}</span>
              <span className="font-mono text-muted-foreground truncate">{e.actor}</span>
              <span className="font-mono text-[10px] text-muted-foreground truncate">{e.target}</span>
              <span className="font-mono text-[10px] text-cyan-300/70" title="chain hash">#{e.hash}</span>
            </div>
          ))}
        </div>
      </InstrumentPanel>
    </div>
    </AsyncBoundary>
  );
}
