# Engineering Standards

The minimum bar every PR must clear. CI enforces what it can; reviewers enforce the rest.

## 1. Folder Conventions

```
apps/
  web/                 # TanStack Start app (this repo today)
services/
  identity/            # FastAPI service
  behavior/
  decision/
  ...
packages/
  contracts/           # generated OpenAPI/AsyncAPI clients
  ui/                  # shared design system primitives
  config/              # shared eslint, tsconfig, prettier presets
infra/
  terraform/
  helm/
  argocd/
docs/                  # Master PRD, ADRs, API, DB, components, standards
```

Inside `apps/web` (current repo):

```
src/
  routes/              # TanStack file-based routes ONLY
  components/
    ui/                # shadcn primitives — do not edit by hand
    <domain>/          # feature components grouped by domain
  lib/                 # utilities, data, generated API clients
  hooks/
  styles.css           # tokens
```

## 2. Naming Conventions

| Thing | Convention | Example |
| --- | --- | --- |
| React component file | `kebab-case.tsx` exporting `PascalCase` | `balance-hero.tsx` → `BalanceHero` |
| Hook | `use-kebab.ts` exporting `useCamel` | `use-mobile.ts` → `useMobile` |
| Route file | TanStack flat dot convention | `app.guard.devices.tsx` |
| Server fn | `*.functions.ts` | `accounts.functions.ts` |
| Server-only helper | `*.server.ts` | `kms.server.ts` |
| Type | `PascalCase`, no `I` prefix | `Account`, not `IAccount` |
| Constant | `SCREAMING_SNAKE_CASE` | `MAX_OTP_ATTEMPTS` |
| Env var | `UPPER_SNAKE_CASE`; public = `VITE_*` | `VITE_API_BASE_URL` |
| DB table | `snake_case`, plural | `user_roles` |
| Kafka topic | `domain.entity.event` | `behavior.features.window` |

## 3. Error Handling

- **Never swallow.** Either handle (with user-visible recovery), rethrow, or report to Sentry.
- Throw `Error` subclasses with a stable `code`. Frontend translates `code` to copy via i18n.
- Server functions: return typed errors via standard `Error` shape `{ code, message, details? }`.
- Route boundaries: every route with a loader sets `errorComponent` + `notFoundComponent` (see TanStack rules).
- Retries: only for idempotent operations; exponential backoff; max 3.

## 4. Logging Standards

- Backend: structured JSON, one event per line. Fields: `ts`, `level`, `service`, `traceId`, `spanId`, `userId?`, `event`, `payload`.
- Frontend: `console.error` only for true errors; route them through `reportLovableError`.
- Never log secrets, raw OTPs, full tokens, raw behavioral events, or PII beyond `userId`.
- Log levels: `debug` (dev only), `info` (state transitions), `warn` (recoverable), `error` (paged), `fatal` (process exit).

## 5. Testing Strategy

| Layer | Tool | When required |
| --- | --- | --- |
| Unit (FE) | Vitest + Testing Library | Every util + pure component |
| Unit (BE) | pytest | Every service module |
| Contract | Schemathesis (OpenAPI) | Every service endpoint |
| Integration | Vitest + msw / pytest-asyncio | Every loader + every service handler |
| E2E | Playwright | Critical paths: register → enroll → dashboard, transfer, login |
| Visual | Chromatic on Storybook | All component stories |
| Load | k6 | Before any GA-bound service |
| Security | semgrep + gitleaks in CI | Every PR |

**Coverage floor:** 80% lines, 75% branches per service; reviewer discretion below.

## 6. Documentation Standards

- Every package has a top-level `README.md` with: purpose, install, dev loop, exports.
- Every public function/component has a TSDoc/PEP-257 docstring with `@example`.
- ADRs in `docs/adr/` for any decision affecting > 1 service or > 1 sprint.
- Runbooks in `docs/runbooks/<service>.md` mandatory before a service is on-call.

## 7. Git Workflow

- Trunk: `main`. No long-lived branches.
- Feature branches off `main`; rebased on merge.
- PRs squash-merged with a Conventional Commit title.
- Required checks: typecheck, lint, unit tests, contract tests, build, preview env up.
- 1 reviewer minimum; 2 for migrations, auth, KMS, ML promotion.

## 8. Branch Naming

`<type>/<scope>-<ticket>-<short-slug>`
Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `security`.
Example: `feat/identity-AG-142-refresh-rotation`.

## 9. Commit Conventions

[Conventional Commits 1.0](https://www.conventionalcommits.org/).

```
feat(identity): rotate refresh token on every /auth/refresh
fix(banking): correct EUR formatter for negative balances
chore(deps): bump @tanstack/react-router to 1.x
docs(adr): accept ADR-0009 feature flags
```

Breaking changes: `feat(identity)!: …` + footer `BREAKING CHANGE: …`.

## 10. PR Hygiene

- Link to Master PRD section + ADR (if applicable).
- Screenshots/recordings for UI changes.
- Migration PRs include before/after EXPLAIN for any new query > O(log n).
- Security PRs (auth, KMS, RLS) require Security Architect review.
