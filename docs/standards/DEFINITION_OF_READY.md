# Definition of Ready (DoR)

A feature is **Ready** when every box below is checked. No story enters a sprint without it.

## Checklist

- [ ] **Approved UX** — Figma frame (or Phase 4 spec) signed off by Design Lead. Dark mode covered. Empty, loading, error, and offline states present.
- [ ] **Approved API contract** — OpenAPI/AsyncAPI diff merged to `docs/api/`. Typed client regenerated; CI green.
- [ ] **Approved database changes** — migration drafted; ERD diff in PR description; RLS policies + GRANTs included.
- [ ] **Acceptance criteria** — Gherkin-style scenarios in the ticket. Must cover happy path + at least one failure path.
- [ ] **Test plan** — unit, contract, integration, and (where critical-path) E2E coverage spelled out before code.
- [ ] **Accessibility checklist** — keyboard map, focus order, ARIA, contrast, reduced-motion behavior. Axe target: zero serious/critical.
- [ ] **Security review** — threat-model bullets in ticket. Touches auth/KMS/RLS? → Security Architect tagged. Touches PII? → DPIA delta noted.
- [ ] **Performance considerations** — expected p95 latency / payload size / query plan; load-test target if new endpoint.
- [ ] **Observability** — log lines, metrics, traces, and at least one alert defined.
- [ ] **Feature flag** — name reserved in LaunchDarkly, default OFF, owner assigned.
- [ ] **Runbook stub** — if introduces a new on-call surface, runbook file exists (may be sparse).
- [ ] **Rollback plan** — one-paragraph description of how to disable/revert safely.

## Sign-Off

PM, Design Lead, Tech Lead, and (when applicable) Security Architect mark the ticket `ready` before sprint planning. A `ready` ticket cannot have unanswered open questions.
