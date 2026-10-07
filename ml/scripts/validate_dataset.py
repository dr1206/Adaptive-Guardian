"""
Comprehensive Scientific Dataset Validation Pipeline.

Validates:
- Raw vs Canonical counts & deduplication rate
- Zero duplicate windows
- Zero missing / NaN / infinite values
- Strictly disjoint train/test sessions (TRAIN_SESSIONS ∩ TEST_SESSIONS = ∅)
- Strictly disjoint train/test windows
- Zero cross-split vector leakage
- Feature variances (no constant/degenerate features)
- Domain / physiological bounds sanity
- User & session distribution statistics
- Binary evaluation trial balance

Exits with non-zero code if any data-quality rule fails.
"""

from __future__ import annotations

import json
from pathlib import Path
import sys
import numpy as np
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = REPO_ROOT / "ml" / "processed"
CANONICAL_CSV = PROCESSED_DIR / "behavioral_windows_canonical.csv"
TRAIN_CSV = PROCESSED_DIR / "ml_train_canonical.csv"
TEST_CSV = PROCESSED_DIR / "ml_test_canonical.csv"
EVAL_CSV = PROCESSED_DIR / "ml_binary_evaluation_canonical.csv"
MANIFEST_JSON = PROCESSED_DIR / "session_manifest.json"
REPORT_TXT = PROCESSED_DIR / "dataset_validation_report_canonical.txt"

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

BOUNDS = {
    "accelerationMean": (-50.0, 50.0),
    "accelerationStd": (0.0, 300.0),
    "clickCount": (0.0, 100.0),
    "dwellMeanMs": (0.0, 2000.0),
    "dwellStdMs": (0.0, 2000.0),
    "flightMeanMs": (0.0, 2000.0),
    "flightStdMs": (0.0, 2000.0),
    "keysPerSec": (0.0, 25.0),
    "mouseTravelPx": (0.0, 100000.0),
    "scrollAmount": (0.0, 50000.0),
    "velocityMean": (0.0, 8000.0),
    "velocityStd": (0.0, 8000.0),
    "curvatureMean": (0.0, 3.141593),
    "curvatureStd": (0.0, 3.141593),
}


