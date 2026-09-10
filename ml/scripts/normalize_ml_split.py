import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).resolve().parents[2]

PROCESSED_DIR = BASE_DIR / "ml" / "processed"
MODELS_DIR = BASE_DIR / "ml" / "models"

TRAIN_FILE = PROCESSED_DIR / "ml_train.csv"
TEST_FILE = PROCESSED_DIR / "ml_test.csv"

TRAIN_OUTPUT = PROCESSED_DIR / "ml_train_normalized.csv"
TEST_OUTPUT = PROCESSED_DIR / "ml_test_normalized.csv"

SCALER_FILE = MODELS_DIR / "standard_scaler.joblib"


FEATURES = [
    "dwellMeanMs",
    "dwellStdMs",
    "flightMeanMs",
    "flightStdMs",
    "velocityMean",
    "accelerationMean",
    "accelerationStd",
    "curvatureMean",
    "curvatureStd",
    "clickCount",
    "scrollAmount",
    "mouseTravelPx",
]


print("=" * 70)
print("TRAINING-ONLY FEATURE NORMALIZATION")
print("=" * 70)


# ---------------------------------------------------------
# Load datasets
# ---------------------------------------------------------

train_df = pd.read_csv(TRAIN_FILE)
test_df = pd.read_csv(TEST_FILE)

print(f"\nTraining rows: {len(train_df)}")
print(f"Testing rows : {len(test_df)}")


# ---------------------------------------------------------
# Check required features
# ---------------------------------------------------------

missing_train = [
    feature for feature in FEATURES
    if feature not in train_df.columns
]

missing_test = [
    feature for feature in FEATURES
    if feature not in test_df.columns
]

if missing_train:
    print("\nERROR: Missing features from training data:")
    print(missing_train)
    raise SystemExit(1)

if missing_test:
    print("\nERROR: Missing features from testing data:")
    print(missing_test)
    raise SystemExit(1)


# ---------------------------------------------------------
# Check missing values
# ---------------------------------------------------------

if train_df[FEATURES].isna().any().any():
    print("\nERROR: Missing values found in training features.")
    raise SystemExit(1)

if test_df[FEATURES].isna().any().any():
    print("\nERROR: Missing values found in testing features.")
    raise SystemExit(1)


# ---------------------------------------------------------
# Fit scaler ONLY on training data
# ---------------------------------------------------------

scaler = StandardScaler()

train_values = scaler.fit_transform(
    train_df[FEATURES]
)

test_values = scaler.transform(
    test_df[FEATURES]
)


# ---------------------------------------------------------
# Replace feature columns
# ---------------------------------------------------------

train_normalized = train_df.copy()
test_normalized = test_df.copy()

train_normalized[FEATURES] = train_values
test_normalized[FEATURES] = test_values


# ---------------------------------------------------------
# Check for invalid values
# ---------------------------------------------------------

if not np.isfinite(train_normalized[FEATURES].to_numpy()).all():
    print("\nERROR: Invalid values in normalized training data.")
    raise SystemExit(1)

if not np.isfinite(test_normalized[FEATURES].to_numpy()).all():
    print("\nERROR: Invalid values in normalized testing data.")
    raise SystemExit(1)


# ---------------------------------------------------------
# Save scaler
# ---------------------------------------------------------

MODELS_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

joblib.dump(scaler, SCALER_FILE)


# ---------------------------------------------------------
# Save normalized datasets
# ---------------------------------------------------------

train_normalized.to_csv(
    TRAIN_OUTPUT,
    index=False
)

test_normalized.to_csv(
    TEST_OUTPUT,
    index=False
)


# ---------------------------------------------------------
# Report
# ---------------------------------------------------------

print("\nFeatures normalized:")
for feature in FEATURES:
    print(f"  OK  {feature}")

print("\nTraining normalization statistics:")

for feature, mean, std in zip(
    FEATURES,
    train_values.mean(axis=0),
    train_values.std(axis=0),
):
    print(
        f"  {feature:20s} "
        f"mean={mean:8.4f} "
        f"std={std:8.4f}"
    )


print("\nFinal datasets:")
print(f"Training: {TRAIN_OUTPUT}")
print(f"Testing : {TEST_OUTPUT}")

print(f"\nScaler:")
print(SCALER_FILE)

print("\nIMPORTANT:")
print("- Scaler was fitted ONLY on training data.")
print("- Test data was transformed using the training scaler.")
print("- ML training has NOT been performed.")

print("=" * 70)