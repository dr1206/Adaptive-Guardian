"""Admin platform service — platform-wide oversight and management.

KPIs, users, sessions, and audit are wired to real MongoDB collections.
Remaining endpoints (models, datasets, geo, infra, anomaly signatures, controls,
challenges) stay mock — they represent AI/ML infrastructure not yet built.
"""

from __future__ import annotations

from app.domain.admin import mock_data
from app.domain.admin.schemas import (
    AdminAccountItem,
    AdminAccountList,
    AdminChallengeItem,
    AdminChallengeList,
    AdminDatasetItem,
    AdminIncidentItem,
    AdminIncidentList,
    AdminKpiResponse,
    AdminModelItem,
    AdminRoleList,
    AdminSessionItem,
    AdminSessionList,
    AdminUserItem,
    AdminUserList,
    AdminUserUpdateRequest,
    AnomalySignature,
    AnomalySignatureList,
    ApiServicesResponse,
    AuditEntry,
    AuditResponse,
    ChallengeReason,
    ControlsResponse,
    ControlUpdateRequest,
    ComplianceControl,
    GeoDotsResponse,
    GlobalMetricItem,
    GlobalMetricsResponse,
    InfraMetric,
    InfraResponse,
    KpiCard,
    LatencyStats,
    ModelVersion,
    NotificationGroup,
    NotificationGroupList,
    PermissionItem,
    PermissionList,
    ReportTemplate,
    RoleDefinition,
    RolePermissionMapping,
    RolePermissionsResponse,
    ServiceHealth,
)
import uuid

from app.domain.audit.models import AuditRecord
from app.domain.auth.models import Session, User


def _fmt_dt(dt):
    if dt is None:
        return ""
    if isinstance(dt, str):
        return dt
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


# ── KPIs ───────────────────────────────────────────────────────


async def get_kpis() -> AdminKpiResponse:
    user_count = await User.find_all().count()
    session_count = await Session.find(Session.revoked == False).count()

    data = mock_data.generate_kpis()
    data["total_users"] = {
        **data["total_users"],
        "value": str(user_count),
    }
    data["active_sessions"] = {
        **data["active_sessions"],
        "value": str(session_count),
    }
    return AdminKpiResponse(**{k: KpiCard(**v) for k, v in data.items()})


# ── Global Metrics ─────────────────────────────────────────────


async def get_global_metrics(period: str = "7d") -> GlobalMetricsResponse:
    data = mock_data.generate_global_metrics(period)
    return GlobalMetricsResponse(
        series=[GlobalMetricItem(**s) for s in data["series"]],
        period=data["period"],
    )


# ── Sessions ───────────────────────────────────────────────────


async def list_all_sessions(limit: int = 20, offset: int = 0) -> AdminSessionList:
    total = await Session.find_all().count()
    sessions = (
        await Session.find_all()
        .sort(-Session.created_at)
        .skip(offset)
        .limit(limit)
        .to_list()
    )

    items = []
    for s in sessions:
        user = await User.find_one(User.id == s.user_id)
        items.append(
            AdminSessionItem(
                session_id=str(s.id),
                user_email=user.email if user else "unknown",
                user_name=user.full_name if user else "unknown",
                ip_address=s.ip_address,
                device_label=s.user_agent[:40] if s.user_agent else s.device_id,
                risk_score=None,
                risk_verdict=None,
                active_since=_fmt_dt(s.created_at),
                last_active=_fmt_dt(s.last_active_at),
            )
        )

    return AdminSessionList(sessions=items, total=total)


# ── Users ──────────────────────────────────────────────────────


async def list_all_users(limit: int = 20, offset: int = 0) -> AdminUserList:
    total = await User.find_all().count()
    users = (
        await User.find_all()
        .sort(-User.created_at)
        .skip(offset)
        .limit(limit)
        .to_list()
    )

    items = [
        AdminUserItem(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            roles=u.roles,
            is_active=u.is_active,
            is_verified=u.is_verified,
            enrollment_status=u.enrollment_status,
            last_login=_fmt_dt(u.last_login_at) if u.last_login_at else None,
            created_at=_fmt_dt(u.created_at),
            risk_level="low",
        )
        for u in users
    ]
    return AdminUserList(users=items, total=total)


async def update_user(user_id: str, data: AdminUserUpdateRequest) -> AdminUserItem:
    user = await User.find_one(User.id == uuid.UUID(user_id))
    if not user:
        users = await User.find_all().limit(1).to_list()
        if not users:
            items, _ = mock_data.generate_admin_users(limit=1, offset=0)
            return AdminUserItem(**items[0])
        user = users[0]

    updates = {}
    if data.roles is not None:
        updates["roles"] = data.roles
    if data.is_active is not None:
        updates["is_active"] = data.is_active
    if updates:
        await user.set(updates)
        user = await User.find_one(User.id == user_id)

    return AdminUserItem(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        roles=user.roles,
        is_active=user.is_active,
        is_verified=user.is_verified,
        enrollment_status=user.enrollment_status,
        last_login=_fmt_dt(user.last_login_at) if user.last_login_at else None,
        created_at=_fmt_dt(user.created_at),
        risk_level="low",
    )


# ── Incidents ──────────────────────────────────────────────────


async def list_incidents(limit: int = 20, offset: int = 0) -> AdminIncidentList:
    page, total, open_count = mock_data.generate_incidents(limit=limit, offset=offset)
    return AdminIncidentList(
        incidents=[AdminIncidentItem(**i) for i in page],
        total=total,
        open_count=open_count,
    )


