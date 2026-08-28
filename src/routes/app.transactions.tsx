import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import { useTransactions } from "@/services/hooks";
import type { Transaction } from "@/services/banking/banking.contract";
import { cn } from "@/lib/utils";

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

  const filtered = useMemo(() => {
    let list = (transactions ?? []).filter(
      (t) =>
        q === "" ||
        t.merchant.toLowerCase().includes(q.toLowerCase()) ||
        t.category.toLowerCase().includes(q.toLowerCase()),
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
      setSortAsc(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Transactions" title="Transactions" subtitle="Every move, fully searchable." />

      <div className="sticky top-16 z-10 -mx-8 px-8 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-[oklch(0.13_0.025_264/0.6)] p-2">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search merchants, categories…"
              className="h-9 w-full rounded-xl border border-transparent bg-white/[0.03] pl-9 pr-3 text-[13px] placeholder:text-muted-foreground/70 focus:border-accent/30 focus:outline-none"
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
                "inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-[12px] transition-colors",
                sortKey === f.key
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-white/[0.05] bg-white/[0.02] text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label} <ChevronDown className={cn("h-3 w-3", sortKey === f.key && sortAsc && "rotate-180")} />
            </button>
          ))}
        </div>
      </div>

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={groups.length === 0}
        emptyLabel="No transactions match your filters."
      >
        <div className="mt-3">
          {groups.map(([date, items]) => (
            <section key={date} className="mb-6">
              <h3 className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {formatDay(date)}
              </h3>
              <ul className="overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02]">
                {items.map((t) => (
                  <li key={t.id} className="border-b border-white/[0.04] last:border-b-0">
                    <button
                      onClick={() => setOpenId(openId === t.id ? null : t.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-10 w-10 place-items-center rounded-xl text-[11px] font-semibold"
                          style={{
                            background: "oklch(0.355 0.05 215 / 0.4)",
                            color: "oklch(0.95 0.04 215)",
                          }}
                        >
                          {t.merchant.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="text-[13px] font-medium">{t.merchant}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {t.category} · {t.time}
                          </div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "font-numeric text-[14px] font-medium",
                          t.amount >= 0 ? "text-success" : "text-foreground",
                        )}
                      >
                        {fmt(t.amount)}
                      </span>
                    </button>
                    {openId === t.id && <Expanded tx={t} />}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </AsyncBoundary>
    </div>
  );
}

function Expanded({ tx }: { tx: Transaction }) {
  return (
    <div className="grid gap-3 border-t border-white/[0.04] bg-white/[0.02] p-4 md:grid-cols-3">
      <Field k="Method" v={tx.method || "—"} />
      <Field k="Reference" v={tx.ref} />
      <Field k="Location" v={tx.location ?? "—"} />
      <Field k="Status" v={tx.status} />
      <Field k="Account" v={tx.account || "—"} />
      <Field k="Amount" v={fmt(tx.amount)} />
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k}</div>
      <div className="mt-0.5 text-[12px]">{v}</div>
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