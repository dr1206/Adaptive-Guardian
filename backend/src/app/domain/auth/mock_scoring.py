"""
Mock implementations of AI service interfaces.

These return deterministic scores so the frontend sees realistic data.
Replace with real ML implementations (LightGBM + One-Class SVM) later.
"""

from __future__ import annotations

import random
import uuid
from datetime import datetime

from app.domain.auth.interfaces import (
    EnrollmentService,
    RiskScore,
    RiskScoringService,
    ShapExplainer,
)


class MockRiskScoringService(RiskScoringService):
    """Returns a stable high-confidence score with slight variation."""

    async def calculate_risk(self, session_id: uuid.UUID) -> RiskScore:
        base_confidence = 0.92 + random.uniform(-0.06, 0.06)
        return RiskScore(
            session_id=session_id,
            confidence=round(base_confidence, 4),
            risk=round(1.0 - base_confidence, 4),
            verdict="allow" if base_confidence >= 0.85 else "challenge",
            top_factors=[
                {"name": "keystroke_rhythm", "contribution": 0.34},
                {"name": "mouse_trajectory", "contribution": 0.28},
                {"name": "typing_speed", "contribution": 0.18},
            ],
            evaluated_at=datetime.utcnow(),
        )

    async def get_trend(self, session_id: uuid.UUID, samples: int = 60) -> list[float]:
        base = 0.92
        return [round(base + random.uniform(-0.04, 0.04), 4) for _ in range(samples)]


class MockEnrollmentService(EnrollmentService):
    """Accepts enrollment samples and returns a baseline ID."""

    async def calibrate(self, user_id: uuid.UUID, samples: list[dict]) -> dict:
        return {
            "baseline_id": uuid.uuid4(),
            "samples_processed": len(samples),
            "confidence": 0.85,
            "status": "ready",
        }


class MockShapExplainer(ShapExplainer):
    """Returns placeholder SHAP explanations."""

    async def explain(self, decision_id: uuid.UUID) -> dict:
        return {
            "decision_id": str(decision_id),
            "base_value": 0.88,
            "features": [
                {"name": "keystroke_ht_mean", "value": 0.12, "contribution": 0.05},
                {"name": "mouse_speed", "value": 0.08, "contribution": -0.02},
                {"name": "flight_time_std", "value": 0.15, "contribution": 0.03},
            ],
        }


_risk_scorer: RiskScoringService | None = None
_enrollment: EnrollmentService | None = None
_explainer: ShapExplainer | None = None


def get_risk_scoring_service() -> RiskScoringService:
    global _risk_scorer
    if _risk_scorer is None:
        _risk_scorer = MockRiskScoringService()
    return _risk_scorer


def get_enrollment_service() -> EnrollmentService:
    global _enrollment
    if _enrollment is None:
        _enrollment = MockEnrollmentService()
    return _enrollment


def get_shap_explainer() -> ShapExplainer:
    global _explainer
    if _explainer is None:
        _explainer = MockShapExplainer()
    return _explainer
