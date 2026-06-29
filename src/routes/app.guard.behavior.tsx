import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { WaveformTrace } from "@/components/guard/waveform-trace";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/app/guard/behavior")({
  component: Behavior,
});

const PAGES = [
  {
    to: "/app/guard/typing",
    label: "Typing Intelligence",
    note: "Rhythm, cadence, hold time, flight time.",
  },
  {
    to: "/app/guard/mouse",
    label: "Mouse Intelligence",
    note: "Speed, precision, smoothness, click rhythm.",
  },
  {
    to: "/app/guard/session",
    label: "Session Intelligence",
    note: "Consistency, idle, focus, action cadence.",
  },
];

function Behavior() {
  return (
    <>
      <PageHeader
        eyebrow="Behavior"
        title="Behavior Analytics"
        subtitle="A single signal that captures what makes you, you."
      />
      <SigilCard eyebrow="24 hours" title="Behavior signature">
        <WaveformTrace seed={4} height={140} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <span className="inline-flex items-center gap-1.5 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Within your normal range
          </span>
          <span className="text-muted-foreground">
            You-ness index · <span className="font-numeric text-foreground">96.8</span>
          </span>
        </div>
      </SigilCard>

      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        {PAGES.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="group rounded-[24px] border border-white/[0.06] bg-[oklch(0.225_0.035_264/0.55)] p-6 backdrop-blur-2xl transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-accent">Dedicated</div>
                <div className="mt-1 font-display text-[18px] font-medium tracking-tight">
                  {p.label}
                </div>
                <p className="mt-1.5 text-[12.5px] text-muted-foreground">{p.note}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <div className="mt-4">
              <WaveformTrace seed={p.label.length} height={70} baseline={false} />
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
