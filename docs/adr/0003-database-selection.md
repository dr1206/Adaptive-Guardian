# ADR 0003 — Database Selection: MongoDB Atlas + Redis (+ PostgreSQL + ClickHouse Deferred)

> **Revised by ADR-0015 (2026-06-29):** PostgreSQL and ClickHouse are deferred to the production pathway. This project delivers MongoDB Atlas as the primary database. Behavioral biometrics, device fingerprints, AI feature vectors, SHAP outputs, session metadata, and audit events are document-oriented workloads. MongoDB's flexible schema supports rapid iteration during development. Atlas simplifies deployment for the B.Tech demo environment.

**Status:** Accepted · **Date:** 2026-06-29 · **Revised:** 2026-06-29 · **Deciders:** Lead Backend Architect, Project Team

## Context

Three workloads: transactional banking + identity (document-oriented, evolving schemas), session/cache/rate-limit (low-latency KV), and analytical telemetry queries. The behavioral biometrics core — feature vectors, SHAP outputs, device fingerprints, and decision records — are naturally document-oriented. Schema evolution during development is expected as feature engineering iterates.

## Decision

- **MongoDB Atlas** — primary system of record. Free M0 cluster for development. Document model for heterogeneous behavioral data, device fingerprints, and evolving feature schemas. Chain-hashed audit events stored as ordered documents.
- **Redis 7** — session store, refresh-token blocklist, rate limits, scoring cache, OTP TTL.
- **MinIO** — serialized model artifacts (joblib), SHAP reports.
- **PostgreSQL** — deferred to production pathway. Will be added when OLTP banking transactions require strict ACID compliance at scale.
- **ClickHouse** — deferred to production pathway. Will be added for behavioral telemetry analytics at >100 concurrent users.

## Consequences

- **(+)** MongoDB's document model naturally fits heterogeneous behavioral data — keystroke features, mouse features, SHAP contributions, and device fingerprints have varying shapes
- **(+)** Schema evolution during development is frictionless — no migrations for adding new feature types
- **(+)** Atlas free tier eliminates local database setup; one fewer Docker container to manage
- **(+)** Motor + Beanie async ODM integrates cleanly with FastAPI's async patterns
- **(–)** No ACID transactions across collections; mitigated by careful write ordering and idempotent operations
- **(–)** Chain-hashed audit trail must be implemented at application layer rather than via PostgreSQL's built-in rolling hash

## Data Access Layer

- **Driver:** Motor 3.x (async MongoDB driver)
- **ODM:** Beanie (async ODM on Motor, Pydantic v2 compatible)
- **Indexes:** Defined declaratively on Beanie Document models
- **Migrations:** Beanie's built-in migration engine for index lifecycle; free-form document migrations for data shape changes

## Collections (Sprint 0)

| Collection           | Purpose                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `users`              | Core user identity; email, password_hash, full_name, roles embedded   |
| `sessions`           | Active refresh tokens; TTL index on expires_at                        |
| `otp_challenges`     | OTP verification records; TTL index on expires_at                     |
| `behavior_baselines` | Per-user behavioral profile (one doc per user, updated incrementally) |
| `behavior_windows`   | 60-second feature windows; TTL index for retention                    |
| `decisions`          | Scored authentication decisions with top SHAP contributors            |
| `device_profiles`    | Trusted device fingerprints with metadata                             |
| `audit_events`       | Append-only chain-hashed audit trail                                  |

## Alternatives Considered

- **PostgreSQL 16** — strong for relational data, but heterogeneous behavioral features and rapid schema evolution during development favor MongoDB. Deferred to production pathway.
- **Single MongoDB + TimescaleDB extension** — not applicable; TimescaleDB is PostgreSQL-only.
- **DynamoDB for sessions** — vendor lock-in; Redis is portable and faster for cache workloads.
