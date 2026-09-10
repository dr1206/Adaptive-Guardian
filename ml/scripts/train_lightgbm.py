import pandas as pd
import joblib

from pathlib import Path
from lightgbm import LGBMClassifier


BASE_DIR = Path(__file__).resolve().parents[2]

PROCESSED_DIR = BASE_DIR / "ml" / "processed"
MODELS_DIR = BASE_DIR / "ml" / "models"

TRAIN_FILE = PROCESSED_DIR / "ml_train_normalized.csv"
FEATURE_FILE = PROCESSED_DIR / "selected_features.txt"

MODEL_FILE = MODELS_DIR / "lightgbm_classifier.joblib"


print("=" * 70)
print("LIGHTGBM TRAINING")
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

print("\nSelected features:")
for feature in FEATURES:
    print(f"  - {feature}")


# ---------------------------------------------------------
# Load training data
# ---------------------------------------------------------

df = pd.read_csv(TRAIN_FILE)

print(f"\nTotal training rows: {len(df)}")


# ---------------------------------------------------------
# Prepare X and y
# ---------------------------------------------------------

X = df[FEATURES]

y = df["label"].map({
    "genuine": 0,
    "impostor": 1
}).astype(int)


print("\nClass distribution:")
print(f"  Genuine  : {(y == 0).sum()}")
print(f"  Impostor : {(y == 1).sum()}")


# ---------------------------------------------------------
# Calculate class weight
# ---------------------------------------------------------

genuine_count = (y == 0).sum()
impostor_count = (y == 1).sum()

scale_pos_weight = genuine_count / impostor_count

print(f"\nScale positive weight: {scale_pos_weight:.4f}")


# ---------------------------------------------------------
# Create LightGBM model
# ---------------------------------------------------------

model = LGBMClassifier(
    objective="binary",
    n_estimators=100,
    learning_rate=0.05,
    num_leaves=15,
    max_depth=5,
    min_child_samples=10,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.1,
    reg_lambda=0.1,
    scale_pos_weight=scale_pos_weight,
    random_state=42,
    verbosity=-1
)


# ---------------------------------------------------------
# Train
# ---------------------------------------------------------

print("\nTraining LightGBM...")

model.fit(X, y)


# ---------------------------------------------------------
# Training prediction
# ---------------------------------------------------------

train_probabilities = model.predict_proba(X)[:, 1]

train_predictions = (train_probabilities >= 0.5).astype(int)

training_accuracy = (
    train_predictions == y
).mean()


print("\nTraining complete.")

print(f"Training accuracy: {training_accuracy:.4f}")


# ---------------------------------------------------------
# Feature importance
# ---------------------------------------------------------

print("\nFeature importance:")
print("-" * 70)

importance = pd.Series(
    model.feature_importances_,
    index=FEATURES
).sort_values(ascending=False)

for feature, value in importance.items():
    print(f"{feature:22s} {value}")


# ---------------------------------------------------------
# Save model
# ---------------------------------------------------------

MODELS_DIR.mkdir(parents=True, exist_ok=True)

joblib.dump(model, MODEL_FILE)

print("\nModel saved:")
print(MODEL_FILE)


print("\nIMPORTANT:")
print("- Only training data was used.")
print("- Test data was NOT used.")
print("- Class imbalance was handled using scale_pos_weight.")
print("- This training accuracy is NOT the final evaluation.")
print("- Final performance will be measured on ml_test_normalized.csv.")

print("=" * 70)