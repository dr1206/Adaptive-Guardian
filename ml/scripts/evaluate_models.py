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

TEST_FILE = PROCESSED_DIR / "ml_test_normalized.csv"
FEATURE_FILE = PROCESSED_DIR / "selected_features.txt"

REPORT_FILE = PROCESSED_DIR / "model_evaluation_report.txt"


print("=" * 70)
print("MODEL EVALUATION")
print("=" * 70)


# ---------------------------------------------------------
# Load selected features
# ---------------------------------------------------------

with open(FEATURE_FILE, "r", encoding="utf-8") as f:
    FEATURES = [
        line.strip()
        for line in f
        if line.strip()
    ]


# ---------------------------------------------------------
# Load test data
# ---------------------------------------------------------

df = pd.read_csv(TEST_FILE)

print(f"\nTest rows: {len(df)}")

X = df[FEATURES]

y = df["label"].map({
    "genuine": 0,
    "impostor": 1
}).astype(int)


print("\nTest class distribution:")
print(f"  Genuine  : {(y == 0).sum()}")
print(f"  Impostor : {(y == 1).sum()}")


# ---------------------------------------------------------
# Load LightGBM
# ---------------------------------------------------------

lightgbm_file = MODELS_DIR / "lightgbm_classifier.joblib"

lightgbm = joblib.load(lightgbm_file)

lgbm_probability = lightgbm.predict_proba(X)[:, 1]

lgbm_prediction = (
    lgbm_probability >= 0.5
).astype(int)


# ---------------------------------------------------------
# LightGBM metrics
# ---------------------------------------------------------

lgbm_accuracy = accuracy_score(
    y,
    lgbm_prediction
)

lgbm_precision = precision_score(
    y,
    lgbm_prediction,
    zero_division=0
)

lgbm_recall = recall_score(
    y,
    lgbm_prediction,
    zero_division=0
)

lgbm_f1 = f1_score(
    y,
    lgbm_prediction,
    zero_division=0
)

lgbm_auc = roc_auc_score(
    y,
    lgbm_probability
)

lgbm_cm = confusion_matrix(
    y,
    lgbm_prediction
)


# ---------------------------------------------------------
# OC-SVM scores
# ---------------------------------------------------------

ocsvm_scores = np.full(
    len(df),
    np.nan
)

ocsvm_predictions = np.full(
    len(df),
    np.nan
)


for user_id in df["user_id"].unique():

    mask = df["user_id"] == user_id

    model_file = MODELS_DIR / f"ocsvm_{user_id}.joblib"

    if not model_file.exists():
        print(f"\nWARNING: Model not found for {user_id}")
        continue

    model = joblib.load(model_file)

    user_X = X.loc[mask]

    # decision_function:
    # positive = normal
    # negative = anomalous
    scores = model.decision_function(user_X)

    predictions = model.predict(user_X)

    ocsvm_scores[mask] = scores
    ocsvm_predictions[mask] = predictions


# ---------------------------------------------------------
# Normalize OC-SVM scores
#
# Convert decision scores into approximately 0-1
# anomaly scale using min-max normalization on TEST
# scores for reporting/fusion.
# ---------------------------------------------------------

score_min = np.nanmin(ocsvm_scores)
score_max = np.nanmax(ocsvm_scores)

if score_max == score_min:
    ocsvm_normalized = np.full(
        len(ocsvm_scores),
        0.5
    )
else:
    ocsvm_normalized = (
        (ocsvm_scores - score_min)
        / (score_max - score_min)
    )

# Higher value = more anomalous
ocsvm_anomaly_score = 1 - ocsvm_normalized


# ---------------------------------------------------------
# Fused score
# ---------------------------------------------------------

fused_score = (
    0.6 * lgbm_probability
    + 0.4 * ocsvm_anomaly_score
)


# ---------------------------------------------------------
# Project thresholds
#
# >= 0.85  -> Allow
# 0.60-0.85 -> Warn
# < 0.60 -> Challenge
#
# Here fused_score represents risk:
# higher = more suspicious.
# Therefore:
# low risk -> Allow
# medium -> Warn
# high -> Challenge
# ---------------------------------------------------------

risk_level = np.where(
    fused_score < 0.60,
    "ALLOW",
    np.where(
        fused_score < 0.85,
        "WARN",
        "CHALLENGE"
    )
)


# ---------------------------------------------------------
# Evaluate fused classifier
#
# For binary evaluation:
# risk >= 0.60 = impostor
# risk < 0.60 = genuine
# ---------------------------------------------------------

fused_prediction = (
    fused_score >= 0.60
).astype(int)


fused_accuracy = accuracy_score(
    y,
    fused_prediction
)

fused_precision = precision_score(
    y,
    fused_prediction,
    zero_division=0
)

fused_recall = recall_score(
    y,
    fused_prediction,
    zero_division=0
)

