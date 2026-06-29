import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import {
  Keyboard,
  MousePointer2,
  Clock,
  Activity,
  KeySquare,
  MessageSquareOff,
  MonitorOff,
  FolderX,
  ImageOff,
  MicOff,
  CameraOff,
} from "lucide-react";
import { PressHoldButton } from "@/components/banking/press-hold-button";

export const Route = createFileRoute("/app/guard/privacy")({
  component: Privacy,
});

const COLLECT = [
  { icon: Keyboard, label: "Typing rhythm", note: "To recognize you without passwords." },
  { icon: MousePointer2, label: "Mouse movement", note: "To detect that the human is you." },
  { icon: Clock, label: "Interaction timing", note: "To learn your natural cadence." },
  {
    icon: Activity,
    label: "Session patterns",
    note: "To detect unusual behavior, not your actions.",
  },
];

const NEVER = [
  { icon: KeySquare, label: "Passwords" },
  { icon: MessageSquareOff, label: "Messages" },
  { icon: MonitorOff, label: "Screen content" },
  { icon: FolderX, label: "Files" },
  { icon: ImageOff, label: "Photos" },
  { icon: MicOff, label: "Microphone" },
  { icon: CameraOff, label: "Camera" },
];

const TOGGLES = [
  { label: "Behavioral learning", on: true, note: "Recognize you without passwords." },
  { label: "Session telemetry", on: true, note: "Detect unusual patterns silently." },
  { label: "Cross-device recognition", on: true, note: "Trust paired devices automatically." },
  { label: "Travel adaptation", on: false, note: "Off · we'll ask one extra proof in new cities." },
];

function Privacy() {
  return (
    <>
      <PageHeader
        eyebrow="Trust"
        title="Privacy Center"
        subtitle="Maintained by AdaptiveGuard AI — a transparent look at what we see, and what we don't."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <SigilCard eyebrow="Collected" title="What the Guardian sees" className="border-accent/20">
          <ul className="space-y-2.5">
            {COLLECT.map((c) => (
              <li
                key={c.label}
                className="flex items-start gap-3 rounded-xl border border-accent/15 bg-accent/[0.04] p-3"
              >
                <c.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <div className="text-[13px] font-medium">{c.label}</div>
                  <div className="text-[12px] text-muted-foreground">{c.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </SigilCard>

        <SigilCard eyebrow="Not collected" title="What we never touch">
          <ul className="grid gap-2 sm:grid-cols-2">
            {NEVER.map((n) => (
              <li
                key={n.label}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.01] p-3"
              >
                <span className="grid h-8 w-8 place-items-center rounded-md bg-white/[0.03]">
                  <n.icon className="h-4 w-4 text-muted-foreground/60" />
                </span>
                <span className="text-[12.5px] text-muted-foreground line-through decoration-white/15">
                  {n.label}
                </span>
              </li>
            ))}
          </ul>
        </SigilCard>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-12">
        <SigilCard className="lg:col-span-7" eyebrow="Your controls" title="What you can turn off">
          <ul className="space-y-2.5">
            {TOGGLES.map((t) => (
              <li
                key={t.label}
                className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{t.label}</div>
                  <div className="text-[12px] text-muted-foreground">{t.note}</div>
                </div>
                <span
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    t.on ? "bg-accent/40" : "bg-white/[0.08]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-foreground transition-all ${
                      t.on ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </span>
              </li>
            ))}
          </ul>
        </SigilCard>

        <SigilCard className="lg:col-span-5" eyebrow="Data lifecycle" title="Captured → discarded">
          <ol className="space-y-3">
            {[
              { l: "Captured", n: "On your device, in real time." },
              { l: "Hashed", n: "Reduced to anonymous behavioral vectors." },
              { l: "Compared", n: "Matched against your signature." },
              { l: "Discarded", n: "Raw signals deleted within 24 hours." },
            ].map((s, i) => (
              <li key={s.l} className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 font-numeric text-[11px] text-accent">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[13px] font-medium">{s.l}</div>
                  <div className="text-[12px] text-muted-foreground">{s.n}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <PressHoldButton label="Hold to export my data" onComplete={() => {}} />
            <PressHoldButton label="Hold to delete my signature" onComplete={() => {}} />
          </div>
        </SigilCard>
      </section>
    </>
  );
}
