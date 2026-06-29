import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Coffee, Plane, ShoppingBag, Zap } from "lucide-react";

const ICONS = { coffee: Coffee, plane: Plane, shop: ShoppingBag, energy: Zap } as const;
type Glyph = keyof typeof ICONS;

export type Tx = {
  glyph: Glyph;
  merchant: string;
  meta: string;
  amount: number;
  currency?: string;
  direction?: "in" | "out";
  status?: "settled" | "pending";
};

export function TransactionRow({ tx, className }: { tx: Tx; className?: string }) {
  const Icon = ICONS[tx.glyph];
  const negative = tx.direction !== "in";
  const amt = `${negative ? "−" : "+"} ${tx.currency ?? "€"} ${Math.abs(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-card text-foreground/80">
          <Icon className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-medium">{tx.merchant}</div>
          <div className="text-[11px] text-muted-foreground">{tx.meta}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-right">
        <span
          className={cn(
            "font-numeric text-sm font-medium",
            negative ? "text-foreground" : "text-success",
          )}
        >
          {amt}
        </span>
        <span
          className={cn(
            "grid h-6 w-6 place-items-center rounded-md",
            negative ? "bg-white/5 text-muted-foreground" : "bg-success/15 text-success",
          )}
        >
          {negative ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
        </span>
      </div>
    </div>
  );
}

export const sampleTxs: Tx[] = [
  { glyph: "coffee", merchant: "Blue Bottle Coffee", meta: "London · 09:14", amount: 4.8 },
  { glyph: "plane", merchant: "British Airways", meta: "LHR → JFK · Yesterday", amount: 1284.0 },
  { glyph: "shop", merchant: "Goldsmiths", meta: "Bond Street · Mon", amount: 612.5 },
  { glyph: "energy", merchant: "Octopus Energy", meta: "Direct debit · 28th", amount: 142.0 },
  {
    glyph: "coffee",
    merchant: "Inbound transfer",
    meta: "From A. Mehta · Mon",
    amount: 2400,
    direction: "in",
  },
];
