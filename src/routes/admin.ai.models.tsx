import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { useAdminModels } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { Cpu, GitCompare, History, Play, RotateCcw, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/ai/models")({
  component: ModelsPage,
});

function ModelsPage() {
  const modelsQ = useAdminModels();
  const models = modelsQ.data ?? [];
  return (
    <AsyncBoundary
      isLoading={modelsQ.isLoading}
      error={modelsQ.error as Error | null}
      isEmpty={models.length === 0}
    >
      <div className="space-y-6">
        <header className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
              AI core · models
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Model management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Versioned, evaluated, deployed under 2-person approval
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                toast.info("Model history", {
                  description: "Viewing version history for all deployed models",
                })
              }
              className="rounded-xl border border-white/[0.06] hover:border-white/[0.12] px-3 py-2 text-xs inline-flex items-center gap-1.5"
            >
              <History className="size-3.5" />
              History
            </button>
            <button
              onClick={() =>
                toast.info("Model comparison", {
                  description: "Select two model versions to compare metrics side by side",
                })
              }
              className="rounded-xl border border-white/[0.06] hover:border-white/[0.12] px-3 py-2 text-xs inline-flex items-center gap-1.5"
            >
              <GitCompare className="size-3.5" />
              Compare
            </button>
            <button
              onClick={() => {
                toast.loading("Initiating retraining pipeline...");
                setTimeout(() => {
                  toast.dismiss();
                  toast.success("Retraining job queued", {
                    description: "Estimated completion: 45 minutes. You will be notified.",
                  });
                }, 1500);
              }}
              className="rounded-xl gradient-primary px-3 py-2 text-xs inline-flex items-center gap-1.5 shadow-glow"
            >
              <Upload className="size-3.5" />
              Retrain
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {models.map((m) => {
            const isActive = m.status === "active";
            const isCandidate = m.status === "candidate";
            return (
              <div
                key={m.version}
                className={`relative rounded-2xl border p-5 ${isActive ? "border-emerald-400/30 bg-emerald-500/[0.04]" : isCandidate ? "border-cyan-400/30 bg-cyan-500/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Cpu
                        className={`size-4 ${isActive ? "text-emerald-300" : isCandidate ? "text-cyan-300" : "text-muted-foreground"}`}
                      />
                      <span className="text-base font-semibold">{m.version}</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-mono mt-1 text-muted-foreground">
                      {m.status} · trained {m.trained}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded ${isActive ? "bg-emerald-500/10 text-emerald-300" : isCandidate ? "bg-cyan-500/10 text-cyan-300" : "bg-white/[0.04] text-muted-foreground"}`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {(
                    [
                      ["acc", m.accuracy],
                      ["prec", m.precision],
                      ["rec", m.recall],
                      ["F1", m.f1],
                    ] as const
                  ).map(([l, v]) => (
                    <div key={l} className="rounded-lg border border-white/[0.05] py-2 text-center">
                      <div data-numeric className="text-sm font-semibold">
                        {(v * 100).toFixed(1)}%
                      </div>
                      <div className="text-[9px] uppercase font-mono text-muted-foreground tracking-wider mt-0.5">
                        {l}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-3">
                  <span>dataset {m.dataset}</span>
                  <span>
                    {m.latencyMs} ms · {m.memoryMb} MB
                  </span>
                </div>

                <div className="flex gap-1.5">
                  {isCandidate && (
                    <button
                      onClick={() => {
                        toast.loading("Deploying model...");
                        setTimeout(() => {
                          toast.dismiss();
                          toast.success(`Model ${m.version} deployed`, {
                            description: "Traffic routing updated. Previous version archived.",
                          });
                        }, 2000);
                      }}
                      className="flex-1 rounded-lg gradient-primary py-1.5 text-xs inline-flex items-center justify-center gap-1 shadow-glow"
                    >
                      <Play className="size-3" />
                      Deploy
                    </button>
                  )}
                  {isActive && (
                    <button
                      onClick={() =>
                        toast.warning("Rollback initiated", {
                          description:
                            "Rolling back to previous stable version. Active sessions maintained.",
                        })
                      }
                      className="flex-1 rounded-lg border border-white/[0.08] hover:border-white/[0.15] py-1.5 text-xs inline-flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="size-3" />
                      Rollback
                    </button>
                  )}
                  <button
                    onClick={() => {
                      toast.loading("Running evaluation suite...");
                      setTimeout(() => {
                        toast.dismiss();
                        toast.success("Evaluation complete", {
                          description: `Accuracy: ${(m.accuracy * 100).toFixed(1)}% · F1: ${(m.f1 * 100).toFixed(1)}%`,
                        });
                      }, 2000);
                    }}
                    className="flex-1 rounded-lg border border-white/[0.08] hover:border-white/[0.15] py-1.5 text-xs"
                  >
                    Evaluate
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <InstrumentPanel eyebrow="Approval gate" title="Pending deployments">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04] p-4 flex items-center gap-4">
            <Cpu className="size-5 text-cyan-300" />
            <div className="flex-1">
              <div className="text-sm font-medium">v2.4.2-rc · ready to deploy</div>
              <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                +0.2pp F1 · awaiting 1 of 2 approvals · requested by ai@adaptiveguard
              </div>
            </div>
            <button
              onClick={() =>
                toast.info("Review requested", { description: "Opening diff view for v2.4.2-rc" })
              }
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs hover:border-white/[0.15]"
            >
              Review
            </button>
            <button
              onClick={() =>
                toast.success("Approval recorded", {
                  description: "1 of 2 approvals received. Awaiting second approver.",
                })
              }
              className="rounded-lg gradient-primary px-3 py-1.5 text-xs shadow-glow"
            >
              Approve
            </button>
          </div>
        </InstrumentPanel>
      </div>
    </AsyncBoundary>
  );
}
