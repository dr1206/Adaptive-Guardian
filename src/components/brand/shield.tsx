import { cn } from "@/lib/utils";

/**
 * Professional, clean Adaptive Guardian shield icon.
 * Deep trustworthy navy/blue with verified check mark geometry.
 */
export function Shield({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
  live?: boolean;
  filled?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex items-center justify-center shrink-0 text-[#0B3A82]", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" strokeWidth="2" />
      </svg>
    </span>
  );
}

export function ApertureSpinner({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block animate-spin text-[#0B3A82]", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
      </svg>
    </span>
  );
}
