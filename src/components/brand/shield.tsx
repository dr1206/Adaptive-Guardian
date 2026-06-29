import { cn } from "@/lib/utils";

/**
 * AdaptiveGuard "Adaptive Shield".
 * Two strokes meeting at a slight 2° offset — the asymmetry IS the brand.
 * The aperture (◐) idly rotates 0.5°/s when `live` is set.
 */
export function Shield({
  className,
  size = 28,
  live = false,
  filled = false,
}: {
  className?: string;
  size?: number;
  live?: boolean;
  filled?: boolean;
}) {
  return (
    <span
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <linearGradient id="ag-shield-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.655 0.195 258)" />
            <stop offset="50%" stopColor="oklch(0.715 0.135 215)" />
            <stop offset="100%" stopColor="oklch(0.635 0.215 295)" />
          </linearGradient>
        </defs>
        {/* shield outline — slightly asymmetric */}
        <path
          d="M12 2.6 L20.6 5.2 V12.4 C20.6 17 16.9 20.5 12 21.6 C7.1 20.5 3.4 17 3.4 12.4 V5.2 Z"
          stroke={filled ? "transparent" : "url(#ag-shield-grad)"}
          fill={filled ? "url(#ag-shield-grad)" : "transparent"}
          strokeWidth="1.5"
          style={{ transform: "rotate(2deg)", transformOrigin: "12px 12px" }}
        />
      </svg>
      {/* aperture core */}
      <span
        className="absolute"
        style={{
          width: size * 0.34,
          height: size * 0.34,
          animation: live ? "shield-aperture 720s linear infinite" : undefined,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="6"
            stroke="oklch(0.715 0.135 215)"
            strokeWidth="2"
            strokeDasharray="0 18 30"
          />
        </svg>
      </span>
      <style>{`
        @keyframes shield-aperture {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
}

/**
 * Aperture spinner — the AdaptiveGuard loading state.
 * Replaces all generic ring spinners across the product.
 */
export function ApertureSpinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-block", className)}
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <circle cx="12" cy="12" r="9" stroke="oklch(1 0 0 / 0.08)" strokeWidth="2" />
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="url(#ag-spin-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="14 60"
          style={{
            animation: "ag-spin 1.1s cubic-bezier(0.22,1,0.36,1) infinite",
            transformOrigin: "12px 12px",
          }}
        />
        <defs>
          <linearGradient id="ag-spin-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.655 0.195 258)" />
            <stop offset="100%" stopColor="oklch(0.715 0.135 215)" />
          </linearGradient>
        </defs>
      </svg>
      <style>{`@keyframes ag-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
