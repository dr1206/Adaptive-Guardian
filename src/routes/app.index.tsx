import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { BalanceHero } from "@/components/dashboard/balance-hero";
import { AegisWidget } from "@/components/dashboard/aegis-widget";
import { AttentionLane } from "@/components/dashboard/attention-lane";
import { ActionDock } from "@/components/dashboard/action-dock";
import { WidgetMosaic } from "@/components/dashboard/widget-mosaic";
import { TransactionFeed } from "@/components/dashboard/transaction-feed";
import { SecurityOverview } from "@/components/dashboard/security-overview";
import { useAccounts, useSession, useTransactions } from "@/services/hooks";

const search = z.object({ e: z.string().optional() });

export const Route = createFileRoute("/app/")({
  validateSearch: search,
  component: DashboardPage,
});

function DashboardPage() {
  const { e } = Route.useSearch();
  const name = e ? deriveName(e) : "Amal";
  const { data: accounts } = useAccounts();
  const { data: session } = useSession();
  const { data: transactions } = useTransactions({});

  const accountCards = (accounts ?? []).map((a) => ({
    id: a.id,
    label: a.name,
    amount: a.balance,
    currency: a.currency,
    type: a.type,
    pending: a.pending,
    iban: a.iban,
    deltaPct: a.delta_pct,
    spark: a.spark,
  }));

  return (
    <div className="pb-16">
      <WelcomeHeader name={name} session={session} accounts={accounts ?? []} />

      <section className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <BalanceHero accounts={accountCards} />
        </div>
        <div className="lg:col-span-4">
          <AegisWidget />
        </div>
      </section>

      <section className="mt-6">
        <AttentionLane />
      </section>

      <section className="mt-8">
        <ActionDock />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-[18px] font-semibold tracking-tight">Overview</h2>
        <WidgetMosaic />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <TransactionFeed transactions={transactions ?? []} />
        </div>
        <div className="lg:col-span-4">
          <SecurityOverview />
        </div>
      </section>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.04] pt-5 text-[10px] text-muted-foreground">
        <span>
          <span className="text-accent">Aegis · </span>
          Everything looks normal. Behavior stable.
        </span>
        <span className="font-numeric">
          AdaptiveGuard AI · Regulated · EU · Encryption AES-256 · v4.2.1
        </span>
      </footer>
    </div>
  );
}

function deriveName(email: string) {
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._-]/)[0];
  return first ? first[0].toUpperCase() + first.slice(1) : "Member";
}
