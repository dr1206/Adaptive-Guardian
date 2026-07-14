import { useState } from "react";
import {
  ArrowLeftRight,
  ArrowDownToLine,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  HandCoins,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountCard {
  id: string;
  label: string;
  amount: number;
  currency: string;
  type: string;
  pending?: number;
  iban?: string;
  deltaPct?: number;
  spark?: number[];
}

export function BalanceHero({ accounts }: { accounts?: AccountCard[] }) {
  const cards = accounts ?? [];
  const [accId, setAccId] = useState(cards[0]?.id ?? "");
  const [hide, setHide] = useState(false);
  const [open, setOpen] = useState(false);
  const acc = cards.find((a) => a.id === accId) ?? cards[0];

  if (!acc) {
    return (
      <article className="relative flex items-center justify-center overflow-hidden rounded-[28px] border border-white/[0.06] p-12"
        style={{ background: "linear-gradient(135deg,#1c2030 0%,#0f1320 60%,#262b3d 100%)" }}>
        <p className="text-[14px] text-muted-foreground/60">No accounts available</p>
      </article>
    );
  }

  const toneMap: Record<string, string> = {
    savings: "linear-gradient(135deg,#2a2418 0%,#16120c 55%,#3d3320 100%)",
    investment: "linear-gradient(135deg,#15171c 0%,#0a0c10 60%,#1f2229 100%)",
  };
  const tone = toneMap[acc.type] ?? "linear-gradient(135deg,#1c2030 0%,#0f1320 60%,#262b3d 100%)";

  const integer = Math.floor(Math.abs(acc.amount)).toLocaleString("en-US");
  const decimals = Math.abs(acc.amount % 1)
    .toFixed(2)
    .slice(2);

  return (
    <article
      className="relative overflow-hidden rounded-[28px] border border-white/[0.06] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
      style={{ background: tone }}
    >
      {/* sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.05) 45%, transparent 60%)",
        }}
      />
      {/* etched grid */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
        viewBox="0 0 600 320"
      >
        <defs>
          <pattern id="hero-etch" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" stroke="#fff" strokeWidth="0.3" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-etch)" />
      </svg>

      <div className="relative">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/80 transition-colors hover:bg-white/[0.08]"
            >
              {acc.label}
              <ChevronDown className="h-3 w-3" />
            </button>
            {open && (
              <div className="absolute left-0 top-full z-20 mt-2 w-[220px] rounded-2xl border border-white/[0.08] bg-[oklch(0.18_0.03_264/0.95)] p-1.5 shadow-2xl backdrop-blur-2xl">
                {cards.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAccId(a.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12px] transition-colors hover:bg-white/5",
                      a.id === accId && "bg-white/5",
                    )}
                  >
                    <span>{a.label}</span>
                    <span className="font-numeric text-muted-foreground">
                      {a.currency === "EUR" ? "€" : "$"}
                      {Math.abs(a.amount).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-numeric text-[11px] tracking-wide text-white/80 hover:bg-white/[0.08]">
              {acc.currency}
              <ChevronDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => setHide((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]"
            >
              {hide ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Balance */}
        <div className="mt-6 flex items-baseline gap-2 font-numeric text-white">
          <span className="text-[18px] opacity-60">
            {acc.currency === "EUR" ? "€" : "$"}
          </span>
          {hide ? (
            <span className="text-[56px] font-semibold tracking-tight">••• ••• ,••</span>
          ) : (
            <>
              <span className="text-[56px] font-semibold tracking-tight leading-none">
                {integer}
              </span>
              <span className="text-[32px] opacity-60">.{decimals}</span>
            </>
          )}
          <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
            {acc.deltaPct != null ? `↑ ${acc.deltaPct > 0 ? "+" : ""}${acc.deltaPct.toFixed(1)}%` : "↑ +0.57%"}
          </span>
        </div>
        <p className="mt-1 text-[12px] text-white/55">
          Available{acc.pending != null ? ` · Pending ${acc.currency === "EUR" ? "€" : "$${acc.pending.toLocaleString()}"}` : ""}{acc.iban ? ` · IBAN ${acc.iban}` : ""}
        </p>

        {/* Area chart */}
        <HeroChart />

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.575_0.215_263)] to-[oklch(0.715_0.135_215)] px-4 py-2.5 text-[12px] font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.655_0.195_258/0.6)] transition-transform hover:-translate-y-0.5">
            <Send className="h-3.5 w-3.5" /> Transfer
          </button>
          {[
            { icon: ArrowDownToLine, label: "Deposit" },
            { icon: HandCoins, label: "Pay" },
            { icon: ArrowLeftRight, label: "Exchange" },
            { icon: Download, label: "Statement" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[12px] text-white/80 transition-colors hover:bg-white/[0.08]"
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function HeroChart() {
  const pts = [38, 44, 40, 52, 48, 58, 54, 64, 60, 70, 66, 78, 74, 84, 80, 92];
  const w = 600;
  const h = 110;
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const coords = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((p - min) / (max - min)) * (h - 12) - 4;
    return [x, y] as const;
  });
  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-5 h-[110px] w-full">
      <defs>
        <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.715 0.135 215 / 0.35)" />
          <stop offset="100%" stopColor="oklch(0.715 0.135 215 / 0)" />
        </linearGradient>
        <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.635 0.215 295)" />
          <stop offset="100%" stopColor="oklch(0.715 0.135 215)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hero-area)" />
      <path d={line} fill="none" stroke="url(#hero-line)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
