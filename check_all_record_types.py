import csv

def is_empty(value):
    return value is None or value.strip() == '' or value.strip().lower() == 'nan'

def main():
    csv_path = 'G:\\New folder\\adaptive-guardian\\behavioral_biometrics.csv'
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Count by record_type
    from collections import Counter
    record_type_counts = Counter(row['record_type'] for row in rows)
    print("Record type counts:")
    for rt, count in record_type_counts.items():
        print(f"  {rt}: {count}")

    print("\n" + "="*50)

    # Check each record type for window_start/window_end and feature data
    for record_type in record_type_counts.keys():
        records = [row for row in rows if row['record_type'] == record_type]
        print(f"\n{record_type.upper()} records ({len(records)}):")

        if not records:
            continue

        # Check for window identifiers
        window_start_count = sum(1 for row in records if not is_empty(row.get('windowStart', '')))
        window_end_count = sum(1 for row in records if not is_empty(row.get('windowEnd', '')))
        print(f"  windowStart: {window_start_count}/{len(records)} non-empty")
        print(f"  windowEnd: {window_end_count}/{len(records)} non-empty")

        # Check for feature vector columns (the ones we know should be in behavioral windows)
        feature_cols = [
            'dwellMeanMs', 'dwellStdMs', 'flightMeanMs', 'flightStdMs', 'keysPerSec',
            'velocityMean', 'velocityStd', 'accelerationMean', 'accelerationStd',
            'curvatureMean', 'curvatureStd', 'clickCount', 'scrollAmount', 'mouseTravelPx'
        ]

        # Count how many records have ALL feature columns populated
        complete_count = 0
        some_data_count = 0
        for row in records:
            empty_count = sum(1 for col in feature_cols if is_empty(row.get(col, '')))
            if empty_count == 0:
                complete_count += 1
            if empty_count < len(feature_cols):  # At least some data
                some_data_count += 1

        print(f"  Complete feature vectors: {complete_count}/{len(records)} ({100*complete_count/len(records):.1f}%)")
        print(f"  Partial feature data: {some_data_count}/{len(records)} ({100*some_data_count/len(records):.1f}%)")

        # Show a sample record if any have complete data
        if complete_count > 0:
            print(f"  Sample complete record:")
            for row in records:
                empty_count = sum(1 for col in feature_cols if is_empty(row.get(col, '')))
                if empty_count == 0:
                    print(f"    windowStart: {row.get('windowStart', 'N/A')}")
                    print(f"    windowEnd: {row.get('windowEnd', 'N/A')}")
                    for col in feature_cols[:5]:  # Show first 5 features
                        print(f"    {col}: {row.get(col, 'N/A')}")
                    break

        # Also check for the window_f_* and behavioral_fv_* columns that might be in export
        window_f_cols = [col for col in reader.fieldnames if col.startswith('window_f_')]
        behavioral_fv_cols = [col for col in reader.fieldnames if col.startswith('behavioral_fv_')]
        training_fv_cols = [col for col in reader.fieldnames if col.startswith('training_fv_')]

        if window_f_cols:
            wf_complete = sum(1 for row in records if all(not is_empty(row.get(col, '')) for col in window_f_cols[:5]))  # Check first 5
            print(f"  window_f_* sample completeness: {wf_complete}/{len(records)} ({100*wf_complete/len(records):.1f}%)")

        if behavioral_fv_cols:
            bf_complete = sum(1 for row in records if all(not is_empty(row.get(col, '')) for col in behavioral_fv_cols[:5]))
            print(f"  behavioral_fv_* sample completeness: {bf_complete}/{len(records)} ({100*bf_complete/len(records):.1f}%)")

if __name__ == '__main__':
    main()