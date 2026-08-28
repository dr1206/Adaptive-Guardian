import csv

def is_empty(value):
    return value is None or value.strip() == '' or value.strip().lower() == 'nan'

def main():
    csv_path = r'G:\New folder\adaptive-guardian\behavioral_biometrics.csv'
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Filter behavioral_window records
    behavioral_windows = [row for row in rows if row['record_type'] == 'behavior_window']
    print(f"Found {len(behavioral_windows)} behavioral_window records")

    if not behavioral_windows:
        return

    # Look at first few records to see what data they contain
    print("\nFirst 3 behavioral_window records:")
    for i in range(min(3, len(behavioral_windows))):
        row = behavioral_windows[i]
        print(f"\nRecord {i+1}:")
        # Check window identifiers
        print(f"  windowStart: {row.get('windowStart', 'EMPTY')}")
        print(f"  windowEnd: {row.get('windowEnd', 'EMPTY')}")
        print(f"  timestamp: {row.get('timestamp', 'EMPTY')}")

        # Check window_f_* columns (these seem to be populated)
        window_f_cols = [col for col in reader.fieldnames if col.startswith('window_f_')]
        print(f"  Number of window_f_* columns: {len(window_f_cols)}")

        # Show first 5 window_f_* columns with data
        shown = 0
        for col in window_f_cols:
            if shown >= 5:
                break
            val = row.get(col, '')
            if not is_empty(val):
                print(f"    {col}: {val}")
                shown += 1

        # Check behavioral_fv_* columns
        behavioral_fv_cols = [col for col in reader.fieldnames if col.startswith('behavioral_fv_')]
        bf_shown = 0
        for col in behavioral_fv_cols:
            if bf_shown >= 5:
                break
            val = row.get(col, '')
            if not is_empty(val):
                print(f"    {col}: {val}")
                bf_shown += 1

    # Check for actual windowStart/windowEnd values (maybe they're in different columns?)
    print("\n\nChecking for window timing information:")
    # Look for columns that might contain window start/end timestamps
    time_cols = [col for col in reader.fieldnames if 'time' in col.lower() or 'start' in col.lower() or 'end' in col.lower()]
    print(f"  Time-related columns: {time_cols[:10]}")  # Show first 10

    # Check if windowStart/windowEnd are actually populated (maybe our earlier check missed something)
    window_start_vals = []
    window_end_vals = []
    for row in behavioral_windows:
        ws = row.get('windowStart', '')
        we = row.get('windowEnd', '')
        if not is_empty(ws):
            window_start_vals.append(ws)
        if not is_empty(we):
            window_end_vals.append(we)

    print(f"  windowStart non-empty: {len(window_start_vals)}/{len(behavioral_windows)}")
    print(f"  windowEnd non-empty: {len(window_end_vals)}/{len(behavioral_windows)}")

    if window_start_vals:
        print(f"    Sample windowStart values: {window_start_vals[:3]}")
    if window_end_vals:
        print(f"    Sample windowEnd values: {window_end_vals[:3]}")

    # Check the actual feature values in window_f_* columns
    print("\n\nAnalyzing window_f_* feature columns:")
    # Get all window_f_* columns
    window_f_cols = [col for col in reader.fieldnames if col.startswith('window_f_')]

    # Check how many records have data in each column
    for col in window_f_cols[:10]:  # Check first 10
        non_empty_count = sum(1 for row in behavioral_windows if not is_empty(row.get(col, '')))
        if non_empty_count > 0:
            # Get numeric values for stats
            values = []
            for row in behavioral_windows:
                val = row.get(col, '')
                if not is_empty(val):
                    try:
                        values.append(float(val))
                    except ValueError:
                        pass

            if values:
                mean_val = sum(values) / len(values)
                min_val = min(values)
                max_val = max(values)
                print(f"  {col}: {non_empty_count}/{len(behavioral_windows)} ({100*non_empty_count/len(behavioral_windows):.1f}%) - mean: {mean_val:.2f}, range: [{min_val:.2f}, {max_val:.2f}]")
            else:
                print(f"  {col}: {non_empty_count}/{len(behavioral_windows)} ({100*non_empty_count/len(behavioral_windows):.1f}%) - non-numeric data")

    # Check if there are any behavioral_fv_* columns with data
    print("\n\nChecking behavioral_fv_* columns:")
    behavioral_fv_cols = [col for col in reader.fieldnames if col.startswith('behavioral_fv_')]
    bf_has_data = False
    for col in behavioral_fv_cols[:10]:  # Check first 10
        non_empty_count = sum(1 for row in behavioral_windows if not is_empty(row.get(col, '')))
        if non_empty_count > 0:
            bf_has_data = True
            values = []
            for row in behavioral_windows:
                val = row.get(col, '')
                if not is_empty(val):
                    try:
                        values.append(float(val))
                    except ValueError:
                        pass

            if values:
                mean_val = sum(values) / len(values)
                min_val = min(values)
                max_val = max(values)
                print(f"  {col}: {non_empty_count}/{len(behavioral_windows)} ({100*non_empty_count/len(behavioral_windows):.1f}%) - mean: {mean_val:.2f}, range: [{min_val:.2f}, {max_val:.2f}]")
            else:
                print(f"  {col}: {non_empty_count}/{len(behavioral_windows)} ({100*non_empty_count/len(behavioral_windows):.1f}%) - non-numeric data")

    if not bf_has_data:
        print("  No behavioral_fv_* columns have data in behavioral_window records")

if __name__ == '__main__':
    main()