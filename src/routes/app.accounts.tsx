import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import type { AccountType } from "@/services/banking/banking.contract";
import { useAccounts } from "@/services/hooks";

export const Route = createFileRoute("/app/accounts")({
  component: AccountsPage,
});

const GROUPS: { type: AccountType; label: string }[] = [
  { type: "primary", label: "Salary" },
  { type: "savings", label: "Savings" },
  { type: "investment", label: "Investment" },
  { type: "business", label: "Current" },
  { type: "credit", label: "Credit Card" },
  { type: "fixed", label: "Fixed Deposits" },
];

function AccountsPage() {
  const { data: accounts, isLoading, error } = useAccounts();

  return (
    <div>
      <PageHeader
        eyebrow="Accounts"
        title="My Accounts"
        subtitle="All your accounts in one place."
      />

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={!accounts || accounts.length === 0}
        emptyLabel="No accounts to display."
      >
        <div className="space-y-8">
          {GROUPS.map((g) => {
            const items = (accounts ?? []).filter((a) => a.type === g.type);
            if (items.length === 0) return null;
            const total = items.reduce((s, a) => s + a.balance, 0);
            return (
              <section key={g.type}>
                <header className="mb-3 flex items-center gap-3">
                  <h2 className="font-display text-[14px] font-semibold tracking-tight">
                    {g.label}
                  </h2>
                  <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground">
                    {items.length} ·{" "}
                    <span className="font-numeric text-foreground">{fmt(total, "₹", 0)}</span>
                  </span>
                </header>
                <div className="grid gap-3">
                  {items.map((a) => (
                    <Link
                      key={a.id}
                      to="/app/transactions"
                      className="group flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-accent/30 hover:bg-accent/[0.03]"
                    >
                      <div>
                        <div className="text-[14px] font-medium">{a.name}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {a.currency} · {a.iban}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-numeric text-[16px] font-semibold">
                          {fmt(a.balance, "₹", 0)}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </AsyncBoundary>
    </div>
  );
}