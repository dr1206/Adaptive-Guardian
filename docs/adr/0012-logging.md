# ADR 0012 — Logging: pino + Isomorphic Edge Transport

**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** SRE Lead, Principal BE

## Context
Logs must be structured JSON, low-overhead, and work in three runtimes: Node services (FastAPI sidecars use Python logging), TanStack Start SSR on Node, and Cloudflare Workers (no `process.stdout`).

## Decision
- **Node runtimes:** `pino` with `pino-pretty` in dev, JSON in prod.
- **Edge runtime:** custom lightweight logger emitting `console.log(JSON.stringify(...))` — same field shape as pino.
- Both exposed through `@adaptiveguard/logger` with a single `createLogger({ service, level })` factory.
- Required fields: `ts`, `level`, `service`, `env`, `traceId`, `spanId`, `event`, `msg`, `payload?`.
- **Never log:** raw OTPs, full JWTs, raw behavioral events, PII beyond `userId`.
- Collector (Vector) tails container stdout → Datadog in staging/prod.

## Consequences
- **(+)** Single import surface; consistent log shape across runtimes.
- **(–)** Two transport implementations to maintain; covered by snapshot tests.

## Alternatives
- **winston** — slower, more allocations.
- **console.log everywhere** — no structure, no levels.
