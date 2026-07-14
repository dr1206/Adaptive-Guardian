from __future__ import annotations

from pydantic import BaseModel, Field


class DeviceInfoSchema(BaseModel):
    userAgent: str = ""
    viewport: str = ""
    platform: str = ""
    timezone: str = ""


class FeatureWindow(BaseModel):
    session_id: str = Field(serialization_alias="sessionId")
    window_start: str = Field(serialization_alias="windowStart")
    window_end: str = Field(serialization_alias="windowEnd")
    features: dict[str, float]


class BehavioralWindow(BaseModel):
    """Schema matching the frontend BehavioralCollector's FeatureWindow shape."""
    windowStart: float
    windowEnd: float
    dwellMeanMs: float
    dwellStdMs: float
    flightMeanMs: float
    flightStdMs: float
    keysPerSec: float
    velocityMean: float
    velocityStd: float
    accelerationMean: float
    accelerationStd: float
    curvatureMean: float
    curvatureStd: float
    clickCount: int
    scrollAmount: float
    mouseTravelPx: float
    deviceInfo: DeviceInfoSchema | None = None


class BatchEventsRequest(BaseModel):
    windows: list[BehavioralWindow]


class BatchEventsResponse(BaseModel):
    accepted: int
    status: str


class ScoreResult(BaseModel):
    window_id: str = Field(serialization_alias="windowId")
    verdict: str
    fused_score: float = Field(ge=0, le=1, serialization_alias="fusedScore")
    lightgbm_score: float = Field(ge=0, le=1, serialization_alias="lightgbmScore")
    ocsvm_score: float = Field(ge=0, le=1, serialization_alias="ocsvmScore")
    challenge_id: str | None = Field(None, serialization_alias="challengeId")
    evaluated_at: str = Field(serialization_alias="evaluatedAt")


# ── Frontend AegisService contract ────────────────────────────


class AegisSnapshot(BaseModel):
    confidence: float
    risk: float
    whisper: str
    observed_at: str = Field(serialization_alias="observedAt")
    trend: list[float]


class TopFeature(BaseModel):
    name: str
    contribution: float


class Decision(BaseModel):
    id: str
    occurred_at: str = Field(serialization_alias="occurredAt")
    action: str  # allow, challenge, step_up, deny
    reason: str
    top_features: list[TopFeature] = Field(serialization_alias="topFeatures")


class AegisDevice(BaseModel):
    id: str
    label: str
    os: str
    trust: str  # trusted, recognized, new
    last_seen_at: str = Field(serialization_alias="lastSeenAt")
    city: str


class RiskEvent(BaseModel):
    id: str
    occurred_at: str = Field(serialization_alias="occurredAt")
    severity: str  # info, warn, critical
    summary: str


class DeviceProfile(BaseModel):
    id: str
    name: str
    kind: str  # laptop, phone, tablet, desktop
    os: str
    browser: str
    location: str
    last_active: str = Field(serialization_alias="lastActive")
    confidence: float
    trust: float
    primary: bool | None = None


class DecisionPetal(BaseModel):
    label: str
    weight: float
    sentence: str


class DecisionReplay(BaseModel):
    id: str
    time: str
    title: str
    outcome: str
    confidence: float
    petals: list[DecisionPetal]
