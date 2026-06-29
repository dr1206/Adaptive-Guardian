import { cn } from "@/lib/utils";

export function OpsTable<T>({
  columns,
  rows,
  rowKey,
  onRow,
  density = "comfortable",
}: {
  columns: { key: string; label: string; width?: string; align?: "left" | "right"; render: (row: T) => React.ReactNode }[];
  rows: ReadonlyArray<T>;
  rowKey: (row: T) => string;
  onRow?: (row: T) => void;
  density?: "comfortable" | "compact" | "dense";
}) {
  const padY = density === "dense" ? "py-1.5" : density === "compact" ? "py-2" : "py-3";
  const grid = columns.map((c) => c.width ?? "1fr").join(" ");
  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="sticky top-0 z-10 grid bg-white/[0.03] backdrop-blur px-4 py-2.5 border-b border-white/[0.05] text-[10px] uppercase tracking-[0.16em] font-mono text-muted-foreground"
           style={{ gridTemplateColumns: grid }}>
        {columns.map((c) => (
          <div key={c.key} className={cn(c.align === "right" && "text-right")}>{c.label}</div>
        ))}
      </div>
      <div className="divide-y divide-white/[0.04]">
        {rows.map((r) => (
          <div
            key={rowKey(r)}
            onClick={onRow ? () => onRow(r) : undefined}
            className={cn(
              "grid px-4 items-center text-sm transition-colors",
              padY,
              onRow ? "cursor-pointer hover:bg-white/[0.04]" : "hover:bg-white/[0.02]"
            )}
            style={{ gridTemplateColumns: grid }}
          >
            {columns.map((c) => (
              <div key={c.key} className={cn("min-w-0 truncate", c.align === "right" && "text-right")}>
                {c.render(r)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
