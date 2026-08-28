#!/usr/bin/env python3
"""
Script to fix the export_builder.py to correctly populate behavioral window data
for ML training purposes.
"""

def fix_export_builder():
    file_path = "G:\\New folder\\adaptive-guardian\\backend\\src\\app\\domain\\admin\\export_builder.py"

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where the behavior_window section starts
    lines = content.split('\n')

    # Find where the behavior_window section starts
    start_idx = -1
    for i, line in enumerate(lines):
        if "# 4. Behavior Windows (aggregated continuous features)" in line:
            start_idx = i
            break

    if start_idx == -1:
        print("Could not find behavior_window section")
        return

    # Find where the window loop starts
    window_loop_start = -1
    for i in range(start_idx, len(lines)):
        if "for window in filtered_behavior_windows:" in lines[i]:
            window_loop_start = i
            break

    if window_loop_start == -1:
        print("Could not find window loop")
        return

    # Find where the row list starts
    row_start = -1
    for i in range(window_loop_start, len(lines)):
        if lines[i].strip().startswith("row = ["):
            row_start = i
            break

    if row_start == -1:
        print("Could not find row start")
        return

    # Find where the row list ends
    row_end = -1
    for i in range(row_start, len(lines)):
        if lines[i].strip() == "]":
            row_end = i
            break

    if row_end == -1:
        print("Could not find row end")
        return

    print(f"Found behavior_window row construction from line {row_start} to {row_end}")

    # Build the new row construction
    new_row_lines = [
        "        row = [",
        '            "behavior_window",',
        '            "continuous",',
        '            str(getattr(window, "_export_user_id", user_id) or ""),',
        '            str(getattr(window, "session_id", "") or ""),',
        '            _fmt_dt(getattr(window, "created_at", None)),',
        '            "window_aggregate",',
        '            # Keystroke (empty for window)',
        '            "", "", "", "",',
        '            # Mouse (empty)',
        '            "", "", "", "", "",',
        '            # Window',
        '            _fmt_dt(getattr(window, "window_start", None)),',
        '            _fmt_dt(getattr(window, "window_end", None)),',
        '            # Training-specific (empty)',
        '            "", "", "", "", "", "", "", "", "", "", "", "",'
    ]

    # Add the feature fields section - we'll get these from window.features
    feature_mapping = [
        ('typing_speed', 'typing_speed'),
        ('mean_key_hold', 'mean_key_hold'),
        ('std_key_hold', 'std_key_hold'),
        ('mean_flight_time', 'mean_flight_time'),
        ('std_flight_time', 'std_flight_time'),
        ('backspace_rate', 'backspace_rate'),
        ('correction_rate', 'correction_rate'),
        ('pause_mean', 'pause_mean'),
        ('pause_std', 'pause_std'),
        ('mouse_speed_mean', 'mouse_speed_mean'),
        ('mouse_speed_std', 'mouse_speed_std'),
        ('mouse_acceleration', 'mouse_acceleration'),
        ('click_interval_mean', 'click_interval_mean'),
        ('scroll_speed', 'scroll_speed'),
        ('trajectory_length', 'trajectory_length'),
        ('direction_changes', 'direction_changes'),
        ('target_acquisition_mean', 'target_acquisition_mean'),
    ]

    for feature_key, var_name in feature_mapping:
        new_row_lines.append(f'            window.features.get("{var_name}", "") if window.features.get("{var_name}") is not None else ""')

    new_row_lines.extend([
        '            _fmt_dt(getattr(window, "created_at", None)),',
        '            # Feature vectors - training empty, behavioral empty, window filled',
        '            *["" for _ in sorted(training_fv_keys)],',
        '            *["" for _ in sorted(behavioral_fv_keys)],',
        '            *[window.features.get(key, "") for key in sorted(window_feature_keys)],',
        '        ]',
        '        rows.append(row)'
    ])

    # Replace the old row construction with the new one
    new_lines = lines[:row_start] + new_row_lines + lines[row_end+1:]

    # Join everything back together
    fixed_content = '\n'.join(new_lines)

    # Write the fixed file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)

    print("Successfully fixed export_builder.py")

if __name__ == "__main__":
    fix_export_builder()