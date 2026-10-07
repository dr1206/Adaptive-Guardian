"""
Adaptive Guardian — Baseline Profile Management & Fresh Enrollment CLI

Allows:
  1. --action reset:
     Wipes out stale/synthetic baseline profiles, deletes old model files
     (ocsvm_<uid>.joblib, lightgbm_<uid>.joblib), resets MongoDB collections
     (behavior_windows, training_features, training_events, training_sessions,
      decisions, behavioral_profiles) for the user, putting the system into
     unblocked fresh data collection mode.

  2. --action status:
     Inspects the count of newly recorded training events, features, and
     behavior windows in MongoDB for the target user.

  3. --action enroll:
     Collects all fresh authentic samples from MongoDB, computes the user's
     real biometric baseline statistics (dwell time, flight time, typing speed,
     mouse dynamics), fits a personalized One-Class SVM, computes genuine
     decision boundary calibration, and saves the active model and baseline.

Usage:
  python ml/scripts/manage_baseline_profile.py --action reset [--user amal@adaptiveguardian.dev]
  python ml/scripts/manage_baseline_profile.py --action status [--user amal@adaptiveguardian.dev]
  python ml/scripts/manage_baseline_profile.py --action enroll [--user amal@adaptiveguardian.dev]
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from pymongo import MongoClient
from sklearn.svm import OneClassSVM

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("manage_profile")

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
ML_MODELS_DIR = PROJECT_ROOT / "ml" / "models"
USER_BASELINES_FILE = ML_MODELS_DIR / "user_baselines.json"
CALIBRATION_FILE = ML_MODELS_DIR / "ocsvm_calibration.joblib"
SCALER_FILE = ML_MODELS_DIR / "standard_scaler.joblib"

sys.path.insert(0, str(PROJECT_ROOT / "backend" / "src"))
from app.config import settings

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

DEFAULT_BASELINE: dict[str, float] = {
    "accelerationMean": 0.63,
    "accelerationStd": 6.74,
    "clickCount": 4.98,
    "curvatureMean": 0.30,
    "curvatureStd": 0.21,
    "dwellMeanMs": 100.72,
    "dwellStdMs": 26.42,
    "flightMeanMs": 93.80,
    "flightStdMs": 25.56,
    "keysPerSec": 4.1,
    "mouseTravelPx": 21629.7,
    "scrollAmount": 335.4,
    "velocityMean": 1052.97,
    "velocityStd": 138.7,
}


def get_mongo_db():
    client = MongoClient(settings.mongodb_uri, uuidRepresentation="standard")
    return client[settings.mongodb_db_name]


def resolve_user(db, identifier: str) -> tuple[uuid.UUID, str, str]:
    """Resolve user UUID, email, and full name."""
    user_doc = None
    try:
        user_uuid = uuid.UUID(identifier)
        user_doc = db["users"].find_one({"_id": user_uuid})
    except ValueError:
        pass

    if not user_doc:
        user_doc = db["users"].find_one({"email": identifier.strip().lower()})

    if not user_doc:
        # Fallback search by prefix or partial
        for doc in db["users"].find():
            if identifier.lower() in doc.get("email", "").lower() or identifier.lower() in doc.get("full_name", "").lower():
                user_doc = doc
                break

    if not user_doc:
        raise ValueError(f"Could not find user matching '{identifier}' in MongoDB users collection.")

    u_id = user_doc["_id"] if isinstance(user_doc["_id"], uuid.UUID) else uuid.UUID(str(user_doc["_id"]))
    email = user_doc.get("email", "unknown")
    name = user_doc.get("full_name", "unknown")
    return u_id, email, name


def action_reset(db, user_uuid: uuid.UUID, email: str, name: str) -> None:
    uid_str = str(user_uuid).lower()
    print("=" * 70)
    print(f"RESETTING BASELINE PROFILE FOR: {name} ({email})")
    print(f"User UUID: {uid_str}")
    print("=" * 70)

    # 1. Delete user model files from ml/models
    ocsvm_path = ML_MODELS_DIR / f"ocsvm_{uid_str}.joblib"
    if ocsvm_path.exists():
        ocsvm_path.unlink()
        print(f"[OK] Deleted model file: {ocsvm_path.name}")
    else:
        print(f"[INFO] No existing {ocsvm_path.name} file found.")

    lgbm_path = ML_MODELS_DIR / f"lightgbm_{uid_str}.joblib"
    if lgbm_path.exists():
        lgbm_path.unlink()
        print(f"[OK] Deleted model file: {lgbm_path.name}")

    # 2. Update user_baselines.json
    if USER_BASELINES_FILE.exists():
        try:
            with open(USER_BASELINES_FILE, "r", encoding="utf-8") as f:
                ub_data = json.load(f)
            if uid_str in ub_data:
                del ub_data[uid_str]
                with open(USER_BASELINES_FILE, "w", encoding="utf-8") as f:
                    json.dump(ub_data, f, indent=2)
                print(f"[OK] Removed entry from {USER_BASELINES_FILE.name}")
        except Exception as e:
            print(f"[WARN] Error updating {USER_BASELINES_FILE.name}: {e}")

    # 3. Update ocsvm_calibration.joblib
    if CALIBRATION_FILE.exists():
        try:
            calib = joblib.load(CALIBRATION_FILE)
            if uid_str in calib:
                del calib[uid_str]
                joblib.dump(calib, CALIBRATION_FILE)
                print(f"[OK] Removed entry from {CALIBRATION_FILE.name}")
        except Exception as e:
            print(f"[WARN] Error updating {CALIBRATION_FILE.name}: {e}")

    # 4. Wipe stale records from MongoDB
    r_bw = db["behavior_windows"].delete_many({"user_id": user_uuid})
    r_tf = db["training_features"].delete_many({"user_id": user_uuid})
    r_te = db["training_events"].delete_many({"user_id": user_uuid})
    r_ts = db["training_sessions"].delete_many({"user_id": user_uuid})
    r_dec = db["decisions"].delete_many({"user_id": user_uuid})

    print(f"[OK] MongoDB records cleared:")
    print(f"     - Behavior Windows deleted:    {r_bw.deleted_count}")
    print(f"     - Training Features deleted:   {r_tf.deleted_count}")
    print(f"     - Training Events deleted:     {r_te.deleted_count}")
    print(f"     - Training Sessions deleted:   {r_ts.deleted_count}")
    print(f"     - Stale Decisions deleted:     {r_dec.deleted_count}")

    # 5. Reset BehavioralProfile document to NOT_TRAINED
    now = datetime.now(timezone.utc)
    db["behavioral_profiles"].update_one(
        {"user_id": user_uuid},
        {
            "$set": {
                "user_id": user_uuid,
                "status": "NOT_TRAINED",
                "sample_count": 0,
                "accepted_windows_count": 0,
                "baseline_stats": {},
                "updated_at": now,
            }
        },
        upsert=True,
    )
    print(f"[OK] BehavioralProfile in MongoDB reset to status: NOT_TRAINED")

    print("\n" + "*" * 70)
    print("SUCCESS: Old baseline and mismatching data have been completely cleared!")
    print("You are now in FRESH DATA COLLECTION mode.")
    print("Next steps:")
    print("  1. Open http://localhost:8080/app/training in your browser.")
    print("  2. Complete the 4 exercises naturally (Typing Practice, Consistency Check,")
    print("     Paragraph Typing, Mouse Exercise) or interact with the banking app.")
    print("  3. Run: python ml/scripts/manage_baseline_profile.py --action enroll")
    print("*" * 70 + "\n")


def action_status(db, user_uuid: uuid.UUID, email: str, name: str) -> None:
    uid_str = str(user_uuid).lower()
    print("=" * 70)
    print(f"CHECKING STATUS FOR: {name} ({email})")
    print(f"User UUID: {uid_str}")
    print("=" * 70)

    profile = db["behavioral_profiles"].find_one({"user_id": user_uuid})
    bw_count = db["behavior_windows"].count_documents({"user_id": user_uuid})
    tf_count = db["training_features"].count_documents({"user_id": user_uuid})
    ts_count = db["training_sessions"].count_documents({"user_id": user_uuid, "status": "completed"})
    te_count = db["training_events"].count_documents({"user_id": user_uuid})

    status_str = profile.get("status", "NOT_FOUND") if profile else "NOT_FOUND"
    print(f"Profile Status:       {status_str}")
    print(f"Completed Sessions:   {ts_count} / 4 tasks")
    print(f"Training Features:    {tf_count}")
    print(f"Behavior Windows:     {bw_count}")
    print(f"Raw Events Recorded:  {te_count}")

    has_model = (ML_MODELS_DIR / f"ocsvm_{uid_str}.joblib").exists()
    print(f"Personal OC-SVM Model: {'YES (Active)' if has_model else 'NO (Enrollment Needed)'}")

    total_samples = tf_count + bw_count
    print("-" * 70)
    if total_samples == 0:
        print("STATUS: NOT_TRAINED. Please visit /app/training to start recording.")
    elif total_samples < 4:
        print(f"STATUS: COLLECTING. {total_samples} samples collected so far. We recommend at least 4-10 samples before enrolling.")
    else:
        print(f"STATUS: READY TO ENROLL! You have {total_samples} fresh samples.")
        print("Run: python ml/scripts/manage_baseline_profile.py --action enroll")
    print("=" * 70 + "\n")


def action_enroll(db, user_uuid: uuid.UUID, email: str, name: str, min_samples: int = 2) -> None:
    uid_str = str(user_uuid).lower()
    print("=" * 70)
    print(f"ENROLLING FRESH BASELINE FOR: {name} ({email})")
    print(f"User UUID: {uid_str}")
    print("=" * 70)

    # 1. Fetch fresh samples from MongoDB
    windows = list(db["behavior_windows"].find({"user_id": user_uuid}))
    training_feats = list(db["training_features"].find({"user_id": user_uuid}))

    features_list: list[dict[str, float]] = []

    for w in windows:
        feats = w.get("features")
        if feats and isinstance(feats, dict):
            features_list.append(feats)

    for tf in training_feats:
        f_dict: dict[str, float] = {}
        if tf.get("mean_key_hold") and tf["mean_key_hold"] > 0:
            f_dict["dwellMeanMs"] = float(tf["mean_key_hold"])
            f_dict["dwellStdMs"] = float(tf.get("std_key_hold", 12.0) or 12.0)
        if tf.get("mean_flight_time") and tf["mean_flight_time"] > 0:
            f_dict["flightMeanMs"] = float(tf["mean_flight_time"])
            f_dict["flightStdMs"] = float(tf.get("std_flight_time", 15.0) or 15.0)
        if tf.get("typing_speed") and tf["typing_speed"] > 0:
            f_dict["keysPerSec"] = float(tf["typing_speed"])
        if tf.get("mouse_speed_mean") and tf["mouse_speed_mean"] > 0:
            f_dict["velocityMean"] = float(tf["mouse_speed_mean"] * 1000)
            f_dict["velocityStd"] = float((tf.get("mouse_speed_std", 0.1) or 0.1) * 1000)
        if tf.get("mouse_acceleration") is not None:
            f_dict["accelerationMean"] = float(tf["mouse_acceleration"])
            f_dict["accelerationStd"] = 1.0
        if tf.get("trajectory_length") is not None:
            f_dict["mouseTravelPx"] = float(tf["trajectory_length"])
        if f_dict:
            features_list.append(f_dict)

    print(f"Found {len(features_list)} total fresh biometric samples ({len(windows)} windows + {len(training_feats)} training tasks).")
    if len(features_list) < min_samples:
        print(f"[ERROR] Insufficient samples. Found {len(features_list)}, but minimum required is {min_samples}.")
        print("Please complete the exercises on http://localhost:8080/app/training first.")
        sys.exit(1)

    # 2. Compute authentic user baseline vector
    computed_baseline: dict[str, float] = {}
    baseline_stats_doc: dict[str, dict[str, float]] = {}

    for feat in CANONICAL_FEATURES:
        vals = [float(f[feat]) for f in features_list if feat in f and f[feat] is not None and not np.isnan(f[feat])]
        if not vals:
            val_mean = DEFAULT_BASELINE.get(feat, 0.0)
            val_std = 1.0
        else:
            val_mean = float(np.mean(vals))
            val_std = float(np.std(vals)) if len(vals) > 1 else 1.0
            if val_std < 1e-4:
                val_std = max(1.0, abs(val_mean) * 0.1)

        computed_baseline[feat] = round(val_mean, 4)
        baseline_stats_doc[feat] = {"mean": round(val_mean, 4), "std": round(val_std, 4)}

    print("\nCalculated Authentic Biometric Baseline:")
    print(f"  Typing Dwell Mean:     {computed_baseline.get('dwellMeanMs', 0):.2f} ms")
    print(f"  Typing Flight Mean:    {computed_baseline.get('flightMeanMs', 0):.2f} ms")
    print(f"  Keys / Second:         {computed_baseline.get('keysPerSec', 0):.2f}")
    print(f"  Mouse Velocity Mean:   {computed_baseline.get('velocityMean', 0):.2f} px/s")
    print(f"  Mouse Curvature Mean:  {computed_baseline.get('curvatureMean', 0):.4f}")
    print(f"  Mouse Acceleration:    {computed_baseline.get('accelerationMean', 0):.4f}")

    # 3. Fit personalized One-Class SVM
    if not SCALER_FILE.exists():
        print(f"[ERROR] Scaler file not found at {SCALER_FILE}")
        sys.exit(1)

    scaler = joblib.load(SCALER_FILE)

    data_rows = []
    for f in features_list:
        row = [float(f.get(feat, computed_baseline[feat])) for feat in CANONICAL_FEATURES]
        data_rows.append(row)

    # Generate synthetic variations around authentic samples to build an RBF hypersphere if sample count is modest
    rng = np.random.default_rng(42)
    while len(data_rows) < 30:
        base_sample = data_rows[rng.integers(0, len(data_rows))]
        noise = [rng.normal(0, max(0.01, abs(v) * 0.05)) for v in base_sample]
        data_rows.append([max(0.0, v + n) for v, n in zip(base_sample, noise)])

    df = pd.DataFrame(data_rows, columns=CANONICAL_FEATURES)
    scaled_matrix = scaler.transform(df)

    ocsvm = OneClassSVM(kernel="rbf", gamma="scale", nu=0.08)
    ocsvm.fit(scaled_matrix)

    # 4. Compute decision calibration bounds
    dfs = ocsvm.decision_function(scaled_matrix)
    lb = float(np.percentile(dfs, 5))
    ub = float(np.percentile(dfs, 95))
    if ub <= lb:
        ub = lb + 0.1
    calib_bounds = {"lower_bound": lb, "upper_bound": ub}

    # 5. Save model artifacts
    ocsvm_save_path = ML_MODELS_DIR / f"ocsvm_{uid_str}.joblib"
    joblib.dump(ocsvm, ocsvm_save_path)
    print(f"\n[OK] Saved personalized OC-SVM model: {ocsvm_save_path.name}")

    # Update calibration dictionary
    calib = {}
    if CALIBRATION_FILE.exists():
        calib = joblib.load(CALIBRATION_FILE)
    calib[uid_str] = calib_bounds
    joblib.dump(calib, CALIBRATION_FILE)
    print(f"[OK] Updated calibration bounds: [{lb:.4f}, {ub:.4f}] in {CALIBRATION_FILE.name}")

    # Update user_baselines.json
    ub_data = {}
    if USER_BASELINES_FILE.exists():
        try:
            with open(USER_BASELINES_FILE, "r", encoding="utf-8") as f:
                ub_data = json.load(f)
        except Exception:
            pass
    ub_data[uid_str] = computed_baseline
    with open(USER_BASELINES_FILE, "w", encoding="utf-8") as f:
        json.dump(ub_data, f, indent=2)
    print(f"[OK] Persisted baseline vector in {USER_BASELINES_FILE.name}")

    # 6. Update MongoDB profile
    now = datetime.now(timezone.utc)
    db["behavioral_profiles"].update_one(
        {"user_id": user_uuid},
        {
            "$set": {
                "user_id": user_uuid,
                "status": "MODEL_READY",
                "sample_count": len(features_list),
                "accepted_windows_count": len(features_list),
                "baseline_stats": baseline_stats_doc,
                "updated_at": now,
            }
        },
        upsert=True,
    )
    print(f"[OK] Updated BehavioralProfile in MongoDB to status: MODEL_READY")

    print("\n" + "*" * 70)
    print(f"ENROLLMENT COMPLETE! Your genuine biometric profile is now active.")
    print("The system will now continuously verify your actual typing and mouse rhythm.")
    print("*" * 70 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Manage Adaptive Guardian Behavioral Baseline Profile")
    parser.add_argument(
        "--action",
        choices=["reset", "status", "enroll"],
        required=True,
        help="Action to perform: 'reset' to clear old profile, 'status' to check data collection, 'enroll' to fit new baseline.",
    )
    parser.add_argument(
        "--user",
        default="e92e7c09-c1b8-4f72-a7a8-f75077608d1b",
        help="Target user email or UUID (default: Amal)",
    )
    parser.add_argument(
        "--min-samples",
        type=int,
        default=2,
        help="Minimum required samples to enroll (default: 2)",
    )

    args = parser.parse_args()

    db = get_mongo_db()
    user_uuid, email, name = resolve_user(db, args.user)

    if args.action == "reset":
        action_reset(db, user_uuid, email, name)
    elif args.action == "status":
        action_status(db, user_uuid, email, name)
    elif args.action == "enroll":
        action_enroll(db, user_uuid, email, name, min_samples=args.min_samples)


if __name__ == "__main__":
    main()
