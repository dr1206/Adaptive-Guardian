from __future__ import annotations

import json
import logging
import uuid
from datetime import UTC, datetime, timedelta

from app.config import settings
from app.db.redis import (
    delete_otp as redis_delete_otp,
)
from app.db.redis import (
    get_otp as redis_get_otp,
)
from app.db.redis import (
    set_otp as redis_set_otp,
)
from app.domain.auth import repository as repo
from app.domain.auth.interfaces import RiskScore, RiskScoringService
from app.domain.auth.mock_scoring import get_risk_scoring_service
from app.domain.auth.models import User
from app.domain.auth.schemas import (
    AuthSession,
    DeviceInfo,
    DeviceListResponse,
    DeviceUpdateRequest,
    EnrollmentReceipt,
    EnrollmentRequest,
    LoginHistoryEvent,
    LoginHistoryResponse,
    LoginRequest,
    Me,
    PasswordResetConfirm,
    PasswordResetPending,
    PasswordResetRequest,
    PasswordResetVerify,
    ProfileUpdateRequest,
    RegisterRequest,
    RegistrationPending,
    SessionInfo,
    SessionListResponse,
    VerifyOtpRequest,
)
from app.domain.auth.security import (
    create_access_token,
    create_refresh_token,
    generate_otp_code,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.shared.errors import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
    RateLimitError,
    ValidationError,
)

logger = logging.getLogger(__name__)

_registration_pending_ttl = 600  # 10 minutes to complete registration


def _get_risk_scorer() -> RiskScoringService:
    return get_risk_scoring_service()


# ── Registration ──────────────────────────────────────────────


async def register(data: RegisterRequest) -> RegistrationPending:
    existing = await repo.get_user_by_email(data.email)
    if existing:
        raise ConflictError("Email already registered")

    otp_code = generate_otp_code()
    challenge = await repo.create_otp_challenge(user_id=None, purpose="register")

    pending = {
        "email": data.email,
        "password_hash": hash_password(data.password),
        "full_name": data.full_name,
        "challenge_id": str(challenge.challenge_id),
    }
    await redis_set_otp(str(challenge.challenge_id), json.dumps({"code": otp_code, "pending": pending}))

    # In production this would send an email via SMTP
    logger.info("OTP for %s: %s", data.email, otp_code)

    return RegistrationPending(
        challenge_id=challenge.challenge_id,
        expires_at=challenge.expires_at,
    )


async def verify_otp(data: VerifyOtpRequest, ip_address: str | None = None) -> tuple[AuthSession, str]:
    challenge = await repo.get_otp_challenge_by_id(data.challenge_id)
    if not challenge:
        raise AuthenticationError("Invalid or expired challenge")

    if challenge.attempts >= settings.otp_max_attempts:
        raise RateLimitError("Too many attempts. Request a new OTP.")

    stored = await redis_get_otp(str(data.challenge_id))
    if not stored:
        raise AuthenticationError("OTP expired. Request a new one.")

    payload = json.loads(stored)
    if payload["code"] != data.code:
        await repo.increment_otp_attempts(challenge)
        raise AuthenticationError("Invalid OTP code")

    await repo.verify_otp_challenge(challenge)
    await redis_delete_otp(str(data.challenge_id))

    pending = payload["pending"]

    if challenge.purpose == "register":
        user = await repo.create_user(pending["email"], pending["password_hash"], pending["full_name"])
    elif challenge.purpose == "login" or challenge.purpose == "password_reset":
        user = await repo.get_user_by_id(challenge.user_id)  # type: ignore[arg-type]
        if not user:
            raise AuthenticationError("User not found")
    else:
        raise ValidationError("Unknown challenge purpose")

    return await _issue_tokens(user, ip_address=ip_address)


# ── Login ─────────────────────────────────────────────────────


async def login(data: LoginRequest, ip_address: str | None = None) -> tuple[AuthSession, str]:
    user = await repo.get_user_by_email(data.email)
    if not user or not verify_password(data.password, user.password_hash):
        raise AuthenticationError("Invalid email or password")

    if not user.is_active:
        raise AuthenticationError("Account is deactivated")

    return await _issue_tokens(user, ip_address=ip_address)


# ── Token Refresh ─────────────────────────────────────────────


