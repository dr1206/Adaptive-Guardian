import pandas as pd
import numpy as np
import joblib

from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]

PROCESSED_DIR = BASE_DIR / "ml" / "processed"
MODELS_DIR = BASE_DIR / "ml" / "models"

TRAIN_FILE = PROCESSED_DIR / "ml_train_normalized.csv"
TEST_FILE = PROCESSED_DIR / "ml_test_normalized.csv"
FEATURE_FILE = PROCESSED_DIR / "selected_features.txt"

OUTPUT_FILE = PROCESSED_DIR / "calibrated_test_scores.csv"
CALIBRATION_FILE = MODELS_DIR / "ocsvm_calibration.joblib"


print("=" * 70)
print("PROPER OC-SVM SCORE CALIBRATION")
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
# Load train and test
# ---------------------------------------------------------

train_df = pd.read_csv(TRAIN_FILE)
test_df = pd.read_csv(TEST_FILE)

print(f"\nTraining rows: {len(train_df)}")
print(f"Testing rows : {len(test_df)}")


# ---------------------------------------------------------
# Prepare result columns
# ---------------------------------------------------------

test_result = test_df.copy()

test_result["ocsvm_raw_score"] = np.nan
test_result["ocsvm_normal_score"] = np.nan
test_result["ocsvm_anomaly_score"] = np.nan


# ---------------------------------------------------------
# Store calibration bounds for backend inference
# ---------------------------------------------------------

calibration_bounds = {}


# ---------------------------------------------------------
# Calibrate separately for each user
# ---------------------------------------------------------

for user_id in sorted(test_df["user_id"].unique()):

    print("\n" + "-" * 70)
    print(f"User: {user_id}")

    model_file = MODELS_DIR / f"ocsvm_{user_id}.joblib"

    if not model_file.exists():
        print("WARNING: OC-SVM model not found.")
        continue

    model = joblib.load(model_file)

    # Genuine TRAINING samples for this user
    user_train = train_df[
        (train_df["user_id"] == user_id) &
        (train_df["label"] == "genuine")
    ]

    # TEST samples for this user
    user_test_mask = test_df["user_id"] == user_id
    user_test = test_df[user_test_mask]

    if len(user_train) == 0:
        print("WARNING: No genuine training samples.")
        continue

    if len(user_test) == 0:
        continue

    # -----------------------------------------------------
    # Training genuine OC-SVM scores
    # -----------------------------------------------------

    train_scores = model.decision_function(
        user_train[FEATURES].to_numpy()
    )

    # -----------------------------------------------------
    # Robust calibration bounds
    #
    # 5th percentile = lower end of normal behavior
    # 95th percentile = upper end of normal behavior
    #
    # Scores above lower bound are considered increasingly
    # normal. Scores below it become increasingly anomalous.
    # -----------------------------------------------------

    lower_bound = np.percentile(
        train_scores,
        5
    )

    upper_bound = np.percentile(
        train_scores,
        95
    )

    if upper_bound <= lower_bound:
        upper_bound = lower_bound + 1e-9

    # -----------------------------------------------------
    # Save calibration bounds
    # -----------------------------------------------------

    calibration_bounds[str(user_id)] = {
        "lower_bound": float(lower_bound),
        "upper_bound": float(upper_bound),
    }

    # -----------------------------------------------------
    # Test scores
    # -----------------------------------------------------

    test_scores = model.decision_function(
        user_test[FEATURES].to_numpy()
    )

    # Convert to normality score:
    # 0 = highly anomalous
    # 1 = highly normal

    normal_score = (
        (test_scores - lower_bound)
        / (upper_bound - lower_bound)
    )

    normal_score = np.clip(
        normal_score,
        0,
        1
    )

    anomaly_score = 1 - normal_score

    # -----------------------------------------------------
    # Store results
    # -----------------------------------------------------

    test_result.loc[
        user_test_mask,
        "ocsvm_raw_score"
    ] = test_scores

    test_result.loc[
        user_test_mask,
        "ocsvm_normal_score"
    ] = normal_score

    test_result.loc[
        user_test_mask,
        "ocsvm_anomaly_score"
    ] = anomaly_score

    print(f"Training genuine samples: {len(user_train)}")
    print(f"Test samples: {len(user_test)}")
    print(
        f"Training score 5th percentile : "
        f"{lower_bound:.6f}"
    )
    print(
        f"Training score 95th percentile: "
        f"{upper_bound:.6f}"
    )


# ---------------------------------------------------------
# Verify calibration bounds
# ---------------------------------------------------------

if len(calibration_bounds) != len(
    test_df["user_id"].unique()
):

    print("\nERROR: Calibration missing for one or more users.")
    print(
        "Expected users:",
        len(test_df["user_id"].unique())
    )
    print(
        "Calibrated users:",
        len(calibration_bounds)
    )
    raise SystemExit(1)


# ---------------------------------------------------------
# Verify test scores
# ---------------------------------------------------------

if test_result["ocsvm_anomaly_score"].isna().any():

    missing = test_result[
        test_result["ocsvm_anomaly_score"].isna()
    ]

    print("\nERROR: Some test samples have no OC-SVM score.")
    print(missing["user_id"].value_counts())
    raise SystemExit(1)


if not np.isfinite(
    test_result["ocsvm_anomaly_score"].to_numpy()
).all():

    print("\nERROR: Invalid OC-SVM scores found.")
    raise SystemExit(1)


# ---------------------------------------------------------
# Save calibrated test scores
# ---------------------------------------------------------

test_result.to_csv(
    OUTPUT_FILE,
    index=False
)


# ---------------------------------------------------------
# Save calibration bounds for backend
# ---------------------------------------------------------

joblib.dump(
    calibration_bounds,
    CALIBRATION_FILE
)


# ---------------------------------------------------------
# Final output
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("CALIBRATION COMPLETE")
print("=" * 70)

print("\nSaved:")
print(OUTPUT_FILE)
print(CALIBRATION_FILE)

print("\nCalibration users:")

for user_id, bounds in calibration_bounds.items():

    print(
        f"- {user_id}: "
        f"lower={bounds['lower_bound']:.6f}, "
        f"upper={bounds['upper_bound']:.6f}"
    )

print("\nIMPORTANT:")
print("- OC-SVM calibration used TRAINING genuine scores.")
print("- Test scores were never used to determine calibration bounds.")
print("- Existing models were NOT retrained.")
print("- The original test dataset was NOT modified.")
print("- Calibration bounds are saved for backend inference.")

print("=" * 70)