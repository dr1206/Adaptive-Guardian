import { useEffect, useState } from "react";
import { Search, Command, Bell, ChevronRight } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { SignalDot } from "./signal-dot";

const breadcrumbMap: Record<string, string> = {
  admin: "Cockpit",
  users: "Users",
  accounts: "Accounts",
  roles: "Roles & permissions",
  sessions: "Auth sessions",
  challenges: "Challenge center",
  behavior: "Behavior analytics",
  ai: "AI Core",
  live: "Live monitoring",
  models: "Model management",
  datasets: "Datasets",
  explain: "Explainability",
  risk: "Risk center",
  anomalies: "Anomaly detection",
  audit: "Audit logs",
  notifications: "Notifications",
  api: "API health",
  infra: "Infrastructure",
  compliance: "Compliance",
  reports: "Reports",
  settings: "Settings",
};

export function OpsTopBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const segs = path.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 bg-[oklch(0.16_0.025_264/0.75)] backdrop-blur-xl border-b border-white/[0.05]">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="hidden md:flex items-center gap-1.5 text-sm min-w-0"
        >
          {segs.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" aria-hidden />
              )}
              <span
                className={
                  i === segs.length - 1
                    ? "text-foreground font-medium truncate"
                    : "text-muted-foreground truncate"
                }
              >
                {breadcrumbMap[s] ?? s}
              </span>
            </span>
          ))}
        </nav>

        {/* Search */}
        <div className="flex-1 md:ml-4 min-w-0 md:max-w-2xl">
          <label htmlFor="ops-search" className="sr-only">
            Search
          </label>
          <button
            id="ops-search"
            className="w-full group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.12] px-3.5 py-2.5 text-left transition-colors min-h-11"
          >
            <Search className="size-3.5 text-muted-foreground shrink-0" aria-hidden />
            <span className="text-xs text-muted-foreground flex-1 truncate">
              <span className="hidden sm:inline">
                Search users · sessions · models · logs · runbooks…
              </span>
              <span className="sm:hidden">Search…</span>
            </span>
            <kbd
              aria-hidden
              className="hidden sm:inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
            >
              <Command className="size-3" />K
            </kbd>
          </button>
        </div>

        {/* System pulse */}
        <SystemPulseCluster />

        {/* Incidents */}
        <button
          aria-label="Incidents (3 active)"
          className="relative size-11 shrink-0 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] flex items-center justify-center transition-colors"
        >
          <Bell className="size-4 text-muted-foreground" aria-hidden />
          <span className="absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 text-[10px] font-mono flex items-center justify-center text-white">
            3
          </span>
        </button>
      </div>
    </header>
  );
}

function SystemPulseCluster() {
  const items: { label: string; signal: "ok" | "watch" | "alert" | "critical" }[] = [
    { label: "API", signal: "ok" },
    { label: "ML", signal: "watch" },
    { label: "DB", signal: "ok" },
    { label: "Queue", signal: "ok" },
  ];
  return (
    <div
      aria-label="System health"
      className="hidden lg:flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 shrink-0"
    >
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5 px-1.5">
          <SignalDot signal={it.signal} />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function OpsStatusBar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-30 h-6 bg-[oklch(0.14_0.025_264/0.95)] backdrop-blur border-t border-white/[0.05] items-center justify-between px-4 text-[10px] font-mono text-muted-foreground/80">
      <div className="flex items-center gap-4 overflow-x-auto">
        <span className="text-emerald-300 shrink-0">● PROD</span>
        <span className="shrink-0">14 incidents</span>
        <span className="shrink-0">99.97% uptime</span>
        <span className="shrink-0 hidden lg:inline">model v2.4.1</span>
        <span className="shrink-0 hidden lg:inline">last deploy 6h ago</span>
        <span className="shrink-0 hidden lg:inline">12 ops online</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden lg:inline">aegis pulse 1.24k/s</span>
        <span className="text-foreground/80">{now.toISOString().slice(11, 19)} UTC</span>
      </div>
    </div>
  );
}
