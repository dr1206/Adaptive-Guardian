from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.domain.training.models import TrainingEvent, TrainingFeature, TrainingSession
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


async def start_session(
    user_id: uuid.UUID,
    data: TrainingSessionStart,
) -> TrainingSessionStartResponse:
    session = TrainingSession(
        user_id=user_id,
        device_id=data.device_id,
        task_type=data.task_type,
        status="in_progress",
        metadata=data.metadata,
    )
    await session.insert()
    return TrainingSessionStartResponse(
        session_id=str(session.session_id),
        status="started",
    )


async def complete_session(
    user_id: uuid.UUID,
    data: TrainingSessionComplete,
) -> TrainingSessionCompleteResponse:
    session = await TrainingSession.find_one(
        TrainingSession.session_id == uuid.UUID(data.session_id),
        TrainingSession.user_id == user_id,
    )
    if not session:
        # Create a fallback record if the session wasn't started via API
        session = TrainingSession(
            user_id=user_id,
            session_id=uuid.UUID(data.session_id),
            device_id=data.device_id,
            task_type=data.task_type,
            status="completed",
            sample_count=data.sample_count,
            completed_at=datetime.now(timezone.utc),
            metadata=data.metadata,
        )
        await session.insert()
    else:
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)
        session.sample_count = data.sample_count
        session.metadata = data.metadata
        await session.save()

    return TrainingSessionCompleteResponse(
        session_id=data.session_id,
        status="completed",
        sample_count=data.sample_count,
    )


async def store_batch(
    user_id: uuid.UUID,
    data: TrainingBatchRequest,
) -> TrainingBatchResponse:
    now = datetime.now(timezone.utc)
    docs: list[TrainingEvent] = []

    for ev in data.events:
        docs.append(
            TrainingEvent(
                user_id=user_id,
                session_id=uuid.UUID(data.session_id),
                task_type=data.task_type,
                event_type=ev.event_type,
                timestamp=datetime.fromtimestamp(ev.timestamp / 1000, tz=timezone.utc),
                device_id=ev.device_id or data.device_id,
                page=ev.page or data.page,
                key_code=ev.key_code,
                key_char=ev.key_char,
                dwell_time_ms=ev.dwell_time_ms,
                flight_time_ms=ev.flight_time_ms,
                x=ev.x,
                y=ev.y,
                target_id=ev.target_id,
                target_size=ev.target_size,
                click_duration_ms=ev.click_duration_ms,
                delta_y=ev.delta_y,
                task_index=ev.task_index,
                trial_index=ev.trial_index,
                text_length=ev.text_length,
                backspace_count=ev.backspace_count,
                correction_count=ev.correction_count,
                total_duration_ms=ev.total_duration_ms,
                pause_duration_ms=ev.pause_duration_ms,
                metadata=ev.metadata,
                created_at=now,
            )
        )

    if docs:
        await TrainingEvent.insert_many(docs)

    # Update session sample count
    session = await TrainingSession.find_one(
        TrainingSession.session_id == uuid.UUID(data.session_id),
        TrainingSession.user_id == user_id,
    )
    if session:
        session.sample_count += len(docs)
        await session.save()

    return TrainingBatchResponse(accepted=len(docs), status="ok")


async def store_features(
    user_id: uuid.UUID,
    data: TrainingFeatureBatchRequest,
) -> TrainingFeatureBatchResponse:
    now = datetime.now(timezone.utc)
    docs: list[TrainingFeature] = []

    for f in data.features:
        docs.append(
            TrainingFeature(
                user_id=user_id,
                session_id=uuid.UUID(f.session_id),
                task_type=f.task_type,
                task_index=f.task_index,
                trial_index=f.trial_index,
                device_id=f.device_id,
                created_at=now,
                typing_speed=f.typing_speed,
                mean_key_hold=f.mean_key_hold,
                std_key_hold=f.std_key_hold,
                mean_flight_time=f.mean_flight_time,
                std_flight_time=f.std_flight_time,
                backspace_rate=f.backspace_rate,
                correction_rate=f.correction_rate,
                pause_mean=f.pause_mean,
                pause_std=f.pause_std,
                total_duration_ms=f.total_duration_ms,
                mouse_speed_mean=f.mouse_speed_mean,
                mouse_speed_std=f.mouse_speed_std,
                mouse_acceleration=f.mouse_acceleration,
                click_interval_mean=f.click_interval_mean,
                scroll_speed=f.scroll_speed,
                trajectory_length=f.trajectory_length,
                direction_changes=f.direction_changes,
                target_acquisition_mean=f.target_acquisition_mean,
                feature_vector=f.feature_vector,
            )
        )

    if docs:
        await TrainingFeature.insert_many(docs)

    return TrainingFeatureBatchResponse(accepted=len(docs), status="ok")


async def get_progress(user_id: uuid.UUID) -> TrainingProgressResponse:
    """Return non-technical training progress for the participant UI."""
    total_sessions = await TrainingSession.find(
        TrainingSession.user_id == user_id,
        TrainingSession.status == "completed",
    ).count()

    total_features = await TrainingFeature.find(
        TrainingFeature.user_id == user_id,
    ).count()

    # Determine status based on collected samples
    if total_features == 0:
        status = "NOT_TRAINED"
        message = "Complete the security setup to personalize your profile."
    elif total_features < 10:
        status = "TRAINING"
        message = "Your security profile is being built. Keep using the app normally."
    else:
        status = "BASELINE_READY"
        message = "Your security profile is ready. You're fully protected."

    return TrainingProgressResponse(
        status=status,
        tasks_completed=total_sessions,
        total_tasks=4,
        samples_collected=total_features,
        message=message,
    )