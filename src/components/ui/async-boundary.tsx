import type { ReactNode } from "react";

interface AsyncBoundaryProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty?: boolean;
  emptyLabel?: string;
  children: ReactNode;
}

/**
 * Compact loading/error/empty boundary for service-backed surfaces.
 * Routes wrap their body so every async state has consistent affordances.
 */
export function AsyncBoundary({
  isLoading,
  error,
  isEmpty,
  emptyLabel = "Nothing here yet.",
  children,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return (
      <div className="grid place-items-center py-20 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          Loading…
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger"
      >
        <div className="font-medium">Couldn’t reach the service.</div>
        <div className="mt-1 text-muted-foreground">{error.message}</div>
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className="grid place-items-center py-20 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }
  return <>{children}</>;
}
