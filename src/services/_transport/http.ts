/**
 * HTTP transport layer — thin fetch wrapper for real backend communication.
 *
 * Responsibilities:
 *  - Inject Authorization header from stored access token
 *  - On 401, attempt silent refresh via HttpOnly cookie, then retry
 *  - Map backend error JSON to frontend AppError classes
 *  - Propagate AbortSignal for React Query cancellation
 *
 * Token lifecycle:
 *  - Access token: in-memory + localStorage (short-lived, 15 min)
 *  - Refresh token: HttpOnly cookie set by backend (path=/api/v1/auth)
 */

import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  IntegrationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "../../lib/platform/errors";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env?.["VITE_API_BASE"] ?? "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------------
// Token store
// ---------------------------------------------------------------------------

let accessToken: string | null = null;

function loadToken(): string | null {
  try {
    return localStorage.getItem("ag_access_token");
  } catch { /* localStorage blocked */ }
  return null;
}

function saveToken(token: string): void {
  accessToken = token;
  try {
    localStorage.setItem("ag_access_token", token);
  } catch { /* noop */ }
}

function clearToken(): void {
  accessToken = null;
  try {
    localStorage.removeItem("ag_access_token");
    localStorage.removeItem("ag_session_id");
  } catch { /* noop */ }
}

function saveSessionId(id: string): void {
  try {
    localStorage.setItem("ag_session_id", id);
  } catch { /* noop */ }
}

function getStoredSessionId(): string | null {
  try {
    return localStorage.getItem("ag_session_id");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uuid4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function mapBackendError(body: { code?: string; message?: string; details?: Record<string, unknown> }): AppError {
  const code = body.code ?? "INTERNAL_ERROR";
  const message = body.message ?? "An unexpected error occurred";

  if (code === "VALIDATION") return new ValidationError(message, body.details);
  if (code === "AUTHENTICATION") return new AuthenticationError(code, message);
  if (code === "AUTHORIZATION") return new AuthorizationError(code, message);
  if (code === "NOT_FOUND") return new NotFoundError(code, message);
  if (code === "CONFLICT") return new ConflictError(code, message, body.details);
  if (code === "RATE_LIMIT") return new RateLimitError(60);
  if (code === "SECURITY") return new AuthenticationError(code, message);

  return new AppError(message, { code, status: 500 });
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const resp = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!resp.ok) {
        clearToken();
        return null;
      }
      const body = await resp.json() as { accessToken?: string; sessionId?: string };
      const token = body.accessToken;
      if (token) {
        saveToken(token);
        if (body.sessionId) saveSessionId(body.sessionId);
        return token;
      }
      return null;
    } catch {
      clearToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface HttpRequest {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
  /** Body (will be JSON-serialized). */
  body?: unknown;
  /** Query parameters appended to the URL. */
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export async function httpRequest<T = unknown>(path: string, req: HttpRequest = {}): Promise<T> {
  const method = req.method ?? "GET";
  const url = buildUrl(path, req.params);
  const correlationId = uuid4();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Correlation-Id": correlationId,
  };

  const token = loadToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let resp = await fetch(url, {
    method,
    headers,
    body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
    signal: req.signal,
    credentials: "include",
  });

  // Attempt silent refresh on 401 (only once per request)
  if (resp.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      resp = await fetch(url, {
        method,
        headers,
        body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
        signal: req.signal,
        credentials: "include",
      });
    }
  }

  if (!resp.ok) {
    if (resp.status === 204) return undefined as unknown as T;
    let body: { code?: string; message?: string; details?: Record<string, unknown> } = {};
    try {
      body = await resp.json() as Record<string, unknown>;
    } catch { /* non-JSON body */ }
    throw mapBackendError(body);
  }

  if (resp.status === 204) return undefined as unknown as T;
  return resp.json() as Promise<T>;
}

/** Exposed for auth service init — called after login / verify-otp to persist the token. */
export function setAccessToken(token: string): void {
  saveToken(token);
}

/** Persist the authenticated login session id (backed by the auth Session record). */
export function setCurrentSessionId(sessionId: string): void {
  saveSessionId(sessionId);
}

/** Read the currently authenticated login session id (or null when logged out). */
export function getCurrentSessionId(): string | null {
  return getStoredSessionId();
}

/** Exposed for logout — clears the stored token. */
export function removeAccessToken(): void {
  clearToken();
}

/** Check whether a token is available (for optimistic UI). */
export function hasToken(): boolean {
  return loadToken() !== null;
}
