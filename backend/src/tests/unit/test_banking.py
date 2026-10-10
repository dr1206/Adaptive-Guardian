"""Sprint 2 — Banking Core tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def _auth_headers(client: AsyncClient) -> dict:
    """Register, verify OTP, and return auth headers."""
    import json
    import uuid

    from app.db.redis import get_otp

    email = f"banker_{uuid.uuid4().hex[:8]}@test.com"
    r1 = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "securePassword123", "fullName": "Bank Tester"},
    )
    challenge_id = r1.json()["challengeId"]
    stored = await get_otp(str(challenge_id))
    code = json.loads(stored)["code"]

    r2 = await client.post(
        "/api/v1/auth/verify-otp",
        json={"challengeId": challenge_id, "code": code},
    )
    token = r2.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}


# ── Accounts ──────────────────────────────────────────────────


async def test_list_accounts(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/accounts", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) == 4
    assert body[0]["name"] == "Primary Checking"
    for field in ("id", "name", "type", "currency", "balance", "iban", "deltaPct", "spark", "status"):
        assert field in body[0], f"Missing field: {field}"


async def test_get_account_by_id(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/accounts/acc_0000", headers=headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Primary Checking"


async def test_get_account_not_found(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/accounts/acc_dead", headers=headers)
    assert r.status_code == 404


async def test_accounts_require_auth(client: AsyncClient):
    r = await client.get("/api/v1/accounts")
    assert r.status_code == 401


# ── Transactions ──────────────────────────────────────────────


async def test_list_transactions(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/transactions", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) > 0
    for field in ("id", "date", "description", "amount", "currency", "type", "status"):
        assert field in body[0], f"Missing field: {field}"


async def test_list_transactions_with_limit(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/transactions?limit=5", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) == 5


async def test_list_transactions_with_account_filter(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/transactions?accountId=acc_0000", headers=headers)
    assert r.status_code == 200


# ── Transfers ─────────────────────────────────────────────────


async def test_create_transfer(client: AsyncClient):
    headers = await _auth_headers(client)

    # First add a beneficiary
    b = await client.post(
        "/api/v1/beneficiaries",
        json={"name": "Jane Smith", "iban": "GB29NWBK60161331926819", "bank": "Barclays", "currency": "USD"},
        headers=headers,
    )
    beneficiary_id = b.json()["id"]

    r = await client.post(
        "/api/v1/transfers",
        json={"fromAccountId": "acc_0000", "beneficiaryId": beneficiary_id, "amount": 500, "currency": "USD", "reference": "Rent"},
        headers=headers,
    )
    assert r.status_code == 201
    body = r.json()
    for field in ("transactionId", "scheduledFor", "signature"):
        assert field in body, f"Missing field: {field}"


async def test_transfer_insufficient_funds(client: AsyncClient):
    headers = await _auth_headers(client)

    b = await client.post(
        "/api/v1/beneficiaries",
        json={"name": "Expensive", "iban": "FR1420041010050500013M02606", "bank": "BNP", "currency": "USD"},
        headers=headers,
    )
    r = await client.post(
        "/api/v1/transfers",
        json={"fromAccountId": "acc_0000", "beneficiaryId": b.json()["id"], "amount": 99_999_999, "currency": "USD"},
        headers=headers,
    )
    assert r.status_code == 400


async def test_transfer_beneficiary_not_found(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.post(
        "/api/v1/transfers",
        json={"fromAccountId": "acc_0000", "beneficiaryId": "00000000-0000-0000-0000-000000000000", "amount": 100, "currency": "USD"},
        headers=headers,
    )
    assert r.status_code == 404


# ── Beneficiaries ─────────────────────────────────────────────


async def test_list_beneficiaries_empty(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/beneficiaries", headers=headers)
    assert r.status_code == 200
    assert r.json() == []


async def test_add_beneficiary(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.post(
        "/api/v1/beneficiaries",
        json={"name": "Alice Johnson", "iban": "DE89370400440532013000", "bank": "Deutsche Bank", "currency": "EUR"},
        headers=headers,
    )
    assert r.status_code == 201
    body = r.json()
    for field in ("id", "name", "iban", "bank", "currency"):
        assert field in body, f"Missing field: {field}"


async def test_add_duplicate_beneficiary_iban(client: AsyncClient):
    headers = await _auth_headers(client)
    payload = {"name": "Bob", "iban": "DUPE123456789", "bank": "Bank A", "currency": "USD"}
    await client.post("/api/v1/beneficiaries", json=payload, headers=headers)
    r = await client.post("/api/v1/beneficiaries", json=payload, headers=headers)
    assert r.status_code == 409


# ── Cards ─────────────────────────────────────────────────────


async def test_list_cards(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/cards", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    for field in ("id", "label", "kind", "network", "last4", "holder", "exp", "frozen", "finish", "limits", "spentMonth"):
        assert field in body[0], f"Missing field: {field}"


# ── Payments ──────────────────────────────────────────────────


async def test_list_payments(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/payments", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    assert "description" in body[0]
    assert "frequency" in body[0]


# ── Savings Goals ─────────────────────────────────────────────


async def test_list_savings_goals(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/savings-goals", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) == 3
    for field in ("id", "name", "target", "current", "currency", "deadline"):
        assert field in body[0], f"Missing field: {field}"


# ── Holdings ──────────────────────────────────────────────────


async def test_list_holdings(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/holdings", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    assert body[0]["symbol"] == "AAPL"
    assert "deltaPct" in body[0]


# ── Loans ─────────────────────────────────────────────────────


async def test_list_loans(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/loans", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    for field in ("id", "name", "principal", "remaining", "currency", "rate", "nextPayment"):
        assert field in body[0], f"Missing field: {field}"


# ── Currencies ────────────────────────────────────────────────


async def test_list_currencies(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/currencies", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) >= 4
    for field in ("code", "name", "rate", "symbol"):
        assert field in body[0], f"Missing field: {field}"


# ── Insights ──────────────────────────────────────────────────


async def test_list_insights(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/insights", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    for field in ("id", "tone", "title", "body", "action"):
        assert field in body[0], f"Missing field: {field}"


# ── Statements ────────────────────────────────────────────────


async def test_list_statement_years(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/statements/years", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    assert "year" in body[0]
    assert "months" in body[0]


async def test_get_statement(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/statements/2025/6", headers=headers)
    assert r.status_code == 200
    body = r.json()
    for field in ("year", "month", "openingBalance", "closingBalance", "transactions"):
        assert field in body, f"Missing field: {field}"


async def test_statement_invalid_month(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/statements/2025/13", headers=headers)
    assert r.status_code == 400


# ── Activity ──────────────────────────────────────────────────


async def test_list_activity(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/activity", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) == 20
    for field in ("id", "type", "description", "occurredAt"):
        assert field in body[0], f"Missing field: {field}"


# ── Budgets ───────────────────────────────────────────────────


async def test_list_budgets(client: AsyncClient):
    headers = await _auth_headers(client)
    r = await client.get("/api/v1/budgets", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    for field in ("id", "category", "budgeted", "spent", "currency"):
        assert field in body[0], f"Missing field: {field}"


# ── Behavioral Transfer Security Evaluation ──────────────────


async def test_transfer_with_predict_direct_invocation():
    """Verify that behavioral_ml_service.predict accepts both positional and kwarg patterns without TypeError."""
    from app.domain.security.ml_service import behavioral_ml_service

    dummy_feats = {
        "dwellMeanMs": 110.0,
        "flightMeanMs": 130.0,
        "velocityMean": 220.0,
        "accelerationMean": 300.0,
    }
    # Pattern 1: predict(user_id, features)
    res1 = behavioral_ml_service.predict("manasa@adaptivebank.com", dummy_feats)
    assert "fused_score" in res1
    assert "decision" in res1

    # Pattern 2: predict(dummy_feats, user_id=...)
    res2 = behavioral_ml_service.predict(dummy_feats, user_id="manasa@adaptivebank.com")
    assert "fused_score" in res2
    assert "decision" in res2


async def test_transfer_with_genuine_behavior_allows(client: AsyncClient, monkeypatch):
    """Low risk score produces COMPLETED transfer with ALLOW decision."""
    from app.domain.security.ml_service import behavioral_ml_service

    # Monkeypatch predict to return genuine score
    monkeypatch.setattr(
        behavioral_ml_service,
        "predict",
        lambda *args, **kwargs: {
            "lightgbm_score": 0.15,
            "ocsvm_anomaly_score": 0.12,
            "fused_score": 0.14,
            "decision": "ALLOW",
            "anomaly_detected": False,
            "requires_stepup": False,
        },
    )

    headers = await _auth_headers(client)
    b = await client.post(
        "/api/v1/beneficiaries",
        json={"name": "Alice Genuine", "iban": "DE89370400440532013001", "bank": "Bank A", "currency": "USD"},
        headers=headers,
    )
    beneficiary_id = b.json()["id"]

    r = await client.post(
        "/api/v1/transfers",
        json={
            "fromAccountId": "acc_0000",
            "beneficiaryId": beneficiary_id,
            "amount": 250,
            "currency": "USD",
            "reference": "Genuine Test",
            "behavioralFeatures": {"dwellMeanMs": 100.0, "velocityMean": 200.0},
        },
        headers=headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["status"] == "COMPLETED"
    assert data["riskDecision"] == "ALLOW"
    assert data["riskScore"] == 0.14


async def test_transfer_with_suspicious_behavior_warns(client: AsyncClient, monkeypatch):
    """Suspicious risk score (0.45 <= score < 0.65) produces COMPLETED transfer with WARN decision and warning message."""
    from app.domain.security.ml_service import behavioral_ml_service

    monkeypatch.setattr(
        behavioral_ml_service,
        "predict",
        lambda *args, **kwargs: {
            "lightgbm_score": 0.58,
            "ocsvm_anomaly_score": 0.52,
            "fused_score": 0.56,
            "decision": "WARN",
            "anomaly_detected": True,
            "requires_stepup": False,
        },
    )

    headers = await _auth_headers(client)
    b = await client.post(
        "/api/v1/beneficiaries",
        json={"name": "Bob Suspicious", "iban": "DE89370400440532013002", "bank": "Bank B", "currency": "USD"},
        headers=headers,
    )
    beneficiary_id = b.json()["id"]

    r = await client.post(
        "/api/v1/transfers",
        json={
            "fromAccountId": "acc_0000",
            "beneficiaryId": beneficiary_id,
            "amount": 450,
            "currency": "USD",
            "reference": "Suspicious Test",
            "behavioralFeatures": {"dwellMeanMs": 280.0, "velocityMean": 50.0},
        },
        headers=headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["status"] == "COMPLETED"
    assert data["riskDecision"] == "WARN"
    assert data["riskScore"] == 0.56
    assert "behavioral anomaly warning" in data["message"].lower()


async def test_transfer_with_impostor_behavior_challenges(client: AsyncClient, monkeypatch):
    """High risk score (score >= 0.65) triggers CHALLENGED status with challengeId and does not complete transfer immediately."""
    from app.domain.security.ml_service import behavioral_ml_service

    monkeypatch.setattr(
        behavioral_ml_service,
        "predict",
        lambda *args, **kwargs: {
            "lightgbm_score": 0.82,
            "ocsvm_anomaly_score": 0.78,
            "fused_score": 0.80,
            "decision": "CHALLENGE",
            "anomaly_detected": True,
            "requires_stepup": True,
        },
    )

    headers = await _auth_headers(client)
    b = await client.post(
        "/api/v1/beneficiaries",
        json={"name": "Charlie Impostor", "iban": "DE89370400440532013003", "bank": "Bank C", "currency": "USD"},
        headers=headers,
    )
    beneficiary_id = b.json()["id"]

    r = await client.post(
        "/api/v1/transfers",
        json={
            "fromAccountId": "acc_0000",
            "beneficiaryId": beneficiary_id,
            "amount": 900,
            "currency": "USD",
            "reference": "Impostor Test",
            "behavioralFeatures": {"dwellMeanMs": 450.0, "velocityMean": 10.0},
        },
        headers=headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["status"] == "CHALLENGED"
    assert data["riskDecision"] == "CHALLENGE"
    assert data["challengeId"] is not None
    assert "step-up otp authentication required" in data["message"].lower()

