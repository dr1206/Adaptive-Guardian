from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from app.config import settings
from app.domain.auth.models import (
    Device,
    LoginHistory,
    OTPChallenge,
    PasswordResetChallenge,
    Session,
    User,
)

# ── User ──────────────────────────────────────────────────────

async def get_user_by_email(email: str) -> User | None:
    return await User.find_one(User.email == email)


async def get_user_by_id(user_id: uuid.UUID) -> User | None:
    return await User.find_one(User.id == user_id)


async def create_user(email: str, password_hash: str, full_name: str) -> User:
    user = User(email=email, password_hash=password_hash, full_name=full_name, is_verified=True)
    return await user.insert()


async def update_user(user: User, **kwargs) -> None:
    await user.set(kwargs)


async def update_user_password(user_id: uuid.UUID, new_password_hash: str) -> None:
    user = await get_user_by_id(user_id)
    if user:
        await user.set({"password_hash": new_password_hash, "updated_at": datetime.now(UTC)})


async def record_user_login(user_id: uuid.UUID) -> None:
    await User.find_one(User.id == user_id).set(
        {"last_login_at": datetime.now(UTC), "updated_at": datetime.now(UTC)}
    )


async def any_admin_exists() -> bool:
    return await User.find(User.roles == "admin").count() > 0


async def seed_admin_user(email: str, password_hash: str, full_name: str) -> User:
    user = User(
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        roles=["user", "admin"],
        is_verified=True,
    )
    return await user.insert()


# ── Session ───────────────────────────────────────────────────

async def create_session(
    user_id: uuid.UUID,
    refresh_token_hash: str,
    device_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> Session:
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_ttl_days)
    session = Session(
        user_id=user_id,
        refresh_token_hash=refresh_token_hash,
        device_id=device_id,
        ip_address=ip_address,
        user_agent=user_agent,
        expires_at=expires_at,
    )
    return await session.insert()


async def get_session_by_refresh_hash(refresh_token_hash: str) -> Session | None:
    return await Session.find_one(
        Session.refresh_token_hash == refresh_token_hash,
        Session.revoked == False,
        Session.expires_at > datetime.now(UTC),
    )


async def get_sessions_for_user(user_id: uuid.UUID) -> list[Session]:
    return (
        await Session.find(
            Session.user_id == user_id,
            Session.revoked == False,
            Session.expires_at > datetime.now(UTC),
        )
        .sort(-Session.created_at)
        .to_list()
    )


async def get_session_by_id(session_id: uuid.UUID) -> Session | None:
    return await Session.find_one(Session.id == session_id)


async def revoke_session(session: Session) -> None:
    session.revoked = True
    await session.save()


async def revoke_all_sessions_for_user(user_id: uuid.UUID) -> int:
    result = await Session.find(
        Session.user_id == user_id,
        Session.revoked == False,
    ).set({"revoked": True})
    return result.modified_count


async def touch_session(session_id: uuid.UUID) -> None:
    await Session.find_one(Session.id == session_id).set({"last_active_at": datetime.now(UTC)})


# ── OTP Challenge ─────────────────────────────────────────────

async def create_otp_challenge(
    user_id: uuid.UUID | None,
    purpose: str,
    ttl_seconds: int | None = None,
) -> OTPChallenge:
    ttl = ttl_seconds or settings.otp_ttl_seconds
    challenge = OTPChallenge(
        user_id=user_id,
        purpose=purpose,
        expires_at=datetime.now(UTC) + timedelta(seconds=ttl),
    )
    return await challenge.insert()


async def get_otp_challenge_by_id(challenge_id: uuid.UUID) -> OTPChallenge | None:
    return await OTPChallenge.find_one(
        OTPChallenge.challenge_id == challenge_id,
        OTPChallenge.verified == False,
        OTPChallenge.expires_at > datetime.now(UTC),
    )


async def verify_otp_challenge(challenge: OTPChallenge) -> None:
    challenge.verified = True
    challenge.consumed_at = datetime.now(UTC)
    await challenge.save()


async def increment_otp_attempts(challenge: OTPChallenge) -> int:
    challenge.attempts += 1
    await challenge.save()
    return challenge.attempts


# ── Password Reset ────────────────────────────────────────────

async def create_password_reset_challenge(user_id: uuid.UUID) -> PasswordResetChallenge:
    challenge = PasswordResetChallenge(
        user_id=user_id,
        expires_at=datetime.now(UTC) + timedelta(seconds=settings.password_reset_ttl_seconds),
    )
    return await challenge.insert()


async def get_password_reset_challenge(challenge_id: uuid.UUID) -> PasswordResetChallenge | None:
    return await PasswordResetChallenge.find_one(
        PasswordResetChallenge.challenge_id == challenge_id,
        PasswordResetChallenge.verified == False,
        PasswordResetChallenge.expires_at > datetime.now(UTC),
    )


async def consume_password_reset_challenge(challenge: PasswordResetChallenge) -> None:
    challenge.verified = True
    challenge.consumed_at = datetime.now(UTC)
    await challenge.save()


# ── Device ────────────────────────────────────────────────────

async def get_device(user_id: uuid.UUID, fingerprint: str) -> Device | None:
    return await Device.find_one(Device.user_id == user_id, Device.fingerprint == fingerprint)


async def create_or_update_device(
    user_id: uuid.UUID,
    fingerprint: str,
    label: str,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> Device:
    existing = await get_device(user_id, fingerprint)
    if existing:
        existing.last_seen_at = datetime.now(UTC)
        if user_agent:
            existing.user_agent = user_agent
        if ip_address:
            existing.ip_address = ip_address
        await existing.save()
        return existing

    device = Device(
        user_id=user_id,
        fingerprint=fingerprint,
        label=label,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    return await device.insert()


async def get_devices_for_user(user_id: uuid.UUID) -> list[Device]:
    return await Device.find(Device.user_id == user_id).sort(-Device.last_seen_at).to_list()


async def get_device_by_id(device_id: str) -> Device | None:
    return await Device.find_one(Device.id == uuid.UUID(device_id))


async def update_device(device_id: str, **kwargs) -> None:
    device = await get_device_by_id(device_id)
    if device:
        await device.set(kwargs)


# ── Login History ─────────────────────────────────────────────

async def record_login_event(
    user_id: uuid.UUID,
    event: str,
    session_id: uuid.UUID | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    device_id: str | None = None,
    details: dict | None = None,
) -> LoginHistory:
    entry = LoginHistory(
        user_id=user_id,
        session_id=session_id,
        event=event,
        ip_address=ip_address,
        user_agent=user_agent,
        device_id=device_id,
        details=details or {},
    )
    return await entry.insert()


async def get_login_history(
    user_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[LoginHistory], int]:
    query = LoginHistory.find(LoginHistory.user_id == user_id)
    total = await query.count()
    events = await query.sort(-LoginHistory.created_at).skip(offset).limit(limit).to_list()
    return events, total
