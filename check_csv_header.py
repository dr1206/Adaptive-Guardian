import csv

with open('G:\\New folder\\adaptive-guardian\\behavioral_biometrics.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)

    print("Header columns:")
    for i, col in enumerate(header):
        print(f"  {i}: {col}")

    # Find the indices of key columns
    try:
        timestamp_idx = header.index('timestamp')
        window_start_idx = header.index('window_start')
        window_end_idx = header.index('window_end')
        print(f"\\ntimestamp column index: {timestamp_idx}")
        print(f"window_start column index: {window_start_idx}")
        print(f"window_end column index: {window_end_idx}")
    except ValueError as e:
        print(f"Error finding column: {e}")