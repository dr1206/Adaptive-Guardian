import { cn } from "@/lib/utils";

const stages = [
  { id: "capture", label: "Capture", detail: "1.24k evt/s" },
  { id: "features", label: "Features", detail: "188 vec" },
  { id: "lgbm", label: "LightGBM", detail: "8.2 ms" },
  { id: "ocsvm", label: "OC-SVM", detail: "3.1 ms" },
  { id: "fusion", label: "Fusion", detail: "1.4 ms" },
  { id: "action", label: "Action", detail: "≤ 12 ms" },
];

export function PipelineFlow({ active = 3 }: { active?: number }) {
  return (
    <div className="relative overflow-x-auto">
      <div className="flex items-stretch gap-2 min-w-max">
        {stages.map((s, i) => (
          <div key={s.id} className="flex items-stretch gap-2">
            <div
              className={cn(
                "relative w-40 rounded-2xl border p-3 transition-colors",
                i <= active
                  ? "border-cyan-400/40 bg-cyan-500/[0.05]"
                  : "border-white/[0.06] bg-white/[0.02]",
              )}
            >
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-mono">
                Stage {i + 1}
              </div>
              <div className="text-sm font-semibold mt-1 text-foreground/95">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-mono">{s.detail}</div>
              {i === active && (
                <div className="absolute inset-0 rounded-2xl ring-2 ring-cyan-400/40 animate-pulse pointer-events-none" />
              )}
            </div>
            {i < stages.length - 1 && (
              <div className="flex items-center">
                <svg width="36" height="40" viewBox="0 0 36 40" className="text-cyan-400/40">
                  <defs>
                    <linearGradient id={`flow-${i}`} x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                      <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M2 20 L34 20" stroke={`url(#flow-${i})`} strokeWidth="1.5" />
                  <path
                    d="M28 14 L34 20 L28 26"
                    stroke="currentColor"
                    strokeOpacity="0.6"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
