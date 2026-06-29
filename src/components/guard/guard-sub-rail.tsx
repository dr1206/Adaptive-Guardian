import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const GROUPS: { label: string; items: { label: string; to: string }[] }[] = [
  {
    label: "Overview",
    items: [{ label: "Security Center", to: "/app/guard" }],
  },
  {
    label: "Identity",
    items: [
      { label: "Authentication", to: "/app/guard/authentication" },
      { label: "Devices", to: "/app/guard/devices" },
      { label: "Challenges", to: "/app/guard/challenges" },
      { label: "Auth Timeline", to: "/app/guard/auth-timeline" },
    ],
  },
  {
    label: "Behavior",
    items: [
      { label: "Analytics", to: "/app/guard/behavior" },
      { label: "Typing", to: "/app/guard/typing" },
      { label: "Mouse", to: "/app/guard/mouse" },
      { label: "Session", to: "/app/guard/session" },
      { label: "Timeline", to: "/app/guard/behavior-timeline" },
      { label: "Adaptive Learning", to: "/app/guard/learning" },
    ],
  },
  {
    label: "Decisions",
    items: [
      { label: "AI Decisions", to: "/app/guard/decisions" },
      { label: "Explainability", to: "/app/guard/explainability" },
      { label: "Risk Center", to: "/app/guard/risk" },
    ],
  },
  {
    label: "Trust",
    items: [
      { label: "Privacy", to: "/app/guard/privacy" },
      { label: "Reports", to: "/app/guard/reports" },
    ],
  },
];

export function GuardSubRail() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="sticky top-[72px] z-30 -mx-1 mb-6 mt-2 flex items-center gap-3 overflow-x-auto rounded-2xl border border-white/[0.06] bg-[oklch(0.13_0.025_264/0.72)] px-3 py-2 backdrop-blur-2xl"
      aria-label="Guard navigation"
    >
      {GROUPS.map((g, gi) => (
        <div key={g.label} className="flex items-center gap-1.5">
          {gi > 0 && <span className="mx-1 h-3 w-px bg-white/[0.06]" />}
          <span className="px-1 text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60">
            {g.label}
          </span>
          {g.items.map((it) => {
            const active =
              pathname === it.to || (it.to !== "/app/guard" && pathname.startsWith(it.to));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "relative whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] transition-colors",
                  active
                    ? "bg-white/[0.08] text-foreground"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute inset-x-3 -bottom-[3px] h-[2px] rounded-full bg-gradient-to-r from-accent to-purple" />
                )}
                {it.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
