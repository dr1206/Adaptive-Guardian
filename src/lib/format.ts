/**
 * Presentation-only formatters. Safe for components to import directly.
 */

export function fmt(n: number, c = "€", min = 2): string {
  const s = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: min,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "−" : ""}${c} ${s}`;
}
