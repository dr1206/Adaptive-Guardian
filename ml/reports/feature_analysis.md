# Behavioral Feature Importance Analysis

Mean normalized feature importance across all four personalized user models (Amal, Vyas, Dristi, Manasa):

| Rank | Feature | Category | Importance Share | Description |
|---|---|---|---|---|
| 1 | `dwellMeanMs` | Keystroke Dynamics | 0.1420 (14.20%) | Mean duration of individual key presses before release. |
| 2 | `accelerationMean` | Mouse Dynamics | 0.1118 (11.18%) | Mean rate of change of mouse velocity across pointer movement bursts. |
| 3 | `dwellStdMs` | Keystroke Dynamics | 0.0923 (9.23%) | Standard deviation of key hold durations (rhythm consistency). |
| 4 | `curvatureMean` | Mouse Dynamics | 0.0877 (8.77%) | Mean path tortuosity and trajectory deviation from straight line. |
| 5 | `curvatureStd` | Mouse Dynamics | 0.0853 (8.53%) | Standard deviation of path tortuosity across movement segments. |
| 6 | `mouseTravelPx` | Mouse Dynamics | 0.0700 (7.00%) | Total cumulative Euclidean distance traversed by mouse cursor. |
| 7 | `keysPerSec` | Keystroke Dynamics | 0.0649 (6.49%) | Gross typing cadence measured as keystroke events per second. |
| 8 | `velocityMean` | Mouse Dynamics | 0.0628 (6.28%) | Mean instantaneous displacement speed of mouse trajectories (px/ms). |
| 9 | `scrollAmount` | Interaction Dynamics | 0.0579 (5.79%) | Total vertical and horizontal wheel scroll displacement (pixels). |
| 10 | `velocityStd` | Mouse Dynamics | 0.0535 (5.35%) | Standard deviation of mouse displacement speed across samples. |
| 11 | `flightMeanMs` | Keystroke Dynamics | 0.0508 (5.08%) | Mean transition interval between key release and next key press. |
| 12 | `flightStdMs` | Keystroke Dynamics | 0.0435 (4.35%) | Standard deviation of transition intervals across keystrokes. |
| 13 | `clickCount` | Interaction Dynamics | 0.0389 (3.89%) | Total count of discrete mouse button clicks within the sliding window. |
| 14 | `accelerationStd` | Mouse Dynamics | 0.0385 (3.85%) | Variability of pointer acceleration and sudden directional changes. |

### Key Takeaways:
- **Keystroke timing rhythm** (`dwellMeanMs` at 14.20% and `dwellStdMs` at 9.23%) forms the primary discriminatory baseline for user identity during keyboard interaction.
- **Mouse motor dynamics** (`accelerationMean` at 11.18%, `curvatureMean` at 8.77%, and `curvatureStd` at 8.53%) provide strong continuous spatial separation through individual curvature and acceleration habits.
- Both modalities work complementarily in the Weighted Fusion framework, preventing single-modality evasion.
