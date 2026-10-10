from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any
import joblib
import numpy as np
import pandas as pd
import shap

logger = logging.getLogger(__name__)

MODEL_VERSION = "v2.6.0-weighted-fusion"


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[5]
ML_ROOT = PROJECT_ROOT / "ml"

MODELS_DIR = ML_ROOT / "models"
PROCESSED_DIR = ML_ROOT / "processed"


# ============================================================
# MODEL ARTIFACT PATHS
# ============================================================

SCALER_PATH = MODELS_DIR / "standard_scaler.joblib"
LIGHTGBM_PATH = MODELS_DIR / "lightgbm_classifier.joblib"
SELECTED_FEATURES_PATH = PROCESSED_DIR / "selected_features.txt"
CALIBRATION_PATH = MODELS_DIR / "ocsvm_calibration.joblib"
USER_BASELINES_PATH = MODELS_DIR / "user_baselines.json"


# ============================================================
# USER IDS
# ============================================================

ENROLLED_USERS = [
    "468f03a2-d7c9-4701-abf8-bb2c692f696b",  # Manasa
    "4958d349-1ff1-4f6b-8344-fca7d4d717aa",  # Vyas
    "dba80c84-68fd-45b2-ba28-10f10075b239",  # Dristi
    "e92e7c09-c1b8-4f72-a7a8-f75077608d1b",  # Amal
]


USER_BASELINES: dict[str, dict[str, float]] = {
    "468f03a2-d7c9-4701-abf8-bb2c692f696b": {  # Manasa
        "accelerationMean": -0.6976,
        "accelerationStd": 17.5896,
        "clickCount": 4.0,
        "curvatureMean": 0.3734,
        "curvatureStd": 0.5517,
        "dwellMeanMs": 146.12,
        "dwellStdMs": 36.06,
        "flightMeanMs": 426.2,
        "flightStdMs": 454.49,
        "keysPerSec": 1.73,
        "mouseTravelPx": 1951.65,
        "scrollAmount": 210.0,
        "velocityMean": 708.7511,
        "velocityStd": 1087.6316,
    },
    "4958d349-1ff1-4f6b-8344-fca7d4d717aa": {  # Vyas
        "accelerationMean": -0.8707,
        "accelerationStd": 20.5471,
        "clickCount": 3.0,
        "curvatureMean": 0.1943,
        "curvatureStd": 0.3545,
        "dwellMeanMs": 0.0,
        "dwellStdMs": 0.0,
        "flightMeanMs": 0.0,
        "flightStdMs": 0.0,
        "keysPerSec": 0.0,
        "mouseTravelPx": 6952.62,
        "scrollAmount": 4027.0,
        "velocityMean": 855.897,
        "velocityStd": 1364.8796,
    },
    "dba80c84-68fd-45b2-ba28-10f10075b239": {  # Dristi
        "accelerationMean": -1.4509,
        "accelerationStd": 10.6837,
        "clickCount": 5.0,
        "curvatureMean": 0.4159,
        "curvatureStd": 0.5692,
        "dwellMeanMs": 116.49,
        "dwellStdMs": 24.96,
        "flightMeanMs": 373.27,
        "flightStdMs": 468.89,
        "keysPerSec": 1.37,
        "mouseTravelPx": 1497.1,
        "scrollAmount": 0.0,
        "velocityMean": 411.3811,
        "velocityStd": 587.4265,
    },
    "e92e7c09-c1b8-4f72-a7a8-f75077608d1b": {  # Amal
        "accelerationMean": -0.2591,
        "accelerationStd": 12.9912,
        "clickCount": 3.0,
        "curvatureMean": 0.2955,
        "curvatureStd": 0.4067,
        "dwellMeanMs": 0.0,
        "dwellStdMs": 0.0,
        "flightMeanMs": 0.0,
        "flightStdMs": 0.0,
        "keysPerSec": 0.0,
        "mouseTravelPx": 6900.6,
        "scrollAmount": 700.0,
        "velocityMean": 549.8736,
        "velocityStd": 709.7897,
    },
}

DEFAULT_BASELINE: dict[str, float] = {
    "accelerationMean": 0.63,
    "accelerationStd": 6.74,
    "clickCount": 4.98,
    "curvatureMean": 0.30,
    "curvatureStd": 0.21,
    "dwellMeanMs": 100.72,
    "dwellStdMs": 26.42,
    "flightMeanMs": 93.80,
    "flightStdMs": 25.56,
    "keysPerSec": 4.1,
    "mouseTravelPx": 21629.7,
    "scrollAmount": 335.4,
    "velocityMean": 1052.97,
    "velocityStd": 138.7,
}


