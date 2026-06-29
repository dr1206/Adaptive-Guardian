import { cn } from "@/lib/utils";

/**
 * SignatureGlyph — a per-user identity mark.
 * Derived from a seed (in real life: a hash of behavioral vector).
 * Renders a 6-pointed radial filament inside a hexagonal frame.
 */
export function SignatureGlyph({
  seed = "adaptiveguard",
  size = 96,
  className,
  animated = true,
}: {
  seed?: string;
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  // deterministic seeded amplitudes for the 6 axes (0..1)
  const axes = Array.from({ length: 6 }, (_, i) => {
    let h = 2166136261;
    const s = `${seed}-${i}`;
    for (let k = 0; k < s.length; k++) {
      h ^= s.charCodeAt(k);
      h = Math.imul(h, 16777619);
    }
    return 0.45 + (((h >>> 0) % 1000) / 1000) * 0.55;
  });

  const cx = 50;
  const cy = 50;
  const R = 38;
  const points = axes.map((amp, i) => {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return [cx + Math.cos(a) * R * amp, cy + Math.sin(a) * R * amp] as const;
  });

  const path =
    "M " +
    points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ") +
    " Z";

  // hex frame
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return `${(cx + Math.cos(a) * 45).toFixed(2)},${(cy + Math.sin(a) * 45).toFixed(2)}`;
  }).join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn(className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`sg-${seed}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.655 0.195 258)" />
          <stop offset="55%" stopColor="oklch(0.715 0.135 215)" />
          <stop offset="100%" stopColor="oklch(0.635 0.215 295)" />
        </linearGradient>
        <radialGradient id={`sg-${seed}-glow`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor="oklch(0.715 0.135 215 / 0.4)" />
          <stop offset="100%" stopColor="oklch(0.715 0.135 215 / 0)" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r="44" fill={`url(#sg-${seed}-glow)`} />
      <polygon points={hex} fill="none" stroke="oklch(1 0 0 / 0.12)" strokeWidth="0.6" />
      {/* spokes */}
      {axes.map((_, i) => {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * 45}
            y2={cy + Math.sin(a) * 45}
            stroke="oklch(1 0 0 / 0.06)"
            strokeWidth="0.4"
          />
        );
      })}
      {/* filament */}
      <path
        d={path}
        fill={`url(#sg-${seed}-g)`}
        fillOpacity="0.18"
        stroke={`url(#sg-${seed}-g)`}
        strokeWidth="1.2"
        strokeLinejoin="round"
        style={
          animated
            ? { animation: "sg-breathe 6s cubic-bezier(0.65,0,0.35,1) infinite", transformOrigin: `${cx}px ${cy}px` }
            : { transformOrigin: `${cx}px ${cy}px` }
        }
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.4" fill="oklch(0.95 0.04 215)" />
      ))}
      <circle cx={cx} cy={cy} r="1.6" fill="oklch(0.95 0.04 215)" />
      <style>{`
        @keyframes sg-breathe {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>
    </svg>
  );
}
