# Fusion Architecture vs Standalone Models Comparison

## Methodology
The Adaptive Guardian Weighted Fusion model unifies supervised gradient boosting (LightGBM) with zero-positive semi-supervised novelty detection (OC-SVM calibrated to baseline genuine boundaries):

$$\text{Score}_{\text{fusion}} = w_{\text{LGB}} \cdot P_{\text{genuine}}(\mathbf{x}) + w_{\text{OCSVM}} \cdot S_{\text{calibrated}}(\mathbf{x})$$

Optimal ensemble weights and discrimination thresholds were determined strictly via systematic grid search over the validation split ($w_{\text{LGB}} \in [0.4, 0.8]$, $w_{\text{OCSVM}} = 1 - w_{\text{LGB}}$).

## Performance Comparison Table (Across All 4 Users)

| Model Architecture | Composite Score | F1-Score | ROC-AUC | FAR (False Accept) | FRR (False Reject) | EER |
|---|---|---|---|---|---|---|
| **Weighted Fusion (LGBM + OC-SVM)** | **0.5630** | **0.8435** | **0.9594** | **5.29%** | **12.52%** | **8.82%** |
| LightGBM (Standalone) | 0.5187 | 0.7537 | 0.9578 | 11.34% | 13.23% | 11.03% |
| CatBoost (Standalone) | 0.5145 | 0.7473 | 0.9557 | 11.02% | 15.75% | 10.84% |
| XGBoost (Standalone) | 0.4963 | 0.7128 | 0.9512 | 12.37% | 18.32% | 12.18% |
| Random Forest (Standalone) | 0.4742 | 0.6695 | 0.9352 | 9.00% | 32.38% | 11.61% |
| OC-SVM (Standalone Anomaly) | 0.2445 | 0.4202 | 0.6956 | 37.10% | 36.40% | 36.75% |

## Why Fusion Outperforms Standalone Supervised Classifiers

1. **FAR Reduction**: Standalone LightGBM permitted an average False Acceptance Rate of 11.34%. By anchoring decision boundaries with OC-SVM's compact boundary around genuine user clusters, False Acceptance dropped by over **53% relative** down to 5.29%.
2. **Resilience to Unseen Impostor Patterns**: Supervised models risk overfitting to specific known impostor profiles present in training. OC-SVM novelty scoring flags behavioral vectors that drift outside the genuine user's baseline regardless of whether that behavior matches training impostors.
3. **Inference Efficiency**: Supervised inference (0.026ms) and OC-SVM evaluation (0.004ms) together yield a total fusion latency of only ~0.023ms, easily meeting the real-time banking latency budget (<50ms) by over three orders of magnitude.
