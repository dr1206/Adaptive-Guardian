import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
      <div className="mb-4 grid h-20 w-20 place-items-center rounded-full border border-white/[0.06] bg-white/[0.03] text-accent/70">
        {icon}
      </div>
      <h3 className="font-display text-[18px] font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
