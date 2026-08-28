# Recommendations for Fixing Dataset Issues

Based on the Phase 13 audit of `behavioral_biometrics.csv`, the dataset contains critical issues that make it unusable for ML training. Below are the specific problems identified and recommendations for fixing them.

## Issues Identified

### 1. Missing Window Timing Identifiers
- **Problem**: `windowStart` and `windowEnd` columns are completely empty (0% populated across all 69 behavioral_window records)
- **Impact**: Without these timestamps, it's impossible to:
  - Verify temporal consistency (window_start < window_end)
  - Calculate window duration for features like keysPerSec
  - Establish proper temporal boundaries for behavioral windows
  - Validate against backend validation logic

### 2. Incorrect Feature Data Location
- **Problem**: Feature data appears in `window_f_*` columns rather than the expected behavioral feature columns:
  - Standard columns (`dwellMeanMs`, `dwellStdMs`, `flightMeanMs`, `flightStdMs`, `keysPerSec`, etc.) are 0% populated
  - Data is instead in `window_f_*` columns (100% populated)
- **Impact**: This mismatches the expected data schema and would require significant preprocessing to use

### 3. Unrealistic Feature Values
- **Problem**: The `window_f_keysPerSec` values are extraordinarily high:
  - Mean: 20,659.53 events/second
  - Maximum: 49,146.77 events/second
- **Impact**: These values are not plausible for human behavioral biometrics (normal typing is typically 0-10 characters/second), suggesting test/synthetic data or incorrect data generation

## Root Cause Analysis

Based on examination of the export code (`backend/src/app/domain/admin/export_builder.py`) and data models (`backend/src/app/domain/aegis/models.py`), the issues likely stem from:

### A. Window Timing Problem
In `_write_combined_biometrics_csv()`:
- Behavioral events: Uses `getattr(event, 'window_start', None)` and `getattr(event, 'window_end', None)`
- Behavior windows: Uses `getattr(window, 'window_start', None)` and `getattr(window, 'window_end', None)`

If these return `None`, the `_fmt_dt()` function returns an empty string, resulting in empty CSV columns.

This suggests that either:
1. The `window_start` and `window_end` attributes on the database objects are `None`
2. The objects being exported don't have these attributes properly set

### B. Feature Data Location
The export correctly writes:
- Individual feature fields (lines 463-480): `typing_speed`, `mean_key_hold`, etc. from `window.features`
- Full feature vectors (lines 481-485): All keys from `window.features` as `window_f_*` columns

However, the current CSV shows data only in the `window_f_*` columns, suggesting that the individual feature fields (lines 463-480) are not being populated correctly, possibly because:
1. The specific keys being accessed (`typing_speed`, `mean_key_hold`, etc.) don't exist in `window.features`
2. These values are `None` or empty in the database

### C. Unrealistic Values
The extremely high `window_f_keysPerSec` values suggest:
1. Test/synthetic data with intentionally extreme values
2. Incorrect calculation or units conversion (e.g., microseconds instead of milliseconds)
3. Data from a non-standard collection pipeline

## Recommended Fixes

### Fix 1: Ensure Window Timing Values Are Populated
**Location**: Data ingestion/pipeline (behavioral collector → backend storage)
**Action**: Verify that:
1. `window_start` and `window_end` are properly set on `BehaviorWindow` objects before saving to database
2. For `BehavioralEvent` objects with `event_type="window_aggregate"`, these fields are also populated
3. The database query used by the export function retrieves these fields correctly

**Verification**: After fix, export should show non-empty values in `window_start` and `window_end` columns.

### Fix 2: Correct Feature Data Mapping
**Location**: `backend/src/app/domain/admin/export_builder.py` in `_write_combined_biometrics_csv()`
**Action**: Ensure that:
1. The specific feature keys being accessed in lines 463-480 (`typing_speed`, `mean_key_hold`, etc.) actually exist in `window.features`
2. If these keys don't exist, either:
   a. Calculate them from the raw feature data, or
   b. Modify the export to use the correct key names, or
   c. Ensure the data pipeline populates these specific keys

**Alternative approach**: Simplify by exporting only the full feature vectors (as currently done in `window_f_*` columns) and remove the individual feature field exports if they're not reliably available.

**Verification**: After fix, standard behavioral feature columns (`dwellMeanMs`, `dwellStdMs`, etc.) should be populated with meaningful data.

### Fix 3: Validate Data Generation Pipeline
**Location**: Behavioral data collection and processing pipeline
**Action**: Investigate why `keysPerSec` values are in the tens of thousands:
1. Check the formula used to calculate `keysPerSec` in the frontend collector
2. Verify units (should be events/second, not events/millisecond)
3. Ensure realistic bounds are applied during collection/validation
4. Confirm that test/synthetic data is not being mixed with genuine behavioral data

**Verification**: After fix, `keysPerSec` values should fall in a realistic range (typically 0-10 for normal typing, possibly higher for bursts but unlikely to exceed 100).

## Implementation Considerations

Given the user's previous constraints regarding read-only verification phases:

1. **Do not modify existing data** in the database - only fix the pipeline going forward
2. **Do not attempt to "fix" the current export file** - it should be discarded as unusable
3. **Focus on ensuring future exports are correct**
4. **Verify fixes with a small, controlled test before deploying to production**

## Suggested Validation Process

After implementing fixes:
1. Trigger a small behavioral data collection session (1-2 minutes of genuine interaction)
2. Export the data using the fixed export function
3. Verify that:
   - `window_start` and `window_end` columns are populated
   - Standard behavioral feature columns contain realistic data
   - `keysPerSec` values are in a plausible range
   - Data aligns with the expected behavioral data contract documented in Phase 11 results

## Conclusion

The current `behavioral_biometrics.csv` dataset cannot be used for ML training due to missing temporal identifiers, incorrect feature mapping, and unrealistic values. The fixes should focus on correcting the data pipeline and export function to ensure future exports contain properly formatted, realistic behavioral window data with accurate timing identifiers.

Once these fixes are implemented and validated, a new dataset should be collected for ML training purposes.