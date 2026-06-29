import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { ConfidenceRing } from "@/components/guard/confidence-ring";
import { Sparkline } from "@/components/banking/sparkline";
import { FileDown, Share2 } from "lucide-react";

export const Route = createFileRoute("/app/guard/reports")({
  component: Reports,
});

const PERIODS = ["Daily", "Weekly", "Monthly"] as const;

const PREV = ["Week of Mar 17", "Week of Mar 10", "Week of Mar 3", "Feb 2026", "Jan 2026"];

function Reports() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("Weekly");
  return (
    <>
      <PageHeader
        eyebrow="Trust"
        title="Security Reports"
        subtitle="A clear, calm summary you can share with anyone."
        actions={
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[12px] hover:bg-white/[0.04]">
              <FileDown className="h-3.5 w-3.5" /> Export PDF
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[12px] hover:bg-white/[0.04]">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>
        }
      />

      <div className="mb-5 inline-flex rounded-full border border-white/[0.07] bg-white/[0.02] p-0.5 text-[12px]">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-4 py-1.5 ${
              p === period ? "bg-white/[0.08] text-foreground" : "text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <section className="grid gap-5 lg:grid-cols-12">
        <SigilCard className="lg:col-span-3" eyebrow="Previous" title="Reports">
          <ul className="space-y-1.5">
            {PREV.map((p, i) => (
              <li key={p}>
                <button
                  className={`w-full rounded-lg px-3 py-2 text-left text-[12.5px] ${
                    i === 0
                      ? "bg-white/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        </SigilCard>

        <SigilCard
          className="lg:col-span-9"
          eyebrow={period + " · Mar 17–23"}
          title="Security report"
        >
          <div className="grid items-center gap-6 border-b border-white/[0.05] pb-6 md:grid-cols-[auto_1fr_auto]">
            <ConfidenceRing value={98.1} size="md" label="Confidence" />
            <div>
              <h2 className="font-display text-[22px] font-medium leading-tight">
                A calm week — recognized in every session.
              </h2>
              <p className="mt-2 text-[12.5px] text-muted-foreground">
                The Guardian recognized you in 41 of 41 sessions. One step-up OTP completed in 4
                seconds.
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Trust
              </div>
              <div className="font-numeric text-[28px] font-semibold">
                9.4<span className="text-[14px] text-muted-foreground">/10</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Stat label="Authentications" v="41" sub="0 failed" />
            <Stat label="Challenges" v="1" sub="OTP · passed in 4s" />
            <Stat label="Devices used" v="2" sub="MacBook · iPhone" />
            <Stat label="Behavior drift" v="Δ 1.4%" sub="Within expected range" />
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Trust trend
            </div>
            <div className="mt-2">
              <Sparkline points={[9.0, 9.1, 9.2, 9.3, 9.3, 9.4, 9.4]} width={600} height={40} />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-[12.5px] text-muted-foreground">
            <span className="text-accent">Aegis · </span>A calm week — the Guardian recognized you
            41 of 41 sessions, with one quick step-up to confirm a new beneficiary.
          </div>
        </SigilCard>
      </section>
    </>
  );
}

function Stat({ label, v, sub }: { label: string; v: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-numeric text-[26px] font-semibold tabular-nums">{v}</div>
      <div className="text-[11.5px] text-muted-foreground">{sub}</div>
    </div>
  );
}
