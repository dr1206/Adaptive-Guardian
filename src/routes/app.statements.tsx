import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Printer, Bookmark, Highlighter, Share2 } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/statements")({
  component: StatementsPage,
});

const YEARS = [2026, 2025, 2024];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function StatementsPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5); // Jun

  return (
    <div>
      <PageHeader eyebrow="Money" title="Statements" subtitle="Every month, archived as it was issued." />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          {YEARS.map((y) => (
            <details key={y} open={y === year} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[12px] font-medium">
                <span className="font-numeric">{y}</span>
                <span className="text-muted-foreground">12 statements</span>
              </summary>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => {
                      setYear(y);
                      setMonth(i);
                    }}
                    className={cn(
                      "rounded-lg border border-white/[0.04] px-2 py-2 text-[10px] transition-colors",
                      year === y && month === i ? "border-accent/40 bg-accent/10 text-accent" : "bg-white/[0.02] text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </details>
          ))}
        </aside>

        <article className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025]">
          <header className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
            <h3 className="font-display text-[14px] font-semibold">{MONTHS[month]} {year} · Primary Account</h3>
            <div className="flex items-center gap-1">
              {[Download, Printer, Share2, Bookmark, Highlighter].map((Icon, i) => (
                <button key={i} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.04] hover:text-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </header>
          <div className="bg-[oklch(0.98_0.005_247)] p-8 text-[oklch(0.15_0.03_264)]">
            <div className="mx-auto max-w-[640px]">
              <div className="mb-6 flex items-center justify-between border-b border-black/10 pb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">AdaptiveGuard AI · EU</div>
                  <div className="mt-1 font-display text-[20px] font-semibold">Monthly Statement</div>
                </div>
                <div className="text-right text-[11px]">
                  <div>Amal Kareem</div>
                  <div className="opacity-70">PT50 0033 0000 4523 9876 3491 5</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-[12px]">
                <Cell k="Opening balance" v="€ 243,481.74" />
                <Cell k="Inflows" v="€ 14,230.00" />
                <Cell k="Outflows" v="€ 9,184.32" />
                <Cell k="Closing balance" v="€ 248,527.42" />
                <Cell k="Net" v="€ 5,045.68" />
                <Cell k="Transactions" v="48" />
              </div>
              <div className="mt-6 border-t border-black/10 pt-4 text-[11px]">
                <h4 className="mb-2 font-semibold">Selected transactions</h4>
                <ul className="divide-y divide-black/10">
                  {[
                    ["28 Jun", "Wolt · Food", "− €18.40"],
                    ["27 Jun", "FNAC · Shopping", "− €84.00"],
                    ["26 Jun", "Marta Silva · Rent", "− €1,250.00"],
                    ["22 Jun", "A. Mehta · Inbound", "+ €2,400.00"],
                    ["01 Jun", "Banco Atlântico · Salary", "+ €6,400.00"],
                  ].map(([d, n, a]) => (
                    <li key={n} className="flex justify-between py-1.5">
                      <span>{d} · {n}</span>
                      <span className="font-numeric">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </article>
      </div>
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
