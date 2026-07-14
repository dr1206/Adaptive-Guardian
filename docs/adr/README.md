# Architecture Decision Records

Every material technical decision lives here as a numbered ADR. Format: [MADR-lite](https://adr.github.io/madr/).

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-frontend-framework.md) | Frontend Framework — TanStack Start | Accepted |
| [0002](0002-backend-architecture.md) | Backend Architecture — Python FastAPI Service Mesh | Accepted |
| [0003](0003-database-selection.md) | Database Selection — MongoDB Atlas + Redis (PostgreSQL + ClickHouse Deferred) | Accepted |
| [0004](0004-authentication-strategy.md) | Authentication Strategy — Short-lived JWT + Scoped Refresh Cookie | Accepted |
| [0005](0005-behavioral-telemetry-design.md) | Behavioral Telemetry — Aggregated Features Only | Accepted |
| [0006](0006-ai-inference-architecture.md) | AI Inference — LightGBM + OC-SVM + SHAP, Ray Serve | Accepted |
| [0007](0007-event-driven-roadmap.md) | Event-Driven Roadmap — Kafka, Outbox Pattern | Accepted |
| [0008](0008-deployment-strategy.md) | Deployment — EKS + ArgoCD GitOps | Accepted |
| [0009](0009-feature-flags.md) | Feature Flags — LaunchDarkly (Unleash fallback) | Accepted |
| [0010](0010-monorepo-tooling.md) | Monorepo Tooling — pnpm + Turborepo | Accepted |
| [0011](0011-lint-and-format.md) | Lint & Format — Biome + ESLint shim | Accepted |
| [0012](0012-logging.md) | Logging — pino + isomorphic edge transport | Accepted |
| [0013](0013-error-framework.md) | Error Framework — Typed AppError hierarchy | Accepted |
| [0014](0014-observability.md) | Observability — OpenTelemetry + Sentry split | Accepted |
| [0015](0015-pragmatic-architecture-resolution.md) | Pragmatic Architecture Resolution — Monolith, Docker Compose, In-Process ML | Accepted |

## Template

```
# ADR NNNN — Title
**Status:** Proposed | Accepted | Superseded by ADR-XXXX
**Date:** YYYY-MM-DD
**Deciders:** roles

## Context
## Decision
## Consequences (positive, negative, neutral)
## Alternatives Considered
```
