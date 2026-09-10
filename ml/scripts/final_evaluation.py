import pandas as pd
import numpy as np
import joblib

from pathlib import Path
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score,
    classification_report,
)


BASE_DIR = Path(__file__).resolve().parents[2]

PROCESSED_DIR = BASE_DIR / "ml" / "processed"
MODELS_DIR = BASE_DIR / "ml" / "models"

TEST_FILE = PROCESSED_DIR / "calibrated_test_scores.csv"
FEATURE_FILE = PROCESSED_DIR / "selected_features.txt"

REPORT_FILE = PROCESSED_DIR / "final_model_evaluation_report.txt"


print("=" * 70)
print("FINAL CALIBRATED MODEL EVALUATION")
print("=" * 70)


# ---------------------------------------------------------
# Load data
# ---------------------------------------------------------

df = pd.read_csv(TEST_FILE)

with open(FEATURE_FILE, "r", encoding="utf-8") as f:
    FEATURES = [
        line.strip()
        for line in f
        if line.strip()
    ]

print(f"\nTest rows: {len(df)}")

y = df["label"].map({
    "genuine": 0,
    "impostor": 1
}).astype(int)

X = df[FEATURES]


print("\nTest class distribution:")
print(f"  Genuine  : {(y == 0).sum()}")
print(f"  Impostor : {(y == 1).sum()}")


# ---------------------------------------------------------
# Load LightGBM
# ---------------------------------------------------------

MODEL_FILE = MODELS_DIR / "lightgbm_classifier.joblib"

lightgbm = joblib.load(MODEL_FILE)

lgbm_probability = lightgbm.predict_proba(X)[:, 1]


# ---------------------------------------------------------
# Get calibrated OC-SVM anomaly score
# ---------------------------------------------------------

ocsvm_anomaly_score = df[
    "ocsvm_anomaly_score"
].to_numpy()

if not np.isfinite(ocsvm_anomaly_score).all():
    raise ValueError(
        "Invalid OC-SVM anomaly scores detected."
    )


# ---------------------------------------------------------
# Fusion
# ---------------------------------------------------------

fused_score = (
    0.6 * lgbm_probability
    + 0.4 * ocsvm_anomaly_score
)


# ---------------------------------------------------------
# Project decision thresholds
#
# < 0.60  = ALLOW
# 0.60-0.85 = WARN
# >= 0.85 = CHALLENGE
# ---------------------------------------------------------

decision = np.where(
    fused_score < 0.60,
    "ALLOW",
    np.where(
        fused_score < 0.85,
        "WARN",
        "CHALLENGE"
    )
)


# ---------------------------------------------------------
# Binary classification
#
# WARN and CHALLENGE are treated as suspicious.
# ---------------------------------------------------------

prediction = (
    fused_score >= 0.60
).astype(int)


# ---------------------------------------------------------
# Metrics
# ---------------------------------------------------------

accuracy = accuracy_score(
    y,
    prediction
)

precision = precision_score(
    y,
    prediction,
    zero_division=0
)

recall = recall_score(
    y,
    prediction,
    zero_division=0
)

f1 = f1_score(
    y,
    prediction,
    zero_division=0
)

auc = roc_auc_score(
    y,
    fused_score
)

cm = confusion_matrix(
    y,
    prediction
)


# ---------------------------------------------------------
# Results
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("FINAL FUSED MODEL RESULTS")
print("=" * 70)

print("\nFusion formula:")
print("  fused = 0.6 × LightGBM + 0.4 × OC-SVM anomaly score")

print("\nMetrics:")
print(f"  Accuracy : {accuracy:.4f}")
print(f"  Precision: {precision:.4f}")
print(f"  Recall   : {recall:.4f}")
print(f"  F1-score : {f1:.4f}")
print(f"  ROC-AUC  : {auc:.4f}")

print("\nConfusion Matrix:")
print(cm)

print("\nClassification Report:")
print(
    classification_report(
        y,
        prediction,
        target_names=[
            "genuine",
            "impostor"
        ],
        zero_division=0
    )
)


# ---------------------------------------------------------
# Decision distribution
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("SECURITY DECISION DISTRIBUTION")
print("=" * 70)

decision_counts = pd.Series(
    decision
).value_counts()

for level in ["ALLOW", "WARN", "CHALLENGE"]:
    print(
        f"{level:10s}: "
        f"{decision_counts.get(level, 0)}"
    )


# ---------------------------------------------------------
# Actual security outcomes
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("SECURITY OUTCOMES")
print("=" * 70)

for label_value, label_name in [
    (0, "GENUINE"),
    (1, "IMPOSTOR")
]:

    mask = y == label_value

    print(f"\n{label_name}:")

    for level in [
        "ALLOW",
        "WARN",
        "CHALLENGE"
    ]:
        count = np.sum(
            mask & (decision == level)
        )

        print(
            f"  {level:10s}: {count}"
        )


# ---------------------------------------------------------
# Save row-level predictions
# ---------------------------------------------------------

results = df.copy()

results["lightgbm_probability"] = lgbm_probability
results["ocsvm_anomaly_score"] = ocsvm_anomaly_score
results["fused_score"] = fused_score
results["security_decision"] = decision
results["predicted_label"] = np.where(
    prediction == 0,
    "genuine",
    "impostor"
)

PREDICTIONS_FILE = (
    PROCESSED_DIR /
    "final_test_predictions.csv"
)

results.to_csv(
    PREDICTIONS_FILE,
    index=False
)


# ---------------------------------------------------------
# Save report
# ---------------------------------------------------------

with open(
    REPORT_FILE,
    "w",
    encoding="utf-8"
) as f:

    f.write(
        "FINAL CALIBRATED MODEL "
        "EVALUATION REPORT\n"
    )
    f.write("=" * 70 + "\n\n")

    f.write(
        f"Test rows: {len(df)}\n"
    )

    f.write(
        f"Genuine: {(y == 0).sum()}\n"
    )

    f.write(
        f"Impostor: {(y == 1).sum()}\n\n"
    )

    f.write(
        "Fusion formula:\n"
    )

    f.write(
        "0.6 × LightGBM + "
        "0.4 × OC-SVM anomaly score\n\n"
    )

    f.write("Metrics:\n")
    f.write(
        f"Accuracy : {accuracy:.4f}\n"
    )
    f.write(
        f"Precision: {precision:.4f}\n"
    )
    f.write(
        f"Recall   : {recall:.4f}\n"
    )
    f.write(
        f"F1-score : {f1:.4f}\n"
    )
    f.write(
        f"ROC-AUC  : {auc:.4f}\n\n"
    )

    f.write(
        "Confusion Matrix:\n"
    )
    f.write(
        str(cm) + "\n\n"
    )

    f.write(
        "Security Decision Distribution:\n"
    )

    for level in [
        "ALLOW",
        "WARN",
        "CHALLENGE"
    ]:
        f.write(
            f"{level}: "
            f"{decision_counts.get(level, 0)}\n"
        )


print("\n" + "=" * 70)
print("FINAL EVALUATION COMPLETE")
print("=" * 70)

print("\nSaved predictions:")
print(PREDICTIONS_FILE)

print("\nSaved report:")
print(REPORT_FILE)

print("\nIMPORTANT:")
print("- OC-SVM calibration came from training genuine scores.")
print("- Test data was not used for calibration.")
print("- No model was retrained.")
print("- Only 5 impostor windows exist in the test set.")
print("- Results should therefore be reported with this limitation.")

print("=" * 70)