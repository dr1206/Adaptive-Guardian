import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Copy, Send, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/banking/page-header";
import { Sparkline } from "@/components/banking/sparkline";
import { TRANSACTIONS, ACCOUNTS, fmt } from "@/lib/banking-data";
import { InsightCard } from "@/components/banking/insight-card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/accounts/$id")({
  loader: ({ params }) => {
    const account = ACCOUNTS.find((a) => a.id === params.id);
    if (!account) throw notFound();
    return { account };
  },
  component: AccountDetailPage,
  notFoundComponent: () => (
    <div className="mt-20 text-center text-muted-foreground">Account not found.</div>
  ),
});

const TABS = [
  "Overview",
  "Transactions",
  "Analytics",
  "Statements",
  "Scheduled",
  "Security",
  "Documents",
] as const;

function AccountDetailPage() {
  const { account } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const txs = TRANSACTIONS.filter((t) => t.account === account.id);

  return (
    <div>
      <div className="mt-6 flex items-center gap-2">
        <Link
          to="/app/accounts"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Accounts
        </Link>
      </div>

      <PageHeader
        title={account.name}
        subtitle={`${account.currency} · ${account.iban}`}
        actions={
          <>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground">
              <Copy className="h-3.5 w-3.5" /> Copy IBAN
            </button>
            <Link
              to="/app/transfer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent/25 to-purple/20 px-3 text-[12px] font-medium text-accent"
            >
              <Send className="h-3.5 w-3.5" /> Transfer
            </Link>
            <button className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </>
        }
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-8 backdrop-blur-xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Available</div>
            <div className="mt-1 font-numeric text-[56px] font-semibold tracking-tight">{fmt(account.balance)}</div>
            <div className="mt-1 text-[12px] text-muted-foreground">
              {account.pending ? `Pending ${fmt(account.pending)} · ` : ""}
              <span className={account.deltaPct >= 0 ? "text-success" : "text-warning"}>
                {account.deltaPct >= 0 ? "↑" : "↓"} {Math.abs(account.deltaPct).toFixed(2)}% today
              </span>
            </div>
          </div>
          <Sparkline points={account.spark} width={420} height={80} color="oklch(0.715 0.135 215)" />
        </div>
      </section>

      {/* Tabs */}
      <nav className="mt-8 flex items-center gap-1 border-b border-white/[0.06]">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative h-10 px-3 text-[13px] transition-colors",
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
            <kbd className="ml-2 font-numeric text-[9px] text-muted-foreground/50">⌘{i + 1}</kbd>
            {tab === t && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-accent to-purple" />
            )}
          </button>
        ))}
      </nav>

      <section className="mt-6">
        {tab === "Overview" && <OverviewTab spark={account.spark} txs={txs} />}
        {tab === "Transactions" && <TxsTab txs={txs} />}
        {tab === "Analytics" && <PlaceholderTab label="Analytics — charts coming online." />}
        {tab === "Statements" && <PlaceholderTab label="Statements scoped to this account." />}
        {tab === "Scheduled" && <PlaceholderTab label="Standing orders & direct debits." />}
        {tab === "Security" && <PlaceholderTab label="Aegis verification events for this account." />}
        {tab === "Documents" && <PlaceholderTab label="KYC, statements, certificates." />}
      </section>
    </div>
  );
}

function OverviewTab({ spark, txs }: { spark: number[]; txs: typeof TRANSACTIONS }) {
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <article className="lg:col-span-8 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-[14px] font-semibold">Cash flow · 90 days</h3>
          <div className="flex gap-1 text-[11px]">
            {["1W", "1M", "3M", "1Y"].map((p) => (
              <button key={p} className="rounded-md px-2 py-0.5 text-muted-foreground hover:bg-white/5 hover:text-foreground">
                {p}
              </button>
            ))}
          </div>
        </header>
        <Sparkline points={spark} width={680} height={160} color="oklch(0.655 0.195 258)" />
        <div className="mt-4 grid grid-cols-4 gap-3">
          <KPI label="In" value="€ 14,230" tone="success" />
          <KPI label="Out" value="€ 9,184" />
          <KPI label="Net" value="€ 5,046" tone="success" />
          <KPI label="Savings rate" value="35.4%" />
        </div>
      </article>
      <div className="lg:col-span-4 grid gap-4">
        <InsightCard tone="down" title="Dining down 18%" body="You've trimmed weekday lunches. €212 vs €258 last month." action="See transactions" />
        <InsightCard tone="calendar" title="Rent due Wednesday" body="€1,250 scheduled to Marta Silva." action="View payment" />
      </div>
      <article className="lg:col-span-12 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-[14px] font-semibold">Recent activity</h3>
          <Link to="/app/transactions" className="text-[11px] text-accent">View all →</Link>
        </header>
        <TxsTab txs={txs.slice(0, 6)} compact />
      </article>
    </div>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-numeric text-[18px] font-semibold", tone === "success" && "text-success")}>{value}</div>
    </div>
  );
}

function TxsTab({ txs, compact }: { txs: typeof TRANSACTIONS; compact?: boolean }) {
  if (txs.length === 0)
    return <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-10 text-center text-[13px] text-muted-foreground">Your ledger is quiet.</div>;
  return (
    <ul className={cn("divide-y divide-white/[0.04]", !compact && "rounded-2xl border border-white/[0.06] bg-white/[0.02]")}>
      {txs.map((t) => (
        <li key={t.id} className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.04] text-[12px] font-semibold">
              {t.merchant.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="text-[13px] font-medium">{t.merchant}</div>
              <div className="text-[10px] text-muted-foreground">{t.category} · {t.time}</div>
            </div>
          </div>
          <span className={cn("font-numeric text-[13px] font-medium", t.amount >= 0 ? "text-success" : "text-foreground")}>
            {fmt(t.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-16 text-center text-[13px] text-muted-foreground">
      {label}
    </div>
  );
}
