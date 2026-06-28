import { cn } from "@/lib/utils";
import { Shield } from "./shield";

export function Wordmark({
  className,
  showShield = true,
  size = "md",
}: {
  className?: string;
  showShield?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  const shieldSize = size === "lg" ? 32 : size === "sm" ? 18 : 24;
  return (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      {showShield && <Shield size={shieldSize} />}
      <span
        className={cn("font-display font-semibold tracking-tight lowercase", text)}
        style={{ letterSpacing: "-0.03em" }}
      >
        adaptiveguard
        <span className="ml-0.5 opacity-60 font-normal">.ai</span>
      </span>
    </span>
  );
}
