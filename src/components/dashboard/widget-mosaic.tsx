import { ArrowUpRight, MoreHorizontal, Sparkles, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function WidgetMosaic() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      <InsightsCard className="lg:col-span-8" />
      <SpendDonut className="lg:col-span-4" />
      <CashFlow className="lg:col-span-8" />
      <SavingsGoal className="lg:col-span-4" />
      <PortfolioCard className="lg:col-span-4" />
      <FxCard className="lg:col-span-4" />
      <BeneficiariesCard className="lg:col-span-4" />
    </div>
  );
}

function WidgetShell({
  title,
  hint,
  children,
  className,
  icon: Icon,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  icon?: typeof Sparkles;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 backdrop-blur-xl transition-colors hover:border-white/15",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.04] text-accent">
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          <div>
            <h3 className="font-display text-[14px] font-semibold tracking-tight">{title}</h3>
            {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
          </div>
        </div>
        <button className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground/60 opacity-0 transition-opacity hover:bg-white/5 hover:text-foreground group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </header>
      <div className="mt-4 flex-1">{children}</div>
    </article>
  );
}

/* ---------- Insights ---------- */
function InsightsCard({ className }: { className?: string }) {
  const insights = [
    {
      tag: "Behavioral",
      title: "Your dining spend is up 18% this week",
      meta: "Compared to your 30-day average",
      tone: "purple",
    },
    {
      tag: "Savings",
      title: "You're €840 ahead of June's savings pace",
      meta: "Projected to overshoot by 12%",
      tone: "success",
    },
    {
      tag: "FX",
      title: "EUR/USD is at a 30-day high",
      meta: "Good time to top up your USD pocket",
      tone: "accent",
    },
  ];
  return (
    <WidgetShell
      title="Financial insights"
      hint="Curated by Aegis · updated 6m ago"
      icon={Sparkles}
      className={className}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {insights.map((i) => {
          const dot =
            i.tone === "purple" ? "bg-purple" : i.tone === "success" ? "bg-success" : "bg-accent";
          return (
            <div
              key={i.title}
              className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5 transition-colors hover:border-white/15"
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                {i.tag}
              </div>
              <p className="mt-2 text-[13px] font-medium leading-snug">{i.title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{i.meta}</p>
              <button className="mt-3 inline-flex items-center gap-1 text-[11px] text-accent transition-colors hover:text-foreground">
                Explore <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}

/* ---------- Donut ---------- */
function SpendDonut({ className }: { className?: string }) {
  const cats = [
    { label: "Food", pct: 32, color: "oklch(0.715 0.135 215)", amount: 2940 },
    { label: "Transport", pct: 18, color: "oklch(0.635 0.215 295)", amount: 1652 },
    { label: "Home", pct: 22, color: "oklch(0.655 0.195 258)", amount: 2020 },
    { label: "Lifestyle", pct: 16, color: "oklch(0.755 0.165 55)", amount: 1469 },
    { label: "Other", pct: 12, color: "oklch(0.71 0.155 165)", amount: 1103 },
  ];
  let cursor = 0;
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <WidgetShell title="Spending · June" hint="€9,184 across 5 categories" className={className}>
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 100 100" className="h-[120px] w-[120px] -rotate-90">
          <circle cx="50" cy="50" r={r} stroke="oklch(1 0 0 / 0.05)" strokeWidth="10" fill="none" />
          {cats.map((cat) => {
            const dash = (cat.pct / 100) * c;
            const seg = (
              <circle
                key={cat.label}
                cx="50"
                cy="50"
                r={r}
                stroke={cat.color}
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-cursor}
                strokeLinecap="butt"
              />
            );
            cursor += dash;
            return seg;
          })}
        </svg>
        <ul className="flex-1 space-y-1.5 text-[12px]">
          {cats.map((cat) => (
            <li key={cat.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm" style={{ background: cat.color }} />
                {cat.label}
              </span>
              <span className="font-numeric">
                {cat.pct}%{" "}
                <span className="text-muted-foreground">· €{cat.amount.toLocaleString()}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </WidgetShell>
  );
}

/* ---------- Cash flow ---------- */
function CashFlow({ className }: { className?: string }) {
  const incoming = [40, 60, 45, 75, 55, 80, 65, 88, 70, 90];
  const outgoing = [30, 35, 38, 50, 42, 55, 48, 62, 50, 60];
  const w = 600;
  const h = 130;
  const max = Math.max(...incoming, ...outgoing);
  const toPath = (pts: number[]) =>
    pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - (p / max) * (h - 16) - 8;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  const inLine = toPath(incoming);
  const outLine = toPath(outgoing);
  return (
    <WidgetShell
      title="Cash flow · 30 days"
      hint="In €14,230 · Out €9,184 · Net +€5,046"
      icon={TrendingUp}
      className={className}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[150px] w-full">
        <defs>
          <linearGradient id="cf-in" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.71 0.155 165 / 0.35)" />
            <stop offset="100%" stopColor="oklch(0.71 0.155 165 / 0)" />
          </linearGradient>
          <linearGradient id="cf-out" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.715 0.135 215 / 0.25)" />
            <stop offset="100%" stopColor="oklch(0.715 0.135 215 / 0)" />
          </linearGradient>
        </defs>
        <path d={`${inLine} L ${w},${h} L 0,${h} Z`} fill="url(#cf-in)" />
        <path
          d={inLine}
          stroke="oklch(0.71 0.155 165)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path d={`${outLine} L ${w},${h} L 0,${h} Z`} fill="url(#cf-out)" />
        <path
          d={outLine}
          stroke="oklch(0.715 0.135 215)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="3 3"
        />
      </svg>
      <div className="mt-2 flex gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" /> Incoming
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" /> Outgoing
        </span>
      </div>
    </WidgetShell>
  );
}

/* ---------- Savings goal ---------- */
function SavingsGoal({ className }: { className?: string }) {
  const pct = 78;
  const r = 50;
  const c = 2 * Math.PI * r;
  return (
    <WidgetShell
      title="Savings goal"
      hint="Lisbon apartment · €80,000"
      icon={Target}
      className={className}
    >
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 120 120" className="h-[150px] w-[150px] -rotate-90">
          <circle cx="60" cy="60" r={r} stroke="oklch(1 0 0 / 0.06)" strokeWidth="8" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={r}
            stroke="oklch(0.635 0.215 295)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (pct / 100) * c}
          />
        </svg>
        <div className="-mt-[95px] text-center">
          <div className="font-numeric text-[24px] font-semibold">{pct}%</div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            complete
          </div>
        </div>
        <div className="mt-[50px] text-center text-[11px] text-muted-foreground">
          €62,400 of €80,000 · ETA Q4 2026
        </div>
      </div>
    </WidgetShell>
  );
}

/* ---------- Portfolio ---------- */
function PortfolioCard({ className }: { className?: string }) {
  const slices = [
    { label: "Equities", pct: 54, color: "oklch(0.655 0.195 258)" },
    { label: "Bonds", pct: 22, color: "oklch(0.71 0.155 165)" },
    { label: "Crypto", pct: 14, color: "oklch(0.635 0.215 295)" },
    { label: "Cash", pct: 10, color: "oklch(0.715 0.135 215)" },
  ];
  return (
    <WidgetShell title="Portfolio" hint="€2.48M · today + 0.84%" className={className}>
      <div className="font-numeric text-[24px] font-semibold tracking-tight">
        €2,480,120<span className="text-muted-foreground text-[14px]">.55</span>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-medium text-success">
        + €20,851 · 0.84%
      </span>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full">
        {slices.map((s) => (
          <span key={s.label} style={{ width: `${s.pct}%`, background: s.color }} />
        ))}
      </div>
      <ul className="mt-3 space-y-1 text-[11px]">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-numeric">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}

/* ---------- FX ---------- */
function FxCard({ className }: { className?: string }) {
  const rates = [
    { pair: "EUR / USD", rate: "1.0942", d: "+0.31%", up: true },
    { pair: "EUR / GBP", rate: "0.8521", d: "−0.12%", up: false },
    { pair: "EUR / CHF", rate: "0.9512", d: "+0.04%", up: true },
    { pair: "BTC / EUR", rate: "62,140", d: "+1.82%", up: true },
  ];
  return (
    <WidgetShell title="Exchange" hint="Live · refreshed every 30s" className={className}>
      <ul className="space-y-2">
        {rates.map((r) => (
          <li
            key={r.pair}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2"
          >
            <span className="text-[12px] text-muted-foreground">{r.pair}</span>
            <span className="font-numeric text-[13px]">{r.rate}</span>
            <span className={`font-numeric text-[10px] ${r.up ? "text-success" : "text-warning"}`}>
              {r.d}
            </span>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}

/* ---------- Beneficiaries ---------- */
function BeneficiariesCard({ className }: { className?: string }) {
  const ppl = ["AM", "CN", "RV", "SK", "JD", "TP"];
  return (
    <WidgetShell title="Favorites" hint="Tap to send" className={className}>
      <div className="flex flex-wrap gap-2">
        {ppl.map((p) => (
          <button
            key={p}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent font-display text-[12px] font-semibold tracking-tight transition-transform hover:-translate-y-0.5 hover:border-accent/40"
          >
            {p}
          </button>
        ))}
        <button className="grid h-12 w-12 place-items-center rounded-2xl border border-dashed border-white/[0.08] text-muted-foreground hover:border-accent/40 hover:text-accent">
          +
        </button>
      </div>
    </WidgetShell>
  );
}
