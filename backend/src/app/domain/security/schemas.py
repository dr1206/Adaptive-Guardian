"""Security platform schemas — camelCase serialization for frontend."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# ── Overview ───────────────────────────────────────────────────


class SecurityOverview(BaseModel):
    active_sessions: int = Field(serialization_alias="activeSessions")
    trusted_devices: int = Field(serialization_alias="trustedDevices")
    flagged_events_24h: int = Field(serialization_alias="flaggedEvents24h")
    risk_trend: str = Field(
        serialization_alias="riskTrend"
    )  # improving, stable, degrading
    last_assessment_at: str = Field(serialization_alias="lastAssessmentAt")


# ── Session Timeline ──────────────────────────────────────────


class SessionTimelineEvent(BaseModel):
    session_id: str = Field(serialization_alias="sessionId")
    event: str  # login, logout, refresh, risk_snapshot
    ip_address: str | None = Field(None, serialization_alias="ipAddress")
    device_label: str | None = Field(None, serialization_alias="deviceLabel")
    location: str | None = None
    risk_score: float | None = Field(None, serialization_alias="riskScore")
    risk_verdict: str | None = Field(None, serialization_alias="riskVerdict")
    occurred_at: str = Field(serialization_alias="occurredAt")


class SessionTimelineResponse(BaseModel):
    events: list[SessionTimelineEvent]
    total: int


# ── Daily Security Report ──────────────────────────────────────


class ReportSummary(BaseModel):
    total_logins: int = Field(serialization_alias="totalLogins")
    failed_logins: int = Field(serialization_alias="failedLogins")
    new_devices: int = Field(serialization_alias="newDevices")
    challenges_issued: int = Field(serialization_alias="challengesIssued")
    blocked_attempts: int = Field(serialization_alias="blockedAttempts")


class ReportDevice(BaseModel):
    device_id: str = Field(serialization_alias="deviceId")
    label: str
    trust: str  # trusted, recognized, new
    last_active: str = Field(serialization_alias="lastActive")


class DailySecurityReport(BaseModel):
    date: str
    summary: ReportSummary
    active_devices: list[ReportDevice] = Field(
        serialization_alias="activeDevices"
    )
    risk_verdict: str = Field(serialization_alias="riskVerdict")
    generated_at: str = Field(serialization_alias="generatedAt")


# ── Risk Events (paginated) ────────────────────────────────────


class RiskEventItem(BaseModel):
    id: str
    severity: str  # info, warn, critical
    category: str  # device, location, behavior, session
    title: str
    detail: str
    session_id: str | None = Field(None, serialization_alias="sessionId")
    device_id: str | None = Field(None, serialization_alias="deviceId")
    occurred_at: str = Field(serialization_alias="occurredAt")
    dismissed: bool = False


class RiskEventFeed(BaseModel):
    events: list[RiskEventItem]
    total: int
    critical_count: int = Field(serialization_alias="criticalCount")


# ── Login Analytics ────────────────────────────────────────────


class HourlyBucket(BaseModel):
    hour: int  # 0-23
    count: int


class LocationBucket(BaseModel):
    location: str
    count: int
    risk: str  # low, medium, high


class LoginAnalytics(BaseModel):
    total_logins: int = Field(serialization_alias="totalLogins")
    unique_devices: int = Field(serialization_alias="uniqueDevices")
    unique_locations: int = Field(serialization_alias="uniqueLocations")
    hourly_distribution: list[HourlyBucket] = Field(
        serialization_alias="hourlyDistribution"
    )
    by_location: list[LocationBucket] = Field(serialization_alias="byLocation")
    period_days: int = Field(serialization_alias="periodDays")


# ── Device Health ──────────────────────────────────────────────


class DeviceHealthItem(BaseModel):
    device_id: str = Field(serialization_alias="deviceId")
    label: str
    trust_score: float = Field(serialization_alias="trustScore")
    session_count: int = Field(serialization_alias="sessionCount")
    last_active: str = Field(serialization_alias="lastActive")
    recommendation: str  # keep, review, revoke


class DeviceHealthResponse(BaseModel):
    devices: list[DeviceHealthItem]
    flagged: int


# ── Behavioral ML Authentication ──────────────────────────────


class BehavioralAuthenticationRequest(BaseModel):
    dwell_mean_ms: float = Field(serialization_alias="dwellMeanMs")
    dwell_std_ms: float = Field(serialization_alias="dwellStdMs")
    flight_mean_ms: float = Field(serialization_alias="flightMeanMs")
    flight_std_ms: float = Field(serialization_alias="flightStdMs")
    velocity_mean: float = Field(serialization_alias="velocityMean")
    acceleration_mean: float = Field(serialization_alias="accelerationMean")
    acceleration_std: float = Field(serialization_alias="accelerationStd")
    curvature_mean: float = Field(serialization_alias="curvatureMean")
    curvature_std: float = Field(serialization_alias="curvatureStd")
    click_count: float = Field(serialization_alias="clickCount")
    scroll_amount: float = Field(serialization_alias="scrollAmount")
    mouse_travel_px: float = Field(serialization_alias="mouseTravelPx")
    keys_per_sec: float | None = Field(None, serialization_alias="keysPerSec")
    velocity_std: float | None = Field(None, serialization_alias="velocityStd")


class BehavioralAuthenticationResponse(BaseModel):
    lightgbm_score: float = Field(serialization_alias="lightgbmScore")
    ocsvm_anomaly_score: float = Field(serialization_alias="ocsvmAnomalyScore")
    fused_score: float = Field(serialization_alias="fusedScore")
    decision: str