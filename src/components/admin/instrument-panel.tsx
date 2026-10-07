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
      className={cn("relative rounded-xl border border-border bg-card shadow-xs", className)}
    >
      {(title || actions || eyebrow) && (
        <header
          className={cn(
            "flex items-end justify-between gap-4 border-b border-border/60 bg-muted/20",
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
