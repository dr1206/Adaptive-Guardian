import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownUp, CheckCircle2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { Sparkline } from "@/components/banking/sparkline";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { PressHoldButton } from "@/components/banking/press-hold-button";
import { useCurrencies, useExecuteExchange } from "@/services/hooks";
import type { ExchangeResult } from "@/services/banking/banking.contract";
import { toast } from "sonner";

export const Route = createFileRoute("/app/exchange")({
  component: ExchangePage,
});

const POPULAR = ["INR/USD", "EUR/INR", "USD/INR", "GBP/INR", "AED/INR"];
const FAVORITES = ["USD/INR", "EUR/INR", "GBP/INR", "JPY/INR"];

function ExchangePage() {
  const { data: currencies, isLoading, error } = useCurrencies();
  const exchangeMutation = useExecuteExchange();
  const [send, setSend] = useState({ code: "INR", amount: "50000.00" });
  const [recv, setRecv] = useState("USD");
  const [lastResult, setLastResult] = useState<ExchangeResult | null>(null);

  const { sRate, rRate } = useMemo(() => {
    const list = currencies ?? [];
    return {
      sRate: list.find((c) => c.code === send.code)?.rate ?? 1,
      rRate: list.find((c) => c.code === recv)?.rate ?? 1,
    };
  }, [currencies, send.code, recv]);

  const rate = sRate > 0 ? rRate / sRate : 1;
  const out = (Number(send.amount || 0) * rate).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const swap = () => {
    setSend((s) => ({ code: recv, amount: s.amount }));
    setRecv(send.code);
  };

  const handleSelectPair = (pair: string) => {
    const [c1, c2] = pair.split("/");
    if (c1 && c2) {
      setSend((s) => ({ ...s, code: c1 }));
      setRecv(c2);
    }
  };

  const handleExecuteExchange = () => {
    const fromAmount = Number(send.amount || 0);
    if (isNaN(fromAmount) || fromAmount <= 0) {
      toast.error("Please enter a valid amount to exchange");
      return;
    }
    exchangeMutation.mutate(
      {
        fromCurrency: send.code,
        toCurrency: recv,
        fromAmount,
      },
      {
        onSuccess: (data) => {
          setLastResult(data);
          toast.success(
            `Exchanged ${data.fromAmount} ${data.fromCurrency} for ${data.toAmount.toFixed(2)} ${data.toCurrency}`,
          );
        },
        onError: (err) => {
          toast.error(err.message || "Failed to execute exchange");
        },
      },
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Grow"
        title="Forex & Currency Exchange"
        subtitle="Real interbank rates with immediate settlement."
      />

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={!currencies || currencies.length === 0}
        emptyLabel="No currency pairs available."
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[28px] border border-border bg-card p-8 shadow-xs">
            <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
              <Side label="You Send">
                <select
                  value={send.code}
                  onChange={(e) => setSend((s) => ({ ...s, code: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-[12px] font-semibold text-foreground focus:border-primary focus:outline-none"
                >
                  {(currencies ?? []).map((c) => (
                    <option key={c.code} value={c.code} className="bg-card text-foreground">
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  value={send.amount}
                  onChange={(e) =>
                    setSend((s) => ({ ...s, amount: e.target.value.replace(/[^\d.]/g, "") }))
                  }
                  className="w-full bg-transparent font-numeric text-[34px] font-bold text-foreground focus:outline-none"
                />
              </Side>

              <button
                onClick={swap}
                title="Swap Currencies"
                className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-xs transition-transform hover:rotate-180 hover:bg-muted"
              >
                <ArrowDownUp className="h-4 w-4" />
              </button>

              <Side label="You Receive">
                <select
                  value={recv}
                  onChange={(e) => setRecv(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-[12px] font-semibold text-foreground focus:border-primary focus:outline-none"
                >
                  {(currencies ?? []).map((c) => (
                    <option key={c.code} value={c.code} className="bg-card text-foreground">
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="font-numeric text-[34px] font-bold text-foreground">{out}</div>
              </Side>
            </div>

            <div className="mt-3 text-[11px] text-muted-foreground">
              Exchange Rate <span className="font-numeric font-semibold text-foreground">1 {send.code} = {rate.toFixed(4)} {recv}</span> · Spreads: 0.15% · Instant Real-time Settlement
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="font-medium text-muted-foreground">
                  {send.code}/{recv} · 30-Day Trend
                </span>
                <span className="font-semibold text-success">Interbank Live Peg</span>
              </div>
              <Sparkline
                points={[80, 78, 82, 84, 80, 86, 88, 84, 88, 92, 90, 94, 92, 96, 94, 98, 96, 100]}
                width={800}
                height={100}
                color="oklch(0.65 0.18 240)"
              />
            </div>

            <div className="mt-6">
              <PressHoldButton
                label={exchangeMutation.isPending ? "Executing Conversion…" : "Hold to Exchange"}
                onComplete={handleExecuteExchange}
              />
            </div>

            {lastResult && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-[12px] text-foreground">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <div>
                  <div className="font-semibold text-success">Conversion Executed</div>
                  <div>
                    {lastResult.fromAmount} {lastResult.fromCurrency} converted to{" "}
                    <strong>
                      {lastResult.toAmount.toFixed(2)} {lastResult.toCurrency}
                    </strong>{" "}
                    (Ref: {lastResult.exchangeId ?? lastResult.transactionId})
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <article className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="mb-3 text-[11px] uppercase font-bold tracking-[0.18em] text-muted-foreground">
                Favorites
              </div>
              <ul className="space-y-1.5">
                {FAVORITES.map((p) => (
                  <li
                    key={p}
                    onClick={() => handleSelectPair(p)}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-border/50 bg-background px-3 py-2 text-[12px] transition-colors hover:bg-muted"
                  >
                    <span className="font-medium text-foreground">{p}</span>
                    <span className="font-numeric text-success">Live</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="mb-3 text-[11px] uppercase font-bold tracking-[0.18em] text-muted-foreground">
                Popular Pairs
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSelectPair(p)}
                    className="rounded-full border border-border bg-background px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </AsyncBoundary>
    </div>
  );
}

function Side({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-xs">
      <div className="mb-2 text-[10px] uppercase font-bold tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
