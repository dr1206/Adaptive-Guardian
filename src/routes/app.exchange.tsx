import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownUp, Plus } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { Sparkline } from "@/components/banking/sparkline";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { PressHoldButton } from "@/components/banking/press-hold-button";
import { useCurrencies } from "@/services/hooks";

export const Route = createFileRoute("/app/exchange")({
  component: ExchangePage,
});

const POPULAR = ["EUR/USD", "EUR/GBP", "USD/JPY", "EUR/BRL", "GBP/INR"];

function ExchangePage() {
  const { data: currencies, isLoading, error } = useCurrencies();
  const [send, setSend] = useState({ code: "EUR", amount: "1000.00" });
  const [recv, setRecv] = useState("USD");

  const { sRate, rRate } = useMemo(() => {
    const list = currencies ?? [];
    return {
      sRate: list.find((c) => c.code === send.code)?.rate ?? 1,
      rRate: list.find((c) => c.code === recv)?.rate ?? 1,
    };
  }, [currencies, send.code, recv]);

  const rate = rRate / sRate;
  const out = (Number(send.amount || 0) * rate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const swap = () => {
    setSend((s) => ({ code: recv, amount: s.amount }));
    setRecv(send.code);
  };



  return (
    <div>
      <PageHeader eyebrow="Grow" title="Exchange" subtitle="Real rates. Honest spreads." />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[28px] border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent p-8">
          <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <Side label="You send">
              <select
                value={send.code}
                onChange={(e) => setSend((s) => ({ ...s, code: e.target.value }))}
                className="rounded-lg bg-white/[0.04] px-2 py-1 text-[12px] focus:outline-none"
              >
                {CURRENCIES.map((c) => <option key={c.code} value={c.code} className="bg-background">{c.flag} {c.code}</option>)}
              </select>
              <input
                value={send.amount}
                onChange={(e) => setSend((s) => ({ ...s, amount: e.target.value.replace(/[^\d.]/g, "") }))}
                className="w-full bg-transparent font-numeric text-[34px] font-semibold focus:outline-none"
              />
            </Side>
            <button onClick={swap} className="grid h-11 w-11 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] transition-transform hover:rotate-180">
              <ArrowDownUp className="h-4 w-4" />
            </button>
            <Side label="You receive">
              <select value={recv} onChange={(e) => setRecv(e.target.value)} className="rounded-lg bg-white/[0.04] px-2 py-1 text-[12px] focus:outline-none">
                {CURRENCIES.map((c) => <option key={c.code} value={c.code} className="bg-background">{c.flag} {c.code}</option>)}
              </select>
              <div className="font-numeric text-[34px] font-semibold">{out}</div>
            </Side>
          </div>

          <div className="mt-3 text-[11px] text-muted-foreground">
            Rate <span className="font-numeric text-foreground">{rate.toFixed(4)}</span> · spread 0.42% · arrives instantly
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{send.code}/{recv} · 1M</span>
              <span className="text-accent">↑ 1.2% above 30-day avg</span>
            </div>
            <Sparkline points={[80, 78, 82, 84, 80, 86, 88, 84, 88, 92, 90, 94, 92, 96, 94, 98, 96, 100]} width={800} height={100} color="oklch(0.715 0.135 215)" />
          </div>

          <div className="mt-6">
            <PressHoldButton label="Hold to exchange" onComplete={() => {}} />
          </div>
        </section>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
            <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>Favorites</span>
              <button><Plus className="h-3 w-3" /></button>
            </div>
            <ul className="space-y-1.5">
              {["EUR/USD", "EUR/GBP", "EUR/CHF", "USD/JPY"].map((p) => (
                <li key={p} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2 text-[12px]">
                  <span>{p}</span>
                  <span className="font-numeric text-success">↑ 0.21%</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
            <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Popular</div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {POPULAR.map((p) => (
                <span key={p} className="rounded-full bg-white/[0.04] px-2 py-1">{p}</span>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}

function Side({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="space-y-2 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">{children}</div>
    </div>
  );
}
