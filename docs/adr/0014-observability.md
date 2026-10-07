# ADR 0014 — Observability: OpenTelemetry + Sentry Split

**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** SRE Lead, Staff Architect

## Context

We need traces, metrics, and error tracking across web, BFF, and services with minimal overhead and vendor lock-in.

## Decision

- **Traces + metrics:** OpenTelemetry SDK in every runtime → OTel Collector → Datadog (prod), Jaeger + Prometheus (dev/staging).
- **Errors:** Sentry. One project per app/service; environment + release tags mandatory.
- **Logs:** Vector → Datadog (see ADR-0012). Logs are not traces — never reconstruct request flow from logs.
- **Propagation:** W3C `traceparent` + B3 fallback.
- **PII:** Sentry `beforeSend` scrubs known fields; OTel attributes use an allowlist.

Why split:

- OTel is best-in-class for trace fidelity and vendor swap.
- Sentry's error-grouping, source maps, and release tracking remain unmatched.

## Consequences

- **(+)** Vendor-neutral trace pipeline; Sentry covers debugging UX gap.
- **(–)** Two SDKs to maintain; integration test verifies they don't double-report.

## Alternatives

- **Datadog APM only** — strong vendor lock-in; weaker source-map UX.
- **Sentry tracing only** — limited backend trace surface; sampling controls weaker than OTel.
