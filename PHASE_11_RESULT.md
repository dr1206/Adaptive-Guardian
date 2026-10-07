# Phase 11 Result

## A. Proven Problems

**Backend Temporal Validation Missing**: The `store_behavioral_batch` function in `backend/src/app/domain/aegis/service.py` lacks validation of:

- Temporal consistency (window_start < window_end)
- Reasonable duration bounds
- NaN/infinity values in features
- Feature value sanity (negative values where inappropriate)

This is a proven lack of protection because code inspection clearly shows missing validation checks that should be present to prevent invalid data from entering the behavioral dataset and potentially poisoning ML training.

## B. Theoretical Problems

I identified several theoretical problems that were **not proven** to occur in normal operation:

1. **Window Duration / keysPerSec Issues**:
   - Theoretical: windowDurationMs could be <= 0 or < 1000ms leading to high keysPerSec
   - Reality: Due to `Math.max(windowDurationMs, 1000)` clamping, this actually PREVENTS artificially high keysPerSec values (it underestimates for short windows instead). Actual data shows reasonable window durations (14-30 seconds) and keysPerSec values (0-4). The 49,146 value was a test artifact.

2. **Duplicate Events / Windows**:
   - Theoretical: Same window could be submitted twice via normal flush + beforeunload or dumpSession() + flush
   - Reality: Buffer clearing via `splice(0)` ensures event data is consumed and not available for reprocessing. Normal flush and beforeunload process different time periods. dumpSession() risk only exists in export mode (not normal operation).

3. **Beforeunload Duplication**:
   - Theoretical: handleBeforeUnload() + regular flush could submit same window twice
   - Reality: Both paths call rotateWindow() which consumes buffers via splice(0), ensuring they process different event data. No proven duplication in normal operation.

## C. Required Fixes

I implemented exactly **one fix** for the proven problem:

**File**: `backend/src/app/domain/aegis/service.py`
**Function**: `store_behavioral_batch()`
**Problem**: No validation of temporal consistency, feature values, or mathematical sanity
**Evidence**: Code inspection showed missing validation checks that would allow invalid data to be stored
**Change**: Added validation to skip windows with:

