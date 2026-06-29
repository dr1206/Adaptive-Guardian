/**
 * Presentation utilities for the AI-SOC cockpit.
 *
 * Pure helpers — no data, no service access. Routes and components are free
 * to import these directly (same boundary as `src/lib/format.ts`):
 *
 *  - `Signal` — semantic status enum used by widgets, dots, tones.
 *  - `signalTone` — CSS class map.
 *  - `seedSeries` / `seedHeat` — deterministic placeholder generators for
 *    spark lines and heatmaps that don't represent business data.
 */

export type Signal = "ok" | "watch" | "alert" | "critical";

export const signalTone: Record<Signal, { fg: string; bg: string; ring: string; label: string }> = {
  ok: {
    fg: "text-emerald-300",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/30",
    label: "Healthy",
  },
  watch: { fg: "text-amber-300", bg: "bg-amber-500/10", ring: "ring-amber-500/30", label: "Watch" },
  alert: { fg: "text-rose-300", bg: "bg-rose-500/10", ring: "ring-rose-500/30", label: "Alert" },
  critical: {
    fg: "text-fuchsia-300",
    bg: "bg-fuchsia-500/10",
    ring: "ring-fuchsia-500/30",
    label: "Critical",
  },
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedSeries(seed: number, n = 64, min = 0, max = 1, smooth = 0.6) {
  const rng = mulberry32(seed);
  const out: number[] = [];
  let v = (min + max) / 2;
  for (let i = 0; i < n; i++) {
    const target = min + rng() * (max - min);
    v = v * smooth + target * (1 - smooth);
    out.push(v);
  }
  return out;
}

export function seedHeat(seed: number, cols = 24, rows = 7) {
  const rng = mulberry32(seed);
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => rng()));
}
