import { useMemo } from "react";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function RiskHeatmap({ seed = 3 }: { seed?: number }) {
  const cells = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < 7 * 24; i++) {
      const x = Math.sin((seed + 1) * (i + 5.3)) * 43758.5453;
      const r = x - Math.floor(x);
      const intensity = Math.max(0, r - 0.78) * (r > 0.96 ? 2 : 1);
      out.push(Math.min(1, intensity));
    }
    return out;
  }, [seed]);

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between py-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
        {DAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="flex-1">
        <div
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: "repeat(24, minmax(0,1fr))" }}
        >
          {cells.map((v, i) => (
            <div
              key={i}
              className="aspect-square rounded-[3px]"
              style={{
                background:
                  v < 0.02
                    ? "oklch(1 0 0 / 0.03)"
                    : `oklch(${0.55 + v * 0.15} ${0.18 - v * 0.05} ${258 - v * 80} / ${0.25 + v * 0.7})`,
              }}
              title={`Risk ${(v * 100).toFixed(0)}%`}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/70">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>
    </div>
  );
}
