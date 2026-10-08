import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { useAdminReportTemplates } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { FileText, Download, Printer, Plus, Calendar, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const templatesQ = useAdminReportTemplates();
  const reportTemplates = templatesQ.data ?? [];
  return (
    <AsyncBoundary
      isLoading={templatesQ.isLoading}
      error={templatesQ.error as Error | null}
      isEmpty={reportTemplates.length === 0}
    >
      <div className="space-y-6">
        <header className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
              Platform · reports
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Scheduled briefings · authentication, risk, behavior, AI, compliance
            </p>
          </div>
          <button
            onClick={() =>
              toast.info("Report builder", {
                description: "Select a template above, configure parameters, and schedule delivery",
              })
            }
            className="rounded-xl gradient-primary px-3 py-2 text-xs inline-flex items-center gap-1.5 shadow-glow"
          >
            <Plus className="size-3.5" />
            New report
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {reportTemplates.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border border-white/[0.06] p-4 bg-[oklch(0.225_0.035_264/0.55)] hover-lift"
            >
              <div className="flex items-start justify-between mb-3">
                <FileText className="size-4 text-cyan-300" />
                <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                  {r.cadence}
                </span>
              </div>
              <div className="text-sm font-semibold">{r.name}</div>
              <div className="text-[11px] font-mono text-muted-foreground mt-1">
                owner · {r.owner}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1">
                <Calendar className="size-3" />
                last {r.last}
              </div>
              <div className="mt-3 text-[11px] font-mono text-muted-foreground">{r.format}</div>
              <div className="mt-4 flex gap-1.5">
                <button
                  onClick={() => {
                    toast.loading("Generating PDF...");
                    setTimeout(() => {
                      toast.dismiss();
                      toast.success(`${r.name} PDF ready`, {
                        description: "Check your downloads folder",
                      });
                      window.print();
                    }, 800);
                  }}
                  className="flex-1 rounded-lg border border-white/[0.06] hover:border-white/[0.12] py-1.5 text-[11px] inline-flex items-center justify-center gap-1"
                >
                  <Download className="size-3" />
                  PDF
                </button>
                <button
                  onClick={() =>
                    toast.success(`${r.name} XLSX export queued`, {
                      description: "Report will be sent to your registered email",
                    })
                  }
                  className="flex-1 rounded-lg border border-white/[0.06] hover:border-white/[0.12] py-1.5 text-[11px] inline-flex items-center justify-center gap-1"
                >
                  <FileSpreadsheet className="size-3" />
                  XLSX
                </button>
                <button
                  onClick={() => window.print()}
                  className="size-7 rounded-lg border border-white/[0.06] hover:border-white/[0.12] inline-flex items-center justify-center"
                >
                  <Printer className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <InstrumentPanel eyebrow="Preview" title="Daily Security Brief · today">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 max-w-3xl mx-auto">
            <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
              AdaptiveGuard · Aurora Bank · Daily Brief
            </div>
            <h2 className="text-xl font-semibold mt-2">Security posture — Sun 28 Jun 2026</h2>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Platform held a healthy posture today. 12,847 active users, 3,210 concurrent sessions,
              99.6% authentication success. Three open incidents: one critical (behavior drift,
              eu-west) under triage. Model v2.4.1 steady at 99.2% accuracy. Candidate v2.4.2-rc
              cleared evaluation; awaiting deployment approval.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.05]">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                  Auth success
                </div>
                <div data-numeric className="text-lg mt-1">
                  99.6%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                  Challenges
                </div>
                <div data-numeric className="text-lg mt-1">
                  47
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                  Fraud prevented
                </div>
                <div data-numeric className="text-lg mt-1">
                  $214k
                </div>
              </div>
            </div>
          </div>
        </InstrumentPanel>
      </div>
    </AsyncBoundary>
  );
}
