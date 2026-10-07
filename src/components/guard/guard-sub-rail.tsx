import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Fingerprint,
  Smartphone,
  AlertTriangle,
  History,
  Activity,
  Cpu,
  Lock,
} from "lucide-react";

const GUARD_TABS = [
  { label: "Overview", to: "/app/guard", icon: ShieldCheck },
  { label: "Continuous Authentication", to: "/app/guard/authentication", icon: Lock },
  { label: "Behavior Analytics", to: "/app/guard/behavior", icon: Activity },
  { label: "Typing Biometrics", to: "/app/guard/typing", icon: Fingerprint },
  { label: "Trusted Devices", to: "/app/guard/devices", icon: Smartphone },
  { label: "Security Challenges", to: "/app/guard/challenges", icon: AlertTriangle },
  { label: "Adaptive Learning", to: "/app/guard/learning", icon: Cpu },
  { label: "Audit Timeline", to: "/app/guard/auth-timeline", icon: History },
];

export function GuardSubRail() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="mb-8 border-b border-[#D9E1EA] bg-white rounded-lg p-2 shadow-xs">
      <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Security Sub-navigation">
        {GUARD_TABS.map((tab) => {
          const active = currentPath === tab.to;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-[#0B3A82] text-white font-semibold"
                  : "text-[#667085] hover:text-[#0B3A82] hover:bg-[#EEF2F6]",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
