import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { OpsTable } from "@/components/admin/ops-table";
import { MetricCell } from "@/components/admin/metric-cell";
import { seedSeries } from "@/lib/admin-signal";
import { useAdminAccounts } from "@/services/hooks";
import type { AdminAccount } from "@/services/admin/admin.contract";
import { AsyncBoundary } from "@/components/ui/async-boundary";

export const Route = createFileRoute("/admin/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  const accountsQ = useAdminAccounts();
  const accounts: ReadonlyArray<AdminAccount> = accountsQ.data ?? [];
  return (
    <AsyncBoundary isLoading={accountsQ.isLoading} error={accountsQ.error as Error | null}>
      <div className="space-y-6">
        <header>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
            People · accounts
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Institutional view of customer accounts across product lines
          </p>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <MetricCell
            label="Total accounts"
            value={84291}
            delta={+412}
            signal="ok"
            series={seedSeries(1, 32, 0.6, 1)}
          />
          <MetricCell
            label="AUM (USD)"
            value="$2.81B"
            delta="+2.4%"
            signal="ok"
            series={seedSeries(2, 32, 0.5, 1)}
          />
          <MetricCell
            label="Under review"
            value={47}
            delta={+3}
            signal="watch"
            series={seedSeries(3, 32, 0.2, 0.6)}
          />
          <MetricCell
            label="Frozen"
            value={12}
            delta={0}
            signal="alert"
            series={seedSeries(4, 32, 0.1, 0.4)}
          />
        </div>

        <OpsTable
          rows={accounts}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "id",
              label: "Account",
              width: "1fr",
              render: (r) => <span className="font-mono text-xs">{r.id}</span>,
            },
            {
              key: "holder",
              label: "Holder",
              width: "1.5fr",
              render: (r) => <span className="text-sm">{r.holder}</span>,
            },
            {
              key: "product",
              label: "Product",
              width: "0.8fr",
              render: (r) => <span className="text-xs">{r.product}</span>,
            },
            {
              key: "balance",
              label: "Balance",
              width: "1fr",
              align: "right",
              render: (r) => (
                <span data-numeric>
                  {r.currency} {r.balance.toLocaleString()}
                </span>
              ),
            },
            {
              key: "opened",
              label: "Opened",
              width: "0.6fr",
              render: (r) => <span className="text-xs text-muted-foreground">{r.opened}</span>,
            },
            {
              key: "flags",
              label: "Flags",
              width: "0.8fr",
              render: (r) => (
                <span
                  className={`text-xs ${r.flags === "frozen" ? "text-rose-300" : r.flags === "AML review" ? "text-amber-300" : "text-muted-foreground"}`}
                >
                  {r.flags}
                </span>
              ),
            },
          ]}
        />
      </div>
    </AsyncBoundary>
  );
}