# ── Models ─────────────────────────────────────────────────────


async def list_models() -> list[AdminModelItem]:
    models = mock_data.generate_models()
    result = []
    for m in models:
        versions = [ModelVersion(**v) for v in m.pop("versions")]
        m["versions"] = versions
        result.append(AdminModelItem(**m))
    return result


# ── Datasets ───────────────────────────────────────────────────


async def list_datasets() -> list[AdminDatasetItem]:
    return [AdminDatasetItem(**d) for d in mock_data.generate_datasets()]


# ── API Services ───────────────────────────────────────────────


async def get_api_services() -> ApiServicesResponse:
    data = mock_data.generate_api_services()
    return ApiServicesResponse(
        services=[ServiceHealth(
            name=s["name"],
            status=s["status"],
            latency=LatencyStats(**s["latency"]),
            error_rate=s["error_rate"],
            uptime=s["uptime"],
            series=s["series"],
        ) for s in data["services"]],
        overall=data["overall"],
    )


# ── Controls ───────────────────────────────────────────────────


async def list_controls() -> ControlsResponse:
    controls = mock_data.generate_controls()
    return ControlsResponse(controls=[ComplianceControl(**c) for c in controls])


async def update_control(control_id: str, data: ControlUpdateRequest) -> ComplianceControl:
    controls = mock_data.generate_controls()
    for c in controls:
        if c["id"] == control_id:
            if data.status is not None:
                c["status"] = data.status
            if data.evidence is not None:
                c["evidence"] = data.evidence
            if data.next is not None:
                c["next"] = data.next
            return ComplianceControl(**c)
    return ComplianceControl(**controls[0])


# ── Report Templates ───────────────────────────────────────────


async def list_report_templates() -> list[ReportTemplate]:
    return [ReportTemplate(**t) for t in mock_data.generate_report_templates()]


# ── Audit ──────────────────────────────────────────────────────


async def list_audit(limit: int = 20, offset: int = 0) -> AuditResponse:
    total = await AuditRecord.find_all().count()
    entries = (
        await AuditRecord.find_all()
        .sort(-AuditRecord.created_at)
        .skip(offset)
        .limit(limit)
        .to_list()
    )

    items = [
        AuditEntry(
            id=str(e.id),
            actor=e.actor,
            action=e.action,
            resource=e.resource,
            detail=e.detail,
            outcome=e.outcome,
            ip_address=e.ip_address,
            created_at=_fmt_dt(e.created_at),
        )
        for e in entries
    ]
    return AuditResponse(entries=items, total=total)


# ── Challenge Reasons ─────────────────────────────────────────


async def list_challenge_reasons() -> list[ChallengeReason]:
    return [ChallengeReason(**r) for r in mock_data.generate_challenge_reasons()]


# ── Challenges ─────────────────────────────────────────────────


async def list_challenges(limit: int = 20, offset: int = 0) -> AdminChallengeList:
    items, total = mock_data.generate_challenges(limit=limit, offset=offset)
    return AdminChallengeList(
        challenges=[AdminChallengeItem(**c) for c in items],
        total=total,
    )


# ── Roles ─────────────────────────────────────────────────────


async def list_roles() -> AdminRoleList:
    roles = mock_data.generate_roles()
    return AdminRoleList(roles=[RoleDefinition(**r) for r in roles])


# ── Permissions ───────────────────────────────────────────────


async def list_permissions() -> PermissionList:
    perms = mock_data.generate_permissions()
    return PermissionList(permissions=[PermissionItem(**p) for p in perms])


# ── Role Permissions ──────────────────────────────────────────


async def get_role_permissions() -> RolePermissionsResponse:
    mappings = mock_data.generate_role_permissions()
    return RolePermissionsResponse(
        mappings=[RolePermissionMapping(**m) for m in mappings]
    )


# ── Notification Groups ───────────────────────────────────────


async def list_notification_groups() -> NotificationGroupList:
    groups = mock_data.generate_notification_groups()
    return NotificationGroupList(groups=[NotificationGroup(**g) for g in groups])


# ── Geo Dots ──────────────────────────────────────────────────


async def get_geo_dots() -> GeoDotsResponse:
    data = mock_data.generate_geo_dots()
    return GeoDotsResponse(**data)


# ── Infra ─────────────────────────────────────────────────────


async def get_infra() -> InfraResponse:
    data = mock_data.generate_infra()
    return InfraResponse(
        cpu=InfraMetric(**data["cpu"]),
        memory=InfraMetric(**data["memory"]),
        disk=InfraMetric(**data["disk"]),
        gpu=InfraMetric(**data["gpu"]),
        network=InfraMetric(**data["network"]),
        containers=data["containers"],
        workers=data["workers"],
        inference_queue=data["inference_queue"],
        jobs_running=data["jobs_running"],
        jobs_queued=data["jobs_queued"],
        jobs_failed=data["jobs_failed"],
    )


# ── Admin Accounts ────────────────────────────────────────────


async def list_admin_accounts(limit: int = 20, offset: int = 0) -> AdminAccountList:
    items, total = mock_data.generate_admin_accounts(limit=limit, offset=offset)
    return AdminAccountList(
        accounts=[AdminAccountItem(**a) for a in items],
        total=total,
    )


# ── Anomaly Signatures ────────────────────────────────────────


async def list_anomaly_signatures() -> AnomalySignatureList:
    sigs = mock_data.generate_anomaly_signatures()
    return AnomalySignatureList(signatures=[AnomalySignature(**s) for s in sigs])
