# AdaptiveGuard AI — Backend Implementation Review

**Author:** Lead Backend Architect & Senior AI Engineer
**Date:** 2026-06-29
**Status:** Pre-implementation engineering audit
**Scope:** Architecture, documentation, security, AI/ML, database, API, and implementation readiness

> **Revision (2026-06-29):** The database recommendation in this review (§1.3, §2, Appendix) originally proposed PostgreSQL 16. The project team subsequently chose **MongoDB Atlas** for its document-model affinity with behavioral biometrics. See ADR-0015 and ADR-0003 (revised) for the final decision. The Sprint plan in this review is superseded by `docs/SPRINT_0_PLAN.md`.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Review](#2-architecture-review)
3. [Documentation Review](#3-documentation-review)
4. [Backend Implementation Roadmap](#4-backend-implementation-roadmap)
5. [Database Review](#5-database-review)
6. [API Review](#6-api-review)
7. [Security Review](#7-security-review)
8. [AI/ML Review](#8-aiml-review)
9. [Implementation Readiness](#9-implementation-readiness)

---

## 1. Executive Summary

### 1.1 The Good

The frontend is **production-ready and architecturally sound**. 60+ routes, well-structured component library across 7 domains (brand, auth, banking, dashboard, guard, admin, landing), a typed service layer with React Query hooks, and realistic mock implementations. The design system is cohesive (dark-only, OKLCH tokens, glassmorphism aesthetic). The engineering standards are rigorous (typed errors, structured logging, env validation, OpenTelemetry stubs). This is a frontend that a backend team can wire into with confidence.

The ML pipeline design is **literature-grounded and architecturally defensible**. The choice of LightGBM + One-Class SVM dual model, mRMR feature selection, SMOTE balancing, and SHAP explainability aligns well with the 12-paper literature foundation. The sliding-window adaptive profile mechanism is correctly specified.

### 1.2 The Critical Finding

**The documentation contains two fundamentally different architectures that are unreconciled.**

| Dimension          | README.md Architecture              | Master PRD + ADR Architecture                                                                          |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Database           | MongoDB 7 (single)                  | PostgreSQL 16 + Redis 7 + ClickHouse + S3                                                              |
| Message Queue      | Redis Streams                       | Apache Kafka (MSK)                                                                                     |
| ML Serving         | In-process FastAPI                  | Ray Serve behind Decision Service                                                                      |
| Deployment         | Docker Compose (single host)        | AWS EKS + ArgoCD GitOps                                                                                |
| Backend Structure  | Monolithic FastAPI (`backend/app/`) | 6-service mesh (`services/identity/`, `behavior/`, `decision/`, `banking/`, `notification/`, `audit/`) |
| Object Store       | MinIO (dev) / S3 (prod)             | S3 only (cold storage)                                                                                 |
| Frontend Framework | React 18 + Vite (READ)              | TanStack Start v1 (React 19, Vite 7) - ADR-0001                                                        |
| Auth Token Storage | JWT (no spec on storage)            | Access token in-memory only; refresh token HttpOnly cookie                                             |

**The Master PRD explicitly states it is the "single source of truth" and that "when a downstream document disagrees with the Master PRD, the Master PRD wins."** This means the README.md is the downstream document that is out of date, and the ADR/Master PRD architecture is canonical.

However, the Master PRD architecture targets production-scale infrastructure (EKS, Kafka, Ray Serve, multi-service mesh) that is wildly over-provisioned for a 4-person B.Tech major project running on a single laptop for demo. The README architecture (monolithic FastAPI + MongoDB + Redis + MinIO + Docker Compose) is the **implementation-appropriate** architecture for the project's actual deployment context.

### 1.3 Recommendation

**Adopt a "Pragmatic Hybrid" architecture** that respects the ADR decisions where practical but collapses the infrastructure to what a 4-person team can build, test, and demo in 10-12 sprints:

1. **Backend:** Monolithic FastAPI app (as README proposes) with clean internal module boundaries mirroring the service domains (identity, behavior, decision, banking). This preserves the ability to split into microservices later without paying the ops cost now.
2. **Database:** PostgreSQL 16 (per ADR-0003) — richer querying, better for the structured behavioral features, and more industry-standard than MongoDB. Redis 7 for sessions/cache/rate-limits/OTP. Skip ClickHouse and Kafka for now — PostgreSQL can handle the demo-scale telemetry.
3. **ML Serving:** In-process within FastAPI (as README proposes). Skip Ray Serve for now. The inference latency target (<50ms) is easily met by loading joblib-serialized models into the FastAPI process.
4. **Deployment:** Docker Compose single-host (as README proposes). EKS and ArgoCD are documented as the "production pathway" for future work.
5. **Auth:** Follow ADR-0004 precisely — 10-minute access JWT (KMS-signed for future; HMAC for now), rotating refresh token in HttpOnly cookie, 6-digit OTP with 5-minute TTL.

This gives us a single consistent architecture that bridges the documentation gap and is actually buildable.

---

## 2. Architecture Review

### 2.1 Frontend Architecture — Assessment

**Rating: Excellent. No changes recommended.**

The frontend follows a clean layered architecture:

```
Routes (TanStack Router, file-based) → Hooks (React Query) → Services (typed contracts) → Transport (mock or HTTP)
```

Key strengths:

- **Service layer abstraction.** The `src/services/` directory defines typed contracts (`AuthService`, `BankingService`, `AegisService`, `AdminService`) with mock implementations that simulate realistic latency (80-560ms). Swapping to real HTTP backends requires only implementing the same contracts and flipping `VITE_USE_REAL_API=true` — zero component changes.
- **React Query integration.** Every API call flows through `useQuery` / `useMutation` hooks with proper cache invalidation, abort signal propagation, and stale-while-revalidate semantics.
- **Error handling.** Typed `AppError` hierarchy (ValidationError, AuthenticationError, AuthorizationError, etc.) with stable machine-readable codes mapped to HTTP status codes.
- **Auth middleware.** `extractBearer()` and `verifyRequest()` stubs in `src/lib/platform/auth-middleware.ts` are ready for the real JWT verification.
- **Platform primitives.** Env validation via Zod, structured logging via pino-compatible interface, OpenTelemetry stubs, feature flag client — all shipped as part of Sprint 1A.

**Observation:** The frontend assumes a session-based model where `getSession()` returns `{ userId, email, roles, signatureSeed }` or `null`. This maps cleanly to the ADR-0004 auth model (memory-only access token + HttpOnly refresh cookie). The `Session` type includes a `signatureSeed` field used by the `SignatureGlyph` component — this is a nice UX touch that the backend must generate deterministically from user identity.

### 2.2 Backend Architecture — Issues & Recommendations

#### Issue 1: Documentation Architecture Drift (CRITICAL)

As documented in the Executive Summary, the README.md and Master PRD + ADRs describe incompatible architectures.

**Recommendation:** Resolve this before writing any backend code. I recommend the "Pragmatic Hybrid" approach described in §1.3. Specifically:

- **Adopt PostgreSQL 16** (per ADR-0003) over MongoDB (per README). Justification: (a) the behavioral features are structured tabular data (36 mRMR-selected features per window) — SQL is a better fit; (b) PostgreSQL's JSONB can handle the few schema-flexible use cases; (c) it's more industry-standard for FinTech; (d) it aligns with the Master PRD which is the designated source of truth.
- **Adopt monolithic FastAPI** (per README) with clean domain modules over 6-service mesh (per Master PRD). Justification: a 4-person team building a demo does not need the operational complexity of a service mesh. The monolith can be structured with clear module boundaries that are trivially extractable later.
- **Adopt Docker Compose** (per README) over EKS + ArgoCD (per ADR-0008) for the delivery context. The production pathway is documented for future work.
- **Skip Kafka** for Sprint 1. Redis pub/sub or direct PostgreSQL writes handle the event volume at demo scale. The outbox pattern can be added in Sprint 3-4 if needed.

#### Issue 2: WebSocket vs Polling for Behavioral Events

The README specifies WebSocket-based event streaming (`/ws/events/{session_id}`), while the Master PRD/AsyncAPI spec defines Kafka topics for event transport. The frontend currently has no WebSocket client implementation — the Aegis mock simulates live snapshots with `setInterval`.

**Recommendation:** For the demo context, skip WebSocket and use REST-based polling:

- The Behavioral Collector SDK (to be built) collects keystroke/mouse events client-side and aggregates them into 5-second feature vectors (per ADR-0005).
- Every 60 seconds, the frontend POSTs a feature window to `POST /api/v1/events/batch`.
- The backend scores the window and returns the verdict synchronously.
- The `subscribeSnapshots` API (for the Aegis widget's live confidence stream) polls `GET /api/v1/scores/current` every 2 seconds.

This eliminates WebSocket infrastructure complexity for the demo while preserving the core behavioral auth loop.

#### Issue 3: Missing Behavioral Collector SDK

The README contains a detailed TypeScript sketch of `BehavioralCollector.ts` but this code does not exist in the frontend source. The project has local `data_collection/` scripts (`collect_behavioral_data.py`, CSV files) for offline data collection, but no browser-side collector.

**Recommendation:** This must be built in Sprint 1 as a standalone TypeScript module. It should:

- Attach `keydown`/`keyup`/`mousemove`/`mousedown`/`mouseup`/`wheel` listeners
- Compute features client-side per ADR-0005 (aggregated features only, no raw key content)
- Batch into 60-second windows with 50% overlap
- POST to the backend via the service layer

This is the highest-risk frontend component and should be started early.

### 2.3 Folder Structure — Issues

The current repository does not match either proposed folder structure.

**Current structure (flat, frontend-only):**

```
src/
  components/  (7 domains + ui primitives)
  routes/      (60+ TanStack route files)
  services/    (contracts + mocks + hooks)
  lib/         (platform + utilities)
  hooks/       (single file: use-mobile.tsx)
```

**Missing from README's proposed structure:**

```
backend/       — does not exist
ml/            — does not exist (except data_collection/ scripts)
docs/api/      — incomplete (only openapi.identity.yaml exists)
```

**Recommendation:** Create the `backend/` directory with the structure from README §14. The `ml/` directory should be repurposed from the existing `data_collection/` scripts plus new training pipelines. The `docs/api/` directory needs the remaining OpenAPI specs written.

### 2.4 Routing Architecture

The frontend uses TanStack Router with file-based routing. The route structure maps to three authenticated layouts:

| Layout | Route Prefix | Route File             | Purpose                                     |
| ------ | ------------ | ---------------------- | ------------------------------------------- |
| Auth   | `/auth/*`    | `src/routes/auth.tsx`  | Login, Register, OTP, Calibrate, Signature  |
| App    | `/app/*`     | `src/routes/app.tsx`   | Banking dashboard + Guard (security center) |
| Admin  | `/admin/*`   | `src/routes/admin.tsx` | AI-SOC cockpit                              |

The backend must serve these routes and the corresponding API endpoints. The auth-protected routes (`/app/*`, `/admin/*`) require JWT validation middleware.

---

## 3. Documentation Review

### 3.1 Consistency Audit

| Document Pair                      | Finding                                                                                                                                                                                                                       | Severity                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| README.md vs ADR-0003              | Database: MongoDB vs PostgreSQL                                                                                                                                                                                               | **Critical**                     |
| README.md vs ADR-0007              | Message Queue: Redis Streams vs Kafka                                                                                                                                                                                         | **High**                         |
| README.md vs ADR-0002              | Backend: Monolith vs 6-service mesh                                                                                                                                                                                           | **High**                         |
| README.md vs ADR-0006              | ML Serving: In-process vs Ray Serve                                                                                                                                                                                           | **Medium**                       |
| README.md vs ADR-0001              | Frontend: React 18 vs TanStack Start (React 19)                                                                                                                                                                               | **Low** (frontend already built) |
| README.md vs ADR-0004              | Auth: 15-min JWT vs 10-min JWT                                                                                                                                                                                                | **Low**                          |
| README.md vs Master PRD            | Auth: No refresh cookie spec vs HttpOnly cookie                                                                                                                                                                               | **Medium**                       |
| Master PRD §7 vs `docs/api/`       | References 4 OpenAPI specs; only 1 exists                                                                                                                                                                                     | **High**                         |
| Master PRD §8 vs `docs/db/ERD.md`  | ERD shows PostgreSQL schema (consistent with ADR-0003)                                                                                                                                                                        | **No issue**                     |
| Frontend contracts vs OpenAPI spec | OpenAPI spec has `/auth/register` → OTP; frontend contract has `register()` → `challengeId` — **consistent**                                                                                                                  | **No issue**                     |
| Frontend contracts vs OpenAPI spec | OpenAPI spec has `/auth/verify-otp` → AuthSession; frontend has `verifyOtp()` → Session — **consistent**                                                                                                                      | **No issue**                     |
| Frontend contracts vs OpenAPI spec | OpenAPI spec has `/auth/enrollment`; frontend has `submitEnrollment()` — **consistent**                                                                                                                                       | **No issue**                     |
| Frontend contracts vs OpenAPI spec | Frontend has `login()` returning Session directly; OpenAPI spec has `/auth/login` returning 200 (AuthSession) or 202 (OTP challenge) — **partially consistent** (frontend mock doesn't model the OTP challenge path on login) | **Low**                          |

### 3.2 Missing Documentation

| Document                         | Status                                | Action                                                     |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| `docs/api/openapi.banking.yaml`  | **Missing**                           | Must be written before banking backend implementation      |
| `docs/api/openapi.behavior.yaml` | **Missing**                           | Must be written before behavioral ingestion implementation |
| `docs/api/openapi.decision.yaml` | **Missing**                           | Must be written before scoring backend implementation      |
| `docs/runbooks/`                 | Template only (`RUNBOOK.template.md`) | Acceptable for pre-implementation phase                    |
| `docs/sprints/SPRINT_1B.md`      | **Missing**                           | First backend sprint needs a sprint plan                   |
| Backend test structure           | Not documented                        | Must be added to testing strategy                          |

### 3.3 Documentation Quality

| Document              | Quality       | Notes                                                                                                    |
| --------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| README.md             | **Excellent** | Comprehensive, well-structured, strong technical depth. The ML pipeline pseudocode is particularly good. |
| Master PRD            | **Excellent** | Clear source-of-truth, good cross-referencing, explicit change control process.                          |
| ADRs 0001-0014        | **Excellent** | Well-reasoned decisions with alternatives and consequences.                                              |
| ERD                   | **Good**      | Clear mermaid diagram, indexes, constraints, RLS, retention policies.                                    |
| OpenAPI Identity Spec | **Good**      | Well-structured, uses `$ref` properly, has schemas for all types.                                        |
| AsyncAPI Events Spec  | **Adequate**  | Covers the 5 key topics. Schemas are inline rather than in a registry.                                   |
| Engineering Standards | **Excellent** | Comprehensive. Naming, error handling, logging, testing, git workflow — all clear.                       |
| Definition of Ready   | **Excellent** | Thorough checklist. Even includes "Accessibility checklist" and "Rollback plan."                         |
| Component Inventory   | **Good**      | Tracks every component's Storybook status.                                                               |

---

## 4. Backend Implementation Roadmap

### 4.1 Implementation Order (Dependency-Aware)

The backend must be built in dependency order. Here is the critical path:

```
Auth (JWT + OTP + Sessions)
    ↓
Behavioral Collector SDK (browser-side JS/TS)
    ↓
Event Ingestion API (REST endpoint for feature windows)
    ↓
Feature Extraction Pipeline (Python keystroke + mouse features)
    ↓
ML Training Pipeline (SMOTE + mRMR + LightGBM + OCSVM)
    ↓
Real-Time Scoring (inference + score fusion + verdict)
    ↓
Adaptive Profile Update + Retraining Trigger
    ↓
Admin Dashboard API
    ↓
Banking API (accounts, transfers, transactions, beneficiaries)
```

**Rationale:** Auth must come first because everything requires authenticated sessions. The behavioral collector must exist before we can collect training data. The ML training pipeline needs real data before models can be deployed for real-time scoring.

### 4.2 Sprint Plan

#### Sprint 0 — Foundation (Days 1-5)

**Goal:** Backend project scaffold, database schema, auth system working end-to-end.

| Task     | Description                                                                                                   | Est. |
| -------- | ------------------------------------------------------------------------------------------------------------- | ---- |
| **S0.1** | Create `backend/` directory with FastAPI project structure                                                    | 0.5d |
| **S0.2** | Docker Compose: add backend service; wire PostgreSQL + Redis + MinIO                                          | 0.5d |
| **S0.3** | Database schema: create all tables per ERD (users, sessions, OTP, behavioral_events, decisions, audit_events) | 1d   |
| **S0.4** | Database migrations tooling (Flyway or Alembic)                                                               | 0.5d |
| **S0.5** | Auth implementation: register, login, verify-otp, logout, refresh                                             | 2d   |
| **S0.6** | JWT middleware: validate access token, extract user context                                                   | 0.5d |
| **S0.7** | Rate limiting middleware (Redis-based sliding window)                                                         | 0.5d |
| **S0.8** | Frontend wiring: implement HTTP adapters for auth service and flip `VITE_USE_REAL_API=true`                   | 0.5d |
| **S0.9** | End-to-end test: register → OTP → login → session → logout                                                    | 0.5d |

**Deliverable:** User can register, verify OTP, login, and see their Session in the frontend — backed by real PostgreSQL and Redis, not mocks.

#### Sprint 1 — Behavioral Pipeline (Days 6-12)

**Goal:** Behavioral data collection working end-to-end. Feature extraction pipeline operational. Training data being collected.

| Task     | Description                                                                                                                                                               | Est.          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **S1.1** | Behavioral Collector SDK (TypeScript): keystroke + mouse event listeners with client-side feature aggregation                                                             | 2d            |
| **S1.2** | Event ingestion API: `POST /api/v1/events/batch` with Pydantic validation                                                                                                 | 1d            |
| **S1.3** | Feature extraction module (Python): keystroke features (HT, DD, UD, digraphs, typing speed, errors) + mouse features (velocity, acceleration, jerk, straightness, clicks) | 2d            |
| **S1.4** | Data collection campaign: team + 20-30 volunteers use the app with collector active                                                                                       | 2d (parallel) |
| **S1.5** | Aegis polling API: `GET /api/v1/scores/current` (returns placeholder scores for now)                                                                                      | 0.5d          |
| **S1.6** | Frontend wiring: implement HTTP adapter for aegis service; confidence ring shows real data                                                                                | 0.5d          |

**Deliverable:** Behavioral events flow from browser → collector SDK → REST API → feature extractor → stored in PostgreSQL. Aegis widget shows live confidence (initially a placeholder). Training data being collected.

#### Sprint 2 — ML Training & Real-Time Scoring (Days 13-20)

**Goal:** Trained models deployed. Real-time behavioral scoring returns actual decisions.

| Task     | Description                                                                           | Est. |
| -------- | ------------------------------------------------------------------------------------- | ---- |
| **S2.1** | Data preparation: clean collected data, segment into windows, extract features, label | 1d   |
| **S2.2** | SMOTE implementation: balance genuine vs impostor samples                             | 0.5d |
| **S2.3** | mRMR feature selection: reduce ~120 features to top-36                                | 1d   |
| **S2.4** | LightGBM training: grid search hyperparameters, cross-validation                      | 1.5d |
| **S2.5** | One-Class SVM training: per-user model with tuned nu/gamma                            | 1d   |
| **S2.6** | Score fusion: weighted ensemble + threshold calibration (EER optimization)            | 1d   |
| **S2.7** | Model serialization: save trained artifacts to MinIO with versioning                  | 0.5d |
| **S2.8** | Real-time inference endpoint: load models → score windows → return verdict            | 1d   |
| **S2.9** | Model evaluation: compute FAR, FRR, EER, AUC-ROC on held-out test data                | 0.5d |

**Deliverable:** Real-time behavioral scoring returns actual `allow`/`challenge`/`step_up`/`block` verdicts. Aegis widget shows real confidence scores driven by ML models. OTP challenge triggers when score drops below threshold.

#### Sprint 3 — Adaptivity & Explainability (Days 21-27)

**Goal:** Adaptive profile update, SHAP explainability, admin dashboard API.

| Task     | Description                                                                                           | Est. |
| -------- | ----------------------------------------------------------------------------------------------------- | ---- |
| **S3.1** | Adaptive profile manager: sliding window (max 500 samples) with high-confidence filter (score ≥ 0.90) | 1d   |
| **S3.2** | Periodic retraining trigger: after every 100 new high-confidence windows                              | 1d   |
| **S3.3** | SHAP explainer: TreeExplainer for LightGBM; generate per-decision waterfall data                      | 1.5d |
| **S3.4** | Decision history API: `GET /api/v1/scores/history` with pagination                                    | 0.5d |
| **S3.5** | SHAP report API: `GET /api/v1/scores/shap/{decision_id}`                                              | 0.5d |
| **S3.6** | Admin API: users, anomalies, metrics (FAR/FRR/EER), sessions                                          | 2d   |
| **S3.7** | Frontend wiring: admin cockpit reads real data from admin API                                         | 0.5d |

**Deliverable:** User profiles adapt over time. Every auth decision has a SHAP explanation visible in the admin cockpit. Admin dashboard shows live metrics.

#### Sprint 4 — Banking Backend (Days 28-35)

**Goal:** FinTech APIs fully implemented. Complete end-to-end banking demo.

| Task     | Description                                                                                         | Est. |
| -------- | --------------------------------------------------------------------------------------------------- | ---- |
| **S4.1** | Banking API: accounts, transactions, beneficiaries, transfers                                       | 2d   |
| **S4.2** | Cards, payments, savings, holdings, loans, currencies, insights, budgets, statements, activity APIs | 2d   |
| **S4.3** | Transfer with behavioral signal integration (dwell time, typing rhythm during transfer)             | 1d   |
| **S4.4** | Frontend wiring: implement HTTP adapters for banking service                                        | 0.5d |
| **S4.5** | Seed data: realistic banking demo data for the evaluator demo                                       | 1d   |

**Deliverable:** Full banking flow works end-to-end with real backend: login → dashboard → view accounts → transfer funds → view transactions → manage beneficiaries. Behavioral auth runs silently throughout.

#### Sprint 5 — Audit, Security Hardening, Testing (Days 36-42)

**Goal:** Production-readiness. Audit logging, security verification, test coverage.

| Task     | Description                                                        | Est. |
| -------- | ------------------------------------------------------------------ | ---- |
| **S5.1** | Audit logging: append-only audit_events table with chain hashing   | 1d   |
| **S5.2** | Security review: OWASP top-10 check, dependency audit, secret scan | 1d   |
| **S5.3** | Backend unit tests: auth, feature extraction, mRMR, score fusion   | 2d   |
| **S5.4** | Backend integration tests: event pipeline, OTP flow, model loading | 1.5d |
| **S5.5** | ML evaluation: final FAR/FRR/EER/AUC report on held-out test data  | 1d   |
| **S5.6** | Demo script preparation: step-by-step walkthrough with timing      | 0.5d |

**Deliverable:** All tests passing. Audit trail operational. ML evaluation report complete. Demo script ready.

#### Sprint 6 — Polish & Presentation (Days 43-49)

**Goal:** Bug fixes, performance tuning, documentation finalization, presentation prep.

| Task     | Description                                                                                | Est. |
| -------- | ------------------------------------------------------------------------------------------ | ---- |
| **S6.1** | Bug bash: end-to-end testing of all flows                                                  | 1.5d |
| **S6.2** | Performance optimization: query plans, Redis caching, response times                       | 1d   |
| **S6.3** | Documentation finalization: API docs (auto-generated OpenAPI), setup guide, README updates | 1d   |
| **S6.4** | Demo video recording                                                                       | 1d   |
| **S6.5** | Presentation slides + defense preparation                                                  | 1.5d |

**Deliverable:** Production-ready demo. All documentation updated. Demo video recorded. Presentation slides complete.

### 4.3 Critical Path & Dependencies

```
S0 (Auth) → S1 (Collector) → S2 (ML Training) → S3 (Scoring + Explainability)
                                                    ↓
                                              S4 (Banking) → S5 (Audit + Tests) → S6 (Polish)
```

**Blockers to watch:**

- **Training data collection** (S1.4) is the highest-risk activity. If we cannot collect sufficient data from volunteers, we fall back to public datasets (CMU Keystroke Dataset, Buffalo dataset).
- **Model performance** (S2.9) may require iteration. Budget extra time for hyperparameter tuning and feature engineering if initial results don't meet targets.
- **Frontend wiring** (S0.8, S1.6, S3.7, S4.4) depends on service contract stability. Freeze the contracts at the end of Sprint 0.

### 4.4 Risk Register

| #   | Risk                                       | Prob.  | Impact   | Mitigation                                                                                           |
| --- | ------------------------------------------ | ------ | -------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Insufficient training data                 | High   | Critical | Start collection Week 1; use public datasets as fallback                                             |
| 2   | ML models don't meet accuracy targets      | Medium | High     | Budget 2 extra days for tuning; document lessons learned even if targets missed                      |
| 3   | Browser API timing precision               | Medium | Medium   | Accept 5-10ms variance; literature confirms discriminative power remains                             |
| 4   | Cold start for new users                   | High   | Medium   | Guided baseline collection; password-only fallback until profile matures                             |
| 5   | Frontend-backend contract drift            | Low    | High     | Generate TypeScript types from OpenAPI specs (per Master PRD §7); freeze contracts at Sprint 0 close |
| 6   | PostgreSQL performance for event ingestion | Low    | Low      | Demo scale (1-5 users) won't stress PostgreSQL; production pathway documented                        |
| 7   | Team member unavailability                 | Medium | Medium   | All critical-path tasks have documented interfaces; any team member can pick up                      |

---

## 5. Database Review

### 5.1 Schema Assessment

The ERD in `docs/db/ERD.md` is well-designed. Key observations:

**Strengths:**

- Proper use of UUIDs as primary keys (avoiding sequential ID enumeration)
- CITEXT for email (case-insensitive lookups without losing case)
- JSONB for behavioral profiles and feature vectors (appropriate for semi-structured ML data)
- Separate `audit` schema with chain hashing (defensible for compliance)
- Well-designed indexes covering the common query patterns
- Retention policies clearly defined across hot/warm/cold tiers
- RLS policies scoped to `auth.uid()` (defense in depth)

**Issues & Recommendations:**

1. **`behavior_windows.features` as JSONB:** For the 36 mRMR-selected features, consider a `behavior_features` table with one row per feature per window. This enables efficient queries like "which users had ht_std > 2σ in the last hour" without JSON path queries.

   ```sql
   CREATE TABLE behavior_features (
     window_id UUID REFERENCES behavior_windows(id),
     feature_name TEXT NOT NULL,
     feature_value DOUBLE PRECISION NOT NULL,
     PRIMARY KEY (window_id, feature_name)
   );
   ```

   However, for demo scale, JSONB is fine. Add this to the production pathway notes.

2. **Missing `behavioral_events` collection from README:** The README describes a `behavioral_events` collection (MongoDB) containing raw keystroke and mouse events alongside extracted features and scores. In the PostgreSQL model, this is split across `behavior_windows` (aggregated features) and `decisions` (scoring results). This is correct per ADR-0005 (aggregated features only) — raw keystroke events should NOT be stored. The README's MongoDB schema showing raw `keystroke_events` and `mouse_events` arrays contradicts ADR-0005.

   **Action:** Remove the raw event storage from any implementation plan. Only aggregate feature vectors are stored.

3. **Add a `model_versions` table:** The ERD has `behavior_baselines` with a `model_version` field but no table tracking model versions. Add:

   ```sql
   CREATE TABLE ml.model_versions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     version TEXT NOT NULL,
     artifact_path TEXT NOT NULL,
     metrics JSONB NOT NULL,  -- {f1, eer, far, frr, auc_roc}
     training_config JSONB NOT NULL,  -- {samples_used, features_used, lgbm_params, ocsvm_params}
     created_at TIMESTAMPTZ DEFAULT now(),
     UNIQUE (user_id, version)
   );
   ```

4. **Add `sessions.last_behavioral_score`:** To enable quick lookup of the latest score for the Aegis widget without joining `decisions`:

   ```sql
   ALTER TABLE sessions ADD COLUMN last_behavioral_score DOUBLE PRECISION;
   ALTER TABLE sessions ADD COLUMN last_verdict TEXT CHECK (last_verdict IN ('allow','challenge','step_up','block'));
   ```

5. **Indexes — verified against query patterns:**

   | Query                                  | Index Needed                                              | In ERD?  |
   | -------------------------------------- | --------------------------------------------------------- | -------- |
   | "Get latest score for current session" | `decisions (session_id, evaluated_at DESC)`               | Yes      |
   | "Find all challenges in last 24h"      | `decisions (outcome, evaluated_at DESC)`                  | No — add |
   | "Get active sessions for user"         | `sessions (user_id, revoked_at) WHERE revoked_at IS NULL` | Yes      |
   | "Lookup OTP challenge"                 | `otp_challenges (user_id, purpose, expires_at DESC)`      | Yes      |
   | "Check device fingerprint"             | `trusted_devices (user_id, fingerprint)` UNIQUE           | Yes      |

### 5.2 Caching Strategy

The README lists 6 Redis key patterns. For the hybrid architecture, I recommend:

| Key                          | Type          | TTL    | Purpose                                         |
| ---------------------------- | ------------- | ------ | ----------------------------------------------- |
| `session:{session_id}`       | Hash          | 30 min | Active session metadata + last score            |
| `otp:{user_id}`              | String        | 5 min  | OTP value (hashed)                              |
| `otp_rate:{user_id}`         | String        | 1 min  | OTP request counter                             |
| `rate_limit:{ip}`            | String        | 1 min  | API rate limit counter                          |
| `user_model:{user_id}`       | String (JSON) | 1 hour | Cached model metadata (version, metrics)        |
| `feature_cache:{session_id}` | List          | 2 min  | Accumulating feature vectors for current window |

**Additional recommendation:** Cache the latest Aegis snapshot per session to avoid scoring on every 2-second poll. The `GET /api/v1/scores/current` endpoint returns the cached snapshot; the actual scoring runs every 60 seconds on window boundaries.

### 5.3 Audit Logging

The chain-hashed audit design in the ERD is solid. For implementation:

```python
# Simplified audit event creation
def create_audit_event(actor_type, actor_id, action, target, payload, prev_hash):
    canonical = json.dumps(payload, sort_keys=True)
    event_hash = hashlib.sha256(
        (prev_hash + canonical).encode()
    ).hexdigest()
    # insert into audit.audit_events
    return event_hash
```

Daily anchor hash should be written to a file (S3 Object Lock in production; local file in dev). The verifier job can be a simple script.

---

## 6. API Review

### 6.1 Contract Completeness

| Domain          | OpenAPI Spec                          | Frontend Contract                                                   | Status                                                                              |
| --------------- | ------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Identity / Auth | `openapi.identity.yaml` — 7 endpoints | `auth.contract.ts` — 6 methods                                      | **Aligned.** Missing: refresh endpoint not in frontend contract (handled by cookie) |
| Banking         | `openapi.banking.yaml` — **MISSING**  | `banking.contract.ts` — 15 methods                                  | **Spec must be written** from the frontend contract                                 |
| Behavior        | `openapi.behavior.yaml` — **MISSING** | Embedded in `aegis.contract.ts` — 7 methods                         | **Spec must be written** from the frontend contract                                 |
| Decision        | `openapi.decision.yaml` — **MISSING** | Embedded in `aegis.contract.ts` (snapshots, decisions, risk events) | **Spec must be written** from the frontend contract                                 |
| Admin           | Not referenced in Master PRD          | `admin.contract.ts` — 18+ methods                                   | **Spec must be written** from the frontend contract                                 |
| Events          | `events.asyncapi.yaml` — 5 topics     | Not used by frontend (REST polling instead)                         | **Acceptable for now**                                                              |

### 6.2 Endpoint-by-Endpoint Review

#### Identity API (`openapi.identity.yaml`)

| Endpoint                   | Assessment                                                                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/register`      | Correct. Returns `202` with `challengeId`. Password minLength=12 is good.                                                                                                  |
| `POST /auth/verify-otp`    | Correct. OTP code pattern `^[0-9]{6}$` is properly constrained. Returns `AuthSession` with access token + sets refresh cookie.                                             |
| `POST /auth/login`         | Correct. Two possible responses: `200` (trusted device) or `202` (OTP challenge on unknown device). This maps to the "step-up" flow.                                       |
| `POST /auth/refresh`       | Correct. Cookie-based; no request body. Rotates refresh token.                                                                                                             |
| `POST /auth/logout`        | Correct. Returns `204`.                                                                                                                                                    |
| `GET /auth/me`             | Correct. Returns `{id, email, fullName, roles, enrollmentStatus}`.                                                                                                         |
| `POST /auth/enrollment`    | Correct. Accepts keyboard + mouse feature vectors. Returns baseline ID and confidence.                                                                                     |
| `GET /auth/session-status` | Listed in README but missing from OpenAPI spec. **Recommendation:** Add this endpoint. It returns the same data as `GET /auth/me` plus `currentScore` and `sessionHealth`. |

#### Banking API (from frontend contract — spec to be written)

The frontend expects 15 endpoints. Write the OpenAPI spec first, then implement. The `TransferInput` includes a `dwellMs` field — behavioral signal integration point.

#### Aegis/Behavior API (from frontend contract — spec to be written)

Key endpoints the backend must implement:

| Method | Endpoint                         | Purpose                                    |
| ------ | -------------------------------- | ------------------------------------------ |
| `GET`  | `/api/v1/aegis/snapshot`         | Latest confidence + risk + whisper + trend |
| `GET`  | `/api/v1/aegis/decisions`        | Decision history                           |
| `GET`  | `/api/v1/aegis/devices`          | Trusted devices                            |
| `GET`  | `/api/v1/aegis/risk-events`      | Recent risk events                         |
| `GET`  | `/api/v1/aegis/device-profiles`  | Rich device profiles for Guard             |
| `GET`  | `/api/v1/aegis/decision-replays` | Decision replay with SHAP petals           |

The `subscribeSnapshots` method in the frontend contract is implemented as polling (see §2.2 Issue 2 recommendation).

### 6.3 Response Envelope

Both the README and the frontend error framework use the same envelope:

```json
// Success
{ "status": "success", "data": {}, "meta": { "timestamp": "...", "request_id": "..." } }

// Error
{ "code": "identity.otp.expired", "message": "Code expired.", "details": {} }
```

**Issue:** These are different envelopes. The README wraps success in `{status, data, meta}` while the frontend error framework returns flat `{code, message, details}`. The backend should adopt a consistent envelope:

```json
// Recommended: consistent envelope
// Success
{ "data": { ... }, "meta": { "timestamp": "...", "request_id": "..." } }

// Error
{ "error": { "code": "...", "message": "...", "details": {} }, "meta": { "timestamp": "...", "request_id": "..." } }
```

The frontend `AppError.toJSON()` maps to `{code, message, details}` — the backend should nest this under an `error` key to match the success envelope structure.

### 6.4 API Versioning

The README specifies URI versioning (`/api/v1/...`). The OpenAPI spec uses `/api/v1` as the server base path. The frontend currently has no base URL configured (it's in `.env.example` as `VITE_API_BASE_URL=http://localhost:8000`). **This is consistent and correct.**

---

## 7. Security Review

### 7.1 Authentication

**Strengths:**

- Short-lived access tokens (10 min) minimize the window for token theft
- Rotating refresh tokens prevent long-term replay
- HttpOnly, Secure, SameSite=Strict cookie prevents XSS exfiltration of refresh tokens
- OTP with rate limiting and single-use semantics
- bcrypt for password hashing (cost=12)
- KMS-backed signing keys (future; HMAC acceptable for dev/demo)

**Issues & Recommendations:**

1. **Access token storage:** The ADR specifies "memory only" — stored in a JavaScript variable, not localStorage or sessionStorage. This is correct for XSS resistance but means every page refresh requires a token refresh via the `/auth/refresh` cookie endpoint. The frontend must handle this gracefully (show skeleton UI while refreshing).

2. **Refresh token rotation:** Every call to `/auth/refresh` must issue a new refresh token and invalidate the old one. Implement a refresh token family in Redis: `refresh_family:{family_id}` → set of used token hashes. If a used token is presented (indicating token theft), invalidate the entire family.

3. **OTP delivery:** For dev/demo, MailHog is configured in Docker Compose. For the live demo, use Amazon SES in sandbox mode or a transactional email service. Document the OTP delivery mechanism clearly in the demo script.

4. **Password minimum length:** OpenAPI spec requires `minLength: 12`. This is good. Ensure backend enforcement matches.

### 7.2 Authorization

**Strengths:**

- Separate `user_roles` table with `has_role()` function
- RLS policies scoped to `auth.uid()`
- Three-tier role model: user, analyst, admin

**Issues & Recommendations:**

1. **RLS implementation:** RLS requires setting the PostgreSQL session variable `app.current_user_id` on every connection. Implement this in the database connection pool wrapper.

2. **Admin role assignment:** The first admin user must be created via a seed script. Document this process.

### 7.3 Behavioral Data Privacy

ADR-0005 makes the correct call: aggregated features only, no raw keystroke content. However, the README's MongoDB schema shows raw `keystroke_events` with `key` identifiers and raw `mouse_events` with `x`/`y` coordinates. **This must not be implemented.** The backend should only accept pre-aggregated feature vectors.

The frontend's `EnrollmentSample` contract already enforces this — it takes `features: ReadonlyArray<number>` (opaque feature vector), not raw events.

### 7.4 Secrets Management

The `.env.example` file shows placeholder values. For the demo:

- Use environment variables in Docker Compose (not committed to git)
- Generate JWT signing keys on first run (script)
- No AWS KMS dependency for dev — use local HMAC with HS256, document the KMS upgrade path

### 7.5 Rate Limiting

The README specifies: "100 req/min per IP; 200 req/min per user." Implement via Redis sliding window:

```python
# Rate limit pseudo-code
async def check_rate_limit(key: str, limit: int, window: int = 60):
    current = await redis.incr(f"rate:{key}")
    if current == 1:
        await redis.expire(f"rate:{key}", window)
    if current > limit:
        raise RateLimitError(retry_after=window)
```

### 7.6 Threat Model Review

| Threat                      | Mitigation                                               | Assessment                                                       |
| --------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| Session hijacking           | Continuous behavioral auth → detects within 1-3 windows  | **Effective** if model performance meets targets                 |
| Credential stuffing         | Rate limiting + behavioral anomaly on login              | **Partially covered** — login anomaly detection not yet designed |
| Replay attacks (behavioral) | Timestamp per window, session-scoped                     | **Needs implementation detail**                                  |
| Model poisoning             | Only high-confidence (≥ 0.90) windows in adaptive update | **Correct design**                                               |
| Model extraction            | Inference server-side only; no model download endpoint   | **Correct**                                                      |
| Insider threat (admin)      | Audit logs + SHAP reports for accountability             | **Correct design**                                               |
| XSS (access token theft)    | Memory-only storage; short TTL (10 min)                  | **Effective**                                                    |
| CSRF (refresh endpoint)     | SameSite=Strict cookie scoped to `/api/auth`             | **Effective**                                                    |

---

## 8. AI/ML Review

### 8.1 Feature Engineering

The feature definitions in README §6.1 are comprehensive and literature-grounded:

**Keystroke features (~60):**

- Hold time (HT): mean, std, median, min, max — correctly capture keypress duration
- Flight time (DD, UD): down-down and up-down latencies — distinguish typing styles
- Typing speed (CPM), bursts, error patterns, digraphs, rhythm — well-chosen
- The digraph set (th, he, in, er, an, on, at, en, nd, ti, es, or) covers the most common English bigrams

**Mouse features (~60):**

- Velocity, acceleration, jerk (derivative of acceleration) — kinematics hierarchy
- Trajectory geometry: straightness ratio, angle of curvature — path analysis
- Click behavior: rate, duration, double-click speed, right-click ratio — interaction patterns
- Movement patterns: idle time, episodes, displacement, path length — session-level features
- Scroll behavior: event count, speed — covers a distinct interaction modality

**Quality concerns:**

1. **Feature count:** The README says "~120 total features (60 keystroke + 60 mouse)" but the feature lists show fewer distinct features. Count carefully. The ~120 number likely includes per-key and per-digraph breakdowns.
2. **Per-key features:** Consider adding per-key hold times for the most common keys (e, t, a, o, i, n, s, r, space, backspace). Per-key features are more discriminative than aggregate statistics alone (Krishnamoorthy et al. 2018).
3. **Feature normalization:** All features must be standardized (z-score) before model input. Document whether normalization uses global statistics or per-user statistics. Per-user normalization is preferred for behavioral auth (users differ in absolute typing speed; what matters is deviation from their own baseline).
4. **Missing feature: typing consistency within window.** Add a "coefficient of variation for per-key hold times" — low CV within a window suggests rhythm consistency, which is highly individual.

### 8.2 mRMR Feature Selection

The mRMR implementation in README §6.2 is correct algorithmically. Key observations:

- **First feature selection via mutual information** is correct
- **Subsequent selections via max(relevance - mean(redundancy))** implements the basic mRMR criterion
- **36 feature target** matches Wang & Hou (2024) and Krishnamoorthy et al. (2018)

**Recommendations:**

- Consider using MID (Mutual Information Difference) vs MIQ (Mutual Information Quotient) — the README implements MID. Document this choice.
- Cache the correlation matrix rather than recomputing per-iteration (O(n²) → O(n) per feature)
- The mRMR selector should be trained once during offline training and stored; online inference uses the stored feature indices

### 8.3 SMOTE Implementation

Correct. SMOTE with `k_neighbors=5` and `sampling_strategy='auto'` is the standard configuration. Key concerns:

- SMOTE should only be applied to training data, never to validation/test data — standard practice
- The `random_state=42` seed ensures reproducibility
- For the initial training with limited volunteer data, SMOTE is critical. The literature reports class imbalance ratios of 1:44 or worse.

### 8.4 LightGBM Model

The hyperparameter choices are reasonable:

| Param                            | Value                | Assessment                      |
| -------------------------------- | -------------------- | ------------------------------- |
| `num_leaves: 31`                 | Default              | Good starting point; tune 15-63 |
| `learning_rate: 0.05`            | Conservative         | Good for small datasets         |
| `feature_fraction: 0.8`          | Column subsampling   | Reduces overfitting             |
| `bagging_fraction: 0.8`          | Row subsampling      | Reduces overfitting             |
| `min_data_in_leaf: 20`           | Regularization       | Critical for small user base    |
| `lambda_l1: 0.1, lambda_l2: 0.1` | L1/L2 regularization | Prevents overfitting            |
| `early_stopping: 30 rounds`      | Convergence          | Standard                        |

**Recommendations:**

- The expected performance numbers (94.68% accuracy, 0.98 AUC-ROC) are from the literature and will likely be lower on self-collected data with fewer users. Set realistic targets: 85%+ accuracy, 0.90+ AUC-ROC would be a strong result for a self-collected dataset.
- Add `is_unbalance: true` or use `scale_pos_weight` if SMOTE is not applied during inference-time training.

### 8.5 One-Class SVM

The OCSVM configuration (`kernel='rbf'`, `nu=0.05`) is standard. Key observations:

- `nu=0.05` means at most 5% of training samples can be on the wrong side of the boundary — this is a tight boundary, appropriate for security
- Training on genuine user data only — correct for the "Gatekeeper" role
- The OCSVM requires per-user models (each user has their own "normal" boundary)
- `gamma='scale'` adapts to feature variance — correct

**Quality concern:** One-Class SVM with RBF kernel scales poorly with training samples (O(n²) memory, O(n³) time). With 450-500 profile windows per user, this is manageable. If profiles grow beyond 2000+ samples, consider Isolation Forest as a more scalable anomaly detector.

### 8.6 Score Fusion

The fusion formula `final_score = 0.6 * LightGBM_prob + 0.4 * (1 - OCSVM_anomaly_score)` is a reasonable starting point. However:

1. **The OCSVM decision function is not a probability.** Converting `decision_function` output to [0,1] requires sigmoid calibration or min-max scaling. The README doesn't specify the normalization method. This is critical for correct fusion.
2. **Weight optimization:** The 0.6/0.4 split should be optimized via grid search on validation data, not hardcoded.
3. **Alternative fusion:** Consider a logistic regression meta-learner that takes both scores as inputs and outputs a calibrated probability.

```python
# Recommended: calibrated fusion
from sklearn.linear_model import LogisticRegression

# Train on validation set
meta_features = np.column_stack([lgbm_probs, ocsvm_scores_normalized])
meta_model = LogisticRegression()
meta_model.fit(meta_features, y_val)
final_score = meta_model.predict_proba([[lgbm_prob, ocsvm_score_norm]])[0, 1]
```

### 8.7 Threshold Calibration

The three-tier threshold system is well-designed:

| Range     | Action        | UX                  |
| --------- | ------------- | ------------------- |
| ≥ 0.85    | Silent pass   | Green dot           |
| 0.60-0.85 | Log warning   | Yellow dot          |
| < 0.60    | OTP challenge | Red dot + OTP modal |

**Recommendations:**

- Calibrate thresholds using the Equal Error Rate (EER) point from the validation set
- Consider per-user threshold adjustment: a user with consistently high scores (tight behavioral consistency) should have a higher threshold for challenges than a user with naturally variable behavior

### 8.8 SHAP Explainability

The SHAP implementation using `TreeExplainer` for LightGBM is correct. Key concerns:

- `TreeExplainer` only works for LightGBM, not OCSVM — for OCSVM, use `KernelExplainer` (slower but more general)
- The Waterfall plot shows per-feature contribution — this is what the admin cockpit displays
- SHAP computation adds ~20-50ms to inference time — acceptable since inference runs every 60 seconds

### 8.9 Adaptive Profile Update

The `AdaptiveProfileManager` class is correctly specified:

- Sliding window with `maxlen=500`
- High-confidence filter (score ≥ 0.90) prevents model poisoning
- Retrain after every 100 new windows — conservative, prevents unnecessary retraining

**Recommendations:**

- Add a time-based retraining trigger: if profile size < 50 windows and 7 days have passed, retrain on whatever data is available (cold-start mitigation)
- Add a "concept drift" detector: if the last 20 windows consistently score lower than the trailing average, retrain sooner (profile has shifted)

### 8.10 Model Evaluation Targets

The targets in README §12.2 are ambitious:

| Metric         | Target                   | Assessment                     |
| -------------- | ------------------------ | ------------------------------ |
| F1 ≥ 0.90      | Ambitious but achievable | Literature reports 0.88-0.96   |
| AUC-ROC ≥ 0.95 | Ambitious                | Literature reports 0.97-0.99   |
| EER ≤ 0.05     | Aggressive               | Industry standard is 0.01-0.10 |
| FAR ≤ 0.05     | Acceptable               | Usable for demo                |
| FRR ≤ 0.10     | Acceptable               | Balance with usability         |

**Recommendation:** Document both "target" and "acceptable" thresholds. An acceptable result for a self-collected dataset with 20-30 volunteers would be: F1 ≥ 0.80, AUC-ROC ≥ 0.85, EER ≤ 0.10. Any result exceeding the "target" thresholds is exceptional.

---

## 9. Implementation Readiness

### 9.1 Is the frontend ready for backend integration?

**Yes, with one gap.**

- ✅ Service layer with typed contracts for all 4 domains
- ✅ React Query hooks that consume those contracts
- ✅ Mock implementations that simulate realistic latency
- ✅ Auth middleware stubs ready for real JWT verification
- ✅ Error handling framework with typed errors
- ✅ Environment configuration for `VITE_USE_REAL_API=true`
- ✅ 60+ routes across all surfaces (landing, auth, banking, guard, admin)
- ❌ **Behavioral Collector SDK does not exist** — the `BehavioralCollector.ts` described in README §9.2 is a design sketch. This must be built in Sprint 1.

### 9.2 Is the documentation sufficient?

**Partially.** The documentation is excellent for vision, architecture, and engineering standards. The gaps are:

- Missing OpenAPI specs for banking, behavior, decision, and admin APIs
- Architecture dissonance between README and Master PRD + ADRs (see §1.2)
- Missing sprint plan for backend implementation

### 9.3 What blockers remain?

1. **Architecture decision.** Must resolve MongoDB vs PostgreSQL and Monolith vs Service Mesh before writing any backend code. My recommendation is in §1.3.

2. **OpenAPI contracts.** Must write the banking, behavior, decision, and admin OpenAPI specs before implementing those backends. The frontend contracts are ready to be transcribed.

3. **Behavioral Collector SDK.** Must build this as the first frontend task in Sprint 1. It is the single highest-risk component — if browser-based behavioral collection doesn't work, the entire continuous auth premise fails.

4. **Training data.** Must start collecting behavioral data from team members and volunteers as early as possible. Public datasets (CMU, Buffalo) should be downloaded and preprocessed as a fallback.

### 9.4 What should be implemented first?

**In strict priority order:**

1. **Backend scaffold + database + auth** (Sprint 0). Everything else depends on auth. The frontend needs a real `Session` object to function.

2. **Behavioral Collector SDK** (Sprint 1, Day 1-2). This unblocks data collection and is on the critical path for ML training.

3. **Feature extraction pipeline** (Sprint 1, Day 3-4). Needed to validate that the collector captures useful data.

4. **Data collection campaign** (Sprint 1, Day 5-7). Run in parallel while building the ingestion API.

5. **ML training pipeline** (Sprint 2). Requires accumulated data. The entire continuous auth premise depends on model performance.

6. **Real-time scoring** (Sprint 2-3). Connects the ML models to the live session.

7. **Banking API** (Sprint 4). The "vehicle" for the demo. Can be built after the core auth engine works.

8. **Admin API + audit** (Sprint 3-5). Read-only admin can be built incrementally.

---

## Appendix A: Technology Stack — Final Recommendation

| Layer                | Technology                                           | Justification                                                 |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| **Backend**          | FastAPI 0.110+ (Python 3.12)                         | Async-native, OpenAPI auto-gen, Python ML ecosystem           |
| **Database**         | PostgreSQL 16                                        | Structured feature data, JSONB flexibility, industry standard |
| **Cache / Sessions** | Redis 7                                              | Low-latency session store, rate limiting, OTP TTL             |
| **Object Store**     | MinIO (dev)                                          | S3-compatible, Dockerized, production upgrade path            |
| **ML Inference**     | In-process (scikit-learn + LightGBM + SHAP)          | No serving infrastructure needed at demo scale                |
| **ML Training**      | Python scripts + Jupyter notebooks                   | Offline pipeline; reproducible via joblib serialization       |
| **Containerization** | Docker Compose                                       | Single-command dev environment                                |
| **CI**               | GitHub Actions                                       | Already configured for frontend; extend for backend           |
| **Auth**             | JWT (HS256 dev; RS256+KMS prod) + bcrypt + OTP       | Per ADR-0004                                                  |
| **Testing**          | pytest + pytest-asyncio (backend), Vitest (frontend) | Per engineering standards                                     |

## Appendix B: Files to Create (Backend Scaffold)

```
backend/
├── Dockerfile
├── requirements.txt
├── pyproject.toml
├── alembic.ini
├── alembic/
│   └── versions/
│       └── 001_initial_schema.py
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── events.py
│   │   ├── scores.py
│   │   ├── admin.py
│   │   └── banking.py
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── feature_extractor.py
│   │   ├── mrmr_selector.py
│   │   ├── smote_balancer.py
│   │   ├── lightgbm_model.py
│   │   ├── ocsvm_model.py
│   │   ├── score_fusion.py
│   │   ├── shap_explainer.py
│   │   ├── adaptive_profile.py
│   │   └── model_registry.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── postgresql.py
│   │   └── redis.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── session.py
│   │   ├── event.py
│   │   └── decision.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── rate_limit.py
│   └── utils/
│       ├── __init__.py
│       ├── security.py
│       └── metrics.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── unit/
    │   ├── test_feature_extraction.py
    │   ├── test_mrmr.py
    │   ├── test_score_fusion.py
    │   └── test_auth.py
    └── integration/
        ├── test_event_pipeline.py
        └── test_otp_flow.py
```

---

**Review Status:** Complete. Awaiting approval before backend implementation begins.

**Signature:** Lead Backend Architect & Senior AI Engineer
**Date:** 2026-06-29
