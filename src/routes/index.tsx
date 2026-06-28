import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AdaptiveGuard AI — Continuous Authentication. Invisible Security." },
      {
        name: "description",
        content:
          "Enterprise FinTech platform powered by behavioral biometrics. Continuous authentication, invisible security, intelligent protection.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ambient gradient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--gradient-cyber)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-[1400px] flex-col items-center justify-center px-6 py-24 text-center">
        <span className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success pulse-live" />
          Design system v1 — AdaptiveGuard AI
        </span>

        <h1 className="mt-8 max-w-4xl text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Continuous Authentication.
          <br />
          <span className="text-gradient">Invisible Security.</span>
          <br />
          Intelligent Protection.
        </h1>

        <p className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
          A premium banking platform that quietly verifies your identity through
          behavioral biometrics — every keystroke, every motion, every session.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button className="gradient-primary ring-focus hover-lift inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
            Enter the platform
          </button>
          <button className="glass-card ring-focus hover-lift inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-foreground">
            View design system
          </button>
        </div>

        {/* Token preview strip */}
        <div className="surface-card mt-16 grid w-full max-w-4xl grid-cols-2 gap-4 rounded-3xl p-6 sm:grid-cols-4">
          {[
            { label: "Primary", var: "--primary" },
            { label: "Accent Cyan", var: "--accent" },
            { label: "Success", var: "--success" },
            { label: "Purple", var: "--purple" },
          ].map((t) => (
            <div key={t.label} className="flex flex-col items-start gap-2">
              <div
                className="h-14 w-full rounded-xl border border-border"
                style={{ background: `oklch(var(${t.var}))` }}
              />
              <span className="text-xs font-medium text-muted-foreground">{t.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
