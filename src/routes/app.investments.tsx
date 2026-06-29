import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/banking/page-header";
import { Sparkline } from "@/components/banking/sparkline";
import { InsightCard } from "@/components/banking/insight-card";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import { useHoldings } from "@/services/hooks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/investments")({
  component: InvestmentsPage,
});

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
const TABS = ["Holdings", "Watchlist", "Orders", "Insights", "Research"];

function InvestmentsPage() {
  const [range, setRange] = useState("1M");
  const [tab, setTab] = useState("Holdings");
  const { data: holdings, isLoading, error } = useHoldings();
  const total = (holdings ?? []).reduce((s, h) => s + h.value, 0);
  const dayDelta = 1.84;
  const lifeDelta = 28.4;


  return (
    <div>
      <PageHeader eyebrow="Grow" title="Investments" subtitle="Your portfolio at a glance." />

      <section className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-gradient-to-br from-white/[0.06] via-white/[0.025] to-transparent p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Portfolio value</div>
            <div className="mt-1 font-numeric text-[48px] font-semibold tracking-tight">{fmt(total)}</div>
            <div className="mt-1 text-[12px]">
              <span className="text-success">↑ {dayDelta.toFixed(2)}% today</span>
              <span className="text-muted-foreground"> · ↑ {lifeDelta}% all-time</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] p-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] transition-colors",
                    range === r ? "bg-accent/20 text-accent" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="grid h-20 w-24 place-items-center rounded-2xl border border-purple/30 bg-purple/10 text-center">
              <div className="font-numeric text-[22px] font-semibold text-purple">4</div>
              <div className="text-[9px] uppercase tracking-[0.16em] text-purple">Balanced</div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Sparkline points={[60, 62, 58, 64, 66, 64, 68, 70, 72, 74, 72, 76, 78, 82, 80, 84, 90, 96]} width={1000} height={140} color="oklch(0.71 0.155 165)" />
        </div>
        {/* Allocation bar */}
        <div className="mt-6">
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Allocation</div>
          <div className="flex h-3 overflow-hidden rounded-full">
            <Seg pct={61.5} color="oklch(0.655 0.195 258)" label="Stocks" />
            <Seg pct={9.6} color="oklch(0.78 0.155 75)" label="Gold" />
            <Seg pct={15.4} color="oklch(0.635 0.215 295)" label="Crypto" />
            <Seg pct={8.1} color="oklch(0.71 0.155 165)" label="Small caps" />
            <Seg pct={5.4} color="oklch(0.715 0.135 215)" label="Cash" />
          </div>
        </div>
      </section>

      <nav className="mt-8 flex items-center gap-1 border-b border-white/[0.06]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("relative h-10 px-3 text-[13px]", tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-accent to-purple" />}
          </button>
        ))}
      </nav>

      {tab === "Holdings" && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <table className="w-full text-[12px]">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr className="border-b border-white/[0.05]">
                <Th>Instrument</Th><Th right>Units</Th><Th right>Avg cost</Th><Th right>Price</Th><Th right>Day Δ</Th><Th right>Value</Th><Th right>Weight</Th>
              </tr>
            </thead>
            <tbody>
              {HOLDINGS.map((h) => (
                <tr key={h.symbol} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5">
                    <div className="font-display text-[13px] font-semibold">{h.symbol}</div>
                    <div className="text-[10px] text-muted-foreground">{h.name}</div>
                  </td>
                  <Td right>{h.units}</Td>
                  <Td right>{fmt(h.avg)}</Td>
                  <Td right>{fmt(h.price)}</Td>
                  <Td right tone={h.dayPct >= 0 ? "success" : "warning"}>{(h.dayPct >= 0 ? "+" : "")}{h.dayPct.toFixed(2)}%</Td>
                  <Td right>{fmt(h.value)}</Td>
                  <Td right>{h.weightPct.toFixed(1)}%</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Insights" && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InsightCard tone="growth" title="Portfolio up 1.84%" body="Led by QQQ and BTC." action="Open chart" />
          <InsightCard tone="up" title="Tech weight at 42%" body="Above your target 35%. Consider rebalancing." action="Rebalance" />
          <InsightCard tone="saving" title="Dividend due Friday" body="VWCE distribution: ~€84 estimated." action="Details" />
        </div>
      )}
      {tab !== "Holdings" && tab !== "Insights" && (
        <div className="mt-5 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-16 text-center text-[13px] text-muted-foreground">{tab} appear here.</div>
      )}
    </div>
  );
}

function Seg({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <div className="group relative h-full" style={{ width: `${pct}%`, background: color }} title={`${label} ${pct}%`}>
      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-[oklch(0.13_0.025_264)] px-2 py-0.5 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">{label} · {pct}%</span>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={cn("px-4 py-2 font-medium", right ? "text-right" : "text-left")}>{children}</th>;
}
function Td({ children, right, tone }: { children: React.ReactNode; right?: boolean; tone?: "success" | "warning" }) {
  return <td className={cn("px-4 py-2.5 font-numeric", right ? "text-right" : "text-left", tone === "success" && "text-success", tone === "warning" && "text-warning")}>{children}</td>;
}
