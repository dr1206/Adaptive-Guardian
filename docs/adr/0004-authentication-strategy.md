# ADR 0004 — Authentication Strategy
**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** Security Architect, Principal BE

## Context
We need to authenticate humans (banking + admin), survive XSS/CSRF, and feed the behavioral engine without breaking session continuity.

## Decision
- **Access token:** short-lived (10 min) JWT, signed via **AWS KMS** asymmetric key (RS256). Stored in memory only.
- **Refresh token:** opaque, rotating, stored as **HttpOnly, Secure, SameSite=Strict cookie scoped to `/api/auth`**.
- **OTP:** 6-digit, 5-minute TTL, single-use, rate-limited per email + IP.
- **Roles:** separate `user_roles` table + `has_role()` SECURITY DEFINER function — never on profile rows.
- **Step-up:** decision engine can demand re-auth (OTP, WebAuthn) mid-session without dropping the user.
- **Trusted devices:** per-device fingerprint + user opt-in; weakens challenge frequency.

## Consequences
- **(+)** KMS-backed signing keys never leave the HSM boundary; rotation is a config change.
- **(+)** Cookie scoping eliminates a class of CSRF on non-auth routes.
- **(–)** Memory-only access tokens require careful tab/refresh handling — covered by Sprint 1 frontend spec.

## Alternatives
- **Symmetric HS256** — simpler, but key material lives in app memory; rejected for compliance.
- **Session cookies only** — loses bearer-token portability for future mobile clients.
