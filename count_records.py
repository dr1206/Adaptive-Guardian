import csv
from collections import Counter

with open('G:\\New folder\\adaptive-guardian\\behavioral_biometrics.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    record_types = [row['record_type'] for row in reader]
    counter = Counter(record_types)
    for record_type, count in counter.items():
        print(f"{record_type}: {count}")