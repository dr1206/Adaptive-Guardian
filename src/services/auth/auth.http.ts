/**
 * Auth HTTP adapter — calls the real backend and maps responses to the
 * frontend AuthService contract shape.
 */

import type {
  AuthService,
  EnrollmentSample,
  EnrollmentSummary,
  LoginInput,
  RegisterInput,
  Session,
  VerifyOtpInput,
} from "./auth.contract";
import {
  httpRequest,
  setAccessToken,
  removeAccessToken,
  hasToken,
  setCurrentSessionId,
} from "../_transport/http";
import { AuthenticationError } from "../../lib/platform/errors";

// ---------------------------------------------------------------------------
// Response shapes (backend wire format via serialization_alias → camelCase)
// ---------------------------------------------------------------------------

interface BackendUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  enrollmentStatus: string;
}

interface BackendAuthSession {
  accessToken: string;
  expiresIn: number;
  sessionId: string;
  user: BackendUser;
}

interface BackendRegistration {
  challengeId: string;
  expiresAt: string;
}

interface BackendMe {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  enrollmentStatus: string;
}

interface BackendEnrollmentReceipt {
  baselineId: string;
  createdAt: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function deriveSignatureSeed(userId: string): string {
  let hash = 0;
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return `ag-seed-${(hash >>> 0).toString(16).padStart(6, "0")}`;
}

function userToSession(user: BackendUser): Session {
  return {
    userId: user.id,
    email: user.email,
    displayName: user.fullName,
    tenantId: "tnt_default",
    roles: user.roles.filter((r): r is "user" | "admin" | "analyst" =>
      ["user", "admin", "analyst"].includes(r),
    ),
    issuedAt: new Date().toISOString(),
    signatureSeed: deriveSignatureSeed(user.id),
  };
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const httpAuthService: AuthService = {
  async getSession({ signal } = {}): Promise<Session | null> {
    if (!hasToken()) return null;
    try {
      const user = await httpRequest<BackendMe>("/auth/me", { signal });
      return userToSession(user);
    } catch (err) {
      // A cancelled load (user navigated away mid-request, query
      // superseded) must never destroy the stored session — rethrow so the
      // router treats it as cancelled instead of "logged out".
      if (err instanceof Error && err.name === "AbortError") throw err;
      // Only a definitive 401 means "not authenticated": clear the token so
      // the /app beforeLoad guard redirects to login exactly once.
      if (err instanceof AuthenticationError) {
        removeAccessToken();
        return null;
      }
      // Transient failure (backend restarting, network blip, 5xx): fail
      // closed for this load but PRESERVE the token so the next attempt can
      // still use the silent-refresh flow instead of forcing a re-login.
      return null;
    }
  },

  async register(input: RegisterInput, { signal } = {}): Promise<{ challengeId: string }> {
    const result = await httpRequest<BackendRegistration>("/auth/register", {
      method: "POST",
      body: {
        email: input.email,
        password: input.password,
        fullName: input.displayName,
      },
      signal,
    });
    return { challengeId: result.challengeId };
  },

  async verifyOtp(input: VerifyOtpInput, { signal } = {}): Promise<Session> {
    const result = await httpRequest<BackendAuthSession>("/auth/verify-otp", {
      method: "POST",
      body: {
        challengeId: input.challengeId,
        code: input.code,
      },
      signal,
    });
    setAccessToken(result.accessToken);
    setCurrentSessionId(result.sessionId);
    return userToSession(result.user);
  },

  async login(input: LoginInput, { signal } = {}): Promise<Session> {
    const result = await httpRequest<BackendAuthSession>("/auth/login", {
      method: "POST",
      body: { email: input.email, password: input.password },
      signal,
    });
    setAccessToken(result.accessToken);
    setCurrentSessionId(result.sessionId);
    return userToSession(result.user);
  },

  async logout({ signal } = {}): Promise<void> {
    try {
      await httpRequest("/auth/logout", { method: "POST", signal });
    } finally {
      removeAccessToken();
    }
  },

  async submitEnrollment(
    samples: ReadonlyArray<EnrollmentSample>,
    { signal } = {},
  ): Promise<EnrollmentSummary> {
    // Transform frontend samples to backend enrollment request shape
    const keyboardSample = samples.find((s) => s.kind === "keystroke");
    const mouseSample = samples.find((s) => s.kind === "mouse");

    const result = await httpRequest<BackendEnrollmentReceipt>("/auth/enrollment", {
      method: "POST",
      body: {
        keyboard: keyboardSample
          ? {
              holdTimesMs: keyboardSample.features.slice(0, 5),
              flightTimesMs: keyboardSample.features.slice(5, 10),
              rhythmHash: deriveSignatureSeed(keyboardSample.capturedAt),
            }
          : { holdTimesMs: [], flightTimesMs: [], rhythmHash: "empty" },
        mouse: mouseSample
          ? {
              velocityProfile: mouseSample.features.slice(0, 5),
              curvatureProfile: mouseSample.features.slice(5, 10),
              jerkProfile: mouseSample.features.slice(10, 15),
            }
          : { velocityProfile: [], curvatureProfile: [], jerkProfile: [] },
        sessionMeta: {
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
      signal,
    });

    return {
      samplesAccepted: samples.filter((s) => s.features.length > 0).length,
      baselineQuality: result.confidence,
      signatureSeed: deriveSignatureSeed("enrollment"), // Not ideal — user ID would be better
    };
  },
};
