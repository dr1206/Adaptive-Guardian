/**
 * AsyncBoundary — unified loading / error / empty wrapper.
 *
 * Two call shapes are supported:
 *  - explicit:  <AsyncBoundary isLoading error isEmpty variant="table">{...}</AsyncBoundary>
 *  - adapter:   <AsyncBoundary state={asyncStateFromQuery(q)} variant="cards">…</AsyncBoundary>
 *
 * The `variant` prop swaps the loading skeleton for one that geometrically
 * matches the surface so navigation never produces layout shift.
 */

import type { ReactNode } from "react";

import {
  CardsSkeleton,
  ChartSkeleton,
  DashboardSkeleton,
  DefaultSkeleton,
  FormSkeleton,
  ListSkeleton,
  TableSkeleton,
  TimelineSkeleton,
} from "./skeletons";
import type { AsyncState } from "@/lib/async-state";

export type AsyncBoundaryVariant =
  | "default"
  | "list"
  | "table"
  | "cards"
  | "dashboard"
  | "chart"
  | "timeline"
  | "form";

interface AsyncBoundaryProps {
  /** Combined async state from `asyncStateFromQuery` / `combineAsyncStates`. */
  state?: AsyncState;
  isLoading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyLabel?: string;
  variant?: AsyncBoundaryVariant;
  /** Render a fully custom skeleton instead of the variant default. */
  loadingFallback?: ReactNode;
  children: ReactNode;
}

function renderSkeleton(variant: AsyncBoundaryVariant, custom?: ReactNode): ReactNode {
  if (custom) return custom;
  switch (variant) {
    case "list":
      return <ListSkeleton />;
    case "table":
      return <TableSkeleton />;
    case "cards":
      return <CardsSkeleton />;
    case "dashboard":
      return <DashboardSkeleton />;
    case "chart":
      return <ChartSkeleton />;
    case "timeline":
      return <TimelineSkeleton />;
    case "form":
      return <FormSkeleton />;
    case "default":
    default:
      return <DefaultSkeleton />;
  }
}

export function AsyncBoundary({
  state,
  isLoading,
  error,
  isEmpty,
  emptyLabel = "Nothing here yet.",
  variant = "default",
  loadingFallback,
  children,
}: AsyncBoundaryProps) {
  const loading = state?.isLoading ?? isLoading ?? false;
  const err = state?.error ?? error ?? null;
  const empty = state?.isEmpty ?? isEmpty ?? false;

  if (loading) return <>{renderSkeleton(variant, loadingFallback)}</>;

  if (err) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger"
      >
        <div className="font-medium">Couldn’t reach the service.</div>
        <div className="mt-1 text-muted-foreground">{err.message}</div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="grid place-items-center py-20 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return <>{children}</>;
}
