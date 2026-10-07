"""Unit tests for the Admin Platform domain."""

from __future__ import annotations

from unittest import mock

import pytest

from app.domain.admin.mock_data import (
    generate_admin_sessions,
    generate_admin_users,
    generate_anomaly_signatures,
    generate_api_services,
    generate_audit_log,
    generate_challenge_reasons,
    generate_controls,
    generate_datasets,
    generate_geo_dots,
    generate_global_metrics,
    generate_incidents,
    generate_infra,
    generate_kpis,
    generate_models,
    generate_permissions,
    generate_report_templates,
    generate_roles,
)
from app.domain.admin.schemas import (
    AdminAccountItem,
    AdminChallengeItem,
    AdminIncidentItem,
    AdminKpiResponse,
    AdminSessionItem,
    AdminUserItem,
    AnomalySignature,
    ApiServicesResponse,
    AuditEntry,
    ChallengeReason,
    ControlsResponse,
    GeoDot,
    GlobalMetricsResponse,
    InfraResponse,
    KpiCard,
    MetricSeries,
    PermissionItem,
    ReportTemplate,
    RoleDefinition,
    SecurityControl,
    ServiceHealth,
)
from app.domain.admin.service import (
    get_api_services,
    get_geo_dots,
    get_global_metrics,
    get_infra,
    get_kpis,
    get_role_permissions,
    list_admin_accounts,
    list_all_users,
    list_anomaly_signatures,
    list_audit,
    list_challenge_reasons,
    list_challenges,
    list_controls,
    list_datasets,
    list_incidents,
    list_models,
    list_notification_groups,
    list_permissions,
    list_report_templates,
    list_roles,
    update_control,
    update_user,
)

# ── Mock data generators ───────────────────────────────────────


def test_kpis_all_cards_present() -> None:
    data = generate_kpis()
    expected = ["total_users", "active_sessions", "risk_events_today", "blocked_attempts", "mfa_challenges", "avg_confidence"]
    for key in expected:
        assert key in data
        assert "label" in data[key]
        assert "value" in data[key]


def test_global_metrics_periods() -> None:
    for period in ("24h", "7d", "30d"):
        data = generate_global_metrics(period)
        assert data["period"] == period
        assert len(data["series"]) == 4


def test_admin_users_pagination() -> None:
    users, total = generate_admin_users(limit=10, offset=0)
    assert len(users) == 10
    assert total == 12_847


def test_admin_sessions_pagination() -> None:
    sessions, total = generate_admin_sessions(limit=5, offset=0)
    assert len(sessions) == 5
    assert total == 87
    for s in sessions:
        assert s["risk_verdict"] in ("allow", "challenge", "block")


def test_incidents_structure() -> None:
    page, total, open_count = generate_incidents(limit=20, offset=0)
    assert len(page) <= 8  # template count
    assert total <= 8
    assert open_count >= 0
    for inc in page:
        assert inc["severity"] in ("info", "warn", "critical")
        assert inc["status"] in ("open", "investigating", "resolved")


def test_models_have_versions() -> None:
    models = generate_models()
    assert len(models) >= 2
    keystroke = [m for m in models if m["name"].startswith("Keystroke")][0]
    assert len(keystroke["versions"]) >= 1


def test_datasets_all_active_or_processing() -> None:
    datasets = generate_datasets()
    for ds in datasets:
        assert ds["status"] in ("active", "processing")


def test_api_services_overall_status() -> None:
    data = generate_api_services()
    assert data["overall"] in ("healthy", "degraded", "down")
    assert len(data["services"]) >= 3


def test_controls_have_actions() -> None:
    controls = generate_controls()
    assert len(controls) >= 4
    for c in controls:
        assert len(c["actions"]) >= 1


def test_report_templates_have_formats() -> None:
    templates = generate_report_templates()
    for t in templates:
        assert t["format"] in ("pdf", "csv", "json")


def test_audit_log_returns_entries() -> None:
    entries, total = generate_audit_log(limit=5, offset=0)
    assert len(entries) <= 5
    for e in entries:
        assert e["actor"]
        assert e["action"]


