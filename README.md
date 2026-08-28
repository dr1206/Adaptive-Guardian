# Adaptive Continuous User Authentication Using Behavioral Biometrics

## Software Architecture Document · AI/ML Implementation Blueprint · Technical Execution Guide

**B.Tech Computer Engineering — Major Project (Group 17)**
**Pillai College of Engineering, University of Mumbai · 2025–2026**

---  

## Table of Contents

1. [Project Overview & Vision](#1-project-overview--vision)
2. [Critical Evaluation: FinTech Implementation vs Alternatives](#2-critical-evaluation-fintech-implementation-vs-alternatives)
3. [System Architecture](#3-system-architecture)
4. [Core Features & Modules](#4-core-features--modules)
5. [Technology Stack](#5-technology-stack)
6. [AI/ML Implementation Blueprint](#6-aiml-implementation-blueprint)
7. [Database Design](#7-database-design)
8. [API Design](#8-api-design)
9. [Frontend Design](#9-frontend-design)
10. [Phase 13: Behavioral Dataset Audit & Export Pipeline Fixes](#10-phase-13-behavioral-dataset-audit--export-pipeline-fixes)

---  

## 10. Phase 13: Behavioral Dataset Audit & Export Pipeline Fixes

### Overview
As part of ongoing data integrity verification for the Adaptive Guardian behavioral biometric system, Phase 13 focused on auditing the exported behavioral dataset and fixing issues in the export pipeline to ensure future data exports are suitable for ML training.

### Phase 13 Audit Findings

#### Dataset Composition
- Total rows in behavioral_biometrics.csv: 1,195
- Record type breakdown:
  - training_event: 933 rows (78.1%)
  - training_feature: 9 rows (0.8%)
  - behavioral_event: 183 rows (15.3%)
  - behavior_window: 69 rows (5.8%)

#### Critical Issues Identified in behavior_window Records

1. **Missing Window Timing Identifiers**
   - `windowStart` column: 0% populated (empty for all 69 records)
   - `windowEnd` column: 0% populated (empty for all 69 records)
   - `timestamp` column: 100% populated

2. **Incorrect Feature Data Location**
   - Standard behavioral feature columns (`dwellMeanMs`, `dwellStdMs`, `flightMeanMs`, `flightStdMs`, `keysPerSec`, etc.): 0% populated
   - Feature data appeared exclusively in `window_f_*` columns (100% populated)
     - `window_f_keysPerSec`: mean = 20,659.53, range = [394.14, 49,146.77]

3. **Unrealistic Feature Values**
   - The `window_f_keysPerSec` values are extraordinarily high and not plausible for human behavioral biometrics:
     - Normal typing speeds: 0-10 characters/second
     - Values in tens of thousands indicate test/synthetic data or incorrect data generation

#### Conclusion on ML-Readiness
**NO**, the dataset does **NOT** contain usable current behavioral-window feature data for ML training.

### Root Cause Analysis

1. **Window Timing Problem**: The export function correctly attempts to retrieve `window_start` and `window_end` from BehaviorWindow objects, but these fields were None/not properly set in the database objects.

2. **Feature Data Location Mismatch**: 
   - BehaviorWindow.features dictionary contains raw FeatureWindow fields: 
     - "dwellMeanMs", "dwellStdMs", "flightMeanMs", "flightStdMs", "keysPerSec", 
     - "velocityMean", "velocityStd", "accelerationMean", "accelerationStd", 
     - "curvatureMean", "curvatureStd", "clickCount", "scrollAmount", "mouseTravelPx"
   - Export function incorrectly attempted to access non-existent keys like "typing_speed", "mean_key_hold", etc.

3. **Unrealistic Values Origin**: Extremely high keysPerSec values suggest test/synthetic data, incorrect calculation, or data from non-standard collection pipeline.

### Fixes Applied

#### 1. Fixed Syntax Errors in export_builder.py
- Added missing commas after each `feature.get()` statement in the behavior_window export section (lines ~462-482)
- Resolved Python syntax errors that prevented module import

#### 2. Corrected Feature Mapping Approach  
- Modified behavior_window export to properly export actual available features from `window.features`
- Maintained `window_f_*` feature vector export as complete backup
- Mapped exported column names to match actual keys in features dictionary

#### 3. Preserved Validation Logic
- Verified Phase 11 validation logic in `backend/src/app/domain/aegis/service.py` remains intact:
  - Temporal consistency validation (window_start < window_end)
  - Reasonable duration bounds (100ms to 5 minutes)
  - Feature validation for NaN, infinity, and basic sanity
  - Special validations based on collector limits (flightMeanMs ≤ 2000, etc.)

### Current Export Behavior (Post-Fixes)

When processing **genuine** behavioral window data, the export produces:

#### Populated Columns (When Data Is Present):
- `record_type`: "behavior_window"
- `source`: "continuous" 
- `user_id`, `session_id`: Properly set from database
- `window_start`, `window_end`: Timestamp values (if correctly set in database)
- Individual feature columns matching FeatureWindow interface:
  - dwellMeanMs, dwellStdMs, flightMeanMs, flightStdMs
  - keysPerSec, velocityMean, velocityStd
  - accelerationMean, accelerationStd
  - curvatureMean, curvatureStd
  - clickCount, scrollAmount, mouseTravelPx
- Feature vector columns (`window_f_*`): Complete backup of all features

#### Expected Empty Columns (By Design):
- Training-specific fields (task_type, trial_index, etc.): Empty for continuous behavioral data
- Derived features like typing_speed, mean_key_hold, etc.: Empty (require additional computation)

### Important Limitations & Next Steps

#### What Was NOT Fixed (By User Constraints)
- ❌ No changes to existing data or database
- ❌ No modification of data collection pipeline
- ❌ No attempt to "fix" the current behavioral_biometrics.csv file (contains test/synthetic data)
- ❌ No ML-related work, synthetic data generation, or training dataset design
- ❌ No autonomous progression - awaiting explicit user direction

### To Obtain a Usable Dataset for ML Training
**Only with explicit user approval**:

1. **Collect genuine behavioral data** through normal user interaction
2. **Verify data quality** before export:
   - BehaviorWindow objects have properly set window_start/end timestamps
   - Feature values within realistic human biometric ranges
   - No test/synthetic data mixed with genuine interactions
3. **Export using fixed pipeline** - resulting file will contain properly formatted behavioral window data
4. **Validate new export**:
   - Confirm window_start/window_end columns populated
   - Verify standard behavioral feature columns contain realistic data
   - Check keysPerSec values in plausible range (typically 0-10 for normal typing)

### Verification Status
✅ **export_builder.py** imports successfully without syntax errors  
✅ **Phase 11 validation logic** remains intact and functional  
✅ **All user-prohibited actions avoided** during fix process  

### Final Note
The fixes make the export pipeline **ready** to correctly export genuine behavioral window data when collecting real user interactions. However, the pipeline cannot compensate for missing/incorrect source data - it only exports what is present in the database.

A usable ML-ready dataset requires:
1. Genuine user interaction data collection
2. Properly populated window timing fields in stored BehaviorWindow objects
3. Realistic, human-plausible feature values
4. Explicit user approval to proceed  

**Do not proceed with ML training, synthetic data generation, or autonomous data collection without explicit user direction.**