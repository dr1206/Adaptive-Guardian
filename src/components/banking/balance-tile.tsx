import { cn } from "@/lib/utils";
import { ArrowUpRight, TrendingUp } from "lucide-react";

export function BalanceTile({
  label = "Total balance",
  amount = 128402.55,
  currency = "€",
  delta = "+ 2.41%",
  className,
}: {
  label?: string;
  amount?: number;
  currency?: string;
  delta?: string;
  className?: string;
}) {
  const integer = Math.floor(amount).toLocaleString("en-US");
  const decimals = (amount % 1).toFixed(2).slice(2);

  return (
    <div className={cn("surface-card rounded-[20px] p-5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
          <TrendingUp className="h-3 w-3" /> {delta}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5 font-numeric">
        <span className="text-sm text-muted-foreground">{currency}</span>
        <span className="text-3xl font-semibold tracking-tight">{integer}</span>
        <span className="text-2xl text-muted-foreground/70">.{decimals}</span>
      </div>
      <Sparkline />
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Available · {currency}
          {integer}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
      </div>
    </div>
  );
}

function Sparkline() {
  const points = [40, 55, 30, 70, 48, 82, 60, 78, 65, 88, 74, 92];
  const w = 240;
  const h = 44;
  const max = Math.max(...points);
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - (p / max) * h}`)
    .join(" L ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-11 w-full">
      <defs>
        <linearGradient id="spark-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.715 0.135 215 / 0.35)" />
          <stop offset="100%" stopColor="oklch(0.715 0.135 215 / 0)" />
        </linearGradient>
      </defs>
      <path d={`M ${d} L ${w},${h} L 0,${h} Z`} fill="url(#spark-g)" />
      <path d={`M ${d}`} stroke="oklch(0.715 0.135 215)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
