# AdaptiveGuard AI — Contributing Guide

Welcome. This repo is monorepo-shaped and convention-heavy; the conventions are what let us ship a security product at speed without regressions.

## Quickstart (target: < 10 minutes from zero)

```bash
# 1. Toolchain
nvm use                  # Node 20.x
corepack enable          # pnpm via packageManager pin
pip install uv           # Python services

# 2. Install
pnpm install
make py-install          # editable installs for services/*

# 3. Local stack
docker compose -f infra/docker/compose.dev.yml up -d

# 4. Migrations + seed
pnpm db:migrate
pnpm db:seed

# 5. Dev
pnpm dev                 # turbo runs apps/web + apps/admin + services in watch mode
```

Visit `http://localhost:8080` (web), `http://localhost:8081` (admin),
`http://localhost:16686` (Jaeger).

If any step fails, the error message points to a runbook under
`docs/runbooks/`. If it doesn't, that's a bug — please open a PR adding one.

## Branching

`<type>/<scope>-<ticket>-<short-slug>` — see `docs/standards/ENGINEERING.md` §8.

## Commit Messages

Conventional Commits. Commitlint enforces the format pre-push.

## Code Style

Biome handles formatting & most lint. ESLint handles React-specific rules.
Both run on commit via lint-staged. Don't fight the formatter.

## Pull Requests

- 1 reviewer minimum; 2 for migrations, auth, KMS, ML.
- Link to Master PRD section + ADR.
- Screenshots/recordings for UI changes.
- CI must be green; preview env must be up.

## Adding a Dependency

- App or service deps: `pnpm -F <workspace> add <pkg>`.
- Shared packages: add to that package's `package.json`; never cross-import a peer's `node_modules`.
- Heavy deps (>50KB gzip) require a 1-line justification in the PR description.

## Adding an Environment Variable

1. Add to the service's zod schema in `packages/env/schemas/`.
2. Add to `.env.example` with a placeholder value.
3. Add to Terraform variables if needed at runtime in cloud.
4. Document in the service's `README.md`.

Never read `process.env.X` directly. The lint rule blocks it.

## Adding a Feature Flag

```ts
// packages/flags/registry.ts
export const flags = {
  'identity.new-otp-flow': {
    default: false,
    owner: '@identity',
    description: 'Rolls out the 8-digit OTP flow',
    expires: '2026-09-01',
  },
} as const;
```

Flags without an `expires` date fail CI. Flags past expiry fail CI.

## Adding a Log Statement

```ts
import { createLogger } from '@adaptiveguard/logger';
const log = createLogger({ service: 'identity' });

log.info({ event: 'auth.login.success', userId }, 'user logged in');
```

`console.log` is a lint error outside of `scripts/` and `*.test.ts`.

## Adding an Error Type

Extend `AppError` from `@adaptiveguard/errors`. Throwing raw `Error` from a
service or shared package is a lint error.

## Running Tests

```bash
pnpm test                 # unit + integration (vitest + pytest)
pnpm test:e2e             # playwright
pnpm test:contract        # schemathesis
```

## Releasing

Changesets. Run `pnpm changeset` before merge for any user-visible change.
Release PR is opened automatically by the changesets bot.

## Help

- Architecture questions → `#arch` Slack, then ADR.
- Sprint blockers → standup.
- Outages → PagerDuty + `#incident` channel.
