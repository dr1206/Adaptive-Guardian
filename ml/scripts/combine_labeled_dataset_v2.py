import csv
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = BASE_DIR / "ml" / "raw"
OUTPUT_DIR = BASE_DIR / "ml" / "processed"

USERS = {
    "amal": (
        "behavioral_biometrics_amal.csv",
        "behavioral_biometrics_amal2.csv",
    ),
    "manasa": (
        "behavioral_biometrics_manasa.csv",
        "behavioral_biometrics_manasa2.csv",
    ),
    "dristi": (
        "behavioral_biometrics_dristi.csv",
        "behavioral_biometrics_dristi2.csv",
    ),
    "vyas": (
        "behavioral_biometrics_vyas.csv",
        "behavioral_biometrics_vyas2.csv",
    ),
}

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


def load_behavior_windows(filepath):
    """Load valid behavior_window records from a CSV."""

    rows = []

    with open(filepath, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)

        header = next(reader)
        header = [h.strip() for h in header]

        # Map header names to positions.
        index = {name: i for i, name in enumerate(header)}

        required = [
            "record_type",
            "user_id",
            "session_id",
            "window_start",
            "window_end",
        ]

        for column in required:
            if column not in index:
                raise ValueError(
                    f"{filepath.name} is missing required column: {column}"
                )

        for row in reader:
            # Ignore completely empty rows.
            if not any(cell.strip() for cell in row):
                continue

            # Make row length safe.
            if len(row) < len(header):
                row = row + [""] * (len(header) - len(row))

            record_type = row[index["record_type"]].strip()

            if record_type != "behavior_window":
                continue

            user_id = row[index["user_id"]].strip()
            session_id = row[index["session_id"]].strip()
            window_start = row[index["window_start"]].strip()
            window_end = row[index["window_end"]].strip()

            # Extract window_f_* values.
            feature_values = {}

            valid = True

            for feature in FEATURES:
                column = f"window_f_{feature}"

                if column not in index:
                    valid = False
                    break

                value = row[index[column]].strip()

                if value == "":
                    valid = False
                    break

                try:
                    feature_values[feature] = float(value)
                except ValueError:
                    valid = False
                    break

            if not valid:
                continue

            record = {
                "user_id": user_id,
                "session_id": session_id,
                "window_start": window_start,
                "window_end": window_end,
            }

            record.update(feature_values)

            rows.append(record)

    return rows


def make_exact_key(row):
    """
    Exact identity of a behavior window.

    Includes timestamps AND feature values so that:
    - old exported windows are removed
    - genuinely new windows are retained
    """

    return (
        row["user_id"],
        row["session_id"],
        row["window_start"],
        row["window_end"],
        tuple(row[feature] for feature in FEATURES),
    )


all_rows = []

print("=" * 70)
print("CREATING CORRECTED GENUINE + IMPOSTOR DATASET")
print("=" * 70)

for user, (old_filename, new_filename) in USERS.items():

    old_path = RAW_DIR / old_filename
    new_path = RAW_DIR / new_filename

    print(f"\n[{user.upper()}]")

    if not old_path.exists():
        print(f"ERROR: Missing {old_filename}")
        continue

    if not new_path.exists():
        print(f"ERROR: Missing {new_filename}")
        continue

    old_rows = load_behavior_windows(old_path)
    new_rows = load_behavior_windows(new_path)

    print(f"Old export windows : {len(old_rows)}")
    print(f"New export windows : {len(new_rows)}")

    # Everything in the original export is genuine.
    genuine_keys = set()

    for row in old_rows:
        key = make_exact_key(row)

        if key in genuine_keys:
            continue

        genuine_keys.add(key)

        output_row = dict(row)
        output_row["label"] = "genuine"

        all_rows.append(output_row)

    # Only windows NOT present in the old export are candidates
    # for the new impostor collection.
    new_impostor_count = 0

    seen_impostor_keys = set()

    for row in new_rows:

        key = make_exact_key(row)

        # Already existed in the old export.
        if key in genuine_keys:
            continue

        # Duplicate inside the new export.
        if key in seen_impostor_keys:
            continue

        seen_impostor_keys.add(key)

        output_row = dict(row)
        output_row["label"] = "impostor"

        all_rows.append(output_row)

        new_impostor_count += 1

    print(f"Genuine windows kept: {len(genuine_keys)}")
    print(f"NEW impostor windows : {new_impostor_count}")

    if new_impostor_count == 0:
        print("WARNING: No new windows were found in this export.")


# Remove any exact duplicate records across the combined dataset.
unique_rows = []
seen = set()

for row in all_rows:

    key = (
        row["user_id"],
        row["session_id"],
        row["window_start"],
        row["window_end"],
        row["label"],
        tuple(row[feature] for feature in FEATURES),
    )

    if key in seen:
        continue

    seen.add(key)
    unique_rows.append(row)


OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

output_file = OUTPUT_DIR / "behavioral_windows_labeled_clean.csv"

columns = [
    "user_id",
    "session_id",
    "window_start",
    "window_end",
    "label",
] + FEATURES


with open(output_file, "w", encoding="utf-8", newline="") as f:

    writer = csv.DictWriter(f, fieldnames=columns)

    writer.writeheader()

    for row in unique_rows:
        writer.writerow(row)


print("\n" + "=" * 70)
print("FINAL DATASET")
print("=" * 70)

print(f"Total rows: {len(unique_rows)}")

label_counts = Counter(row["label"] for row in unique_rows)

print(f"Genuine  : {label_counts['genuine']}")
print(f"Impostor : {label_counts['impostor']}")

print("\nPer-user counts:")

for user in USERS:

    user_rows = [
        row
        for row in unique_rows
        if user.lower() in row["session_id"].lower()
    ]

    # User names are not guaranteed to appear in session IDs,
    # so calculate by the order of source exports instead below.

print("\nOutput:")
print(output_file)

print("\nIMPORTANT:")
print("- Old exports are labeled genuine.")
print("- Only windows absent from the old export are labeled impostor.")
print("- No synthetic impostor samples were created.")
print("- ML training has NOT been performed.")

print("=" * 70)