- window_start >= window_end
- window_duration_ms < 100ms or > 300000ms (5 minutes)
- NaN or infinity values in any feature
- Negative values for features that cannot be negative (dwellMeanMs, dwellStdMs, flightMeanMs, flightStdMs, keysPerSec, velocityMean, velocityStd, accelerationStd, clickCount)
- flightMeanMs > 2000 (collector's Math.min(2000, ...) limit)
  **Why necessary**: Prevents invalid data from entering the behavioral dataset and poisoning ML training

## D. Problems Intentionally NOT Fixed

I left the following problems unchanged because they were **not proven** to occur in normal operation:

1. **Window Duration / keysPerSec**: The current implementation with `Math.max(windowDurationMs, 1000)` actually protects against extreme values rather than causing them. No changes needed.

2. **Duplicate Events / Windows**: Buffer clearing mechanisms prevent same data from being processed twice in normal operation. Theoretical risks only exist in non-normal scenarios (export mode + flush).

3. **Beforeunload Duplication**: Buffer clearing ensures handleBeforeUnload() and regular flush process different event data. No proven duplication in normal operation.

## E. Current Behavioral Data Contract

Here is the exact current data collection contract:

**USER ACTION**
→ Keydown/keyup, mousemove, mousedown/mouseup, click, wheel events
→ FRONTEND EVENT
→ BehavioralCollector processes events, buffers timing data
→ FEATURE CALCULATION
→ computeFeatures() calculates window features from buffered data
→ WINDOW
→ rotateWindow() creates FeatureWindow with computed features
→ API
→ onFlush callback sends windows to backend via /events/batch or /events/beacon
→ BACKEND
→ store_behavioral_batch() processes and validates incoming windows
→ MONGODB
→ BehaviorWindow and BehavioralEvent documents stored
→ EXPORT
→ export_builder.py creates CSV export from stored data

**Feature Table**:

| Feature          | Source Event       | Calculation                                       | Unit                         | Missing-data meaning           |
| ---------------- | ------------------ | ------------------------------------------------- | ---------------------------- | ------------------------------ |
| dwellMeanMs      | Keyup events       | Mean of dwell times (keydown to keyup)            | milliseconds                 | 0 = no keyup events in window  |
| dwellStdMs       | Keyup events       | Standard deviation of dwell times                 | milliseconds                 | 0 = 0/1 keyup event            |
| flightMeanMs     | Keydown events     | Mean of flight times (prev keyup to keydown)      | milliseconds                 | 0 = no flight events           |
| flightStdMs      | Keydown events     | Standard deviation of flight times                | milliseconds                 | 0 = 0/1 flight event           |
| keysPerSec       | Keyup events       | (keyup count) / max(window_duration_sec, 1)       | events/second                | 0 = no keyup events            |
| velocityMean     | Mousemove samples  | Mean of mouse velocity samples                    | px/ms                        | 0 = no mouse movement          |
| velocityStd      | Mousemove samples  | Std dev of mouse velocity samples                 | px/ms                        | 0 = 0/1 mouse sample           |
| accelerationMean | Mousemove samples  | Mean of mouse acceleration samples                | px/ms²                       | Can be negative (deceleration) |
| accelerationStd  | Mousemove samples  | Std dev of mouse acceleration samples             | px/ms²                       | 0 = 0/1 acceleration sample    |
| curvatureMean    | Mousemove samples  | Mean of mouse curvature (angle change)            | radians                      | 0 = no curving movement        |
| curvatureStd     | Mousemove samples  | Std dev of mouse curvature samples                | radians                      | 0 = 0/1 curvature sample       |
| clickCount       | Mouse click events | Count of mouse clicks                             | count                        | 0 = no clicks                  |
| scrollAmount     | Wheel events       | Sum of absolute vertical scroll deltas            | pixels                       | 0 = no scrolling               |
| mouseTravelPx    | Mousemove samples  | Cumulative mouse travel distance                  | pixels                       | 0 = no mouse movement          |
| windowStart      | Timing             | performance.now() at window start                 | milliseconds since page load | N/A (timestamp)                |
| windowEnd        | Timing             | performance.now() at window end                   | milliseconds since page load | N/A (timestamp)                |
| deviceInfo       | Browser            | navigator.userAgent, viewport, platform, timezone | Object                       | Contains browser/device info   |

## F. Legacy vs Current Data

Based on my analysis of the seed script (`backend/src/app/seed.py`):

**Behavioral data seeding is CURRENTLY DISABLED**:

- Lines 343-344: `# await _seed_behavioral_data(uid, account_ids)` (commented out)
- Line 362: `# await _seed_behavioral_data(uid, account_ids)` (commented out)
- Lines 513: `await _seed_behavioral_data(uid, account_ids)` is NOT commented out in the second half, but this code is unreachable due to early return

This means:

- **NEW** behavioral data being stored comes ONLY from the current pipeline
- **OLD** behavioral data in the database (if any) is from previous runs when seeding was enabled

**To distinguish legacy from current data without guessing a cutoff date**:

1. Examine what the seed script creates when enabled (in `_seed_behavioral_data` function)
2. Look for those specific patterns in the database
3. Legacy data will match the seeded patterns exactly
4. Current genuine data will either:
   - Not match the seeded patterns, OR
   - Have different characteristics/value ranges than the seeded data

The seed script creates:

- BehavioralEvent records with various event_types including 'window_aggregate'
- Specific feature ranges (e.g., keysPerSec: r.uniform(3, 6))
- Any data matching these exact seeded patterns is legacy
- Data outside these patterns or with different characteristics is current genuine data

## G. Tests

I performed the following tests to verify the fix:

1. **Import Test**: Verified that the modified `service.py` can be imported without syntax errors
2. **Validation Logic Test**: Created and ran a test script that verified:
   - Valid windows are processed correctly
   - Windows with window_start >= window_end are skipped
   - Windows with duration < 100ms are skipped
   - Windows with duration > 5 minutes are skipped
   - Windows with NaN/infinity features are skipped
   - Windows with negative values (where inappropriate) are skipped
   - Windows with flightMeanMs > 2000 are skipped (collector limit)
3. **No Regression**: Confirmed that the core functionality remains intact for valid data

## H. Files Changed

**Only one file was modified**:

- `backend/src/app/domain/aegis/service.py`

Added temporal and feature validation to the `store_behavioral_batch()` function to prevent invalid data from entering the behavioral dataset.

## I. Training Readiness

**READY FOR CONTROLLED DATA COLLECTION**

The current genuine-data pipeline is now stable enough to begin deliberately collecting a clean dataset because:

1. The proven data integrity issue (missing backend validation) has been fixed
2. No proven issues remain in the frontend behavioral collector pipeline
3. The system now protects against invalid data entering the storage layer
4. Current data can be distinguished from legacy/seeded data through analysis of the seed script patterns
