import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { fmt } from "@/lib/banking-data";

export const Route = createFileRoute("/app/budgets")({
  component: BudgetsPage,
});

const ENVELOPES = [
  { name: "Food", spent: 412, budget: 600, color: "oklch(0.71 0.155 165)" },
  { name: "Transport", spent: 184, budget: 250, color: "oklch(0.715 0.135 215)" },
  { name: "Subscriptions", spent: 102, budget: 120, color: "oklch(0.635 0.215 295)" },
  { name: "Shopping", spent: 612, budget: 500, color: "oklch(0.78 0.155 75)" },
  { name: "Bills", spent: 226, budget: 400, color: "oklch(0.655 0.195 258)" },
  { name: "Health", spent: 27, budget: 200, color: "oklch(0.71 0.155 165)" },
  { name: "Entertainment", spent: 88, budget: 150, color: "oklch(0.635 0.215 295)" },
  { name: "Travel", spent: 1284, budget: 1500, color: "oklch(0.715 0.135 215)" },
];

function BudgetsPage() {
  const totalBudget = ENVELOPES.reduce((s, e) => s + e.budget, 0);
  const totalSpent = ENVELOPES.reduce((s, e) => s + e.spent, 0);
  return (
    <div>
      <PageHeader eyebrow="Grow" title="Budgets" subtitle="Envelopes for each category, every month." />
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <KPI k="Total budget" v={fmt(totalBudget)} />
        <KPI k="Total spent" v={fmt(totalSpent)} />
        <KPI k="Pace" v="On track" tone="success" />
        <KPI k="Days left" v="3" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ENVELOPES.map((e) => {
          const pct = Math.min(100, (e.spent / e.budget) * 100);
          const over = e.spent > e.budget;
          return (
            <article key={e.name} className="rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-5">
              <header className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-[14px] font-semibold">{e.name}</h3>
                <span className={`text-[11px] ${over ? "text-warning" : "text-muted-foreground"}`}>
                  {over ? "over" : `${Math.round(pct)}%`}
                </span>
              </header>
              <div className="font-numeric text-[20px] font-semibold">{fmt(e.spent)}</div>
              <div className="text-[11px] text-muted-foreground">of {fmt(e.budget)}</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: over ? "oklch(0.78 0.155 75)" : e.color }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function KPI({ k, v, tone }: { k: string; v: string; tone?: "success" }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k}</div>
      <div className={`mt-1 font-numeric text-[18px] font-semibold ${tone === "success" ? "text-success" : ""}`}>{v}</div>
    </div>
  );
}
