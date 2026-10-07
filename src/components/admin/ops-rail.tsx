import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  Users,
  Wallet,
  KeyRound,
  ShieldAlert,
  Database,
  Cpu,
  FileText,
  Settings,
  ShieldCheck,
  Server,
  LogOut,
} from "lucide-react";
import { useLogout } from "@/services/hooks";
import { cn } from "@/lib/utils";

const ADMIN_GROUPS = [
  {
    title: "Operations & Overview",
    items: [
      { to: "/admin", label: "Operations Dashboard", icon: Activity },
      { to: "/admin/users", label: "User Management", icon: Users },
      { to: "/admin/sessions", label: "Active Sessions", icon: KeyRound },
    ],
  },
  {
    title: "Security & Risk",
    items: [
      { to: "/admin/challenges", label: "Challenge Log", icon: ShieldAlert },
      { to: "/admin/risk", label: "Risk Assessments", icon: ShieldCheck },
      { to: "/admin/anomalies", label: "Anomaly Signatures", icon: Server },
    ],
  },
  {
    title: "AI & ML Governance",
    items: [
      { to: "/admin/ai/live", label: "Live Inference", icon: Cpu },
      { to: "/admin/ai/models", label: "Model Registry", icon: Cpu },
      { to: "/admin/ai/datasets", label: "Dataset Management", icon: Database },
      { to: "/admin/ai/explain", label: "Model Explainability", icon: Activity },
    ],
  },
  {
    title: "Governance & Audit",
    items: [
      { to: "/admin/audit", label: "Audit Logs", icon: FileText },
      { to: "/admin/compliance", label: "Compliance Controls", icon: ShieldCheck },
      { to: "/admin/reports", label: "Enterprise Reports", icon: FileText },
    ],
  },
];

export function OpsRail() {
  const location = useLocation();
  const currentPath = location.pathname;
  const logout = useLogout();

  return (
    <aside className="w-64 fixed top-0 bottom-0 left-0 bg-[#082A5C] text-white flex flex-col z-30 border-r border-[#133D7C]">
      {/* Brand Header */}
      <div className="h-16 border-b border-[#133D7C] px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded bg-[#2563A6] flex items-center justify-center font-bold text-xs text-white">
            AG
          </div>
          <span className="font-semibold text-sm tracking-tight">Admin Operations</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {ADMIN_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="text-[11px] font-semibold text-[#8C9BB5] uppercase tracking-wider mb-2 px-2">
              {group.title}
            </div>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const active = currentPath === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                      active
                        ? "bg-[#0B3A82] text-white font-semibold"
                        : "text-white/80 hover:bg-[#0E3670] hover:text-white",
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-white/70" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Return Link & Sign Out */}
      <div className="p-4 border-t border-[#133D7C] space-y-2">
        <Link
          to="/app"
          className="w-full py-2 px-3 text-xs font-semibold text-center rounded bg-[#0B3A82] hover:bg-[#2563A6] text-white flex items-center justify-center gap-1.5 transition-colors"
        >
          Return to Customer Portal
        </Link>
        <button
          onClick={() => {
            logout.mutateAsync().finally(() => {
              window.location.href = "/auth";
            });
          }}
          className="w-full py-1.5 px-3 text-xs font-medium text-center rounded border border-white/20 hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
