#!/usr/bin/env python3
"""
Script to fix the export_builder.py to correctly populate behavioral window data
for ML training purposes.
"""

def fix_export_builder():
    file_path = "G:\\New folder\\adaptive-guardian\\backend\\src\\app\\domain\\admin\\export_builder.py"

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

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

    # Find where the behavior_window section ends (after the rows.append)
    # Look for the line that comes after the window loop ends
    behavior_window_end = -1
    for i in range(window_loop_start, len(lines)):
        # Look for the line that comes after the window loop ends
        if i > window_loop_start and lines[i-1].strip() == "rows.append(row)" and \
           (lines[i].strip().startswith("filename = ") or
            lines[i].strip().startswith("#") or
            lines[i].strip() == "" or
            i >= len(lines) - 1):
            behavior_window_end = i
            break

    if behavior_window_end == -1:
        # Default to end of file if we can't find a clear boundary
        behavior_window_end = len(lines)

    print(f"Found behavior_window section from line {start_idx} to {behavior_window_end}")

    # Keep everything before the behavior_window section
    new_lines = lines[:start_idx]

    # Add the behavior_window section header and initial checks
    new_lines.append(lines[start_idx])  # "# 4. Behavior Windows (aggregated continuous features)"
    new_lines.append(lines[start_idx + 1])  # "    if not windows:"
    new_lines.append(lines[start_idx + 2])  # "        return"
    new_lines.append(lines[start_idx + 3])  # "    "
    new_lines.append(lines[start_idx + 4])  # "    # Filter out empty windows"
    new_lines.append(lines[start_idx + 5])  # "    filtered_behavior_windows = [w for w in windows if not _is_behavior_window_empty(w.features)]"
    new_lines.append(lines[start_idx + 6])  # "    if not filtered_behavior_windows:"
    new_lines.append(lines[start_idx + 7])  # "        return"
    new_lines.append(lines[start_idx + 8])  # "    "

    # Now add our fixed window loop - simplified version that works with what we have
    new_lines.append("    # Collect all possible feature keys from all windows")
    new_lines.append("    feature_keys = set()")
    new_lines.append("    for window in filtered_behavior_windows:")
    new_lines.append("        if window.features:")
    new_lines.append("            feature_keys.update(window.features.keys())")
    new_lines.append("")
    new_lines.append("    header = [")
    new_lines.append('        "record_type",')
    new_lines.append('        "source",')
    new_lines.append('        "user_id",')
    new_lines.append('        "session_id",')
    new_lines.append('        "window_start",')
    new_lines.append('        "window_end",')
    new_lines.append('        "created_at",')
    new_lines.append('    ]')
    new_lines.append("")
    new_lines.append("    # Add feature columns to header")
    new_lines.append("    for key in sorted(feature_keys):")
    new_lines.append('        header.append(f"feature_{key}")')
    new_lines.append("")
    new_lines.append("    rows = []")
    new_lines.append("    for window in filtered_behavior_windows:")
    new_lines.append("        row = [")
    new_lines.append('            str(window.id),')
    new_lines.append('            str(window.user_id),')
    new_lines.append('            str(window.session_id),')
    new_lines.append('            _fmt_dt(window.window_start),')
    new_lines.append('            _fmt_dt(window.window_end),')
    new_lines.append('            _fmt_dt(window.created_at),')
    new_lines.append("        ]")
    new_lines.append("")
    new_lines.append("        # Add feature values")
    new_lines.append("        for key in sorted(feature_keys):")
    new_lines.append('            value = window.features.get(key)')
    new_lines.append('            row.append(value if value is not None else "")')
    new_lines.append("")
    new_lines.append("        rows.append(row)")
    new_lines.append("")

    # Add the filename and write call
    new_lines.append('    filename = f"{folder_path}behavior_windows.csv" if folder_path else "behavior_windows.csv"')
    new_lines.append("    _write_csv(zf, filename, header, rows)")

    # Keep everything after the behavior_window section
    new_lines.extend(lines[behavior_window_end:])

    # Join everything back together
    fixed_content = ''.join(new_lines)

    # Write the fixed file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)

    print("Successfully fixed export_builder.py")

if __name__ == "__main__":
    fix_export_builder()