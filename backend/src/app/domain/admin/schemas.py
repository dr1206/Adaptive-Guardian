"""Admin platform schemas — camelCase serialization for frontend."""

from __future__ import annotations

from pydantic import BaseModel, Field

# ── KPIs ───────────────────────────────────────────────────────

class KpiCard(BaseModel):
    label: str
    value: str
    delta: str | None = None
    tone: str = "neutral"  # up, down, neutral, warn

class AdminKpiResponse(BaseModel):
    total_users: KpiCard = Field(serialization_alias="totalUsers")
    active_sessions: KpiCard = Field(serialization_alias="activeSessions")
    risk_events_today: KpiCard = Field(serialization_alias="riskEventsToday")
    blocked_attempts: KpiCard = Field(serialization_alias="blockedAttempts")
    mfa_challenges: KpiCard = Field(serialization_alias="mfaChallenges")
    avg_confidence: KpiCard = Field(serialization_alias="avgConfidence")


# ── Global Metrics ─────────────────────────────────────────────

class GlobalMetricItem(BaseModel):
    id: str
    label: str
    value: str
    delta: str
    signal: str
    series: list[float]


MetricSeries = GlobalMetricItem


class GlobalMetricsResponse(BaseModel):
    series: list[GlobalMetricItem]
    period: str  # 24h, 7d, 30d


# ── Sessions ───────────────────────────────────────────────────

class AdminSessionItem(BaseModel):
    session_id: str = Field(serialization_alias="sessionId")
    user_email: str = Field(serialization_alias="userEmail")
    user_name: str = Field(serialization_alias="userName")
    ip_address: str | None = Field(None, serialization_alias="ipAddress")
    device_label: str | None = Field(None, serialization_alias="deviceLabel")
    risk_score: float | None = Field(None, serialization_alias="riskScore")
    risk_verdict: str | None = Field(None, serialization_alias="riskVerdict")
    active_since: str = Field(serialization_alias="activeSince")
    last_active: str = Field(serialization_alias="lastActive")


class AdminSessionList(BaseModel):
    sessions: list[AdminSessionItem]
    total: int


# ── Users ──────────────────────────────────────────────────────

class AdminUserItem(BaseModel):
    id: str
    email: str
    full_name: str = Field(serialization_alias="fullName")
    roles: list[str]
    is_active: bool = Field(serialization_alias="isActive")
    is_verified: bool = Field(serialization_alias="isVerified")
    enrollment_status: str = Field(serialization_alias="enrollmentStatus")
    last_login: str | None = Field(None, serialization_alias="lastLogin")
    created_at: str = Field(serialization_alias="createdAt")
    risk_level: str = Field("low", serialization_alias="riskLevel")  # low, medium, high, critical


class AdminUserList(BaseModel):
    users: list[AdminUserItem]
    total: int


class AdminUserUpdateRequest(BaseModel):
    model_config = {"populate_by_name": True}
    roles: list[str] | None = None
    is_active: bool | None = Field(None, validation_alias="isActive")


# ── Incidents ──────────────────────────────────────────────────

class AdminIncidentItem(BaseModel):
    id: str
    severity: str  # info, warn, critical
    status: str  # open, investigating, resolved
    title: str
    detail: str
    user_email: str | None = Field(None, serialization_alias="userEmail")
    session_id: str | None = Field(None, serialization_alias="sessionId")
    created_at: str = Field(serialization_alias="createdAt")
    resolved_at: str | None = Field(None, serialization_alias="resolvedAt")


class AdminIncidentList(BaseModel):
    incidents: list[AdminIncidentItem]
    total: int
    open_count: int = Field(serialization_alias="openCount")


# ── Models (AI registry placeholder) ───────────────────────────

class ModelVersion(BaseModel):
    version: str
    status: str  # active, shadow, retired
    trained: str
    dataset: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    latency_ms: float = Field(serialization_alias="latencyMs")
    memory_mb: float = Field(serialization_alias="memoryMb")


