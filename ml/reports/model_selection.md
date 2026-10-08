# Model Selection Decision Document

## Selection Methodology

Biometric security requires prioritizing low False Acceptance Rate (FAR) over raw accuracy alone:
$$\text{Score} = 0.25 \times \text{ROC-AUC} + 0.25 \times F1 + 0.15 \times \text{Accuracy} - 0.20 \times \text{FAR} - 0.10 \times \text{FRR} - 0.05 \times \text{EER}$$

## Per-User Winners

- **Amal**: Winner = **Weighted Fusion** (Score: 0.5701, FAR: 2.36%, F1: 0.8525, ROC-AUC: 0.9707)
- **Vyas**: Winner = **Weighted Fusion** (Score: 0.5870, FAR: 5.33%, F1: 0.8718, ROC-AUC: 0.9815)
- **Dristi**: Winner = **Weighted Fusion** (Score: 0.5465, FAR: 8.86%, F1: 0.8163, ROC-AUC: 0.9485)
- **Manasa**: Winner = **Weighted Fusion** (Score: 0.5485, FAR: 4.59%, F1: 0.8333, ROC-AUC: 0.9369)

## Best Overall System Model: **Weighted Fusion**

