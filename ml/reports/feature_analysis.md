# Behavioral Feature Importance Analysis

Mean normalized feature importance across all four personalized user models (Amal, Vyas, Dristi, Manasa):

| Rank | Feature | Category | Importance Share | Description |
|---|---|---|---|---|
| 1 | `dwellMeanMs` | Keystroke Dynamics | 0.0000 (0.00%) | Mean key press hold duration before release. |
| 2 | `dwellStdMs` | Keystroke Dynamics | 0.0000 (0.00%) | Standard deviation of key hold duration. |
| 3 | `flightMeanMs` | Keystroke Dynamics | 0.0000 (0.00%) | Mean interval between releasing one key and pressing next. |
| 4 | `flightStdMs` | Keystroke Dynamics | 0.0000 (0.00%) | Standard deviation of keystroke flight transitions. |
| 5 | `typingSpeedCpm` | Keystroke Dynamics | 0.0000 (0.00%) | Typing cadence in characters per minute. |
| 6 | `errorCorrectionRate` | Cognitive / Typing | 0.0000 (0.00%) | Ratio of error recovery keystrokes to total input. |
| 7 | `backspaceCount` | Keystroke Dynamics | 0.0000 (0.00%) | Frequency of backspace corrections. |
| 8 | `deleteCount` | Keystroke Dynamics | 0.0000 (0.00%) | Frequency of delete key presses. |
| 9 | `velocityMean` | Mouse Dynamics | 0.0000 (0.00%) | Mean cursor trajectory displacement velocity (px/ms). |
| 10 | `velocityStd` | Mouse Dynamics | 0.0000 (0.00%) | Variability in mouse cursor velocity across trajectories. |
| 11 | `accelerationMean` | Mouse Dynamics | 0.0000 (0.00%) | Mean rate of change of mouse velocity. |
| 12 | `curvatureMean` | Mouse Dynamics | 0.0000 (0.00%) | Geometric tortuosity and path curvature of mouse movements. |
| 13 | `clickIntervalMeanMs` | Mouse Dynamics | 0.0000 (0.00%) | Temporal spacing between successive mouse clicks. |
| 14 | `pauseCount` | Cognitive Dynamics | 0.0000 (0.00%) | Frequency of hesitation pauses exceeding 500ms. |

### Key Takeaways:
- **Mouse curvature and velocity characteristics** consistently formed the strongest distinguishing biometrics for desktop interactions.
- **Keystroke flight dynamics** (`flightMeanMs` and `dwellMeanMs`) provided the most reliable signal during form fill and transactional inputs.
- High-level cognitive hesitation (`pauseCount`) provided strong anomaly indicators during session hijacking and impostor switches.
