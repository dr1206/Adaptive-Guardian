# ADR 0005 — Behavioral Telemetry: Aggregated Features Only

**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** Security Architect, ML Architect, Privacy Counsel

## Context

Behavioral biometrics could theoretically capture raw keystrokes and mouse paths — which would expose passwords, PII, and conversation content. That is unacceptable.

## Decision

The browser SDK extracts **derived, non-reversible features** only:

- Typing: inter-key intervals, hold times, flight-time distributions, rhythm vectors — **never key identities** for content fields.
- Mouse: velocity, acceleration, jerk, curvature, dwell zones — **no pixel-accurate trails persisted**.
- Session: focus duration, scroll cadence, viewport geometry.

Aggregation window: 5 s rolling. Submitted as feature vectors. Raw events never leave the device. Privacy dashboard (`/app/guard/privacy`) shows users **what is and is not collected**.

## Consequences

- **(+)** GDPR/CCPA defensible; no keystroke logger liability.
- **(+)** Smaller payloads; cheaper ingest.
- **(–)** Slightly less signal than raw streams; offset by richer feature engineering.

## Alternatives

- **Raw streams + server-side hashing** — adds attack surface; rejected.
