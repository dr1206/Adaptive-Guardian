"""
Model registry for loading, caching, and serving ML artifacts.

Loads:
- StandardScaler (14 canonical features)
- LightGBM behavioral classifier
- Per-user One-Class SVM anomaly detectors
- Calibration parameters
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any
import joblib

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[4]
MODELS_DIR = REPO_ROOT / "ml" / "models"

SCALER_PATH = MODELS_DIR / "standard_scaler.joblib"
LIGHTGBM_PATH = MODELS_DIR / "lightgbm_classifier.joblib"
CALIBRATION_PATH = MODELS_DIR / "ocsvm_calibration.joblib"


class ModelRegistry:
    _instance: ModelRegistry | None = None

    def __init__(self) -> None:
        self.scaler: Any = None
        self.lightgbm: Any = None
        self.ocsvm_models: dict[str, Any] = {}
        self.calibration: dict[str, Any] = {}
        self.loaded: bool = False
        self.reload()

    @classmethod
    def get_instance(cls) -> ModelRegistry:
        if cls._instance is None:
            cls._instance = ModelRegistry()
        return cls._instance

    def reload(self) -> bool:
        """Load all model artifacts from disk."""
        try:
            if SCALER_PATH.exists():
                self.scaler = joblib.load(SCALER_PATH)
            if LIGHTGBM_PATH.exists():
                self.lightgbm = joblib.load(LIGHTGBM_PATH)
            if CALIBRATION_PATH.exists():
                self.calibration = joblib.load(CALIBRATION_PATH)

            self.ocsvm_models.clear()
            for ocsvm_file in MODELS_DIR.glob("ocsvm_*.joblib"):
                if "calibration" in ocsvm_file.stem:
                    continue
                # user_id is the stem after 'ocsvm_'
                uid = ocsvm_file.stem.replace("ocsvm_", "")
                self.ocsvm_models[uid] = joblib.load(ocsvm_file)

            self.loaded = (
                self.scaler is not None
                and self.lightgbm is not None
                and len(self.ocsvm_models) > 0
            )
            logger.info(
                f"ModelRegistry loaded={self.loaded} (OC-SVM models: {list(self.ocsvm_models.keys())})"
            )
            return self.loaded
        except Exception as e:
            logger.error(f"Failed to load ML artifacts from {MODELS_DIR}: {e}")
            self.loaded = False
            return False

    def get_scaler(self) -> Any:
        return self.scaler

    def get_lightgbm(self) -> Any:
        return self.lightgbm

    def get_ocsvm(self, user_id: str) -> Any | None:
        return self.ocsvm_models.get(str(user_id).lower())


registry = ModelRegistry.get_instance()
