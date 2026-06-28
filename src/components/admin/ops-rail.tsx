import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Activity, Users, Wallet, KeyRound, Brain, Shield, AlertOctagon, Radar,
  Cpu, Database, Lightbulb, FileBarChart2, History, Bell, UserCog,
  ScrollText, Network, Server, Settings, ShieldCheck, GitBranch, MessageCircleQuestion
} from "lucide-react";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
type Group = { id: string; title: string; items: Item[] };

const groups: Group[] = [
  {
    id: "pulse",
    title: "Pulse",
    items: [{ to: "/admin", label: "Dashboard", icon: Activity }],
  },
  {
    id: "people",
    title: "People",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/accounts", label: "Accounts", icon: Wallet },
      { to: "/admin/roles", label: "Roles & permissions", icon: UserCog },
    ],
  },
  {
    id: "identity",
    title: "Identity Ops",
    items: [
      { to: "/admin/sessions", label: "Auth sessions", icon: KeyRound },
      { to: "/admin/challenges", label: "Challenge center", icon: ShieldCheck },
      { to: "/admin/behavior", label: "Behavior analytics", icon: Radar },
    ],
  },
  {
    id: "ai",
    title: "AI Core",
    items: [
      { to: "/admin/ai/live", label: "Live AI monitoring", icon: Brain },
      { to: "/admin/ai/models", label: "Model management", icon: Cpu },
      { to: "/admin/ai/datasets", label: "Datasets", icon: Database },
      { to: "/admin/ai/explain", label: "Explainability", icon: Lightbulb },
    ],
  },
  {
    id: "defense",
    title: "Defense",
    items: [
      { to: "/admin/risk", label: "Risk center", icon: Shield },
      { to: "/admin/anomalies", label: "Anomaly detection", icon: AlertOctagon },
      { to: "/admin/audit", label: "Audit logs", icon: ScrollText },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    items: [
      { to: "/admin/api", label: "API health", icon: Network },
      { to: "/admin/infra", label: "Infrastructure", icon: Server },
      { to: "/admin/compliance", label: "Compliance", icon: GitBranch },
      { to: "/admin/reports", label: "Reports", icon: FileBarChart2 },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function OpsRail() {
  return (
    <aside className="fixed left-4 top-4 bottom-4 w-[240px] z-40 flex flex-col rounded-2xl border border-white/[0.06] bg-[oklch(0.16_0.025_264/0.85)] backdrop-blur-2xl shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* Org switcher */}
      <div className="px-4 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl gradient-cyber flex items-center justify-center font-bold text-sm shadow-glow">A</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">AdaptiveGuard</div>
            <div className="text-[10px] text-muted-foreground font-mono">Aurora Bank · prod</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-300/90">PROD · eu-west-1</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {groups.map((g) => (
          <div key={g.id}>
            <div className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 font-mono">{g.title}</div>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const Icon = it.icon;
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      activeOptions={{ exact: it.to === "/admin" }}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-muted-foreground transition-colors",
                        "hover:bg-white/[0.04] hover:text-foreground",
                        "data-[status=active]:bg-white/[0.06] data-[status=active]:text-foreground data-[status=active]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                      )}
                    >
                      <Icon className="size-4 text-muted-foreground group-hover:text-cyan-300 group-data-[status=active]:text-cyan-300 transition-colors" />
                      <span className="truncate">{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Operator footer */}
      <div className="px-3 py-3 border-t border-white/[0.05] flex items-center gap-2">
        <div className="size-8 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-[11px] font-mono">LH</div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate">Lina Halsey</div>
          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400" /> on call · admin
          </div>
        </div>
        <button className="size-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-muted-foreground" title="AI Assistant (⌘J)">
          <MessageCircleQuestion className="size-4" />
        </button>
      </div>
    </aside>
  );
}
