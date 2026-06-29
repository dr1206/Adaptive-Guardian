import { useState } from "react";
import { CalendarClock, ShieldCheck, Sparkles, X } from "lucide-react";

const SEED = [
  {
    id: "device",
    icon: ShieldCheck,
    tone: "accent",
    title: "New device verified",
    meta: "Lisbon · MacBook Pro · 14:18",
    action: "Acknowledge",
  },
  {
    id: "rent",
    icon: CalendarClock,
    tone: "warning",
    title: "Rent due in 2 days",
    meta: "€1,420 · Landlord Carvalho",
    action: "Pay now",
  },
  {
    id: "insight",
    icon: Sparkles,
    tone: "purple",
    title: "Dining spend trending +18% this week",
    meta: "Aegis insight · review",
    action: "Open",
  },
] as const;

export function AttentionLane() {
  const [items, setItems] = useState([...SEED]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] px-4 py-3 text-[12px] text-muted-foreground">
        <span className="text-accent">Aegis · </span>Nothing needs you right now.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {items.map((it) => {
        const Icon = it.icon;
        const ring =
          it.tone === "warning"
            ? "from-warning/20 to-transparent border-warning/20"
            : it.tone === "purple"
              ? "from-purple/20 to-transparent border-purple/20"
              : "from-accent/20 to-transparent border-accent/20";
        const iconColor =
          it.tone === "warning"
            ? "text-warning"
            : it.tone === "purple"
              ? "text-purple"
              : "text-accent";
        return (
          <div
            key={it.id}
            className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-gradient-to-r ${ring} px-4 py-3`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] ${iconColor}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-medium">{it.title}</div>
              <div className="truncate text-[11px] text-muted-foreground">{it.meta}</div>
            </div>
            <button className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/[0.08]">
              {it.action}
            </button>
            <button
              onClick={() => setItems((arr) => arr.filter((a) => a.id !== it.id))}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
