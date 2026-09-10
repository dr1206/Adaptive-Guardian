import csv
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = BASE_DIR / "ml" / "raw"

USERS = {
    "manasa": (
        "behavioral_biometrics_manasa.csv",
        "behavioral_biometrics_manasa2.csv",
    ),
    "vyas": (
        "behavioral_biometrics_vyas.csv",
        "behavioral_biometrics_vyas2.csv",
    ),
}


def load_records(filepath):
    records = []

    with open(filepath, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        header = [h.strip() for h in next(reader)]
        index = {name: i for i, name in enumerate(header)}

        for row in reader:
            if not any(cell.strip() for cell in row):
                continue

            if len(row) < len(header):
                row += [""] * (len(header) - len(row))

            record_type = row[index["record_type"]].strip()

            records.append({
                "record_type": record_type,
                "user_id": row[index["user_id"]].strip(),
                "session_id": row[index["session_id"]].strip()
                    if "session_id" in index else "",
                "timestamp": row[index["timestamp"]].strip()
                    if "timestamp" in index else "",
                "device_id": row[index["device_id"]].strip()
                    if "device_id" in index else "",
            })

    return records


for user, (old_file, new_file) in USERS.items():

    print("\n" + "=" * 70)
    print(user.upper())
    print("=" * 70)

    old_records = load_records(RAW_DIR / old_file)
    new_records = load_records(RAW_DIR / new_file)

    old_sessions = {
        r["session_id"]
        for r in old_records
        if r["session_id"]
    }

    new_sessions = {
        r["session_id"]
        for r in new_records
        if r["session_id"]
    }

    new_only_sessions = new_sessions - old_sessions

    print(f"Old total records: {len(old_records)}")
    print(f"New total records: {len(new_records)}")

    print(f"Old sessions: {len(old_sessions)}")
    print(f"New sessions: {len(new_sessions)}")

    print(f"\nNEW sessions found: {len(new_only_sessions)}")

    if new_only_sessions:
        print("\nNew session details:")

        for session in sorted(new_only_sessions):

            session_records = [
                r for r in new_records
                if r["session_id"] == session
            ]

            counts = Counter(
                r["record_type"]
                for r in session_records
            )

            devices = {
                r["device_id"]
                for r in session_records
                if r["device_id"]
            }

            timestamps = [
                r["timestamp"]
                for r in session_records
                if r["timestamp"]
            ]

            print("\nSession:", session)
            print("Records:", len(session_records))
            print("Record types:", dict(counts))
            print("Devices:", sorted(devices))

            if timestamps:
                print("First timestamp:", min(timestamps))
                print("Last timestamp :", max(timestamps))

    else:
        print("NO new sessions found.")

    # Check behavior windows specifically
    old_windows = [
        r for r in old_records
        if r["record_type"] == "behavior_window"
    ]

    new_windows = [
        r for r in new_records
        if r["record_type"] == "behavior_window"
    ]

    old_window_sessions = {
        r["session_id"]
        for r in old_windows
        if r["session_id"]
    }

    new_window_sessions = {
        r["session_id"]
        for r in new_windows
        if r["session_id"]
    }

    new_window_only_sessions = (
        new_window_sessions - old_window_sessions
    )

    print("\nBehavior windows:")
    print("Old behavior windows:", len(old_windows))
    print("New behavior windows:", len(new_windows))
    print(
        "New behavior-window sessions:",
        len(new_window_only_sessions)
    )

print("\n" + "=" * 70)
print("CHECK COMPLETE")
print("=" * 70)