import { AuthenticationError, ValidationError } from "../../lib/platform/errors";
import { mockReject, mockResolve } from "../_transport/mock";
import type {
  AuthService,
  EnrollmentSample,
  EnrollmentSummary,
  LoginInput,
  RegisterInput,
  Session,
  VerifyOtpInput,
} from "./auth.contract";

const DEMO_SESSION: Session = {
  userId: "usr_demo_001",
  email: "alex@adaptiveguard.ai",
  displayName: "Alex Morgan",
  tenantId: "tnt_demo",
  roles: ["user"],
  issuedAt: new Date().toISOString(),
  signatureSeed: "ag-seed-3f8e1a",
};

let current: Session | null = null;

function seedFrom(email: string): string {
  let hash = 0;
  for (const ch of email) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return `ag-seed-${(hash >>> 0).toString(16).padStart(6, "0")}`;
}

export const mockAuthService: AuthService = {
  async getSession({ signal } = {}) {
    return mockResolve(current, { signal, latencyMs: [80, 160] });
  },

  async register(input: RegisterInput, { signal } = {}) {
    if (!input.email.includes("@")) {
      return mockReject(new ValidationError("Enter a valid email address."), { signal });
    }
    if (input.password.length < 8) {
      return mockReject(
        new ValidationError("Password must be at least 8 characters.", { field: "password" }),
        { signal },
      );
    }
    if (!input.acceptedTerms) {
      return mockReject(new ValidationError("You must accept the terms to continue."), { signal });
    }
    return mockResolve({ challengeId: `chl_${Date.now().toString(36)}` }, { signal });
  },

  async verifyOtp(input: VerifyOtpInput, { signal } = {}) {
    if (!/^\d{6}$/.test(input.code)) {
      return mockReject(
        new ValidationError("Enter the 6-digit code from your inbox.", { field: "code" }),
        { signal },
      );
    }
    if (input.code === "000000") {
      return mockReject(new AuthenticationError("identity.otp.expired", "That code expired."), {
        signal,
      });
    }
    const session: Session = {
      ...DEMO_SESSION,
      email: input.email,
      signatureSeed: seedFrom(input.email),
      issuedAt: new Date().toISOString(),
    };
    current = session;
    return mockResolve(session, { signal });
  },

  async login(input: LoginInput, { signal } = {}) {
    if (!input.email.includes("@") || input.password.length < 1) {
      return mockReject(new ValidationError("Email and password are required."), { signal });
    }
    const session: Session = {
      ...DEMO_SESSION,
      email: input.email,
      signatureSeed: seedFrom(input.email),
      issuedAt: new Date().toISOString(),
    };
    current = session;
    return mockResolve(session, { signal });
  },

  async logout({ signal } = {}) {
    current = null;
    return mockResolve(undefined, { signal, latencyMs: [60, 140] });
  },

  async submitEnrollment(samples: ReadonlyArray<EnrollmentSample>, { signal } = {}) {
    const accepted = samples.filter((s) => s.features.length > 0).length;
    const summary: EnrollmentSummary = {
      samplesAccepted: accepted,
      baselineQuality: Math.min(1, 0.62 + accepted * 0.03),
      signatureSeed: current?.signatureSeed ?? seedFrom("alex@adaptiveguard.ai"),
    };
    return mockResolve(summary, { signal, latencyMs: [320, 560] });
  },
};
