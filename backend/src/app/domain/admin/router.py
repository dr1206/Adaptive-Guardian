from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query

from app.api.deps import require_admin

logger = logging.getLogger("admin")
from app.domain.admin import service
from app.domain.admin.schemas import (
    AdminAccountList,
    AdminChallengeList,
    AdminDatasetItem,
    AdminIncidentList,
    AdminKpiResponse,
    AdminModelItem,
    AdminRoleList,
    AdminSessionList,
    AdminUserItem,
    AdminUserList,
    AdminUserUpdateRequest,
    AnomalySignatureList,
    ApiServicesResponse,
    AuditResponse,
    ChallengeReason,
    ComplianceControl,
    ControlsResponse,
    ControlUpdateRequest,
    GeoDotsResponse,
    GlobalMetricsResponse,
    InfraResponse,
    NotificationGroupList,
    PermissionList,
    ReportTemplate,
    RolePermissionsResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


# ── KPIs ───────────────────────────────────────────────────────


@router.get("/kpis", response_model=AdminKpiResponse)
async def list_kpis():
    try:
        return await service.get_kpis()
    except Exception:
        logger.exception("Failed to get KPIs")
        raise


# ── Global Metrics ─────────────────────────────────────────────


@router.get("/global-metrics", response_model=GlobalMetricsResponse)
async def list_global_metrics(
    period: str = Query("7d", pattern=r"^(24h|7d|30d)$"),
):
    return await service.get_global_metrics(period=period)


# ── Sessions ───────────────────────────────────────────────────


@router.get("/sessions", response_model=AdminSessionList)
async def list_sessions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    try:
        return await service.list_all_sessions(limit=limit, offset=offset)
    except Exception:
        logger.exception("Failed to list sessions")
        raise


# ── Users ──────────────────────────────────────────────────────


@router.get("/users", response_model=AdminUserList)
async def list_users(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    try:
        return await service.list_all_users(limit=limit, offset=offset)
    except Exception:
        logger.exception("Failed to list users")
        raise


@router.patch("/users/{user_id}", response_model=AdminUserItem)
async def update_user(user_id: str, data: AdminUserUpdateRequest):
    return await service.update_user(user_id, data)


# ── Incidents ──────────────────────────────────────────────────


@router.get("/incidents", response_model=AdminIncidentList)
async def list_incidents(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return await service.list_incidents(limit=limit, offset=offset)


# ── Models ─────────────────────────────────────────────────────


@router.get("/models", response_model=list[AdminModelItem])
async def list_models():
    return await service.list_models()


# ── Datasets ───────────────────────────────────────────────────


@router.get("/datasets", response_model=list[AdminDatasetItem])
async def list_datasets():
    return await service.list_datasets()


# ── API Services ───────────────────────────────────────────────


@router.get("/api-services", response_model=ApiServicesResponse)
async def list_api_services():
    return await service.get_api_services()


# ── Controls ───────────────────────────────────────────────────


@router.get("/controls", response_model=ControlsResponse)
async def list_controls():
    return await service.list_controls()


@router.patch("/controls/{control_id}", response_model=ComplianceControl)
async def update_control(control_id: str, data: ControlUpdateRequest):
    return await service.update_control(control_id, data)


# ── Report Templates ───────────────────────────────────────────


@router.get("/report-templates", response_model=list[ReportTemplate])
async def list_report_templates():
    return await service.list_report_templates()


# ── Audit ──────────────────────────────────────────────────────


@router.get("/audit", response_model=AuditResponse)
async def list_audit(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return await service.list_audit(limit=limit, offset=offset)


# ── Challenge Reasons ──────────────────────────────────────────


@router.get("/challenge-reasons", response_model=list[ChallengeReason])
async def list_challenge_reasons():
    return await service.list_challenge_reasons()


# ── Challenges ─────────────────────────────────────────────────


@router.get("/challenges", response_model=AdminChallengeList)
async def list_challenges(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return await service.list_challenges(limit=limit, offset=offset)


# ── Roles ──────────────────────────────────────────────────────


@router.get("/roles", response_model=AdminRoleList)
async def list_roles():
    return await service.list_roles()


# ── Permissions ────────────────────────────────────────────────


@router.get("/permissions", response_model=PermissionList)
async def list_permissions():
    return await service.list_permissions()


# ── Role Permissions ───────────────────────────────────────────


@router.get("/role-permissions", response_model=RolePermissionsResponse)
async def get_role_permissions():
    return await service.get_role_permissions()


# ── Notification Groups ────────────────────────────────────────


@router.get("/notification-groups", response_model=NotificationGroupList)
async def list_notification_groups():
    return await service.list_notification_groups()


# ── Geo Dots ───────────────────────────────────────────────────


@router.get("/geo-dots", response_model=GeoDotsResponse)
async def list_geo_dots():
    return await service.get_geo_dots()


# ── Infra ──────────────────────────────────────────────────────


@router.get("/infra", response_model=InfraResponse)
async def get_infra():
    return await service.get_infra()


# ── Admin Accounts ─────────────────────────────────────────────


@router.get("/accounts", response_model=AdminAccountList)
async def list_admin_accounts(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return await service.list_admin_accounts(limit=limit, offset=offset)


# ── Anomaly Signatures ─────────────────────────────────────────


@router.get("/anomaly-signatures", response_model=AnomalySignatureList)
async def list_anomaly_signatures():
    return await service.list_anomaly_signatures()
