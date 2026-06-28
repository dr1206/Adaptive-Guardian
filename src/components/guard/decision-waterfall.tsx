export type Petal = {
  label: string;
  weight: number; // -100..100
  sentence: string;
};

export function DecisionWaterfall({ petals }: { petals: Petal[] }) {
  const max = Math.max(...petals.map((p) => Math.abs(p.weight)));
  return (
    <ul className="space-y-2.5">
      {petals.map((p) => {
        const positive = p.weight >= 0;
        const pct = (Math.abs(p.weight) / max) * 100;
        return (
          <li
            key={p.label}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors hover:border-white/10"
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${pct}%`,
                background: positive
                  ? "linear-gradient(90deg, oklch(0.71 0.155 165 / 0.18), oklch(0.71 0.155 165 / 0))"
                  : "linear-gradient(90deg, oklch(0.78 0.14 75 / 0.18), oklch(0.78 0.14 75 / 0))",
                transition: "width .9s cubic-bezier(.2,.8,.2,1)",
              }}
            />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{p.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">{p.sentence}</div>
              </div>
              <div
                className={`font-numeric text-[14px] tabular-nums ${
                  positive ? "text-success" : "text-warning"
                }`}
              >
                {positive ? "+" : ""}
                {p.weight}%
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
