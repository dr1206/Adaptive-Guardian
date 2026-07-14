from __future__ import annotations

from typing import Any


class AppError(Exception):
    code: str = "INTERNAL_ERROR"
    status: int = 500
    retryable: bool = False

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        self.message = message
        self.details = details or {}

    def to_response(self) -> dict[str, Any]:
        return {"code": self.code, "message": self.message, "details": self.details}


class ValidationError(AppError):
    code = "VALIDATION"
    status = 400


class AuthenticationError(AppError):
    code = "AUTHENTICATION"
    status = 401


class AuthorizationError(AppError):
    code = "AUTHORIZATION"
    status = 403


class NotFoundError(AppError):
    code = "NOT_FOUND"
    status = 404


class ConflictError(AppError):
    code = "CONFLICT"
    status = 409


class RateLimitError(AppError):
    code = "RATE_LIMIT"
    status = 429
    retryable = True


class IntegrationError(AppError):
    code = "INTEGRATION"
    status = 502
    retryable = True


class SecurityError(AppError):
    code = "SECURITY"
    status = 403
