from __future__ import annotations

import uuid
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class ModelRegistryEntry(Document):
    """Authoritative registry entry for a behavioral biometric ML model."""
    model_config = {"protected_namespaces": ()}
    model_id: str
    name: str
    status: str = "deployed"  # deployed, candidate, shadow, retired, offline
    trained_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    dataset_version: str = "ds-canonical-v1"
    algorithm: str = "LightGBM + OC-SVM Ensemble"
    feature_count: int = 14
    versions: list[dict] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "model_registry"
        indexes = [
            "model_id",
            "status",
            IndexModel([("model_id", 1)], unique=True),
        ]


class DatasetVersionEntry(Document):
    """Authoritative record for a behavioral biometric training/evaluation dataset."""
    model_config = {"protected_namespaces": ()}
    dataset_id: str
    version: str
    samples: int
    users: int
    sessions: int
    features: int = 14
    quality: float = 1.00
    duplicates: float = 0.00
    coverage: float = 1.00
    status: str = "active"  # active, processing, archived
    description: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: dict = Field(default_factory=dict)

    class Settings:
        name = "dataset_versions"
        indexes = [
            "dataset_id",
            "version",
            IndexModel([("dataset_id", 1), ("version", 1)], unique=True),
        ]


class BehavioralProfile(Document):
    """Adaptive behavioral biometric baseline profile for a user."""
    model_config = {"protected_namespaces": ()}
    user_id: uuid.UUID
    enrollment_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    model_version: str = "lgbm_ocsvm_v1"
    feature_schema_version: str = "v1"
    status: str = "MODEL_READY"  # NOT_TRAINED, TRAINING, BASELINE_READY, MODEL_READY, MONITORING
    sample_count: int = 0
    accepted_windows_count: int = 0
    baseline_stats: dict[str, dict[str, float]] = Field(default_factory=dict)  # {feat: {"mean": x, "std": y}}
    drift_score: float = 0.0
    last_drift_evaluated_at: datetime | None = None
    last_adapted_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "behavioral_profiles"
        indexes = [
            "user_id",
            IndexModel([("user_id", 1)], unique=True),
        ]
