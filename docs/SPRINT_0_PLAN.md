# Sprint 0 — Foundation & Scaffold

**Duration:** 7 days · **Target:** Working backend skeleton with auth + health endpoints, MongoDB Atlas connected, CI green.

---

## Deliverables

| #    | Deliverable                                                         | Owner    | Est. | Depends On |
| ---- | ------------------------------------------------------------------- | -------- | ---- | ---------- |
| D0.1 | Docker Compose dev stack (Redis, MinIO) + MongoDB Atlas setup       | Backend  | 0.5d | —          |
| D0.2 | FastAPI project scaffold with domain-module boundaries + Beanie ODM | Backend  | 1d   | D0.1       |
| D0.3 | Beanie Document models + indexes for all Sprint 0 collections       | Backend  | 0.5d | D0.2       |
| D0.4 | Auth domain — register, login, refresh, logout, me                  | Backend  | 2d   | D0.3       |
| D0.5 | Health + readiness endpoints, Prometheus metrics                    | Backend  | 0.5d | D0.2       |
| D0.6 | CI pipeline — lint, type-check, unit tests                          | Backend  | 1d   | D0.2       |
| D0.7 | Behavioral event ingestion skeleton (POST /events/batch)            | Backend  | 1d   | D0.4       |
| D0.8 | Rust collector baseline — key/mouse capture from ADR-0005           | Frontend | 2d   | —          |
| D0.9 | Frontend wire real API toggle — swap mocks for HTTP                 | Frontend | 1d   | D0.4       |

---

## D0.1 — Environment Setup

**MongoDB Atlas:** Free M0 cluster. Connection string stored in `.env` as `MONGODB_URI`. Network access whitelisted for `0.0.0.0/0` during development (restrict before demo).

**Docker Compose:**

```yaml
services:
  redis: # 7-alpine, port 6379
  minio: # latest, ports 9000+9001
  backend: # FastAPI, port 8000
  frontend: # Vite, port 5173
  mailpit: # optional — email OTP testing
```

**Acceptance:** `docker compose up -d` brings up all services. Backend connects to Atlas and responds to health checks.

---

## D0.2 — FastAPI Project Scaffold

**Target structure:**

```
backend/
├── Dockerfile
├── pyproject.toml                  # FastAPI + Motor + Beanie + ML deps
├── .env.example                    # MONGODB_URI, REDIS_URI, MINIO_*, JWT_*
├── src/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app factory, MongoDB lifespan, middleware stack
│   │   ├── config.py               # pydantic-settings from env
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py             # get_current_user, require_admin, rate_limit
│   │   │   ├── errors.py           # exception handlers → AppError.to_response()
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       └── router.py       # mounts all domain routers under /api/v1
│   │   ├── domain/
│   │   │   ├── __init__.py
│   │   │   ├── auth/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py       # POST /auth/register, /auth/login, /auth/refresh, /auth/logout
│   │   │   │   ├── service.py      # business logic
│   │   │   │   ├── schemas.py      # pydantic request/response models
│   │   │   │   ├── models.py       # Beanie Documents — User, Session, OTPChallenge
│   │   │   │   ├── repository.py   # Beanie query layer
│   │   │   │   └── security.py     # JWT encode/decode, bcrypt hash/verify
│   │   │   ├── aegis/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py       # POST /events/batch, GET /aegis/snapshot (Sprint 1)
│   │   │   │   ├── service.py      # scoring orchestration (stub in Sprint 0)
│   │   │   │   ├── schemas.py
│   │   │   │   └── models.py       # Beanie Documents — BehaviorWindow, Decision, DeviceProfile
│   │   │   ├── banking/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py       # GET /accounts, GET /transactions, POST /transfers (Sprint 4)
│   │   │   │   ├── service.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── models.py       # Beanie Documents — Account, Transaction, Beneficiary
│   │   │   └── admin/
│   │   │       ├── __init__.py
│   │   │       ├── router.py       # GET /admin/* (Sprint 3)
│   │   │       ├── service.py
│   │   │       ├── schemas.py
│   │   │       └── models.py
│   │   ├── ml/
│   │   │   ├── __init__.py
│   │   │   ├── feature_extractor.py  # keystroke + mouse feature extraction per ADR-0005
│   │   │   ├── registry.py           # model loading from MinIO, versioning
│   │   │   └── scorer.py             # LightGBM + OCSVM + fusion (stub in Sprint 0)
│   │   ├── shared/
│   │   │   ├── __init__.py
│   │   │   ├── errors.py             # AppError hierarchy matching frontend
│   │   │   ├── auth.py               # JWT middleware, extract_bearer, require_role
│   │   │   └── rate_limit.py         # Redis sliding-window rate limiter
│   │   └── db/
│   │       ├── __init__.py
│   │       └── mongodb.py            # Motor client + Beanie init_beanie()
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py               # test MongoDB + Beanie init, test client
│       ├── unit/
│       │   ├── test_security.py
│       │   └── test_errors.py
│       └── integration/
│           ├── test_auth.py
│           └── test_health.py
└── models/                           # gitignored — serialized .joblib files
```

