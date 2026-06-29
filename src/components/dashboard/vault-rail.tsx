import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutGrid,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  Send,
  ListOrdered,
  LineChart,
  PieChart,
  ShieldCheck,
  Fingerprint,
  Smartphone,
  Bell,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  FileText,
  PiggyBank,
  Landmark,
  Repeat,
  Sparkles,
  Activity,
} from "lucide-react";
import { Shield } from "@/components/brand/shield";
import { cn } from "@/lib/utils";

type Item = { label: string; icon: typeof LayoutGrid; to: string; badge?: number; kbd?: string };

const PRIMARY: Item[] = [
  { label: "Dashboard", icon: LayoutGrid, to: "/app", kbd: "⌘1" },
  { label: "Accounts", icon: Wallet, to: "/app/accounts", kbd: "⌘2" },
  { label: "Cards", icon: CreditCard, to: "/app/cards", kbd: "⌘3" },
  { label: "Transfer", icon: Send, to: "/app/transfer", kbd: "⌘N" },
  { label: "Payments", icon: ArrowLeftRight, to: "/app/payments", kbd: "⌘4" },
  { label: "Transactions", icon: ListOrdered, to: "/app/transactions", kbd: "⌘5" },
  { label: "Beneficiaries", icon: User, to: "/app/beneficiaries", kbd: "⌘6" },
  { label: "Statements", icon: FileText, to: "/app/statements" },
];

const GROW: Item[] = [
  { label: "Investments", icon: LineChart, to: "/app/investments" },
  { label: "Savings", icon: PiggyBank, to: "/app/savings" },
  { label: "Budgets", icon: PieChart, to: "/app/budgets" },
  { label: "Loans", icon: Landmark, to: "/app/loans" },
  { label: "Exchange", icon: Repeat, to: "/app/exchange" },
];

const INTEL: Item[] = [
  { label: "Insights", icon: Sparkles, to: "/app/insights" },
  { label: "Activity", icon: Activity, to: "/app/activity" },
];

const GUARD: Item[] = [
  { label: "Security Center", icon: ShieldCheck, to: "/app/guard" },
  { label: "Authentication", icon: Fingerprint, to: "/app/guard/authentication" },
  { label: "Devices", icon: Smartphone, to: "/app/guard/devices" },
  { label: "Explainability", icon: Sparkles, to: "/app/guard/explainability" },
  { label: "Privacy", icon: Bell, to: "/app/guard/privacy" },
];

const PERSONAL: Item[] = [
  { label: "Profile", icon: User, to: "/app" },
  { label: "Settings", icon: Settings, to: "/app" },
  { label: "Help", icon: HelpCircle, to: "/app" },
];

export function VaultRail({ variant = "fixed" }: { variant?: "fixed" | "drawer" }) {
  const [expanded, setExpanded] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDrawer = variant === "drawer";

  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        "flex flex-col border-white/[0.06] bg-[oklch(0.225_0.035_264/0.72)] backdrop-blur-2xl",
        isDrawer
          ? "h-full w-full border-r"
          : "fixed left-6 top-6 bottom-6 z-40 rounded-[24px] border shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] transition-[width] duration-[280ms]",
        !isDrawer && (expanded ? "w-[252px]" : "w-[72px]"),
      )}
      style={!isDrawer ? { transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)" } : undefined}
    >
      {/* Crown */}
      <button
        onClick={() => !isDrawer && setExpanded((v) => !v)}
        aria-label={isDrawer ? "AdaptiveGuard" : expanded ? "Collapse navigation" : "Expand navigation"}
        className="group flex items-center gap-2.5 px-4 pt-5 pb-4 text-left min-h-11"
      >
        <Shield size={28} live />
        {(expanded || isDrawer) && (
          <>
            <span className="font-display text-[15px] font-semibold lowercase tracking-tight">
              adaptiveguard<span className="text-accent">.ai</span>
            </span>
            {!isDrawer && (
              <ChevronLeft className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </>
        )}
      </button>

      <div className="mx-3 h-px bg-white/[0.06]" />

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <RailGroup items={PRIMARY} expanded={expanded || isDrawer} pathname={pathname} />
        <Divider />
        {(expanded || isDrawer) && <Label>Grow</Label>}
        <RailGroup items={GROW} expanded={expanded || isDrawer} pathname={pathname} />
        <Divider />
        {(expanded || isDrawer) && <Label>Intelligence</Label>}
        <RailGroup items={INTEL} expanded={expanded || isDrawer} pathname={pathname} />
        <Divider />
        <RailGroup items={GUARD} expanded={expanded || isDrawer} pathname={pathname} />
        <Divider />
        <RailGroup items={PERSONAL} expanded={expanded || isDrawer} pathname={pathname} />
      </nav>

      {/* Foot */}
      <div className="border-t border-white/[0.06] px-3 py-3">
        <div
          className={cn(
            "flex items-center gap-2",
            (expanded || isDrawer) ? "px-2" : "justify-center",
          )}
        >
          <span className="relative grid h-7 w-7 place-items-center">
            <span className="absolute inset-0 rounded-full bg-success/20 [animation:rail-pulse_4s_ease-in-out_infinite]" />
            <span className="relative h-2 w-2 rounded-full bg-success shadow-[0_0_8px_oklch(0.71_0.155_165)]" />
          </span>
          {(expanded || isDrawer) && (
            <div className="leading-tight">
              <div className="text-[11px] font-medium">Aegis · Active</div>
              <div className="text-[10px] text-muted-foreground">99.2% · session A+</div>
            </div>
          )}
          {(expanded || isDrawer) && (
            <button
              aria-label="Sign out"
              className="ml-auto grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes rail-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </aside>
  );
}

function Divider() {
  return <div className="my-3 h-px bg-white/[0.04]" />;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1.5 pt-1 text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60">
      {children}
    </div>
  );
}

function RailGroup({
  items,
  expanded,
  pathname,
}: {
  items: Item[];
  expanded: boolean;
  pathname: string;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((it) => {
        const active = it.to === pathname;
        const Icon = it.icon;
        return (
          <li key={it.label} className="group/item relative">
            <Link
              to={it.to}
              aria-label={it.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] min-h-11 transition-colors",
                active
                  ? "bg-gradient-to-r from-white/[0.08] to-transparent text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-accent to-purple" />
              )}
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {expanded && (
                <>
                  <span className="truncate">{it.label}</span>
                  {it.kbd && (
                    <span
                      aria-hidden
                      className="ml-auto font-numeric text-[10px] text-muted-foreground/60"
                    >
                      {it.kbd}
                    </span>
                  )}
                  {it.badge != null && (
                    <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/20 px-1 text-[10px] font-medium text-accent">
                      {it.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
            {!expanded && (
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[oklch(0.225_0.035_264/0.95)] px-2.5 py-1.5 text-[11px] opacity-0 shadow-xl backdrop-blur-xl transition-opacity duration-150 group-hover/item:opacity-100">
                {it.label}
                {it.kbd && <span className="ml-2 text-muted-foreground">{it.kbd}</span>}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
