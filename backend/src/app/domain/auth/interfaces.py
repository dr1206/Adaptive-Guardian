"""
AI integration interfaces.

These abstract service contracts define the boundary between the fintech
platform and the future behavioral authentication engine. Each interface
has a mock implementation used during Sprint 1-4. Replace the mock with
the real implementation (LightGBM + One-Class SVM) when the AI module is
ready — no other code needs to change.
"""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class RiskScore:
    session_id: uuid.UUID
    confidence: float
    risk: float
    verdict: str  # allow, challenge, step_up, block
    top_factors: list[dict] = field(default_factory=list)
    evaluated_at: datetime = field(default_factory=datetime.utcnow)


class RiskScoringService(ABC):
    """Calculate authentication risk for an active session."""

    @abstractmethod
    async def calculate_risk(self, session_id: uuid.UUID) -> RiskScore:
        ...

    @abstractmethod
    async def get_trend(self, session_id: uuid.UUID, samples: int = 60) -> list[float]:
        ...


class EnrollmentService(ABC):
    """Process behavioral enrollment samples and build a baseline profile."""

    @abstractmethod
    async def calibrate(self, user_id: uuid.UUID, samples: list[dict]) -> dict:
        ...


class ShapExplainer(ABC):
    """Generate human-readable explanations for authentication decisions."""

    @abstractmethod
    async def explain(self, decision_id: uuid.UUID) -> dict:
        ...
