import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Snowflake, Lock, Globe, Plane, Eye, RotateCcw, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
        eyebrow="Money"
        title="Cards"
        subtitle="Tap a card. Freeze with one click. Mint a virtual in seconds."
        actions={
          <button className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent/25 to-purple/20 px-3 text-[12px] font-medium text-accent">
            <Plus className="h-3.5 w-3.5" /> Mint virtual card
          </button>
        }
      />

      {/* Carousel */}
      <div className="relative grid place-items-center py-6">
        <div className="flex w-full items-center justify-center gap-6">
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
                  transform: isCenter ? "scale(1)" : `scale(0.78) translateX(${off * 10}px)`,
                  opacity: isCenter ? 1 : 0.45,
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
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {cards.map((_, i) => (
              <span
                key={i}
                className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-6 bg-accent" : "w-1.5 bg-white/15")}
              />
            ))}
          </div>
          <button
            onClick={() => setIdx((i) => Math.min(cards.length - 1, i + 1))}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] disabled:opacity-30"
            disabled={idx === cards.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Control Deck */}
      <section className="mt-6 grid gap-5 lg:grid-cols-12">
        <article className="lg:col-span-5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
          <h3 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Controls</h3>
          <ul className="space-y-2.5">
            <Toggle icon={<Snowflake className="h-3.5 w-3.5" />} label="Freeze card" on={card.frozen} onChange={toggleFreeze} />
            <Toggle icon={<Globe className="h-3.5 w-3.5" />} label="Online payments" on={true} />
            <Toggle icon={<Lock className="h-3.5 w-3.5" />} label="Contactless" on={true} />
            <Toggle icon={<Globe className="h-3.5 w-3.5" />} label="International" on={false} />
            <Toggle icon={<Plane className="h-3.5 w-3.5" />} label="Travel mode" on={card.kind === "travel"} />
          </ul>
          <div className="mt-5 flex items-center gap-2 border-t border-white/[0.05] pt-4 text-[11px] text-muted-foreground">
            <SmallButton icon={<Eye className="h-3 w-3" />} label="View PIN" />
            <SmallButton icon={<RotateCcw className="h-3 w-3" />} label="Replace" />
            <SmallButton icon={<Trash2 className="h-3 w-3" />} label="Terminate" />
          </div>
        </article>

        <article className="lg:col-span-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
          <h3 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Limits</h3>
          <Limit label="Daily" used={card.limits.usedDaily} total={card.limits.daily} />
          <Limit label="Monthly" used={card.limits.usedMonthly} total={card.limits.monthly} />
          <Limit label="ATM" used={card.limits.usedAtm} total={card.limits.atm} />
          <button className="mt-4 text-[11px] text-accent">Edit limits →</button>
        </article>

        <article className="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
          <h3 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Spent this month</h3>
          <div className="font-numeric text-[26px] font-semibold tracking-tight">{fmt(card.spentMonth)}</div>
          <div className="mt-1 text-[11px] text-success">↓ 8% vs May</div>
          <div className="mt-4 text-[11px] text-muted-foreground">
            Aegis confidence on transactions:
            <div className="mt-1 font-numeric text-[14px] text-accent">99.3%</div>
          </div>
        </article>
      </section>
    </div>
  );
}

function Toggle({ icon, label, on, onChange }: { icon: React.ReactNode; label: string; on: boolean; onChange?: () => void }) {
  return (
    <li>
      <button
        onClick={onChange}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-[12px] transition-colors hover:bg-white/[0.04]"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md bg-white/[0.04] text-muted-foreground">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <span
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            on ? "bg-accent/40" : "bg-white/10",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              on ? "translate-x-[18px]" : "translate-x-0.5",
            )}
          />
        </span>
      </button>
    </li>
  );
}

function SmallButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 hover:bg-white/[0.08] hover:text-foreground">
      {icon} {label}
    </button>
  );
}

function Limit({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total === 0 ? 0 : (used / total) * 100;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-numeric">
          {fmt(used, "€", 0)} / {fmt(total, "€", 0)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-purple" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
