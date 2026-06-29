# Sprint 1A — Engineering Foundation

**Status:** In progress · **Duration:** 10 working days · **Owner:** Platform Team
**Goal:** Ship the operating system every future sprint runs on. **Zero business features.**

A new engineer must go from `git clone` → green CI → "Hello Aegis" trace
end-to-end in **< 10 minutes**, with no manual setup beyond `pnpm install`
and `docker compose up`.

---

## 1. Success Criteria (Definition of Done)

| # | Gate | Verification |
|---|------|--------------|
| 1 | Monorepo bootstrapped (pnpm + Turborepo) | `pnpm -w build` green |
| 2 | All shared packages publish-ready (private) | `pnpm -F @adaptiveguard/* build` |
| 3 | API client generated from OpenAPI | `pnpm contracts:generate` is idempotent |
| 4 | Design tokens consumed by `apps/web` | Storybook renders with branded theme |
| 5 | Storybook live with ≥10 primitives | `pnpm -F @adaptiveguard/ui storybook` |
| 6 | Logger emits structured JSON in all envs | unit test asserts shape |
| 7 | Error framework: typed `AppError` + boundaries | unit + route boundary tests |
| 8 | Feature flags: `useFlag()` works against LD + local fallback | unit + Cypress smoke |
| 9 | Env management: zod-validated, fail-fast | `pnpm env:check` red on missing |
| 10 | Auth middleware skeleton: JWT verify + RLS context | contract test green (stub user) |
| 11 | Postgres + Redis + Kafka + MinIO + Jaeger via Compose | `docker compose ps` all healthy |
| 12 | Migrations runner wired (Flyway baseline V0001) | `pnpm db:migrate` green |
| 13 | CI: typecheck + lint + test + build under 6 min | GitHub Actions green |
| 14 | Pre-commit hooks: format, lint, commitlint | `git commit` rejects bad input |
| 15 | OpenTelemetry traces from web → bff → svc visible in Jaeger | manual smoke documented |
| 16 | Sentry wired FE + BE with environment + release tags | test error appears in Sentry |
| 17 | ADRs 0010–0014 written and accepted | files present, reviewer column filled |
| 18 | `CONTRIBUTING.md`, `ONBOARDING.md`, `RUNBOOK.template.md` published | docs link from root README |

---

## 2. Monorepo Topology

