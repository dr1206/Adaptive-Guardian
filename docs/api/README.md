# API Contracts

**Contracts are the source of truth.** All DTOs, client SDKs, and server stubs are **generated** from these files. No handwritten request/response types in app code.

## Specs

| File                    | Domain                                           | Status                               |
| ----------------------- | ------------------------------------------------ | ------------------------------------ |
| `openapi.identity.yaml` | Register, OTP, login, refresh, logout, roles     | Sprint 1 — frozen at D3              |
| `openapi.banking.yaml`  | Accounts, transactions, transfers, beneficiaries | Sprint 2                             |
| `openapi.behavior.yaml` | Behavioral feature ingestion + session telemetry | Sprint 1 (ingest only)               |
| `openapi.decision.yaml` | Risk evaluation, challenges, explainability      | Sprint 3                             |
| `events.asyncapi.yaml`  | Kafka event contracts (Avro schemas)             | Sprint 1 — outbox + audit topic only |

## Generation

- **TS client (frontend):** `openapi-typescript` → `src/lib/api/__generated__/`.
- **Python client/stubs (services):** `datamodel-code-generator` + `fastapi-codegen`.
- **Avro types:** `avro-codegen` to language-specific packages.

CI fails when generated files drift from specs. Never edit `__generated__/`.

## Versioning

- URI versioning: `/api/v1/...`.
- Breaking changes require new major (`/api/v2/...`) + 6-month overlap.
- Additive changes (new optional field, new endpoint) ship in-place.

## Authentication

Unless explicitly marked `security: []`, every endpoint requires the bearer access token. Refresh endpoint reads the scoped `/api/auth` cookie.
