from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.domain.notifications import service
from app.domain.notifications.schemas import (
    NotificationInbox,
    NotificationPreferences,
    PreferenceUpdateRequest,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _uid(current_user: dict[str, Any]) -> UUID:
    return UUID(current_user["sub"])


@router.get("/inbox", response_model=NotificationInbox)
async def get_inbox(
    unread_only: bool = Query(False, alias="unreadOnly"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.get_inbox(_uid(current_user), limit=limit, offset=offset, unread_only=unread_only)


@router.post("/read/{notification_id}", status_code=204)
async def mark_read(
    notification_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    await service.mark_read(_uid(current_user), notification_id)


@router.post("/read-all", status_code=204)
async def mark_all_read(current_user: dict[str, Any] = Depends(get_current_user)):
    await service.mark_all_read(_uid(current_user))


@router.get("/preferences", response_model=NotificationPreferences)
async def get_preferences(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.get_preferences(_uid(current_user))


@router.put("/preferences", response_model=NotificationPreferences)
async def update_preferences(
    data: PreferenceUpdateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.update_preferences(_uid(current_user), data)
