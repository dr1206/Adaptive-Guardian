# ADR 0009 — Feature Flags: LaunchDarkly (Unleash fallback)
**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** Tech Lead, Principal FE, Principal BE

## Context
We need runtime gating for incremental rollouts, kill switches for ML model versions, and per-tenant experimentation.

## Decision
Adopt **LaunchDarkly** as the managed feature-flag provider. Server + client SDKs. Flags exposed through a thin internal `useFlag()` hook to keep vendor swap cheap. If OSS-only mandate emerges, fall back to self-hosted **Unleash** — interface stays identical.

## Consequences
- **(+)** Mature targeting, audit log, SDK ecosystem.
- **(–)** SaaS cost + data-residency review required for EU tenants.

## Alternatives
- **Unleash (self-hosted)** — chosen as fallback.
- **Homegrown JSON in Redis** — rejected; reinvents targeting + audit poorly.
