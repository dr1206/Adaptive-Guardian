/**
 * @adaptiveguard/flags — LaunchDarkly client + local JSON fallback
 *
 * Flags are declared in `registry.ts` with default + owner + expiry. CI fails
 * if a flag is missing metadata or past its expiry. See ADR-0009.
 *
 * Sprint 1A ships the offline evaluator only. LD SDK wiring lands D7.
 */

import { useSyncExternalStore } from "react";

export interface FlagDefinition {
  default: boolean;
  owner: string;
  description: string;
  /** ISO date — CI fails after this date. */
  expires: string;
}

export const flags = {
  "platform.observability.client-tracing": {
    default: false,
    owner: "@sre",
    description: "Emit OTel spans from the browser to the collector.",
    expires: "2026-12-31",
  },
  "platform.flags.live-refresh": {
    default: false,
    owner: "@platform",
    description: "Stream flag updates over SSE instead of poll.",
    expires: "2026-12-31",
  },
} as const satisfies Record<string, FlagDefinition>;

export type FlagKey = keyof typeof flags;

const overrides = new Map<FlagKey, boolean>();
const listeners = new Set<() => void>();

function snapshot(): Record<FlagKey, boolean> {
  const out = {} as Record<FlagKey, boolean>;
  for (const key of Object.keys(flags) as FlagKey[]) {
    out[key] = overrides.has(key) ? (overrides.get(key) as boolean) : flags[key].default;
  }
  return out;
}

let cachedSnapshot = snapshot();

function notify() {
  cachedSnapshot = snapshot();
  for (const l of listeners) l();
}

/** Synchronous evaluator — safe in server functions and middleware. */
export function evalFlag(key: FlagKey): boolean {
  return overrides.has(key) ? (overrides.get(key) as boolean) : flags[key].default;
}

/** Test-only / devtools override. */
export function setFlagOverride(key: FlagKey, value: boolean | undefined) {
  if (value === undefined) overrides.delete(key);
  else overrides.set(key, value);
  notify();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** React hook — re-renders when the flag changes. */
export function useFlag(key: FlagKey): boolean {
  const all = useSyncExternalStore(
    subscribe,
    () => cachedSnapshot,
    () => cachedSnapshot,
  );
  return all[key];
}
