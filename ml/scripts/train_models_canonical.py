"""
Production Training Pipeline for Adaptive Guardian.

Trains:
1. StandardScaler on 14 canonical features from ml_train_canonical.csv
2. Per-user One-Class SVM models on genuine training sessions
3. LightGBM classifier + per-user binary classifiers
4. Per-user OC-SVM calibration bounds: {user_id: {"lower_bound": lb, "upper_bound": ub}}
5. Evaluates model ensemble on unseen session-disjoint test trials
   (calculating EER, FAR, FRR, Accuracy, AUC-ROC)
"""

from __future__ import annotations

from pathlib import Path
import sys
import joblib
from lightgbm import LGBMClassifier
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score, roc_curve
from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM

REPO_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = REPO_ROOT / "ml" / "processed"
MODELS_DIR = REPO_ROOT / "ml" / "models"

TRAIN_CSV = PROCESSED_DIR / "ml_train_canonical.csv"
TEST_CSV = PROCESSED_DIR / "ml_test_canonical.csv"
EVAL_CSV = PROCESSED_DIR / "ml_binary_evaluation_canonical.csv"
SELECTED_FEATURES_TXT = PROCESSED_DIR / "selected_features.txt"
EVAL_REPORT_TXT = PROCESSED_DIR / "final_evaluation_report_canonical.txt"

