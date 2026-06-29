import { cn } from "@/lib/utils";

/** 0..1 gauge with banded arcs (calm / watch / alert). */
export function RiskGauge({
  value,
  size = 180,
  label = "Risk index",
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  const dash = c * 0.75;
  const filled = dash * Math.max(0, Math.min(1, value));
  const cx = size / 2,
    cy = size / 2;

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-[225deg]">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="white"
          strokeOpacity={0.06}
          strokeWidth={10}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={
            value > 0.7
              ? "#e879f9"
              : value > 0.45
                ? "#fb7185"
                : value > 0.25
                  ? "#fbbf24"
                  : "#34d399"
          }
          strokeWidth={10}
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
        <div data-numeric className="text-3xl font-semibold">
          {Math.round(value * 100)}
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
          {label}
        </div>
      </div>
      <div className="flex w-full justify-between mt-1 px-3 text-[10px] font-mono text-muted-foreground/70">
        <span>calm</span>
        <span>watch</span>
        <span>alert</span>
      </div>
    </div>
  );
}
