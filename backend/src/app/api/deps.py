from __future__ import annotations

from typing import Any

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.shared.auth import decode_access_token
from app.shared.errors import AuthenticationError, AuthorizationError

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    if credentials is None:
        raise AuthenticationError("Missing authorization header")

    payload = decode_access_token(credentials.credentials)

    # Check blacklist
    jti = payload.get("jti")
    if jti:
        from app.db.redis import is_token_blacklisted
        if await is_token_blacklisted(jti):
            raise AuthenticationError("Token has been revoked")

    return payload


async def require_admin(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    roles: list[str] = current_user.get("roles", [])
    if "admin" not in roles:
        raise AuthorizationError("Admin role required")
    return current_user
