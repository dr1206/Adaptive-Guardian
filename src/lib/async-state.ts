/**
 * React Query adapter helpers for the AsyncBoundary pattern.
 *
 * Routes wrap their body in <AsyncBoundary /> and the boundary needs the same
 * tiny shape from every query (or combination of queries). These helpers
 * remove the per-route boilerplate of mapping `isLoading`, `error`, `data` and
 * "first error wins / all loaded" reductions without changing UI behavior.
 */

import type { UseQueryResult } from "@tanstack/react-query";

export interface AsyncState {
  isLoading: boolean;
  error: Error | null;
  isEmpty?: boolean;
}

/** Map a single React Query result into the AsyncBoundary props shape. */
export function asyncStateFromQuery<T>(
  query: Pick<UseQueryResult<T>, "isLoading" | "error" | "data">,
  isEmpty?: (data: T) => boolean,
): AsyncState {
  return {
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    isEmpty: query.data !== undefined && isEmpty ? isEmpty(query.data) : undefined,
  };
}

/**
 * Combine N query results — loading if any is loading, first error wins.
 * Use when a route needs more than one dataset before it can render.
 */
export function combineAsyncStates(
  ...queries: ReadonlyArray<Pick<UseQueryResult<unknown>, "isLoading" | "error">>
): AsyncState {
  return {
    isLoading: queries.some((q) => q.isLoading),
    error: (queries.find((q) => q.error)?.error as Error | null) ?? null,
  };
}

/** Convenience: render-time fallback so components never see `undefined`. */
export function withFallback<T>(value: T | undefined, fallback: T): T {
  return value ?? fallback;
}
