import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { useBudgets, useCreateBudget, useDeleteBudget } from "@/services/hooks";
import { asyncStateFromQuery } from "@/lib/async-state";
import { fmt } from "@/lib/format";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/budgets")({
  component: BudgetsPage,
});

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
];

function BudgetsPage() {
  const budgetsQ = useBudgets();
  const createMutation = useCreateBudget();
  const deleteMutation = useDeleteBudget();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const envelopes = budgetsQ.data ?? [];
  const state = asyncStateFromQuery(budgetsQ, (d) => d.length === 0);
  const totalBudget = envelopes.reduce((s, e) => s + e.budget, 0);
  const totalSpent = envelopes.reduce((s, e) => s + e.spent, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    if (!name.trim() || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid category name and budget limit");
      return;
    }
    createMutation.mutate(
      {
        category: name.trim(),
        budgeted: amount,
        currency: "INR",
        color,
      },
      {
        onSuccess: () => {
          toast.success("Budget envelope created");
          setCreateOpen(false);
          setName("");
          setBudgetAmount("");
        },
        onError: (err) => toast.error(err.message || "Failed to create budget"),
      },
    );
  };

  const handleDelete = (id: string, catName: string) => {
    if (confirm(`Delete budget envelope "${catName}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success(`Budget "${catName}" deleted`),
        onError: (err) => toast.error(err.message || "Failed to delete budget"),
      });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Grow"
        title="Budgets"
        subtitle="Envelopes for monthly category limits and spending pace."
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-[12px] font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> New Budget
          </button>
        }
      />
      <AsyncBoundary state={state} variant="cards" emptyLabel="No budgets configured.">
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <KPI k="Total budget" v={fmt(totalBudget, "₹", 0)} />
          <KPI k="Total spent" v={fmt(totalSpent, "₹", 0)} />
          <KPI
            k="Pace"
            v={totalSpent > totalBudget ? "Over budget" : "On track"}
            tone={totalSpent > totalBudget ? "danger" : "success"}
          />
          <KPI k="Active Envelopes" v={String(envelopes.length)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {envelopes.map((e) => {
            const pct = e.budget > 0 ? Math.min(100, (e.spent / e.budget) * 100) : 0;
            const over = e.spent > e.budget;
            return (
              <article
                key={e.id}
                className="group relative rounded-[20px] border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <header className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-[14px] font-semibold text-foreground">
                    {e.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold ${over ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {over ? "Over Budget" : `${Math.round(pct)}%`}
                    </span>
                    <button
                      onClick={() => handleDelete(e.id, e.name)}
                      title="Delete Budget"
                      className="opacity-40 hover:opacity-100 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </header>
                <div className="font-numeric text-[20px] font-bold text-foreground">
                  {fmt(e.spent, "₹", 0)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  of {fmt(e.budget, "₹", 0)} limit
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: over ? "oklch(0.65 0.22 25)" : e.color || "#3b82f6",
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </AsyncBoundary>

      {/* New Budget Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Budget Envelope</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-[12px] font-medium text-foreground">Category Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Groceries, Entertainment, Fuel"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Monthly Limit (₹)</label>
              <input
                type="number"
                min="500"
                step="500"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="15000"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Color Indicator</label>
              <div className="mt-2 flex items-center gap-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "var(--foreground)" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="h-9 rounded-md border border-border px-4 text-[12px] font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Budget
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPI({ k, v, tone }: { k: string; v: string; tone?: "success" | "danger" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
      <div className="text-[10px] uppercase font-bold tracking-[0.16em] text-muted-foreground">
        {k}
      </div>
      <div
        className={`mt-1 font-numeric text-[18px] font-bold ${
          tone === "success"
            ? "text-success"
            : tone === "danger"
              ? "text-destructive"
              : "text-foreground"
        }`}
      >
        {v}
      </div>
    </div>
  );
}
