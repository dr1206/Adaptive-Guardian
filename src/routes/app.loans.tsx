import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import { useLoans } from "@/services/hooks";

export const Route = createFileRoute("/app/loans")({
  component: LoansPage,
});

function LoansPage() {
  const { data: loans, isLoading, error } = useLoans();
  return (
    <div>
      <PageHeader eyebrow="Grow" title="Loans" subtitle="Track repayments. Forecast prepayments." />
      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={!loans || loans.length === 0}
        emptyLabel="No active loans."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {(loans ?? []).map((l) => (
            <article
              key={l.id}
              className="rounded-[24px] border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent p-6"
            >
              <header className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>Loan</span>
                <span className="text-accent">Active</span>
              </header>
              <h3 className="font-display text-[18px] font-semibold tracking-tight">{l.name}</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Stat k="Remaining" v={fmt(l.remaining)} />
                <Stat k="Principal" v={fmt(l.principal)} />
                <Stat k="Rate" v={`${l.ratePct}%`} />
                <Stat
                  k="Next EMI"
                  v={fmt(l.nextAmount)}
                  sub={new Date(l.nextDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                />
              </div>
              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Paid {l.paidPct}%</span>
                  <span>{100 - l.paidPct}% remaining</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-purple"
                    style={{ width: `${l.paidPct}%` }}
                  />
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-accent/15 bg-accent/5 px-3 py-2 text-[12px] text-accent">
                Aegis · Prepay €2,000 today and save €184 in interest.
              </div>
            </article>
          ))}
        </div>
      </AsyncBoundary>
    </div>
  );
}

function Stat({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k}</div>
      <div className="mt-1 font-numeric text-[18px] font-semibold">{v}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
