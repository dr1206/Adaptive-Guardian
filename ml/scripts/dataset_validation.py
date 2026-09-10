import pandas as pd
from pathlib import Path

# ============================================================
# DATASET VALIDATION REPORT
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]
DATASET = BASE_DIR / "ml" / "processed" / "behavioral_windows_clean.csv"
REPORT = BASE_DIR / "ml" / "processed" / "dataset_validation_report.txt"

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
print("BEHAVIORAL DATASET VALIDATION")
print("=" * 70)

# ------------------------------------------------------------
# 1. Load dataset
# ------------------------------------------------------------

print("\nLoading dataset...")

df = pd.read_csv(DATASET)

print(f"Dataset: {DATASET}")
print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")

# ------------------------------------------------------------
# 2. Required columns
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("REQUIRED COLUMNS")
print("=" * 70)

missing_columns = [
    column for column in FEATURES
    if column not in df.columns
]

if missing_columns:
    print("Missing feature columns:")
    for column in missing_columns:
        print(f"  - {column}")
else:
    print("OK All 12 ML features are present")

# ------------------------------------------------------------
# 3. Missing values
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("MISSING VALUES")
print("=" * 70)

missing = df[FEATURES].isna().sum()

for feature, count in missing.items():
    status = "OK" if count == 0 else "ERROR"
    print(f"{status} {feature}: {count}")

# ------------------------------------------------------------
# 4. Duplicate rows
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("DUPLICATES")
print("=" * 70)

duplicates = df.duplicated().sum()

print(f"Duplicate rows: {duplicates}")

if duplicates == 0:
    print("OK No duplicate rows")
else:
    print("WARNING Duplicate rows detected")

# ------------------------------------------------------------
# 5. User distribution
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("USER DISTRIBUTION")
print("=" * 70)

if "user_id" in df.columns:
    user_counts = df["user_id"].value_counts()

    for user, count in user_counts.items():
        print(f"{user}: {count} windows")

    print(f"\nNumber of users: {df['user_id'].nunique()}")
else:
    print("ERROR user_id column missing")

# ------------------------------------------------------------
# 6. Session distribution
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("SESSION INFORMATION")
print("=" * 70)

if "session_id" in df.columns:
    print(f"Unique sessions: {df['session_id'].nunique()}")
else:
    print("ERROR session_id column missing")

# ------------------------------------------------------------
# 7. Feature statistics
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("FEATURE STATISTICS")
print("=" * 70)

print(
    df[FEATURES]
    .describe()
    .transpose()
    .round(3)
    .to_string()
)

# ------------------------------------------------------------
# 8. Negative values
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("NEGATIVE VALUES")
print("=" * 70)

negative_counts = (df[FEATURES] < 0).sum()

for feature, count in negative_counts.items():
    status = "OK" if count == 0 else "WARNING"
    print(f"{status} {feature}: {count}")

# ------------------------------------------------------------
# 9. Zero values
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("ZERO VALUES")
print("=" * 70)

zero_counts = (df[FEATURES] == 0).sum()

for feature, count in zero_counts.items():
    print(f"{feature}: {count}")

# ------------------------------------------------------------
# 10. Dataset limitations
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("ML DATASET STATUS")
print("=" * 70)

print("OK Preprocessing completed")
print("OK Duplicate windows removed")
print("OK 12 usable exported features retained")
print("OK keysPerSec excluded because exported values were unreliable")
print("ERROR ML training has NOT been performed")
print("ERROR Impostor samples are not present")
print("ERROR Dataset is smaller than the original 4,000–6,000 window target")

# ------------------------------------------------------------
# 11. Save report
# ------------------------------------------------------------

with open(REPORT, "w", encoding="utf-8") as file:
    file.write("BEHAVIORAL DATASET VALIDATION REPORT\n")
    file.write("=" * 70 + "\n\n")

    file.write(f"Dataset: {DATASET}\n")
    file.write(f"Rows: {len(df)}\n")
    file.write(f"Columns: {len(df.columns)}\n\n")

    file.write("FEATURES\n")
    file.write("-" * 70 + "\n")

    for feature in FEATURES:
        file.write(f"- {feature}\n")

    file.write("\nMISSING VALUES\n")
    file.write("-" * 70 + "\n")

    for feature, count in missing.items():
        file.write(f"{feature}: {count}\n")

    file.write("\nUSER DISTRIBUTION\n")
    file.write("-" * 70 + "\n")

    if "user_id" in df.columns:
        for user, count in user_counts.items():
            file.write(f"{user}: {count} windows\n")

    file.write("\nFEATURE STATISTICS\n")
    file.write("-" * 70 + "\n")
    file.write(
        df[FEATURES]
        .describe()
        .transpose()
        .round(3)
        .to_string()
    )

    file.write("\n\nDATASET STATUS\n")
    file.write("-" * 70 + "\n")
    file.write("Preprocessing completed.\n")
    file.write("ML training has NOT been performed.\n")
    file.write("Impostor samples are not present.\n")
    file.write("keysPerSec was excluded due to unreliable exported values.\n")
    file.write("Dataset is smaller than the original 4,000–6,000 window target.\n")

print("\n" + "=" * 70)
print("REPORT SAVED")
print("=" * 70)
print(REPORT)
print("\nValidation complete.")