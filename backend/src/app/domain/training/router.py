from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.domain.training import service
from app.domain.training.schemas import (
    TrainingBatchRequest,
    TrainingBatchResponse,
    TrainingFeatureBatchRequest,
    TrainingFeatureBatchResponse,
    TrainingProgressResponse,
    TrainingSessionComplete,
    TrainingSessionCompleteResponse,
    TrainingSessionStart,
    TrainingSessionStartResponse,
)

router = APIRouter(prefix="/training", tags=["training"])


def _uid(current_user: dict[str, Any]) -> UUID:
    return UUID(current_user["sub"])


@router.post("/sessions/start", response_model=TrainingSessionStartResponse, status_code=201)
async def start_training_session(
    data: TrainingSessionStart,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.start_session(_uid(current_user), data)


@router.post("/sessions/complete", response_model=TrainingSessionCompleteResponse)
async def complete_training_session(
    data: TrainingSessionComplete,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.complete_session(_uid(current_user), data)


@router.post("/events/batch", response_model=TrainingBatchResponse, status_code=201)
async def store_training_events(
    data: TrainingBatchRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.store_batch(_uid(current_user), data)


@router.post("/features/batch", response_model=TrainingFeatureBatchResponse, status_code=201)
async def store_training_features(
    data: TrainingFeatureBatchRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.store_features(_uid(current_user), data)

@router.get("/progress", response_model=TrainingProgressResponse)
async def get_training_progress(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.get_progress(_uid(current_user))


@router.post("/profile/reset")
async def reset_profile(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.reset_user_profile(_uid(current_user))


@router.post("/profile/enroll")
async def enroll_profile(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.enroll_user_profile(_uid(current_user))