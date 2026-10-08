# Adaptive Guardian — Production Model Implementation Report

**Document Version:** 1.0.0  
**Model Version:** `v2.6.0-weighted-fusion`  
**Date:** October 2026  
**Status:** Active Production Deployment  

---

## 1. Executive Summary

Adaptive Guardian is an adaptive continuous user authentication platform leveraging behavioral biometrics (keystroke and mouse dynamics). Following rigorous empirical benchmarking across the latest 4 user datasets (`Amal`, `Vyas`, `Dristi`, `Manasa`), the **Weighted Fusion Architecture (User-Specific LightGBM + User-Specific One-Class SVM)** emerged as the winning production model.

This document describes the production deployment, feature pipeline, decision logic, real experimental metrics, and disaster recovery/rollback procedures.

---

## 2. Production Architecture

The end-to-end continuous authentication pipeline processes user behavioral windows in real time:

```text
[Browser Client: Keystroke & Mouse Listeners]
                     │
                     ▼
[Feature Extractor: 14 Canonical Biometric Features]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  [Raw Features]          [StandardScaler]
         │                       │
         ▼                       ▼
[User-Specific LightGBM]  [User-Specific One-Class SVM]
  (Supervised Risk)       (Unsupervised Anomaly)
         │                       │
         └───────────┬───────────┘
                     ▼
          [Weighted Score Fusion]
        (0.60 LGBM + 0.40 OC-SVM)
                     │
                     ▼
             [Risk Thresholding]
       ALLOW (<0.60) / WARN (0.60-0.85) / CHALLENGE (>=0.85)
                     │
                     ▼
     [TreeSHAP Explanations & Audit Log]
```

### 2.1 The 14 Canonical Features

Every behavioral window evaluates exactly 14 canonical features:

| Feature Name | Biometric Subsystem | Unit / Description |
|:---|:---|:---|
| `dwellMeanMs` | Keystroke Dynamics | Mean key press duration (ms) |
| `dwellStdMs` | Keystroke Dynamics | Standard deviation of key press duration (ms) |
| `flightMeanMs` | Keystroke Dynamics | Mean interval between key release and next press (ms) |
| `flightStdMs` | Keystroke Dynamics | Standard deviation of flight time (ms) |
| `keysPerSec` | Keystroke Dynamics | Keystroke entry velocity (keys/second) |
| `mouseTravelPx` | Mouse Dynamics | Cumulative Euclidean pixel distance moved |
| `velocityMean` | Mouse Dynamics | Mean cursor speed (px/sec) |
| `velocityStd` | Mouse Dynamics | Standard deviation of cursor speed |
| `accelerationMean` | Mouse Dynamics | Mean cursor acceleration (px/sec²) |
| `accelerationStd` | Mouse Dynamics | Standard deviation of cursor acceleration |
| `curvatureMean` | Mouse Dynamics | Mean angular trajectory deviation |
| `curvatureStd` | Mouse Dynamics | Standard deviation of angular curvature |
| `clickCount` | Mouse Dynamics | Total clicks within analysis window |
| `scrollAmount` | Mouse Dynamics | Cumulative scroll wheel delta |

---

## 3. The Winning Model: Weighted Fusion

The production architecture fuses supervised discriminative intelligence with unsupervised boundary detection.

### 3.1 Fusion Formula

$$\text{Fused Risk Score} = 0.60 \times \text{Risk}_{\text{LightGBM}} + 0.40 \times \text{Risk}_{\text{OC-SVM}}$$

- **Score Range:** $[0.0, 1.0]$, where $0.0$ signifies highest confidence genuine behavior, and $1.0$ signifies highest risk impostor behavior.
- **LightGBM Risk:** Derived from class probabilities: $P(\text{Class} = \text{impostor})$. TreeSHAP computes per-feature attributions against raw input space.
- **OC-SVM Anomaly Risk:** Derived from continuous decision function distance $d$, calibrated via an empirical sigmoid transformation: $R_{\text{ocsvm}} = \frac{1}{1 + \exp(\alpha \cdot d + \beta)}$ into a normalized $[0.0, 1.0]$ probability.

### 3.2 Decision Thresholds

| Fused Score Range | Verdict | Action Taken |
|:---|:---|:---|
| $[0.00, 0.60)$ | **ALLOW** | Frictionless session continuation |
| $[0.60, 0.85)$ | **WARN** | High-risk warning logged; adaptive biometric sampling frequency doubled |
| $[0.85, 1.00]$ | **CHALLENGE** | Step-up authentication enforced (MFA prompt, re-authentication) |

---

## 4. Empirical Evaluation & Benchmark Metrics

The deployment incorporates the actual experimental metrics obtained across the four user profiles:

### 4.1 Overall Validation Metrics

- **Validation Accuracy:** **93.21%**
- **F1 Score:** **0.8435**
- **ROC-AUC:** **0.9594**
- **False Accept Rate (FAR):** **5.29%**
- **False Reject Rate (FRR):** **12.52%**
- **Equal Error Rate (EER):** **8.82%**
- **Average Inference Latency:** **0.023 ms**

### 4.2 Final Untouched Test Evaluation (Per-User)

| User Profile | User ID / Identifier | Test Accuracy |
|:---|:---|:---|
| **Amal** | `amal-personal-uid` / `Amal` | **88.12%** |
| **Vyas** | `vyas-personal-uid` / `Vyas` | **94.68%** |
| **Dristi** | `dristi-personal-uid` / `Dristi` | **89.11%** |
| **Manasa** | `manasa-personal-uid` / `Manasa` | **90.71%** |
| **Average** | **Untouched Test Benchmark** | **90.66%** |

*(Note: In accordance with rigorous scientific standards, validation accuracy of 93.21% is distinguished from the held-out untouched test set average of 90.66%.)*

---

## 5. Artifact Registry & Model Storage

All production artifacts are registered under `ml/models/production_metadata.json` and loaded by `backend/src/app/domain/security/ml_service.py`:

```text
ml/models/
├── lightgbm_Amal.joblib
├── lightgbm_Vyas.joblib
├── lightgbm_Dristi.joblib
├── lightgbm_Manasa.joblib
├── ocsvm_Amal.joblib
├── ocsvm_Vyas.joblib
├── ocsvm_Dristi.joblib
├── ocsvm_Manasa.joblib
├── standard_scaler.joblib
├── ocsvm_calibration.joblib
├── user_baselines.json
└── production_metadata.json
```

Prior production models (`v2.5.0`) have been securely archived in:
`ml/models/archive/v2.5.0_pre_fusion_backup/` with full provenance cataloged in `archive_manifest.json`.

---

## 6. Rollback & Disaster Recovery Procedure

If an operational anomaly or regression occurs in production, the rollback procedure is as follows:

1. **Restore Archived Artifacts:**
   ```bash
   cp ml/models/archive/v2.5.0_pre_fusion_backup/* ml/models/
   ```
2. **Revert Version Reference:**
   Update `MODEL_VERSION = "v2.5.0-lightgbm"` in `backend/src/app/domain/security/ml_service.py`.
3. **Restart API Service:**
   Restart the backend daemon; `ml_service.load_models()` re-initializes all artifacts on startup.
4. **Zero-Downtime Fallback:**
   If any user-specific model artifact fails to load, `ml_service.py` defaults to graceful enrollment state (`fused_score = 0.15`, verdict `ALLOW`) preventing disruption to authenticated sessions.
