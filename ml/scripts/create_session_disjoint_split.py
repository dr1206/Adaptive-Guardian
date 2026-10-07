"""
Create Session-Disjoint Train/Test Split & Multi-User Labeled Datasets.

Enforces strict scientific guarantees:
1. TRAIN_SESSIONS ∩ TEST_SESSIONS = ∅ (strictly zero session overlap)
2. TRAIN_WINDOWS ∩ TEST_WINDOWS = ∅ (strictly zero window overlap)
3. Explicit metadata: session_id, actor_user_id, target_user_id, label, label_name
4. Output datasets:
   - ml/processed/session_manifest.json (auditable split manifest)
   - ml/processed/ml_train_canonical.csv (train windows)
   - ml/processed/ml_test_canonical.csv (test windows)
   - ml/processed/ml_binary_evaluation_canonical.csv (disjoint genuine + impostor evaluation trials)
"""

from __future__ import annotations

import json
from pathlib import Path
import random
import sys
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = REPO_ROOT / "ml" / "processed"
CANONICAL_CSV = PROCESSED_DIR / "behavioral_windows_canonical.csv"

CANONICAL_FEATURES = [
    "accelerationMean",
    "accelerationStd",
    "clickCount",
    "curvatureMean",
    "curvatureStd",
    "dwellMeanMs",
    "dwellStdMs",
    "flightMeanMs",
    "flightStdMs",
    "keysPerSec",
    "mouseTravelPx",
    "scrollAmount",
    "velocityMean",
    "velocityStd",
]

RANDOM_SEED = 42


def main() -> int:
    print("=" * 70)
    print("SESSION-DISJOINT SPLIT & SCIENTIFIC LABELING")
    print("=" * 70)

    if not CANONICAL_CSV.exists():
        print(f"ERROR: {CANONICAL_CSV} not found! Run rebuild_dataset.py first.")
        return 1

    df = pd.read_csv(CANONICAL_CSV)
    print(f"Loaded {len(df)} canonical windows across {df['user_id'].nunique()} users.")

    rng = random.Random(RANDOM_SEED)

    train_sessions: set[str] = set()
    test_sessions: set[str] = set()
    session_user_map: dict[str, str] = {}
    manifest: dict[str, dict] = {}

    for uid, ugroup in df.groupby("user_id"):
        uname = ugroup["user_name"].iloc[0]
        # Sort sessions by window count to ensure representative stratified sampling
        sessions = ugroup["session_id"].value_counts().index.tolist()
        for s in sessions:
            session_user_map[s] = uid

        # 70/30 split on sessions, guaranteeing at least 1 test session
        n_sessions = len(sessions)
        n_test = max(1, round(n_sessions * 0.30))
        # Deterministic shuffle with seeded RNG
        shuffled = list(sessions)
        rng.shuffle(shuffled)
        u_test = set(shuffled[:n_test])
        u_train = set(shuffled[n_test:])

        train_sessions.update(u_train)
        test_sessions.update(u_test)

        manifest[uid] = {
            "user_name": uname,
            "total_sessions": n_sessions,
            "train_sessions": sorted(list(u_train)),
            "test_sessions": sorted(list(u_test)),
            "train_windows": int(ugroup[ugroup["session_id"].isin(u_train)].shape[0]),
            "test_windows": int(ugroup[ugroup["session_id"].isin(u_test)].shape[0]),
        }

    # Verify zero session leakage
    session_leakage = train_sessions.intersection(test_sessions)
    if session_leakage:
        print(f"FATAL ERROR: Session leakage detected: {session_leakage}")
        return 1

    print("\nSession Allocation by User:")
    for uid, m in manifest.items():
        print(
            f"  {m['user_name'].capitalize():<8}: {len(m['train_sessions'])} train sess ({m['train_windows']} win) | "
            f"{len(m['test_sessions'])} test sess ({m['test_windows']} win)"
        )

    # Save session manifest
    manifest_path = PROCESSED_DIR / "session_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nSaved session manifest to: {manifest_path}")

    # Assign split to windows
    df["split"] = df["session_id"].apply(
        lambda sid: "train" if sid in train_sessions else ("test" if sid in test_sessions else "unknown")
    )

    train_df = df[df["split"] == "train"].copy()
    test_df = df[df["split"] == "test"].copy()

    # Verify zero window overlap
    window_leakage = set(train_df["window_id"]).intersection(set(test_df["window_id"]))
    if window_leakage:
        print(f"FATAL ERROR: Window leakage detected: {len(window_leakage)} overlapping windows!")
        return 1

    train_out = PROCESSED_DIR / "ml_train_canonical.csv"
    test_out = PROCESSED_DIR / "ml_test_canonical.csv"
    train_df.to_csv(train_out, index=False)
    test_df.to_csv(test_out, index=False)
    print(f"Saved disjoint train set ({len(train_df)} windows) to: {train_out}")
    print(f"Saved disjoint test set  ({len(test_df)} windows) to: {test_out}")

    # Build full binary authentication trial dataset for cross-user evaluation
    # For each user U:
    #   Genuine trials: U interacting on U's account (label=0)
    #   Impostor trials: other users attacking U's account (label=1)
    eval_rows = []
    users = df["user_id"].unique()

    for target_uid in users:
        target_name = df[df["user_id"] == target_uid]["user_name"].iloc[0]
        # Genuine test windows for target user
        target_test_windows = test_df[test_df["user_id"] == target_uid]
        for _, row in target_test_windows.iterrows():
            d = row.to_dict()
            d["target_user_id"] = target_uid
            d["target_user_name"] = target_name
            d["actor_user_id"] = target_uid
            d["actor_user_name"] = target_name
            d["label"] = 0
            d["label_name"] = "genuine"
            eval_rows.append(d)

        # Impostor test windows (other users' test sessions attacking target)
        impostor_test_windows = test_df[test_df["user_id"] != target_uid]
        for _, row in impostor_test_windows.iterrows():
            d = row.to_dict()
            d["target_user_id"] = target_uid
            d["target_user_name"] = target_name
            d["actor_user_id"] = row["user_id"]
            d["actor_user_name"] = row["user_name"]
            d["label"] = 1
            d["label_name"] = "impostor"
            eval_rows.append(d)

    eval_df = pd.DataFrame(eval_rows)
    eval_out = PROCESSED_DIR / "ml_binary_evaluation_canonical.csv"
    eval_df.to_csv(eval_out, index=False)
    print(f"Saved binary evaluation set ({len(eval_df)} trials) to: {eval_out}")
    print(
        f"  Genuine trials:  {(eval_df['label'] == 0).sum():>4} (across 4 target accounts)\n"
        f"  Impostor trials: {(eval_df['label'] == 1).sum():>4} (across 4 target accounts)"
    )

    print("\nSession disjoint split completed with zero leakage.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
