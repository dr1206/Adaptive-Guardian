import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Download, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { TRANSACTIONS, fmt, type Transaction } from "@/lib/banking-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      TRANSACTIONS.filter(
        (t) =>
          q === "" ||
          t.merchant.toLowerCase().includes(q.toLowerCase()) ||
          t.category.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach((t) => {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  return (
    <div>
      <PageHeader eyebrow="Money" title="Transactions" subtitle="Every move, fully searchable." />

      <div className="sticky top-16 z-10 -mx-8 px-8 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-[oklch(0.13_0.025_264/0.6)] p-2">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search merchants, categories, amounts…"
              className="h-9 w-full rounded-xl border border-transparent bg-white/[0.03] pl-9 pr-3 text-[13px] placeholder:text-muted-foreground/70 focus:border-accent/30 focus:outline-none"
            />
          </div>
          {["Date", "Category", "Account", "Amount", "Status"].map((f) => (
            <button
              key={f}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {f} <ChevronDown className="h-3 w-3" />
            </button>
          ))}
          <button className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 text-[12px] text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

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
    </div>
  );
}

function Expanded({ tx }: { tx: Transaction }) {
  return (
    <div className="grid gap-3 border-t border-white/[0.04] bg-white/[0.02] p-4 md:grid-cols-3">
      <Field k="Method" v={tx.method} />
      <Field k="Reference" v={tx.ref} />
      <Field k="Location" v={tx.location ?? "—"} />
      <Field k="Status" v={tx.status} />
      <Field k="Aegis check" v={`✓ ${tx.confidence}% confidence`} tone="accent" />
      <Field k="Risk" v="0.02" />
      <div className="md:col-span-3 mt-2 flex gap-2">
        <button className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-[11px] hover:bg-white/[0.08]">Export PDF</button>
        <button className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-[11px] hover:bg-white/[0.08]">Split</button>
        <button className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-[11px] hover:bg-white/[0.08]">Dispute</button>
        <button className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-[11px] hover:bg-white/[0.08]">Attach receipt</button>
      </div>
    </div>
  );
}

function Field({ k, v, tone }: { k: string; v: string; tone?: "accent" }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k}</div>
      <div className={cn("mt-0.5 text-[12px]", tone === "accent" && "text-accent")}>{v}</div>
    </div>
  );
}

function formatDay(d: string) {
  const today = "2026-06-28";
  if (d === today) return "Today · 28 Jun";
  if (d === "2026-06-27") return "Yesterday · 27 Jun";
  return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
