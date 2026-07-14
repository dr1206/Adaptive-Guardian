# ADR 0002 — Backend Architecture: Python FastAPI (Monolith with Domain Modules)

> **Scoped by ADR-0015:** The 6-service mesh is deferred to the production pathway. This project delivers a monolithic FastAPI app with domain-based modules that preserve the service boundaries for future extraction. See ADR-0015 for the full architecture resolution.

**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** Staff Architect, Principal BE, ML Architect

## Context
Backend must serve banking CRUD, ingest high-volume behavioral telemetry, and host ML inference. Options: Node/TypeScript monolith, Go microservices, Python service mesh, JVM (Kotlin/Spring).

## Decision
Adopt **Python 3.12 + FastAPI** for application services (Identity, Banking, Behavior, Decision, Notification, Audit). Async via `asyncio` + `uvloop`. Shared domain libs in monorepo packages. ML stack (sklearn/LightGBM/SHAP) lives natively in Python — same language as inference avoids the Python-bridge cost a Go/Node backend would pay.

During Sprint 1, **Lovable Cloud (Supabase + edge functions)** backs identity & basic CRUD behind the same contract layer; Python services replace them service-by-service from Sprint 3.

## Consequences
- **(+)** Single language across app + ML; fast iteration; mature async ecosystem.
- **(+)** FastAPI's pydantic models map cleanly to our OpenAPI-first workflow.
- **(–)** Python is slower than Go for hot ingestion paths; mitigated by ClickHouse-direct ingest for telemetry.
- **(–)** Two backends in flight during cutover (Supabase + Python) — managed by contract-stable client codegen.

## Alternatives
- **Go** — best raw perf, but forces Python sidecars for ML.
- **Node monolith** — shared language with FE, but weaker ML/data libs.
- **Kotlin/Spring** — strong for banking, but heavy and slow team ramp-up.
