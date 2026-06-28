import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { SignatureGlyph } from "@/components/brand/signature-glyph";
import { VaultAtmosphere } from "./vault-atmosphere";
import { cn } from "@/lib/utils";

/**
 * AuthShell — shared layout for every auth screen.
 * Left: foreground card. Right: blurred banking preview.
 * Top: shared nav (matches the dashboard rail).
 * Bottom: regulatory micro-footer.
 */
export function AuthShell({
  step,
  totalSteps = 4,
  preview,
  children,
  glyphSeed = "guest",
  glyphFilled = false,
}: {
  step: number;
  totalSteps?: number;
  preview?: ReactNode;
  children: ReactNode;
  glyphSeed?: string;
  glyphFilled?: boolean;
}) {
  const pct = (step / totalSteps) * 100;

  return (
    <div className="relative min-h-screen text-foreground">
      <VaultAtmosphere />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/" className="flex items-center gap-2">
          <Wordmark size="md" />
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          <StepDots step={step} total={totalSteps} />
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
            Identity
          </span>
          <span
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full border",
              glyphFilled ? "border-accent/40" : "border-white/8",
            )}
          >
            {glyphFilled ? (
              <SignatureGlyph seed={glyphSeed} size={28} />
            ) : (
              <span className="h-3 w-3 rounded-full border border-white/20" />
            )}
          </span>
        </div>
      </header>

      {/* Progress hairline */}
      <div className="relative z-10 mx-auto h-[2px] w-full max-w-[1400px] px-6 lg:px-10">
        <div className="relative h-[2px] overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full gradient-cyber transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <main className="relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-8 px-6 pb-10 pt-10 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-14 lg:px-10 lg:pt-14">
        <section className="flex flex-col justify-center">
          <div className="animate-fade-in">{children}</div>
        </section>

        <aside className="relative hidden lg:block">
          <div className="relative h-full min-h-[560px]">
            {/* preview behind blur */}
            <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/5 bg-white/[0.015]">
              <div className="absolute inset-0 opacity-60 [filter:blur(16px)_saturate(120%)]">
                {preview}
              </div>
              {/* dim overlay */}
              <div className="absolute inset-0 bg-[#0B1120]/30" />
              {/* annotation chip */}
              <div className="glass-panel absolute left-6 top-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                A glimpse of your vault
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Regulatory footer */}
      <footer className="relative z-10 mx-auto mt-8 flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 px-6 pb-8 text-[11px] uppercase tracking-[0.14em] text-muted-foreground lg:px-10">
        <span>© 2026 AdaptiveGuard AI · Encrypted in transit and at rest</span>
        <span className="flex items-center gap-4 opacity-80">
          <span>FCA</span>
          <span className="opacity-30">·</span>
          <span>SOC 2</span>
          <span className="opacity-30">·</span>
          <span>ISO 27001</span>
          <span className="opacity-30">·</span>
          <span>GDPR</span>
        </span>
      </footer>
    </div>
  );
}

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const active = i + 1 === step;
        const done = i + 1 < step;
        return (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              active ? "w-8 gradient-cyber" : done ? "w-4 bg-accent/60" : "w-1.5 bg-white/10",
            )}
          />
        );
      })}
    </div>
  );
}
