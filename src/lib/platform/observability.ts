/**
 * @adaptiveguard/otel — OpenTelemetry wiring skeleton
 *
 * Sprint 1A ships the public API + no-op implementation. Real OTel SDK
 * initialization (web tracer, fetch instrumentation, collector export) lands
 * D6 once the Compose stack is up.
 *
 * Spans created here propagate W3C `traceparent` once initialized.
 */

import { loadClientEnv } from "./env";
import { createLogger } from "./logger";

const log = createLogger({ service: "otel" });

export interface SpanContext {
  traceId: string;
  spanId: string;
  name: string;
  startedAt: number;
}

let initialized = false;

export function initOtel({ service }: { service: string }): void {
  if (initialized) return;
  const env = loadClientEnv();
  initialized = true;
  log.info(
    { event: "otel.init", payload: { service, endpoint: env.otelEndpoint ?? "(noop)" } },
    "OpenTelemetry initialized (skeleton)",
  );
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function withSpan<T>(
  name: string,
  fn: (ctx: SpanContext) => Promise<T> | T,
): Promise<T> {
  const ctx: SpanContext = {
    traceId: randomHex(16),
    spanId: randomHex(8),
    name,
    startedAt: Date.now(),
  };
  try {
    const result = await fn(ctx);
    log.debug(
      {
        event: "otel.span.end",
        payload: { name, traceId: ctx.traceId, durationMs: Date.now() - ctx.startedAt },
      },
      "span ended",
    );
    return result;
  } catch (err) {
    log.error(
      {
        event: "otel.span.error",
        payload: {
          name,
          traceId: ctx.traceId,
          durationMs: Date.now() - ctx.startedAt,
          error: (err as Error)?.message,
        },
      },
      "span errored",
    );
    throw err;
  }
}
