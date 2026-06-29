/**
 * @adaptiveguard/auth-middleware — JWT verify + RequestContext skeleton
 *
 * Sprint 1A ships the request context shape and a permissive stub. Real JWT
 * verification (KMS-backed JWKS, exp/aud/iss checks, RLS session var
 * propagation) lands in Sprint 1B with the Identity service.
 */

import { AuthenticationError } from "./errors";

export interface RequestContext {
  userId: string | null;
  tenantId: string | null;
  roles: ReadonlyArray<string>;
  claims: Readonly<Record<string, unknown>>;
}

export const ANONYMOUS: RequestContext = Object.freeze({
  userId: null,
  tenantId: null,
  roles: [] as const,
  claims: Object.freeze({}),
});

/**
 * Extract the bearer token from a Headers-like object. Returns null if
 * missing or malformed. Sprint 1B replaces the verifier body.
 */
export function extractBearer(headers: Headers): string | null {
  const raw = headers.get("authorization");
  if (!raw) return null;
  const [scheme, token] = raw.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

/**
 * Stub verifier. Returns ANONYMOUS when no token is present and throws
 * AuthenticationError when a token is present — forcing future code paths
 * to wire real verification before relying on identity.
 */
export async function verifyRequest(headers: Headers): Promise<RequestContext> {
  const token = extractBearer(headers);
  if (!token) return ANONYMOUS;
  throw new AuthenticationError(
    "common.auth.not_implemented",
    "Identity verification ships in Sprint 1B.",
  );
}

export function requireUser(ctx: RequestContext): asserts ctx is RequestContext & {
  userId: string;
  tenantId: string;
} {
  if (!ctx.userId || !ctx.tenantId) {
    throw new AuthenticationError();
  }
}
