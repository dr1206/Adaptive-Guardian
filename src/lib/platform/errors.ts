/**
 * @adaptiveguard/errors — typed AppError hierarchy
 *
 * Every error thrown in our code MUST extend AppError. See ADR-0013.
 *
 * Wire format:
 *   { code: "identity.otp.expired", message: "Code expired.", details?: {...} }
 *
 * `cause` and `stack` NEVER leave the server.
 */

export interface AppErrorJson {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AppErrorOptions {
  code: string;
  status?: number;
  retryable?: boolean;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;
  readonly serverCause?: unknown;

  constructor(message: string, opts: AppErrorOptions) {
    super(message);
    this.name = new.target.name;
    this.code = opts.code;
    this.status = opts.status ?? 500;
    this.retryable = opts.retryable ?? false;
    this.details = opts.details;
    this.serverCause = opts.cause;
  }

  toJSON(): AppErrorJson {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, { code: "common.validation", status: 400, details });
  }
}

export class AuthenticationError extends AppError {
  constructor(code = "common.unauthenticated", message = "Authentication required.") {
    super(message, { code, status: 401 });
  }
}

export class AuthorizationError extends AppError {
  constructor(code = "common.forbidden", message = "You do not have access to this resource.") {
    super(message, { code, status: 403 });
  }
}

export class NotFoundError extends AppError {
  constructor(code = "common.not_found", message = "Resource not found.") {
    super(message, { code, status: 404 });
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message, { code, status: 409, details });
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds: number) {
    super("Too many requests. Slow down and retry.", {
      code: "common.rate_limited",
      status: 429,
      retryable: true,
      details: { retryAfterSeconds },
    });
  }
}

export class IntegrationError extends AppError {
  constructor(code: string, message: string, cause?: unknown) {
    super(message, { code, status: 502, retryable: true, cause });
  }
}

export class SecurityError extends AppError {
  /** SecurityError redacts the code from client responses. */
  constructor(internalCode: string, cause?: unknown) {
    super("Request denied.", {
      code: "common.security",
      status: 403,
      cause,
      details: { internalCode },
    });
  }
}

/** Map any thrown value to a safe wire response. */
export function toResponseJson(err: unknown): { status: number; body: AppErrorJson } {
  if (err instanceof AppError) {
    return { status: err.status, body: err.toJSON() };
  }
  return {
    status: 500,
    body: { code: "common.internal", message: "An unexpected error occurred." },
  };
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
