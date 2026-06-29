import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { ConfidenceRing } from "@/components/guard/confidence-ring";
import { DecisionWaterfall } from "@/components/guard/decision-waterfall";
import { WaveformTrace } from "@/components/guard/waveform-trace";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { useDecisionReplays } from "@/services/hooks";
import { asyncStateFromQuery } from "@/lib/async-state";
import type { DecisionReplay } from "@/services/aegis/aegis.contract";

export const Route = createFileRoute("/app/guard/decisions")({
  component: Decisions,
});

function Decisions() {
  const replaysQ = useDecisionReplays();
  const decisions = replaysQ.data ?? [];
  const state = asyncStateFromQuery(replaysQ, (d) => d.length === 0);
  const [selId, setSelId] = useState<string | null>(null);
  const sel: DecisionReplay | undefined = decisions.find((d) => d.id === selId) ?? decisions[0];

  return (
    <>
      <PageHeader
        eyebrow="Decisions"
        title="AI Decisions"
        subtitle="Every decision the Guardian made — and exactly why."
      />

      <AsyncBoundary state={state} variant="dashboard" emptyLabel="No decisions recorded yet.">
        {sel && (
          <section className="grid gap-5 lg:grid-cols-12">
            <SigilCard className="lg:col-span-4" eyebrow="Today" title="Recent decisions">
              <ul className="space-y-2">
                {decisions.map((d) => (
                  <li key={d.id}>
                    <button
                      onClick={() => setSelId(d.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                        sel.id === d.id
                          ? "border-accent/40 bg-accent/5"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[12.5px] font-medium">{d.title}</span>
                        <span className="font-numeric text-[11px] tabular-nums text-success">
                          {d.confidence}%
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{d.time}</span>
                        <span>{d.outcome}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </SigilCard>

            <SigilCard className="lg:col-span-8" eyebrow={sel.time} title={sel.title}>
              <div className="grid items-start gap-6 md:grid-cols-[auto_1fr]">
                <div className="flex flex-col items-center">
                  <ConfidenceRing value={sel.confidence} size="md" />
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-[11px] text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    {sel.outcome}
                  </span>
                </div>
                <div>
                  <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Decision waterfall
                  </div>
                  <DecisionWaterfall petals={[...sel.petals]} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Typing snapshot
                  </div>
                  <div className="mt-2">
                    <WaveformTrace seed={sel.id.length + 3} height={70} baseline={false} />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Plain English
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed">
                    The Guardian recognized you immediately. Behavior and device alone were enough —
                    risk was minimal.
                  </p>
                </div>
              </div>
            </SigilCard>
          </section>
        )}
      </AsyncBoundary>
    </>
  );
}
