# ADR 0010 — Monorepo Tooling: pnpm Workspaces + Turborepo

**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** Platform Lead, Staff Architect

## Context
We need to host `apps/web`, `apps/admin`, multiple FastAPI services, and ~12 shared packages in one repo with fast incremental builds, deterministic installs, and clean dependency graphs.

## Decision
- **Workspaces:** pnpm 9 workspaces (`pnpm-workspace.yaml`).
- **Task orchestration:** Turborepo for `build`, `lint`, `test`, `typecheck` with remote cache (Turborepo Cloud free tier; self-host fallback documented).
- **Versioning & release notes:** Changesets.
- **Node:** 20.x LTS via `.nvmrc`; pnpm pinned via `packageManager` field.
- Python services are sibling workspaces excluded from pnpm but included in Turbo via `tasks` referencing `make` targets.

## Consequences
- **(+)** Cheap incremental builds; ~10x faster cold install than npm; single lockfile.
- **(+)** Turbo's task graph mirrors our dependency graph — affected-only test runs in CI.
- **(–)** Contributors must learn pnpm workspace protocol (`workspace:*`).
- **(–)** Python services don't benefit from Turbo cache directly — mitigated via Docker layer cache.

## Alternatives
- **Nx** — richer plugins, but heavier and opinionated graph; rejected for ergonomics.
- **Yarn Berry PnP** — strict but high friction with editor tooling.
- **npm workspaces** — slower install, no task orchestration.
