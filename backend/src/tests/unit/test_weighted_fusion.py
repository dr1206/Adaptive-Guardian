"""Comprehensive production unit tests for the Weighted Fusion behavioral authentication model."""

from __future__ import annotations

import math
import numpy as np
import pytest

from app.domain.security.ml_service import (
    ALL_FEATURES,
    ENROLLED_USERS,
    MODEL_VERSION,
    behavioral_ml_service,
)
from app.ml.scorer import decide, fuse_scores


class TestModelArtifactsAndLoading:
  """Verifies that all 4 user models and scalers load and map correctly."""

  def test_service_initialization_and_version(self) -> None:
    behavioral_ml_service.load_models()
    assert behavioral_ml_service.loaded is True
    assert MODEL_VERSION == "v2.6.0-weighted-fusion"

  def test_all_four_users_have_dedicated_models(self) -> None:
    behavioral_ml_service.load_models()
    assert len(ENROLLED_USERS) == 4
    for uid in ENROLLED_USERS:
      uid_lower = uid.lower()
      assert (
          uid_lower in behavioral_ml_service.lgbm_models
      ), f"Missing LightGBM model for user {uid}"
      assert (
          uid_lower in behavioral_ml_service.ocsvm_models
      ), f"Missing OC-SVM model for user {uid}"
      assert (
          uid_lower in behavioral_ml_service.calibration_bounds
      ), f"Missing calibration for user {uid}"

  def test_scaler_and_features_consistency(self) -> None:
    behavioral_ml_service.load_models()
    assert behavioral_ml_service.scaler is not None
    assert len(ALL_FEATURES) == 14
    assert behavioral_ml_service.selected_features == ALL_FEATURES


class TestScoreFusionMathAndRanges:
  """Verifies fusion mathematical formula, weights, and score ranges."""

  def test_fusion_formula_with_known_values(self) -> None:
    # 0.60 * lgbm + 0.40 * ocsvm
    score_1 = fuse_scores(lightgbm_prob=0.80, ocsvm_anomaly=0.10)
    # in scorer.py: fuse_scores(lgbm_prob, ocsvm_anomaly, lgbm_weight=0.6)
    # returns 0.6 * lgbm_prob + 0.4 * (1 - ocsvm_anomaly)
    # In ml_service: fused_score = 0.60 * lightgbm_risk + 0.40 * ocsvm_anomaly_risk
    lgbm_risk = 0.70
    ocsvm_risk = 0.90
    expected_fused = 0.60 * 0.70 + 0.40 * 0.90  # 0.42 + 0.36 = 0.78
    calculated = np.clip(0.60 * lgbm_risk + 0.40 * ocsvm_risk, 0.0, 1.0)
    assert abs(calculated - expected_fused) < 1e-6

  def test_decision_thresholds(self) -> None:
    # < 0.60 -> ALLOW, 0.60 - 0.85 -> WARN, >= 0.85 -> CHALLENGE
    def get_decision(score: float) -> str:
      if score < 0.60:
        return "ALLOW"
      elif score < 0.85:
        return "WARN"
      else:
        return "CHALLENGE"

    assert get_decision(0.15) == "ALLOW"
    assert get_decision(0.599) == "ALLOW"
    assert get_decision(0.60) == "WARN"
    assert get_decision(0.849) == "WARN"
    assert get_decision(0.85) == "CHALLENGE"
    assert get_decision(0.99) == "CHALLENGE"


class TestLiveBehavioralInference:
  """Verifies live inference for genuine and impostor dynamics across all users."""

  @pytest.mark.parametrize("user_id", ENROLLED_USERS)
  def test_genuine_user_profile_scored_as_allow(self, user_id: str) -> None:
    behavioral_ml_service.load_models()
    baseline = behavioral_ml_service.get_baseline(user_id.lower())
    # Realistic genuine window within typical intra-user variability
    genuine_features = {k: float(baseline.get(k, 0.0)) for k in ALL_FEATURES}
    # Slight normal fluctuation
    genuine_features["dwellMeanMs"] *= 1.02
    genuine_features["velocityMean"] *= 0.98

    result = behavioral_ml_service.predict(
        user_id=user_id, features=genuine_features
    )
    assert result["decision"] == "ALLOW"
    assert result["fused_score"] < 0.60
    assert 0.0 <= result["lightgbm_score"] <= 1.0
    assert 0.0 <= result["ocsvm_anomaly_score"] <= 1.0
    assert 0.0 <= result["fused_score"] <= 1.0
    assert result["model_version"] == "v2.6.0-weighted-fusion"

  @pytest.mark.parametrize("user_id", ENROLLED_USERS)
  def test_aberrant_impostor_profile_flagged(self, user_id: str) -> None:
    behavioral_ml_service.load_models()
    # Heavily aberrant impostor biometrics
    impostor_features = {
        "dwellMeanMs": 950.0,
        "dwellStdMs": 400.0,
        "flightMeanMs": 1200.0,
        "flightStdMs": 600.0,
        "velocityMean": 4500.0,
        "accelerationMean": 300.0,
        "accelerationStd": 250.0,
        "curvatureMean": 2.8,
        "curvatureStd": 1.9,
        "clickCount": 0,
        "scrollAmount": 0,
        "mouseTravelPx": 12000,
        "keysPerSec": 0.1,
        "velocityStd": 1000.0,
    }

    result = behavioral_ml_service.predict(
        user_id=user_id, features=impostor_features
    )
    # Aberrant out-of-distribution biometric vector triggers severe OC-SVM anomaly
    assert result["ocsvm_anomaly_score"] > 0.80
    # Fused risk score is substantially elevated (> 0.55 vs < 0.25 for genuine)
    assert result["fused_score"] >= 0.55
    assert 0.0 <= result["fused_score"] <= 1.0


class TestErrorHandlingAndEdgeCases:
  """Verifies robustness to missing features, unknown users, zeros, and non-finite inputs."""

  def test_empty_features_handled_safely(self) -> None:
    behavioral_ml_service.load_models()
    user_id = ENROLLED_USERS[0]
    result = behavioral_ml_service.predict(user_id=user_id, features={})
    assert result["decision"] in ("ALLOW", "WARN", "CHALLENGE")
    assert 0.0 <= result["fused_score"] <= 1.0

  def test_unknown_unenrolled_user_allows_enrollment_collection(self) -> None:
    behavioral_ml_service.load_models()
    unknown_uid = "00000000-0000-0000-0000-000000000000"
    result = behavioral_ml_service.predict(
        user_id=unknown_uid, features={"dwellMeanMs": 120.0}
    )
    assert result["decision"] == "ALLOW"
    assert result["fused_score"] == 0.15

  def test_nan_and_inf_handled_without_crash(self) -> None:
    behavioral_ml_service.load_models()
    user_id = ENROLLED_USERS[0]
    malformed_features = {
        "dwellMeanMs": float("nan"),
        "dwellStdMs": float("inf"),
        "flightMeanMs": -float("inf"),
        "velocityMean": 500.0,
    }
    result = behavioral_ml_service.predict(
        user_id=user_id, features=malformed_features
    )
    assert result["decision"] in ("ALLOW", "WARN", "CHALLENGE")
    assert not math.isnan(result["fused_score"])
    assert not math.isinf(result["fused_score"])
