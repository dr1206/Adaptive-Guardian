/**
 * Presentation-only formatters. Safe for components to import directly.
 */

export function fmt(n: number, c = "₹", min = 2): string {
  const s = Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: min,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "−" : ""}${c} ${s}`;
}

/** Short format (no decimals) for dashboard cards. */
export function fmtShort(n: number, c = "₹"): string {
  const s = Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${n < 0 ? "−" : ""}${c} ${s}`;
}
