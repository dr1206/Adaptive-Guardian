import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Printer, Share2, Loader2, Check } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { useStatement, useStatementYears } from "@/services/hooks";
import { services } from "@/services/registry";
import { combineAsyncStates } from "@/lib/async-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/statements")({
  component: StatementsPage,
});

function StatementsPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5); // Jun
  const [isDownloading, setIsDownloading] = useState(false);

  const yearsQ = useStatementYears();
  const statementQ = useStatement({ year, month });
  const years = yearsQ.data ?? [];
  const sample = statementQ.data;
  const state = combineAsyncStates(yearsQ, statementQ);

  const handleDownloadCsv = async () => {
    try {
      setIsDownloading(true);
      const blob = await services.banking.exportStatementCsv(year, month);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statement_${year}_${String(month + 1).padStart(2, "0")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Statement exported successfully as CSV");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to export statement");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Bank Statement - ${year}`,
          text: `Official Bank Statement for ${year}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Statement reference URL copied to clipboard");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Statements"
        subtitle="Certified monthly banking statements and ledger audit trails."
      />
      <AsyncBoundary state={state} variant="dashboard">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4">
            {years.map((y) => (
              <details
                key={y.year}
                open={y.year === year}
                className="group rounded-2xl border border-border bg-card p-3 shadow-xs"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-[12px] font-semibold text-foreground">
                  <span className="font-numeric">{y.year}</span>
                  <span className="text-muted-foreground">{y.count} statements</span>
                </summary>
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {y.months.map((m) => (
                    <button
                      key={`${m.year}-${m.month}`}
                      onClick={() => {
                        setYear(m.year);
                        setMonth(m.month);
                      }}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-[10px] font-medium transition-colors",
                        year === m.year && month === m.month
                          ? "border-primary bg-primary/10 font-bold text-primary"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </aside>

          {sample && (
            <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
              <header className="flex items-center justify-between border-b border-border px-5 py-3 bg-muted/20">
                <h3 className="font-display text-[14px] font-semibold text-foreground">
                  {years.find((y) => y.year === year)?.months[month]?.label ?? ""} {year} · Primary
                  Savings Account
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    disabled={isDownloading}
                    onClick={handleDownloadCsv}
                    title="Export CSV"
                    className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={handlePrint}
                    title="Print Statement"
                    className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleShare}
                    title="Share Statement Link"
                    className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </header>
              <div className="bg-background p-8 text-foreground print:bg-white print:text-black">
                <div className="mx-auto max-w-[640px]">
                  <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">
                        AdaptiveGuard Bank · India
                      </div>
                      <div className="mt-1 font-display text-[20px] font-bold text-foreground">
                        Official Monthly Account Statement
                      </div>
                    </div>
                    <div className="text-right text-[11px]">
                      <div className="font-semibold text-foreground">{sample.accountHolder}</div>
                      <div className="font-mono text-muted-foreground">{sample.iban}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-[12px]">
                    <Cell k="Opening balance" v={sample.openingBalance} />
                    <Cell k="Inflows" v={sample.inflows} />
                    <Cell k="Outflows" v={sample.outflows} />
                    <Cell k="Closing balance" v={sample.closingBalance} />
                    <Cell k="Net Movement" v={sample.net} />
                    <Cell k="Transactions" v={String(sample.transactions)} />
                  </div>
                  <div className="mt-6 border-t border-border pt-4 text-[11px]">
                    <h4 className="mb-2 font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Selected transactions & ledger entries
                    </h4>
                    <ul className="divide-y divide-border">
                      {sample.selected.map((line) => (
                        <li
                          key={`${line.date}-${line.name}`}
                          className="flex justify-between py-2 text-[12px]"
                        >
                          <div>
                            <span className="font-mono text-muted-foreground">{line.date}</span> ·{" "}
                            <span className="font-medium text-foreground">{line.name}</span>
                          </div>
                          <span className="font-numeric font-semibold text-foreground">
                            {line.amount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>
      </AsyncBoundary>
    </div>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
      <div className="text-[9px] uppercase font-bold tracking-[0.18em] text-muted-foreground">
        {k}
      </div>
      <div className="mt-0.5 font-numeric text-[14px] font-bold text-foreground">{v}</div>
    </div>
  );
}
