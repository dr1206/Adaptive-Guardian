import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ApertureSpinner } from "@/components/brand/shield";

/**
 * ApertureInput — banking-grade 56px input.
 * Floating label, semantic icon left, validity glyph right (morphs aperture → check).
 */
type State = "idle" | "validating" | "valid" | "error";

export interface ApertureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  state?: State;
  icon?: React.ComponentType<{ className?: string }>;
  whyWeAsk?: string;
}

export const ApertureInput = forwardRef<HTMLInputElement, ApertureInputProps>(
  ({ label, hint, state = "idle", icon: Icon, whyWeAsk, className, id, ...props }, ref) => {
    const inputId = id ?? `agi-${label.replace(/\s+/g, "-").toLowerCase()}`;
    return (
      <div className={cn("group", className)}>
        <div
          className={cn(
            "relative flex h-[56px] items-center rounded-2xl border bg-white/[0.025] px-4 transition-all",
            state === "error"
              ? "border-danger/60"
              : state === "valid"
                ? "border-success/50"
                : "border-white/10 focus-within:border-accent/60 focus-within:shadow-glow-cyan",
          )}
        >
          {Icon && (
            <Icon className="mr-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-accent" />
          )}
          <div className="relative flex-1">
            <label
              htmlFor={inputId}
              className={cn(
                "pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200",
                "peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-[0.16em] peer-focus:text-accent",
                "peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.16em]",
              )}
            >
              {label}
            </label>
            <input
              ref={ref}
              id={inputId}
              placeholder=" "
              className="peer w-full bg-transparent pt-3 text-sm text-foreground caret-accent outline-none placeholder:text-transparent"
              {...props}
            />
          </div>
          <span className="ml-3 grid h-6 w-6 place-items-center">
            {state === "validating" && <ApertureSpinner size={16} />}
            {state === "valid" && (
              <span className="grid h-6 w-6 place-items-center rounded-full bg-success/15 text-success animate-scale-in">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
          </span>
        </div>
        {(hint || whyWeAsk) && (
          <div className="mt-2 flex items-center justify-between px-1 text-[11px]">
            <span className={cn(state === "error" ? "text-danger" : "text-muted-foreground")}>
              {hint}
            </span>
            {whyWeAsk && (
              <span
                className="text-muted-foreground/70 underline decoration-dotted underline-offset-2 cursor-help"
                title={whyWeAsk}
              >
                Why we ask
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);
ApertureInput.displayName = "ApertureInput";
