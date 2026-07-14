# ML Training Data Collection Plan

## Overview

This document specifies the exact actions, intervals, and repetition counts needed for each of the 4 users (Amal, Manasa, Dristi, Vyas) to generate sufficient behavioral biometric data for training the LightGBM classifier and One-Class SVM anomaly detector.

## Data Collection Mechanism

- **Collector**: `BehavioralCollector` captures keystroke + mouse dynamics in 5-second windows
- **Storage**: localStorage key `ag_behavioral_dataset` (when `VITE_BEHAVIORAL_EXPORT=true`)
- **Export**: JSON download via `BehavioralExportPanel` component
- **14 Features per window**: dwellMeanMs, dwellStdMs, flightMeanMs, flightStdMs, keysPerSec, velocityMean, velocityStd, accelerationMean, accelerationStd, curvatureMean, curvatureStd, clickCount, scrollAmount, mouseTravelPx

## Target Data Volume

| Metric | Target |
|--------|--------|
| Windows per user (genuine) | 800-1200 |
| Windows per user (impostor) | 200-400 |
| Total windows across 4 users | 4000-6000 |
| Windows per session | ~40-80 (3-7 min of active use) |
| Sessions per user | 12-15 sessions |

## Phase 1: Genuine User Profile (Days 1-7)

Each user collects their OWN behavioral data. These sessions are labeled `genuine`.

### Session Types & Schedule

#### Session A: Login & Dashboard Browsing (~5 min, ~50 windows)
**Frequency**: 2x per day (morning + evening), every day
**Steps**:
1. Navigate to login page, type email (natural pace)
2. Type password, click login
3. Wait for dashboard to load, scroll through all widgets
4. Move mouse across dashboard cards (balance hero, Aegis widget, security overview, transaction feed)
5. Hover over chart tooltips in trends/analytics
6. Click through each tab/section slowly

**Behavioral data captured**: Keystroke dynamics (email + password typing), mouse velocity/curvature during navigation, scroll patterns, click patterns

#### Session B: Transaction Feed & Account Exploration (~7 min, ~70 windows)
**Frequency**: 1x per day
**Steps**:
1. Login (natural typing)
2. Navigate to Accounts page — click each account card
3. View transaction history — scroll through 20-30 transactions
4. Click on 3-5 individual transactions to view details
5. Switch between account filters (All / Checking / Savings)
6. Type in transaction search bar (3-4 different queries: "Amazon", "Uber", "salary")
7. Sort transactions by date, amount — click sort toggles

**Behavioral data captured**: Keystroke for search queries, mouse movement for navigation, click cadence, scroll velocity

#### Session C: Transfer Flow (~5 min, ~50 windows)
**Frequency**: 2x per day
**Steps**:
1. Login
2. Navigate to Transfer page
3. Type an amount in the transfer field (vary amounts: $25, $100, $250, $500, $1000)
4. Select a beneficiary from dropdown — scroll through list
5. Type a reference note (vary: "rent payment", "dinner", "utilities", "gift")
6. Press-and-hold the transfer button (triggering the PressHoldButton component)
7. Wait for confirmation screen

**Behavioral data captured**: Keystroke for amount/reference typing, mouse for dropdown selection, press-and-hold button pressure timing

#### Session D: Beneficiary & Card Management (~4 min, ~40 windows)
**Frequency**: 1x per day
**Steps**:
1. Login
2. Navigate to Beneficiaries page — scroll through list
3. Add a new beneficiary: type name (3 variations per user), IBAN (fictional but realistic), select bank
4. Navigate to Cards page — view all cards
5. Freeze and unfreeze a card
6. View card limits and spending details

**Behavioral data captured**: Form-filling keystroke patterns, mouse precision during small-target clicks, scroll behavior

