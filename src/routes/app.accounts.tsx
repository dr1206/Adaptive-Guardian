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
                  <h2 className="font-display text-[15px] font-bold tracking-tight text-foreground">
                    {g.label}
                  </h2>
                  <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {items.length} accounts ·{" "}
                    <span className="font-numeric font-bold text-foreground">
                      {fmt(total, "₹", 0)}
                    </span>
                  </span>
                </header>
                <div className="grid gap-3">
                  {items.map((a) => (
                    <Link
                      key={a.id}
                      to="/app/transactions"
                      className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
                    >
                      <div>
                        <div className="text-[14.5px] font-semibold text-foreground">{a.name}</div>
                        <div className="mt-0.5 text-[12px] text-muted-foreground">
                          A/C: {a.iban} · {a.currency}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-numeric text-[17px] font-bold tabular-nums text-foreground">
                          {fmt(a.balance, "₹", 0)}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
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
