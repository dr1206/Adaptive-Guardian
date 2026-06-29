# ADR 0003 — Database Selection: PostgreSQL + Redis + ClickHouse
**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** DB Architect, Staff Architect

## Context
Three workloads: transactional banking + identity (strong consistency), session/cache/rate-limit (low-latency KV), and analytical telemetry queries over millions of rows/day.

## Decision
- **PostgreSQL 16** — OLTP system of record. Logical replication for read replicas. RLS enforced on all `public.*` tables. Sprint 1 runs on Supabase Postgres; Sprint 3+ on managed Aurora-compatible PG.
- **Redis 7** — session store, refresh-token blocklist, rate limits, ephemeral feature cache.
- **ClickHouse** — behavioral telemetry analytics, ML feature store reads, admin dashboards.
- **S3** — cold/audit storage; lifecycle to Glacier after 90d.

## Consequences
- **(+)** Each store plays to its strength; no single-DB compromise.
- **(–)** Three operational surfaces. Mitigated by managed services + IaC.

## Alternatives
- **Single Postgres + TimescaleDB** — simpler ops, but ClickHouse outperforms 10–50× on our query shapes.
- **DynamoDB for sessions** — vendor lock-in; Redis is portable and faster.