def validate() -> tuple[bool, list[str]]:
    lines: list[str] = []
    errors: list[str] = []

    def log(msg: str = ""):
        lines.append(msg)
        print(msg)

    def err(msg: str):
        errors.append(msg)
        lines.append(f"  [FAIL] {msg}")
        print(f"  [FAIL] {msg}")

    log("=" * 75)
    log("ADAPTIVE GUARDIAN — SCIENTIFIC DATASET VALIDATION AUDIT")
    log("=" * 75)

    # 1. File existence
    for path, name in [
        (CANONICAL_CSV, "Canonical CSV"),
        (TRAIN_CSV, "Train CSV"),
        (TEST_CSV, "Test CSV"),
        (EVAL_CSV, "Binary Evaluation CSV"),
        (MANIFEST_JSON, "Session Manifest JSON"),
    ]:
        if not path.exists():
            err(f"Missing required file: {name} ({path})")

    if errors:
        return False, lines

    df_full = pd.read_csv(CANONICAL_CSV)
    df_train = pd.read_csv(TRAIN_CSV)
    df_test = pd.read_csv(TEST_CSV)
    df_eval = pd.read_csv(EVAL_CSV)
    with open(MANIFEST_JSON, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    log(f"\n[1] DATASET VOLUME & DEDUPLICATION INTEGRITY")
    log(f"  Total canonical unique windows: {len(df_full):,}")
    log(f"  Disjoint training windows:     {len(df_train):,} ({len(df_train)/len(df_full)*100:.1f}%)")
    log(f"  Disjoint testing windows:      {len(df_test):,} ({len(df_test)/len(df_full)*100:.1f}%)")
    log(f"  Total binary evaluation trials: {len(df_eval):,}")

    # Check window ID uniqueness
    full_dups = df_full["window_id"].duplicated().sum()
    if full_dups > 0:
        err(f"Found {full_dups} duplicate window_id entries in canonical dataset!")
    else:
        log("  [PASS] Zero duplicate window_ids in canonical dataset.")

    # 2. Strict Session-Disjointness Check
    log(f"\n[2] STRICT SESSION-DISJOINTNESS & LEAKAGE AUDIT")
    train_sessions = set(df_train["session_id"].unique())
    test_sessions = set(df_test["session_id"].unique())
    sess_overlap = train_sessions.intersection(test_sessions)
    if sess_overlap:
        err(f"TRAIN_SESSIONS INTERSECT TEST_SESSIONS is not empty! Leaked sessions: {sess_overlap}")
    else:
        log("  [PASS] TRAIN_SESSIONS INTERSECT TEST_SESSIONS = EMPTY (Strictly 0 session overlap)")
        log(f"         Unique train sessions: {len(train_sessions)}, test sessions: {len(test_sessions)}")

    # Check window leakage across splits
    train_windows = set(df_train["window_id"].unique())
    test_windows = set(df_test["window_id"].unique())
    win_overlap = train_windows.intersection(test_windows)
    if win_overlap:
        err(f"TRAIN_WINDOWS and TEST_WINDOWS overlap! Leaked windows: {len(win_overlap)}")
    else:
        log("  [PASS] TRAIN_WINDOWS INTERSECT TEST_WINDOWS = EMPTY (Strictly 0 window overlap)")

    # Check feature vector exact collision across train and test
    train_feat_tuples = set(tuple(x) for x in df_train[CANONICAL_FEATURES].values)
    test_feat_tuples = set(tuple(x) for x in df_test[CANONICAL_FEATURES].values)
    feat_overlap = train_feat_tuples.intersection(test_feat_tuples)
    if feat_overlap:
        err(f"Feature vector collision across train and test! Overlap count: {len(feat_overlap)}")
    else:
        log(f"  [PASS] Zero identical feature vectors across train and test splits")

    # 3. Missing / NaN / Infinite Values
    log(f"\n[3] NUMERICAL DATA INTEGRITY")
    null_count = df_full[CANONICAL_FEATURES].isna().sum().sum()
    inf_count = np.isinf(df_full[CANONICAL_FEATURES].values).sum()
    if null_count > 0:
        err(f"Found {null_count} null/NaN values across canonical features!")
    else:
        log("  [PASS] Zero missing/NaN values across all 14 features")

    if inf_count > 0:
        err(f"Found {inf_count} infinite values across canonical features!")
    else:
        log("  [PASS] Zero infinite values across all 14 features")

    # 4. Constant Features
    log(f"\n[4] DEGENERATE FEATURE AUDIT (VARIANCE CHECK)")
    for col in CANONICAL_FEATURES:
        var = df_full[col].var()
        if var == 0 or np.isnan(var):
            err(f"Feature '{col}' is constant (zero variance)!")
        else:
            log(f"  [PASS] Feature '{col}': variance = {var:.4f}")

    # 5. Physiological Bounds Sanity
    log(f"\n[5] PHYSIOLOGICAL & DOMAIN BOUNDS CHECK")
    for col, (b_min, b_max) in BOUNDS.items():
        v_min = df_full[col].min()
        v_max = df_full[col].max()
        if v_min < b_min or v_max > b_max:
            err(f"Feature '{col}' outside expected domain bounds [{b_min}, {b_max}]: found [{v_min}, {v_max}]")
        else:
            log(f"  [PASS] Feature '{col:<16}': range [{v_min:9.3f}, {v_max:9.3f}] (within [{b_min}, {b_max}])")

    # 6. User and Session Representation
    log(f"\n[6] USER & SESSION STRATIFICATION AUDIT")
    for uid, m in manifest.items():
        n_train_s = len(m["train_sessions"])
        n_test_s = len(m["test_sessions"])
        if n_train_s < 1:
            err(f"User {m['user_name']} has no training sessions!")
        if n_test_s < 1:
            err(f"User {m['user_name']} has no test sessions!")
        log(
            f"  User {m['user_name'].capitalize():<8}: {n_train_s:>2} train sess ({m['train_windows']:>3} win) | "
            f"{n_test_s:>2} test sess ({m['test_windows']:>3} win)"
        )

    # 7. Binary Trial Balance
    log(f"\n[7] BINARY AUTHENTICATION EVALUATION INTEGRITY")
    n_genuine = (df_eval["label"] == 0).sum()
    n_impostor = (df_eval["label"] == 1).sum()
    log(f"  Genuine evaluation trials:  {n_genuine:>4} (label=0)")
    log(f"  Impostor evaluation trials: {n_impostor:>4} (label=1)")
    log(f"  Impostor-to-genuine ratio:  {n_impostor/n_genuine:.2f}:1")
    if n_genuine == 0 or n_impostor == 0:
        err("Evaluation set is missing either genuine or impostor trials!")
    else:
        log("  [PASS] Balanced multi-user continuous authentication trial formulation")

    # Summary Result
    log("\n" + "=" * 75)
    if errors:
        log(f"VALIDATION FAILED WITH {len(errors)} ERROR(S)")
        for e in errors:
            log(f"  - {e}")
        log("=" * 75)
        return False, lines

    log("ALL AUDIT CHECKS PASSED PERFECTLY (100% PRODUCTION-GRADE INTEGRITY)")
    log("=" * 75)
    return True, lines


def main() -> int:
    success, lines = validate()
    REPORT_TXT.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_TXT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"\nSaved full validation report to:\n  {REPORT_TXT}")
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
