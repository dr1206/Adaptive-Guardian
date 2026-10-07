from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.domain.security import service
from app.domain.security.ml_service import behavioral_ml_service
from app.domain.security.schemas import (
    BehavioralAuthenticationRequest,
    BehavioralAuthenticationResponse,
    DailySecurityReport,
    DeviceHealthResponse,
    LoginAnalytics,
    RiskEventFeed,
    SecurityOverview,
    SessionTimelineResponse,
)

router = APIRouter(prefix="/security", tags=["security"])


def _uid(current_user: dict[str, Any]) -> UUID:
    return UUID(current_user["sub"])


@router.get("/overview", response_model=SecurityOverview)
async def get_overview(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.get_overview(_uid(current_user))


@router.get("/session-timeline", response_model=SessionTimelineResponse)
async def get_session_timeline(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.get_session_timeline(
        _uid(current_user),
        limit=limit,
        offset=offset,
    )


@router.get("/reports/daily", response_model=DailySecurityReport)
async def get_daily_report(
    date: str | None = Query(
        None,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
    ),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.get_daily_report(
        _uid(current_user),
        date=date,
    )


@router.get("/risk-events", response_model=RiskEventFeed)
async def get_risk_events(
    severity: str | None = Query(
        None,
        pattern=r"^(info|warn|critical)$",
    ),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.get_risk_events(
        _uid(current_user),
        severity=severity,
        limit=limit,
        offset=offset,
    )


@router.get("/login-analytics", response_model=LoginAnalytics)
async def get_login_analytics(
    period_days: int = Query(
        30,
        ge=1,
        le=365,
        alias="periodDays",
    ),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.get_login_analytics(
        _uid(current_user),
        period_days=period_days,
    )


@router.get("/device-health", response_model=DeviceHealthResponse)
async def get_device_health(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.get_device_health(_uid(current_user))


# ── Behavioral ML Authentication ──────────────────────────────


@router.post(
    "/behavioral-authenticate",
    response_model=BehavioralAuthenticationResponse,
)
async def behavioral_authenticate(
    request: BehavioralAuthenticationRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Authenticate the current user using behavioral biometrics.
    """

    user_id = str(_uid(current_user))

    features = {
        "dwellMeanMs": request.dwell_mean_ms,
        "dwellStdMs": request.dwell_std_ms,
        "flightMeanMs": request.flight_mean_ms,
        "flightStdMs": request.flight_std_ms,
        "velocityMean": request.velocity_mean,
        "accelerationMean": request.acceleration_mean,
        "accelerationStd": request.acceleration_std,
        "curvatureMean": request.curvature_mean,
        "curvatureStd": request.curvature_std,
        "clickCount": request.click_count,
        "scrollAmount": request.scroll_amount,
        "mouseTravelPx": request.mouse_travel_px,
    }
    if request.keys_per_sec is not None:
        features["keysPerSec"] = request.keys_per_sec
    if request.velocity_std is not None:
        features["velocityStd"] = request.velocity_std

    result = behavioral_ml_service.predict(
        user_id=user_id,
        features=features,
    )

    return BehavioralAuthenticationResponse(**result)