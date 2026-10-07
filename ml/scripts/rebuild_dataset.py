"""
Rebuild Canonical Behavioral Dataset from Raw Biometrics Exports.

Fixes the legacy column-offset / header mismatch issue where row[-14:]
contains the true 14 canonical features:
  [accelerationMean, accelerationStd, clickCount,
   curvatureMean, curvatureStd, dwellMeanMs, dwellStdMs,
   flightMeanMs, flightStdMs, keysPerSec, mouseTravelPx,
   scrollAmount, velocityMean, velocityStd]

Generates deterministic window_id matching backend Aegis service.
Ensures exactly ONE row per behavioral window (no duplication).
Outputs: ml/processed/behavioral_windows_canonical.csv
"""

from __future__ import annotations

import csv
import hashlib
from pathlib import Path
import sys
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = REPO_ROOT / "ml" / "raw"
PROCESSED_DIR = REPO_ROOT / "ml" / "processed"

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

USER_MAPPING = {
    "e92e7c09-c1b8-4f72-a7a8-f75077608d1b": "amal",
    "dba80c84-68fd-45b2-ba28-10f10075b239": "dristi",
    "468f03a2-d7c9-4701-abf8-bb2c692f696b": "manasa",
    "4958d349-1ff1-4f6b-8344-fca7d4d717aa": "vyas",
}


def compute_deterministic_window_id(
    user_id: str,
    session_id: str,
    window_start: str,
    window_end: str,
) -> str:
    raw = f"{user_id}:{session_id}:{window_start}:{window_end}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"win_{digest[:16]}"


def main() -> int:
    print("=" * 70)
    print("CANONICAL DATASET REBUILD PIPELINE")
    print("=" * 70)

    raw_files = sorted(RAW_DIR.glob("behavioral_biometrics_*.csv"))
    if not raw_files:
        print(f"ERROR: No raw biometrics files found in {RAW_DIR}")
        return 1

    print(f"Found {len(raw_files)} raw biometrics files in {RAW_DIR}")

    total_raw_rows = 0
    total_window_rows = 0
    unique_windows: dict[str, dict] = {}
    seen_feature_vectors: set[tuple] = set()
    duplicates_encountered = 0

    for fpath in raw_files:
        print(f"\nProcessing: {fpath.name}")
        with open(fpath, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.reader(f)
            try:
                header = next(reader)
            except StopIteration:
                continue

            try:
                u_idx = header.index("user_id")
                s_idx = header.index("session_id")
                ws_idx = header.index("window_start")
                we_idx = header.index("window_end")
            except ValueError as e:
                print(f"  Header missing required metadata field: {e}")
                return 1

            file_windows = 0
            for row in reader:
                total_raw_rows += 1
                if not row or not row[0]:
                    continue
                if row[0].strip() != "behavior_window":
                    continue

                total_window_rows += 1
                file_windows += 1

                user_id = row[u_idx].strip()
                session_id = row[s_idx].strip()
                window_start = row[ws_idx].strip()
                window_end = row[we_idx].strip()

                if len(row) < 14:
                    continue

                # The last 14 columns are the true unshifted window features
                feature_slice = row[-14:]
                try:
                    feat_vals = [float(x) for x in feature_slice]
                except ValueError as err:
                    print(f"  Warning: skipping unparseable feature row: {err}")
                    continue

                win_id = compute_deterministic_window_id(
                    user_id, session_id, window_start, window_end
                )

                # Check for duplicate window_id or duplicate feature vector for this user
                feature_tuple = (user_id, tuple(feat_vals))
                if win_id in unique_windows or feature_tuple in seen_feature_vectors:
                    duplicates_encountered += 1
                    continue

                seen_feature_vectors.add(feature_tuple)

                record = {
                    "window_id": win_id,
                    "user_id": user_id,
                    "user_name": USER_MAPPING.get(user_id, "unknown"),
                    "session_id": session_id,
                    "window_start": window_start,
                    "window_end": window_end,
                }
                for fname, fval in zip(CANONICAL_FEATURES, feat_vals):
                    record[fname] = fval

                # Canonical unit normalization:
                # If velocityMean < 20 and mouseTravelPx > 100, features were recorded in px/ms.
                # Normalize to canonical units (px/s for velocity, px/s/ms for acceleration).
                if 0.0 < record["velocityMean"] < 20.0 and record["mouseTravelPx"] > 100.0:
                    record["velocityMean"] *= 1000.0
                    record["velocityStd"] *= 1000.0
                    record["accelerationMean"] *= 1000.0
                    record["accelerationStd"] *= 1000.0

                unique_windows[win_id] = record

            print(f"  Behavior window rows in file: {file_windows}")

    print("\n" + "=" * 70)
    print("EXTRACTION & DEDUPLICATION SUMMARY")
    print("=" * 70)
    print(f"Total raw CSV rows scanned:      {total_raw_rows:,}")
    print(f"Total behavior window rows seen:  {total_window_rows:,}")
    print(f"Duplicate windows eliminated:     {duplicates_encountered:,}")
    print(f"Unique canonical windows:        {len(unique_windows):,}")

    df = pd.DataFrame(list(unique_windows.values()))

    # Basic data integrity checks
    null_count = df[CANONICAL_FEATURES].isna().sum().sum()
    if null_count > 0:
        print(f"ERROR: Found {null_count} null feature values!")
        return 1

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    out_path = PROCESSED_DIR / "behavioral_windows_canonical.csv"
    df.to_csv(out_path, index=False)
    print(f"\nSaved canonical dataset to:\n  {out_path}")

    print("\nPer-User Breakdown:")
    for user_id, group in df.groupby("user_id"):
        uname = USER_MAPPING.get(str(user_id), "unknown")
        n_sessions = group["session_id"].nunique()
        print(f"  {uname.capitalize():<8} ({user_id}): {len(group):>3} windows across {n_sessions:>2} sessions")

    print("\nFeature Summary Statistics (Canonical Units):")
    stats = df[CANONICAL_FEATURES].describe().round(3).T[["min", "mean", "std", "50%", "max"]]
    print(stats.to_string())

    print("\nRebuild completed successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