```text
adaptiveguard/
├── apps/
│   ├── web/                          # this repo's current TanStack Start app
│   ├── admin/                        # cockpit (extracted from /admin routes)
│   └── docs-site/                    # MkDocs Material — engineering portal
├── services/
│   ├── identity/                     # FastAPI (Sprint 1B)
│   ├── behavior/                     # FastAPI (Sprint 1C)
│   ├── decision/                     # FastAPI (Sprint 1D)
│   ├── banking/                      # FastAPI (Sprint 2)
│   └── notification/                 # FastAPI (later)
├── packages/
│   ├── contracts/                    # generated OpenAPI/AsyncAPI clients
│   ├── ui/                           # shared React design system + Storybook
│   ├── tokens/                       # design tokens (CSS vars + JSON + Style Dictionary)
│   ├── types/                        # cross-cutting TS types
│   ├── config/                       # eslint, tsconfig, prettier, biome presets
│   ├── logger/                       # structured logger (pino on node, console on edge)
│   ├── errors/                       # AppError hierarchy + boundary helpers
│   ├── flags/                        # LaunchDarkly client + local JSON fallback
│   ├── env/                          # zod-validated env loader
│   ├── otel/                         # OpenTelemetry wiring (FE + BE)
│   ├── auth-middleware/              # JWT verify + RLS context propagation
│   └── db/                           # node-postgres pool + migrations runner
├── infra/
│   ├── docker/                       # Dockerfiles + compose files
│   ├── terraform/                    # AWS primitives (Sprint 0 already started)
│   ├── helm/                         # K8s charts
│   └── argocd/                       # ApplicationSet manifests
├── docs/                             # MASTER_PRD, ADRs, API, DB, components, sprints, runbooks
├── .github/workflows/                # CI pipelines
├── .changeset/                       # release notes
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

**Note for this repository:** during Sprint 1A the current Lovable project
hosts `apps/web` in-place. Files under `packages/` and `services/` are
materialized as documentation blueprints + working source under
`src/lib/<package>/` so they compile against the live preview, and will be
hoisted into real workspaces during the Sprint 1A close-out migration day.

---

## 3. Workstreams (parallelizable)

### WS-1 · Monorepo & Tooling — Lead: Platform
- pnpm workspaces, Turborepo pipeline (`build`, `lint`, `test`, `typecheck`).
- Node 20.x via `.nvmrc`; pnpm 9 pinned via `packageManager`.
- Biome for lint + format; ESLint kept only for React-specific rules.
- Commitlint + Husky + lint-staged.

### WS-2 · Shared Packages — Lead: FE Platform
- `@adaptiveguard/tokens` — Style Dictionary; emits `tokens.css`, `tokens.json`, `tokens.d.ts`.
- `@adaptiveguard/ui` — shadcn-derived primitives, Storybook 8, Chromatic.
- `@adaptiveguard/types` — `User`, `Account`, `Session`, `RiskScore`, etc.
- `@adaptiveguard/contracts` — `openapi-typescript` + `datamodel-code-generator`.

### WS-3 · Runtime Frameworks — Lead: BE Platform
- `@adaptiveguard/logger` — pino on node, isomorphic JSON on edge.
- `@adaptiveguard/errors` — `AppError`, `BusinessError`, `SecurityError`, `IntegrationError`; HTTP mapping table.
- `@adaptiveguard/flags` — LD SDK + offline JSON fallback (`flags.dev.json`).
- `@adaptiveguard/env` — zod schema per service; `loadEnv()` fails fast.
- `@adaptiveguard/otel` — auto-instruments fetch + pg + kafka; B3 propagation.
- `@adaptiveguard/auth-middleware` — JWT verify stub (verifies signature against KMS pubkey JWKS, no user lookup yet); sets `RequestContext` with `userId`, `tenantId`, `roles`.

### WS-4 · Data & Infra — Lead: DevOps
- `docker-compose.dev.yml` (Postgres 16, Redis 7, Redpanda, MinIO, Jaeger, Mailpit).
- Flyway baseline migration V0001 (tenants, users, user_roles, sessions; no business tables).
- `@adaptiveguard/db` — `pg.Pool` wrapper + RLS session var set on every checkout.

### WS-5 · Quality & CI — Lead: QA
- GitHub Actions: `ci.yml` (typecheck, lint, test, build), `preview.yml` (per-PR ephemeral env), `release.yml` (changesets).
- Vitest + Testing Library + Playwright skeleton.
- Coverage gate: 80% on shared packages; 0% required on `apps/*` and `services/*` this sprint (no features yet).
- semgrep + gitleaks in CI.

### WS-6 · Observability — Lead: SRE
- OpenTelemetry Collector in Compose forwarding to local Jaeger.
- Sentry projects: `web`, `admin`, one per service (placeholder DSNs in `.env.example`).
- Walking-skeleton trace: `GET /api/health` → BFF → echo service → DB ping → Jaeger UI.

### WS-7 · Documentation — Lead: Tech Lead
- `CONTRIBUTING.md`, `ONBOARDING.md` (10-min quickstart), `RUNBOOK.template.md`.
- ADRs 0010–0014 (see §6).
- MkDocs Material site auto-built in CI from `docs/`.

---

## 4. Daily Milestones

| Day | Milestone |
|----|-----------|
| D1 | Repo bootstrapped: pnpm workspaces, Turborepo, Biome, Husky. Empty packages skeleton. |
| D2 | Shared `tokens`, `types`, `config`, `env`, `logger`, `errors`. Unit tests green. |
| D3 | `ui` package + Storybook 8; first 10 primitives extracted from `apps/web`. |
| D4 | OpenAPI generation pipeline (`contracts/`); `apps/web` migrated to generated client. |
| D5 | Compose stack live; `db` package + Flyway baseline; RLS verified. |
| D6 | `otel` + Sentry; walking-skeleton trace visible in Jaeger. |
| D7 | `flags` + `auth-middleware` skeletons; offline mode works. |
| D8 | CI pipeline green end-to-end; preview env per-PR working. |
| D9 | Chromatic baseline; semgrep + gitleaks; docs site published. |
| D10 | Hardening: dependency audit, license scan, ADR sign-off, demo to engineering. |

---

## 5. Engineering Standards (delta from `docs/standards/ENGINEERING.md`)

- **No business logic** in `packages/*`. Pure infrastructure only.
- **No service-specific code** in `apps/web`. Generated clients only.
- **All env access** through `@adaptiveguard/env`. Bare `process.env.X` is a lint error.
- **All errors** must extend `AppError`. Throwing raw `Error` from a service is a lint error.
- **All logs** must go through `@adaptiveguard/logger`. `console.log` is a lint error outside of dev scripts.
- **All flags** must be declared in `packages/flags/registry.ts` with default, owner, expiry.

---

## 6. ADRs Introduced in Sprint 1A

| ADR | Title | Status |
|-----|-------|--------|
| 0010 | Monorepo Tooling — pnpm + Turborepo | Accepted |
| 0011 | Lint & Format — Biome (with ESLint shim for React rules) | Accepted |
| 0012 | Logging — pino + isomorphic edge transport | Accepted |
| 0013 | Error Framework — typed AppError hierarchy | Accepted |
| 0014 | Observability — OpenTelemetry + Sentry split | Accepted |

ADR templates live in `docs/adr/`.

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Edge runtime incompat with pino | M | H | Conditional transport: pino on node, lightweight JSON logger on Workers. |
| LD SDK adds bundle weight to web | M | M | Server-evaluated flags via bff; client only receives evaluated booleans. |
| Storybook 8 + Tailwind v4 friction | M | M | Use Vite builder + dedicated `tailwind.storybook.css`. |
| Flyway vs node-pg-migrate split | L | M | Flyway owns schema; `@adaptiveguard/db` only runs queries. |
| OTel collector flakiness in dev | L | L | Compose `healthcheck` + auto-restart. |

---

## 8. Exit Review

Sprint 1A is **closed** when:
1. All 18 success gates green.
2. Tech Lead + Principal FE + Principal BE sign off in `docs/sprints/SPRINT_1A_SIGNOFF.md`.
3. Sprint 1B kickoff doc drafted with no foundation blockers listed.

> "If a future sprint needs a hack because the foundation can't support it,
> Sprint 1A wasn't done." — Definition of Foundation