class AdminModelItem(BaseModel):
    id: str
    name: str
    status: str  # deployed, training, offline
    trained: str
    dataset: str
    versions: list[ModelVersion] = []


# ── Datasets ───────────────────────────────────────────────────

class AdminDatasetItem(BaseModel):
    id: str
    version: str
    samples: int
    users: int
    sessions: int
    features: int
    quality: float
    duplicates: float
    coverage: float
    created: str
    status: str  # active, processing, archived


# ── API Services ───────────────────────────────────────────────

class LatencyStats(BaseModel):
    p50: float
    p95: float
    p99: float


class ServiceHealth(BaseModel):
    name: str
    status: str  # healthy, degraded, down
    latency: LatencyStats
    error_rate: float = Field(serialization_alias="errorRate")
    uptime: float
    series: list[float]


class ApiServicesResponse(BaseModel):
    services: list[ServiceHealth]
    overall: str  # healthy, degraded, down


class ComplianceControl(BaseModel):
    model_config = {"populate_by_name": True}

    id: str
    framework: str = ""
    coverage: float = 100.0
    status: str = "ok"  # ok, watch, alert, critical
    evidence: int = 0
    owner: str = ""
    next: str = ""  # next review date
    enabled: bool = True
    actions: list[str] = Field(default_factory=lambda: ["read", "review"])


SecurityControl = ComplianceControl


class ControlsResponse(BaseModel):
    controls: list[ComplianceControl]


class ControlUpdateRequest(BaseModel):
    model_config = {"populate_by_name": True}
    status: str | None = None
    evidence: int | None = None
    next: str | None = None
    enabled: bool | None = None


# ── Report Templates ───────────────────────────────────────────

class ReportTemplate(BaseModel):
    name: str
    cadence: str  # daily, weekly, monthly, quarterly
    last: str
    owner: str
    format: str  # pdf, csv, json


# ── Audit ──────────────────────────────────────────────────────

class AuditEntry(BaseModel):
    id: str
    actor: str
    action: str
    resource: str
    detail: str
    outcome: str = "success"
    ip_address: str | None = Field(None, serialization_alias="ipAddress")
    created_at: str = Field(serialization_alias="createdAt")


class AuditResponse(BaseModel):
    entries: list[AuditEntry]
    total: int


# ── Challenge Reasons ──────────────────────────────────────────

class ChallengeReason(BaseModel):
    reason: str
    count: int
    rate: float


# ── Challenges ─────────────────────────────────────────────────

class AdminChallengeItem(BaseModel):
    id: str
    when: str
    user: str
    reason: str
    confidence: float
    outcome: str  # passed, failed, pending
    duration: str
    device: str


class AdminChallengeList(BaseModel):
    challenges: list[AdminChallengeItem]
    total: int


# ── Roles ──────────────────────────────────────────────────────

class RoleDefinition(BaseModel):
    id: str
    label: str
    members: int = 0
    user_count: int = 0
    color: str = ""
    description: str = ""

    def model_post_init(self, __context: object) -> None:
        if self.user_count == 0 and self.members > 0:
            self.user_count = self.members
        elif self.members == 0 and self.user_count > 0:
            self.members = self.user_count


class AdminRoleList(BaseModel):
    roles: list[RoleDefinition]


# ── Permissions ────────────────────────────────────────────────

class PermissionItem(BaseModel):
    resource: str
    actions: list[str] = Field(default_factory=list)
    action: str = ""

    def model_post_init(self, __context: object) -> None:
        if not self.action and self.actions:
            self.action = self.actions[0]
        elif self.action and not self.actions:
            self.actions = [self.action]


class PermissionList(BaseModel):
    permissions: list[PermissionItem]


# ── Role Permissions ───────────────────────────────────────────

class RolePermissionMapping(BaseModel):
    role: str = ""
    role_id: str = ""
    permissions: list[str] = Field(default_factory=list)
    permission_ids: list[str] = Field(default_factory=list)

    def model_post_init(self, __context: object) -> None:
        if not self.role_id and self.role:
            self.role_id = self.role
        elif not self.role and self.role_id:
            self.role = self.role_id
        if not self.permission_ids and self.permissions:
            self.permission_ids = list(self.permissions)
        elif not self.permissions and self.permission_ids:
            self.permissions = list(self.permission_ids)


