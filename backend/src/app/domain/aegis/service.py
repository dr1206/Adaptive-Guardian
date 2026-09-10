from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.domain.aegis.mock_data import (
    generate_aegis_devices,
    generate_decision_replays,
    generate_decisions,
    generate_device_profiles,
    generate_risk_events,
    generate_snapshot,
)
from app.domain.aegis.models import BehavioralEvent, BehaviorWindow
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


async def get_snapshot(user_id: uuid.UUID) -> AegisSnapshot:
    # Try real data first, fall back to mock
    try:
        recent = (
            await BehaviorWindow.find(
                BehaviorWindow.user_id == user_id
            )
            .sort("-created_at")
            .limit(60)
            .to_list()
        )
        if recent:
            confidences = [
                _compute_confidence(w.features) for w in recent if w.features
            ]
            confidences = [c for c in confidences if c > 0]
            if confidences:
                avg_conf = sum(confidences) / len(confidences)
                trend = confidences[-60:] if len(confidences) > 60 else ([0.5] * (60 - len(confidences)) + confidences)
                return AegisSnapshot(
                    confidence=round(avg_conf, 4),
                    risk=round(max(0.01, 1.0 - avg_conf), 4),
                    whisper=_format_whisper(avg_conf),
                    observedAt=datetime.now(timezone.utc).isoformat(),
                    trend=trend[-60:],
                )
    except Exception:
        pass

    return AegisSnapshot(**generate_snapshot(user_id))


async def store_behavioral_batch(
    user_id: uuid.UUID,
    body: BatchEventsRequest,
) -> BatchEventsResponse:
    now = datetime.now(timezone.utc)
    device_id = body.device_id
    docs: list[BehavioralEvent | BehaviorWindow] = []
    for w in body.windows:
        window_start = datetime.fromtimestamp(w.windowStart / 1000, tz=timezone.utc)
        window_end = datetime.fromtimestamp(w.windowEnd / 1000, tz=timezone.utc)

        # Validate temporal consistency
        if window_start >= window_end:
            continue  # Skip invalid window

        window_duration_ms = (window_end - window_start).total_seconds() * 1000
        # Validate reasonable duration bounds (100ms to 5 minutes)
        if window_duration_ms < 100 or window_duration_ms > 300000:
            continue  # Skip window with unreasonable duration

        feature_vector = {
            "dwellMeanMs": w.dwellMeanMs,
            "dwellStdMs": w.dwellStdMs,
            "flightMeanMs": w.flightMeanMs,
            "flightStdMs": w.flightStdMs,
            "keysPerSec": w.keysPerSec,
            "velocityMean": w.velocityMean,
            "velocityStd": w.velocityStd,
            "accelerationMean": w.accelerationMean,
            "accelerationStd": w.accelerationStd,
            "curvatureMean": w.curvatureMean,
            "curvatureStd": w.curvatureStd,
            "clickCount": w.clickCount,
            "scrollAmount": w.scrollAmount,
            "mouseTravelPx": w.mouseTravelPx,
        }

        # Validate feature values for NaN, infinity, and basic sanity
        import math
        for name, value in feature_vector.items():
            if isinstance(value, (int, float)):
                if math.isnan(value) or math.isinf(value):
                    # Skip window if any feature is NaN or infinity
                    break
                # Validate non-negative values where applicable
                if name in ["dwellMeanMs", "dwellStdMs", "flightMeanMs", "flightStdMs",
                          "keysPerSec", "velocityMean", "velocityStd",
                          "accelerationStd", "clickCount"]:
                    if value < 0:
                        # Skip window if any non-negative feature is negative
                        break
                # Special validations based on collector limits
                if name == "flightMeanMs" and value > 2000:
                    # Collector uses Math.min(2000, ...) for flight times
                    break
                if name == "accelerationStd" and value < 0:
                    # Standard deviation cannot be negative
                    break
                if name == "curvatureStd" and value < 0:
                    # Standard deviation cannot be negative
                    break
        else:
            # Only add the window if all validations passed (no break occurred)
            # Store as BehaviorWindow for ML training
            docs.append(
                BehaviorWindow(
                    user_id=user_id,
                    session_id=body.session_id,
                    device_id=device_id,
                    window_start=window_start,
                    window_end=window_end,
                    features=feature_vector,
                    created_at=now,
                )
            )

            # Store as BehavioralEvent for raw event tracking
            docs.append(
                BehavioralEvent(
                    user_id=user_id,
                    session_id=body.session_id,
                    device_id=device_id,
                    event_type="window_aggregate",
                    timestamp=now,
                    window_start=window_start,
                    window_end=window_end,
                    feature_vector=feature_vector,
                    device_info=w.deviceInfo.model_dump() if w.deviceInfo else None,
                    created_at=now,
                )
            )

    if docs:
        await BehaviorWindow.insert_many(
            [d for d in docs if isinstance(d, BehaviorWindow)]
        )
        await BehavioralEvent.insert_many(
            [d for d in docs if isinstance(d, BehavioralEvent)]
        )

    return BatchEventsResponse(accepted=len(body.windows), status="ok")


async def list_decisions(user_id: uuid.UUID) -> list[Decision]:
    return [Decision(**d) for d in generate_decisions(user_id)]


async def list_aegis_devices(user_id: uuid.UUID) -> list[AegisDevice]:
    return [AegisDevice(**d) for d in generate_aegis_devices(user_id)]


async def list_risk_events(user_id: uuid.UUID) -> list[RiskEvent]:
    return [RiskEvent(**e) for e in generate_risk_events(user_id)]


async def list_device_profiles(user_id: uuid.UUID) -> list[DeviceProfile]:
    return [DeviceProfile(**p) for p in generate_device_profiles(user_id)]


async def list_decision_replays(user_id: uuid.UUID) -> list[DecisionReplay]:
    return [DecisionReplay(**r) for r in generate_decision_replays(user_id)]


# ── Helpers ────────────────────────────────────────────────────────────────


def _compute_confidence(features: dict[str, float]) -> float:
    """Compute a provisional confidence score from feature windows.

    This is a heuristic placeholder until the ML models (LightGBM + OC-SVM)
    are trained on real data. Currently returns a value based on data density:
    more behavioral data = higher baseline confidence.
    """
    total = sum(abs(v) for v in features.values() if v)
    # Map feature density to confidence range 0.55-0.92
    # Dense behavioral windows with real activity score higher
    score = min(0.92, 0.55 + (total / 5000.0) * 0.37)
    return round(score, 4)


def _format_whisper(confidence: float) -> str:
    if confidence >= 0.85:
        return "Behavior matches your signature."
    elif confidence >= 0.70:
        return "Collecting behavioral baseline."
    elif confidence >= 0.55:
        return "Learning your patterns."
    else:
        return "Insufficient data for profile."

