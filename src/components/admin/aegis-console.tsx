import { useState } from "react";
import { ChevronRight, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Summarize today's activity",
  "Show high-risk sessions",
  "Explain the recent confidence drop",
  "Recommend retraining schedule",
  "Draft this week's risk report",
];

export function AegisConsole() {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<{ role: "user" | "ai"; text: string; cites?: string[] }[]>([
    {
      role: "ai",
      text: "Aegis online. Platform posture is stable. 3 incidents to triage — 1 critical (behavior drift, eu-west). Want a brief?",
    },
  ]);

  const ask = (q: string) => {
    setThread((t) => [
      ...t,
      { role: "user", text: q },
      {
        role: "ai",
        text:
          q.toLowerCase().includes("retrain")
            ? "Model v2.4.1 accuracy is steady at 99.2%, but feature mouse.curvature shows 1.8σ drift on cohort EU-mobile. A targeted retrain in 48h is recommended; candidate v2.4.2-rc already evaluates +0.2pp F1."
            : q.toLowerCase().includes("drop")
            ? "Avg confidence dipped 0.3pp at 14:02 UTC — coincides with a Safari 18.2 rollout that altered pointer-event timing. Impact contained to 3.4k sessions; auto-recalibration shrank the gap to 0.05pp by 14:48."
            : "Drafted. Headlines: 12,847 active users, 99.6% auth success, 47 challenges, 3 anomalies. Largest movement: fraud prevented +12% WoW.",
        cites: ["sessions/today", "model/v2.4.1", "incident/INC-2841"],
      },
    ]);
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-10 right-6 z-40 group flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-[oklch(0.225_0.05_264/0.85)] backdrop-blur-xl px-4 py-2.5 shadow-glow-cyan hover:border-cyan-300/60 transition-all"
      >
        <Sparkles className="size-4 text-cyan-300" />
        <span className="text-sm font-medium">Ask Aegis</span>
        <kbd className="ml-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘J</kbd>
      </button>
    );

  return (
    <aside className="fixed top-4 bottom-10 right-4 w-[380px] z-40 flex flex-col rounded-2xl border border-white/[0.08] bg-[oklch(0.18_0.03_264/0.92)] backdrop-blur-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="size-7 rounded-lg gradient-cyber flex items-center justify-center"><Sparkles className="size-3.5" /></div>
            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-[oklch(0.18_0.03_264)] animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-semibold">Aegis Console</div>
            <div className="text-[10px] text-muted-foreground font-mono">copilot · v2.4.1 · grounded</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="size-7 rounded-md hover:bg-white/[0.06] flex items-center justify-center text-muted-foreground"><X className="size-3.5" /></button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {thread.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              m.role === "user"
                ? "bg-cyan-500/[0.12] border border-cyan-400/20 text-foreground"
                : "bg-white/[0.04] border border-white/[0.05] text-foreground/95"
            )}>
              {m.text}
              {m.cites && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.cites.map((c) => (
                    <span key={c} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.06] text-muted-foreground">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-white/[0.06] space-y-1.5">
        <div className="flex flex-wrap gap-1">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => ask(s)} className="text-[11px] rounded-full border border-white/[0.06] hover:border-cyan-400/40 hover:bg-cyan-500/[0.06] px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              {s} <ChevronRight className="size-3" />
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); const input = (e.currentTarget.elements.namedItem("q") as HTMLInputElement); if (input.value.trim()) { ask(input.value); input.value = ""; } }}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 focus-within:border-cyan-400/40"
        >
          <input name="q" placeholder="Ask Aegis anything…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
          <button type="submit" className="text-cyan-300 hover:text-cyan-200"><Sparkles className="size-4" /></button>
        </form>
      </div>
    </aside>
  );
}