class RolePermissionsResponse(BaseModel):
    mappings: list[RolePermissionMapping]


# ── Notification Groups ────────────────────────────────────────

class NotificationGroup(BaseModel):
    id: str
    label: str
    count: int
    signal: str  # ok, watch, alert, critical


class NotificationGroupList(BaseModel):
    groups: list[NotificationGroup]


# ── Geo Dots ───────────────────────────────────────────────────

class GeoDot(BaseModel):
    model_config = {"populate_by_name": True}

    x: float = 0.0
    y: float = 0.0
    lat: float = 0.0
    lng: float = 0.0
    intensity: float = 1.0
    anomaly: bool = False

    def model_post_init(self, __context: object) -> None:
        if self.lat == 0.0 and self.lng == 0.0 and (self.x != 0.0 or self.y != 0.0):
            # map normalized x/y (0..1) to lat (-90..90) and lng (-180..180)
            self.lng = round((self.x - 0.5) * 360, 2)
            self.lat = round((0.5 - self.y) * 180, 2)
        elif (self.lat != 0.0 or self.lng != 0.0) and self.x == 0.0 and self.y == 0.0:
            self.x = round((self.lng + 180) / 360, 4)
            self.y = round((90 - self.lat) / 180, 4)


class GeoDotsResponse(BaseModel):
    dots: list[GeoDot]
    generated_at: str = Field(serialization_alias="generatedAt")


# ── Infra ──────────────────────────────────────────────────────

class InfraMetric(BaseModel):
    value: float
    series: list[float]


class InfraComponent(BaseModel):
    name: str = "primary"
    status: str = "healthy"  # healthy, degraded, down
    kind: str = "database"   # database, cache, queue, storage, compute


class InfraResponse(BaseModel):
    model_config = {"populate_by_name": True}

    cpu: InfraMetric
    memory: InfraMetric
    disk: InfraMetric
    gpu: InfraMetric
    network: InfraMetric
    containers: int
    workers: int
    inference_queue: int = Field(serialization_alias="inferenceQueue")
    jobs_running: int = Field(serialization_alias="jobsRunning")
    jobs_queued: int = Field(serialization_alias="jobsQueued")
    jobs_failed: int = Field(serialization_alias="jobsFailed")
    region: str = "us-east-1"
    components: list[InfraComponent] = Field(default_factory=lambda: [
        InfraComponent(name="mongodb-cluster", status="healthy", kind="database"),
        InfraComponent(name="redis-cache", status="healthy", kind="cache"),
        InfraComponent(name="inference-worker", status="healthy", kind="compute"),
    ])


# ── Admin Accounts ─────────────────────────────────────────────

class AdminAccountItem(BaseModel):
    id: str
    holder: str
    product: str  # Current, Savings, Treasury, Card, FX, Loan
    balance: float
    currency: str
    flags: str  # active, frozen, AML review
    opened: str


class AdminAccountList(BaseModel):
    accounts: list[AdminAccountItem]
    total: int


# ── Anomaly Signatures ─────────────────────────────────────────

class AnomalySignature(BaseModel):
    model_config = {"populate_by_name": True}

    id: str = ""
    name: str
    channel: str = "keystroke"
    threshold_sigma: float = Field(2.5, serialization_alias="thresholdSigma")
    description: str = ""
    trigger_count_24h: int = Field(0, serialization_alias="triggerCount24h")
    count: int = 0
    last: str = ""
    severity: str = "watch"  # ok, watch, alert, critical

    def model_post_init(self, __context: object) -> None:
        if self.count == 0 and self.trigger_count_24h > 0:
            self.count = self.trigger_count_24h
        elif self.trigger_count_24h == 0 and self.count > 0:
            self.trigger_count_24h = self.count


class AnomalySignatureList(BaseModel):
    signatures: list[AnomalySignature]
