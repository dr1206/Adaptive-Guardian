import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar as CalIcon, List, Pause, Pencil, X } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { InsightCard } from "@/components/banking/insight-card";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import { usePayments } from "@/services/hooks";
import type { Payment } from "@/services/banking/banking.contract";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const [view, setView] = useState<"timeline" | "calendar">("timeline");
  const { data: payments, isLoading, error } = usePayments();
  const list = payments ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Payments"
        subtitle="Recurring, bills, and subscriptions."
        actions={
          <div className="inline-flex rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
            <ViewBtn
              active={view === "timeline"}
              onClick={() => setView("timeline")}
              icon={<List className="h-3.5 w-3.5" />}
              label="Timeline"
            />
            <ViewBtn
              active={view === "calendar"}
              onClick={() => setView("calendar")}
              icon={<CalIcon className="h-3.5 w-3.5" />}
              label="Calendar"
            />
          </div>
        }
      />

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={list.length === 0}
        emptyLabel="No scheduled payments."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            {view === "timeline" ? <Timeline payments={list} /> : <CalendarView payments={list} />}
          </div>
          <aside className="space-y-4">
            <article className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
              <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Committed this month
              </h3>
              <div className="mt-2 font-numeric text-[28px] font-semibold">
                {fmt(list.reduce((s, p) => s + p.amount, 0))}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">Fixed 86% · Variable 14%</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-accent to-purple" />
              </div>
            </article>
            <InsightCard
              tone="up"
              title="Subscriptions grew €12"
              body="Netflix increased on 4 Jun."
              action="Review"
            />
          </aside>
        </div>
      </AsyncBoundary>
    </div>
  );
}

function ViewBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] transition-colors",
        active ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon} {label}
    </button>
  );
}

function Timeline({ payments }: { payments: ReadonlyArray<Payment> }) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02]">
      {payments.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-4 border-b border-white/[0.04] px-4 py-3 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-[11px] font-semibold">
              {p.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="text-[13px] font-medium">{p.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {p.category} · next{" "}
                {new Date(p.nextDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-numeric text-[14px] font-medium">{fmt(p.amount)}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
                p.status === "auto"
                  ? "bg-success/15 text-success"
                  : p.status === "paused"
                    ? "bg-white/5 text-muted-foreground"
                    : "bg-accent/15 text-accent",
              )}
            >
              {p.status}
            </span>
            <div className="flex items-center gap-1">
              <IconBtn icon={<Pause className="h-3 w-3" />} />
              <IconBtn icon={<Pencil className="h-3 w-3" />} />
              <IconBtn icon={<X className="h-3 w-3" />} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function IconBtn({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="grid h-7 w-7 place-items-center rounded-md bg-white/[0.03] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground">
      {icon}
    </button>
  );
}

function CalendarView({ payments }: { payments: ReadonlyArray<Payment> }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const payByDay = new Map<number, Payment[]>();
  payments.forEach((p) => {
    const d = Number(p.nextDate.slice(-2));
    payByDay.set(d, [...(payByDay.get(d) ?? []), p]);
  });
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-[14px] font-semibold">July 2026</h3>
        <span className="text-[11px] text-muted-foreground">Drag a dot to reschedule</span>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map((d) => {
          const ps = payByDay.get(d);
          return (
            <div
              key={d}
              className="aspect-square rounded-lg border border-white/[0.04] bg-white/[0.02] p-1.5 text-left text-[10px]"
            >
              <div className="font-numeric text-muted-foreground">{d}</div>
              {ps && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {ps.map((p) => (
                    <span
                      key={p.id}
                      className="h-1.5 w-1.5 rounded-full bg-accent"
                      title={p.name}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
