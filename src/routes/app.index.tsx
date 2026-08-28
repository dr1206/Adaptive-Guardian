import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowRight, Send, CreditCard, ListOrdered, Wallet } from "lucide-react";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt, fmtShort } from "@/lib/format";
import { useAccounts, useSession, useTransactions } from "@/services/hooks";
import { cn } from "@/lib/utils";

const search = z.object({ e: z.string().optional() });

export const Route = createFileRoute("/app/")({
  validateSearch: search,
  component: DashboardPage,
});

const QUICK_ACTIONS = [
  { label: "Transfer", icon: Send, to: "/app/transfer" },
  { label: "Cards", icon: CreditCard, to: "/app/cards" },
  { label: "Accounts", icon: Wallet, to: "/app/accounts" },
  { label: "Transactions", icon: ListOrdered, to: "/app/transactions" },
];

function DashboardPage() {
  const { e } = Route.useSearch();
  const name = e ? deriveName(e) : "Test User";
  const { data: accounts } = useAccounts();
  const { data: session } = useSession();
  const { data: transactions, isLoading, error } = useTransactions({ limit: 5 });

  const displayName = session?.displayName ?? name;
  const totalBalance = (accounts ?? []).reduce((s, a) => s + a.balance, 0);
  const savings = (accounts ?? []).find((a) => a.type === "savings");
  const primary = (accounts ?? []).find((a) => a.type === "primary");

  return (
    <div className="pb-16">
      {/* Welcome header */}
      <div className="mb-8">
        <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
          Welcome back
        </p>
        <h1 className="mt-1 font-display text-[28px] font-semibold tracking-tight">
          {displayName.split(" ")[0]}
        </h1>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Total Balance
        </p>
        <p className="mt-2 font-numeric text-[36px] font-semibold tracking-tight">
          {fmtShort(totalBalance)}
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          {primary && (
            <div className="flex-1 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Salary
              </p>
              <p className="mt-1 font-numeric text-[16px] font-semibold">
                {fmtShort(primary.balance)}
              </p>
            </div>
          )}
          {savings && (
            <div className="flex-1 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Savings
              </p>
              <p className="mt-1 font-numeric text-[16px] font-semibold">
                {fmtShort(savings.balance)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="mb-3 text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
          Quick Actions
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center transition-colors hover:border-accent/30 hover:bg-accent/[0.04]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </span>
                <span className="text-[11px] font-medium text-foreground/80">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            Recent Transactions
          </h2>
          <Link
            to="/app/transactions"
            className="inline-flex items-center gap-1 text-[11px] text-accent"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <AsyncBoundary
          isLoading={isLoading}
          error={error}
          isEmpty={!transactions || transactions.length === 0}
          emptyLabel="No recent transactions."
        >
          <div className="overflow-hidden rounded-2xl border border-white/[0.05]">
            {(transactions ?? []).slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-xl text-[10px] font-semibold"
                    style={{
                      background: "oklch(0.355 0.05 215 / 0.4)",
                      color: "oklch(0.95 0.04 215)",
                    }}
                  >
                    {tx.merchant.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="text-[13px] font-medium">{tx.merchant}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {tx.category} · {tx.time}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "font-numeric text-[14px] font-medium",
                    tx.amount >= 0 ? "text-success" : "text-foreground",
                  )}
                >
                  {fmt(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </AsyncBoundary>
      </div>
    </div>
  );
}

function deriveName(email: string) {
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._-]/)[0];
  return first ? first[0].toUpperCase() + first.slice(1) : "Member";
}