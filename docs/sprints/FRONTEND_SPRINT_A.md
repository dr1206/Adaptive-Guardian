# Frontend Sprint A — Foundation (Close-out)

**Status:** Complete · **Mode:** Frontend-only pivot · **Date:** 2026-06-29

The user has elected to implement the backend, services, databases, ML
pipeline, and infrastructure locally outside this Lovable preview. This
project's responsibility narrows to **production-quality React frontend
ready to be wired to a real backend without UI changes.**

## What was already in place from Phases 1–4

| Pillar | Source | Status |
|---|---|---|
| Application shell | `src/routes/__root.tsx`, `app.tsx`, `auth.tsx`, `admin.tsx` | Shipped |
| Design tokens | `src/styles.css` (OKLCH semantic tokens, glass, gradients, motion) | Shipped |
| Theme system | Dark-only Vault atmosphere + Cockpit Ops palette | Shipped |
| Layout system | VaultRail, OpsRail, GuardSubRail, AppShell layouts | Shipped |
| Navigation | TanStack Router type-safe file routes (60+ surfaces) | Shipped |
| Component library | `src/components/ui/` (shadcn) + `src/components/{banking,dashboard,guard,admin,brand,landing,auth}/` | Shipped |
| Route structure | Landing, /auth/*, /app/*, /admin/* | Shipped |
| Responsive framework | Tailwind v4 + custom utilities, grid+min-w-0 patterns | Shipped |
| Animation framework | CSS keyframes (pulse-live, float-soft, skeleton-shimmer); per-component motion primitives | Shipped |
| Engineering foundation | `src/lib/platform/` (env, logger, errors, flags, observability, auth-middleware) | Shipped Sprint 1A |

## What Sprint A added (the actual gap)

**Centralized mock service layer.** Every UI feature from Sprint B onward
calls `services.*` through React Query hooks, never raw `fetch` and never the
loose `*-data.ts` mocks. When you wire the real backend locally, only
`registry.ts` changes — UI is untouched.

```
src/services/
├── index.ts                     # public surface — contracts + registry
├── registry.ts                  # mock-or-http switch (VITE_USE_REAL_API)
├── hooks.ts                     # React Query hooks per domain
├── _transport/
│   └── mock.ts                  # latency, failure injection, abort
├── auth/
│   ├── auth.contract.ts         # Session, LoginInput, RegisterInput, ...
│   └── auth.mock.ts
├── banking/
│   ├── banking.contract.ts
│   └── banking.mock.ts
├── aegis/
│   ├── aegis.contract.ts        # snapshots, decisions, devices, risk events
│   └── aegis.mock.ts            # subscribeSnapshots for live confidence
└── admin/
    ├── admin.contract.ts
    └── admin.mock.ts
```

### Architecture rules (enforced from Sprint B)

1. **No direct mock imports in components.** Components import contracts
   and hooks. `banking-data.ts` / `admin-data.ts` remain only as fixture
   sources for the mock impls and existing legacy surfaces — migrated
   route-by-route in Sprints B–F.
2. **No raw `fetch` in components.** All network traffic flows through
   `services.*`.
3. **Every async call accepts an `AbortSignal`.** React Query passes one
   automatically; mocks honor it via `_transport/mock.ts`.
4. **Errors are typed.** Services throw `AppError` subclasses from
   `@/lib/platform/errors`; UI maps `error.code` to copy.
5. **Latency is realistic.** Mocks default to 180–420ms so UI is built
   for the real network from day one.

### Swapping to the real backend

```ts
// .env.local (when running outside Lovable, against your local API)
VITE_USE_REAL_API=true
VITE_API_BASE_URL=http://localhost:8000
```

Then add `src/services/<domain>/<domain>.http.ts` implementations of each
contract and wire them in `registry.ts`. Zero component changes required.

## Public hook surface

```ts
// Auth
useSession(); useLogin(); useRegister(); useVerifyOtp(); useLogout();
useSubmitEnrollment();

// Banking
useAccounts(); useAccount(id); useTransactions({ accountId, limit });
useBeneficiaries(); useCards(); useInitiateTransfer();

// Aegis (continuous behavioral signals)
useAegisSnapshot(); useAegisLive(); useDecisions(); useDevices(); useRiskEvents();

// Admin cockpit reads
useAdminUsers(); useAdminSessions(); useAdminModels(); useAdminAudit();
```

## Sprint B–F migration plan

Existing UI today reads from `src/lib/banking-data.ts` and `src/lib/admin-data.ts`
synchronously. Each subsequent sprint migrates its surfaces to the hooks above:

- **Sprint B (Auth/Enrollment UI)** — wire `useLogin`, `useVerifyOtp`,
  `useSubmitEnrollment`. Build keystroke + mouse capture SDK against the
  `EnrollmentSample` contract.
- **Sprint C (Dashboard)** — Balance Hero, Welcome Header, Aegis Widget,
  Transaction Feed move to hooks. Aegis Widget subscribes via `useAegisLive`.
- **Sprint D (Banking Module)** — Accounts, Cards, Transfer, Beneficiaries,
  Transactions move to hooks. Transfer flow uses `useInitiateTransfer` and
  passes dwell time as a behavioral signal field.
- **Sprint E (Security Center)** — All `/app/guard/*` surfaces consume
  `useDecisions`, `useDevices`, `useRiskEvents`, plus live snapshots.
- **Sprint F (Admin Cockpit)** — All `/admin/*` tables and panels consume
  `useAdmin*` hooks; mutations land as the corresponding service writes
  ship in your local backend.

## Out of scope (now owned by your local Claude track)

- Identity service, OTP delivery, JWT/KMS
- Behavioral feature aggregation server-side
- Aegis ML scoring (LightGBM, OC-SVM, SHAP)
- Banking domain APIs
- Admin write operations
- Postgres, Redis, Kafka, MinIO, Docker, EKS, Terraform

## After Sprint F

- Responsive optimization pass (mobile audit of all 60+ routes).
- Accessibility audit (WCAG AA+: focus rings, reduced-motion, ARIA, contrast).
- Performance pass (route-level code splitting, image budgets, motion gates).
- Frontend QA (Playwright critical paths against the mock service layer).

## Sign-off gate

Sprint A is closed when:
1. `src/services/` compiles, exports the contract types, and the registry
   resolves to mocks. ✅
2. Sprint B kickoff has no service-layer blockers. Ready when you are.
