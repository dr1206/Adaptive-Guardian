from __future__ import annotations

import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


# ============================================================
# PATHS
# ============================================================

# adaptive-guardian/
# ├── backend/
# │   └── src/app/domain/security/ml_service.py
# │
# └── ml/
#     ├── models/
#     └── processed/

PROJECT_ROOT = Path(__file__).resolve().parents[5]
ML_ROOT = PROJECT_ROOT / "ml"

MODELS_DIR = ML_ROOT / "models"
PROCESSED_DIR = ML_ROOT / "processed"


# ============================================================
# MODEL FILES
# ============================================================

SCALER_PATH = MODELS_DIR / "standard_scaler.joblib"

LIGHTGBM_PATH = MODELS_DIR / "lightgbm_classifier.joblib"

SELECTED_FEATURES_PATH = (
    PROCESSED_DIR / "selected_features.txt"
)

CALIBRATION_PATH = (
    MODELS_DIR / "ocsvm_calibration.joblib"
)


# ============================================================
# USER OC-SVM MODELS
# ============================================================

OCSVM_MODELS = {
    "468f03a2-d7c9-4701-abf8-bb2c692f696b":
        MODELS_DIR
        / "ocsvm_468f03a2-d7c9-4701-abf8-bb2c692f696b.joblib",

    "4958d349-1ff1-4f6b-8344-fca7d4d717aa":
        MODELS_DIR
        / "ocsvm_4958d349-1ff1-4f6b-8344-fca7d4d717aa.joblib",

    "dba80c84-68fd-45b2-ba28-10f10075b239":
        MODELS_DIR
        / "ocsvm_dba80c84-68fd-45b2-ba28-10f10075b239.joblib",

    "e92e7c09-c1b8-4f72-a7a8-f75077608d1b":
        MODELS_DIR
        / "ocsvm_e92e7c09-c1b8-4f72-a7a8-f75077608d1b.joblib",
}


# ============================================================
# ALL FEATURES
# ============================================================

ALL_FEATURES = [
    "dwellMeanMs",
    "dwellStdMs",
    "flightMeanMs",
    "flightStdMs",
    "velocityMean",
    "accelerationMean",
    "accelerationStd",
    "curvatureMean",
    "curvatureStd",
    "clickCount",
    "scrollAmount",
    "mouseTravelPx",
]


# ============================================================
# BEHAVIORAL ML SERVICE
# ============================================================

