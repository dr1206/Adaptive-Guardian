import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function WelcomeHeader({ name = "Amal" }: { name?: string }) {
  const [greeting, setGreeting] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(
      h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening",
    );
    setDate(
      new Date().toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }) + " · Lisbon",
    );
  }, []);

  const stats = [
    { label: "Available", value: "248,902.14", prefix: "€", spark: [40, 42, 48, 46, 52, 58, 64] },
    { label: "Today", value: "+ 1,420.40", prefix: "€", positive: true, spark: [20, 28, 22, 36, 30, 44, 56] },
    { label: "In (Jun)", value: "14,230", prefix: "€", spark: [12, 18, 25, 30, 28, 32, 40] },
    { label: "Out (Jun)", value: "9,184", prefix: "€", spark: [22, 26, 22, 28, 30, 26, 24] },
    { label: "Savings", value: "62,400", prefix: "€", spark: [38, 40, 42, 45, 48, 51, 54] },
    { label: "Investments", value: "2.48", prefix: "€", suffix: "M", spark: [30, 36, 32, 40, 44, 48, 56] },
  ];

  return (
    <section className="pt-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-[1.05] tracking-tight">
            {greeting}, <span className="text-gradient">{name}.</span>
          </h1>
          <p className="mt-2 inline-flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="grid place-items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_oklch(0.71_0.155_165)]" />
            </span>
            Session stable · recognized in 12&nbsp;ms
          </p>
        </div>
        <p className="font-numeric text-[12px] text-muted-foreground">{date}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <StatCell key={s.label} {...s} />
        ))}
      </div>
    </section>
  );
}

function StatCell({
  label,
  value,
  prefix,
  suffix,
  positive,
  spark,
}: {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  positive?: boolean;
  spark: number[];
}) {
  return (
    <div className="bg-[oklch(0.13_0.025_264/0.4)] px-4 py-3.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 flex items-baseline gap-1 font-numeric",
          positive && "text-success",
        )}
      >
        {prefix && <span className="text-[11px] opacity-70">{prefix}</span>}
        <span className="text-[18px] font-semibold tracking-tight">{value}</span>
        {suffix && <span className="text-[12px] opacity-70">{suffix}</span>}
      </div>
      <Spark points={spark} positive={positive} />
    </div>
  );
}

function Spark({ points, positive }: { points: number[]; positive?: boolean }) {
  const w = 100;
  const h = 18;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / (max - min || 1)) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-4 w-full">
      <path
        d={d}
        fill="none"
        stroke={positive ? "oklch(0.71 0.155 165)" : "oklch(0.715 0.135 215)"}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
