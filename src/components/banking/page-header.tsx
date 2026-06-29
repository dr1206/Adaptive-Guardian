import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mt-6 mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-accent">
            {eyebrow}
          </div>
        )}
        <h1 className="truncate font-display text-2xl sm:text-3xl lg:text-[34px] font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[13px] text-muted-foreground line-clamp-2">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2 col-start-2 row-start-1 sm:col-auto sm:row-auto">
          {actions}
        </div>
      )}
    </header>
  );
}
