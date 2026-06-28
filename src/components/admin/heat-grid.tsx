import { cn } from "@/lib/utils";

export function HeatGrid({
  data,
  cols = 24,
  rows = 7,
  rowLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  className,
}: {
  data: number[][];
  cols?: number;
  rows?: number;
  rowLabels?: string[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex">
        <div className="w-10" />
        <div className="grid grid-cols-24 gap-1 flex-1 text-[9px] font-mono text-muted-foreground/60">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="text-center">{i % 3 === 0 ? i.toString().padStart(2, "0") : ""}</div>
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-1">
          <div className="w-10 text-[10px] font-mono text-muted-foreground/70">{rowLabels[r] ?? ""}</div>
          <div className="grid grid-cols-24 gap-1 flex-1">
            {Array.from({ length: cols }).map((_, c) => {
              const v = data[r]?.[c] ?? 0;
              return (
                <div
                  key={c}
                  className="aspect-square rounded-[3px] transition-colors hover:ring-2 hover:ring-white/30"
                  style={{
                    background: `oklch(${0.3 + v * 0.4} ${0.08 + v * 0.18} 258 / ${0.15 + v * 0.85})`,
                  }}
                  title={`${rowLabels[r]} · ${c}:00 — ${(v * 100).toFixed(0)}%`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
