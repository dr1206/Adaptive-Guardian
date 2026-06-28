import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function SigilCard({
  eyebrow,
  title,
  to,
  live,
  className,
  children,
  action,
}: {
  eyebrow?: string;
  title?: string;
  to?: string;
  live?: boolean;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-[oklch(0.225_0.035_264/0.55)] p-5 backdrop-blur-2xl",
        "shadow-[0_30px_60px_-40px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-[24px]"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.715 0.135 215 / 0.10), transparent 40%, oklch(0.635 0.215 295 / 0.08))",
          mask: "linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)",
          padding: 1,
          WebkitMask: "linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {(eyebrow || title || live || to || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {eyebrow}
              </div>
            )}
            {title && (
              <h3 className="mt-0.5 font-display text-[15px] font-medium tracking-tight">
                {title}
              </h3>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {live && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2 py-0.5 text-[10px] text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success [animation:pulse_2s_ease-in-out_infinite]" />
                Live
              </span>
            )}
            {action}
            {to && (
              <Link
                to={to}
                className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                aria-label="Open"
              >
                <span className="text-[11px]">↗</span>
              </Link>
            )}
          </div>
        </header>
      )}
      <div className="relative">{children}</div>
    </article>
  );
}
