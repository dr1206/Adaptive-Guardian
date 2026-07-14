from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.domain.dashboard import service
from app.domain.dashboard.schemas import (
    AnalyticsResponse,
    DashboardSummary,
    NotificationFeed,
    TrendResponse,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _uid(current_user: dict[str, Any]) -> UUID:
    return UUID(current_user["sub"])


@router.get("/summary", response_model=DashboardSummary)
async def get_summary(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.get_summary(_uid(current_user))


@router.get("/trends", response_model=TrendResponse)
async def get_trends(
    period: str = Query("7d", pattern=r"^(7d|30d|90d)$"),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.get_trends(_uid(current_user), period=period)


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.get_analytics(_uid(current_user))


@router.get("/notifications", response_model=NotificationFeed)
async def get_notifications(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.get_notifications(_uid(current_user))
