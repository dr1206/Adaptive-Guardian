import { useMemo } from "react";

export function WaveformTrace({
  seed = 7,
  height = 80,
  baseline = true,
  color = "oklch(0.715 0.135 215)",
  baselineColor = "oklch(0.655 0.195 258 / 0.45)",
}: {
  seed?: number;
  height?: number;
  baseline?: boolean;
  color?: string;
  baselineColor?: string;
}) {
  const { path, base, area } = useMemo(() => {
    const N = 96;
    const w = 600;
    const mid = height / 2;
    const rand = (i: number) => {
      const x = Math.sin((seed + 1) * (i + 13.7)) * 43758.5453;
      return x - Math.floor(x);
    };
    let p = "";
    let b = "";
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * w;
      const env = Math.sin((i / N) * Math.PI) * 0.85 + 0.15;
      const v =
        Math.sin(i * 0.42 + seed) * 0.55 +
        Math.sin(i * 0.18 + seed * 1.7) * 0.3 +
        (rand(i) - 0.5) * 0.35;
      const y = mid - v * env * (mid - 4);
      const yb = mid - Math.sin(i * 0.42 + seed) * 0.55 * env * (mid - 4);
      p += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
      b += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${yb.toFixed(1)} `;
    }
    const a = `${p} L${w} ${height} L0 ${height} Z`;
    return { path: p, base: b, area: a };
  }, [seed, height]);
  const gid = `wf-${seed}`;
  return (
    <svg viewBox={`0 0 600 ${height}`} className="block w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      {baseline && (
        <path d={base} fill="none" stroke={baselineColor} strokeWidth="1" strokeDasharray="3 4" />
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}
