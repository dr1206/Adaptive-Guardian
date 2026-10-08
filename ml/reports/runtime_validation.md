# Runtime & Cross-User Security Validation

## Cross-User Impostor Rejection Matrix

| Model Owner | Behavior Tested | Relationship | Samples | Blocked (Rejected) | Rejection Rate |
|---|---|---|---|---|---|
| Amal | Amal | Genuine User | 33 | 4 | 12.12% |
| Amal | Vyas | Impostor Cross-Test | 19 | 16 | 84.21% |
| Amal | Dristi | Impostor Cross-Test | 21 | 18 | 85.71% |
| Amal | Manasa | Impostor Cross-Test | 30 | 26 | 86.67% |
| Vyas | Amal | Impostor Cross-Test | 33 | 21 | 63.64% |
| Vyas | Vyas | Genuine User | 19 | 1 | 5.26% |
| Vyas | Dristi | Impostor Cross-Test | 21 | 19 | 90.48% |
| Vyas | Manasa | Impostor Cross-Test | 30 | 21 | 70.00% |
| Dristi | Amal | Impostor Cross-Test | 33 | 26 | 78.79% |
| Dristi | Vyas | Impostor Cross-Test | 19 | 18 | 94.74% |
| Dristi | Dristi | Genuine User | 21 | 3 | 14.29% |
| Dristi | Manasa | Impostor Cross-Test | 30 | 27 | 90.00% |
| Manasa | Amal | Impostor Cross-Test | 33 | 31 | 93.94% |
| Manasa | Vyas | Impostor Cross-Test | 19 | 18 | 94.74% |
| Manasa | Dristi | Impostor Cross-Test | 21 | 19 | 90.48% |
| Manasa | Manasa | Genuine User | 30 | 6 | 20.00% |
