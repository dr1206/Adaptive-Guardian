import csv
import sys

def is_empty(value):
    return value is None or value.strip() == '' or value.strip().lower() == 'nan'

def main():
    csv_path = 'G:\\New folder\\adaptive-guardian\\behavioral_biometrics.csv'
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Filter current records
    current_rows = [row for row in rows if row['record_type'] in ('behavioral_window', 'behavioral_event')]
    print(f"Total current records: {len(current_rows)}")
    print(f"  behavioral_window: {sum(1 for r in current_rows if r['record_type'] == 'behavioral_window')}")
    print(f"  behavioral_event: {sum(1 for r in current_rows if r['record_type'] == 'behavioral_event')}")

    if not current_rows:
        print("No current records found.")
        return

    # Get feature columns (we'll consider columns that are likely features)
    # We know the header from the first row of the CSV (already in reader.fieldnames)
    # We'll exclude columns that are metadata or raw event data that should be empty in aggregated records.
    # Let's define a set of columns that are expected to be populated in behavioral_window/event.
    # From the header, we can see the feature columns are those like:
    # dwellMeanMs, dwellStdMs, flightMeanMs, flightStdMs, keysPerSec, velocityMean, velocityStd,
    # accelerationMean, accelerationStd, curvatureMean, curvatureStd, clickCount, scrollAmount, mouseTravelPx
    # and also the window_f_* and training_fv_* and behavioral_fv_* columns?
    # But note: the CSV includes many columns for different types of records.

    # Let's instead look at the columns and see which ones have non-empty values in current records.
    # We'll compute the percentage of non-empty values for each column in current records.

    fieldnames = reader.fieldnames
    print("\\nColumn analysis for current records (behavioral_window and behavioral_event):")
    print(f"{'Column':<30} {'Non-empty %':<12} {'Sample values (if any)':<20}")
    print("-" * 70)

    for col in fieldnames:
        non_empty_count = 0
        sample_values = []
        for row in current_rows:
            val = row[col]
            if not is_empty(val):
                non_empty_count += 1
                if len(sample_values) < 3:
                    sample_values.append(val)
        percentage = (non_empty_count / len(current_rows)) * 100 if current_rows else 0
        if percentage > 0:  # Only show columns that have some data
            samples_str = ', '.join(str(v) for v in sample_values[:3])
            print(f"{col:<30} {percentage:<12.1f} {samples_str:<20}")

    # Now, let's check specifically for the feature vector columns that we expect to be populated.
    expected_feature_cols = [
        'dwellMeanMs', 'dwellStdMs', 'flightMeanMs', 'flightStdMs', 'keysPerSec',
        'velocityMean', 'velocityStd', 'accelerationMean', 'accelerationStd',
        'curvatureMean', 'curvatureStd', 'clickCount', 'scrollAmount', 'mouseTravelPx',
        'window_f_dwellMeanMs', 'window_f_dwellStdMs', 'window_f_flightMeanMs', 'window_f_flightStdMs',
        'window_f_keysPerSec', 'window_f_velocityMean', 'window_f_velocityStd',
        'window_f_accelerationMean', 'window_f_accelerationStd',
        'window_f_curvatureMean', 'window_f_curvatureStd',
        'window_f_scrollAmount', 'window_f_mouseTravelPx',
        'behavioral_fv_dwellMeanMs', 'behavioral_fv_dwellStdMs', 'behavioral_fv_flightMeanMs',
        'behavioral_fv_flightStdMs', 'behavioral_fv_keysPerSec', 'behavioral_fv_velocityMean',
        'behavioral_fv_velocityStd', 'behavioral_fv_accelerationMean', 'behavioral_fv_accelerationStd',
        'behavioral_fv_curvatureMean', 'behavioral_fv_curvatureStd',
        'behavioral_fv_scrollAmount', 'behavioral_fv_mouseTravelPx',
        'training_fv_dwellMeanMs', 'training_fv_dwellStdMs', 'training_fv_flightMeanMs',
        'training_fv_flightStdMs', 'training_fv_keysPerSec', 'training_fv_velocityMean',
        'training_fv_velocityStd', 'training_fv_accelerationMean', 'training_fv_accelerationStd',
        'training_fv_curvatureMean', 'training_fv_curvatureStd',
        'training_fv_scrollAmount', 'training_fv_mouseTravelPx',
        'training_fv_backspace_rate', 'training_fv_click_interval_mean', 'training_fv_correction_rate',
        'training_fv_direction_changes', 'training_fv_mean_flight_time', 'training_fv_mean_key_hold',
        'training_fv_mouse_acceleration', 'training_fv_mouse_speed_mean', 'training_fv_mouse_speed_std',
        'training_fv_pause_mean', 'training_fv_pause_std', 'training_fv_scroll_speed',
        'training_fv_std_flight_time', 'training_fv_std_key_hold', 'training_fv_target_acquisition_mean',
        'training_fv_total_duration_ms', 'training_fv_trajectory_length', 'training_fv_typing_speed'
    ]

    print("\\n\\nExpected feature columns and their population in current records:")
    print(f"{'Column':<35} {'Non-empty %':<12} {'Mean':<10} {'Std':<10} {'Min':<10} {'Max':<10}")
    print("-" * 90)

    for col in expected_feature_cols:
        if col not in fieldnames:
            continue
        values = []
        for row in current_rows:
            val = row[col]
            if not is_empty(val):
                try:
                    values.append(float(val))
                except ValueError:
                    pass  # Skip non-numeric
        if values:
            non_empty_count = len(values)
            percentage = (non_empty_count / len(current_rows)) * 100
            mean_val = sum(values) / len(values)
            # calculate std
            variance = sum((x - mean_val) ** 2 for x in values) / len(values) if len(values) > 1 else 0
            std_val = variance ** 0.5
            min_val = min(values)
            max_val = max(values)
            print(f"{col:<35} {percentage:<12.1f} {mean_val:<10.2f} {std_val:<10.2f} {min_val:<10.2f} {max_val:<10.2f}")
        else:
            print(f"{col:<35} {'0.0':<12} {'N/A':<10} {'N/A':<10} {'N/A':<10} {'N/A':<10}")

    # Also check for window_start and window_end
    print("\\n\\nTimestamp columns:")
    for col in ['windowStart', 'windowEnd', 'timestamp']:
        if col in fieldnames:
            values = []
            for row in current_rows:
                val = row[col]
                if not is_empty(val):
                    values.append(val)
            print(f"{col}: {len(values)} non-empty out of {len(current_rows)}")
            if values:
                print(f"  Sample: {values[0]}")

if __name__ == '__main__':
    main()