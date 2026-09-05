import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Coffee,
  Download,
  Filter,
  Plane,
  Search,
  ShoppingBag,
  Zap,
  Briefcase,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tx = {
  id: string;
  merchant: string;
  category: string;
  time: string;
  amount: number;
  direction: "in" | "out";
  glyph: keyof typeof ICONS;
  card?: string;
};

const ICONS = {
  coffee: Coffee,
  plane: Plane,
  shop: ShoppingBag,
  energy: Zap,
  salary: Briefcase,
  home: Home,
};

const GLYPH_MAP: Record<string, keyof typeof ICONS> = {
  groceries: "shop",
  dining: "coffee",
  transport: "shop",
  utilities: "energy",
  shopping: "shop",
  subscriptions: "coffee",
  travel: "plane",
  payroll: "salary",
  freelance: "salary",
  investment: "salary",
  transfer: "home",
};

function toTx(t: import("@/services/banking/banking.contract").Transaction): Tx {
  const date = new Date(t.date);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return {
    id: t.id,
    merchant: t.merchant,
    category: t.category ?? "Other",
    time,
    amount: Math.abs(t.amount),
    direction: t.amount >= 0 ? "in" : "out",
    glyph: GLYPH_MAP[t.category ?? ""] ?? "shop",
  };
}

function groupByDate(txs: Tx[]): { label: string; txs: Tx[] }[] {
  const groups: Record<string, Tx[]> = {};
  for (const tx of txs) {
    const key = tx.time;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return [{ label: `Recent · ${today}`, txs: txs.slice(0, 8) }];
}

export function TransactionFeed({ transactions }: { transactions?: import("@/services/banking/banking.contract").Transaction[] }) {
  const txs = (transactions ?? []).slice(0, 8).map(toTx);
  const groups = groupByDate(txs);
  const total = txs.length;

  return (
    <article className="rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-xl">
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.05] p-5">
        <div>
          <h3 className="font-display text-[15px] font-semibold tracking-tight">Transactions</h3>
          <p className="text-[11px] text-muted-foreground">
            {total} this week · live
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search…"
              className="h-8 w-44 rounded-lg border border-white/[0.06] bg-white/[0.02] pl-8 pr-2 text-[12px] placeholder:text-muted-foreground/60 focus:border-accent/40 focus:outline-none"
            />
          </div>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 text-[11px] text-muted-foreground hover:text-foreground">
            <Filter className="h-3 w-3" /> Filter
          </button>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 text-[11px] text-muted-foreground hover:text-foreground">
            <Download className="h-3 w-3" /> Export
          </button>
        </div>
      </header>

      <div className="divide-y divide-white/[0.04]">
        {groups.map((g) => (
          <section key={g.label}>
            <div className="sticky top-0 z-10 flex items-center justify-between bg-[oklch(0.16_0.03_264/0.6)] px-5 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-xl">
              <span>{g.label}</span>
              <span className="font-numeric normal-case tracking-normal">
                {g.txs.length} entries
              </span>
            </div>
            <ul>
              {g.txs.map((tx) => (
                <Row key={tx.id} tx={tx} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}

function Row({ tx }: { tx: Tx }) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[tx.glyph];
  const incoming = tx.direction === "in";
  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04]">
          <Icon className={cn("h-4 w-4", incoming ? "text-success" : "text-muted-foreground")} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium">{tx.merchant}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5">{tx.category}</span>
            <span>·</span>
            <span>{tx.time}</span>
            {tx.card && (
              <>
                <span>·</span>
                <span className="font-numeric">{tx.card}</span>
              </>
            )}
          </div>
        </div>
        <span
          className={cn(
            "font-numeric text-[13px] font-medium",
            incoming ? "text-success" : "text-foreground",
          )}
        >
          {incoming ? "+" : "−"} €
          {tx.amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span
          className={cn(
            "grid h-6 w-6 place-items-center rounded-md",
            incoming ? "bg-success/15 text-success" : "bg-white/[0.04] text-muted-foreground",
          )}
        >
          {incoming ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-white/[0.04] bg-white/[0.015] px-5 py-4 text-[12px] text-muted-foreground">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
            <Field k="Reference" v={`AG-${tx.id.padStart(6, "0")}`} mono />
            <Field k="Method" v={tx.card ?? "SEPA"} />
            <Field k="Status" v="Settled" tone="success" />
            <Field k="Aegis trust" v="High · 99.4%" tone="accent" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Action label="Categorise" />
            <Action label="Attach receipt" />
            <Action label="Split" />
            <Action label="Dispute" />
            <Action label="Add note" />
          </div>
        </div>
      )}
    </li>
  );
}

function Field({
  k,
  v,
  mono,
  tone,
}: {
  k: string;
  v: string;
  mono?: boolean;
  tone?: "success" | "accent";
}) {
  const color =
    tone === "success" ? "text-success" : tone === "accent" ? "text-accent" : "text-foreground";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{k}</div>
      <div className={cn("mt-0.5 text-[12px]", mono && "font-numeric", color)}>{v}</div>
    </div>
  );
}

function Action({ label }: { label: string }) {
  return (
    <button className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-foreground transition-colors hover:bg-white/[0.06]">
      {label}
    </button>
  );
}
