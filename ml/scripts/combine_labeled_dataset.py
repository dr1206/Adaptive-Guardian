import csv
from pathlib import Path

# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = BASE_DIR / "ml" / "raw"
PROCESSED_DIR = BASE_DIR / "ml" / "processed"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = PROCESSED_DIR / "behavioral_windows_labeled.csv"


# ---------------------------------------------------------
# Features used by our ML pipeline
# keysPerSec is intentionally excluded because the
# exported values were found to be unreliable.
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# Input files
# ---------------------------------------------------------

DATASETS = [
    ("behavioral_biometrics_amal.csv", "Amal", "genuine"),
    ("behavioral_biometrics_amal2.csv", "Amal", "impostor"),

    ("behavioral_biometrics_manasa.csv", "Manasa", "genuine"),
    ("behavioral_biometrics_manasa2.csv", "Manasa", "impostor"),

    ("behavioral_biometrics_dristi.csv", "Dristi", "genuine"),
    ("behavioral_biometrics_dristi2.csv", "Dristi", "impostor"),

    ("behavioral_biometrics_vyas.csv", "Vyas", "genuine"),
    ("behavioral_biometrics_vyas2.csv", "Vyas", "impostor"),
]


# ---------------------------------------------------------
# Helper functions
# ---------------------------------------------------------

def clean(value):
    if value is None:
        return ""
    return value.strip()


def to_float(value):
    value = clean(value)

    if value == "":
        return None

    try:
        return float(value)
    except ValueError:
        return None


def get_value(row, header, column):
    if column not in header:
        return ""

    index = header.index(column)

    if index >= len(row):
        return ""

    return clean(row[index])


# ---------------------------------------------------------
# Read one CSV
# ---------------------------------------------------------

def read_dataset(filename, user_name, label):
    path = RAW_DIR / filename

    if not path.exists():
        print(f"ERROR: File not found: {filename}")
        return []

    print()
    print("=" * 70)
    print(f"Reading: {filename}")
    print(f"User: {user_name}")
    print(f"Label: {label}")
    print("=" * 70)

    rows = []

    with open(path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)

        try:
            header = next(reader)
        except StopIteration:
            print("WARNING: Empty file")
            return []

        header = [clean(x) for x in header]

        if "record_type" not in header:
            print("ERROR: record_type column not found")
            return []

        record_type_index = header.index("record_type")

        behavior_count = 0

        for raw_row in reader:

            # Normalize row length.
            # Some exported CSV rows contain extra trailing fields.
            if len(raw_row) < len(header):
                raw_row = raw_row + [""] * (len(header) - len(raw_row))

            record_type = ""

            if record_type_index < len(raw_row):
                record_type = clean(raw_row[record_type_index])

            # We only want aggregated behavioral windows.
            if record_type != "behavior_window":
                continue

            feature_values = {}

            missing_feature = False

            for feature in FEATURES:

                # Standard feature column first.
                value = get_value(
                    raw_row,
                    header,
                    feature
                )

                # Exported behavior windows store actual
                # values in window_f_* columns.
                if value == "":
                    value = get_value(
                        raw_row,
                        header,
                        f"window_f_{feature}"
                    )

                number = to_float(value)

                if number is None:
                    missing_feature = True
                    break

                feature_values[feature] = number

            if missing_feature:
                continue

            window_start = get_value(
                raw_row,
                header,
                "window_start"
            )

            window_end = get_value(
                raw_row,
                header,
                "window_end"
            )

            user_id = get_value(
                raw_row,
                header,
                "user_id"
            )

            session_id = get_value(
                raw_row,
                header,
                "session_id"
            )

            device_id = get_value(
                raw_row,
                header,
                "device_id"
            )

            output_row = {
                "user": user_name,
                "label": label,
                "user_id": user_id,
                "session_id": session_id,
                "device_id": device_id,
                "window_start": window_start,
                "window_end": window_end,
            }

            output_row.update(feature_values)

            rows.append(output_row)
            behavior_count += 1

    print(f"Valid behavior windows: {behavior_count}")

    return rows


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------

def main():

    print()
    print("=" * 70)
    print("COMBINING GENUINE + IMPOSTOR BEHAVIOR WINDOWS")
    print("=" * 70)

    all_rows = []

    for filename, user_name, label in DATASETS:

        rows = read_dataset(
            filename,
            user_name,
            label
        )

        all_rows.extend(rows)

    print()
    print("=" * 70)
    print("COMBINED DATASET")
    print("=" * 70)

    print(f"Total rows: {len(all_rows)}")

    # -----------------------------------------------------
    # Remove exact duplicate windows
    # -----------------------------------------------------

    unique_rows = []
    seen = set()

    for row in all_rows:

        key = (
            row["user"],
            row["label"],
            row["user_id"],
            row["session_id"],
            row["window_start"],
            row["window_end"],
        )

        if key in seen:
            continue

        seen.add(key)
        unique_rows.append(row)

    removed = len(all_rows) - len(unique_rows)

    print(f"Duplicate windows removed: {removed}")
    print(f"Unique windows: {len(unique_rows)}")

    # -----------------------------------------------------
    # Count labels
    # -----------------------------------------------------

    genuine_count = sum(
        1 for row in unique_rows
        if row["label"] == "genuine"
    )

    impostor_count = sum(
        1 for row in unique_rows
        if row["label"] == "impostor"
    )

    print()
    print(f"Genuine windows:  {genuine_count}")
    print(f"Impostor windows: {impostor_count}")

    # -----------------------------------------------------
    # Count users
    # -----------------------------------------------------

    users = sorted(
        set(row["user"] for row in unique_rows)
    )

    print(f"Users: {len(users)}")

    for user in users:

        genuine = sum(
            1
            for row in unique_rows
            if row["user"] == user
            and row["label"] == "genuine"
        )

        impostor = sum(
            1
            for row in unique_rows
            if row["user"] == user
            and row["label"] == "impostor"
        )

        print(
            f"  {user}: "
            f"genuine={genuine}, "
            f"impostor={impostor}"
        )

    # -----------------------------------------------------
    # Write output
    # -----------------------------------------------------

    fieldnames = [
        "user",
        "label",
        "user_id",
        "session_id",
        "device_id",
        "window_start",
        "window_end",
    ] + FEATURES

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8",
        newline=""
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=fieldnames
        )

        writer.writeheader()
        writer.writerows(unique_rows)

    print()
    print("=" * 70)
    print("DONE")
    print("=" * 70)

    print(f"Output:")
    print(OUTPUT_FILE)

    print()
    print("ML training has NOT been performed.")
    print("This step only creates the labeled dataset.")


if __name__ == "__main__":
    main()