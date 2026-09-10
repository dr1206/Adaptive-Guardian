import pandas as pd
from pathlib import Path

# ============================================================
# PER-USER Z-SCORE NORMALIZATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

INPUT_FILE = BASE_DIR / "ml" / "processed" / "behavioral_windows_clean.csv"
OUTPUT_FILE = BASE_DIR / "ml" / "processed" / "behavioral_windows_normalized.csv"

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
print("PER-USER Z-SCORE NORMALIZATION")
print("=" * 70)

# ------------------------------------------------------------
# 1. Load dataset
# ------------------------------------------------------------

print("\nLoading dataset...")

df = pd.read_csv(INPUT_FILE)

print(f"Input rows: {len(df)}")
print(f"Users: {df['user_id'].nunique()}")

# ------------------------------------------------------------
# 2. Check required features
# ------------------------------------------------------------

missing = [feature for feature in FEATURES if feature not in df.columns]

if missing:
    print("\nERROR: Missing features:")
    for feature in missing:
        print(f"- {feature}")
    raise SystemExit(1)

print("\nOK All 12 features found")

# ------------------------------------------------------------
# 3. Convert features to numeric
# ------------------------------------------------------------

df[FEATURES] = df[FEATURES].apply(pd.to_numeric, errors="coerce")

if df[FEATURES].isna().any().any():
    print("\nERROR: Missing/non-numeric values detected")
    print(df[FEATURES].isna().sum())
    raise SystemExit(1)

# ------------------------------------------------------------
# 4. Calculate per-user Z-score
# ------------------------------------------------------------

print("\nNormalizing features separately for each user...")

def zscore(series):
    std = series.std()

    # If a feature has no variation for a user,
    # return zeros rather than dividing by zero.
    if std == 0 or pd.isna(std):
        return pd.Series(0.0, index=series.index)

    return (series - series.mean()) / std


for feature in FEATURES:
    df[feature] = df.groupby("user_id", group_keys=False)[feature].transform(
        zscore
    )

# ------------------------------------------------------------
# 5. Verify normalization
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("NORMALIZATION CHECK")
print("=" * 70)

for user in df["user_id"].unique():

    user_data = df[df["user_id"] == user]

    print(f"\nUser: {user}")
    print(f"Windows: {len(user_data)}")

    means = user_data[FEATURES].mean()
    stds = user_data[FEATURES].std()

    print(f"Maximum absolute mean: {means.abs().max():.6f}")
    print(f"Minimum feature std: {stds.min():.6f}")

# ------------------------------------------------------------
# 6. Check for invalid values
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("VALIDITY CHECK")
print("=" * 70)

if df[FEATURES].isna().any().any():
    print("ERROR: NaN values found")
else:
    print("OK No NaN values")

if (df[FEATURES] == float("inf")).any().any():
    print("ERROR: Infinite values found")
else:
    print("OK No infinite values")

# ------------------------------------------------------------
# 7. Save normalized dataset
# ------------------------------------------------------------

df.to_csv(OUTPUT_FILE, index=False)

print("\n" + "=" * 70)
print("NORMALIZATION COMPLETE")
print("=" * 70)

print(f"\nSaved:")
print(OUTPUT_FILE)

print("\nML TRAINING HAS NOT BEEN PERFORMED.")