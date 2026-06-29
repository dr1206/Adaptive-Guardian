import { cn } from "@/lib/utils";

export function OpsTable<T>({
  columns,
  rows,
  rowKey,
  onRow,
  density = "comfortable",
  caption,
}: {
  columns: {
    key: string;
    label: string;
    width?: string;
    align?: "left" | "right";
    render: (row: T) => React.ReactNode;
    primary?: boolean;
  }[];
  rows: ReadonlyArray<T>;
  rowKey: (row: T) => string;
  onRow?: (row: T) => void;
  density?: "comfortable" | "compact" | "dense";
  caption?: string;
}) {
  const padY = density === "dense" ? "py-1.5" : density === "compact" ? "py-2" : "py-3";
  const grid = columns.map((c) => c.width ?? "1fr").join(" ");
  return (
    <div
      className="rounded-2xl border border-white/[0.06] overflow-hidden"
      role="region"
      aria-label={caption}
    >
      {caption && <span className="sr-only">{caption}</span>}

      {/* Desktop / wide table */}
      <div role="table" className="hidden md:block" aria-rowcount={rows.length + 1}>
        <div
          role="row"
          className="sticky top-0 z-10 grid bg-white/[0.03] backdrop-blur px-4 py-2.5 border-b border-white/[0.05] text-[10px] uppercase tracking-[0.16em] font-mono text-muted-foreground"
          style={{ gridTemplateColumns: grid }}
        >
          {columns.map((c) => (
            <div
              role="columnheader"
              key={c.key}
              className={cn(c.align === "right" && "text-right")}
            >
              {c.label}
            </div>
          ))}
        </div>
        <div className="divide-y divide-white/[0.04]">
          {rows.map((r) => {
            const interactive = !!onRow;
            return (
              <div
                role="row"
                key={rowKey(r)}
                tabIndex={interactive ? 0 : -1}
                onClick={interactive ? () => onRow!(r) : undefined}
                onKeyDown={
                  interactive
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRow!(r);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "grid px-4 items-center text-sm transition-colors focus:outline-none focus-visible:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-accent/40",
                  padY,
                  interactive ? "cursor-pointer hover:bg-white/[0.04]" : "hover:bg-white/[0.02]",
                )}
                style={{ gridTemplateColumns: grid }}
              >
                {columns.map((c) => (
                  <div
                    role="cell"
                    key={c.key}
                    className={cn("min-w-0 truncate", c.align === "right" && "text-right")}
                  >
                    {c.render(r)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile / card list */}
      <ul className="md:hidden divide-y divide-white/[0.04]">
        {rows.map((r) => {
          const primary = columns.find((c) => c.primary) ?? columns[0];
          const rest = columns.filter((c) => c.key !== primary.key);
          const interactive = !!onRow;
          return (
            <li key={rowKey(r)}>
              <button
                type="button"
                onClick={interactive ? () => onRow!(r) : undefined}
                disabled={!interactive}
                className={cn(
                  "w-full text-left px-4 py-3 min-h-11 transition-colors",
                  interactive ? "hover:bg-white/[0.04] focus-visible:bg-white/[0.06]" : "",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40",
                )}
              >
                <div className="text-sm font-medium truncate">{primary.render(r)}</div>
                <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  {rest.map((c) => (
                    <div key={c.key} className="flex items-baseline gap-1.5 min-w-0">
                      <dt className="text-muted-foreground/70 uppercase tracking-wider text-[9px] shrink-0">
                        {c.label}
                      </dt>
                      <dd className="truncate text-foreground/90">{c.render(r)}</dd>
                    </div>
                  ))}
                </dl>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
