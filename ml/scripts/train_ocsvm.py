import pandas as pd
import numpy as np
import joblib

from pathlib import Path
from sklearn.svm import OneClassSVM


BASE_DIR = Path(__file__).resolve().parents[2]

PROCESSED_DIR = BASE_DIR / "ml" / "processed"
MODELS_DIR = BASE_DIR / "ml" / "models"

TRAIN_FILE = PROCESSED_DIR / "ml_train_normalized.csv"
FEATURE_FILE = PROCESSED_DIR / "selected_features.txt"


print("=" * 70)
print("ONE-CLASS SVM TRAINING")
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

# OC-SVM is trained ONLY on genuine behavior
genuine_df = df[df["label"] == "genuine"].copy()

print(f"Genuine rows used: {len(genuine_df)}")
print(f"Impostor rows excluded: {(df['label'] == 'impostor').sum()}")


# ---------------------------------------------------------
# Check users
# ---------------------------------------------------------

users = sorted(genuine_df["user_id"].unique())

print(f"\nUsers found: {len(users)}")

for user in users:
    count = len(genuine_df[genuine_df["user_id"] == user])
    print(f"  {user}: {count} genuine samples")


# ---------------------------------------------------------
# Create models directory
# ---------------------------------------------------------

MODELS_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# Train one OC-SVM per user
# ---------------------------------------------------------

for user_id in users:

    user_df = genuine_df[
        genuine_df["user_id"] == user_id
    ].copy()

    X = user_df[FEATURES].to_numpy()

    print("\n" + "-" * 70)
    print(f"Training OC-SVM for user: {user_id}")
    print(f"Samples: {len(X)}")
    print(f"Features: {X.shape[1]}")

    # Project specification:
    # Kernel = RBF
    # nu = 0.05
    # gamma = auto

    model = OneClassSVM(
        kernel="rbf",
        nu=0.05,
        gamma="scale"
    )

    model.fit(X)

    # -----------------------------------------------------
    # Training predictions
    # -----------------------------------------------------

    predictions = model.predict(X)

    accepted = np.sum(predictions == 1)
    rejected = np.sum(predictions == -1)

    acceptance_rate = accepted / len(predictions)

    print(f"Accepted training samples: {accepted}")
    print(f"Rejected training samples: {rejected}")
    print(f"Training acceptance rate: {acceptance_rate:.2%}")


    # -----------------------------------------------------
    # Save model
    # -----------------------------------------------------

    model_file = MODELS_DIR / f"ocsvm_{user_id}.joblib"

    joblib.dump(model, model_file)

    print(f"Saved: {model_file}")


print("\n" + "=" * 70)
print("ONE-CLASS SVM TRAINING COMPLETE")
print("=" * 70)

print("\nIMPORTANT:")
print("- Only genuine training samples were used.")
print("- Impostor samples were NOT used for OC-SVM fitting.")
print("- One model was trained per user.")
print("- RBF kernel used.")
print("- nu = 0.05.")
print("- Test data was NOT used.")
print("- LightGBM has NOT been trained yet.")

print("=" * 70)