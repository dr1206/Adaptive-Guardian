# Latest Data Audit Report — Adaptive Guardian

Generated from the four latest user datasets:
- `amal_genuine_imposter_1to4_FULL_ML_READY.csv`
- `vyas_genuine_imposter_1to4_FULL_ML_READY.csv`
- `dristi_genuine_imposter_1to4_FULL_ML_READY.csv`
- `manasa_genuine_imposter_1to4_FULL_ML_READY.csv`

## Dataset Summary

| User | Original Rows | Genuine | Impostor | Exact Duplicates | Clean Rows | Ratio |
|---|---|---|---|---|---|---|
| **Amal** | 1115 | 223 | 892 | 52 | 1063 | 1 : 4.0 |
| **Vyas** | 670 | 134 | 536 | 49 | 621 | 1 : 4.0 |
| **Dristi** | 955 | 191 | 764 | 282 | 673 | 1 : 4.0 |
| **Manasa** | 1001 | 201 | 800 | 72 | 929 | 1 : 4.0 |


## Metadata & Leakage Verification

- **userLabel**: 100% NaN across all datasets. **Zero leakage.**
- **platform**: Invariant per user (Win32 for Amal, Dristi, Manasa; MacIntel for Vyas). Excluded from predictive modeling to prevent spurious environment learning.
- **viewport**: Proportions identical across genuine and impostor classes. Excluded from biometric dynamics.
- **Target Label**: Strictly binary `GENUINE` vs `IMPOSTOR` with balanced class definitions.

## Canonical Feature Statistics (Per User)

### Amal

| Feature | Min | Max | Mean | Median | Std | IQR | Outliers | Zero % |
|---|---|---|---|---|---|---|---|---|
| `accelerationMean` | -9.60 | 33.95 | -0.41 | 0.00 | 1.61 | 0.67 | 103 | 51.3% |
| `accelerationStd` | 0.00 | 67.96 | 8.40 | 0.00 | 10.55 | 16.67 | 12 | 51.3% |
| `clickCount` | 0.00 | 38.00 | 2.91 | 0.00 | 5.63 | 3.50 | 109 | 56.4% |
| `curvatureMean` | 0.00 | 1.57 | 0.14 | 0.00 | 0.16 | 0.27 | 4 | 51.4% |
| `curvatureStd` | 0.00 | 0.92 | 0.21 | 0.00 | 0.24 | 0.45 | 0 | 51.5% |
| `dwellMeanMs` | 0.00 | 395.67 | 35.83 | 0.09 | 62.16 | 86.28 | 7 | 33.9% |
| `dwellStdMs` | 0.00 | 412.49 | 15.16 | 0.02 | 42.23 | 21.31 | 67 | 34.3% |
| `flightMeanMs` | 0.00 | 2000.00 | 136.56 | 0.16 | 272.27 | 305.93 | 23 | 34.0% |
| `flightStdMs` | 0.00 | 873.30 | 113.94 | 0.13 | 199.02 | 276.69 | 13 | 34.4% |
| `keysPerSec` | 0.00 | 3153.68 | 838.73 | 1.93 | 1090.55 | 2021.33 | 0 | 33.9% |
| `mouseTravelPx` | 0.00 | 58511.74 | 1578.05 | 0.00 | 3258.46 | 2322.91 | 73 | 51.2% |
| `scrollAmount` | 0.00 | 11000.00 | 467.73 | 0.00 | 1341.94 | 164.94 | 212 | 73.3% |
| `velocityMean` | 0.00 | 5328.38 | 390.48 | 0.00 | 531.21 | 741.84 | 19 | 51.3% |
| `velocityStd` | 0.00 | 3278.38 | 499.86 | 0.00 | 613.77 | 1026.96 | 4 | 51.3% |

### Vyas

| Feature | Min | Max | Mean | Median | Std | IQR | Outliers | Zero % |
|---|---|---|---|---|---|---|---|---|
| `accelerationMean` | -9.60 | 33.95 | -0.60 | -0.31 | 1.78 | 0.91 | 53 | 38.3% |
| `accelerationStd` | 0.00 | 67.96 | 10.59 | 8.84 | 10.93 | 18.60 | 5 | 38.3% |
| `clickCount` | 0.00 | 38.00 | 3.68 | 1.00 | 6.35 | 4.00 | 59 | 44.3% |
| `curvatureMean` | 0.00 | 1.57 | 0.18 | 0.22 | 0.17 | 0.30 | 3 | 38.5% |
| `curvatureStd` | 0.00 | 0.79 | 0.27 | 0.35 | 0.23 | 0.47 | 0 | 38.6% |
| `dwellMeanMs` | 0.00 | 395.67 | 71.03 | 88.42 | 61.13 | 110.91 | 2 | 37.2% |
| `dwellStdMs` | 0.00 | 412.49 | 26.19 | 18.11 | 46.74 | 29.67 | 42 | 37.5% |
| `flightMeanMs` | 0.00 | 2000.00 | 242.43 | 240.81 | 261.98 | 378.45 | 11 | 37.2% |
| `flightStdMs` | 0.00 | 873.30 | 211.98 | 211.54 | 195.88 | 368.42 | 0 | 37.5% |
| `keysPerSec` | 0.00 | 3.87 | 0.74 | 0.00 | 1.02 | 1.63 | 0 | 58.8% |
| `mouseTravelPx` | 0.00 | 58511.74 | 1770.96 | 1027.13 | 3564.22 | 2582.56 | 28 | 38.2% |
| `scrollAmount` | 0.00 | 9426.00 | 447.53 | 0.00 | 1204.93 | 315.00 | 104 | 69.6% |
| `velocityMean` | 0.00 | 5328.38 | 491.07 | 425.30 | 572.07 | 823.10 | 9 | 38.3% |
| `velocityStd` | 0.00 | 3278.38 | 635.24 | 513.07 | 640.75 | 1151.83 | 2 | 38.3% |

