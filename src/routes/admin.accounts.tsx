import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { OpsTable } from "@/components/admin/ops-table";
import { MetricCell } from "@/components/admin/metric-cell";
import { seedSeries } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/accounts")({
  component: AccountsPage,
});

const accounts = Array.from({ length: 20 }).map((_, i) => ({
  id: `ACC-${(90000 + i).toString(16).toUpperCase()}`,
  holder: ["Aurora Mfg LLC","Helios Capital","Northwind GmbH","Atlas Trust","Vega Holdings","Solstice LP","Halcyon Inc"][i % 7],
  product: (["Current","Savings","Treasury","Card","FX","Loan"] as const)[i % 6],
  balance: 12_000 + Math.floor(Math.random() * 8_000_000),
  currency: ["USD","EUR","GBP","SGD"][i % 4],
  flags: i % 5 === 0 ? "AML review" : i % 7 === 0 ? "frozen" : "—",
  opened: ["2021","2022","2023","2024","2025"][i % 5],
}));

function AccountsPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">People · accounts</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Accounts</h1>
        <p className="text-sm text-muted-foreground mt-1">Institutional view of customer accounts across product lines</p>
      </header>

      <div className="grid grid-cols-4 gap-3">
        <MetricCell label="Total accounts" value={84291} delta={+412} signal="ok" series={seedSeries(1, 32, 0.6, 1)} />
        <MetricCell label="AUM (USD)" value="$2.81B" delta="+2.4%" signal="ok" series={seedSeries(2, 32, 0.5, 1)} />
        <MetricCell label="Under review" value={47} delta={+3} signal="watch" series={seedSeries(3, 32, 0.2, 0.6)} />
        <MetricCell label="Frozen" value={12} delta={0} signal="alert" series={seedSeries(4, 32, 0.1, 0.4)} />
      </div>

      <OpsTable
        rows={accounts}
        rowKey={(r) => r.id}
        columns={[
          { key: "id", label: "Account", width: "1fr", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "holder", label: "Holder", width: "1.5fr", render: (r) => <span className="text-sm">{r.holder}</span> },
          { key: "product", label: "Product", width: "0.8fr", render: (r) => <span className="text-xs">{r.product}</span> },
          { key: "balance", label: "Balance", width: "1fr", align: "right", render: (r) => <span data-numeric>{r.currency} {r.balance.toLocaleString()}</span> },
          { key: "opened", label: "Opened", width: "0.6fr", render: (r) => <span className="text-xs text-muted-foreground">{r.opened}</span> },
          { key: "flags", label: "Flags", width: "0.8fr", render: (r) => <span className={`text-xs ${r.flags === "frozen" ? "text-rose-300" : r.flags === "AML review" ? "text-amber-300" : "text-muted-foreground"}`}>{r.flags}</span> },
        ]}
      />
    </div>
  );
}
