import csv
from pathlib import Path
from collections import Counter, defaultdict


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    BASE_DIR
    / "ml"
    / "processed"
    / "behavioral_windows_labeled.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "ml"
    / "processed"
    / "labeled_dataset_validation_report.txt"
)


# =========================================================
# FEATURES
# =========================================================

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


# =========================================================
# LOAD DATA
# =========================================================

def load_data():

    if not INPUT_FILE.exists():
        print("ERROR: Labeled dataset not found:")
        print(INPUT_FILE)
        return []

    with open(
        INPUT_FILE,
        "r",
        encoding="utf-8-sig",
        newline=""
    ) as f:

        reader = csv.DictReader(f)

        rows = list(reader)

    return rows


# =========================================================
# HELPERS
# =========================================================

def to_float(value):

    if value is None:
        return None

    value = value.strip()

    if value == "":
        return None

    try:
        return float(value)
    except ValueError:
        return None


def feature_tuple(row):

    values = []

    for feature in FEATURES:

        value = to_float(row.get(feature))

        if value is None:
            return None

        values.append(round(value, 10))

    return tuple(values)


# =========================================================
# MAIN VALIDATION
# =========================================================

def main():

    rows = load_data()

    if not rows:
        return

    report = []

    def log(text=""):
        print(text)
        report.append(text)

    log("=" * 70)
    log("LABELED DATASET VALIDATION")
    log("=" * 70)

    # -----------------------------------------------------
    # Basic information
    # -----------------------------------------------------

    log()
    log(f"Input file: {INPUT_FILE}")
    log(f"Rows: {len(rows)}")
    log(f"Columns: {len(rows[0])}")

    # -----------------------------------------------------
    # Required columns
    # -----------------------------------------------------

    required_columns = [
        "user",
        "label",
        "user_id",
        "session_id",
        "device_id",
        "window_start",
        "window_end",
    ] + FEATURES

    missing_columns = [
        column
        for column in required_columns
        if column not in rows[0]
    ]

    log()
    log("REQUIRED COLUMNS")
    log("-" * 70)

    if missing_columns:
        log("ERROR: Missing columns:")
        for column in missing_columns:
            log(f"  {column}")
    else:
        log("OK: All required columns are present.")

    # -----------------------------------------------------
    # Labels
    # -----------------------------------------------------

    labels = Counter(
        row.get("label", "").strip()
        for row in rows
    )

    log()
    log("LABEL COUNTS")
    log("-" * 70)

    for label, count in sorted(labels.items()):
        log(f"{label}: {count}")

    # -----------------------------------------------------
    # Users
    # -----------------------------------------------------

    users = sorted(
        set(row.get("user", "").strip() for row in rows)
    )

    log()
    log(f"USERS: {len(users)}")
    log("-" * 70)

    for user in users:

        genuine = sum(
            1
            for row in rows
            if row.get("user") == user
            and row.get("label") == "genuine"
        )

        impostor = sum(
            1
            for row in rows
            if row.get("user") == user
            and row.get("label") == "impostor"
        )

        log(
            f"{user}: "
            f"genuine={genuine}, "
            f"impostor={impostor}"
        )

    # -----------------------------------------------------
    # Missing values
    # -----------------------------------------------------

    log()
    log("MISSING VALUES")
    log("-" * 70)

    total_missing = 0

    for feature in FEATURES:

        missing = sum(
            1
            for row in rows
            if to_float(row.get(feature)) is None
        )

        total_missing += missing

        log(f"{feature}: {missing}")

    # -----------------------------------------------------
    # Invalid numeric values
    # -----------------------------------------------------

    log()
    log("INVALID NUMERIC VALUES")
    log("-" * 70)

    invalid_count = 0

    for feature in FEATURES:

        invalid = 0

        for row in rows:

            value = row.get(feature, "").strip()

            if value == "":
                continue

            try:
                float(value)
            except ValueError:
                invalid += 1

        if invalid:
            log(f"{feature}: {invalid}")
            invalid_count += invalid

    if invalid_count == 0:
        log("OK: No invalid numeric values.")

    # -----------------------------------------------------
    # Negative values
    # -----------------------------------------------------

    log()
    log("NEGATIVE VALUES")
    log("-" * 70)

    negative_total = 0

    for feature in FEATURES:

        negative = sum(
            1
            for row in rows
            if (
                to_float(row.get(feature)) is not None
                and to_float(row.get(feature)) < 0
            )
        )

        if negative:
            log(f"{feature}: {negative}")

        negative_total += negative

    if negative_total == 0:
        log("OK: No negative feature values.")

    # -----------------------------------------------------
    # Exact duplicate rows
    # -----------------------------------------------------

    log()
    log("EXACT DUPLICATE ROWS")
    log("-" * 70)

    row_keys = []

    for row in rows:

        key = tuple(
            row.get(column, "")
            for column in required_columns
        )

        row_keys.append(key)

    duplicate_count = len(row_keys) - len(set(row_keys))

    log(f"Duplicate rows: {duplicate_count}")

    if duplicate_count == 0:
        log("OK: No exact duplicate rows.")

    # -----------------------------------------------------
    # Duplicate behavioral feature vectors
    # -----------------------------------------------------

    log()
    log("DUPLICATE FEATURE VECTORS")
    log("-" * 70)

    feature_groups = defaultdict(list)

    for index, row in enumerate(rows):

        features = feature_tuple(row)

        if features is not None:
            feature_groups[features].append(index)

    duplicate_vectors = {
        key: indexes
        for key, indexes in feature_groups.items()
        if len(indexes) > 1
    }

    duplicated_vector_rows = sum(
        len(indexes)
        for indexes in duplicate_vectors.values()
    )

    log(
        f"Unique feature vectors: "
        f"{len(feature_groups)}"
    )

    log(
        f"Rows belonging to repeated "
        f"feature vectors: {duplicated_vector_rows}"
    )

    # -----------------------------------------------------
    # Cross-label identical feature vectors
    # -----------------------------------------------------

    log()
    log("GENUINE vs IMPOSTOR FEATURE OVERLAP")
    log("-" * 70)

    genuine_vectors = set()
    impostor_vectors = set()

    for row in rows:

        features = feature_tuple(row)

        if features is None:
            continue

        label = row.get("label", "").strip()

        if label == "genuine":
            genuine_vectors.add(features)

        elif label == "impostor":
            impostor_vectors.add(features)

    overlap = genuine_vectors & impostor_vectors

    log(
        f"Unique genuine feature vectors: "
        f"{len(genuine_vectors)}"
    )

    log(
        f"Unique impostor feature vectors: "
        f"{len(impostor_vectors)}"
    )

    log(
        f"Identical vectors appearing in BOTH labels: "
        f"{len(overlap)}"
    )

    if len(overlap) == 0:
        log("OK: No identical feature vectors across labels.")
    else:
        log(
            "WARNING: Some identical feature vectors "
            "appear as both genuine and impostor."
        )

    # -----------------------------------------------------
    # Session overlap
    # -----------------------------------------------------

    log()
    log("SESSION OVERLAP")
    log("-" * 70)

    sessions_by_label = defaultdict(lambda: defaultdict(set))

    for row in rows:

        user = row.get("user", "").strip()
        session = row.get("session_id", "").strip()
        label = row.get("label", "").strip()

        if user and session and label:
            sessions_by_label[user][label].add(session)

    session_overlap_total = 0

    for user in users:

        genuine_sessions = sessions_by_label[user]["genuine"]
        impostor_sessions = sessions_by_label[user]["impostor"]

        overlap_sessions = (
            genuine_sessions & impostor_sessions
        )

        session_overlap_total += len(overlap_sessions)

        log(
            f"{user}: "
            f"genuine_sessions={len(genuine_sessions)}, "
            f"impostor_sessions={len(impostor_sessions)}, "
            f"overlap={len(overlap_sessions)}"
        )

        if overlap_sessions:
            for session in sorted(overlap_sessions):
                log(f"  WARNING overlapping session: {session}")

    # -----------------------------------------------------
    # Device information
    # -----------------------------------------------------

    log()
    log("DEVICE INFORMATION")
    log("-" * 70)

    devices_by_user_label = defaultdict(set)

    for row in rows:

        user = row.get("user", "").strip()
        label = row.get("label", "").strip()
        device = row.get("device_id", "").strip()

        if user and label and device:
            devices_by_user_label[(user, label)].add(device)

    for user in users:

        genuine_devices = devices_by_user_label[
            (user, "genuine")
        ]

        impostor_devices = devices_by_user_label[
            (user, "impostor")
        ]

        log(
            f"{user}: "
            f"genuine_devices={len(genuine_devices)}, "
            f"impostor_devices={len(impostor_devices)}"
        )

    # -----------------------------------------------------
    # Feature statistics
    # -----------------------------------------------------

    log()
    log("FEATURE RANGES")
    log("-" * 70)

    for feature in FEATURES:

        values = [
            to_float(row.get(feature))
            for row in rows
        ]

        values = [
            value
            for value in values
            if value is not None
        ]

        if not values:
            log(f"{feature}: NO VALUES")
            continue

        log(
            f"{feature}: "
            f"min={min(values):.4f}, "
            f"max={max(values):.4f}"
        )

    # -----------------------------------------------------
    # Final assessment
    # -----------------------------------------------------

    log()
    log("=" * 70)
    log("FINAL VALIDATION")
    log("=" * 70)

    problems = []

    if missing_columns:
        problems.append("missing required columns")

    if total_missing > 0:
        problems.append("missing feature values")

    if invalid_count > 0:
        problems.append("invalid numeric values")

    if negative_total > 0:
        problems.append("negative feature values")

    if duplicate_count > 0:
        problems.append("exact duplicate rows")

    if len(overlap) > 0:
        problems.append("cross-label feature overlap")

    if session_overlap_total > 0:
        problems.append("genuine/impostor session overlap")

    if problems:

        log("WARNING: Dataset needs investigation.")

        for problem in problems:
            log(f"  - {problem}")

    else:

        log(
            "OK: No major structural problems detected."
        )

    log()
    log("ML TRAINING HAS NOT BEEN PERFORMED.")
    log("This script only validates the labeled dataset.")

    # -----------------------------------------------------
    # Save report
    # -----------------------------------------------------

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as f:

        f.write("\n".join(report))

    print()
    print("=" * 70)
    print("REPORT SAVED")
    print("=" * 70)
    print(OUTPUT_FILE)


if __name__ == "__main__":
    main()