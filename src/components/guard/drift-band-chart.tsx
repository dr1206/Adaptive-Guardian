import { useMemo } from "react";

export function DriftBandChart({ seed = 11, height = 180 }: { seed?: number; height?: number }) {
  const { line, bandTop, bandBottom, band } = useMemo(() => {
    const N = 60;
    const w = 600;
    const mid = height / 2;
    const rand = (i: number) => {
      const x = Math.sin((seed + 1) * (i + 9.1)) * 43758.5453;
      return x - Math.floor(x);
    };
    let l = "";
    let bt = "";
    let bb = "";
    const pts: { x: number; y: number; yt: number; yb: number }[] = [];
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * w;
      const drift = Math.sin(i * 0.14) * 0.12 + (rand(i) - 0.5) * 0.1;
      const y = mid - drift * (mid - 12);
      const yt = mid - 0.28 * (mid - 12);
      const yb = mid + 0.28 * (mid - 12);
      pts.push({ x, y, yt, yb });
      l += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
      bt += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${yt.toFixed(1)} `;
      bb += `${i === 0 ? "L" : "L"}${x.toFixed(1)} ${yb.toFixed(1)} `;
    }
    const bandPath = `M${pts[0].x} ${pts[0].yt} ${pts
      .slice(1)
      .map((p) => `L${p.x} ${p.yt}`)
      .join(" ")} ${pts
      .slice()
      .reverse()
      .map((p) => `L${p.x} ${p.yb}`)
      .join(" ")} Z`;
    return { line: l, bandTop: bt, bandBottom: bb, band: bandPath };
  }, [seed, height]);
  void bandTop;
  void bandBottom;
  return (
    <svg viewBox={`0 0 600 ${height}`} className="block w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="drift-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.655 0.195 258)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="oklch(0.715 0.135 215)" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <path
        d={band}
        fill="url(#drift-band)"
        stroke="oklch(0.655 0.195 258 / 0.35)"
        strokeWidth="0.8"
      />
      <line
        x1="0"
        x2="600"
        y1={height / 2}
        y2={height / 2}
        stroke="oklch(1 0 0 / 0.06)"
        strokeDasharray="3 4"
      />
      <path
        d={line}
        fill="none"
        stroke="oklch(0.715 0.135 215)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
