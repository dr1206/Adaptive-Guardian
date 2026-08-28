#!/usr/bin/env python3
"""
Fix the double comma in export_builder.py
"""

def fix_double_comma():
    file_path = "G:\\New folder\\adaptive-guardian\\backend\\src\\app\\domain\\admin\\export_builder.py"

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Fix line 473 (0-indexed line 472) which has double comma
    if len(lines) > 472:
        line = lines[472]
        if "_,,," in line or line.count(",,") > 0:
            lines[472] = line.replace(",,", ",")
            print("Fixed double comma on line 473")

    # Also fix the lines with double commas in the feature vector section
    for i in range(len(lines)):
        if '*,["" for _ in sorted(training_fv_keys)],,' in lines[i]:
            lines[i] = lines[i].replace(",,", ",")
            print(f"Fixed double comma on line {i+1} (training_fv_keys)")
        if '*,["" for _ in sorted(behavioral_fv_keys)],,' in lines[i]:
            lines[i] = lines[i].replace(",,", ",")
            print(f"Fixed double comma on line {i+1} (behavioral_fv_keys)")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("Fixed double commas in export_builder.py")

if __name__ == "__main__":
    fix_double_comma()