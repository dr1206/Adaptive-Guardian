"""
Score fusion: weighted ensemble of LightGBM probability + OCSVM anomaly score.

Decision thresholds per ADR-0005:
- >= 0.85 → allow
- 0.60-0.85 → warn
- < 0.60 → challenge (OTP step-up)
"""

from app.config import settings


def fuse_scores(lightgbm_prob: float, ocsvm_anomaly: float, lgbm_weight: float = 0.6) -> float:
    return lgbm_weight * lightgbm_prob + (1 - lgbm_weight) * (1 - ocsvm_anomaly)


def decide(fused_score: float) -> str:
    if fused_score >= settings.threshold_allow:
        return "allow"
    elif fused_score >= settings.threshold_warn:
        return "warn"
    else:
        return "challenge"
