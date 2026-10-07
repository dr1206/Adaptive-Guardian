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
  const text = size === "lg" ? "text-xl font-bold" : size === "sm" ? "text-sm font-semibold" : "text-base font-semibold";
  const shieldSize = size === "lg" ? 28 : size === "sm" ? 18 : 22;
  return (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      {showShield && <Shield size={shieldSize} />}
      <span className={cn("tracking-tight text-[#082A5C]", text)}>
        Adaptive Guardian
        <span className="ml-1 text-xs font-medium text-[#2563A6] uppercase tracking-wider">Bank</span>
      </span>
    </span>
  );
}
