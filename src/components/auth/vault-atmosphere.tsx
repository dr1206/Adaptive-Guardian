import { cn } from "@/lib/utils";

/**
 * Clean enterprise base background.
 * Completely replaces futuristic aurora / particles with a clean, solid, professional banking canvas.
 */
export function VaultAtmosphere({
  className,
}: {
  intensity?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 bg-[#F5F7FA]", className)}
    />
  );
}
