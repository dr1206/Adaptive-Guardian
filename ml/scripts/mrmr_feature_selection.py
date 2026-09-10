import pandas as pd
from pathlib import Path
from sklearn.feature_selection import mutual_info_classif
from sklearn.metrics import mutual_info_score
import numpy as np

BASE_DIR = Path(__file__).resolve().parents[2]
PROCESSED_DIR = BASE_DIR / "ml" / "processed"

INPUT_FILE = PROCESSED_DIR / "ml_train_normalized.csv"
OUTPUT_FILE = PROCESSED_DIR / "selected_features.txt"

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

N_FEATURES = 8


print("=" * 70)
print("mRMR FEATURE SELECTION")
print("=" * 70)

df = pd.read_csv(INPUT_FILE)

print(f"\nTraining rows: {len(df)}")

X = df[FEATURES].copy()

# Convert labels to binary
y = df["label"].map({
    "genuine": 0,
    "impostor": 1
})

if y.isna().any():
    print("\nERROR: Unknown labels found.")
    print(df["label"].value_counts())
    raise SystemExit(1)

y = y.astype(int)

print("\nLabel distribution:")
print(f"  Genuine  : {(y == 0).sum()}")
print(f"  Impostor : {(y == 1).sum()}")


# ---------------------------------------------------------
# Maximum Relevance
# ---------------------------------------------------------

mi_relevance = mutual_info_classif(
    X,
    y,
    random_state=42
)

relevance = dict(zip(FEATURES, mi_relevance))


# ---------------------------------------------------------
# Mutual Information between features
# ---------------------------------------------------------

feature_mi = {}

for feature_a in FEATURES:
    for feature_b in FEATURES:

        if feature_a == feature_b:
            continue

        score = mutual_info_score(
            pd.qcut(
                X[feature_a],
                q=min(10, X[feature_a].nunique()),
                duplicates="drop"
            ),
            pd.qcut(
                X[feature_b],
                q=min(10, X[feature_b].nunique()),
                duplicates="drop"
            )
        )

        feature_mi[(feature_a, feature_b)] = score


# ---------------------------------------------------------
# mRMR selection
# ---------------------------------------------------------

selected = []
remaining = FEATURES.copy()

# First feature = maximum relevance
first_feature = max(
    remaining,
    key=lambda feature: relevance[feature]
)

selected.append(first_feature)
remaining.remove(first_feature)


while remaining and len(selected) < N_FEATURES:

    best_feature = None
    best_score = -np.inf

    for candidate in remaining:

        redundancy = np.mean([
            feature_mi.get(
                (candidate, selected_feature),
                feature_mi.get(
                    (selected_feature, candidate),
                    0
                )
            )
            for selected_feature in selected
        ])

        score = relevance[candidate] - redundancy

        if score > best_score:
            best_score = score
            best_feature = candidate

    selected.append(best_feature)
    remaining.remove(best_feature)


# ---------------------------------------------------------
# Display results
# ---------------------------------------------------------

print("\nFeature relevance:")
print("-" * 70)

for feature in sorted(
    FEATURES,
    key=lambda x: relevance[x],
    reverse=True
):
    print(
        f"{feature:22s} "
        f"MI relevance = {relevance[feature]:.6f}"
    )


print("\nSelected features using mRMR:")
print("-" * 70)

for i, feature in enumerate(selected, start=1):
    print(f"{i}. {feature}")


# ---------------------------------------------------------
# Save selected features
# ---------------------------------------------------------

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:

    for feature in selected:
        f.write(feature + "\n")


print(f"\nSelected {len(selected)} features.")
print(f"Saved to:")
print(OUTPUT_FILE)

print("\nIMPORTANT:")
print("- Feature selection used TRAINING data only.")
print("- Test data was not used.")
print("- ML model training has NOT been performed.")

print("=" * 70)