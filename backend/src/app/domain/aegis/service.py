from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import logging
import math
import uuid

logger = logging.getLogger(__name__)

from app.domain.aegis.mock_data import (
    generate_aegis_devices,
    generate_decision_replays,
    generate_decisions,
    generate_device_profiles,
    generate_risk_events,
    generate_snapshot,
)
from app.domain.aegis.models import (
    BehavioralEvent,
    BehaviorWindow,
    Decision as DecisionDoc,
    DeviceProfile as DeviceProfileDoc,
)
from app.domain.aegis.schemas import (
    AegisDevice,
    AegisSnapshot,
    BatchEventsRequest,
    BatchEventsResponse,
    Decision as DecisionSchema,
    DecisionReplay,
    DeviceProfile as DeviceProfileSchema,
    RiskEvent,
    TopFeature,
)

# Canonical production window duration in seconds
BEHAVIOR_WINDOW_SECONDS: int = 30


def compute_window_id(
    user_id: uuid.UUID,
    session_id: uuid.UUID,
    window_start: datetime,
    window_end: datetime,
) -> str:
    """Deterministically compute unique window_id using SHA-256."""
    raw = f"{user_id}:{session_id}:{window_start.isoformat()}:{window_end.isoformat()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


async def get_snapshot(user_id: uuid.UUID) -> AegisSnapshot:
    # Read real decision history first to ensure authoritative score consistency
    try:
        latest_decision = (
            await DecisionDoc.find(DecisionDoc.user_id == user_id)
            .sort("-evaluated_at")
            .first_or_none()
        )
        if latest_decision:
            recent_decisions = (
                await DecisionDoc.find(DecisionDoc.user_id == user_id)
                .sort("-evaluated_at")
                .limit(60)
                .to_list()
            )
            scores = [d.score for d in reversed(recent_decisions)]
            trend = scores[-60:] if len(scores) >= 60 else ([0.5] * (60 - len(scores)) + scores)
            conf = float(latest_decision.score)
            risk = round(max(0.01, 1.0 - conf), 4)
            return AegisSnapshot(
                confidence=round(conf, 4),
                risk=risk,
                whisper=_format_whisper(conf),
                observedAt=latest_decision.evaluated_at.isoformat(),
                trend=trend[-60:],
            )

        # Fallback to behavior window averages
        recent = (
            await BehaviorWindow.find(BehaviorWindow.user_id == user_id)
            .sort("-created_at")
            .limit(60)
            .to_list()
        )
        if recent:
            confidences = [_compute_confidence(w.features) for w in recent if w.features]
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
    except Exception as e:
        logger.debug(f"Snapshot computation fallback: {e}")

    return AegisSnapshot(**generate_snapshot(user_id))