**Lint-enforced import rules** (per ADR-0015):

- Domain modules MUST NOT import from sibling domains
- Domain modules MAY import from `shared/` and `ml/`
- `api/` MAY import from any domain

**Acceptance:**

- `uvicorn src.app.main:app --reload` starts without errors; connects to Atlas
- `ruff check` passes (zero issues)
- `mypy src/` passes (strict mode)
- `GET /api/v1/health` returns `{"status":"ok"}`
- `GET /api/v1/health/ready` returns `{"status":"ready","mongodb":"connected"}`

---

## D0.3 — Beanie Document Models & Indexes

**Collections (Sprint 0):**

| Collection         | Document Fields                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `users`            | email (unique), password_hash, full_name, is_active, roles, created_at                           |
| `sessions`         | user_id, refresh_token_hash (indexed), device_fingerprint, expires_at (TTL), revoked, created_at |
| `otp_challenges`   | user_id, code_hash, purpose, expires_at (TTL), attempts, verified                                |
| `behavior_windows` | session_id, window_start, window_end, features (free-form dict), created_at                      |
| `decisions`        | session_id, outcome, score, top_contributors, evaluated_at                                       |
| `device_profiles`  | user_id, fingerprint, label, kind, os, browser, trust, last_active                               |

**Indexes:** Declared via Beanie Document `Settings` class. TTL indexes on `sessions.expires_at` and `otp_challenges.expires_at` for auto-cleanup.

**Acceptance:**

- All collections created with correct indexes on first `init_db()` call
- `users.email` unique constraint enforced
- TTL indexes active (verify via `db.collection.getIndexes()`)

---

## D0.4 — Auth Domain

**Endpoints** (matching `openapi.identity.yaml`):

| Method | Path                    | Status | Notes                                                            |
| ------ | ----------------------- | ------ | ---------------------------------------------------------------- |
| POST   | /api/v1/auth/register   | 201    | Creates user; returns session; sets refresh cookie               |
| POST   | /api/v1/auth/verify-otp | 200    | For initial email verification; returns session                  |
| POST   | /api/v1/auth/login      | 200    | Email+password → JWT + refresh cookie                            |
| POST   | /api/v1/auth/logout     | 204    | Invalidates refresh token; clears cookie                         |
| POST   | /api/v1/auth/refresh    | 200    | Refresh cookie → new JWT pair; rotation                          |
| GET    | /api/v1/auth/me         | 200    | Current user info from JWT claims                                |
| POST   | /api/v1/auth/enrollment | 201    | Submit baseline behavioral samples (Sprint 2 — stub returns 501) |

**JWT implementation:**

