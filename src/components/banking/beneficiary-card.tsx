import { Link } from "@tanstack/react-router";
import { Star, Send, MoreHorizontal, Pencil } from "lucide-react";
import type { Beneficiary } from "@/lib/banking-data";
import { fmt } from "@/lib/banking-data";

export function BeneficiaryCard({ b }: { b: Beneficiary }) {
  return (
    <article className="group relative rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-[13px] font-semibold"
          style={{
            background: `oklch(0.355 0.08 ${b.tint} / 0.7)`,
            color: `oklch(0.95 0.04 ${b.tint})`,
            boxShadow: `0 0 0 1px oklch(1 0 0 / 0.06) inset`,
          }}
        >
          {b.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-[14px] font-semibold">{b.name}</h3>
            {b.favorite && <Star className="h-3 w-3 fill-warning text-warning" />}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {b.bank} · ••{b.last4}
          </div>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        {b.lastSent ? (
          <>
            Last sent <span className="font-numeric text-foreground">{fmt(b.lastSent.amount)}</span> · {b.lastSent.date}
          </>
        ) : (
          <span className="italic opacity-70">No transfers yet</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <Link
          to="/app/transfer"
          search={{ to: b.id }}
          className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-accent/20 to-purple/15 text-[11px] font-medium text-accent transition-colors hover:from-accent/30 hover:to-purple/25"
        >
          <Send className="h-3 w-3" /> Transfer
        </Link>
        <button className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground">
          <Pencil className="h-3 w-3" />
        </button>
        <button className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground">
          <MoreHorizontal className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
}
