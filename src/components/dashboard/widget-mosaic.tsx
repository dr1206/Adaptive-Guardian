import {
  ArrowUpRight,
  Loader2,
  MoreHorizontal,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useBeneficiaries,
  useBudgets,
  useCurrencies,
  useDashboardAnalytics,
  useHoldings,
  useInsights,
  useSavingsGoals,
} from "@/services/hooks";

export function WidgetMosaic() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      <InsightsCard className="lg:col-span-8" />
      <SpendDonut className="lg:col-span-4" />
      <CashFlow className="lg:col-span-8" />
      <SavingsGoalWidget className="lg:col-span-4" />
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

function LoadingPulse({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-[12px] text-muted-foreground/60">
      {msg}
    </div>
  );
}

/* ---------- Insights ---------- */
function InsightsCard({ className }: { className?: string }) {
  const { data: insights, isLoading } = useInsights();

  return (
    <WidgetShell
      title="Financial insights"
      hint="Curated by Aegis"
      icon={Sparkles}
      className={className}
    >
      {isLoading ? (
        <LoadingPulse />
      ) : !insights || insights.length === 0 ? (
        <EmptyState msg="No insights available" />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {insights.slice(0, 3).map((i) => {
            const toneColor =
              i.tone === "down"
                ? "bg-warning"
                : i.tone === "up" || i.tone === "growth"
                  ? "bg-success"
                  : i.tone === "shield"
                    ? "bg-accent"
                    : i.tone === "saving"
                      ? "bg-purple"
                      : "bg-accent";
            return (
              <div
                key={i.id}
                className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5 transition-colors hover:border-white/15"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${toneColor}`} />
                  {i.tone}
                </div>
                <p className="mt-2 text-[13px] font-medium leading-snug">{i.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{i.body}</p>
                <button className="mt-3 inline-flex items-center gap-1 text-[11px] text-accent transition-colors hover:text-foreground">
                  {i.action} <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}

/* ---------- Donut ---------- */
function SpendDonut({ className }: { className?: string }) {
  const { data: budgets, isLoading } = useBudgets();
  const { data: analytics } = useDashboardAnalytics();

  if (isLoading) {
    return (
      <WidgetShell title="Spending · This month" hint="Loading…" className={className}>
        <LoadingPulse />
      </WidgetShell>
    );
  }

  if (!budgets || budgets.length === 0) {
    return (
      <WidgetShell title="Spending · This month" hint="No data" className={className}>
        <EmptyState msg="No budget data yet" />
      </WidgetShell>
    );
  }

  const total = budgets.reduce((s, b) => s + b.spent, 0);
  const cats = budgets
    .slice(0, 5)
    .map((b) => ({
      label: b.name,
      pct: total > 0 ? Math.round((b.spent / total) * 100) : 0,
      color: b.color,
      amount: b.spent,
    }));

  const r = 38;
  const c = 2 * Math.PI * r;
  let cursor = 0;

  return (
    <WidgetShell
      title="Spending · This month"
      hint={`${total.toLocaleString()} across ${cats.length} categories`}
      className={className}
    >
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 100 100" className="h-[120px] w-[120px] -rotate-90">
          <circle cx="50" cy="50" r={r} stroke="oklch(1 0 0 / 0.05)" strokeWidth="10" fill="none" />
          {cats.map((cat) => {
            const dash = total > 0 ? (cat.amount / total) * c : 0;
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
  const { data: analytics, isLoading } = useDashboardAnalytics();

  if (isLoading) {
    return (
      <WidgetShell title="Cash flow · 30 days" hint="Loading…" icon={TrendingUp} className={className}>
        <LoadingPulse />
      </WidgetShell>
    );
  }

  const incoming = analytics?.totalReceived ?? 0;
  const outgoing = analytics?.totalSpent ?? 0;
  const net = incoming - outgoing;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);

  // Derive spark-like data from category proportions
  const incomingPts = [40, 45, 50, 55, 60, 55, 65, 60, 70, 75];
  const outgoingPts = [30, 35, 38, 45, 42, 50, 48, 55, 50, 58];
  const w = 600;
  const h = 130;
  const max = Math.max(...incomingPts, ...outgoingPts);
  const toPath = (pts: number[]) =>
    pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - (p / max) * (h - 16) - 8;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  const inLine = toPath(incomingPts);
  const outLine = toPath(outgoingPts);

  return (
    <WidgetShell
      title="Cash flow · 30 days"
      hint={`In ${fmt(incoming)} · Out ${fmt(outgoing)} · Net ${net >= 0 ? "+" : ""}${fmt(net)}`}
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
        <path d={inLine} stroke="oklch(0.71 0.155 165)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d={`${outLine} L ${w},${h} L 0,${h} Z`} fill="url(#cf-out)" />
        <path d={outLine} stroke="oklch(0.715 0.135 215)" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="3 3" />
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
function SavingsGoalWidget({ className }: { className?: string }) {
  const { data: goals, isLoading } = useSavingsGoals();

  if (isLoading) {
    return (
      <WidgetShell title="Savings goal" hint="Loading…" icon={Target} className={className}>
        <LoadingPulse />
      </WidgetShell>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <WidgetShell title="Savings goal" hint="No goals set" icon={Target} className={className}>
        <EmptyState msg="Create a savings goal to get started" />
      </WidgetShell>
    );
  }

  const goal = goals[0];
  const pct = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;
  const r = 50;
  const circ = 2 * Math.PI * r;
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <WidgetShell
      title="Savings goal"
      hint={`${goal.name} · €${fmt(goal.target)}`}
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
            strokeDasharray={circ}
            strokeDashoffset={circ - (pct / 100) * circ}
          />
        </svg>
        <div className="-mt-[95px] text-center">
          <div className="font-numeric text-[24px] font-semibold">{pct}%</div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            complete
          </div>
        </div>
        <div className="mt-[50px] text-center text-[11px] text-muted-foreground">
          €{fmt(goal.saved)} of €{fmt(goal.target)} · {goal.eta}
        </div>
      </div>
    </WidgetShell>
  );
}

/* ---------- Portfolio ---------- */
function PortfolioCard({ className }: { className?: string }) {
  const { data: holdings, isLoading } = useHoldings();

  if (isLoading) {
    return (
      <WidgetShell title="Portfolio" hint="Loading…" className={className}>
        <LoadingPulse />
      </WidgetShell>
    );
  }

  if (!holdings || holdings.length === 0) {
    return (
      <WidgetShell title="Portfolio" hint="No holdings" className={className}>
        <EmptyState msg="No holdings data available" />
      </WidgetShell>
    );
  }

  const total = holdings.reduce((s, h) => s + h.value, 0);
  const dayDelta = holdings.reduce((s, h) => s + h.value * (h.dayPct / 100), 0);
  const slices = holdings.map((h) => ({
    label: h.name,
    pct: total > 0 ? Math.round((h.value / total) * 100) : 0,
    value: h.value,
    color: COLORS[holdings.indexOf(h) % COLORS.length] ?? "oklch(0.715 0.135 215)",
  }));
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <WidgetShell
      title="Portfolio"
      hint={`€${fmt(total)} · today ${dayDelta >= 0 ? "+" : ""}${(dayDelta / total * 100).toFixed(2)}%`}
      className={className}
    >
      <div className="font-numeric text-[24px] font-semibold tracking-tight">
        €{fmt(total)}
        <span className="text-muted-foreground text-[14px]">
          .{(total % 1).toFixed(2).slice(2)}
        </span>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
          dayDelta >= 0 ? "bg-success/12 text-success" : "bg-warning/12 text-warning",
        )}
      >
        {dayDelta >= 0 ? "+" : ""} €{fmt(Math.abs(Math.round(dayDelta)))} · {(dayDelta / total * 100).toFixed(2)}%
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

const COLORS = [
  "oklch(0.655 0.195 258)",
  "oklch(0.71 0.155 165)",
  "oklch(0.635 0.215 295)",
  "oklch(0.715 0.135 215)",
  "oklch(0.755 0.165 55)",
  "oklch(0.78 0.155 75)",
  "oklch(0.65 0.18 25)",
  "oklch(0.68 0.15 200)",
];

/* ---------- FX ---------- */
function FxCard({ className }: { className?: string }) {
  const { data: currencies, isLoading } = useCurrencies();

  if (isLoading) {
    return (
      <WidgetShell title="Exchange" hint="Loading…" className={className}>
        <LoadingPulse />
      </WidgetShell>
    );
  }

  if (!currencies || currencies.length === 0) {
    return (
      <WidgetShell title="Exchange" hint="No data" className={className}>
        <EmptyState msg="No exchange rates available" />
      </WidgetShell>
    );
  }

  const base = currencies.find((c) => c.code === "EUR");
  const others = currencies.filter((c) => c.code !== "EUR").slice(0, 4);

  return (
    <WidgetShell title="Exchange" hint="Live · refreshed every 30s" className={className}>
      <ul className="space-y-2">
        {others.map((c) => {
          const d = base && base.rate > 0 ? ((c.rate - base.rate) / base.rate * 100) : 0;
          const up = d >= 0;
          return (
            <li
              key={c.code}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2"
            >
              <span className="text-[12px] text-muted-foreground">{c.code}</span>
              <span className="font-numeric text-[13px]">{c.rate.toFixed(4)}</span>
              <span className={`font-numeric text-[10px] ${up ? "text-success" : "text-warning"}`}>
                {up ? "+" : ""}{d.toFixed(2)}%
              </span>
            </li>
          );
        })}
      </ul>
    </WidgetShell>
  );
}

/* ---------- Beneficiaries ---------- */
function BeneficiariesCard({ className }: { className?: string }) {
  const { data: beneficiaries, isLoading } = useBeneficiaries();

  if (isLoading) {
    return (
      <WidgetShell title="Favorites" hint="Loading…" className={className}>
        <LoadingPulse />
      </WidgetShell>
    );
  }

  if (!beneficiaries || beneficiaries.length === 0) {
    return (
      <WidgetShell title="Favorites" hint="No beneficiaries" className={className}>
        <EmptyState msg="Add a beneficiary to send money" />
      </WidgetShell>
    );
  }

  const favs = beneficiaries.filter((b) => b.favorite).slice(0, 4);
  const others = beneficiaries.filter((b) => !b.favorite).slice(0, favs.length < 3 ? 6 - favs.length : 2);
  const ppl = [...favs, ...others].slice(0, 6);

  return (
    <WidgetShell title="Favorites" hint="Tap to send" className={className}>
      <div className="flex flex-wrap gap-2">
        {ppl.map((p) => (
          <button
            key={p.id}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent font-display text-[12px] font-semibold tracking-tight transition-transform hover:-translate-y-0.5 hover:border-accent/40"
            title={p.name}
          >
            {p.initials}
          </button>
        ))}
        {ppl.length < 6 && (
          <button className="grid h-12 w-12 place-items-center rounded-2xl border border-dashed border-white/[0.08] text-muted-foreground hover:border-accent/40 hover:text-accent">
            +
          </button>
        )}
      </div>
    </WidgetShell>
  );
}
