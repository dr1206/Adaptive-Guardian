import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import {
  useSavingsGoals,
  useCreateSavingsGoal,
  useContributeSavingsGoal,
  useWithdrawSavingsGoal,
  useDeleteSavingsGoal,
} from "@/services/hooks";
import type { SavingsGoal } from "@/services/banking/banking.contract";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/savings")({
  component: SavingsPage,
});

function SavingsPage() {
  const { data: goals, isLoading, error } = useSavingsGoals();
  const createMutation = useCreateSavingsGoal();
  const contributeMutation = useContributeSavingsGoal();
  const withdrawMutation = useWithdrawSavingsGoal();
  const deleteMutation = useDeleteSavingsGoal();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [category, setCategory] = useState("Emergency");
  const [monthly, setMonthly] = useState("5000");

  const [contributeOpen, setContributeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(target);
    const monthlyNum = parseFloat(monthly) || 0;
    if (!name.trim() || isNaN(targetNum) || targetNum <= 0) {
      toast.error("Please enter a valid goal name and target amount");
      return;
    }
    createMutation.mutate(
      {
        name: name.trim(),
        target: targetNum,
        category,
        monthly: monthlyNum,
      },
      {
        onSuccess: () => {
          toast.success("Savings goal created");
          setCreateOpen(false);
          setName("");
          setTarget("");
        },
        onError: (err) => toast.error(err.message || "Failed to create savings goal"),
      },
    );
  };

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid contribution amount");
      return;
    }
    contributeMutation.mutate(
      { goalId: selectedGoal.id, amount },
      {
        onSuccess: () => {
          toast.success(`Contributed ${fmt(amount, "₹", 0)} to ${selectedGoal.name}`);
          setContributeOpen(false);
          setFundAmount("");
        },
        onError: (err) => toast.error(err.message || "Failed to add funds"),
      },
    );
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }
    if (amount > selectedGoal.saved) {
      toast.error("Withdrawal amount exceeds accumulated savings");
      return;
    }
    withdrawMutation.mutate(
      { goalId: selectedGoal.id, amount },
      {
        onSuccess: () => {
          toast.success(`Withdrew ${fmt(amount, "₹", 0)} from ${selectedGoal.name}`);
          setWithdrawOpen(false);
          setFundAmount("");
        },
        onError: (err) => toast.error(err.message || "Failed to withdraw funds"),
      },
    );
  };

  const handleDeleteGoal = (goal: SavingsGoal) => {
    if (confirm(`Delete savings goal "${goal.name}"?`)) {
      deleteMutation.mutate(goal.id, {
        onSuccess: () => toast.success(`Goal "${goal.name}" deleted`),
        onError: (err) => toast.error(err.message || "Failed to delete goal"),
      });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Grow"
        title="Savings Goals"
        subtitle="Set dedicated targets with automated milestone tracking."
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-[12px] font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
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
          {(goals ?? []).map((g) => (
            <GoalCard
              key={g.id}
              g={g}
              onAddFunds={() => {
                setSelectedGoal(g);
                setFundAmount("");
                setContributeOpen(true);
              }}
              onWithdraw={() => {
                setSelectedGoal(g);
                setFundAmount("");
                setWithdrawOpen(true);
              }}
              onDelete={() => handleDeleteGoal(g)}
            />
          ))}
        </div>
      </AsyncBoundary>

      {/* Create Goal Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Savings Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-[12px] font-medium text-foreground">Goal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Goa Vacation or Emergency Fund"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Target Amount (₹)</label>
              <input
                type="number"
                min="1000"
                step="500"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="100000"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
                >
                  {["Emergency", "Travel", "Home", "General"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-medium text-foreground">
                  Monthly Contribution (₹)
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  placeholder="5000"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
                />
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
                Create Goal
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contribute Modal */}
      <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Funds to {selectedGoal?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContributeSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-[12px] font-medium text-foreground">
                Contribution Amount (₹)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                autoFocus
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="5000"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setContributeOpen(false)}
                className="h-9 rounded-md border border-border px-4 text-[12px] font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={contributeMutation.isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {contributeMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add Funds
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw from {selectedGoal?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-[12px] font-medium text-foreground">
                Withdrawal Amount (Max: {fmt(selectedGoal?.saved ?? 0, "₹", 0)})
              </label>
              <input
                type="number"
                min="100"
                max={selectedGoal?.saved ?? 0}
                step="100"
                autoFocus
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="2000"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setWithdrawOpen(false)}
                className="h-9 rounded-md border border-border px-4 text-[12px] font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={withdrawMutation.isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {withdrawMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Withdraw
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalCard({
  g,
  onAddFunds,
  onWithdraw,
  onDelete,
}: {
  g: SavingsGoal;
  onAddFunds: () => void;
  onWithdraw: () => void;
  onDelete: () => void;
}) {
  const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
  const r = 46;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const color =
    g.category === "Travel"
      ? "oklch(0.635 0.215 295)"
      : g.category === "Emergency"
        ? "oklch(0.715 0.135 215)"
        : g.category === "Home"
          ? "oklch(0.78 0.155 75)"
          : "oklch(0.71 0.155 165)";

  return (
    <article className="group rounded-[20px] border border-border bg-card p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-sm">
      <header className="mb-2 flex items-center justify-between text-[11px] uppercase font-bold tracking-[0.16em] text-muted-foreground">
        <span>{g.category}</span>
        <div className="flex items-center gap-1">
          <span className="text-[14px]">{g.icon}</span>
          <button
            onClick={onDelete}
            title="Delete Goal"
            className="ml-1 opacity-40 hover:opacity-100 hover:text-destructive transition-opacity"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>
      <h3 className="font-display text-[18px] font-semibold tracking-tight text-foreground">
        {g.name}
      </h3>

      <div className="my-5 grid place-items-center">
        <div className="relative grid h-32 w-32 place-items-center">
          <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={r}
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-muted/40"
            />
            <circle
              cx="60"
              cy="60"
              r={r}
              stroke={color}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={off}
            />
          </svg>
          <div className="text-center">
            <div className="font-numeric text-[24px] font-bold text-foreground">
              {pct.toFixed(0)}%
            </div>
            <div className="text-[9px] uppercase font-bold tracking-[0.18em] text-muted-foreground">
              complete
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[12px] text-muted-foreground">
        <span className="font-numeric font-bold text-foreground">{fmt(g.saved, "₹", 0)}</span> of{" "}
        <span className="font-numeric">{fmt(g.target, "₹", 0)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-[11px]">
        <span>
          <span className="text-muted-foreground">ETA</span> {g.eta}
        </span>
        <span>
          <span className="text-muted-foreground">Target /mo</span>{" "}
          <span className="font-numeric font-semibold text-foreground">
            {fmt(g.monthly, "₹", 0)}
          </span>
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onAddFunds}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-[11px] font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
        >
          <ArrowUpRight className="h-3 w-3" /> Add funds
        </button>
        {g.saved > 0 && (
          <button
            onClick={onWithdraw}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted"
          >
            <ArrowDownLeft className="h-3 w-3" /> Withdraw
          </button>
        )}
      </div>
    </article>
  );
}
