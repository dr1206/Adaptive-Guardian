# ADR 0015 — Pragmatic Architecture Resolution for B.Tech Major Project Delivery

**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** Lead Backend Architect, Project Team

## Context

The project documentation contained two incompatible architectures:

1. **README.md** (§3, §5, §14): Monolithic FastAPI + MongoDB + Redis + MinIO + Docker Compose
2. **Master PRD** (§4, §8) + **ADRs 0001-0014**: TanStack Start frontend + 6-service FastAPI mesh + MongoDB Atlas + PostgreSQL + Redis + ClickHouse + Kafka + Ray Serve + EKS + ArgoCD

The Master PRD explicitly states it is the "single source of truth" and that "when a downstream document disagrees with the Master PRD, the Master PRD wins." However, the Master PRD architecture targets production-scale infrastructure (Kubernetes, Kafka, multi-service mesh, Ray Serve, ClickHouse) that is over-provisioned for a 4-person B.Tech major project running on a single laptop for project evaluation.

The Backend Implementation Review (2026-06-29) identified this discrepancy as the single highest-priority issue to resolve before writing any backend code.

## Decision

Adopt a **Pragmatic Hybrid Architecture** that:

- Respects the ADR decisions where practical for the delivery context
- Collapses infrastructure to what a 4-person team can build, test, and demo in 10-12 sprints
- Preserves clean module boundaries so the architecture can scale to the Master PRD vision post-project
- Documents the production pathway for every simplification

### Final Architecture

| Layer             | Decision                                                                                                                       | Rationale                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**       | Monolithic FastAPI with domain-based modules (`app/api/auth.py`, `app/api/banking.py`, `app/api/aegis.py`, `app/api/admin.py`) | Preserves the service boundaries from ADR-0002 while avoiding microservice ops overhead                                                                               |
| **Database**      | MongoDB Atlas (primary) + Redis 7                                                                                              | Document-oriented; natural fit for behavioral biometrics, SHAP outputs, device fingerprints, audit events; PostgreSQL deferred to production pathway for OLTP banking |
| **Message Queue** | None (REST-based synchronous scoring; Redis pub/sub if async needed later)                                                     | ADR-0007's Kafka is deferred; demo-scale event volume (~5 users) fits synchronous REST                                                                                |
| **ML Serving**    | In-process within FastAPI (scikit-learn + LightGBM + SHAP loaded via joblib)                                                   | ADR-0006's Ray Serve is deferred; inference latency target (<50ms) is met in-process                                                                                  |
| **Object Store**  | MinIO (Docker Compose)                                                                                                         | S3-compatible; production upgrade path documented                                                                                                                     |
| **Deployment**    | Docker Compose single-host (backend, redis, minio, jaeger, mailpit) + MongoDB Atlas cloud                                      | ADR-0008's EKS + ArgoCD documented as production pathway                                                                                                              |
| **Auth**          | JWT (HS256 for dev; RS256+KMS pathway documented) + bcrypt + HttpOnly refresh cookie                                           | Per ADR-0004                                                                                                                                                          |
| **Frontend**      | TanStack Start (React 19, Vite 7) — already implemented                                                                        | Per ADR-0001                                                                                                                                                          |

\* Redpanda included in dev Compose for future Kafka-compatible work but not wired in Sprint 0-4.

### Domain Module Boundaries

The monolith enforces these internal boundaries (lint-enforced):

```
app/
├── api/
│   ├── auth.py          # Identity domain — no imports from banking/aegis/admin
│   ├── banking.py       # Banking domain — can import auth middleware
│   ├── aegis.py         # Behavioral + decisions domain — can import auth middleware
│   └── admin.py         # Admin cockpit — can import all domains (read-only)
├── ml/                  # ML pipeline — no imports from api/
├── db/                  # Database — no imports from api/ or ml/
├── models/              # Pydantic schemas — shared across api/
├── middleware/           # Auth, rate limiting — no imports from api/
└── utils/               # Security, metrics — no imports from api/
```

Each `api/` module can be extracted into a standalone FastAPI service by copying the module + its dependencies into a new service directory. No code changes required beyond import path updates.

### What Is Deferred (Production Pathway)

These components are documented but NOT implemented in Sprint 0-4:

| Component      | Current                                       | Production Pathway                                                             |
| -------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| PostgreSQL     | MongoDB Atlas handles all data at demo scale  | Add PostgreSQL for OLTP banking if strict ACID compliance is required at scale |
| ClickHouse     | MongoDB Atlas handles telemetry at demo scale | Add ClickHouse for analytics at >100 concurrent users                          |
| Kafka          | REST synchronous scoring                      | Add Kafka + outbox pattern for >1000 events/sec                                |
| Ray Serve      | In-process model loading                      | Add Ray Serve for A/B model routing at scale                                   |
| EKS / ArgoCD   | Docker Compose                                | Terraform + Helm charts documented in `infra/`                                 |
| AWS KMS        | Local HMAC (HS256)                            | RS256 with KMS-managed keys                                                    |
| 6-service mesh | Monolith with domain modules                  | Extract modules into services when team size and traffic demand                |

## Consequences

### Positive

- Single consistent architecture across all documentation
- Buildable by a 4-person team in a single semester
- Runs on a single laptop for project evaluation (per project report hardware spec)
- Domain modules are trivially extractable into microservices later
- Production pathway is documented — evaluators see both working code AND architectural vision

### Negative

- Monolith lacks the "cool factor" of a service mesh in documentation
- No real event-driven architecture in the demo (REST polling instead of Kafka streams)
- Must maintain discipline to not cross domain boundaries in the monolith

### Neutral

- MongoDB Atlas eliminates local database container; fewer Docker services to manage
- HS256 JWT in dev; KMS upgrade path is documented but not demonstrated

## Superseded ADRs

This ADR modifies the implementation scope of:

- **ADR-0002** (Backend Architecture): Monolith replaces service mesh for delivery; service boundaries preserved
- **ADR-0003** (Database Selection): PostgreSQL + ClickHouse deferred; MongoDB Atlas + Redis for delivery
- **ADR-0006** (AI Inference): Ray Serve deferred; in-process inference for delivery
- **ADR-0007** (Event-Driven Roadmap): Kafka deferred; REST synchronous for delivery
- **ADR-0008** (Deployment Strategy): EKS deferred; Docker Compose for delivery

The original ADR decisions remain valid for the production pathway. This ADR scopes them to the B.Tech major project delivery context.
