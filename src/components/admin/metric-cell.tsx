import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { signalTone, type Signal } from "@/lib/admin-signal";
import { SignalDot } from "./signal-dot";

function useCountUp(target: number, duration = 700) {
  const [v, setV] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const step = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function fmt(n: number, suffix: string) {
  if (suffix === "%") return n.toFixed(1) + "%";
  if (n >= 1000) return Math.round(n).toLocaleString();
  if (n < 1 && n > 0) return n.toFixed(2);
  return Math.round(n).toString();
}

function MiniSpark({ series, signal }: { series: number[]; signal: Signal }) {
  const w = 100,
    h = 28;
  const min = Math.min(...series),
    max = Math.max(...series);
  const norm = (v: number) => (max === min ? h / 2 : h - ((v - min) / (max - min)) * h);
  const d = series
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i / (series.length - 1)) * w},${norm(v)}`)
    .join(" ");
  const stroke =
    signal === "ok"
      ? "stroke-emerald-400/80"
      : signal === "watch"
        ? "stroke-amber-400/80"
        : signal === "alert"
          ? "stroke-rose-400/80"
          : "stroke-fuchsia-400/80";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
      <path
        d={d}
        fill="none"
        strokeWidth={1.5}
        className={stroke}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function MetricCell({
  label,
  value,
  suffix = "",
  delta,
  series,
  signal = "ok",
  className,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  delta?: number | string;
  series?: number[];
  signal?: Signal;
  className?: string;
}) {
  const numericTarget = typeof value === "number" ? value : null;
  const animated = useCountUp(numericTarget ?? 0);
  const tone = signalTone[signal];

  const display = typeof value === "string" ? value : fmt(animated, suffix);

  const deltaNum = typeof delta === "number" ? delta : null;
  const deltaCls =
    deltaNum == null
      ? "text-muted-foreground"
      : deltaNum > 0
        ? "text-emerald-300"
        : deltaNum < 0
          ? "text-rose-300"
          : "text-muted-foreground";

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-white/[0.06] bg-[oklch(0.225_0.035_264/0.55)] backdrop-blur-xl p-4",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] hover:border-white/[0.12] transition-colors",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/90 font-medium">
          {label}
        </span>
        <SignalDot signal={signal} />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span data-numeric className="text-2xl font-semibold tracking-tight text-foreground/95">
          {display}
        </span>
        {typeof value === "number" && suffix && suffix !== "%" && (
          <span className="text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium font-mono",
            tone.bg,
            deltaCls,
          )}
        >
          {typeof delta === "number" ? (delta > 0 ? "▲" : delta < 0 ? "▼" : "·") : "·"}{" "}
          {String(delta ?? "—")}
        </span>
        {series && (
          <div className="flex-1 min-w-0">
            <MiniSpark series={series} signal={signal} />
          </div>
        )}
      </div>
    </div>
  );
}
