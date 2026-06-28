import { createFileRoute } from "@tanstack/react-router";
import { Plus, Filter } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { AccountCard } from "@/components/banking/account-card";
import { ACCOUNTS, fmt, type AccountType } from "@/lib/banking-data";

export const Route = createFileRoute("/app/accounts")({
  component: AccountsPage,
});

const GROUPS: { type: AccountType; label: string }[] = [
  { type: "primary", label: "Current" },
  { type: "savings", label: "Savings" },
  { type: "investment", label: "Investment" },
  { type: "business", label: "Business" },
  { type: "credit", label: "Credit" },
  { type: "fixed", label: "Fixed Deposits" },
];

function AccountsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Accounts"
        subtitle="Every pot of money, side by side."
        actions={
          <>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground">
              <Filter className="h-3.5 w-3.5" /> Filter
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent/25 to-purple/20 px-3 text-[12px] font-medium text-accent transition-colors hover:from-accent/35 hover:to-purple/30">
              <Plus className="h-3.5 w-3.5" /> Open account
            </button>
          </>
        }
      />

      <div className="space-y-10">
        {GROUPS.map((g) => {
          const items = ACCOUNTS.filter((a) => a.type === g.type);
          if (items.length === 0) return null;
          const total = items.reduce((s, a) => s + a.balance, 0);
          return (
            <section key={g.type}>
              <header className="mb-3 flex items-center gap-3">
                <h2 className="font-display text-[14px] font-semibold tracking-tight">{g.label}</h2>
                <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground">
                  {items.length} · <span className="font-numeric text-foreground">{fmt(total)}</span>
                </span>
              </header>
              <div className="-mx-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-8 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map((a) => (
                  <div key={a.id} className="snap-start">
                    <AccountCard account={a} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