- Short-lived access token: HS256, 15 min TTL (dev), RS256 pathway per ADR-0004
- Refresh token: 32-byte random, bcrypt-hashed in `sessions` collection, HttpOnly Secure SameSite=Strict cookie
- Refresh rotation on each use

**Data flow:** Beanie Document → repository (async queries) → service (business logic) → router (HTTP layer). No SQLAlchemy sessions. Beanie handles persistence transparently.

**Acceptance:**

- Register → User document created in Atlas, JWT + refresh cookie returned
- Login → JWT + refresh cookie
- Me → User info from JWT claims
- Refresh → New JWT, previous refresh token revoked
- Logout → Refresh token revoked, cookie cleared
- All error responses match the AppError wire format (code, message, details)

---

## D0.5 — Health + Observability

| Method | Path                 | Purpose                                                    |
| ------ | -------------------- | ---------------------------------------------------------- |
| GET    | /api/v1/health       | Liveness — returns `{"status":"ok"}`                       |
| GET    | /api/v1/health/ready | Readiness — pings MongoDB Atlas + Redis                    |
| GET    | /metrics             | Prometheus text format (prometheus-fastapi-instrumentator) |

**Acceptance:**

- Health returns 200 when process is alive
- Ready returns 200 when MongoDB + Redis are reachable, 503 otherwise
- Metrics endpoint exposes request count, latency histograms, error rates

---

## D0.6 — CI Pipeline

**.github/workflows/backend-ci.yml:**

```yaml
on: [push, pull_request]
jobs:
  lint: ruff check src/
  typecheck: mypy src/ --strict
  test: pytest -v --cov=src/app --cov-report=term-missing
```

**Note:** CI tests use a separate MongoDB Atlas database (`adaptive_guardian_test`). No Alembic migration step — Beanie creates indexes on startup.

**Acceptance:** Green CI badge on main branch README.

---

## D0.7 — Behavioral Event Ingestion Skeleton

**Endpoint:** `POST /api/v1/events/batch`

- Validates request body matches `FeatureWindow` schema (from openapi.aegis.yaml)
- Stores document in `behavior_windows` collection
- Returns a stub `ScoreResult` with `verdict: "allow"` and `fusedScore: 1.0`
- Real scoring gates behind `ML_ENABLED` config toggle

**Acceptance:** POST a valid window → 200 with stub score. Invalid window → 422 with validation error.

---

## Dependency Graph

```
D0.1 (Atlas + Infra) ──┬── D0.2 (Scaffold) ──┬── D0.3 (Beanie Models)
                        │                      │
                        │                      ├── D0.5 (Health)
                        │                      │
                        │                      ├── D0.6 (CI)
                        │                      │
                        │                      └── D0.4 (Auth) ── D0.7 (Events)
                        │
                        └── D0.8 (Collector baseline) ← independent frontend work
```

---

## Sprint 0 Done Checklist

- [ ] MongoDB Atlas M0 cluster provisioned; connection verified
- [ ] `docker compose up -d` starts Redis, MinIO, backend, frontend — all healthy
- [ ] `uvicorn` starts without import errors; Beanie initializes collections + indexes
- [ ] Health endpoint returns 200; readiness confirms MongoDB + Redis connected
- [ ] Auth register + login + refresh + logout + me round-trip works (Atlas persisted)
- [ ] JWT access token validation enforced on protected endpoints
- [ ] Refresh token rotation (one-time use) verified
- [ ] `ruff check` + `mypy --strict` → zero issues
- [ ] `pytest` → all tests green; coverage ≥ 80%
- [ ] CI pipeline green on PR
- [ ] POST /events/batch accepts valid feature windows; persists to Atlas
- [ ] All OpenAPI specs match implementation

---

## Sprint 1 Preview (next)

- mRMR feature selection pipeline
- LightGBM + OCSVM model loading from MinIO
- Real scoring in POST /events/batch
- SHAP explainer wired to /aegis/scores/shap/{id}
- Redis-backed scoring cache for /aegis/snapshot
- Training data pipeline (synthetic data for initial model)
