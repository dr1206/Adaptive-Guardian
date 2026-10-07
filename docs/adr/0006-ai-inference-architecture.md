# ADR 0006 — AI Inference Architecture (In-Process; Ray Serve Deferred)

> **Scoped by ADR-0015:** Ray Serve is deferred to the production pathway. ML inference runs in-process within FastAPI using joblib-loaded models. See ADR-0015.

**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** ML Architect, Staff Architect

## Context

We need explainable, low-latency (<50 ms p95) behavioral risk scoring with online updates and a clean promotion gate.

## Decision

- **Models:** LightGBM (P(legitimate)) + OC-SVM (novelty/drift). SHAP for per-decision explainability.
- **Serving:** Ray Serve behind FastAPI Decision Service. Models loaded from MLflow registry; promotion via `/admin/ai/models` approval gate.
- **Features:** computed online in the Behavior Service; cached in Redis for the live session.
- **Decision output:** `allow | challenge | step_up | block` + score + top-N SHAP contributors persisted to audit trail.

## Consequences

- **(+)** Tree models + SHAP give us regulatory-grade explainability out of the box.
- **(+)** Ray supports horizontal scale and A/B routing.
- **(–)** Ray adds ops surface; mitigated by managed K8s + small team of operators.

## Alternatives

- **SageMaker endpoints** — fine, but vendor lock-in and weaker MLOps story for our team.
- **Deep models (LSTM)** — better raw signal, harder to explain to auditors; revisit post-GA.
