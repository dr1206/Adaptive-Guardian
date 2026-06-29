/**
 * @adaptiveguard/env — zod-validated env loader
 *
 * Single import surface for environment configuration. Direct `process.env`
 * access is forbidden by lint rule outside this module.
 *
 * On the edge (Cloudflare Workers) env is injected per-request — callers
 * MUST invoke `loadClientEnv()` lazily inside a handler, never at module scope.
 */

export type ClientEnv = {
  appName: string;
  appEnv: "development" | "preview" | "staging" | "production";
  sentryDsn: string | undefined;
  ldClientId: string | undefined;
  otelEndpoint: string | undefined;
};

function readMeta(key: string): string | undefined {
  // Safe on both server SSR and client; Vite inlines VITE_* at build time.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env ?? {};
  const v = env[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

let cached: ClientEnv | undefined;

export function loadClientEnv(): ClientEnv {
  if (cached) return cached;
  const appEnvRaw = readMeta("VITE_APP_ENV") ?? "development";
  const allowed = new Set(["development", "preview", "staging", "production"]);
  const appEnv = (allowed.has(appEnvRaw) ? appEnvRaw : "development") as ClientEnv["appEnv"];

  cached = {
    appName: readMeta("VITE_APP_NAME") ?? "AdaptiveGuard AI",
    appEnv,
    sentryDsn: readMeta("VITE_SENTRY_DSN"),
    ldClientId: readMeta("VITE_LD_CLIENT_ID"),
    otelEndpoint: readMeta("VITE_OTEL_ENDPOINT"),
  };
  return cached;
}

/** Reset cache — test-only. */
export function __resetEnvCache() {
  cached = undefined;
}
