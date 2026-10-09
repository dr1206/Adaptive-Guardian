import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Snowflake, ChevronLeft, ChevronRight, Sliders, KeyRound, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { BankCard } from "@/components/banking/bank-card";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import {
  useCards,
  useFreezeCard,
  useUnfreezeCard,
  useUpdateCardLimits,
  useChangeCardPin,
} from "@/services/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/cards")({
  component: CardsPage,
});

function CardsPage() {
  const { data: cards = [], isLoading, error } = useCards();
  const [idx, setIdx] = useState(0);

  const freezeMutation = useFreezeCard();
  const unfreezeMutation = useUnfreezeCard();
  const limitsMutation = useUpdateCardLimits();
  const pinMutation = useChangeCardPin();

  const [limitsOpen, setLimitsOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const [dailyLimit, setDailyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [atmLimit, setAtmLimit] = useState("");

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const card = cards[idx];

  const handleToggleFreeze = () => {
    if (!card) return;
    if (card.frozen) {
      unfreezeMutation.mutate(card.id, {
        onSuccess: () => toast.success("Card unfreezed successfully"),
        onError: (err) => toast.error(err.message || "Failed to unfreeze card"),
      });
    } else {
      freezeMutation.mutate(card.id, {
        onSuccess: () => toast.success("Card frozen successfully"),
        onError: (err) => toast.error(err.message || "Failed to freeze card"),
      });
    }
  };

  const openLimitsModal = () => {
    if (!card) return;
    setDailyLimit(String(card.limits.daily));
    setMonthlyLimit(String(card.limits.monthly));
    setAtmLimit(String(card.limits.atm));
    setLimitsOpen(true);
  };

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    const daily = parseFloat(dailyLimit);
    const monthly = parseFloat(monthlyLimit);
    const atm = parseFloat(atmLimit);
    if (isNaN(daily) || isNaN(monthly) || isNaN(atm) || daily < 0 || monthly < 0 || atm < 0) {
      toast.error("Please enter valid positive numbers for all limits");
      return;
    }
    limitsMutation.mutate(
      { cardId: card.id, limits: { daily, monthly, atm } },
      {
        onSuccess: () => {
          toast.success("Card spending limits updated");
          setLimitsOpen(false);
        },
        onError: (err) => toast.error(err.message || "Failed to update limits"),
      },
    );
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    if (!/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }
    pinMutation.mutate(
      { cardId: card.id, pin: newPin },
      {
        onSuccess: () => {
          toast.success("Card PIN updated successfully");
          setPinOpen(false);
          setNewPin("");
          setConfirmPin("");
        },
        onError: (err) => toast.error(err.message || "Failed to update PIN"),
      },
    );
  };

  const isTogglingFreeze = freezeMutation.isPending || unfreezeMutation.isPending;

  return (
    <div>
      <PageHeader
        eyebrow="Cards"
        title="My Cards"
        subtitle="View and manage your debit and credit cards with bank-grade security."
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
                <div className="space-y-3">
                  <button
                    disabled={isTogglingFreeze}
                    onClick={handleToggleFreeze}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border border-border bg-muted/20 p-3 text-left text-[13px] transition-colors hover:bg-muted/40 disabled:opacity-50",
                    )}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                      {isTogglingFreeze ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Snowflake className="h-4 w-4" />
                      )}
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
                        card.frozen ? "bg-destructive" : "bg-muted-foreground/30",
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

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={openLimitsModal}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card text-[12px] font-semibold transition-colors hover:bg-muted"
                    >
                      <Sliders className="h-3.5 w-3.5" /> Modify Limits
                    </button>
                    <button
                      onClick={() => setPinOpen(true)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card text-[12px] font-semibold transition-colors hover:bg-muted"
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Change ATM PIN
                    </button>
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[11px] uppercase font-bold tracking-[0.16em] text-muted-foreground">
                    Authorized Spending Limits
                  </h3>
                  <button
                    onClick={openLimitsModal}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Adjust Limits
                  </button>
                </div>
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

      {/* Limits Modal */}
      <Dialog open={limitsOpen} onOpenChange={setLimitsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Card Limits</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLimits} className="space-y-4 pt-2">
            <div>
              <label className="text-[12px] font-medium text-foreground">
                Daily POS & Online Limit (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">
                Monthly Aggregate Limit (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">
                Daily ATM Cash Withdrawal Limit (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={atmLimit}
                onChange={(e) => setAtmLimit(e.target.value)}
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setLimitsOpen(false)}
                className="h-9 rounded-md border border-border px-4 text-[12px] font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={limitsMutation.isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {limitsMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Limits
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change PIN Modal */}
      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update ATM / POS PIN</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePin} className="space-y-4 pt-2">
            <div>
              <label className="text-[12px] font-medium text-foreground">New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] tracking-widest focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Confirm New PIN</label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] tracking-widest focus:border-primary focus:outline-none"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setPinOpen(false)}
                className="h-9 rounded-md border border-border px-4 text-[12px] font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pinMutation.isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {pinMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Update PIN
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
