import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { signalTone } from "@/lib/admin-signal";
import { useAdminControls } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/compliance")({
  component: CompliancePage,
});

function CompliancePage() {
  const controlsQ = useAdminControls();
  const controls = controlsQ.data ?? [];
  return (
    <AsyncBoundary
      isLoading={controlsQ.isLoading}
      error={controlsQ.error as Error | null}
      isEmpty={controls.length === 0}
    >
      <div className="space-y-6">
        <header>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
            Platform · compliance
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Compliance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise control posture · audit-ready evidence on demand
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {controls.map((c) => {
            const tone = signalTone[c.status];
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-white/[0.06] p-5 bg-[oklch(0.225_0.035_264/0.55)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`size-4 ${tone.fg}`} />
                      <span className="text-base font-semibold">{c.id}</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-mono mt-1 text-muted-foreground">
                      {c.framework}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded ${tone.bg} ${tone.fg}`}
                  >
                    {tone.label}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Coverage</span>
                    <span data-numeric>{c.coverage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-cyber transition-all duration-700"
                      style={{ width: `${c.coverage}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div data-numeric className="text-sm">
                      {c.evidence}
                    </div>
                    <div className="text-[9px] uppercase font-mono text-muted-foreground tracking-wider">
                      evidence
                    </div>
                  </div>
                  <div>
                    <div className="text-sm">{c.owner.split(" ")[0]}</div>
                    <div className="text-[9px] uppercase font-mono text-muted-foreground tracking-wider">
                      owner
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-mono">{c.next}</div>
                    <div className="text-[9px] uppercase font-mono text-muted-foreground tracking-wider">
                      next audit
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <InstrumentPanel eyebrow="Retention" title="Data lifecycle">
            <ul className="space-y-2.5 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Auth logs</span>
                <span data-numeric>90 d</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Behavior windows</span>
                <span data-numeric>365 d</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Transactions</span>
                <span data-numeric>7 y</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Audit chain</span>
                <span data-numeric>10 y</span>
              </li>
            </ul>
          </InstrumentPanel>
          <InstrumentPanel eyebrow="Encryption" title="Posture">
            <ul className="space-y-2.5 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">At rest</span>
                <span className="text-emerald-300">AES-256-GCM</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">In transit</span>
                <span className="text-emerald-300">TLS 1.3</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Keys</span>
                <span className="text-emerald-300">HSM · rotating 90d</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">PII</span>
                <span className="text-emerald-300">tokenized</span>
              </li>
            </ul>
          </InstrumentPanel>
          <InstrumentPanel eyebrow="Privacy" title="DSR queue">
            <ul className="space-y-2.5 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Access requests</span>
                <span data-numeric>4</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Erasure requests</span>
                <span data-numeric>1</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Avg resolution</span>
                <span data-numeric>1.8 d</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Within SLA</span>
                <span className="text-emerald-300">100%</span>
              </li>
            </ul>
          </InstrumentPanel>
        </div>
      </div>
    </AsyncBoundary>
  );
}
