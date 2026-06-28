import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * OTP Pucks — 6 glass cylinders. Last digit triggers a left→right pulse.
 */
export function OtpPucks({
  length = 6,
  onComplete,
  className,
}: {
  length?: number;
  onComplete?: (code: string) => void;
  className?: string;
}) {
  const [vals, setVals] = useState<string[]>(Array.from({ length }, () => ""));
  const [pulse, setPulse] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function set(i: number, v: string) {
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...vals];
    next[i] = ch;
    setVals(next);
    if (ch && i < length - 1) refs.current[i + 1]?.focus();
    if (next.every((c) => c)) {
      setPulse(true);
      onComplete?.(next.join(""));
    }
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !vals[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!t) return;
    e.preventDefault();
    const next = Array.from({ length }, (_, i) => t[i] ?? "");
    setVals(next);
    if (next.every((c) => c)) {
      setPulse(true);
      onComplete?.(next.join(""));
    } else {
      refs.current[Math.min(t.length, length - 1)]?.focus();
    }
  }

  return (
    <div className={cn("flex items-center gap-2.5 sm:gap-3", className)}>
      {vals.map((v, i) => (
        <div key={i} className="relative">
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={v}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            onPaste={onPaste}
            className={cn(
              "font-numeric h-16 w-12 rounded-2xl border bg-white/[0.03] text-center text-2xl font-semibold tabular-nums outline-none transition-all sm:h-[68px] sm:w-14",
              v ? "border-accent/40 shadow-glow-cyan" : "border-white/10",
              "focus:border-accent focus:shadow-glow-cyan",
            )}
            style={
              pulse
                ? {
                    animation: `puck-pulse 600ms ${i * 80}ms cubic-bezier(0.22,1,0.36,1) both`,
                  }
                : undefined
            }
          />
          {/* puck cap highlight */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-1.5 top-1 h-2 rounded-full bg-white/8"
          />
        </div>
      ))}
      <style>{`
        @keyframes puck-pulse {
          0% { transform: translateY(0) scale(1); box-shadow: 0 0 0 0 oklch(0.715 0.135 215 / 0.4); }
          50% { transform: translateY(-3px) scale(1.04); box-shadow: 0 10px 28px -10px oklch(0.715 0.135 215 / 0.6); }
          100% { transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