# ============================================================
# CANONICAL 14 FEATURES (Shared across Training & Live Inference)
# ============================================================

ALL_FEATURES = [
    "accelerationMean",
    "accelerationStd",
    "clickCount",
    "curvatureMean",
    "curvatureStd",
    "dwellMeanMs",
    "dwellStdMs",
    "flightMeanMs",
    "flightStdMs",
    "keysPerSec",
    "mouseTravelPx",
    "scrollAmount",
    "velocityMean",
    "velocityStd",
]


CANONICAL_USER_ALIASES: dict[str, str] = {
    "468f03a2-d7c9-4701-abf8-bb2c692f696b": "468f03a2-d7c9-4701-abf8-bb2c692f696b",
    "4958d349-1ff1-4f6b-8344-fca7d4d717aa": "4958d349-1ff1-4f6b-8344-fca7d4d717aa",
    "dba80c84-68fd-45b2-ba28-10f10075b239": "dba80c84-68fd-45b2-ba28-10f10075b239",
    "e92e7c09-c1b8-4f72-a7a8-f75077608d1b": "e92e7c09-c1b8-4f72-a7a8-f75077608d1b",
    "manasa": "468f03a2-d7c9-4701-abf8-bb2c692f696b",
    "manasa@adaptiveguardian.dev": "468f03a2-d7c9-4701-abf8-bb2c692f696b",
    "vyas": "4958d349-1ff1-4f6b-8344-fca7d4d717aa",
    "vyas@adaptiveguardian.dev": "4958d349-1ff1-4f6b-8344-fca7d4d717aa",
    "dristi": "dba80c84-68fd-45b2-ba28-10f10075b239",
    "dristi@adaptiveguardian.dev": "dba80c84-68fd-45b2-ba28-10f10075b239",
    "amal": "e92e7c09-c1b8-4f72-a7a8-f75077608d1b",
    "amal@adaptiveguardian.dev": "e92e7c09-c1b8-4f72-a7a8-f75077608d1b",
}


# ============================================================
# BEHAVIORAL ML SERVICE
# ============================================================

