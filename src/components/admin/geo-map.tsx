import { cn } from "@/lib/utils";

/** Luminous dot map — uses a simple flattened world silhouette. */
export function GeoMap({
  dots,
  className,
}: {
  dots: { x: number; y: number; intensity: number; anomaly?: boolean }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full aspect-[2.4/1] rounded-xl border border-white/[0.06] overflow-hidden bg-[radial-gradient(ellipse_at_center,oklch(0.255_0.04_264)_0%,oklch(0.195_0.035_264)_100%)]",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 42"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {/* graticule */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <line
            key={`v${i}`}
            x1={i * 10}
            x2={i * 10}
            y1="0"
            y2="42"
            stroke="white"
            strokeOpacity="0.04"
          />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`h${i}`}
            x1="0"
            x2="100"
            y1={i * 10 + 1}
            y2={i * 10 + 1}
            stroke="white"
            strokeOpacity="0.04"
          />
        ))}
        {/* dots */}
        {dots.map((d, i) => (
          <g key={i}>
            {d.anomaly && (
              <circle cx={d.x} cy={d.y} r={1.6} fill="none" stroke="#fb7185" strokeOpacity={0.7}>
                <animate
                  attributeName="r"
                  from="0.6"
                  to="2.4"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.9"
                  to="0"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
            <circle
              cx={d.x}
              cy={d.y}
              r={d.anomaly ? 0.9 : 0.5 + d.intensity * 0.7}
              fill={d.anomaly ? "#fb7185" : "oklch(0.71 0.135 215)"}
              opacity={d.anomaly ? 1 : 0.3 + d.intensity * 0.6}
            />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-2 right-3 text-[10px] font-mono text-muted-foreground/70">
        live · 80 events / 5 min
      </div>
    </div>
  );
}
