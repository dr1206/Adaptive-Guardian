"""
Score fusion: weighted ensemble of LightGBM probability + OCSVM anomaly score.

Authoritative production architecture:
- 0.65 * LightGBM + 0.35 * OC-SVM
"""

from app.config import settings


def fuse_scores(lightgbm_prob: float, ocsvm_anomaly: float, lgbm_weight: float = 0.65) -> float:
    return lgbm_weight * lightgbm_prob + (1.0 - lgbm_weight) * (1.0 - ocsvm_anomaly)


def decide(fused_score: float) -> str:
    if fused_score >= settings.threshold_allow:
        return "allow"
    elif fused_score >= settings.threshold_warn:
        return "warn"
    else:
        return "challenge"
