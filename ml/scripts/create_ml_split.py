import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    BASE_DIR
    / "ml"
    / "processed"
    / "behavioral_windows_labeled_clean.csv"
)

OUTPUT_DIR = BASE_DIR / "ml" / "processed"

TRAIN_FILE = OUTPUT_DIR / "ml_train.csv"
TEST_FILE = OUTPUT_DIR / "ml_test.csv"


print("=" * 70)
print("CREATING LABEL-BALANCED SESSION-BASED ML SPLIT")
print("=" * 70)

df = pd.read_csv(INPUT_FILE)

print(f"\nTotal rows: {len(df)}")
print(f"Total sessions: {df['session_id'].nunique()}")
print(f"Users: {df['user_id'].nunique()}")

print("\nLabels:")
print(df["label"].value_counts())


# ---------------------------------------------------------
# Determine the label of each session.
# A session must contain only one label.
# ---------------------------------------------------------

session_labels = (
    df.groupby("session_id")["label"]
    .agg(lambda x: set(x))
)

mixed_sessions = session_labels[
    session_labels.apply(len) > 1
]

if len(mixed_sessions) > 0:
    print("\nERROR: Some sessions contain multiple labels:")
    print(mixed_sessions)
    raise SystemExit(1)


session_table = pd.DataFrame({
    "session_id": session_labels.index,
    "label": session_labels.apply(lambda x: list(x)[0]).values,
})


print("\nSession labels:")
print(session_table["label"].value_counts())


# ---------------------------------------------------------
# Split SESSIONS while preserving label distribution.
# ---------------------------------------------------------

train_sessions, test_sessions = train_test_split(
    session_table,
    test_size=0.25,
    random_state=42,
    stratify=session_table["label"],
)


train_session_ids = set(train_sessions["session_id"])
test_session_ids = set(test_sessions["session_id"])


# ---------------------------------------------------------
# Build row-level datasets from complete sessions.
# ---------------------------------------------------------

train_df = df[
    df["session_id"].isin(train_session_ids)
].copy()

test_df = df[
    df["session_id"].isin(test_session_ids)
].copy()


# ---------------------------------------------------------
# Verify no session leakage.
# ---------------------------------------------------------

overlap = (
    train_session_ids
    .intersection(test_session_ids)
)

print("\nSession split:")
print(f"Training sessions: {len(train_session_ids)}")
print(f"Testing sessions : {len(test_session_ids)}")
print(f"Session overlap  : {len(overlap)}")


if overlap:
    print("\nERROR: Session leakage detected!")
    raise SystemExit(1)


# ---------------------------------------------------------
# Verify both labels exist in both datasets.
# ---------------------------------------------------------

print("\nTraining dataset:")
print(f"Rows: {len(train_df)}")
print(f"Sessions: {train_df['session_id'].nunique()}")
print(train_df["label"].value_counts())


print("\nTesting dataset:")
print(f"Rows: {len(test_df)}")
print(f"Sessions: {test_df['session_id'].nunique()}")
print(test_df["label"].value_counts())


if train_df["label"].nunique() < 2:
    print("\nERROR: Training set contains only one label.")
    raise SystemExit(1)

if test_df["label"].nunique() < 2:
    print("\nERROR: Testing set contains only one label.")
    raise SystemExit(1)


# ---------------------------------------------------------
# Save.
# ---------------------------------------------------------

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

train_df.to_csv(TRAIN_FILE, index=False)
test_df.to_csv(TEST_FILE, index=False)


print("\nSaved:")
print(TRAIN_FILE)
print(TEST_FILE)

print("\nML TRAINING HAS NOT BEEN PERFORMED.")
print("=" * 70)