def test_challenge_reasons_sorted() -> None:
    reasons = generate_challenge_reasons()
    counts = [r["count"] for r in reasons]
    assert counts == sorted(counts, reverse=True)


def test_roles_have_user_counts() -> None:
    roles = generate_roles()
    assert len(roles) >= 3
    for r in roles:
        assert r["user_count"] >= 0


def test_permissions_have_resource_and_action() -> None:
    perms = generate_permissions()
    for p in perms:
        assert p["resource"]
        assert p["action"]


def test_geo_dots_have_coordinates() -> None:
    data = generate_geo_dots()
    assert len(data["dots"]) >= 5
    for dot in data["dots"]:
        assert -90 <= dot["lat"] <= 90
        assert -180 <= dot["lng"] <= 180


def test_infra_components_structure() -> None:
    data = generate_infra()
    assert data["region"] == "us-east-1"
    for comp in data["components"]:
        assert comp["status"] in ("healthy", "degraded", "down")
        assert comp["kind"] in ("database", "cache", "queue", "storage", "compute")


def test_anomaly_signatures_channels() -> None:
    sigs = generate_anomaly_signatures()
    for s in sigs:
        assert s["channel"] in ("keystroke", "mouse", "session", "geo")


# ── Service layer ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_kpis_returns_proper_response() -> None:
    result = await get_kpis()
    assert isinstance(result, AdminKpiResponse)
    assert isinstance(result.total_users, KpiCard)
    assert result.total_users.label == "Total Users"


@pytest.mark.asyncio
async def test_get_global_metrics_returns_series() -> None:
    result = await get_global_metrics("7d")
    assert isinstance(result, GlobalMetricsResponse)
    assert result.period == "7d"
    assert len(result.series) == 4
    assert isinstance(result.series[0], MetricSeries)


@pytest.mark.asyncio
async def test_list_all_users_returns_paginated() -> None:
    result = await list_all_users(limit=5, offset=0)
    assert len(result.users) == 5
    assert result.total > 0
    assert isinstance(result.users[0], AdminUserItem)


@pytest.mark.asyncio
async def test_list_incidents_returns_with_open_count() -> None:
    result = await list_incidents(limit=20, offset=0)
    assert result.total > 0
    assert result.open_count >= 0
    assert isinstance(result.incidents[0], AdminIncidentItem)


@pytest.mark.asyncio
async def test_list_models_returns_models() -> None:
    result = await list_models()
    assert len(result) >= 2
    assert result[0].name


@pytest.mark.asyncio
async def test_list_datasets_returns_pydantic_models() -> None:
    result = await list_datasets()
    assert len(result) >= 1
    assert result[0].samples > 0


@pytest.mark.asyncio
async def test_get_dataset_quality_metrics() -> None:
    from app.domain.admin.service import get_dataset_quality_metrics
    result = await get_dataset_quality_metrics()
    assert result["total_samples"] > 0
    assert result["duplicate_rate"] == 0.0
    assert result["quality_score"] == 1.00
    assert result["canonical_window_duration_seconds"] == 30


@pytest.mark.asyncio
async def test_get_api_services() -> None:
    result = await get_api_services()
    assert isinstance(result, ApiServicesResponse)
    assert len(result.services) >= 3
    assert isinstance(result.services[0], ServiceHealth)


@pytest.mark.asyncio
async def test_list_controls() -> None:
    result = await list_controls()
    assert isinstance(result, ControlsResponse)
    assert len(result.controls) >= 4
    assert isinstance(result.controls[0], SecurityControl)


@pytest.mark.asyncio
async def test_update_control_toggles_enabled() -> None:
    from app.domain.admin.schemas import ControlUpdateRequest
    result = await update_control("ctrl-keystroke", ControlUpdateRequest(enabled=False))
    assert result.enabled is False
    assert result.id == "ctrl-keystroke"


@pytest.mark.asyncio
async def test_list_report_templates() -> None:
    result = await list_report_templates()
    assert len(result) >= 3
    assert isinstance(result[0], ReportTemplate)


