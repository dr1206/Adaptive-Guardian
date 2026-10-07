import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Printer, Bookmark, Highlighter, Share2 } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { useStatement, useStatementYears } from "@/services/hooks";
import { combineAsyncStates } from "@/lib/async-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/statements")({
  component: StatementsPage,
});

function StatementsPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5); // Jun

  const yearsQ = useStatementYears();
  const statementQ = useStatement({ year, month });
  const years = yearsQ.data ?? [];
  const sample = statementQ.data;
  const state = combineAsyncStates(yearsQ, statementQ);

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Statements"
        subtitle="Every month, archived as it was issued."
      />
      <AsyncBoundary state={state} variant="dashboard">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4">
            {years.map((y) => (
              <details
                key={y.year}
                open={y.year === year}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-[12px] font-medium">
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
                        "rounded-lg border border-white/[0.04] px-2 py-2 text-[10px] transition-colors",
                        year === m.year && month === m.month
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "bg-white/[0.02] text-muted-foreground hover:text-foreground",
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
            <article className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025]">
              <header className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
                <h3 className="font-display text-[14px] font-semibold">
                  {years.find((y) => y.year === year)?.months[month]?.label ?? ""} {year} · Primary
                  Account
                </h3>
                <div className="flex items-center gap-1">
                  {[Download, Printer, Share2, Bookmark, Highlighter].map((Icon, i) => (
                    <button
                      key={i}
                      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </header>
              <div className="bg-[oklch(0.98_0.005_247)] p-8 text-[oklch(0.15_0.03_264)]">
                <div className="mx-auto max-w-[640px]">
                  <div className="mb-6 flex items-center justify-between border-b border-black/10 pb-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">
                        AdaptiveGuard AI · EU
                      </div>
                      <div className="mt-1 font-display text-[20px] font-semibold">
                        Monthly Statement
                      </div>
                    </div>
                    <div className="text-right text-[11px]">
                      <div>{sample.accountHolder}</div>
                      <div className="opacity-70">{sample.iban}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-[12px]">
                    <Cell k="Opening balance" v={sample.openingBalance} />
                    <Cell k="Inflows" v={sample.inflows} />
                    <Cell k="Outflows" v={sample.outflows} />
                    <Cell k="Closing balance" v={sample.closingBalance} />
                    <Cell k="Net" v={sample.net} />
                    <Cell k="Transactions" v={String(sample.transactions)} />
                  </div>
                  <div className="mt-6 border-t border-black/10 pt-4 text-[11px]">
                    <h4 className="mb-2 font-semibold">Selected transactions</h4>
                    <ul className="divide-y divide-black/10">
                      {sample.selected.map((line) => (
                        <li
                          key={`${line.date}-${line.name}`}
                          className="flex justify-between py-1.5"
                        >
                          <span>
                            {line.date} · {line.name}
                          </span>
                          <span className="font-numeric">{line.amount}</span>
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
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <div className="text-[9px] uppercase tracking-[0.18em] opacity-60">{k}</div>
      <div className="mt-0.5 font-numeric text-[14px] font-semibold">{v}</div>
    </div>
  );
}