fused_f1 = f1_score(
    y,
    fused_prediction,
    zero_division=0
)

fused_auc = roc_auc_score(
    y,
    fused_score
)

fused_cm = confusion_matrix(
    y,
    fused_prediction
)


# ---------------------------------------------------------
# Print LightGBM results
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("LIGHTGBM TEST RESULTS")
print("=" * 70)

print(f"\nAccuracy : {lgbm_accuracy:.4f}")
print(f"Precision: {lgbm_precision:.4f}")
print(f"Recall   : {lgbm_recall:.4f}")
print(f"F1-score : {lgbm_f1:.4f}")
print(f"ROC-AUC  : {lgbm_auc:.4f}")

print("\nConfusion Matrix:")
print(lgbm_cm)

print("\nClassification Report:")
print(
    classification_report(
        y,
        lgbm_prediction,
        target_names=["genuine", "impostor"],
        zero_division=0
    )
)


# ---------------------------------------------------------
# Print fused results
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("FUSED MODEL TEST RESULTS")
print("=" * 70)

print("\nFusion:")
print("  0.6 × LightGBM")
print("  0.4 × OC-SVM anomaly score")

print("\nAccuracy : {:.4f}".format(fused_accuracy))
print("Precision: {:.4f}".format(fused_precision))
print("Recall   : {:.4f}".format(fused_recall))
print("F1-score : {:.4f}".format(fused_f1))
print("ROC-AUC  : {:.4f}".format(fused_auc))

print("\nConfusion Matrix:")
print(fused_cm)

print("\nClassification Report:")
print(
    classification_report(
        y,
        fused_prediction,
        target_names=["genuine", "impostor"],
        zero_division=0
    )
)


# ---------------------------------------------------------
# Risk distribution
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("RISK LEVEL DISTRIBUTION")
print("=" * 70)

print(
    pd.Series(risk_level)
    .value_counts()
    .to_string()
)


# ---------------------------------------------------------
# Per-user results
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("PER-USER RESULTS")
print("=" * 70)

for user_id in sorted(df["user_id"].unique()):

    mask = df["user_id"] == user_id

    user_y = y[mask]
    user_pred = fused_prediction[mask]

    print(f"\nUser: {user_id}")
    print(f"Samples: {mask.sum()}")
    print(f"Genuine: {(user_y == 0).sum()}")
    print(f"Impostor: {(user_y == 1).sum()}")

    if len(np.unique(user_y)) == 2:
        print(
            f"Accuracy: "
            f"{accuracy_score(user_y, user_pred):.4f}"
        )

        print(
            f"Recall: "
            f"{recall_score(user_y, user_pred, zero_division=0):.4f}"
        )
    else:
        print("Accuracy/recall: single class only")


# ---------------------------------------------------------
# Save report
# ---------------------------------------------------------

with open(REPORT_FILE, "w", encoding="utf-8") as f:

    f.write("MODEL EVALUATION REPORT\n")
    f.write("=" * 70 + "\n\n")

    f.write(f"Test rows: {len(df)}\n")
    f.write(f"Genuine: {(y == 0).sum()}\n")
    f.write(f"Impostor: {(y == 1).sum()}\n\n")

    f.write("LIGHTGBM\n")
    f.write("-" * 70 + "\n")
    f.write(f"Accuracy : {lgbm_accuracy:.4f}\n")
    f.write(f"Precision: {lgbm_precision:.4f}\n")
    f.write(f"Recall   : {lgbm_recall:.4f}\n")
    f.write(f"F1-score : {lgbm_f1:.4f}\n")
    f.write(f"ROC-AUC  : {lgbm_auc:.4f}\n")
    f.write(f"Confusion Matrix:\n{lgbm_cm}\n\n")

    f.write("FUSED MODEL\n")
    f.write("-" * 70 + "\n")
    f.write(f"Accuracy : {fused_accuracy:.4f}\n")
    f.write(f"Precision: {fused_precision:.4f}\n")
    f.write(f"Recall   : {fused_recall:.4f}\n")
    f.write(f"F1-score : {fused_f1:.4f}\n")
    f.write(f"ROC-AUC  : {fused_auc:.4f}\n")
    f.write(f"Confusion Matrix:\n{fused_cm}\n\n")

    f.write("FEATURES\n")
    f.write("-" * 70 + "\n")

    for feature in FEATURES:
        f.write(f"{feature}\n")


print("\nEvaluation report saved:")
print(REPORT_FILE)

print("\nIMPORTANT:")
print("- Evaluation used the held-out test set.")
print("- No training data was used for these metrics.")
print("- Only 5 impostor windows are in the test set.")
print("- Therefore metrics, especially impostor recall, may be unstable.")
print("- Do NOT claim >90% AUC as a general result from this dataset alone.")

print("=" * 70)