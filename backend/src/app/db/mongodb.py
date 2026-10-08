from __future__ import annotations

from collections.abc import AsyncGenerator

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def init_db(clean: bool = False) -> None:
    global _client, _db
    _client = AsyncIOMotorClient(settings.mongodb_uri)
    _db = _client[settings.mongodb_db_name]

    if clean:
        collections = await _db.list_collection_names()
        for col in collections:
            await _db.drop_collection(col)

    from app.domain.aegis.models import BehavioralEvent, BehaviorWindow, Decision, DeviceProfile
    from app.domain.audit.models import AuditRecord
    from app.domain.auth.models import (
        Device,
        LoginHistory,
        OTPChallenge,
        PasswordResetChallenge,
        Session,
        User,
    )
    from app.domain.banking.models import (
        ActivityEvent,
        BankAccount,
        BankCard,
        Beneficiary,
        BudgetEnvelope,
        Currency,
        Holding,
        Insight,
        LoanRecord,
        SavingsGoal,
        ScheduledPayment,
        TransactionRecord,
        TransferRecord,
        DisputeRecord,
        IdempotencyRecord,
        LedgerEntry,
        LedgerTransaction,
    )
    from app.domain.notifications.models import Notification, NotificationPreference
    from app.domain.training.models import TrainingEvent, TrainingFeature, TrainingSession
    from app.domain.admin.models import BehavioralProfile, DatasetVersionEntry, ModelRegistryEntry

    await init_beanie(
        database=_db,
        document_models=[
            User,
            Session,
            OTPChallenge,
            PasswordResetChallenge,
            Device,
            LoginHistory,
            BehaviorWindow,
            BehavioralEvent,
            Decision,
            DeviceProfile,
            BankAccount,
            TransactionRecord,
            BankCard,
            ScheduledPayment,
            SavingsGoal,
            Holding,
            LoanRecord,
            Currency,
            Insight,
            ActivityEvent,
            BudgetEnvelope,
            Beneficiary,
            TransferRecord,
            LedgerTransaction,
            LedgerEntry,
            IdempotencyRecord,
            DisputeRecord,
            Notification,
            NotificationPreference,
            AuditRecord,
            TrainingSession,
            TrainingEvent,
            TrainingFeature,
            ModelRegistryEntry,
            DatasetVersionEntry,
            BehavioralProfile,
        ],
    )


async def clean_db() -> None:
    """Drop all collections in the current database (test helper)."""
    if _db is not None:
        collections = await _db.list_collection_names()
        for col in collections:
            await _db.drop_collection(col)


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        _client = None


async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    if _db is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    yield _db
