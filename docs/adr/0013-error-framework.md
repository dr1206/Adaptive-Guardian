# ADR 0013 — Error Framework: Typed AppError Hierarchy

**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** Staff Architect, Principal BE, Principal FE

## Context
We need consistent error semantics across services and the web app so that:
- HTTP status codes are derived, not chosen ad-hoc.
- Frontend can translate errors into copy without parsing strings.
- Sentry groups errors meaningfully.
- Security errors never leak details to the client.

## Decision
All thrown errors in our code extend `AppError`:

```ts
class AppError extends Error {
  code: string;        // stable machine code: "identity.otp.expired"
  status: number;      // HTTP status mapping
  retryable: boolean;
  details?: Record<string, unknown>;  // safe to surface to client
  cause?: unknown;     // server-only
}
```

Subclasses:
- `ValidationError` (400) — bad input shape; details = field errors.
- `AuthenticationError` (401) — missing/invalid credentials.
- `AuthorizationError` (403) — insufficient scope/role.
- `NotFoundError` (404).
- `ConflictError` (409) — uniqueness, version mismatch.
- `RateLimitError` (429).
- `IntegrationError` (502) — downstream failure; always retryable=true.
- `SecurityError` (403, code redacted in client response).

**Wire format** (every error response):
```json
{ "code": "identity.otp.expired", "message": "Code expired.", "details": {} }
```

**Frontend:** `code` → i18n key. Never display `cause` or stack.
**Sentry:** group by `code`; fingerprint excludes stack to deduplicate.

## Consequences
- **(+)** Predictable error shape across the stack; easier i18n.
- **(–)** Discipline required — lint rule rejects raw `throw new Error()` in services and packages.
