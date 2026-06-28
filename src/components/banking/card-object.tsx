import { cn } from "@/lib/utils";
import { SignatureGlyph } from "@/components/brand/signature-glyph";
import { Shield } from "@/components/brand/shield";

/**
 * SignatureCard — the metal-card artifact awarded at end of enrollment.
 * 3D tilt on hover; embossed text fades in line-by-line.
 */
export function SignatureCard({
  name = "Member",
  tier = "Wealth",
  glyphSeed = "guest",
  reveal = true,
  className,
}: {
  name?: string;
  tier?: "Personal" | "Wealth" | "Sovereign";
  glyphSeed?: string;
  reveal?: boolean;
  className?: string;
}) {
  const finish =
    tier === "Sovereign"
      ? "linear-gradient(135deg,#1a1d24 0%,#0c0e12 60%,#23262d 100%)"
      : tier === "Wealth"
        ? "linear-gradient(135deg,#3a2f1f 0%,#1a1410 55%,#5a4628 100%)"
        : "linear-gradient(135deg,#2a2e36 0%,#16191f 60%,#3a3f49 100%)";
  const accent =
    tier === "Wealth" ? "#d6b66a" : tier === "Sovereign" ? "#cdd3e0" : "#9aa3b2";

  return (
    <div
      className={cn(
        "group relative aspect-[1.586/1] w-full max-w-[420px] [perspective:1200px]",
        className,
      )}
    >
      <div
        className={cn(
          "relative h-full w-full rounded-[22px] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "[transform-style:preserve-3d]",
          reveal
            ? "[transform:rotateX(0deg)_rotateY(0deg)] group-hover:[transform:rotateX(6deg)_rotateY(-10deg)]"
            : "[transform:rotateY(80deg)]",
        )}
        style={{
          background: finish,
          boxShadow:
            "0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 1px 0 rgba(255,255,255,0.1) inset",
        }}
      >
        {/* sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[22px] opacity-60"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.08) 45%, transparent 60%)",
          }}
        />
        {/* etched grid */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
          viewBox="0 0 400 252"
        >
          <defs>
            <pattern id="etch" width="14" height="14" patternUnits="userSpaceOnUse">
              <path d="M 14 0 L 0 0 0 14" stroke={accent} strokeWidth="0.3" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#etch)" />
        </svg>

        <div className="relative flex h-full flex-col justify-between p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Shield size={22} />
              <span
                className="font-display text-sm font-semibold lowercase"
                style={{ color: accent, letterSpacing: "-0.02em" }}
              >
                adaptiveguard
              </span>
            </div>
            <span
              className="font-numeric text-[10px] uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              {tier} · Member
            </span>
          </div>

          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <SignatureGlyph seed={glyphSeed} size={88} />
          </div>

          <div className="space-y-1">
            <div
              className="font-numeric text-[10px] uppercase tracking-[0.22em]"
              style={{ color: accent, opacity: 0.7 }}
            >
              Signature
            </div>
            <div
              className="font-display text-xl font-semibold tracking-tight"
              style={{ color: accent }}
            >
              {name}
            </div>
            <div
              className="font-numeric text-[11px] uppercase tracking-[0.18em]"
              style={{ color: accent, opacity: 0.6 }}
            >
              Member since · Jun 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
