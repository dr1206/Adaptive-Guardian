import { useMemo } from "react";
import { cn } from "@/lib/utils";

/** Continuous sparkstream with optional incident pins. */
export function RiverChart({
  series,
  height = 140,
  pins = [],
  className,
}: {
  series: number[];
  height?: number;
  pins?: { at: number; label?: string; severity?: "ok" | "watch" | "alert" | "critical" }[];
  className?: string;
}) {
  const w = 800;
  const { d, area, ymin, ymax } = useMemo(() => {
    const ymin = Math.min(...series);
    const ymax = Math.max(...series);
    const norm = (v: number) => height - 8 - ((v - ymin) / (ymax - ymin || 1)) * (height - 24);
    const pts = series.map((v, i) => [(i / (series.length - 1)) * w, norm(v)] as const);
    const d = pts
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");
    const area = `${d} L${w},${height} L0,${height} Z`;
    return { d, area, ymin, ymax };
  }, [series, height]);

  const pinColor = (s?: string) =>
    s === "critical"
      ? "#e879f9"
      : s === "alert"
        ? "#fb7185"
        : s === "watch"
          ? "#fbbf24"
          : "#34d399";

  return (
    <div className={cn("relative w-full", className)} style={{ height }}>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="riverFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.655 0.195 258)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="oklch(0.655 0.195 258)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="riverStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.71 0.135 215)" />
            <stop offset="50%" stopColor="oklch(0.655 0.195 258)" />
            <stop offset="100%" stopColor="oklch(0.635 0.215 295)" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={0}
            x2={w}
            y1={height * t}
            y2={height * t}
            stroke="white"
            strokeOpacity={0.04}
            strokeDasharray="2 4"
          />
        ))}
        <path d={area} fill="url(#riverFill)" />
        <path
          d={d}
          fill="none"
          stroke="url(#riverStroke)"
          strokeWidth={1.8}
          vectorEffect="non-scaling-stroke"
        />
        {pins.map((p, i) => (
          <g key={i} transform={`translate(${(p.at / (series.length - 1)) * w}, 0)`}>
            <line
              x1={0}
              x2={0}
              y1={4}
              y2={height - 4}
              stroke={pinColor(p.severity)}
              strokeOpacity={0.4}
              strokeDasharray="2 2"
            />
            <circle cx={0} cy={10} r={3.5} fill={pinColor(p.severity)} />
          </g>
        ))}
      </svg>
      <div className="absolute left-2 top-1 text-[10px] font-mono text-muted-foreground/60">
        {ymax.toFixed(2)}
      </div>
      <div className="absolute left-2 bottom-1 text-[10px] font-mono text-muted-foreground/60">
        {ymin.toFixed(2)}
      </div>
    </div>
  );
}
