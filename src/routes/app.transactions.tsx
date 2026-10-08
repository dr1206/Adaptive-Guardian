import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ChevronDown, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import { useTransactions, useCreateDispute } from "@/services/hooks";
import type { Transaction } from "@/services/banking/banking.contract";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/transactions")({
  component: TransactionsPage,
});

type SortKey = "date" | "amount" | "category";

function TransactionsPage() {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const { data: transactions, isLoading, error } = useTransactions({});
  const disputeMutation = useCreateDispute();

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputingTx, setDisputingTx] = useState<Transaction | null>(null);
  const [reason, setReason] = useState("Unauthorized Transaction");
  const [explanation, setExplanation] = useState("");

  const filtered = useMemo(() => {
    let list = (transactions ?? []).filter(
      (t) =>
        q === "" ||
        t.merchant.toLowerCase().includes(q.toLowerCase()) ||
        t.category.toLowerCase().includes(q.toLowerCase()) ||
        t.ref.toLowerCase().includes(q.toLowerCase()),
    );

    list = [...list].sort((a, b) => {
      if (sortKey === "amount") return sortAsc ? a.amount - b.amount : b.amount - a.amount;
      if (sortKey === "category") {
        const cmp = a.category.localeCompare(b.category);
        return sortAsc ? cmp : -cmp;
      }
      // date
      const cmp = a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [transactions, q, sortKey, sortAsc]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach((t) => {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
    }
  };

  const handleOpenDispute = (tx: Transaction) => {
    setDisputingTx(tx);
    setReason("Unauthorized Transaction");
    setExplanation("");
    setDisputeOpen(true);
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputingTx) return;
    disputeMutation.mutate(
      {
        transactionId: disputingTx.id,
        reason,
        explanation: explanation.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success(`Dispute ${res.id} registered. Our fraud ops desk is reviewing it.`);
          setDisputeOpen(false);
          setDisputingTx(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to submit dispute");
        },
      },
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Transactions"
        title="Transaction History"
        subtitle="Immutable ledger records, audit logs, and chargeback dispute controls."
      />

      <div className="sticky top-16 z-10 -mx-8 px-8 py-3 bg-background/90 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-xs">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search merchants, categories, narration, reference…"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          {(
            [
              { key: "date", label: "Date" },
              { key: "category", label: "Category" },
              { key: "amount", label: "Amount" },
            ] as { key: SortKey; label: string }[]
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => toggleSort(f.key)}
              className={cn(
                "inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-[12px] font-medium transition-colors",
                sortKey === f.key
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f.label}{" "}
              <ChevronDown
                className={cn("h-3 w-3", sortKey === f.key && sortAsc && "rotate-180")}
              />
            </button>
          ))}
        </div>
      </div>

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={groups.length === 0}
        emptyLabel="No transactions match your search criteria."
      >
        <div className="mt-3">
          {groups.map(([date, items]) => (
            <section key={date} className="mb-6">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {formatDay(date)}
              </h3>
              <ul className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                {items.map((t) => (
                  <li key={t.id} className="border-b border-border/60 last:border-b-0">
                    <button
                      onClick={() => setOpenId(openId === t.id ? null : t.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-[12px] font-bold text-primary">
                          {t.merchant.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="text-[13.5px] font-semibold text-foreground">
                            {t.merchant}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {t.category} · {t.time}
                          </div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "font-numeric text-[15px] font-bold tabular-nums",
                          t.amount >= 0 ? "text-success" : "text-foreground",
                        )}
                      >
                        {fmt(t.amount, "₹", 2)}
                      </span>
                    </button>
                    {openId === t.id && (
                      <Expanded tx={t} onRaiseDispute={() => handleOpenDispute(t)} />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </AsyncBoundary>

      {/* Dispute Modal */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Raise Chargeback / Dispute
            </DialogTitle>
          </DialogHeader>
          {disputingTx && (
            <form onSubmit={handleDisputeSubmit} className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/40 p-3 text-[12px] space-y-1">
                <div>
                  <span className="text-muted-foreground">Merchant:</span>{" "}
                  <strong>{disputingTx.merchant}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>{" "}
                  <strong>{fmt(disputingTx.amount, "₹", 2)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Reference:</span>{" "}
                  <code className="font-mono text-[11px]">{disputingTx.ref}</code>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-foreground">Dispute Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
                >
                  <option value="Unauthorized Transaction">Unauthorized / Fraudulent Charge</option>
                  <option value="Duplicate Charge">Duplicate Debit for Single Purchase</option>
                  <option value="Incorrect Amount Charged">Incorrect Amount Charged</option>
                  <option value="Merchandise Not Received">Merchandise or Service Not Received</option>
                  <option value="ATM Cash Not Dispensed">ATM Cash Not Dispensed</option>
                  <option value="Other">Other Grievance</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-medium text-foreground">
                  Explanation / Statement of Facts (Optional)
                </label>
                <textarea
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provide any additional details or merchant communications…"
                  className="mt-1 w-full rounded-md border border-border bg-background p-3 text-[13px] focus:border-primary focus:outline-none"
                />
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setDisputeOpen(false)}
                  className="h-9 rounded-md border border-border px-4 text-[12px] font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeMutation.isPending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-destructive px-4 text-[12px] font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  {disputeMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Submit Dispute Claim
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Expanded({ tx, onRaiseDispute }: { tx: Transaction; onRaiseDispute: () => void }) {
  return (
    <div className="border-t border-border bg-muted/20 p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Field k="Payment Channel" v={tx.method || "IMPS / UPI"} />
        <Field k="Reference Number" v={tx.ref} />
        <Field k="Terminal / Location" v={tx.location ?? "Verified Client"} />
        <Field k="Transaction Status" v={tx.status} />
        <Field k="Account Debited" v={tx.account || "Primary Savings"} />
        <Field k="Settled Amount" v={fmt(tx.amount, "₹", 2)} />
      </div>
      <div className="mt-4 flex justify-end border-t border-border/60 pt-3">
        <button
          onClick={onRaiseDispute}
          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-card px-3 py-1.5 text-[11.5px] font-semibold text-destructive hover:bg-destructive/10"
        >
          <AlertCircle className="h-3.5 w-3.5" /> Raise Dispute / Chargeback
        </button>
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold tracking-[0.14em] text-muted-foreground">
        {k}
      </div>
      <div className="mt-0.5 text-[12.5px] font-medium text-foreground">{v}</div>
    </div>
  );
}

function formatDay(d: string) {
  const today = "2026-06-28";
  if (d === today) return "Today · 28 Jun";
  if (d === "2026-06-27") return "Yesterday · 27 Jun";
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
