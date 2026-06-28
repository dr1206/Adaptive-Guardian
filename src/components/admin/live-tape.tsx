import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LiveTapeRow = {
  id: string;
  cells: ReactNode[];
  signal?: "ok" | "watch" | "alert" | "critical";
};

/** Streaming rows with subtle in/out animation. */
export function LiveTape({
  rows,
  columns,
  className,
}: {
  rows: LiveTapeRow[];
  columns: { label: string; width?: string }[];
  className?: string;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, []);
  const seen = useRef(new Set<string>());
  return (
    <div className={cn("rounded-xl border border-white/[0.05] overflow-hidden", className)}>
      <div className="grid text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground/80 border-b border-white/[0.05] bg-white/[0.02] px-4 py-2"
           style={{ gridTemplateColumns: columns.map((c) => c.width ?? "1fr").join(" ") }}>
        {columns.map((c, i) => <span key={i}>{c.label}</span>)}
      </div>
      <div className="divide-y divide-white/[0.04]">
        {rows.map((r) => {
          const fresh = !seen.current.has(r.id);
          seen.current.add(r.id);
          return (
            <div
              key={r.id}
              className={cn(
                "grid px-4 py-2.5 text-sm items-center transition-colors",
                "hover:bg-white/[0.03]",
                fresh && "animate-in fade-in slide-in-from-top-1 duration-300"
              )}
              style={{ gridTemplateColumns: columns.map((c) => c.width ?? "1fr").join(" ") }}
            >
              {r.cells.map((cell, i) => <div key={i} className="min-w-0 truncate">{cell}</div>)}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-1.5 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-muted-foreground/60 bg-white/[0.01]">
        <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />live · tick {tick}</span>
        <span>{rows.length} rows</span>
      </div>
    </div>
  );
}
