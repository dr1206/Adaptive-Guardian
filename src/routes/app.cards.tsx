import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Snowflake, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { BankCard } from "@/components/banking/bank-card";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import { useCards } from "@/services/hooks";
import type { BankCard as TCard } from "@/services/banking/banking.contract";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/cards")({
  component: CardsPage,
});

function CardsPage() {
  const { data, isLoading, error } = useCards();
  const [idx, setIdx] = useState(0);
  const [cards, setCards] = useState<ReadonlyArray<TCard>>([]);

  useEffect(() => {
    if (data) setCards(data);
  }, [data]);

  const card = cards[idx];

  const toggleFreeze = () =>
    setCards((cs) => cs.map((c, i) => (i === idx ? { ...c, frozen: !c.frozen } : c)));

  return (
    <div>
      <PageHeader
        eyebrow="Cards"
        title="My Cards"
        subtitle="View and manage your debit and credit cards."
      />

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={cards.length === 0 || !card}
        emptyLabel="No cards yet."
      >
        {card && (
          <>
            {/* Carousel */}
            <div className="relative grid place-items-center py-6">
              <div className="flex w-full items-center justify-center gap-4">
                {cards.map((c, i) => {
                  const off = i - idx;
                  if (Math.abs(off) > 1) return null;
                  const isCenter = off === 0;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setIdx(i)}
                      className="cursor-pointer transition-all duration-500"
                      style={{
                        transform: isCenter ? "scale(1)" : `scale(0.8)`,
                        opacity: isCenter ? 1 : 0.4,
                        filter: isCenter ? "none" : "blur(1px)",
                      }}
                    >
                      <BankCard card={c} size={isCenter ? "lg" : "md"} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-foreground shadow-xs transition-colors hover:bg-muted disabled:opacity-30"
                  disabled={idx === 0}
                  aria-label="Previous card"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {cards.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setIdx((i) => Math.min(cards.length - 1, i + 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-foreground shadow-xs transition-colors hover:bg-muted disabled:opacity-30"
                  disabled={idx === cards.length - 1}
                  aria-label="Next card"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Controls */}
            <section className="mx-auto mt-6 max-w-2xl space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <h3 className="mb-4 text-[11px] uppercase font-bold tracking-[0.16em] text-muted-foreground">
                  Card Security & Controls
                </h3>
                <button
                  onClick={toggleFreeze}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border border-border bg-muted/20 p-3 text-left text-[13px] transition-colors hover:bg-muted/40",
                  )}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                    <Snowflake className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">
                      {card.frozen ? "Card Currently Frozen" : "Freeze Card Instantly"}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">
                      Temporarily disable POS, ATM, and online transactions.
                    </div>
                  </div>
                  <span
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      card.frozen ? "bg-danger" : "bg-muted-foreground/30",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-transform",
                        card.frozen ? "translate-x-[18px]" : "translate-x-0.5",
                      )}
                    />
                  </span>
                </button>
              </div>

              {/* Limits */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <h3 className="mb-4 text-[11px] uppercase font-bold tracking-[0.16em] text-muted-foreground">
                  Authorized Spending Limits
                </h3>
                <Limit
                  label="Daily POS & E-Commerce"
                  used={card.limits.usedDaily}
                  total={card.limits.daily}
                />
                <Limit
                  label="Monthly Aggregate Limit"
                  used={card.limits.usedMonthly}
                  total={card.limits.monthly}
                />
                <Limit
                  label="Daily ATM Cash Withdrawal"
                  used={card.limits.usedAtm}
                  total={card.limits.atm}
                />
              </div>
            </section>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}

function Limit({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, (used / total) * 100);
  return (
    <div className="mb-3.5">
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-numeric font-semibold tabular-nums text-foreground">
          {fmt(used, "₹", 0)} / {fmt(total, "₹", 0)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
