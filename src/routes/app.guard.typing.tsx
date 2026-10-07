import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { WaveformTrace } from "@/components/guard/waveform-trace";
import { Sparkline } from "@/components/banking/sparkline";
import { Shield } from "@/components/brand/shield";

export const Route = createFileRoute("/app/guard/typing")({
  component: Typing,
});

const KPI = [
  {
    label: "Speed",
    value: "72 wpm",
    spark: [68, 70, 71, 73, 72, 74, 72],
    note: "Slightly faster than usual — within range.",
  },
  {
    label: "Rhythm",
    value: "96%",
    spark: [92, 93, 94, 94, 95, 96, 96],
    note: "Your rhythm remains consistent.",
  },
  {
    label: "Cadence",
    value: "142 ms",
    spark: [150, 148, 145, 143, 144, 142, 142],
    note: "Stable inter-key timing.",
  },
  {
    label: "Hold time",
    value: "84 ms",
    spark: [80, 82, 83, 85, 84, 83, 84],
    note: "Matches your signature.",
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Typing() {
  return (
    <>
      <PageHeader
        eyebrow="Behavior · Biometrics"
        title="Typing Intelligence"
        subtitle="Your keyboard rhythm — quietly recognized, never stored as text."
        actions={
          <div className="flex rounded-lg border border-border bg-card p-0.5 text-[12px] shadow-xs">
            {["Today", "Week", "Month"].map((t, i) => (
              <button
                key={t}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${i === 0 ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI.map((k) => (
          <SigilCard key={k.label} eyebrow={k.label}>
            <div className="font-numeric text-[28px] font-bold tabular-nums text-foreground">{k.value}</div>
            <div className="mt-2">
              <Sparkline points={k.spark} width={200} height={28} />
            </div>
            <div className="mt-2 text-[11.5px] text-muted-foreground">{k.note}</div>
          </SigilCard>
        ))}
      </section>

      <section className="mt-6">
        <SigilCard eyebrow="Live Biometric Stream" title="Typing rhythm waveform" live>
          <WaveformTrace seed={9} height={160} />
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
            <span>Current Session</span>
            <span className="inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Active Keystroke Dynamics
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" /> Historical Baseline
              </span>
            </span>
          </div>
        </SigilCard>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-12">
        <SigilCard className="lg:col-span-5" eyebrow="Privacy-Preserving" title="Keyboard dwell time distribution">
          <KeyboardHeatmap />
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            Only timing intervals and flight times are processed. Actual keystrokes are never captured or recorded.
          </p>
        </SigilCard>

        <SigilCard className="lg:col-span-7" eyebrow="7-Day Timeline" title="Rhythm cadence consistency">
          <div className="grid grid-cols-7 gap-3">
            {DAYS.map((d, i) => (
              <div key={d} className="rounded-lg border border-border bg-muted/20 p-2.5">
                <div className="text-[10px] uppercase font-semibold tracking-[0.18em] text-muted-foreground">
                  {d}
                </div>
                <WaveformTrace seed={i + 2} height={48} baseline={false} />
              </div>
            ))}
          </div>
        </SigilCard>
      </section>

      <SigilCard className="mt-6" eyebrow="Aegis observation">
        <div className="flex items-start gap-3">
          <Shield size={28} live />
          <p className="text-[14px] leading-relaxed text-foreground/90">
            Your typing rhythm remains consistent. The Guardian recognizes you clearly.
          </p>
        </div>
      </SigilCard>
    </>
  );
}

function KeyboardHeatmap() {
  // anonymized zones — left hand, right hand, modifiers, space
  const rows = [
    [".6", ".55", ".5", ".45", ".4", "", ".4", ".45", ".55", ".5"],
    [".7", ".75", ".8", ".7", ".5", "", ".5", ".7", ".75", ".7"],
    [".65", ".7", ".75", ".65", ".4", "", ".4", ".65", ".7", ".6"],
  ];
  return (
    <div className="space-y-1.5">
      {rows.map((r, ri) => (
        <div key={ri} className="grid grid-cols-10 gap-1.5">
          {r.map((v, i) => (
            <div
              key={i}
              className="aspect-square rounded-md"
              style={{
                background: v
                  ? `oklch(0.55 0.18 ${258 - Number(v) * 60} / ${Number(v)})`
                  : "transparent",
              }}
            />
          ))}
        </div>
      ))}
      <div className="grid grid-cols-10 gap-1.5">
        <div className="col-span-2" />
        <div
          className="col-span-6 h-7 rounded-md"
          style={{ background: "oklch(0.6 0.16 240 / 0.55)" }}
        />
        <div className="col-span-2" />
      </div>
    </div>
  );
}
