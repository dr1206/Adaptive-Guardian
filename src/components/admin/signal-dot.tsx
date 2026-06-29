import type { Signal } from "@/lib/admin-signal";

const tones: Record<Signal, string> = {
  ok: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]",
  watch: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.55)]",
  alert: "bg-rose-400 shadow-[0_0_12px_rgba(244,114,182,0.55)]",
  critical: "bg-fuchsia-400 shadow-[0_0_14px_rgba(232,121,249,0.65)]",
};

export function SignalDot({ signal, pulse = true, size = 8 }: { signal: Signal; pulse?: boolean; size?: number }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {pulse && (
        <span className={`absolute inset-0 rounded-full opacity-60 ${tones[signal].split(" ")[0]} animate-ping`} />
      )}
      <span className={`relative inline-block rounded-full ${tones[signal]}`} style={{ width: size, height: size }} />
    </span>
  );
}
