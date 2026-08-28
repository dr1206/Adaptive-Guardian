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
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] disabled:opacity-30"
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
                        i === idx ? "w-6 bg-accent" : "w-1.5 bg-white/15",
                      )}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setIdx((i) => Math.min(cards.length - 1, i + 1))}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] disabled:opacity-30"
                  disabled={idx === cards.length - 1}
                  aria-label="Next card"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Controls */}
            <section className="mx-auto mt-6 max-w-2xl">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
                <h3 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Card Controls
                </h3>
                <button
                  onClick={toggleFreeze}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-[13px] transition-colors hover:bg-white/[0.04]",
                  )}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-white/[0.04] text-muted-foreground">
                    <Snowflake className="h-4 w-4" />
                  </span>
                  <span className="flex-1 font-medium">
                    {card.frozen ? "Unfreeze card" : "Freeze card"}
                  </span>
                  <span
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      card.frozen ? "bg-danger/50" : "bg-white/10",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                        card.frozen ? "translate-x-[18px]" : "translate-x-0.5",
                      )}
                    />
                  </span>
                </button>
              </div>

              {/* Limits */}
              <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
                <h3 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Spending Limits
                </h3>
                <Limit label="Daily" used={card.limits.usedDaily} total={card.limits.daily} />
                <Limit label="Monthly" used={card.limits.usedMonthly} total={card.limits.monthly} />
                <Limit label="ATM" used={card.limits.usedAtm} total={card.limits.atm} />
              </div>
            </section>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}

function Limit({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total === 0 ? 0 : (used / total) * 100;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-numeric">
          {fmt(used, "₹", 0)} / {fmt(total, "₹", 0)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-purple"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}