#### Session E: Budgets & Savings (~5 min, ~50 windows)
**Frequency**: 1x per day
**Steps**:
1. Login
2. Navigate to Budgets page — scroll through all categories
3. Click each budget category to view breakdown
4. Create a new budget envelope (category + amount)
5. Navigate to Savings Goals page
6. Update savings goal progress (add $50-$200)
7. Scroll through goal details

**Behavioral data captured**: Keystroke for budget amounts/goal updates, mouse movement patterns, scroll depth

#### Session F: Statement & History Review (~6 min, ~60 windows)
**Frequency**: 1x every other day
**Steps**:
1. Login
2. Navigate to Statements page
3. Select different months from the dropdown
4. Scroll through monthly statements
5. Export/download a statement
6. Navigate to Activity page
7. Scroll through activity feed — click to expand details
8. Filter activity by type

**Behavioral data captured**: Menu navigation mouse patterns, scroll behavior on long lists, click targeting precision

#### Session G: Rapid Navigation (~3 min, ~30 windows)
**Frequency**: 1x per day
**Steps**:
1. Login
2. Rapidly switch between all main pages (Dashboard → Accounts → Transfers → Cards → Budgets → Savings → Activity → Statements)
3. Click through each page but don't interact deeply
4. Logout

**Behavioral data captured**: Fast mouse movement patterns, quick click cadence, minimal keystroke (just login)

### Weekly Schedule Per User

| Day | Morning (9-10am) | Midday (12-1pm) | Evening (6-7pm) | Night (10-11pm) |
|-----|------------------|-----------------|-----------------|-----------------|
| Mon | Session A + B | Session C | Session D + A | Session G |
| Tue | Session A + C | Session E | Session B + A | Session F |
| Wed | Session A + D | Session C | Session E + A | Session G |
| Thu | Session A + B | Session C | Session F + A | — |
| Fri | Session A + E | Session C | Session B + D | Session G |
| Sat | Session A + G | Session C + D | Session E + B | — |
| Sun | Session A + G | Session C | Session F | Session G |

**Per-day windows**: ~220-300 windows  
**Per-week windows**: ~1200-1500 windows

---

## Phase 2: Cross-User Impostor Sessions (Days 8-10)

Each user acts as an "impostor" on another user's account to generate negative training samples.

### Impostor Rotation

| Impostor | Target Account | Sessions |
|----------|---------------|----------|
| Amal → | Manasa's account | 3 sessions |
| Manasa → | Dristi's account | 3 sessions |
| Dristi → | Vyas's account | 3 sessions |
| Vyas → | Amal's account | 3 sessions |
| Amal → | Dristi's account | 2 sessions |
| Manasa → | Vyas's account | 2 sessions |
| Dristi → | Amal's account | 2 sessions |
| Vyas → | Manasa's account | 2 sessions |

### Impostor Session Protocol (~5 min each, ~50 windows)

1. **Login** using the target user's credentials (typing someone else's email/password)
2. **Navigate** through the target's dashboard — their accounts, transactions, beneficiaries
3. **Attempt a transfer** — type an amount, select a beneficiary (different motor patterns)
4. **Browse** budget categories and savings goals
5. **Scroll** through transaction history
6. **Export** data with label `impostor`

**Important**: The impostor MUST use the target's logged-in session so the behavioral windows are associated with the target user's account. The label (`genuine` vs `impostor`) is applied at export time.

### Per-user impostor windows target: 200-300 windows

---

## Phase 3: Device & Environment Variation (Days 11-12)

Vary conditions to make the model robust:

| Variation | Sessions per user |
|-----------|-------------------|
| Different browser (Chrome vs Firefox vs Edge) | 2 sessions each |
| Different time of day (early morning 6am, late night 1am) | 2 sessions each |
| Different typing speed (deliberately slow, then fast) | 2 sessions each |
| Mouse vs Trackpad (if available) | 2 sessions each |
| Window resized (smaller viewport vs fullscreen) | 2 sessions each |

---

## Phase 4: Export & Labeling Protocol