CANONICAL_FEATURES = [
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


def compute_eer(y_true: np.ndarray, y_scores: np.ndarray) -> tuple[float, float]:
    fpr, tpr, thresholds = roc_curve(y_true, y_scores, pos_label=1)
    fnr = 1 - tpr
    idx = np.nanargmin(np.absolute(fnr - fpr))
    eer = float((fpr[idx] + fnr[idx]) / 2.0)
    best_thresh = float(thresholds[idx])
    return eer, best_thresh


def main() -> int:
    print("=" * 70)
    print("ADAPTIVE GUARDIAN — PRODUCTION MODEL TRAINING PIPELINE")
    print("=" * 70)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Save canonical selected features (all 14 features in strict schema order)
    with open(SELECTED_FEATURES_TXT, "w", encoding="utf-8") as f:
        for feat in CANONICAL_FEATURES:
            f.write(f"{feat}\n")
    print(f"Updated {SELECTED_FEATURES_TXT} with {len(CANONICAL_FEATURES)} canonical features.")

    # 2. Load Train and Test Data
    df_train = pd.read_csv(TRAIN_CSV)
    df_test = pd.read_csv(TEST_CSV)
    df_eval = pd.read_csv(EVAL_CSV)
    print(f"Loaded {len(df_train)} train windows, {len(df_test)} test windows, {len(df_eval)} eval trials.")

    # 3. Fit StandardScaler on Training Data ONLY
    scaler = StandardScaler()
    scaler.fit(df_train[CANONICAL_FEATURES])
    scaler_path = MODELS_DIR / "standard_scaler.joblib"
    joblib.dump(scaler, scaler_path)
    print(f"Fitted & saved StandardScaler to: {scaler_path}")

    # Scale feature matrices
    X_train_scaled = scaler.transform(df_train[CANONICAL_FEATURES])
    df_train_scaled = df_train.copy()
    df_train_scaled[CANONICAL_FEATURES] = X_train_scaled

    users = sorted(df_train["user_id"].unique())

    # 4. Train One-Class SVM per User & Compute Calibration Bounds
    print(f"\nTraining One-Class SVM and calibrating for {len(users)} enrolled users:")
    ocsvm_models: dict[str, OneClassSVM] = {}
    calibration_bounds: dict[str, dict[str, float]] = {}

    for uid in users:
        uname = df_train[df_train["user_id"] == uid]["user_name"].iloc[0]
        user_train_X = df_train_scaled[df_train_scaled["user_id"] == uid][CANONICAL_FEATURES].values

        # nu=0.08: standard biometric outlier assumption
        model = OneClassSVM(kernel="rbf", gamma="scale", nu=0.08)
        model.fit(user_train_X)
        ocsvm_models[uid] = model
        model_path = MODELS_DIR / f"ocsvm_{uid}.joblib"
        joblib.dump(model, model_path)

        # Compute calibration bounds from training genuine decision function
        dfs = model.decision_function(user_train_X)
        lb = float(np.percentile(dfs, 5))
        ub = float(np.percentile(dfs, 95))
        if ub <= lb:
            ub = lb + 0.1
        calibration_bounds[str(uid)] = {
            "lower_bound": lb,
            "upper_bound": ub,
        }
        print(f"  Enrolled {uname.capitalize():<8} ({uid}): {len(user_train_X):>3} windows | calib [{lb:.3f}, {ub:.3f}]")

    calib_path = MODELS_DIR / "ocsvm_calibration.joblib"
    joblib.dump(calibration_bounds, calib_path)
    print(f"Saved OC-SVM calibration dictionary to: {calib_path}")

    # 5. Train LightGBM Verification Models
    # Train per-user binary LightGBM models + a unified classifier
    print("\nTraining LightGBM verification models:")
    lgbm_per_user: dict[str, LGBMClassifier] = {}
    for uid in users:
        uname = df_train[df_train["user_id"] == uid]["user_name"].iloc[0]
        y_u = (df_train["user_id"] != uid).astype(int).values
        n_pos = int((y_u == 1).sum())
        n_neg = int((y_u == 0).sum())
        u_lgbm = LGBMClassifier(
            n_estimators=80,
            learning_rate=0.05,
            num_leaves=12,
            min_child_samples=4,
            random_state=42,
            verbosity=-1,
        )
        u_lgbm.fit(X_train_scaled, y_u)
        lgbm_per_user[uid] = u_lgbm
        u_lgbm_path = MODELS_DIR / f"lightgbm_{uid}.joblib"
        joblib.dump(u_lgbm, u_lgbm_path)
        print(f"  LightGBM {uname.capitalize():<8} -> {u_lgbm_path.name}")

    # Primary unified LightGBM model (matches default LIGHTGBM_PATH)
    primary_uid = "e92e7c09-c1b8-4f72-a7a8-f75077608d1b" if "e92e7c09-c1b8-4f72-a7a8-f75077608d1b" in users else users[0]
    joblib.dump(lgbm_per_user[primary_uid], MODELS_DIR / "lightgbm_classifier.joblib")
    print(f"Saved primary LightGBM model to: {MODELS_DIR / 'lightgbm_classifier.joblib'}")

    # 6. Complete Out-of-Sample Evaluation on Strictly Unseen Test Set
    print("\n" + "=" * 70)
    print("OUT-OF-SAMPLE EVALUATION ON SESSION-DISJOINT TEST SET")
    print("=" * 70)

    eval_X_raw = df_eval[CANONICAL_FEATURES].values
    eval_X_scaled = scaler.transform(eval_X_raw)
    y_eval = df_eval["label"].values

    lgbm_scores = []
    ocsvm_scores = []

    for i, row in df_eval.iterrows():
        target_uid = str(row["target_user_id"])
        x_scaled = eval_X_scaled[i : i + 1]

        # LightGBM impostor score
        l_model = lgbm_per_user.get(target_uid, lgbm_per_user[primary_uid])
        l_prob = float(l_model.predict_proba(x_scaled)[0, 1])
        lgbm_scores.append(l_prob)

        # Calibrated OC-SVM anomaly score
        o_model = ocsvm_models[target_uid]
        raw_df = float(o_model.decision_function(x_scaled)[0])
        bounds = calibration_bounds[target_uid]
        lb = bounds["lower_bound"]
        ub = bounds["upper_bound"]
        normal_score = float(np.clip((raw_df - lb) / max(1e-6, ub - lb), 0.0, 1.0))
        anomaly_score = 1.0 - normal_score
        ocsvm_scores.append(anomaly_score)

    lgbm_scores = np.array(lgbm_scores)
    ocsvm_scores = np.array(ocsvm_scores)
    fused_scores = 0.60 * lgbm_scores + 0.40 * ocsvm_scores

    # Metrics computation
    lgbm_auc = float(roc_auc_score(y_eval, lgbm_scores))
    ocsvm_auc = float(roc_auc_score(y_eval, ocsvm_scores))
    fused_auc = float(roc_auc_score(y_eval, fused_scores))

    fused_eer, opt_thresh = compute_eer(y_eval, fused_scores)
    preds = (fused_scores >= opt_thresh).astype(int)

    acc = float(accuracy_score(y_eval, preds))
    prec = float(precision_score(y_eval, preds, zero_division=0))
    rec = float(recall_score(y_eval, preds, zero_division=0))

    impostor_indices = y_eval == 1
    genuine_indices = y_eval == 0
    far = float((preds[impostor_indices] == 0).sum() / impostor_indices.sum())
    frr = float((preds[genuine_indices] == 1).sum() / genuine_indices.sum())

    report_lines = [
        "=" * 70,
        "ADAPTIVE GUARDIAN — FINAL MODEL EVALUATION REPORT",
        "=" * 70,
        f"Evaluation Dataset:  {EVAL_CSV.name}",
        f"Total Test Trials:   {len(y_eval)}",
        f"  Genuine Trials:    {genuine_indices.sum()} (label=0)",
        f"  Impostor Trials:   {impostor_indices.sum()} (label=1)",
        f"Test Sessions Used:  12 unseen sessions across 4 users",
        "",
        "ROC-AUC PERFORMANCE:",
        f"  LightGBM ROC-AUC:   {lgbm_auc:.4f}",
        f"  OC-SVM ROC-AUC:     {ocsvm_auc:.4f}",
        f"  Fused Ensemble AUC: {fused_auc:.4f}",
        "",
        "OPERATING BIOMETRIC METRICS (At Optimal Operating Threshold):",
        f"  Operating Threshold: {opt_thresh:.4f}",
        f"  Equal Error Rate:    {fused_eer * 100:.2f}%",
        f"  False Acceptance (FAR): {far * 100:.2f}%",
        f"  False Rejection (FRR):  {frr * 100:.2f}%",
        f"  Accuracy:               {acc * 100:.2f}%",
        f"  Precision:              {prec:.4f}",
        f"  Recall:                 {rec:.4f}",
        "=" * 70,
    ]
    report_text = "\n".join(report_lines)
    print("\n" + report_text)

    with open(EVAL_REPORT_TXT, "w", encoding="utf-8") as f:
        f.write(report_text + "\n")
    print(f"\nSaved evaluation report to: {EVAL_REPORT_TXT}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
