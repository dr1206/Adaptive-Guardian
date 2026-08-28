import csv

def is_empty(value):
    return value is None or value.strip() == '' or value.strip().lower() == 'nan'

def main():
    csv_path = 'G:\\New folder\\adaptive-guardian\\behavioral_biometrics.csv'
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Filter behavioral_event records
    behavioral_events = [row for row in rows if row['record_type'] == 'behavioral_event']
    print(f"Found {len(behavioral_events)} behavioral_event records")

    if not behavioral_events:
        return

    # Look at first few records to see what data they contain
    print("\\nFirst 3 behavioral_event records:")
    for i in range(min(3, len(behavioral_events))):
        row = behavioral_events[i]
        print(f"\\nRecord {i+1}:")
        print(f"  timestamp: {row['timestamp']}")
        print(f"  event_type: {row['event_type']}")
        print(f"  key_code: {row['key_code']}")
        print(f"  dwell_time_ms: {row['dwell_time_ms']}")
        print(f"  flight_time_ms: {row['flight_time_ms']}")
        # Check some feature vector columns
        print(f"  behavioral_fv_dwellMeanMs: {row['behavioral_fv_dwellMeanMs']}")
        print(f"  behavioral_fv_dwellStdMs: {row['behavioral_fv_dwellStdMs']}")
        print(f"  behavioral_fv_flightMeanMs: {row['behavioral_fv_flightMeanMs']}")
        print(f"  behavioral_fv_flightStdMs: {row['behavioral_fv_flightStdMs']}")
        print(f"  behavioral_fv_keysPerSec: {row['behavioral_fv_keysPerSec']}")

    # Check if any records have window_start/window_end (should be in timestamp for events?)
    print("\\n\\nChecking for window identifiers in behavioral_event records:")
    window_start_count = sum(1 for row in behavioral_events if not is_empty(row.get('windowStart', '')))
    window_end_count = sum(1 for row in behavioral_events if not is_empty(row.get('windowEnd', '')))
    print(f"  windowStart non-empty: {window_start_count}/{len(behavioral_events)}")
    print(f"  windowEnd non-empty: {window_end_count}/{len(behavioral_events)}")

    # Check for feature vector completeness
    feature_cols = [
        'behavioral_fv_dwellMeanMs', 'behavioral_fv_dwellStdMs',
        'behavioral_fv_flightMeanMs', 'behavioral_fv_flightStdMs',
        'behavioral_fv_keysPerSec', 'behavioral_fv_velocityMean',
        'behavioral_fv_velocityStd', 'behavioral_fv_accelerationMean',
        'behavioral_fv_accelerationStd', 'behavioral_fv_curvatureMean',
        'behavioral_fv_curvatureStd', 'behavioral_fv_clickCount',
        'behavioral_fv_scrollAmount', 'behavioral_fv_mouseTravelPx'
    ]

    print("\\n\\nFeature vector completeness in behavioral_event records:")
    complete_count = 0
    for row in behavioral_events:
        empty_count = sum(1 for col in feature_cols if is_empty(row.get(col, '')))
        if empty_count == 0:
            complete_count += 1

    print(f"  Records with ALL feature columns populated: {complete_count}/{len(behavioral_events)} ({100*complete_count/len(behavioral_events):.1f}%)")

    # Check for records with at least some feature data
    some_data_count = sum(1 for row in behavioral_events if any(not is_empty(row.get(col, '')) for col in feature_cols))
    print(f"  Records with ANY feature data: {some_data_count}/{len(behavioral_events)} ({100*some_data_count/len(behavioral_events):.1f}%)")

    # Show actual values for a few records that have data
    print("\\n\\nSample feature values from records that have data:")
    samples_shown = 0
    for row in behavioral_events:
        if samples_shown >= 3:
            break
        has_data = any(not is_empty(row.get(col, '')) for col in feature_cols)
        if has_data:
            print(f"\\nRecord with feature data:")
            for col in feature_cols[:5]:  # Show first 5 features
                val = row.get(col, '')
                if not is_empty(val):
                    print(f"  {col}: {val}")
            samples_shown += 1

if __name__ == '__main__':
    main()