import { Shield } from "@/components/brand/shield";

type Size = "sm" | "md" | "lg" | "xl";
const DIM: Record<Size, { box: number; r: number; sw: number; numeric: string }> = {
  sm: { box: 56, r: 22, sw: 4, numeric: "text-[11px]" },
  md: { box: 180, r: 72, sw: 6, numeric: "text-[28px]" },
  lg: { box: 280, r: 116, sw: 8, numeric: "text-[52px]" },
  xl: { box: 340, r: 140, sw: 9, numeric: "text-[64px]" },
};

export function ConfidenceRing({
  value,
  ghost,
  size = "lg",
  label = "Confidence",
  showShield = true,
}: {
  value: number;
  ghost?: number;
  size?: Size;
  label?: string;
  showShield?: boolean;
}) {
  const d = DIM[size];
  const c = 2 * Math.PI * d.r;
  const off = c - (value / 100) * c;
  const gOff = ghost != null ? c - (ghost / 100) * c : undefined;
  const cx = d.box / 2;
  const id = `cr-${size}-${Math.round(value * 10)}`;

  return (
    <div className="relative grid place-items-center" style={{ width: d.box, height: d.box }}>
      <svg viewBox={`0 0 ${d.box} ${d.box}`} className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.655 0.195 258)" />
            <stop offset="55%" stopColor="oklch(0.715 0.135 215)" />
            <stop offset="100%" stopColor="oklch(0.635 0.215 295)" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cx}
          r={d.r}
          stroke="oklch(1 0 0 / 0.05)"
          strokeWidth={d.sw}
          fill="none"
        />
        {gOff != null && (
          <circle
            cx={cx}
            cy={cx}
            r={d.r}
            stroke="oklch(1 0 0 / 0.12)"
            strokeWidth={Math.max(1, d.sw - 4)}
            strokeDasharray={c}
            strokeDashoffset={gOff}
            strokeLinecap="round"
            fill="none"
          />
        )}
        <circle
          cx={cx}
          cy={cx}
          r={d.r}
          stroke={`url(#${id})`}
          strokeWidth={d.sw}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          fill="none"
          style={{
            filter: "drop-shadow(0 0 18px oklch(0.715 0.135 215 / 0.35))",
            animation: "cr-breathe 6s ease-in-out infinite",
            transformOrigin: `${cx}px ${cx}px`,
            transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </svg>
      <div className="relative text-center">
        {showShield && size !== "sm" && (
          <Shield
            size={size === "xl" ? 26 : size === "lg" ? 22 : 16}
            className="mx-auto opacity-70"
          />
        )}
        <div
          className={`mt-0.5 font-numeric ${d.numeric} font-semibold tracking-tight tabular-nums`}
        >
          {value.toFixed(size === "sm" ? 0 : 1)}
          {size !== "sm" && <span className="ml-0.5 text-[0.4em] text-muted-foreground">%</span>}
        </div>
        {size !== "sm" && (
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </div>
        )}
      </div>
      <style>{`@keyframes cr-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.012)} }`}</style>
    </div>
  );
}