### At the end of each session:
1. Open browser DevTools → Application → Local Storage
2. Find key `ag_behavioral_dataset`
3. Copy the JSON data to a file named: `{username}_{session_type}_{date}_{label}.json`

OR use the `BehavioralExportPanel` component:
1. Navigate to `/export` or use the Export button
2. Select session(s) to export
3. Set label to `genuine` or `impostor`
4. Download as JSON

### File naming convention:
```
amal_genuine_session-a_2026-07-14_1.json
manasa_impostor_amal-target_2026-07-20_1.json
dristi_genuine_session-c_2026-07-15_2.json
```

### Dataset Manifest:
Create a CSV index file:
```csv
filename,user,label,session_type,date,windows_count,duration_sec,device,browser
amal_genuine_session-a_2026-07-14_1.json,amal,genuine,login_dashboard,2026-07-14,52,310,desktop,chrome
```

## Training Data Format

Each exported JSON file should have this structure:
```json
{
  "exportedAt": "2026-07-14T10:30:00Z",
  "label": "genuine",
  "user": "amal",
  "sessions": [
    {
      "sessionId": "...",
      "capturedAt": "...",
      "deviceInfo": { "userAgent": "...", "viewport": "...", "platform": "...", "timezone": "..." },
      "windows": [
        {
          "dwellMeanMs": 98.5,
          "dwellStdMs": 23.1,
          "flightMeanMs": 145.3,
          "flightStdMs": 67.8,
          "keysPerSec": 3.4,
          "velocityMean": 0.0045,
          "velocityStd": 0.0021,
          "accelerationMean": 0.0001,
          "accelerationStd": 0.00005,
          "curvatureMean": 1.32,
          "curvatureStd": 0.87,
          "clickCount": 4,
          "scrollAmount": 520,
          "mouseTravelPx": 1034,
          "windowStart": 1720953000000,
          "windowEnd": 1720953005000
        }
      ]
    }
  ]
}
```

## ML Training Pipeline (After Collection)

1. **Load all JSON files** into pandas DataFrame
2. **Filter**: Remove windows with <3 keystrokes AND <50px mouse travel (idle windows)
3. **Normalize**: Z-score normalize features per user
4. **Feature selection**: Run mRMR to select top features
5. **Train OC-SVM**: On genuine-only data, RBF kernel, nu=0.05
6. **Train LightGBM**: Binary classifier on labeled genuine+impostor data
7. **Evaluate**: AUC-ROC target > 0.90, accuracy target > 85%
8. **Export models**: Save as `.joblib` files to MinIO/S3

## Timeline Summary

| Phase | Days | Activity | Windows per user |
|-------|------|----------|------------------|
| Phase 1: Genuine | 1-7 | 7 session types, daily rotation | 1200-1500 |
| Phase 2: Impostor | 8-10 | Cross-user sessions | 200-300 |
| Phase 3: Variation | 11-12 | Device/environment variation | 200-300 |
| Phase 4: Export | 13 | Label, organize, validate | — |
| **Total** | **13 days** | — | **1600-2100 per user** |

## Prerequisites

- [ ] Set `VITE_BEHAVIORAL_EXPORT=true` in `.env`
- [ ] Set `VITE_USE_REAL_API=true` in `.env`
- [ ] Backend running at `localhost:8000`
- [ ] Frontend running at `localhost:8080`
- [ ] Each user has their credentials (emails listed below)
- [ ] Each user clears localStorage between sessions (or uses incognito mode for impostor sessions)

## User Credentials

| User | Email | Password |
|------|-------|----------|
| Amal Varghese | amal@adaptiveguardian.dev | Demo@1234567890 |
| Manasa | manasa@adaptiveguardian.dev | Demo@1234567890 |
| Dristi | dristi@adaptiveguardian.dev | Demo@1234567890 |
| Vyas | vyas@adaptiveguardian.dev | Demo@1234567890 |

---

*Generated 2026-07-14 for AdaptiveGuardian ML Training Data Collection*
