import csv
from pathlib import Path
from collections import Counter
import json

BASE_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = BASE_DIR / "ml" / "raw"

FILE = RAW_DIR / "behavioral_biometrics_manasa2.csv"

TARGET_SESSIONS = {
    "b731c53e-b93b-4537-8511-fe3d4deabddc",
    "c79b713d-9a4c-4681-ae1a-7005904719ee",
}


with open(FILE, "r", encoding="utf-8-sig", newline="") as f:
    reader = csv.reader(f)

    header = [h.strip() for h in next(reader)]
    index = {name: i for i, name in enumerate(header)}

    records = []

    for row in reader:

        if not any(cell.strip() for cell in row):
            continue

        if len(row) < len(header):
            row += [""] * (len(header) - len(row))

        session_id = (
            row[index["session_id"]].strip()
            if "session_id" in index
            else ""
        )

        if session_id not in TARGET_SESSIONS:
            continue

        record = {}

        for column, position in index.items():
            record[column] = row[position].strip()

        records.append(record)


print("=" * 70)
print("MANASA NEW SESSION INSPECTION")
print("=" * 70)

print(f"Total records inspected: {len(records)}")

print("\nRecord types:")
print(dict(Counter(r.get("record_type", "") for r in records)))

print("\nColumns containing data:")
for column in header:

    values = [
        r.get(column, "")
        for r in records
        if r.get(column, "")
    ]

    if values:
        print(f"\n{column}")
        print(f"  Non-empty: {len(values)}")
        print(f"  Example : {values[0][:300]}")


print("\n" + "=" * 70)
print("SAMPLE TRAINING EVENTS")
print("=" * 70)

training_events = [
    r for r in records
    if r.get("record_type") == "training_event"
]

for i, event in enumerate(training_events[:5], start=1):

    print(f"\n--- Event {i} ---")

    for key, value in event.items():

        if value:
            print(f"{key}: {value[:500]}")


print("\n" + "=" * 70)
print("TRAINING FEATURE RECORDS")
print("=" * 70)

training_features = [
    r for r in records
    if r.get("record_type") == "training_feature"
]

for i, feature in enumerate(training_features, start=1):

    print(f"\n--- Training Feature {i} ---")

    for key, value in feature.items():

        if value:
            print(f"{key}: {value[:500]}")


print("\n" + "=" * 70)
print("INSPECTION COMPLETE")
print("=" * 70)