@pytest.mark.asyncio
async def test_list_audit() -> None:
    result = await list_audit(limit=5, offset=0)
    assert len(result.entries) <= 5
    assert result.total > 0
    assert isinstance(result.entries[0], AuditEntry)


@pytest.mark.asyncio
async def test_list_challenge_reasons() -> None:
    result = await list_challenge_reasons()
    assert len(result) >= 3
    assert isinstance(result[0], ChallengeReason)


@pytest.mark.asyncio
async def test_list_challenges() -> None:
    result = await list_challenges(limit=5, offset=0)
    assert len(result.challenges) == 5
    assert isinstance(result.challenges[0], AdminChallengeItem)


@pytest.mark.asyncio
async def test_list_roles() -> None:
    result = await list_roles()
    assert len(result.roles) >= 3
    assert isinstance(result.roles[0], RoleDefinition)


@pytest.mark.asyncio
async def test_list_permissions() -> None:
    result = await list_permissions()
    assert len(result.permissions) >= 5
    assert isinstance(result.permissions[0], PermissionItem)


@pytest.mark.asyncio
async def test_get_role_permissions() -> None:
    result = await get_role_permissions()
    assert len(result.mappings) >= 2
    # admin role has permissions, user role has empty list
    user_mapping = [m for m in result.mappings if m.role_id == "role-user"][0]
    assert user_mapping.permission_ids == []


@pytest.mark.asyncio
async def test_list_notification_groups() -> None:
    result = await list_notification_groups()
    assert len(result.groups) >= 2


@pytest.mark.asyncio
async def test_get_geo_dots() -> None:
    result = await get_geo_dots()
    assert len(result.dots) >= 5
    assert isinstance(result.dots[0], GeoDot)


@pytest.mark.asyncio
async def test_get_infra() -> None:
    result = await get_infra()
    assert isinstance(result, InfraResponse)
    assert result.region == "us-east-1"
    assert len(result.components) >= 3


@pytest.mark.asyncio
async def test_list_admin_accounts() -> None:
    result = await list_admin_accounts(limit=10, offset=0)
    assert len(result.accounts) >= 1
    assert isinstance(result.accounts[0], AdminAccountItem)


@pytest.mark.asyncio
async def test_list_anomaly_signatures() -> None:
    result = await list_anomaly_signatures()
    assert len(result.signatures) >= 4
    assert isinstance(result.signatures[0], AnomalySignature)


@pytest.mark.asyncio
async def test_update_user_role() -> None:
    result = await update_user("some-id", mock.ANY)
    assert isinstance(result, AdminUserItem)


# ── Schema serialization ───────────────────────────────────────


def test_kpi_card_serialization() -> None:
    card = KpiCard(label="Test", value="42", delta="+3", tone="up")
    data = card.model_dump(by_alias=True)
    assert data["label"] == "Test"


def test_admin_user_item_camel_case() -> None:
    user = AdminUserItem(
        id="u1", email="a@b.com", full_name="Alice Chen", roles=["user"],
        is_active=True, is_verified=True, enrollment_status="complete",
        last_login="2026-06-29T12:00:00Z", created_at="2026-01-01T00:00:00Z",
    )
    data = user.model_dump(by_alias=True)
    assert data["fullName"] == "Alice Chen"
    assert data["isActive"] is True


def test_admin_session_item_camel_case() -> None:
    s = AdminSessionItem(
        session_id="s1", user_email="a@b.com", user_name="Alice",
        risk_score=0.15, risk_verdict="allow",
        active_since="2026-06-29T10:00:00Z", last_active="2026-06-29T11:00:00Z",
    )
    data = s.model_dump(by_alias=True)
    assert data["sessionId"] == "s1"
    assert data["riskScore"] == 0.15


def test_anomaly_signature_camel_case() -> None:
    sig = AnomalySignature(
        id="sig-1", name="Test Sig", channel="keystroke",
        threshold_sigma=2.5, description="Test", trigger_count_24h=10,
    )
    data = sig.model_dump(by_alias=True)
    assert data["thresholdSigma"] == 2.5
    assert data["triggerCount24h"] == 10