class BehavioralMLService:

    def __init__(self) -> None:
        self.scaler: Any = None
        self.lightgbm: Any = None
        self.lgbm_models: dict[str, Any] = {}
        self.ocsvm_models: dict[str, Any] = {}
        self.explainers: dict[str, Any] = {}
        self.selected_features: list[str] = list(ALL_FEATURES)
        self.calibration_bounds: dict[str, dict[str, float]] = {}
        self.dynamic_baselines: dict[str, dict[str, float]] = {}
        self.loaded: bool = False

    def load_models(self) -> None:
        """Load all trained ML models and calibration data."""
        logger.info("Loading canonical behavioral ML models...")

        if not SCALER_PATH.exists():
            raise FileNotFoundError(f"Scaler not found: {SCALER_PATH}")
        if not LIGHTGBM_PATH.exists():
            raise FileNotFoundError(f"LightGBM model not found: {LIGHTGBM_PATH}")
        if not CALIBRATION_PATH.exists():
            raise FileNotFoundError(f"OC-SVM calibration not found: {CALIBRATION_PATH}")

        self.scaler = joblib.load(SCALER_PATH)
        self.lightgbm = joblib.load(LIGHTGBM_PATH)

        if SELECTED_FEATURES_PATH.exists():
            with open(SELECTED_FEATURES_PATH, "r", encoding="utf-8") as f:
                self.selected_features = [line.strip() for line in f if line.strip()]
        else:
            self.selected_features = list(ALL_FEATURES)

        # Load dynamic baselines if present
        self.dynamic_baselines.clear()
        if USER_BASELINES_PATH.exists():
            try:
                import json
                with open(USER_BASELINES_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.dynamic_baselines = {str(k).lower(): v for k, v in data.items()}
            except Exception as e:
                logger.warning(f"Error loading user_baselines.json: {e}")

        # Load OC-SVM models
        self.ocsvm_models.clear()
        for ocsvm_file in MODELS_DIR.glob("ocsvm_*.joblib"):
            if "calibration" in ocsvm_file.stem:
                continue
            uid = ocsvm_file.stem.replace("ocsvm_", "").lower()
            self.ocsvm_models[uid] = joblib.load(ocsvm_file)

        # Load per-user LightGBM models
        self.lgbm_models.clear()
        for lgbm_file in MODELS_DIR.glob("lightgbm_*.joblib"):
            if "classifier" in lgbm_file.stem:
                continue
            uid = lgbm_file.stem.replace("lightgbm_", "").lower()
            self.lgbm_models[uid] = joblib.load(lgbm_file)

        # Load calibration
        loaded_calib = joblib.load(CALIBRATION_PATH)
        if isinstance(loaded_calib, dict):
            self.calibration_bounds = {
                str(k).lower(): {
                    "lower_bound": float(v.get("lower_bound", v.get("min_decision_function", -0.1))),
                    "upper_bound": float(v.get("upper_bound", v.get("max_decision_function", 0.5))),
                }
                for k, v in loaded_calib.items()
                if isinstance(v, dict)
            }

        # Build TreeExplainer for SHAP explanations
        self.explainers.clear()
        try:
            self.explainers["default"] = shap.TreeExplainer(self.lightgbm)
            for uid, model in self.lgbm_models.items():
                self.explainers[uid] = shap.TreeExplainer(model)
        except Exception as e:
            logger.warning(f"Note creating TreeExplainer: {e}")

        self.loaded = bool(self.scaler and self.lightgbm and self.ocsvm_models)
        logger.info(
            f"BehavioralMLService loaded={self.loaded} (OC-SVM: {len(self.ocsvm_models)}, LGBM: {len(self.lgbm_models)})"
        )

    def resolve_user_id(self, identifier: Any) -> str:
        if not identifier:
            return "468f03a2-d7c9-4701-abf8-bb2c692f696b"
        raw = str(identifier).strip().lower()
        if raw in CANONICAL_USER_ALIASES:
            return CANONICAL_USER_ALIASES[raw]
        for alias, uid in CANONICAL_USER_ALIASES.items():
            if alias in raw:
                return uid
        return raw

    def get_baseline(self, uid_str: str) -> dict[str, float]:
        uid_str = str(uid_str).lower()
        resolved = self.resolve_user_id(uid_str)
        if resolved in self.dynamic_baselines:
            return self.dynamic_baselines[resolved]
        if uid_str in self.dynamic_baselines:
            return self.dynamic_baselines[uid_str]
        return USER_BASELINES.get(resolved, USER_BASELINES.get(uid_str, DEFAULT_BASELINE))

    def is_user_enrolled(self, uid_str: str) -> bool:
        uid_str = str(uid_str).lower()
        resolved = self.resolve_user_id(uid_str)
        has_ocsvm = resolved in self.ocsvm_models or uid_str in self.ocsvm_models
        has_dyn = resolved in self.dynamic_baselines or uid_str in self.dynamic_baselines
        has_static = (
            (resolved in USER_BASELINES and USER_BASELINES[resolved] is not DEFAULT_BASELINE)
            or (uid_str in USER_BASELINES and USER_BASELINES[uid_str] is not DEFAULT_BASELINE)
        )
        return bool(has_ocsvm or has_dyn or has_static)

    def reset_user(self, uid_str: str) -> None:
        """Clear user models, baseline, and reset to collection mode."""
        uid_str = str(uid_str).lower()
        self.ocsvm_models.pop(uid_str, None)
        self.lgbm_models.pop(uid_str, None)
        self.calibration_bounds.pop(uid_str, None)
        self.explainers.pop(uid_str, None)
        self.dynamic_baselines.pop(uid_str, None)
        USER_BASELINES.pop(uid_str, None)

        ocsvm_file = MODELS_DIR / f"ocsvm_{uid_str}.joblib"
        if ocsvm_file.exists():
            try:
                ocsvm_file.unlink()
            except Exception:
                pass

        lgbm_file = MODELS_DIR / f"lightgbm_{uid_str}.joblib"
        if lgbm_file.exists():
            try:
                lgbm_file.unlink()
            except Exception:
                pass

        if USER_BASELINES_PATH.exists():
            try:
                import json
                with open(USER_BASELINES_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if uid_str in data:
                    del data[uid_str]
                    with open(USER_BASELINES_PATH, "w", encoding="utf-8") as f:
                        json.dump(data, f, indent=2)
            except Exception as e:
                logger.warning(f"Error updating user_baselines.json: {e}")

        if CALIBRATION_PATH.exists():
            try:
                calib = joblib.load(CALIBRATION_PATH)
                if uid_str in calib:
                    del calib[uid_str]
                    joblib.dump(calib, CALIBRATION_PATH)
            except Exception as e:
                logger.warning(f"Error updating calibration: {e}")

    def enroll_user(
        self,
        uid_str: str,
        baseline: dict[str, float],
        ocsvm_model: Any,
        calib_bounds: dict[str, float],
        lgbm_model: Any | None = None,
    ) -> None:
        """Enroll or update authentic user baseline and model in-memory and disk."""
        uid_str = str(uid_str).lower()
        self.ocsvm_models[uid_str] = ocsvm_model
        self.calibration_bounds[uid_str] = calib_bounds
        self.dynamic_baselines[uid_str] = baseline
        USER_BASELINES[uid_str] = baseline

        if lgbm_model is not None:
            self.lgbm_models[uid_str] = lgbm_model
            lgbm_file = MODELS_DIR / f"lightgbm_{uid_str}.joblib"
            try:
                joblib.dump(lgbm_model, lgbm_file)
            except Exception as e:
                logger.warning(f"Error saving lightgbm_{uid_str}.joblib: {e}")

        ocsvm_file = MODELS_DIR / f"ocsvm_{uid_str}.joblib"
        joblib.dump(ocsvm_model, ocsvm_file)

        try:
            import json
            current = {}
            if USER_BASELINES_PATH.exists():
                with open(USER_BASELINES_PATH, "r", encoding="utf-8") as f:
                    current = json.load(f)
            current[uid_str] = baseline
            with open(USER_BASELINES_PATH, "w", encoding="utf-8") as f:
                json.dump(current, f, indent=2)
        except Exception as e:
            logger.warning(f"Error saving user_baselines.json: {e}")

        try:
            calib = {}
            if CALIBRATION_PATH.exists():
                calib = joblib.load(CALIBRATION_PATH)
            calib[uid_str] = calib_bounds
            joblib.dump(calib, CALIBRATION_PATH)
        except Exception as e:
            logger.warning(f"Error saving calibration: {e}")

    def predict(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """
        Run continuous behavioral authentication scoring.
        Robust to parameter ordering and keyword arguments.
        Returns:
          - lightgbm_score (anomaly prob, 0=genuine, 1=impostor)
          - ocsvm_anomaly_score (calibrated anomaly prob, 0=genuine, 1=impostor)
          - fused_score (weighted ensemble risk score)
          - decision ("ALLOW", "WARN", "CHALLENGE")
          - top_contributors (real TreeSHAP feature contributions)
        """
        user_id = None
        features = None

        if len(args) == 1:
            if isinstance(args[0], dict):
                features = args[0]
            else:
                user_id = args[0]
        elif len(args) >= 2:
            if isinstance(args[0], dict):
                features, user_id = args[0], args[1]
            else:
                user_id, features = args[0], args[1]

        if "user_id" in kwargs:
            user_id = kwargs["user_id"]
        if "features" in kwargs:
            features = kwargs["features"]

        if not self.loaded:
            self.load_models()

        raw_uid = str(user_id or kwargs.get("email", "")).lower()
        uid_str = self.resolve_user_id(raw_uid)

        features = features or {}

        # If user is in fresh data collection mode and has no enrolled baseline,
        # return benign ALLOW so data collection is never blocked or challenged
        if not self.is_user_enrolled(uid_str):
            logger.info(f"User {uid_str} is in data collection / enrollment mode. Allowing session.")
            return {
                "lightgbm_score": 0.15,
                "ocsvm_anomaly_score": 0.15,
                "fused_score": 0.15,
                "decision": "ALLOW",
                "top_contributors": [
                    {
                        "feature": "enrollment_active",
                        "value": 0.0,
                        "shap_value": 0.0,
                        "direction": "supports authentic",
                    }
                ],
            }

        # Baseline lookup
        baseline = self.get_baseline(uid_str)

        # Detect active modalities in this window
        has_typing = (
            features.get("dwellMeanMs", 0.0) > 0.0
            or features.get("flightMeanMs", 0.0) > 0.0
            or features.get("keysPerSec", 0.0) > 0.0
        )
        has_mouse = (
            features.get("mouseTravelPx", 0.0) > 0.0
            or features.get("velocityMean", 0.0) > 0.0
            or features.get("clickCount", 0.0) > 0.0
        )

        # If completely idle (zero keyboard, zero mouse events), return benign ALLOW
        if not has_typing and not has_mouse:
            logger.info("Empty idle behavioral window received for user %s. Allowing session.", uid_str)
            return {
                "lightgbm_score": 0.05,
                "ocsvm_anomaly_score": 0.05,
                "fused_score": 0.05,
                "decision": "ALLOW",
                "top_contributors": [],
                "model_version": MODEL_VERSION,
            }

        # Build clean input DataFrame in authoritative ALL_FEATURES column order
        # using actual measured window features without artificial baseline contamination
        row_vals = []
        for name in ALL_FEATURES:
            val = features.get(name, 0.0)
            if val is None or np.isnan(val) or np.isinf(val):
                val = 0.0
            row_vals.append(float(val))

        dataframe = pd.DataFrame([row_vals], columns=ALL_FEATURES)

        # Raw features for LightGBM (gradient boosted trees fitted on unscaled domain metrics)
        raw_input = dataframe[self.selected_features]

        # StandardScaled features for One-Class SVM (RBF kernel requires scaling)
        normalized = self.scaler.transform(dataframe)
        normalized_df = pd.DataFrame(normalized, columns=ALL_FEATURES)
        scaled_input = normalized_df[self.selected_features]

        # 1. LightGBM scoring (Personalized model if available, else baseline z-score)
        lgbm_model = self.lgbm_models.get(uid_str) or self.lgbm_models.get(raw_uid)
        if lgbm_model:
            try:
                lgbm_probs = lgbm_model.predict_proba(raw_input)[0]
                classes = list(getattr(lgbm_model, "classes_", [0, 1]))
                if 0 in classes:
                    idx_imp = classes.index(0)
                    lightgbm_score = float(lgbm_probs[idx_imp])
                elif len(lgbm_probs) > 1:
                    lightgbm_score = float(1.0 - lgbm_probs[1])
                else:
                    lightgbm_score = float(lgbm_probs[0])
            except Exception as e:
                logger.warning(f"LightGBM prediction error: {e}")
                lightgbm_score = 0.12
        else:
            z_diffs = []
            for k in ALL_FEATURES:
                b_val = float(baseline.get(k, 0.0))
                f_val = float(features.get(k, b_val))
                if b_val != 0:
                    z_diffs.append(abs(f_val - b_val) / max(1.0, abs(b_val) * 0.25))
            mean_z = float(np.mean(z_diffs)) if z_diffs else 0.0
            lightgbm_score = float(np.clip((mean_z - 0.5) / 2.5, 0.05, 0.85))

        # 2. OC-SVM scoring with calibrated sigmoid anomaly probability
        ocsvm_model = self.ocsvm_models.get(uid_str) or self.ocsvm_models.get(raw_uid)
        if ocsvm_model:
            raw_score = float(ocsvm_model.decision_function(scaled_input)[0])
            # Calibrated steep sigmoid anomaly probability (temperature k=2.8):
            # raw_score > 0 (inside authentic boundary) -> anomaly_score < 0.50
            # raw_score < 0 (outside boundary / anomaly) -> anomaly_score > 0.50
            anomaly_score = float(np.clip(1.0 / (1.0 + np.exp(2.8 * raw_score)), 0.0, 1.0))
        else:
            anomaly_score = lightgbm_score

        # 3. Score Fusion: 0.65 * LightGBM + 0.35 * OC-SVM (calibrated experimental weights)
        fused_score = float(np.clip(0.65 * lightgbm_score + 0.35 * anomaly_score, 0.0, 1.0))

        # 4. Security Decision Thresholds (Production Continuous Biometric Rule)
        # < 0.45       -> ALLOW
        # 0.45 - 0.65  -> WARN (Continuous behavioral warning banner)
        # >= 0.65      -> CHALLENGE (Step-up biometric / OTP verification modal)
        if fused_score < 0.45:
            decision = "ALLOW"
        elif fused_score < 0.65:
            decision = "WARN"
        else:
            decision = "CHALLENGE"

        # 5. Real TreeSHAP Explainability
        top_contributors = []
        try:
            explainer = self.explainers.get(uid_str, self.explainers.get("default"))
            if explainer:
                shap_vals = explainer.shap_values(raw_input)
                # For binary LightGBM, shap_values can be list of arrays [class0, class1] or 2D array
                if isinstance(shap_vals, list) and len(shap_vals) > 1:
                    raw_shaps = shap_vals[1][0]
                elif isinstance(shap_vals, np.ndarray) and shap_vals.ndim == 2:
                    raw_shaps = shap_vals[0]
                else:
                    raw_shaps = np.array(shap_vals).flatten()

                # Rank by absolute SHAP impact
                ranked_indices = np.argsort(np.abs(raw_shaps))[::-1]
                for idx in ranked_indices[:4]:
                    feat_name = self.selected_features[idx]
                    feat_val = float(features.get(feat_name, 0.0))
                    impact = float(raw_shaps[idx])
                    direction = "increases risk" if impact > 0 else "supports authentic"
                    top_contributors.append({
                        "feature": feat_name,
                        "value": round(feat_val, 2),
                        "shap_value": round(impact, 4),
                        "direction": direction,
                    })
        except Exception as shap_err:
            logger.debug(f"TreeSHAP calculation note: {shap_err}")

        logger.info(
            "Continuous auth evaluated for user=%s: fusion=%.4f (lgbm=%.4f, ocsvm=%.4f) -> %s [version=%s]",
            uid_str, fused_score, lightgbm_score, anomaly_score, decision, MODEL_VERSION,
        )

        return {
            "lightgbm_score": round(lightgbm_score, 4),
            "ocsvm_anomaly_score": round(anomaly_score, 4),
            "fused_score": round(fused_score, 4),
            "decision": decision,
            "top_contributors": top_contributors,
            "model_version": MODEL_VERSION,
        }

    def evaluate_drift(
        self,
        features: dict[str, float],
        baseline_stats: dict[str, dict[str, float]],
    ) -> float:
        """
        Compute normalized Z-score Euclidean drift against user's established baseline.
        Returns drift index >= 0.0 (values > 2.5 indicate significant drift).
        """
        if not baseline_stats:
            return 0.0

        z_scores = []
        for feat, stats in baseline_stats.items():
            mean = stats.get("mean", 0.0)
            std = max(1e-4, stats.get("std", 1.0))
            val = float(features.get(feat, mean))
            z = abs((val - mean) / std)
            z_scores.append(min(z, 5.0))  # clip outliers

        if not z_scores:
            return 0.0
        return float(np.mean(z_scores))

    async def update_profile_adaptive(
        self,
        user_id: str,
        features: dict[str, float],
        confidence: float,
        outcome: str,
    ) -> bool:
        """
        Adaptive learning safeguard:
        - Only learns when outcome == 'ALLOW' and confidence >= 0.85
        - Rejects poisoned sessions or high drift (> 2.5 Z-score)
        - Updates running feature mean and std incrementally
        """
        if outcome.lower() != "allow" or confidence < 0.85:
            return False

        try:
            import uuid as _uuid
            from datetime import datetime, timezone
            from app.domain.admin.models import BehavioralProfile

            uid_obj = _uuid.UUID(str(user_id))
            profile = await BehavioralProfile.find_one(BehavioralProfile.user_id == uid_obj)
            if not profile:
                profile = BehavioralProfile(
                    user_id=uid_obj,
                    status="MONITORING",
                    sample_count=1,
                    accepted_windows_count=1,
                    baseline_stats={},
                )

            # Check drift against existing baseline
            drift = self.evaluate_drift(features, profile.baseline_stats)
            if drift > 2.5:
                logger.info("Adaptive update rejected due to excessive drift (%.2f > 2.5) for user %s", drift, user_id)
                return False

            # Incremental Welford update for baseline stats
            stats = dict(profile.baseline_stats)
            n = profile.accepted_windows_count + 1
            for feat in ALL_FEATURES:
                x = float(features.get(feat, 0.0))
                if feat not in stats:
                    stats[feat] = {"mean": x, "std": 1.0}
                else:
                    curr_mean = stats[feat].get("mean", x)
                    curr_std = stats[feat].get("std", 1.0)
                    new_mean = curr_mean + (x - curr_mean) / n
                    new_var = ((n - 1) * (curr_std ** 2) + (x - curr_mean) * (x - new_mean)) / max(1, n)
                    stats[feat] = {"mean": round(new_mean, 4), "std": round(math.sqrt(max(1e-4, new_var)), 4)}

            profile.baseline_stats = stats
            profile.accepted_windows_count = n
            profile.sample_count = profile.sample_count + 1
            profile.drift_score = round(drift, 4)
            profile.last_drift_evaluated_at = datetime.now(timezone.utc)
            profile.last_adapted_at = datetime.now(timezone.utc)
            profile.updated_at = datetime.now(timezone.utc)
            await profile.save()
            return True
        except Exception as e:
            logger.warning("Adaptive profile update note for user %s: %s", user_id, e)
            return False


# Global singleton instance
behavioral_ml_service = BehavioralMLService()
try:
    behavioral_ml_service.load_models()
except Exception as _e:
    logger.debug(f"BehavioralMLService initial auto-load note: {_e}")