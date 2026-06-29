import { Shield } from "@/components/brand/shield";
import { cn } from "@/lib/utils";
import type { BankCard as TCard } from "@/services/banking/banking.contract";

const FINISH: Record<TCard["finish"], { bg: string; accent: string }> = {
  obsidian: { bg: "linear-gradient(135deg,#1a1d24 0%,#0c0e12 60%,#23262d 100%)", accent: "#cdd3e0" },
  champagne: { bg: "linear-gradient(135deg,#3a2f1f 0%,#1a1410 55%,#5a4628 100%)", accent: "#d6b66a" },
  iris: { bg: "linear-gradient(135deg,#1c1a3a 0%,#0f0d24 55%,#332d5e 100%)", accent: "#b4a7ff" },
  graphite: { bg: "linear-gradient(135deg,#222428 0%,#101113 60%,#2e3138 100%)", accent: "#9aa3b2" },
  platinum: { bg: "linear-gradient(135deg,#262a32 0%,#13161b 60%,#3a404a 100%)", accent: "#cdd3e0" },
};

export function BankCard({
  card,
  size = "md",
  className,
}: {
  card: TCard;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const f = FINISH[card.finish];
  const dims = size === "lg" ? "w-[440px]" : size === "sm" ? "w-[200px]" : "w-[340px]";
  return (
    <div
      className={cn("group relative aspect-[1.586/1] shrink-0 [perspective:1200px]", dims, className)}
    >
      <div
        className="relative h-full w-full rounded-[20px] transition-transform duration-500"
        style={{
          background: f.bg,
          boxShadow:
            "0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 1px 0 rgba(255,255,255,0.1) inset",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[20px] opacity-60"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.08) 45%, transparent 60%)",
          }}
        />
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-10" viewBox="0 0 400 252">
          <defs>
            <pattern id={`card-${card.id}-etch`} width="14" height="14" patternUnits="userSpaceOnUse">
              <path d="M 14 0 L 0 0 0 14" stroke={f.accent} strokeWidth="0.3" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#card-${card.id}-etch)`} />
        </svg>

        {card.frozen && (
          <div className="absolute inset-0 grid place-items-center rounded-[20px] bg-accent/10 backdrop-blur-sm">
            <span className="rounded-full bg-[oklch(0.13_0.025_264/0.7)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
              ❄ Frozen
            </span>
          </div>
        )}

        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Shield size={18} />
              <span className="font-display text-[12px] font-semibold lowercase" style={{ color: f.accent }}>
                adaptiveguard
              </span>
            </div>
            <span className="font-numeric text-[9px] uppercase tracking-[0.22em]" style={{ color: f.accent, opacity: 0.7 }}>
              {card.label}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-3 font-numeric text-[16px] tracking-[0.18em]" style={{ color: f.accent }}>
              <span>••••</span>
              <span>••••</span>
              <span>••••</span>
              <span>{card.last4}</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="font-numeric text-[8px] uppercase tracking-[0.2em]" style={{ color: f.accent, opacity: 0.55 }}>
                  Card holder
                </div>
                <div className="font-display text-[11px] font-semibold tracking-wide" style={{ color: f.accent }}>
                  {card.holder}
                </div>
              </div>
              <div className="text-right">
                <div className="font-numeric text-[8px] uppercase tracking-[0.2em]" style={{ color: f.accent, opacity: 0.55 }}>
                  Exp
                </div>
                <div className="font-numeric text-[11px]" style={{ color: f.accent }}>
                  {card.exp}
                </div>
              </div>
              <div className="font-display text-[16px] italic font-bold uppercase" style={{ color: f.accent, opacity: 0.85 }}>
                {card.network === "visa" ? "VISA" : "MC"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
