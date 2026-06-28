import { useEffect, useState } from "react";

export function AuroraStrip({ height = 8 }: { height?: number }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((v) => (v + 1) % 1000), 60);
    return () => clearInterval(i);
  }, []);
  const x = 12 + ((t * 0.6) % 76);
  return (
    <div
      className="relative w-full overflow-hidden rounded-full border border-white/[0.05]"
      style={{ height }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.225 0.04 264 / 0.6), oklch(0.225 0.04 264 / 0.3), oklch(0.225 0.04 264 / 0.6))",
        }}
      />
      <div
        className="absolute inset-y-0"
        style={{
          left: 0,
          right: 0,
          background:
            "linear-gradient(90deg, transparent, oklch(0.655 0.195 258 / 0.5), oklch(0.715 0.135 215 / 0.7), oklch(0.635 0.215 295 / 0.5), transparent)",
          maskImage:
            "linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)",
        }}
      />
      <div
        className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_oklch(0.715_0.135_215_/_0.8)]"
        style={{ left: `${x}%`, transition: "left .12s linear" }}
      />
    </div>
  );
}
