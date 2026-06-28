import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { ConfidenceRing } from "@/components/guard/confidence-ring";
import { Shield } from "@/components/brand/shield";
import { Sparkline } from "@/components/banking/sparkline";
import { Search } from "lucide-react";

export const Route = createFileRoute("/app/guard/challenges")({
  component: Challenges,
});

const ROWS = [
  { t: "Today · 11:07", reason: "New beneficiary", before: 94.2, after: 99.4, result: "Passed · OTP", device: "MacBook Pro", loc: "Lisbon" },
  { t: "Mar 14 · 18:22", reason: "Unusual amount", before: 95.1, after: 99.0, result: "Passed · OTP", device: "iPhone 15 Pro", loc: "Lisbon" },
  { t: "Mar 11 · 09:04", reason: "New location", before: 88.7, after: 97.8, result: "Passed · OTP", device: "MacBook Pro", loc: "Porto" },
];

function Challenges() {
  return (
    <>
      <PageHeader
        eyebrow="Identity"
        title="Challenge History"
        subtitle="The few moments the Guardian asked for one more proof."
      />

      <section className="grid gap-5 lg:grid-cols-12">
        <SigilCard className="lg:col-span-8" eyebrow="Filter" title="">
          <div className="-mt-2 flex flex-wrap items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Search challenges…"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            {["All", "Last 7d", "Last 30d", "OTP", "Biometric", "Device"].map((c, i) => (
              <button
                key={c}
                className={`rounded-full border px-3 py-1.5 text-[11.5px] ${
                  i === 0
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-white/[0.07] bg-white/[0.02] text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <ul className="mt-5 space-y-2.5">
            {ROWS.map((r, i) => (
              <li
                key={i}
                className="grid items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:grid-cols-[1.6fr_auto_auto_1fr_auto]"
              >
                <div>
                  <div className="text-[12.5px] font-medium">{r.reason}</div>
                  <div className="font-numeric text-[11px] tabular-nums text-muted-foreground">{r.t}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <ConfidenceRing value={r.before} size="sm" showShield={false} />
                  <span className="text-[10px] text-muted-foreground">→</span>
                  <ConfidenceRing value={r.after} size="sm" showShield={false} />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-[11px] text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {r.result}
                </span>
                <div className="text-[11.5px] text-muted-foreground">
                  {r.device} · {r.loc}
                </div>
                <button className="text-[11px] text-accent hover:underline">Open ↗</button>
              </li>
            ))}
          </ul>
        </SigilCard>

        <div className="lg:col-span-4 space-y-5">
          <SigilCard eyebrow="This month" title="No challenges needed today">
            <div className="flex flex-col items-center py-2 text-center">
              <Shield size={56} live />
              <div className="mt-3 font-display text-[28px] font-semibold tabular-nums">312<span className="text-[14px] text-muted-foreground"> / 312</span></div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Sessions recognized</div>
              <p className="mt-3 max-w-[28ch] text-[12px] text-muted-foreground">
                The Guardian recognized you 312 of 312 sessions this month — silently.
              </p>
            </div>
          </SigilCard>
          <SigilCard eyebrow="Trend" title="Challenge rate">
            <div className="flex items-end justify-between">
              <div className="font-numeric text-[28px] font-semibold tabular-nums">0.96%</div>
              <Sparkline points={[3, 2, 2, 1.5, 1.2, 1.1, 0.96]} width={120} height={32} />
            </div>
            <p className="mt-2 text-[11.5px] text-muted-foreground">Down from 3% — the model is learning.</p>
          </SigilCard>
        </div>
      </section>
    </>
  );
}
