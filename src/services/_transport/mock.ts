/**
 * Mock transport helpers.
 *
 * Real HTTP services have latency, can fail, and may need to be cancelled.
 * Mocks must mimic that surface so components are written for the real
 * world from day one — never "feels instant in dev, sluggish in prod".
 */

import { AppError, IntegrationError } from "../../lib/platform/errors";

const DEFAULT_LATENCY_RANGE: [number, number] = [180, 420];

export interface MockOptions {
  /** Override latency window for this call. */
  latencyMs?: number | [number, number];
  /** 0..1 probability of a synthetic failure. */
  failureRate?: number;
  /** Optional AbortSignal — rejects with AbortError if aborted. */
  signal?: AbortSignal;
}

function pickLatency(range: [number, number]): number {
  const [min, max] = range;
  return Math.floor(min + Math.random() * (max - min));
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const id = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(id);
      reject(abortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function abortError() {
  const err = new Error("Aborted");
  err.name = "AbortError";
  return err;
}

/** Wrap a value resolution in synthetic latency + optional failure. */
export async function mockResolve<T>(value: T | (() => T), opts: MockOptions = {}): Promise<T> {
  const range: [number, number] =
    typeof opts.latencyMs === "number"
      ? [opts.latencyMs, opts.latencyMs]
      : (opts.latencyMs ?? DEFAULT_LATENCY_RANGE);
  await delay(pickLatency(range), opts.signal);

  if (opts.failureRate && Math.random() < opts.failureRate) {
    throw new IntegrationError(
      "mock.transport.flaky",
      "Mock transport failure (simulated). Retry typically succeeds.",
    );
  }

  return typeof value === "function" ? (value as () => T)() : value;
}

/** Wrap a thrown AppError so callers see the same shape as real services. */
export async function mockReject<T>(err: AppError, opts: MockOptions = {}): Promise<T> {
  await delay(
    pickLatency(
      typeof opts.latencyMs === "number"
        ? [opts.latencyMs, opts.latencyMs]
        : (opts.latencyMs ?? DEFAULT_LATENCY_RANGE),
    ),
    opts.signal,
  );
  throw err;
}