class BehavioralMLService:

    def __init__(self) -> None:
        self.scaler = None
        self.lightgbm = None

        self.ocsvm_models: dict[str, object] = {}

        self.selected_features: list[str] = []

        # Per-user OC-SVM calibration bounds
        self.calibration_bounds: dict[str, dict[str, float]] = {}

        self.loaded = False

    # ========================================================
    # LOAD MODELS
    # ========================================================

    def load_models(self) -> None:
        """Load all trained ML models and calibration data."""

        logger.info(
            "Loading behavioral ML models..."
        )

        # ----------------------------------------------------
        # Check scaler
        # ----------------------------------------------------

        if not SCALER_PATH.exists():
            raise FileNotFoundError(
                f"Scaler not found: {SCALER_PATH}"
            )

        # ----------------------------------------------------
        # Check LightGBM
        # ----------------------------------------------------

        if not LIGHTGBM_PATH.exists():
            raise FileNotFoundError(
                f"LightGBM model not found: {LIGHTGBM_PATH}"
            )

        # ----------------------------------------------------
        # Check selected features
        # ----------------------------------------------------

        if not SELECTED_FEATURES_PATH.exists():
            raise FileNotFoundError(
                f"Selected feature file not found: "
                f"{SELECTED_FEATURES_PATH}"
            )

        # ----------------------------------------------------
        # Check calibration
        # ----------------------------------------------------

        if not CALIBRATION_PATH.exists():
            raise FileNotFoundError(
                f"OC-SVM calibration file not found: "
                f"{CALIBRATION_PATH}"
            )

        # ----------------------------------------------------
        # Load scaler
        # ----------------------------------------------------

        self.scaler = joblib.load(
            SCALER_PATH
        )

        # ----------------------------------------------------
        # Load LightGBM
        # ----------------------------------------------------

        self.lightgbm = joblib.load(
            LIGHTGBM_PATH
        )

        # ----------------------------------------------------
        # Load selected features
        # ----------------------------------------------------

        with open(
            SELECTED_FEATURES_PATH,
            "r",
            encoding="utf-8",
        ) as file:

            self.selected_features = [
                line.strip()
                for line in file
                if line.strip()
            ]

        if not self.selected_features:
            raise ValueError(
                "No selected features found."
            )

        # ----------------------------------------------------
        # Load OC-SVM models
        # ----------------------------------------------------

        for user_id, model_path in OCSVM_MODELS.items():

            if not model_path.exists():

                logger.warning(
                    "OC-SVM model missing for user %s: %s",
                    user_id,
                    model_path,
                )

                continue

            self.ocsvm_models[user_id] = (
                joblib.load(model_path)
            )

        if not self.ocsvm_models:
            raise RuntimeError(
                "No OC-SVM models were loaded."
            )

        # ----------------------------------------------------
        # Load OC-SVM calibration bounds
        # ----------------------------------------------------

        loaded_calibration = joblib.load(
            CALIBRATION_PATH
        )

        if not isinstance(
            loaded_calibration,
            dict,
        ):
            raise ValueError(
                "Invalid OC-SVM calibration format."
            )

        self.calibration_bounds = {
            str(user_id): {
                "lower_bound": float(
                    bounds["lower_bound"]
                ),
                "upper_bound": float(
                    bounds["upper_bound"]
                ),
            }
            for user_id, bounds
            in loaded_calibration.items()
        }

        if not self.calibration_bounds:
            raise RuntimeError(
                "No OC-SVM calibration bounds were loaded."
            )

        # ----------------------------------------------------
        # Verify every loaded OC-SVM has calibration
        # ----------------------------------------------------

        for user_id in self.ocsvm_models:

            if user_id not in self.calibration_bounds:

                raise ValueError(
                    "Missing OC-SVM calibration for "
                    f"user: {user_id}"
                )

        self.loaded = True

        # ----------------------------------------------------
        # Logging
        # ----------------------------------------------------

        logger.info(
            "Behavioral ML models loaded successfully."
        )

        logger.info(
            "Selected features: %s",
            self.selected_features,
        )

        logger.info(
            "OC-SVM models loaded: %d",
            len(self.ocsvm_models),
        )

        logger.info(
            "OC-SVM calibration loaded: %d users",
            len(self.calibration_bounds),
        )

    # ========================================================
    # PREDICT
    # ========================================================

    def predict(
        self,
        user_id: str,
        features: dict[str, float],
    ) -> dict[str, float | str]:
        """
        Run behavioral authentication.

        Returns:

        lightgbm_score
        ocsvm_anomaly_score
        fused_score
        decision
        """

        # ----------------------------------------------------
        # Make sure models are loaded
        # ----------------------------------------------------

        if not self.loaded:
            raise RuntimeError(
                "Behavioral ML models are not loaded."
            )

        # ----------------------------------------------------
        # Make sure user's OC-SVM exists
        # ----------------------------------------------------

        if user_id not in self.ocsvm_models:
            raise ValueError(
                f"No OC-SVM model available for user: "
                f"{user_id}"
            )

        # ----------------------------------------------------
        # Make sure user's calibration exists
        # ----------------------------------------------------

        if user_id not in self.calibration_bounds:
            raise ValueError(
                f"No OC-SVM calibration available for user: "
                f"{user_id}"
            )

        # ====================================================
        # CHECK FEATURES
        # ====================================================

        missing = [
            feature
            for feature in ALL_FEATURES
            if feature not in features
        ]

        if missing:
            raise ValueError(
                f"Missing behavioral features: {missing}"
            )

        # ====================================================
        # CREATE DATAFRAME
        # ====================================================

        dataframe = pd.DataFrame(
            [
                [
                    features[name]
                    for name in ALL_FEATURES
                ]
            ],
            columns=ALL_FEATURES,
        )

        # ----------------------------------------------------
        # Convert everything to float
        # ----------------------------------------------------

        dataframe = dataframe.astype(float)

        # ----------------------------------------------------
        # Check NaN / infinity
        # ----------------------------------------------------

        if not np.isfinite(
            dataframe.to_numpy()
        ).all():

            raise ValueError(
                "Behavioral features contain "
                "NaN or infinite values."
            )

        # ====================================================
        # STANDARDIZATION
        # ====================================================

        normalized = self.scaler.transform(
            dataframe
        )

        normalized_df = pd.DataFrame(
            normalized,
            columns=ALL_FEATURES,
        )

        # ====================================================
        # SELECT THE 8 FEATURES
        # ====================================================

        model_input = normalized_df[
            self.selected_features
        ]

        # ====================================================
        # LIGHTGBM
        # ====================================================

        lightgbm_score = float(
            self.lightgbm.predict_proba(
                model_input
            )[0][1]
        )

        # ====================================================
        # OC-SVM
        # ====================================================

        ocsvm = self.ocsvm_models[user_id]

        raw_score = float(
            ocsvm.decision_function(
                model_input
            )[0]
        )

        # ----------------------------------------------------
        # Calibrate OC-SVM score using training genuine
        # 5th and 95th percentile bounds.
        #
        # This is the SAME calibration method used during
        # offline model evaluation.
        # ----------------------------------------------------

        bounds = self.calibration_bounds[user_id]

        lower_bound = bounds["lower_bound"]
        upper_bound = bounds["upper_bound"]

        if upper_bound <= lower_bound:
            raise ValueError(
                "Invalid OC-SVM calibration bounds for "
                f"user: {user_id}"
            )

        normal_score = (
            (raw_score - lower_bound)
            / (upper_bound - lower_bound)
        )

        normal_score = float(
            np.clip(
                normal_score,
                0.0,
                1.0,
            )
        )

        # 0 = normal
        # 1 = anomalous

        anomaly_score = float(
            1.0 - normal_score
        )

        # ====================================================
        # FUSION
        # ====================================================

        fused_score = (
            0.6 * lightgbm_score
            + 0.4 * anomaly_score
        )

        fused_score = float(
            np.clip(
                fused_score,
                0.0,
                1.0,
            )
        )

        # ====================================================
        # SECURITY DECISION
        # ====================================================

        # Higher fused score = more suspicious.
        #
        # < 0.60       -> ALLOW
        # 0.60 - 0.85  -> WARN
        # >= 0.85      -> CHALLENGE

        if fused_score < 0.60:

            decision = "ALLOW"

        elif fused_score < 0.85:

            decision = "WARN"

        else:

            decision = "CHALLENGE"

        # ====================================================
        # RETURN RESULT
        # ====================================================

        return {
            "lightgbm_score": round(
                lightgbm_score,
                6,
            ),

            "ocsvm_anomaly_score": round(
                anomaly_score,
                6,
            ),

            "fused_score": round(
                fused_score,
                6,
            ),

            "decision": decision,
        }


# ============================================================
# SINGLETON
# ============================================================

behavioral_ml_service = BehavioralMLService()