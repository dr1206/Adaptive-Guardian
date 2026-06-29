# ADR 0011 — Lint & Format: Biome (ESLint shim for React rules)

**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** Platform Lead, Principal FE

## Context
ESLint + Prettier is the JS baseline but is slow (multi-second runs on large repos) and requires plugin sprawl. Biome offers a single Rust-based tool ~25x faster with built-in formatter.

## Decision
- **Primary:** Biome 1.x for formatting, import sorting, and most lint rules across TS/JS/JSON.
- **ESLint:** retained only for `react-hooks`, `react-refresh`, and TanStack-specific custom rules not yet ported to Biome. Biome runs first; ESLint runs on `*.tsx` only.
- **Pre-commit:** lint-staged runs Biome (`--apply`) + ESLint (`--fix`).
- **CI:** `biome ci` + `eslint .` — non-zero exit fails build.
- Python services use **Ruff** for the same role.

## Consequences
- **(+)** Sub-second lint on the whole repo; consistent formatter; no `.prettierrc` drift.
- **(–)** Two tools instead of one until Biome covers React rules — documented exit criteria.

## Alternatives
- **ESLint + Prettier only** — slower, status quo.
- **Biome only** — react-hooks rule gap is unsafe today.