async def refresh(raw_refresh_token: str, ip_address: str | None = None) -> tuple[AuthSession, str]:
    if not raw_refresh_token:
        raise AuthenticationError("Missing refresh token")

    token_hash = hash_refresh_token(raw_refresh_token)
    session = await repo.get_session_by_refresh_hash(token_hash)
    if not session:
        raise AuthenticationError("Invalid or expired refresh token")

    await repo.revoke_session(session)
    user = await repo.get_user_by_id(session.user_id)
    if not user or not user.is_active:
        raise AuthenticationError("User not found or deactivated")

    return await _issue_tokens(user, ip_address=ip_address)


# ── Logout ────────────────────────────────────────────────────


async def logout(raw_refresh_token: str | None) -> None:
    if raw_refresh_token:
        token_hash = hash_refresh_token(raw_refresh_token)
        session = await repo.get_session_by_refresh_hash(token_hash)
        if session:
            await repo.revoke_session(session)


# ── Current User ──────────────────────────────────────────────


async def get_me(user_id: uuid.UUID) -> Me:
    user = await repo.get_user_by_id(user_id)
    if not user:
        raise AuthenticationError("User not found")

    return Me(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        roles=user.roles,
        enrollment_status=user.enrollment_status,
    )


async def update_profile(user_id: uuid.UUID, data: ProfileUpdateRequest) -> Me:
    user = await repo.get_user_by_id(user_id)
    if not user:
        raise AuthenticationError("User not found")

    updates = {}
    if data.full_name is not None:
        updates["full_name"] = data.full_name

    if updates:
        updates["updated_at"] = datetime.now(UTC)
        await repo.update_user(user, **updates)

    return await get_me(user_id)


# ── Password Reset ────────────────────────────────────────────


async def request_password_reset(data: PasswordResetRequest) -> PasswordResetPending:
    user = await repo.get_user_by_email(data.email)
    if not user:
        # Don't reveal whether the email exists
        return PasswordResetPending(
            challenge_id=uuid.uuid4(),
            expires_at=datetime.now(UTC) + timedelta(seconds=settings.password_reset_ttl_seconds),
        )

    otp_code = generate_otp_code()
    challenge = await repo.create_password_reset_challenge(user.id)
    await redis_set_otp(str(challenge.challenge_id), json.dumps({"code": otp_code, "user_id": str(user.id)}))

    logger.info("Password reset OTP for %s: %s", data.email, otp_code)

    return PasswordResetPending(
        challenge_id=challenge.challenge_id,
        expires_at=challenge.expires_at,
    )


async def verify_password_reset(data: PasswordResetVerify) -> PasswordResetPending:
    challenge = await repo.get_password_reset_challenge(data.challenge_id)
    if not challenge:
        raise AuthenticationError("Invalid or expired challenge")

    stored = await redis_get_otp(str(data.challenge_id))
    if not stored:
        raise AuthenticationError("Challenge expired")

    payload = json.loads(stored)
    if payload["code"] != data.code:
        challenge.attempts += 1
        await challenge.save()
        raise AuthenticationError("Invalid code")

    # Issue a new challenge for the confirmation step
    confirm_challenge = await repo.create_password_reset_challenge(
        uuid.UUID(payload["user_id"])
    )
    await redis_set_otp(str(confirm_challenge.challenge_id), json.dumps({"user_id": payload["user_id"], "verified": True}))

    return PasswordResetPending(
        challenge_id=confirm_challenge.challenge_id,
        expires_at=confirm_challenge.expires_at,
    )


async def confirm_password_reset(data: PasswordResetConfirm) -> None:
    stored = await redis_get_otp(str(data.challenge_id))
    if not stored:
        raise AuthenticationError("Challenge expired")

    payload = json.loads(stored)
    if not payload.get("verified"):
        raise AuthenticationError("OTP not yet verified")

    user_id = uuid.UUID(payload["user_id"])
    await repo.update_user_password(user_id, hash_password(data.new_password))
    await repo.revoke_all_sessions_for_user(user_id)
    await redis_delete_otp(str(data.challenge_id))


# ── Session Management ────────────────────────────────────────


async def list_sessions(user_id: uuid.UUID, current_session_id: uuid.UUID | None = None) -> SessionListResponse:
    sessions = await repo.get_sessions_for_user(user_id)
    items = [
        SessionInfo(
            session_id=s.id,
            device_id=s.device_id,
            ip_address=s.ip_address,
            user_agent=s.user_agent,
            is_current=s.id == current_session_id,
            last_active_at=s.last_active_at,
            created_at=s.created_at,
        )
        for s in sessions
    ]
    return SessionListResponse(sessions=items, total=len(items))


