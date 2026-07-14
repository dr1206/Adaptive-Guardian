from __future__ import annotations

from typing import Any

from jose import JWTError, jwt

from app.config import settings
from app.shared.errors import AuthenticationError


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != "access":
            raise AuthenticationError("Invalid token type")
        return payload
    except JWTError as exc:
        raise AuthenticationError("Invalid or expired token") from exc