async def store_behavioral_batch(
    user_id: uuid.UUID,
    body: BatchEventsRequest,
) -> BatchEventsResponse:
    now = datetime.now(timezone.utc)
    device_id = body.device_id
    accepted_count = 0

    # Ensure ML models are loaded for live scoring
    try:
        from app.domain.security.ml_service import behavioral_ml_service
        if not behavioral_ml_service.loaded:
            behavioral_ml_service.load_models()
    except Exception as e:
        logger.debug(f"ML service auto-load note: {e}")

    for w in body.windows:
        window_start = datetime.fromtimestamp(w.windowStart / 1000, tz=timezone.utc)
        window_end = datetime.fromtimestamp(w.windowEnd / 1000, tz=timezone.utc)

        # Validate temporal consistency
        if window_start >= window_end:
            continue

        window_duration_ms = (window_end - window_start).total_seconds() * 1000
        if window_duration_ms < 100 or window_duration_ms > 300000:
            continue

        # Deterministic window ID & idempotency check
        win_id = w.windowId or compute_window_id(user_id, body.session_id, window_start, window_end)
        existing = await BehaviorWindow.find_one(BehaviorWindow.window_id == win_id)
        if existing is not None:
            # Idempotent skip: window already exists
            accepted_count += 1
            continue

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

        # Validate feature sanity
        valid = True
        for name, value in feature_vector.items():
            if isinstance(value, (int, float)):
                if math.isnan(value) or math.isinf(value):
                    valid = False
                    break
                if name in [
                    "dwellMeanMs", "dwellStdMs", "flightMeanMs", "flightStdMs",
                    "keysPerSec", "velocityMean", "velocityStd",
                    "accelerationStd", "clickCount",
                ] and value < 0:
                    valid = False
                    break
        if not valid:
            continue

        # 1. Persist canonical BehaviorWindow document
        bw = BehaviorWindow(
            window_id=win_id,
            user_id=user_id,
            session_id=body.session_id,
            device_id=device_id,
            window_start=window_start,
            window_end=window_end,
            features=feature_vector,
            created_at=now,
        )
        try:
            await bw.insert()
        except Exception as insert_err:
            # Duplicate key error handled cleanly for retries
            logger.debug(f"Window idempotency handled: {insert_err}")
            accepted_count += 1
            continue

        accepted_count += 1

        # 2. Score via authoritative ML pipeline & persist Decision
        try:
            from app.domain.security.ml_service import behavioral_ml_service
            uid_str = str(user_id)
            if behavioral_ml_service.loaded and uid_str in behavioral_ml_service.ocsvm_models:
                ml_res = behavioral_ml_service.predict(uid_str, feature_vector)
                lgbm_score = float(ml_res["lightgbm_score"])
                ocsvm_score = float(ml_res["ocsvm_anomaly_score"])
                fused_score = float(ml_res["fused_score"])
                outcome = str(ml_res["decision"]).lower()
                confidence = round(1.0 - fused_score, 4)
                risk_level = "low" if fused_score < 0.6 else ("medium" if fused_score < 0.85 else "critical")
            else:
                confidence = _compute_confidence(feature_vector)
                fused_score = round(1.0 - confidence, 4)
                outcome = "allow" if confidence >= 0.70 else "warn"
                risk_level = "low" if confidence >= 0.70 else "medium"
                lgbm_score = fused_score
                ocsvm_score = fused_score

            top_contributors = ml_res.get("top_contributors", []) if ("ml_res" in locals() and ml_res) else []

            decision_doc = DecisionDoc(
                decision_id=uuid.uuid4(),
                user_id=user_id,
                session_id=body.session_id,
                window_id=win_id,
                lightgbm_score=lgbm_score,
                ocsvm_score=ocsvm_score,
                fused_score=fused_score,
                outcome=outcome,
                risk_level=risk_level,
                score=confidence,
                top_contributors=top_contributors,
                evaluated_at=now,
            )
            await decision_doc.insert()

            # Adaptive Learning: update baseline statistics safely if genuine & high confidence
            if outcome.lower() == "allow" and confidence >= 0.85:
                try:
                    await behavioral_ml_service.update_profile_adaptive(
                        user_id=str(user_id),
                        features=feature_vector,
                        confidence=confidence,
                        outcome=outcome,
                    )
                except Exception as adapt_err:
                    logger.debug(f"Adaptive baseline update note: {adapt_err}")
        except Exception as ml_err:
            logger.warning(f"ML decision evaluation/persistence note for window {win_id}: {ml_err}")

    return BatchEventsResponse(accepted=accepted_count, status="ok")


async def list_decisions(user_id: uuid.UUID) -> list[DecisionSchema]:
    try:
        db_decisions = (
            await DecisionDoc.find(DecisionDoc.user_id == user_id)
            .sort("-evaluated_at")
            .limit(50)
            .to_list()
        )
        if db_decisions:
            return [
                DecisionSchema(
                    id=str(d.decision_id),
                    occurred_at=d.evaluated_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    action=d.outcome.lower() if d.outcome else "allow",
                    reason=f"Behavioral authentication verdict: {d.outcome.upper() if d.outcome else 'ALLOW'} (Risk score: {d.fused_score:.2f})",
                    top_features=[
                        TopFeature(
                            name=str(c.get("feature", "feature")),
                            contribution=float(c.get("shap_value", c.get("impact", 0.1))),
                        )
                        if isinstance(c, dict)
                        else TopFeature(name=str(c), contribution=0.1)
                        for c in (d.top_contributors or [])
                    ],
                )
                for d in db_decisions
            ]
    except Exception as e:
        logger.debug(f"list_decisions database read note: {e}")

    return [DecisionSchema(**d) for d in generate_decisions(user_id)]


async def list_aegis_devices(user_id: uuid.UUID) -> list[AegisDevice]:
    return [AegisDevice(**d) for d in generate_aegis_devices(user_id)]


async def list_risk_events(user_id: uuid.UUID) -> list[RiskEvent]:
    return [RiskEvent(**e) for e in generate_risk_events(user_id)]


async def list_device_profiles(user_id: uuid.UUID) -> list[DeviceProfileSchema]:
    try:
        profiles = await DeviceProfileDoc.find(DeviceProfileDoc.user_id == user_id).to_list()
        if profiles:
            return [
                DeviceProfileSchema(
                    id=str(p.id),
                    fingerprint=p.fingerprint,
                    label=p.label,
                    kind=p.kind,
                    os=p.os,
                    browser=p.browser,
                    trust=p.trust,
                    last_active=p.last_active.isoformat() if p.last_active else None,
                )
                for p in profiles
            ]
    except Exception as e:
        logger.debug(f"list_device_profiles database read note: {e}")

    return [DeviceProfileSchema(**p) for p in generate_device_profiles(user_id)]


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

