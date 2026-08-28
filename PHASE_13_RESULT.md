# PHASE 13 — NEW DATASET AUDIT

## A. Dataset size and composition

Let me first get the basic dataset information:

Total rows: 1195

Record type breakdown:
- training_event: 933 rows (78.1%)
- training_feature: 9 rows (0.8%)
- behavioral_event: 183 rows (15.3%)
- behavior_window: 69 rows (5.8%)

## B. Analysis of current behavioral window records

The behavioral_window records (69 total) are the ones that should contain aggregated feature data suitable for ML training. My analysis reveals:

### Window timing information
- windowStart column: EMPTY for all 69 records (0% populated)
- windowEnd column: EMPTY for all 69 records (0% populated)
- timestamp column: POPULATED for all 69 records (100% populated)

### Feature data location
The feature data is NOT in the standard behavioral feature columns:
- dwellMeanMs, dwellStdMs, flightMeanMs, flightStdMs, keysPerSec, etc.: ALL EMPTY (0% populated)

Instead, feature data appears in window_f_* columns:
- window_f_accelerationMean: 100% populated, mean: 0.39, range [0.01, 0.99]
- window_f_accelerationStd: 100% populated, mean: 4.80, range [0.00, 10.00]
- window_f_clickCount: 100% populated, mean: 0.30, range [0.10, 0.54]
- window_f_curvatureMean: 100% populated, mean: 0.22, range [0.05, 1.15]
- window_f_curvatureStd: 100% populated, mean: 99.30, range [0.00, 173.13]
- window_f_dwellMeanMs: 100% populated, mean: 21.76, range [0.00, 45.09]
- window_f_dwellStdMs: 100% populated, mean: 80.17, range [0.00, 710.96]
- window_f_flightMeanMs: 100% populated, mean: 23.12, range [0.00, 611.91]
- window_f_flightStdMs: 100% populated, mean: 3.59, range [0.00, 5.99]
- window_f_keysPerSec: 100% populated, **mean: 20659.53, range: [394.14, 49146.77]**

## C. Evaluation of data usability for ML

### Critical issues identified:

1. **Missing window timing identifiers**: The windowStart and windowEnd columns are completely empty. Without these, we cannot:
   - Verify temporal consistency (window_start < window_end)
   - Calculate window duration for features like keysPerSec
   - Establish proper temporal boundaries for behavioral windows
   - Validate against the backend validation logic implemented in Phase 11

2. **Suspicious feature values**: The window_f_keysPerSec values are extraordinarily high:
   - Mean: 20,659.53 events/second
   - Maximum: 49,146.77 events/second
   - These values are **not realistic** for human behavioral biometrics
   - Normal typing speeds typically range from 0-10 characters per second
   - Even extremely fast typing or mouse movements would not produce values in the thousands per second

3. **Data location mismatch**: The feature data appears in window_f_* columns rather than the expected behavioral feature columns (dwellMeanMs, etc.), suggesting this may be:
   - Test data or synthetic data
   - Data from a different collection pipeline
   - Incorrectly formatted export data

4. **Lack of temporal context**: Without windowStart/windowEnd, we cannot:
   - Separate legitimate data from potential test/synthetic artifacts
   - Apply meaningful time-based filtering
   - Verify that data comes from a legitimate collection period

## D. Comparison with expected behavioral data contract

Based on the Phase 11 results and system documentation, genuine behavioral window data should have:
- Populated windowStart and windowEnd timestamps
- Reasonable values for behavioral features:
  - dwellMeanMs: Typically 50-200ms for typing
  - flightMeanMs: Typically 50-150ms for typing
  - keysPerSec: Typically 0-10 for normal typing
- Feature data in standard columns, not window_f_* prefixed columns

The current dataset fails to meet these requirements.

## E. Conclusion on ML-readiness

**NO**, the dataset does **NOT** contain usable current behavioral-window feature data for ML training.

### Justification:
1. **Missing temporal identifiers**: Empty windowStart and windowEnd columns violate the basic contract of behavioral windows, making it impossible to verify data integrity or calculate proper temporal features.
2. **Unrealistic feature values**: The extraordinarily high keysPerSec values (in the tens of thousands) are not plausible for human behavioral biometrics and strongly suggest test/synthetic data rather than genuine user interactions.
3. **Incorrect data formatting**: Feature data appears in window_f_* columns rather than the expected behavioral feature columns, indicating a mismatch with the expected data schema.

### Recommendation:
Do not use this dataset for ML training. The data appears to be either:
- Test/synthetic data with intentionally extreme values
- Incorrectly formatted export data
- Data from a non-standard collection pipeline

Before proceeding with any ML-related work, a new, clean dataset must be collected with proper window timing identifiers and realistic feature values. The current behavioral data pipeline (with Phase 11 validation fixes) appears to be functioning correctly for live collection, but this particular export does not contain usable behavioral window data for ML purposes.

---
*Phase 13 Complete - Read-only audit of exported dataset*