from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.domain.aegis import service
from app.domain.aegis.schemas import (
    AegisDevice,
    AegisSnapshot,
    BatchEventsRequest,
    BatchEventsResponse,
    Decision,
    DecisionReplay,
    DeviceProfile,
    RiskEvent,
)

router = APIRouter(prefix="/aegis", tags=["aegis"])


def _uid(current_user: dict[str, Any]) -> UUID:
    return UUID(current_user["sub"])


@router.get("/snapshot", response_model=AegisSnapshot)
async def get_snapshot(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.get_snapshot(_uid(current_user))


@router.get("/decisions", response_model=list[Decision])
async def list_decisions(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_decisions(_uid(current_user))


@router.get("/decisions/replays", response_model=list[DecisionReplay])
async def list_decision_replays(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_decision_replays(_uid(current_user))


@router.get("/devices", response_model=list[AegisDevice])
async def list_aegis_devices(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_aegis_devices(_uid(current_user))


@router.get("/device-profiles", response_model=list[DeviceProfile])
async def list_device_profiles(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_device_profiles(_uid(current_user))


@router.get("/risk-events", response_model=list[RiskEvent])
async def list_risk_events(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_risk_events(_uid(current_user))


# ── Behavioral data ingestion (shared with behavioral collector) ──────────

events_router = APIRouter(prefix="/events", tags=["events"])


@events_router.post("/batch", response_model=BatchEventsResponse, status_code=201)
async def ingest_batch(
    body: BatchEventsRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.store_behavioral_batch(_uid(current_user), body)


@events_router.post("/beacon", status_code=202)
async def beacon_ingest(
    body: BatchEventsRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Fire-and-forget endpoint for beforeunload sendBeacon calls."""
    await service.store_behavioral_batch(_uid(current_user), body)
    return {"status": "ok"}
