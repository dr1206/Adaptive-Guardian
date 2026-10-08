# Data Cleaning & Deduplication Report

## Deduplication Policy

In accordance with project guidelines:
1. **Exact duplicate rows** (identical across all 14 dynamics features, window duration, and label) were identified.
2. Investigation verified that 100% of duplicate rows corresponded to complete idle periods where all keyboard and mouse metrics were exactly 0.0.
3. Exactly one canonical occurrence of idle windows was preserved per user, while redundant identical duplicate rows were safely removed.
4. **Zero genuine behavioral values were altered, smoothed, or artificially synthesized.**

## Cleaning Metrics

| User | Original Count | Duplicates Removed | Remaining Count | Retention Rate | Genuine Left | Impostor Left |
|---|---|---|---|---|---|---|
| **Amal** | 1115 | 52 | 1063 | 95.34% | 216 | 847 |
| **Vyas** | 670 | 49 | 621 | 92.69% | 123 | 498 |
| **Dristi** | 955 | 282 | 673 | 70.47% | 144 | 529 |
| **Manasa** | 1001 | 72 | 929 | 92.81% | 199 | 730 |
