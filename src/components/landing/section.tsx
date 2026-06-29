import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  align = "center",
  alt = false,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  alt?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`relative w-full overflow-hidden py-24 sm:py-32 ${alt ? "bg-surface/40" : ""}`}
    >
      {alt && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.08), transparent)",
          }}
        />
      )}
      <div className="relative mx-auto w-full max-w-[1400px] px-6">
        {(eyebrow || title || subtitle) && (
          <div className={`mb-14 max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
            {eyebrow && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-accent" />
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-balance text-base text-muted-foreground sm:text-lg">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
