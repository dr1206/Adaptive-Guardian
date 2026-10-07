# ADR 0001 — Frontend Framework: TanStack Start

**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** Staff Architect, Principal FE

## Context

We need an SSR-capable React framework that supports type-safe routing, edge deploys, and fine-grained data loading for a dense, telemetry-heavy enterprise UI. Candidates: Next.js App Router, Remix/React Router v7, TanStack Start.

## Decision

Adopt **TanStack Start v1** (React 19, Vite 7) as the sole frontend runtime. File-based routing under `src/routes/`. Data fetching via TanStack Query loaders + `useSuspenseQuery`. Server logic via `createServerFn`; raw HTTP via server routes under `src/routes/api/`.

## Consequences

- **(+)** Strict TS routing eliminates a class of nav bugs; loaders give us SWR + preloading for free.
- **(+)** Edge-ready (Cloudflare Workers); fits Lovable Cloud template.
- **(–)** Smaller ecosystem than Next; some libs assume Node host — see `server-runtime` constraints.
- **(–)** Team must learn TanStack-specific conventions (`__root.tsx`, loader/query pairing).

## Alternatives

- **Next.js App Router** — larger ecosystem, but RSC model adds complexity unjustified by our needs.
- **Remix v7** — solid, but weaker type-safe routing story; loader/action ergonomics differ from our existing code.
