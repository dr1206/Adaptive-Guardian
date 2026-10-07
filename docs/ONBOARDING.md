# Engineer Onboarding — Day 1

**Goal:** From "just received GitHub access" to a green local trace in **under 10 minutes.**

If any step takes longer than the budget below, stop and ping `#platform` — that's a foundation bug, not your fault.

| Step | Budget | What                                                              |
| ---- | ------ | ----------------------------------------------------------------- |
| 1    | 1 min  | `nvm use` + `corepack enable`                                     |
| 2    | 2 min  | `pnpm install`                                                    |
| 3    | 30 s   | `cp .env.example .env.local`                                      |
| 4    | 2 min  | `docker compose -f infra/docker/compose.dev.yml up -d`            |
| 5    | 30 s   | `pnpm db:migrate`                                                 |
| 6    | 30 s   | `pnpm dev`                                                        |
| 7    | 1 min  | Open `http://localhost:8080` — landing page renders               |
| 8    | 1 min  | Open `http://localhost:16686` — find the trace for your page load |
| 9    | 30 s   | `pnpm test` — green                                               |

## Day 1 reading (45 min)

1. `docs/MASTER_PRD.md` — what we're building and why.
2. `docs/sprints/SPRINT_1A.md` — the foundation you just stood up.
3. `docs/standards/ENGINEERING.md` — the rules every PR follows.
4. `docs/adr/README.md` — index of every decision so far.
5. `docs/db/ERD.md` — the data model.

## Day 1 first PR

Pick a doc typo. Open a PR. Watch the full CI pipeline run. You're in.

## Where things live

- **UI changes** → `apps/web/src/` (today) or `packages/ui/` (shared)
- **API contract changes** → `docs/api/*.yaml` then `pnpm contracts:generate`
- **Schema changes** → `infra/db/migrations/`
- **Infra changes** → `infra/terraform/` or `infra/helm/`
- **A new decision** → `docs/adr/`

## Who to ask

- Architecture → Staff Architect
- Frontend → Principal FE
- Backend → Principal BE
- ML / Aegis → ML Architect
- Infra / SRE → SRE Lead
- Security → Security Architect

Welcome aboard.
