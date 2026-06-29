/**
 * Contextual loading skeletons.
 *
 * Each variant mirrors the layout of a real page section so a perceived
 * "flash" of empty UI never happens between navigation and data arrival.
 * Visual tokens (border, surface, radius) match the live components so the
 * skeleton-to-content transition is geometrically stable.
 */

import { cn } from "@/lib/utils";

const SHIMMER =
  "relative overflow-hidden bg-white/[0.04] before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent before:animate-[shimmer_1.6s_ease-in-out_infinite]";

function Bar({ className }: { className?: string }) {
  return <div className={cn("h-3 rounded-md", SHIMMER, className)} />;
}

function Block({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("rounded-xl", SHIMMER, className)} style={style} />;
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02]"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 last:border-b-0"
        >
          <Block className="h-9 w-9" />
          <div className="flex-1 space-y-2">
            <Bar className="w-2/5" />
            <Bar className="h-2 w-1/3 opacity-70" />
          </div>
          <Bar className="h-2 w-16" />
        </li>
      ))}
    </ul>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading table"
      className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]"
    >
      <div
        className="grid gap-3 border-b border-white/[0.06] px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Bar key={i} className="h-2 w-3/4 opacity-60" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-3 border-b border-white/[0.04] px-4 py-3 last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Bar key={c} className={cn(c === 0 ? "w-2/3" : "w-1/2")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-5">
          <div className="mb-3 flex items-center justify-between">
            <Bar className="w-1/3" />
            <Bar className="h-2 w-10" />
          </div>
          <Bar className="mb-2 h-5 w-1/2" />
          <Bar className="mb-4 h-2 w-1/4 opacity-70" />
          <Block className="h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard" className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
            <Bar className="mb-3 h-2 w-1/3 opacity-70" />
            <Bar className="h-6 w-2/3" />
            <Bar className="mt-3 h-2 w-1/4 opacity-50" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Block className="h-64 lg:col-span-2" />
        <Block className="h-64" />
      </div>
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading chart"
      className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5"
    >
      <Bar className="mb-4 h-2 w-1/4 opacity-70" />
      <Block style={{ height }} />
      <div className="mt-3 flex justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bar key={i} className="h-2 w-8 opacity-60" />
        ))}
      </div>
    </div>
  );
}

export function TimelineSkeleton({ items = 6 }: { items?: number }) {
  return (
    <ol
      role="status"
      aria-busy="true"
      aria-label="Loading timeline"
      className="relative space-y-5 pl-6"
    >
      <span className="absolute bottom-2 left-2 top-2 w-px bg-white/[0.06]" />
      {Array.from({ length: items }).map((_, i) => (
        <li key={i} className="relative">
          <span className={cn("absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full", SHIMMER)} />
          <Bar className="mb-2 w-2/5" />
          <Bar className="h-2 w-3/5 opacity-70" />
        </li>
      ))}
    </ol>
  );
}

export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading form"
      className="space-y-5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6"
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Bar className="h-2 w-1/4 opacity-70" />
          <Block className="h-10 w-full" />
        </div>
      ))}
      <Block className="ml-auto h-10 w-32" />
    </div>
  );
}

export function DefaultSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="grid place-items-center py-20 text-sm text-muted-foreground"
    >
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        Loading…
      </div>
    </div>
  );
}