### Dristi

| Feature | Min | Max | Mean | Median | Std | IQR | Outliers | Zero % |
|---|---|---|---|---|---|---|---|---|
| `accelerationMean` | -9.60 | 33.95 | -0.79 | -0.56 | 2.07 | 1.27 | 39 | 18.4% |
| `accelerationStd` | 0.00 | 67.96 | 14.14 | 14.66 | 10.37 | 12.92 | 15 | 18.4% |
| `clickCount` | 0.00 | 38.00 | 4.88 | 3.00 | 6.56 | 6.00 | 53 | 27.0% |
| `curvatureMean` | 0.00 | 1.57 | 0.24 | 0.26 | 0.15 | 0.13 | 9 | 18.6% |
| `curvatureStd` | 0.00 | 0.92 | 0.36 | 0.42 | 0.21 | 0.23 | 2 | 18.7% |
| `dwellMeanMs` | 0.00 | 395.67 | 56.53 | 0.00 | 70.25 | 116.90 | 1 | 56.5% |
| `dwellStdMs` | 0.00 | 412.49 | 23.94 | 0.00 | 51.06 | 30.26 | 47 | 57.2% |
| `flightMeanMs` | 0.00 | 2000.00 | 215.58 | 0.00 | 316.33 | 391.84 | 17 | 56.6% |
| `flightStdMs` | 0.00 | 873.30 | 179.87 | 0.00 | 225.19 | 375.20 | 0 | 57.5% |
| `keysPerSec` | 0.00 | 3.87 | 0.72 | 0.00 | 1.00 | 1.57 | 0 | 56.5% |
| `mouseTravelPx` | 0.00 | 58511.74 | 2591.30 | 1729.85 | 3792.10 | 2908.88 | 35 | 18.3% |
| `scrollAmount` | 0.00 | 11000.00 | 803.88 | 0.00 | 1632.36 | 882.00 | 75 | 53.3% |
| `velocityMean` | 0.00 | 5328.38 | 655.30 | 667.28 | 547.70 | 561.38 | 22 | 18.4% |
| `velocityStd` | 0.00 | 3278.38 | 833.85 | 878.61 | 587.37 | 831.51 | 5 | 18.4% |

### Manasa

| Feature | Min | Max | Mean | Median | Std | IQR | Outliers | Zero % |
|---|---|---|---|---|---|---|---|---|
| `accelerationMean` | -9.60 | 33.95 | -0.47 | -0.10 | 1.72 | 0.77 | 79 | 44.2% |
| `accelerationStd` | 0.00 | 67.96 | 9.62 | 7.82 | 10.75 | 17.68 | 10 | 44.2% |
| `clickCount` | 0.00 | 38.00 | 3.33 | 0.00 | 5.90 | 4.00 | 87 | 50.2% |
| `curvatureMean` | 0.00 | 1.57 | 0.16 | 0.20 | 0.16 | 0.28 | 3 | 44.3% |
| `curvatureStd` | 0.00 | 0.92 | 0.25 | 0.30 | 0.24 | 0.46 | 0 | 44.5% |
| `dwellMeanMs` | 0.00 | 395.67 | 68.27 | 78.15 | 61.05 | 107.33 | 5 | 36.6% |
| `dwellStdMs` | 0.00 | 412.49 | 23.05 | 15.06 | 43.51 | 26.83 | 56 | 37.1% |
| `flightMeanMs` | 0.00 | 2000.00 | 276.25 | 295.54 | 290.02 | 406.75 | 18 | 36.7% |
| `flightStdMs` | 0.00 | 1383.42 | 209.37 | 189.51 | 206.72 | 358.18 | 2 | 37.2% |
| `keysPerSec` | 0.00 | 5.76 | 1.50 | 1.47 | 1.47 | 2.63 | 0 | 36.6% |
| `mouseTravelPx` | 0.00 | 58511.74 | 1805.66 | 533.32 | 3426.08 | 2634.39 | 56 | 44.1% |
| `scrollAmount` | 0.00 | 11000.00 | 535.20 | 0.00 | 1422.83 | 321.00 | 157 | 69.4% |
| `velocityMean` | 0.00 | 5328.38 | 446.81 | 365.36 | 545.64 | 785.53 | 15 | 44.2% |
| `velocityStd` | 0.00 | 3278.38 | 571.96 | 428.26 | 624.35 | 1087.63 | 3 | 44.2% |

