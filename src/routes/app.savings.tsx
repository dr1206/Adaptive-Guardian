import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import { useSavingsGoals } from "@/services/hooks";
import type { SavingsGoal } from "@/services/banking/banking.contract";

export const Route = createFileRoute("/app/savings")({
  component: SavingsPage,
});

function SavingsPage() {
  const { data: goals, isLoading, error } = useSavingsGoals();
  return (
    <div>
      <PageHeader
        eyebrow="Grow"
        title="Savings goals"
        subtitle="Name your future. Watch it arrive."
        actions={
          <button className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent/25 to-purple/20 px-3 text-[12px] font-medium text-accent">
            <Plus className="h-3.5 w-3.5" /> Create goal
          </button>
        }
      />
      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={!goals || goals.length === 0}
        emptyLabel="No savings goals yet."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(goals ?? []).map((g) => <GoalCard key={g.id} g={g} />)}
        </div>
      </AsyncBoundary>
    </div>
  );
}


function GoalCard({ g }: { g: SavingsGoal }) {
  const pct = (g.saved / g.target) * 100;
  const r = 46;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const color = g.category === "Travel" ? "oklch(0.635 0.215 295)" : g.category === "Emergency" ? "oklch(0.715 0.135 215)" : g.category === "Home" ? "oklch(0.78 0.155 75)" : "oklch(0.71 0.155 165)";

  return (
    <article className="group rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-5 transition-all hover:-translate-y-1 hover:border-accent/30">
      <header className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <span>{g.category}</span>
        <span className="text-[14px]">{g.icon}</span>
      </header>
      <h3 className="font-display text-[18px] font-semibold tracking-tight">{g.name}</h3>

      <div className="my-5 grid place-items-center">
        <div className="relative grid h-32 w-32 place-items-center">
          <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
            <circle cx="60" cy="60" r={r} stroke="oklch(1 0 0 / 0.06)" strokeWidth="6" fill="none" />
            <circle cx="60" cy="60" r={r} stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
          </svg>
          <div className="text-center">
            <div className="font-numeric text-[24px] font-semibold">{pct.toFixed(0)}%</div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">complete</div>
          </div>
        </div>
      </div>

      <div className="text-center text-[12px] text-muted-foreground">
        <span className="font-numeric text-foreground">{fmt(g.saved)}</span> of <span className="font-numeric">{fmt(g.target)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-3 text-[11px]">
        <span><span className="text-muted-foreground">ETA</span> {g.eta}</span>
        <span><span className="text-muted-foreground">/mo</span> <span className="font-numeric">{fmt(g.monthly, "€", 0)}</span></span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button className="flex-1 rounded-lg bg-gradient-to-r from-accent/20 to-purple/15 py-1.5 text-[11px] font-medium text-accent">Add funds</button>
        <button className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-[11px] text-muted-foreground">History</button>
      </div>
    </article>
  );
}
