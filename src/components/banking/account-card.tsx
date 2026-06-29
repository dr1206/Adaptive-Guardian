import { Link } from "@tanstack/react-router";
import { Snowflake, Send, FileText, MoreHorizontal } from "lucide-react";
import type { Account } from "@/services/banking/banking.contract";
import { fmt } from "@/lib/format";
import { Sparkline } from "./sparkline";

const FINISH: Record<Account["type"], { bg: string; accent: string }> = {
  primary: { bg: "linear-gradient(135deg,#1a1d24 0%,#0c0e12 60%,#23262d 100%)", accent: "#9aa3b2" },
  savings: { bg: "linear-gradient(135deg,#3a2f1f 0%,#1a1410 55%,#5a4628 100%)", accent: "#d6b66a" },
  investment: { bg: "linear-gradient(135deg,#1c1a3a 0%,#0f0d24 55%,#332d5e 100%)", accent: "#b4a7ff" },
  credit: { bg: "linear-gradient(135deg,#222428 0%,#101113 60%,#2e3138 100%)", accent: "#9aa3b2" },
  business: { bg: "linear-gradient(135deg,#262a32 0%,#13161b 60%,#3a404a 100%)", accent: "#cdd3e0" },
  fixed: { bg: "linear-gradient(135deg,#0e2a26 0%,#06120f 60%,#163b34 100%)", accent: "#6fe0c2" },
};

export function AccountCard({ account }: { account: Account }) {
  const f = FINISH[account.type];
  const positive = account.deltaPct >= 0;
  return (
    <Link
      to="/app/accounts/$id"
      params={{ id: account.id }}
      className="group relative block w-[320px] shrink-0 overflow-hidden rounded-[20px] border border-white/[0.06] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/30"
      style={{
        background: f.bg,
        boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      {/* etched grid */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" viewBox="0 0 320 200">
        <defs>
          <pattern id={`acc-${account.id}-etch`} width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" stroke={f.accent} strokeWidth="0.3" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#acc-${account.id}-etch)`} />
      </svg>

      <header className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: f.accent, opacity: 0.7 }}>
            {account.name} · {account.currency}
          </div>
        </div>
        <div className="font-numeric text-[10px] uppercase tracking-[0.18em]" style={{ color: f.accent, opacity: 0.55 }}>
          IBAN ••{account.iban.slice(-4)}
        </div>
      </header>

      <div className="mt-5 flex items-end justify-between">
        <div className="font-numeric text-[28px] font-semibold tracking-tight" style={{ color: f.accent }}>
          {fmt(account.balance)}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${positive ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}
        >
          {positive ? "↑" : "↓"} {Math.abs(account.deltaPct).toFixed(2)}%
        </span>
      </div>

      <div className="mt-3 -mx-1">
        <Sparkline points={account.spark} width={296} height={36} color={f.accent} />
      </div>

      <footer className="mt-3 flex items-center justify-between text-[10px]" style={{ color: f.accent, opacity: 0.7 }}>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Active · refreshed 14:32
        </span>
        <div className="flex items-center gap-1">
          <Action icon={<Send className="h-3 w-3" />} />
          <Action icon={<FileText className="h-3 w-3" />} />
          <Action icon={<Snowflake className="h-3 w-3" />} />
          <Action icon={<MoreHorizontal className="h-3 w-3" />} />
        </div>
      </footer>
    </Link>
  );
}

function Action({ icon }: { icon: React.ReactNode }) {
  return (
    <span className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.05] transition-colors hover:bg-white/[0.12]">
      {icon}
    </span>
  );
}
