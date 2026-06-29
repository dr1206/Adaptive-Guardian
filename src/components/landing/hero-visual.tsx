import {
  Activity,
  Brain,
  Cpu,
  Fingerprint,
  Keyboard,
  MousePointer2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      {/* glow rings */}
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 opacity-70 blur-3xl"
        style={{ background: "var(--gradient-cyber)" }}
      />

      {/* main dashboard mock */}
      <div className="surface-card relative overflow-hidden rounded-3xl p-5">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          </div>
          <div className="glass-card flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Session Verified
          </div>
        </div>

        {/* balance + confidence */}
        <div className="mt-4 grid grid-cols-5 gap-3">
          <div className="col-span-3 rounded-2xl border border-border bg-background/40 p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Current Balance
            </div>
            <div className="mt-1 font-numeric text-2xl font-semibold tracking-tight">
              $128,402<span className="text-muted-foreground">.55</span>
            </div>
            <div className="mt-3 flex items-end gap-1 h-12">
              {[40, 55, 30, 70, 48, 82, 60, 90, 72, 95, 78, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm gradient-primary opacity-80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="col-span-2 rounded-2xl border border-border bg-background/40 p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              AI Confidence
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-numeric text-2xl font-semibold text-success">99.2</span>
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full w-[99%] gradient-cyber" />
            </div>
            <div className="mt-3 text-[10px] text-muted-foreground">Low risk · stable</div>
          </div>
        </div>

        {/* behavior rows */}
        <div className="mt-3 space-y-2">
          {[
            { icon: Keyboard, label: "Keystroke dynamics", value: "Match 98.4%" },
            { icon: MousePointer2, label: "Mouse trajectory", value: "Match 96.1%" },
            { icon: Fingerprint, label: "Behavior profile", value: "Stable" },
          ].map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between rounded-xl border border-border bg-background/30 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-card text-accent">
                  <r.icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs text-muted-foreground">{r.label}</span>
              </div>
              <span className="font-numeric text-xs font-medium text-foreground">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* floating chip top-right */}
      <div className="glass-panel absolute -right-6 -top-6 hidden rounded-2xl p-3 shadow-lg float-soft sm:flex sm:items-center sm:gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl gradient-cyber">
          <Brain className="h-4 w-4 text-primary-foreground" />
        </span>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            AI Engine
          </div>
          <div className="text-xs font-semibold">LightGBM + OC-SVM</div>
        </div>
      </div>

      {/* floating chip bottom-left */}
      <div className="glass-panel absolute -bottom-5 -left-5 hidden rounded-2xl p-3 shadow-lg sm:flex sm:items-center sm:gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-success/15 text-success">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Risk Level
          </div>
          <div className="text-xs font-semibold text-success">Low · 0.04</div>
        </div>
      </div>

      {/* floating chip right-middle */}
      <div className="glass-panel absolute -right-8 top-1/2 hidden -translate-y-1/2 rounded-2xl p-3 shadow-lg float-soft xl:flex xl:items-center xl:gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple/15 text-purple">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">SHAP</div>
          <div className="text-xs font-semibold">Explainable</div>
        </div>
      </div>

      {/* floating chip left-top */}
      <div className="glass-panel absolute -left-10 top-12 hidden rounded-2xl p-3 shadow-lg xl:flex xl:items-center xl:gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent">
          <Activity className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Live Events
          </div>
          <div className="font-numeric text-xs font-semibold">1,284 / min</div>
        </div>
      </div>

      <Cpu aria-hidden className="absolute -bottom-12 right-10 h-6 w-6 text-accent/40" />
    </div>
  );
}
