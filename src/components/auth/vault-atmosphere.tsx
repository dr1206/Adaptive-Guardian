import { cn } from "@/lib/utils";

/**
 * VaultAtmosphere — the persistent identity layer behind every auth screen.
 * Aurora + grain + vignette. Sits below all content (z=-10).
 */
export function VaultAtmosphere({
  intensity = 1,
  className,
}: {
  intensity?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
      style={{ opacity: intensity }}
    >
      {/* deep base */}
      <div className="absolute inset-0" style={{ background: "#0B1120" }} />

      {/* aurora — slow drift */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 20%, oklch(0.655 0.195 258 / 0.18), transparent 60%), radial-gradient(45% 40% at 80% 30%, oklch(0.715 0.135 215 / 0.14), transparent 65%), radial-gradient(55% 45% at 60% 90%, oklch(0.635 0.215 295 / 0.16), transparent 60%)",
          animation: "vault-aurora 60s cubic-bezier(0.65,0,0.35,1) infinite alternate",
        }}
      />

      {/* grain */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.025] mix-blend-overlay">
        <filter id="vault-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#vault-grain)" />
      </svg>

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 50%, transparent 40%, oklch(0.13 0.025 264 / 0.55) 100%)",
        }}
      />

      <style>{`
        @keyframes vault-aurora {
          0% { transform: translate3d(0,0,0) scale(1); }
          100% { transform: translate3d(-3%, 2%, 0) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-vault-aurora] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
