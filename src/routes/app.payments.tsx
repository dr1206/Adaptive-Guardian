import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar as CalIcon, List, Pause, Play, Trash2, Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { InsightCard } from "@/components/banking/insight-card";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import {
  usePayments,
  useCreatePayment,
  usePausePayment,
  useResumePayment,
  useDeletePayment,
} from "@/services/hooks";
import type { Payment } from "@/services/banking/banking.contract";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const [view, setView] = useState<"timeline" | "calendar">("timeline");
  const { data: payments, isLoading, error } = usePayments();
  const createMutation = useCreatePayment();
  const pauseMutation = usePausePayment();
  const resumeMutation = useResumePayment();
  const deleteMutation = useDeletePayment();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [nextDate, setNextDate] = useState(new Date().toISOString().slice(0, 10));
  const [beneficiary, setBeneficiary] = useState("");

  const list = payments ?? [];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!name.trim() || isNaN(num) || num <= 0) {
      toast.error("Please enter a valid payment description and amount");
      return;
    }
    createMutation.mutate(
      {
        description: name.trim(),
        amount: num,
        currency: "INR",
        nextDate,
        frequency,
        beneficiary: beneficiary.trim() || name.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Recurring payment scheduled");
          setCreateOpen(false);
          setName("");
          setAmount("");
          setBeneficiary("");
        },
        onError: (err) => toast.error(err.message || "Failed to schedule payment"),
      },
    );
  };

  const handleTogglePause = (p: Payment) => {
    if (p.status === "paused") {
      resumeMutation.mutate(p.id, {
        onSuccess: () => toast.success(`Payment for ${p.name} resumed`),
        onError: (err) => toast.error(err.message || "Failed to resume payment"),
      });
    } else {
      pauseMutation.mutate(p.id, {
        onSuccess: () => toast.success(`Payment for ${p.name} paused`),
        onError: (err) => toast.error(err.message || "Failed to pause payment"),
      });
    }
  };

  const handleDelete = (p: Payment) => {
    if (confirm(`Cancel scheduled payment for ${p.name}?`)) {
      deleteMutation.mutate(p.id, {
        onSuccess: () => toast.success(`Payment for ${p.name} cancelled`),
        onError: (err) => toast.error(err.message || "Failed to cancel payment"),
      });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Payments"
        subtitle="Manage recurring standing orders, utilities, and subscriptions."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule Payment
            </button>
            <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-xs">
              <ViewBtn
                active={view === "timeline"}
                onClick={() => setView("timeline")}
                icon={<List className="h-3.5 w-3.5" />}
                label="Timeline"
              />
              <ViewBtn
                active={view === "calendar"}
                onClick={() => setView("calendar")}
                icon={<CalIcon className="h-3.5 w-3.5" />}
                label="Calendar"
              />
            </div>
          </div>
        }
      />

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={list.length === 0}
        emptyLabel="No scheduled payments."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            {view === "timeline" ? (
              <Timeline
                payments={list}
                onTogglePause={handleTogglePause}
                onDelete={handleDelete}
                isPausing={pauseMutation.isPending || resumeMutation.isPending}
                isDeleting={deleteMutation.isPending}
              />
            ) : (
              <CalendarView payments={list} />
            )}
          </div>
          <aside className="space-y-4">
            <article className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.18em] text-muted-foreground">
                Committed this month
              </h3>
              <div className="mt-2 font-numeric text-[28px] font-bold text-foreground">
                {fmt(
                  list.reduce((s, p) => s + p.amount, 0),
                  "₹",
                  0,
                )}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Fixed {list.filter((x) => x.status !== "paused").length} active ·{" "}
                {list.filter((x) => x.status === "paused").length} paused
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[86%] rounded-full bg-primary" />
              </div>
            </article>
            <InsightCard
              tone="up"
              title="Next Scheduled Debit"
              body="Scheduled payments execute automatically at 06:00 AM IST on their due date."
              action="Learn more"
            />
          </aside>
        </div>
      </AsyncBoundary>

      {/* Schedule Payment Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Recurring Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-[12px] font-medium text-foreground">Payment Description</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Broadband Bill or Flat Maintenance"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Amount (₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-foreground">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-medium text-foreground">
                  First Execution Date
                </label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  required
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">
                Biller / Beneficiary
              </label>
              <input
                type="text"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="e.g. ACT Fibernet or RWA Society"
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
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
                Schedule Payment
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ViewBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] transition-colors",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon} {label}
    </button>
  );
}

function Timeline({
  payments,
  onTogglePause,
  onDelete,
  isPausing,
  isDeleting,
}: {
  payments: ReadonlyArray<Payment>;
  onTogglePause: (p: Payment) => void;
  onDelete: (p: Payment) => void;
  isPausing: boolean;
  isDeleting: boolean;
}) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {payments.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-[11px] font-bold text-primary">
              {p.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="text-[13px] font-semibold text-foreground">{p.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {p.category} · Next on{" "}
                {new Date(p.nextDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-numeric text-[14px] font-bold text-foreground">
              {fmt(p.amount, "₹", 0)}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] uppercase font-bold tracking-[0.12em]",
                p.status === "auto" || p.status === "active"
                  ? "bg-success/15 text-success"
                  : p.status === "paused"
                    ? "bg-warning/15 text-warning"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {p.status}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={isPausing}
                onClick={() => onTogglePause(p)}
                title={p.status === "paused" ? "Resume" : "Pause"}
                className="grid h-7 w-7 place-items-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                {p.status === "paused" ? (
                  <Play className="h-3 w-3" />
                ) : (
                  <Pause className="h-3 w-3" />
                )}
              </button>
              <button
                disabled={isDeleting}
                onClick={() => onDelete(p)}
                title="Cancel Payment"
                className="grid h-7 w-7 place-items-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CalendarView({ payments }: { payments: ReadonlyArray<Payment> }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const payByDay = new Map<number, Payment[]>();
  payments.forEach((p) => {
    const d = Number(p.nextDate.slice(-2)) || 1;
    payByDay.set(d, [...(payByDay.get(d) ?? []), p]);
  });
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-[14px] font-semibold text-foreground">Monthly Schedule</h3>
        <span className="text-[11px] text-muted-foreground">Automated debit execution</span>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase font-bold tracking-[0.16em] text-muted-foreground">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const matched = payByDay.get(day) ?? [];
          return (
            <div
              key={day}
              className={cn(
                "min-h-[50px] rounded-lg border p-1.5 text-left text-[11px]",
                matched.length > 0
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 bg-muted/10",
              )}
            >
              <div className="font-numeric font-medium text-muted-foreground">{day}</div>
              {matched.map((m) => (
                <div
                  key={m.id}
                  className="mt-1 truncate text-[10px] font-bold text-primary"
                  title={m.name}
                >
                  • {m.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
