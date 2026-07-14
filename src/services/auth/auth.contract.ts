/**
 * Auth domain contract.
 * UI imports types from here, never from the mock or any HTTP impl.
 */

export interface Session {
  userId: string;
  email: string;
  displayName: string;
  tenantId: string;
  roles: ReadonlyArray<"user" | "admin" | "analyst">;
  /** ISO timestamp. */
  issuedAt: string;
  /** Behavioral signature seed (used to derive SignatureGlyph). */
  signatureSeed: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  acceptedTerms: boolean;
}

export interface VerifyOtpInput {
  challengeId: string;
  email: string;
  code: string;
}

export interface EnrollmentSample {
  kind: "keystroke" | "mouse";
  /** Opaque feature vector — the SDK aggregates raw events before this. */
  features: ReadonlyArray<number>;
  capturedAt: string;
}

export interface EnrollmentSummary {
  samplesAccepted: number;
  baselineQuality: number; // 0..1
  signatureSeed: string;
}

export interface AuthService {
  getSession(opts?: { signal?: AbortSignal }): Promise<Session | null>;
  register(input: RegisterInput, opts?: { signal?: AbortSignal }): Promise<{ challengeId: string }>;
  verifyOtp(input: VerifyOtpInput, opts?: { signal?: AbortSignal }): Promise<Session>;
  login(input: LoginInput, opts?: { signal?: AbortSignal }): Promise<Session>;
  logout(opts?: { signal?: AbortSignal }): Promise<void>;
  submitEnrollment(
    samples: ReadonlyArray<EnrollmentSample>,
    opts?: { signal?: AbortSignal },
  ): Promise<EnrollmentSummary>;
}
