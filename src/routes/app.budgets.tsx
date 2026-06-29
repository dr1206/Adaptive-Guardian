import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { useBudgets } from "@/services/hooks";
import { asyncStateFromQuery } from "@/lib/async-state";
import { fmt } from "@/lib/format";

export const Route = createFileRoute("/app/budgets")({
  component: BudgetsPage,
});

function BudgetsPage() {
  const budgetsQ = useBudgets();
  const envelopes = budgetsQ.data ?? [];
  const state = asyncStateFromQuery(budgetsQ, (d) => d.length === 0);
  const totalBudget = envelopes.reduce((s, e) => s + e.budget, 0);
  const totalSpent = envelopes.reduce((s, e) => s + e.spent, 0);
  return (
    <div>
      <PageHeader
        eyebrow="Grow"
        title="Budgets"
        subtitle="Envelopes for each category, every month."
      />
      <AsyncBoundary state={state} variant="cards" emptyLabel="No budgets configured.">
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <KPI k="Total budget" v={fmt(totalBudget)} />
          <KPI k="Total spent" v={fmt(totalSpent)} />
          <KPI k="Pace" v="On track" tone="success" />
          <KPI k="Days left" v="3" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {envelopes.map((e) => {
            const pct = Math.min(100, (e.spent / e.budget) * 100);
            const over = e.spent > e.budget;
            return (
              <article
                key={e.id}
                className="rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-5"
              >
                <header className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-[14px] font-semibold">{e.name}</h3>
                  <span
                    className={`text-[11px] ${over ? "text-warning" : "text-muted-foreground"}`}
                  >
                    {over ? "over" : `${Math.round(pct)}%`}
                  </span>
                </header>
                <div className="font-numeric text-[20px] font-semibold">{fmt(e.spent)}</div>
                <div className="text-[11px] text-muted-foreground">of {fmt(e.budget)}</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: over ? "oklch(0.78 0.155 75)" : e.color,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </AsyncBoundary>
    </div>
  );
}

function KPI({ k, v, tone }: { k: string; v: string; tone?: "success" }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k}</div>
      <div
        className={`mt-1 font-numeric text-[18px] font-semibold ${tone === "success" ? "text-success" : ""}`}
      >
        {v}
      </div>
    </div>
  );
}
