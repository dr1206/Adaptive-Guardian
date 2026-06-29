import { TrendingDown, TrendingUp, Calendar, Shield, PiggyBank, LineChart } from "lucide-react";

const TONE: Record<string, { icon: React.ReactNode; color: string }> = {
  down: { icon: <TrendingDown className="h-4 w-4" />, color: "oklch(0.71 0.155 165)" },
  up: { icon: <TrendingUp className="h-4 w-4" />, color: "oklch(0.78 0.155 75)" },
  calendar: { icon: <Calendar className="h-4 w-4" />, color: "oklch(0.715 0.135 215)" },
  shield: { icon: <Shield className="h-4 w-4" />, color: "oklch(0.715 0.135 215)" },
  saving: { icon: <PiggyBank className="h-4 w-4" />, color: "oklch(0.635 0.215 295)" },
  growth: { icon: <LineChart className="h-4 w-4" />, color: "oklch(0.71 0.155 165)" },
};

export function InsightCard({
  tone,
  title,
  body,
  action,
}: {
  tone: string;
  title: string;
  body: string;
  action?: string;
}) {
  const t = TONE[tone] ?? TONE.shield;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-accent/20">
      <div
        className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-30 blur-2xl"
        style={{ background: t.color }}
      />
      <div className="relative">
        <div
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]"
          style={{ color: t.color }}
        >
          <span
            className="grid h-6 w-6 place-items-center rounded-lg"
            style={{ background: `${t.color}25` }}
          >
            {t.icon}
          </span>
          Aegis insight
        </div>
        <h3 className="mt-3 font-display text-[15px] font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{body}</p>
        {action && (
          <button className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:text-accent/80">
            {action} →
          </button>
        )}
      </div>
    </article>
  );
}
