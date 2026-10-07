# ADAPTIVE GUARDIAN — PRODUCTION REMEDIATION & VERIFICATION REPORT

## 1. Executive Summary

Adaptive Guardian has undergone a comprehensive, production-grade engineering remediation covering data integrity, dataset reconstruction, feature consistency, ML pipeline training, TreeSHAP explainability, backend unit test coverage, and UI integration.

All 171 backend unit tests across all application domains (Auth, Aegis, Security, Banking, Dashboard, Notifications, Audit, Admin, Export Builder, and Production) pass cleanly with 100% success rate. The frontend TypeScript and Vite builds compile cleanly.

---

## 2. Core Architectural & Pipeline Remediations

### A. Data Integrity & Export Root Cause Fix

- **Triple-Append Root Cause**: Fixed in [`backend/src/app/domain/admin/export_builder.py`](file:///c:/Users/Amal%20Varghese/Desktop/MAJOR%20PROJECT%20BACKUP/MAJOR%20PROJ%20MADE%20BY%20DRISTI/Adaptive-Guardian/backend/src/app/domain/admin/export_builder.py). Previously, a single window loop repeatedly appended identical rows to the in-memory CSV buffer. A window now produces exactly 1 CSV row.
- **Header Separator Bug**: Fixed delimiter formatting ensuring `len(headers) == len(row)` for every written line. Validated by new unit tests in [`backend/src/tests/unit/test_export_builder.py`](file:///c:/Users/Amal%20Varghese/Desktop/MAJOR%20PROJECT%20BACKUP/MAJOR%20PROJ%20MADE%20BY%20DRISTI/Adaptive-Guardian/backend/src/tests/unit/test_export_builder.py).
- **Deterministic Window ID & Idempotency**: Implemented SHA-256 deterministic `window_id` calculation (`hash(user_id:session_id:start:end)`). Added unique DB index and idempotent upsert/ignore on `BehaviorWindow` submission.
- **Canonical Window Duration**: Standardized across the entire platform at 30 seconds (`BEHAVIOR_WINDOW_SECONDS = 30`).

### B. Dataset Rebuild & Scientific Disjoint Splitting

- **1000x Velocity Unit Mismatch Discovered & Fixed**: 69 older collector rows had velocities recorded in `px/ms` (e.g. 1.0 px/ms) while 230 rows were recorded in `px/s` (e.g. 1000 px/s). Standardized all rows to canonical `px/s`.
- **Deduplication**: Purged duplicate vectors in user sessions without artificial row inflation or synthetic replication.
- **Pristine Canonical Dataset**: Produced [`ml/processed/behavioral_windows_canonical.csv`](file:///c:/Users/Amal%20Varghese/Desktop/MAJOR%20PROJECT%20BACKUP/MAJOR%20PROJ%20MADE%20BY%20DRISTI/Adaptive-Guardian/ml/processed/behavioral_windows_canonical.csv) with **299 unique, high-quality windows** across 4 enrolled users:
  - Amal: 67 windows
  - Dristi: 103 windows
  - Manasa: 69 windows
  - Vyas: 60 windows
- **Strict Session Disjointness**: Partitioned into 26 train sessions (205 windows) and 12 test sessions (94 windows). Guaranteed `TRAIN_SESSIONS ∩ TEST_SESSIONS = ∅` (zero session leakage).
- **Validation Audit**: [`ml/scripts/validate_dataset.py`](file:///c:/Users/Amal%20Varghese/Desktop/MAJOR%20PROJECT%20BACKUP/MAJOR%20PROJ%20MADE%20BY%20DRISTI/Adaptive-Guardian/ml/scripts/validate_dataset.py) verified 0 duplicates, 0 NaNs/Infs, 0 session leakage, 0 window leakage, and physiological bounds. Exit code: 0.

### C. ML Training & Inference Mathematical Consistency

- **Feature Schema Alignment**: Defined 14 canonical features in [`ml/feature_schema.json`](file:///c:/Users/Amal%20Varghese/Desktop/MAJOR%20PROJECT%20BACKUP/MAJOR%20PROJ%20MADE%20BY%20DRISTI/Adaptive-Guardian/ml/feature_schema.json) matching TypeScript collector and Python backend 1:1.
- **Trained Artifacts**:
  - `ml/models/standard_scaler.joblib`
  - `ml/models/lightgbm_classifier.joblib` + 4 user models
  - `ml/models/ocsvm_*.joblib` (4 calibrated One-Class SVM models)
  - `ml/models/ocsvm_calibration.joblib`
- **Real TreeSHAP Attribution**: Integrated `shap.TreeExplainer` into [`backend/src/app/domain/security/ml_service.py`](file:///c:/Users/Amal%20Varghese/Desktop/MAJOR%20PROJECT%20BACKUP/MAJOR%20PROJ%20MADE%20BY%20DRISTI/Adaptive-Guardian/backend/src/app/domain/security/ml_service.py). Real mathematical feature risk contributions are returned as `top_contributors` and stored in `DecisionDoc`.

### D. Complete Backend Test Pass

- **171/171 Unit Tests Passing (100%)**:
  - `test_admin.py`: 43/43 PASSED
  - `test_audit.py`: 9/9 PASSED
  - `test_auth.py`: 26/26 PASSED
  - `test_banking.py`: 25/25 PASSED
  - `test_dashboard.py`: 14/14 PASSED
  - `test_notifications.py`: 17/17 PASSED
  - `test_security.py`: 16/16 PASSED
  - `test_production.py`: 18/18 PASSED
  - `test_export_builder.py`: 2/2 PASSED
  - `test_health.py`: 1/1 PASSED

### E. Frontend UI & TreeSHAP Integration

- **Live Decision Wiring**: Both `/admin/ai/explain` and `/app/guard/explainability` now consume live decisions with real TreeSHAP contributions from `useDecisions()`.
- **Aesthetic**: Premium institutional banking aesthetic using the palette of deep obsidian and navy slate with restrained emerald, amber, and ruby semantic status indicators.
- **Compilation**: Full Vite and Nitro SSR client/server builds succeed with zero errors.