async def revoke_session_by_id(user_id: uuid.UUID, session_id: uuid.UUID) -> None:
    session = await repo.get_session_by_id(session_id)
    if not session or session.user_id != user_id:
        raise NotFoundError("Session not found")
    await repo.revoke_session(session)


# ── Device Management ─────────────────────────────────────────


async def list_devices(user_id: uuid.UUID) -> DeviceListResponse:
    devices = await repo.get_devices_for_user(user_id)
    return DeviceListResponse(
        devices=[
            DeviceInfo(
                device_id=str(d.id),
                label=d.label,
                user_agent=d.user_agent,
                is_trusted=d.is_trusted,
                first_seen_at=d.first_seen_at,
                last_seen_at=d.last_seen_at,
            )
            for d in devices
        ]
    )


async def update_device(user_id: uuid.UUID, device_id: str, data: DeviceUpdateRequest) -> DeviceInfo:
    device = await repo.get_device_by_id(device_id)
    if not device or device.user_id != user_id:
        raise NotFoundError("Device not found")

    updates = {}
    if data.label is not None:
        updates["label"] = data.label
    if data.is_trusted is not None:
        updates["is_trusted"] = data.is_trusted

    if updates:
        await repo.update_device(device_id, **updates)

    device = await repo.get_device_by_id(device_id)
    if not device:
        raise NotFoundError("Device not found")
    return DeviceInfo(
        device_id=str(device.id),
        label=device.label,
        user_agent=device.user_agent,
        is_trusted=device.is_trusted,
        first_seen_at=device.first_seen_at,
        last_seen_at=device.last_seen_at,
    )


# ── Enrollment ────────────────────────────────────────────────


async def submit_enrollment(user_id: uuid.UUID, data: EnrollmentRequest) -> EnrollmentReceipt:
    from app.domain.auth.mock_scoring import get_enrollment_service

    samples = [
        {
            "kind": "keystroke",
            "hold_times_ms": data.keyboard.hold_times_ms,
            "flight_times_ms": data.keyboard.flight_times_ms,
            "rhythm_hash": data.keyboard.rhythm_hash,
        },
        {
            "kind": "mouse",
            "velocity_profile": data.mouse.velocity_profile,
            "curvature_profile": data.mouse.curvature_profile,
            "jerk_profile": data.mouse.jerk_profile,
        },
    ]

    enrollment = get_enrollment_service()
    result = await enrollment.calibrate(user_id, samples)

    return EnrollmentReceipt(
        baseline_id=result["baseline_id"],
        created_at=datetime.now(UTC),
        confidence=result["confidence"],
    )


# ── Login History ─────────────────────────────────────────────


async def get_login_history(
    user_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> LoginHistoryResponse:
    events, total = await repo.get_login_history(user_id, limit=limit, offset=offset)
    return LoginHistoryResponse(
        events=[
            LoginHistoryEvent(
                event=e.event,
                ip_address=e.ip_address,
                user_agent=e.user_agent,
                device_id=e.device_id,
                created_at=e.created_at,
            )
            for e in events
        ],
        total=total,
    )


# ── Risk Score (AI integration point) ─────────────────────────


async def get_session_risk(session_id: uuid.UUID) -> RiskScore:
    scorer = _get_risk_scorer()
    return await scorer.calculate_risk(session_id)


# ── Helpers ───────────────────────────────────────────────────


async def _issue_tokens(
    user: User,
    ip_address: str | None = None,
    device_fingerprint: str | None = None,
    user_agent: str | None = None,
    session_id: uuid.UUID | None = None,
) -> tuple[AuthSession, str]:
    """Returns (AuthSession, raw_refresh_token). Caller sets the refresh cookie."""
    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={
            "email": user.email,
            "display_name": user.full_name,
            "roles": user.roles,
            "sid": str(session_id) if session_id else None,
        },
    )

    raw_refresh, refresh_hash = create_refresh_token()
    await repo.create_session(
        user.id,
        refresh_hash,
        device_id=device_fingerprint,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    await repo.record_user_login(user.id)

    return AuthSession(
        access_token=access_token,
        expires_in=settings.access_token_ttl_minutes * 60,
        user=Me(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            roles=user.roles,
            enrollment_status=user.enrollment_status,
        ),
    ), raw_refresh
