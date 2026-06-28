import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function PressHoldButton({
  label,
  holdMs = 1100,
  onComplete,
  className,
}: {
  label: string;
  holdMs?: number;
  onComplete: () => void;
  className?: string;
}) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const raf = useRef<number | null>(null);
  const start = useRef<number>(0);

  const begin = () => {
    if (done) return;
    start.current = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start.current) / holdMs);
      setProgress(p);
      if (p >= 1) {
        setDone(true);
        onComplete();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  const cancel = () => {
    if (done) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    setProgress(0);
  };

  const r = 22;
  const c = 2 * Math.PI * r;

  return (
    <button
      onMouseDown={begin}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onTouchStart={begin}
      onTouchEnd={cancel}
      onKeyDown={(e) => e.key === " " && begin()}
      onKeyUp={cancel}
      className={cn(
        "relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/20 via-accent/15 to-purple/15 px-8 font-display text-[14px] font-semibold tracking-tight transition-all hover:border-accent/50",
        done && "border-success/50 from-success/30 to-success/20",
        className,
      )}
    >
      <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="48" height="48" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r={r} stroke="oklch(1 0 0 / 0.12)" strokeWidth="2" fill="none" />
        <circle
          cx="25"
          cy="25"
          r={r}
          stroke="oklch(0.715 0.135 215)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - progress * c}
          transform="rotate(-90 25 25)"
          style={{ filter: "drop-shadow(0 0 6px oklch(0.715 0.135 215 / 0.6))" }}
        />
      </svg>
      <span className="pr-12">{done ? "✓ Sent" : label}</span>
    </button>
  );
}
