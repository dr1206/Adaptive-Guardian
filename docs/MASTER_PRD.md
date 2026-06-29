# AdaptiveGuard AI — Master PRD
**Version:** 1.0 · **Status:** Source of Truth · **Owner:** Architecture Council

This document is the **single source of truth** for AdaptiveGuard AI. Every sprint, ADR, contract, and implementation PR must trace back to a section here. When a downstream document disagrees with the Master PRD, the Master PRD wins until it is explicitly amended.

---

## 0. Quick Map

| Domain | Canonical Document | Owner |
| --- | --- | --- |
| Product Vision | [§1](#1-product-vision) · Phase 1 transcript | Product |
| Design System | `src/styles.css` · [§2](#2-design-system) | Design |
| UI Specifications | Phase 4A–4E plans · [§3](#3-ui-specifications) | Design + FE |
| Technical Architecture | Phase 5A · [§4](#4-technical-architecture) | Staff Architect |
| Sprint 0 — Foundations | Phase 5C · [§5](#5-sprint-0--foundations) | DevOps + Tech Lead |
| Sprint 1 Blueprint | Phase 5D · [§6](#6-sprint-1--identity--behavioral-auth) | All |
| API Contracts | `docs/api/` · [§7](#7-api-contracts) | Principal BE |
| Database Design | `docs/db/ERD.md` · [§8](#8-database-design) | DB Architect |
| ML Pipeline | [§9](#9-ml-pipeline) | ML Architect |
| Security Model | [§10](#10-security-model) | Security Architect |
| ADRs | `docs/adr/` | Architecture Council |
| Engineering Standards | `docs/standards/ENGINEERING.md` | Tech Lead |
| Component Inventory | `docs/components/INVENTORY.md` | Principal FE |
| Definition of Ready | `docs/standards/DEFINITION_OF_READY.md` | Tech Lead |

---

## 1. Product Vision

**AdaptiveGuard AI** is an enterprise FinTech platform whose differentiator is **Continuous User Authentication (CUA)** — invisible, behavior-based identity proofing that runs alongside traditional banking surfaces.

- **Users:** retail banking customers, enterprise security operators, compliance officers.
- **Value:** drop session-takeover and account-fraud risk without adding friction.
- **Surfaces:** marketing site, end-user banking app, AI Security Center, enterprise AI-SOC cockpit.
- **Brand register:** Revolut (70%), Stripe (20%), Linear (10%) — premium, calm, institutional.

## 2. Design System

Defined in `src/styles.css`. Canonical tokens: dark navy `#0F172A` background; primary `#2563EB`; accent cyan `#06B6D4`; status emerald/amber/red; purple `#8B5CF6`. Typography: **Sora** display, **Inter** body, **Space Grotesk** numeric/mono. Radii 16–28px. Glassmorphism via `glass-panel` / `glass-card`. Motion: `--ease-out-soft`, `--duration-base`.

**Rule:** never hard-code color hex/utilities (`bg-white`, `bg-[#…]`) in components. Always go through semantic tokens.

## 3. UI Specifications

| Phase | Surface | Status |
| --- | --- | --- |
| 4A | Banking Dashboard (`/app`) | Implemented |
| 4B | Banking Module (15 routes under `/app/*`) | Implemented |
| 4C | AI Security Center (16 routes under `/app/guard/*`) | Implemented |
| 4D | Enterprise AI-SOC Cockpit (22 routes under `/admin/*`) | Implemented |
| 4E | Global Design QA + Polish Pass | Director-approved; P0 token unification scheduled before GA |

## 4. Technical Architecture

Per **Phase 5A**:
- **Frontend:** TanStack Start (React 19, Vite 7, Tailwind v4).
- **Backend:** Python (FastAPI) service mesh — Identity, Banking, Behavior, Decision, Notification, Audit.
- **Data:** PostgreSQL (OLTP), Redis (sessions/cache), Kafka (events), ClickHouse (telemetry analytics), S3 (cold).
- **ML:** Online featurizer + LightGBM risk model + OC-SVM novelty + SHAP explainer; served via Ray/MLflow.
- **Infra:** EKS, Terraform IaC, ArgoCD, OpenTelemetry → Datadog + Sentry.
- **Boundary:** Lovable Cloud (Supabase) backs early sprints; the Python mesh replaces it incrementally behind a stable contract layer.

## 5. Sprint 0 — Foundations

Per **Phase 5C**: monorepo, one-command bootstrap, CI spine, preview envs, observability stubs, secret management, and on-call runbook template. No product features ship in Sprint 0.

## 6. Sprint 1 — Identity & Behavioral Auth

Per **Phase 5D**: end-to-end **register → OTP verify → behavioral enrollment → first session → dashboard land**. All contracts frozen at D3. Auth-protected routes live under `_authenticated/`. `user_roles` table ships in Sprint 1.

## 7. API Contracts

OpenAPI specs live in `docs/api/`. Typed clients are generated from contracts — **no handwritten DTOs**.

- `docs/api/openapi.identity.yaml` — Identity & Auth
- `docs/api/openapi.banking.yaml` — Banking core
- `docs/api/openapi.behavior.yaml` — Behavioral telemetry ingestion
- `docs/api/openapi.decision.yaml` — Risk / decision engine
- `docs/api/events.asyncapi.yaml` — Kafka event contracts

## 8. Database Design

ERD: `docs/db/ERD.md` (mermaid). Includes tables, relationships, indexes, constraints, retention, encryption-at-rest strategy, and audit hooks.

## 9. ML Pipeline

Per Phase 5A §ML. Online features (typing rhythm, mouse kinematics, session context) → LightGBM (P(legitimate)) + OC-SVM (novelty) → SHAP for explainability → decision: **allow / challenge / step-up / block**. Models versioned in MLflow; promotion gated through `/admin/ai/models`.

## 10. Security Model

- AuthN: short-lived access JWT (KMS-signed) + refresh cookie scoped to `/api/auth`.
- AuthZ: `user_roles` table + `has_role()` SECURITY DEFINER function. No roles on profile tables.
- Telemetry: hashed/aggregated, never raw keystroke content. Privacy dashboard at `/app/guard/privacy`.
- Audit: append-only, chain-hashed ledger in `/admin/audit`.
- Secrets: AWS KMS + Secrets Manager; never in repo; previews use scoped read-only secrets.

---

## 11. Approved Open Decisions (Sprint 1 sign-off)

- ✓ MailHog (dev) · Amazon SES Sandbox (staging)
- ✓ AWS KMS-backed JWT signing keys
- ✓ Refresh cookie scoped to `/api/auth`
- ✓ Hand-authored `_authenticated/` layout (no generator)
- ✓ `user_roles` table from Sprint 1
- ✓ LaunchDarkly for feature flags (Unleash fallback if OSS-only mandate emerges)

## 12. Change Control

Material changes require: ADR in `docs/adr/`, Master PRD diff, and Architecture Council sign-off in the PR description. Non-material clarifications can go straight to PR.
