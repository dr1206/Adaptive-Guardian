import csv
import pandas as pd
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent.parent / "raw"
PROCESSED_DIR = Path(__file__).resolve().parent.parent / "processed"

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


def read_csv_safely(file_path):
    with open(file_path, "r", encoding="utf-8", newline="") as file:
        reader = csv.reader(file)

        header = next(reader)
        rows = []

        for row in reader:
            if len(row) > len(header):
                row = row[:len(header)]
            elif len(row) < len(header):
                row = row + [""] * (len(header) - len(row))

            rows.append(row)

    return pd.DataFrame(rows, columns=header)


def main():
    print("=" * 70)
    print("FINAL BEHAVIORAL DATASET PREPARATION")
    print("=" * 70)

    csv_files = sorted(
        RAW_DIR.glob("behavioral_biometrics_*.csv")
    )

    if not csv_files:
        print("\nERROR: No CSV files found.")
        return

    all_data = []

    for csv_file in csv_files:

        print(f"\nReading: {csv_file.name}")

        df = read_csv_safely(csv_file)

        windows = df[
            df["record_type"].astype(str).str.strip()
            == "behavior_window"
        ].copy()

        print(f"  Behavior windows: {len(windows)}")

        if len(windows) == 0:
            continue

        for feature in FEATURES:

            source_column = f"window_f_{feature}"

            windows[feature] = pd.to_numeric(
                windows[source_column],
                errors="coerce"
            )

        columns = [
            "user_id",
            "session_id",
            "window_start",
            "window_end",
        ] + FEATURES

        windows = windows[columns].copy()

        all_data.append(windows)

    if not all_data:
        print("\nERROR: No behavior windows found.")
        return

    dataset = pd.concat(
        all_data,
        ignore_index=True
    )

    print("\n" + "=" * 70)
    print("REMOVING DUPLICATES")
    print("=" * 70)

    before = len(dataset)

    dataset = dataset.drop_duplicates(
        subset=[
            "user_id",
            "session_id",
            "window_start",
            "window_end",
        ] + FEATURES
    )

    duplicates_removed = before - len(dataset)

    print(f"Original rows:     {before}")
    print(f"Duplicates removed: {duplicates_removed}")
    print(f"Unique windows:    {len(dataset)}")

    print("\n" + "=" * 70)
    print("FINAL FEATURE SET")
    print("=" * 70)

    print(f"Number of features: {len(FEATURES)}")

    for feature in FEATURES:
        print(f"  - {feature}")

    print("\nExcluded feature:")
    print("  - keysPerSec (unreliable exported values)")

    print("\n" + "=" * 70)
    print("WINDOWS PER USER")
    print("=" * 70)

    print(dataset["user_id"].value_counts())

    print("\n" + "=" * 70)
    print("MISSING VALUES")
    print("=" * 70)

    for feature in FEATURES:

        missing = dataset[feature].isna().sum()

        print(
            f"{feature}: "
            f"{missing} missing"
        )

    PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    output_file = (
        PROCESSED_DIR /
        "behavioral_windows_clean.csv"
    )

    dataset.to_csv(
        output_file,
        index=False
    )

    print("\n" + "=" * 70)
    print("FINAL PREPROCESSING COMPLETE")
    print("=" * 70)

    print(f"\nSaved to:")
    print(output_file)

    print("\nML TRAINING HAS NOT BEEN PERFORMED.")


if __name__ == "__main__":
    main()