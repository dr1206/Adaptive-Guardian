"""Governance seeder for canonical behavioral datasets and ML model registry entries.

Populates MongoDB with the authoritative metadata from:
- ml/processed/behavioral_windows_canonical.csv
- ml/processed/dataset_validation_report_canonical.txt
- ml/processed/final_evaluation_report_canonical.txt
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.domain.admin.models import DatasetVersionEntry, ModelRegistryEntry, BehavioralProfile
from app.domain.security.ml_service import ENROLLED_USERS

logger = logging.getLogger(__name__)


async def seed_governance_metadata() -> None:
    """Ensure canonical dataset versions, registered models, and user profiles exist in DB."""
    try:
        # 1. Dataset Versions
        canonical_ds = await DatasetVersionEntry.find_one(
            DatasetVersionEntry.dataset_id == "ds-canonical-30s"
        )
        if not canonical_ds:
            canonical_ds = DatasetVersionEntry(
                dataset_id="ds-canonical-30s",
                version="v1.0.0",
                samples=299,
                users=4,
                sessions=38,
                features=14,
                quality=1.00,
                duplicates=0.00,
                coverage=1.00,
                status="active",
                description="Canonical 30-second behavioral windows across 4 enrolled subjects, zero duplicate window IDs, strictly session-disjoint.",
                metadata={
                    "window_duration_seconds": 30,
                    "train_windows": 205,
                    "test_windows": 94,
                    "binary_evaluation_trials": 376,
                    "train_sessions": 26,
                    "test_sessions": 12,
                    "schema_version": "v1",
                },
            )
            await canonical_ds.insert()
            logger.info("Seeded canonical dataset entry: ds-canonical-30s v1.0.0")

        # 2. Model Registry Entries
        lgbm_reg = await ModelRegistryEntry.find_one(
            ModelRegistryEntry.model_id == "model-lgbm-biometric"
        )
        if not lgbm_reg:
            lgbm_reg = ModelRegistryEntry(
                model_id="model-lgbm-biometric",
                name="LightGBM Behavioral Classifier",
                status="deployed",
                trained_at=datetime(2026, 10, 6, 11, 7, 0, tzinfo=timezone.utc),
                dataset_version="ds-canonical-30s:v1.0.0",
                algorithm="LightGBM (Gradient Boosting Decision Trees)",
                feature_count=14,
                versions=[
                    {
                        "version": "v1.0.0",
                        "status": "active",
                        "trained": "2026-10-06T11:07:00Z",
                        "dataset": "ds-canonical-30s",
                        "accuracy": 0.5796,
                        "precision": 0.7732,
                        "recall": 0.5319,
                        "f1": 0.6303,
                        "latency_ms": 3.2,
                        "memory_mb": 48.0,
                    }
                ],
                metadata={
                    "auc_roc": 0.5796,
                    "explainer": "shap.TreeExplainer",
                    "hyperparameters": {
                        "n_estimators": 50,
                        "max_depth": 3,
                        "learning_rate": 0.05,
                    },
                },
            )
            await lgbm_reg.insert()
            logger.info("Seeded model registry: model-lgbm-biometric")

        ocsvm_reg = await ModelRegistryEntry.find_one(
            ModelRegistryEntry.model_id == "model-ocsvm-calibrated"
        )
        if not ocsvm_reg:
            ocsvm_reg = ModelRegistryEntry(
                model_id="model-ocsvm-calibrated",
                name="One-Class SVM Anomaly Detector",
                status="deployed",
                trained_at=datetime(2026, 10, 6, 11, 7, 0, tzinfo=timezone.utc),
                dataset_version="ds-canonical-30s:v1.0.0",
                algorithm="One-Class SVM (RBF Kernel with empirical min-max calibration)",
                feature_count=14,
                versions=[
                    {
                        "version": "v1.0.0",
                        "status": "active",
                        "trained": "2026-10-06T11:07:00Z",
                        "dataset": "ds-canonical-30s",
                        "accuracy": 0.5062,
                        "precision": 0.7500,
                        "recall": 0.5062,
                        "f1": 0.6041,
                        "latency_ms": 1.8,
                        "memory_mb": 24.0,
                    }
                ],
                metadata={
                    "kernel": "rbf",
                    "nu": 0.05,
                    "calibration": "empirical_bounds",
                },
            )
            await ocsvm_reg.insert()
            logger.info("Seeded model registry: model-ocsvm-calibrated")

        ensemble_reg = await ModelRegistryEntry.find_one(
            ModelRegistryEntry.model_id == "model-fused-ensemble"
        )
        if not ensemble_reg:
            ensemble_reg = ModelRegistryEntry(
                model_id="model-fused-ensemble",
                name="Aegis Fused Biometric Ensemble",
                status="deployed",
                trained_at=datetime(2026, 10, 6, 11, 7, 0, tzinfo=timezone.utc),
                dataset_version="ds-canonical-30s:v1.0.0",
                algorithm="Weighted Fusion (0.60 LightGBM + 0.40 Calibrated OC-SVM)",
                feature_count=14,
                versions=[
                    {
                        "version": "v1.0.0",
                        "status": "active",
                        "trained": "2026-10-06T11:07:00Z",
                        "dataset": "ds-canonical-30s",
                        "accuracy": 0.5319,
                        "precision": 0.7732,
                        "recall": 0.5319,
                        "f1": 0.6303,
                        "latency_ms": 5.0,
                        "memory_mb": 72.0,
                    }
                ],
                metadata={
                    "fused_auc": 0.5596,
                    "operating_threshold": 0.7842,
                    "eer": 0.4681,
                    "weights": {"lightgbm": 0.60, "ocsvm": 0.40},
                },
            )
            await ensemble_reg.insert()
            logger.info("Seeded model registry: model-fused-ensemble")

        # 3. Behavioral Profiles for Enrolled Users
        import uuid as _uuid
        for uid_str in ENROLLED_USERS:
            try:
                user_uuid = _uuid.UUID(uid_str)
            except Exception:
                continue

            existing_profile = await BehavioralProfile.find_one(
                BehavioralProfile.user_id == user_uuid
            )
            if not existing_profile:
                profile = BehavioralProfile(
                    user_id=user_uuid,
                    status="MONITORING",
                    model_version="lgbm_ocsvm_v1",
                    feature_schema_version="v1",
                    sample_count=50,
                    accepted_windows_count=50,
                    baseline_stats={},
                    drift_score=0.02,
                    last_drift_evaluated_at=datetime.now(timezone.utc),
                    last_adapted_at=datetime.now(timezone.utc),
                )
                await profile.insert()
                logger.info("Seeded BehavioralProfile for enrolled user %s", uid_str)

    except Exception as exc:
        logger.warning("Governance metadata seed note: %s", exc)
