/**
 * @adaptiveguard/logger — isomorphic structured logger
 *
 * Same JSON shape on Node SSR and Cloudflare Workers. No `console.log` in
 * app code outside of this module.
 *
 * Required fields: ts, level, service, env, event, msg. Optional: traceId,
 * spanId, userId, payload.
 *
 * NEVER log: OTPs, full tokens, raw behavioral events, PII beyond userId.
 */

import { loadClientEnv } from "./env";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogRecord {
  ts: string;
  level: LogLevel;
  service: string;
  env: string;
  event?: string;
  msg: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  payload?: Record<string, unknown>;
}

export interface LoggerOptions {
  service: string;
  level?: LogLevel;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

const REDACT_KEYS = new Set([
  "password",
  "passwordHash",
  "otp",
  "otpCode",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "ssn",
  "pan",
  "cardNumber",
  "cvv",
]);

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.has(k) ? "[REDACTED]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

export interface Logger {
  debug(payload: Record<string, unknown> | string, msg?: string): void;
  info(payload: Record<string, unknown> | string, msg?: string): void;
  warn(payload: Record<string, unknown> | string, msg?: string): void;
  error(payload: Record<string, unknown> | string, msg?: string): void;
  fatal(payload: Record<string, unknown> | string, msg?: string): void;
  child(bindings: Record<string, unknown>): Logger;
}

export function createLogger(opts: LoggerOptions): Logger {
  const env = loadClientEnv();
  const minLevel = LEVEL_ORDER[opts.level ?? (env.appEnv === "production" ? "info" : "debug")];

  function emit(
    level: LogLevel,
    payload: Record<string, unknown> | string,
    msg?: string,
    bindings: Record<string, unknown> = {},
  ) {
    if (LEVEL_ORDER[level] < minLevel) return;
    const isPayloadObj = typeof payload === "object" && payload !== null;
    const resolvedMsg = isPayloadObj ? (msg ?? "") : (payload as string);
    const resolvedPayload = isPayloadObj ? (payload as Record<string, unknown>) : undefined;

    const record: LogRecord = {
      ts: new Date().toISOString(),
      level,
      service: opts.service,
      env: env.appEnv,
      msg: resolvedMsg,
      ...(bindings as Record<string, unknown>),
      ...(resolvedPayload ? { payload: redact(resolvedPayload) as Record<string, unknown> } : {}),
    };

    const line = JSON.stringify(record);
    // Single sink across runtimes. console.* is the only allowed primitive here.
    if (level === "error" || level === "fatal") {
      // eslint-disable-next-line no-console
      console.error(line);
    } else if (level === "warn") {
      // eslint-disable-next-line no-console
      console.warn(line);
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }
  }

  function make(bindings: Record<string, unknown>): Logger {
    return {
      debug: (p, m) => emit("debug", p, m, bindings),
      info: (p, m) => emit("info", p, m, bindings),
      warn: (p, m) => emit("warn", p, m, bindings),
      error: (p, m) => emit("error", p, m, bindings),
      fatal: (p, m) => emit("fatal", p, m, bindings),
      child: (extra) => make({ ...bindings, ...extra }),
    };
  }

  return make({});
}
