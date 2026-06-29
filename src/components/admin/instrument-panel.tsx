import { cn } from "@/lib/utils";

export function InstrumentPanel({
  children,
  className,
  title,
  eyebrow,
  actions,
  dense = false,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative rounded-2xl border border-white/[0.06] bg-[oklch(0.215_0.035_264/0.6)] backdrop-blur-xl",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-30px_rgba(0,0,0,0.7)]",
        className,
      )}
    >
      {(title || actions || eyebrow) && (
        <header
          className={cn(
            "flex items-end justify-between gap-4 border-b border-white/[0.05]",
            dense ? "px-4 py-3" : "px-5 py-4",
          )}
        >
          <div className="min-w-0">
            {eyebrow && (
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 font-mono">
                {eyebrow}
              </div>
            )}
            {title && (
              <h3 className="text-sm font-semibold text-foreground/95 truncate">{title}</h3>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={dense ? "p-4" : "p-5"}>{children}</div>
    </section>
  );
}
