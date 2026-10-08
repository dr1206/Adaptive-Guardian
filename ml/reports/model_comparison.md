# Complete Model Comparison Report

Evaluated across all 13 required model architectures on genuine vs impostor behavioral dynamics.

## Amal Results Table

| Model | Category | Status | Accuracy | Precision | Recall | F1 | ROC-AUC | FAR | FRR | EER | Latency (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **TabPFN-3.5 Fast** | Foundation | *Not Evaluated* | — | — | — | — | — | — | — | — | — |
| **TabPFN-3.5** | Foundation | *Not Evaluated* | — | — | — | — | — | — | — | — | — |
| **TabFM** | Foundation | Evaluated | 20.13% | 0.2013 | 1.0000 | 0.3351 | 0.5000 | 100.00% | 0.00% | 50.00% | 12.43ms |
| **LightGBM** | Gradient Boosted Tree | Trained | 88.05% | 0.6512 | 0.8750 | 0.7467 | 0.9541 | 11.81% | 12.50% | 12.16% | 0.04ms |
| **CatBoost** | Gradient Boosted Tree | Trained | 86.16% | 0.6087 | 0.8750 | 0.7179 | 0.9486 | 14.17% | 12.50% | 12.55% | 0.12ms |
| **XGBoost** | Gradient Boosted Tree | Trained | 85.53% | 0.6154 | 0.7500 | 0.6761 | 0.9444 | 11.81% | 25.00% | 12.55% | 0.03ms |
| **Random Forest** | Ensemble Trees | Trained | 86.16% | 0.6562 | 0.6562 | 0.6562 | 0.9459 | 8.66% | 34.38% | 12.55% | 0.28ms |
| **ExtraTrees** | Ensemble Trees | Trained | 83.02% | 0.5455 | 0.9375 | 0.6897 | 0.9498 | 19.69% | 6.25% | 16.87% | 0.17ms |
| **MLP** | Neural Network | Trained | 93.08% | 0.8621 | 0.7812 | 0.8197 | 0.9641 | 3.15% | 21.88% | 11.76% | 0.01ms |
| **OC-SVM** | Anomaly Detection | Trained | 71.70% | 0.3898 | 0.7188 | 0.5055 | 0.7955 | 28.35% | 28.12% | 28.24% | 0.01ms |
| **Isolation Forest** | Anomaly Detection | Trained | 54.72% | 0.2297 | 0.5312 | 0.3208 | 0.5802 | 44.88% | 46.88% | 45.88% | 0.04ms |
| **Local Outlier Factor** | Anomaly Detection | Trained | 67.30% | 0.3438 | 0.6875 | 0.4583 | 0.7247 | 33.07% | 31.25% | 27.53% | 0.01ms |
| **Weighted Fusion** | Ensemble Fusion | Trained | 94.34% | 0.8966 | 0.8125 | 0.8525 | 0.9707 | 2.36% | 18.75% | 7.46% | 0.01ms |

## Vyas Results Table

| Model | Category | Status | Accuracy | Precision | Recall | F1 | ROC-AUC | FAR | FRR | EER | Latency (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **TabPFN-3.5 Fast** | Foundation | *Not Evaluated* | — | — | — | — | — | — | — | — | — |
| **TabPFN-3.5** | Foundation | *Not Evaluated* | — | — | — | — | — | — | — | — | — |
| **TabFM** | Foundation | Evaluated | 19.35% | 0.1935 | 1.0000 | 0.3243 | 0.5000 | 100.00% | 0.00% | 50.00% | 18.37ms |
| **LightGBM** | Gradient Boosted Tree | Trained | 84.95% | 0.5667 | 0.9444 | 0.7083 | 0.9807 | 17.33% | 5.56% | 8.22% | 0.02ms |
| **CatBoost** | Gradient Boosted Tree | Trained | 93.55% | 0.8000 | 0.8889 | 0.8421 | 0.9874 | 5.33% | 11.11% | 5.44% | 0.02ms |
| **XGBoost** | Gradient Boosted Tree | Trained | 84.95% | 0.5667 | 0.9444 | 0.7083 | 0.9793 | 17.33% | 5.56% | 8.22% | 0.02ms |
| **Random Forest** | Ensemble Trees | Trained | 82.80% | 0.5455 | 0.6667 | 0.6000 | 0.9430 | 13.33% | 33.33% | 9.44% | 0.44ms |
| **ExtraTrees** | Ensemble Trees | Trained | 83.87% | 0.5556 | 0.8333 | 0.6667 | 0.9541 | 16.00% | 16.67% | 17.67% | 0.30ms |
| **MLP** | Neural Network | Trained | 94.62% | 1.0000 | 0.7222 | 0.8387 | 0.9615 | 0.00% | 27.78% | 14.89% | 0.00ms |
| **OC-SVM** | Anomaly Detection | Trained | 53.76% | 0.2222 | 0.5556 | 0.3175 | 0.6533 | 46.67% | 44.44% | 45.56% | 0.00ms |
| **Isolation Forest** | Anomaly Detection | Trained | 76.34% | 0.4375 | 0.7778 | 0.5600 | 0.7711 | 24.00% | 22.22% | 23.11% | 0.11ms |
| **Local Outlier Factor** | Anomaly Detection | Trained | 35.48% | 0.1500 | 0.5000 | 0.2308 | 0.4874 | 68.00% | 50.00% | 59.00% | 0.02ms |
| **Weighted Fusion** | Ensemble Fusion | Trained | 94.62% | 0.8095 | 0.9444 | 0.8718 | 0.9815 | 5.33% | 5.56% | 4.11% | 0.02ms |

## Dristi Results Table

| Model | Category | Status | Accuracy | Precision | Recall | F1 | ROC-AUC | FAR | FRR | EER | Latency (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **TabPFN-3.5 Fast** | Foundation | *Not Evaluated* | — | — | — | — | — | — | — | — | — |
| **TabPFN-3.5** | Foundation | *Not Evaluated* | — | — | — | — | — | — | — | — | — |
| **TabFM** | Foundation | Evaluated | 21.78% | 0.2178 | 1.0000 | 0.3577 | 0.5000 | 100.00% | 0.00% | 50.00% | 13.28ms |
| **LightGBM** | Gradient Boosted Tree | Trained | 89.11% | 0.7200 | 0.8182 | 0.7660 | 0.9543 | 8.86% | 18.18% | 8.98% | 0.03ms |
| **CatBoost** | Gradient Boosted Tree | Trained | 85.15% | 0.6296 | 0.7727 | 0.6939 | 0.9330 | 12.66% | 22.73% | 14.41% | 0.04ms |
| **XGBoost** | Gradient Boosted Tree | Trained | 84.16% | 0.6071 | 0.7727 | 0.6800 | 0.9269 | 13.92% | 22.73% | 15.05% | 0.02ms |
| **Random Forest** | Ensemble Trees | Trained | 87.13% | 0.7143 | 0.6818 | 0.6977 | 0.9054 | 7.59% | 31.82% | 14.41% | 0.28ms |
| **ExtraTrees** | Ensemble Trees | Trained | 81.19% | 0.5600 | 0.6364 | 0.5957 | 0.8150 | 13.92% | 36.36% | 20.48% | 0.26ms |
| **MLP** | Neural Network | Trained | 86.14% | 0.7500 | 0.5455 | 0.6316 | 0.8380 | 5.06% | 45.45% | 22.76% | 0.01ms |
| **OC-SVM** | Anomaly Detection | Trained | 63.37% | 0.3256 | 0.6364 | 0.4308 | 0.7005 | 36.71% | 36.36% | 36.54% | 0.01ms |
| **Isolation Forest** | Anomaly Detection | Trained | 59.41% | 0.2889 | 0.5909 | 0.3881 | 0.6240 | 40.51% | 40.91% | 40.71% | 0.12ms |
| **Local Outlier Factor** | Anomaly Detection | Trained | 58.42% | 0.2826 | 0.5909 | 0.3824 | 0.6087 | 41.77% | 40.91% | 41.34% | 0.01ms |
| **Weighted Fusion** | Ensemble Fusion | Trained | 91.09% | 0.7407 | 0.9091 | 0.8163 | 0.9485 | 8.86% | 9.09% | 8.98% | 0.04ms |

## Manasa Results Table

| Model | Category | Status | Accuracy | Precision | Recall | F1 | ROC-AUC | FAR | FRR | EER | Latency (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **TabPFN-3.5 Fast** | Foundation | *Not Evaluated* | — | — | — | — | — | — | — | — | — |
| **TabPFN-3.5** | Foundation | *Not Evaluated* | — | — | — | — | — | — | — | — | — |
| **TabFM** | Foundation | Evaluated | 21.58% | 0.2158 | 1.0000 | 0.3550 | 0.5000 | 100.00% | 0.00% | 50.00% | 13.17ms |
| **LightGBM** | Gradient Boosted Tree | Trained | 90.65% | 0.7576 | 0.8333 | 0.7937 | 0.9420 | 7.34% | 16.67% | 14.76% | 0.02ms |
| **CatBoost** | Gradient Boosted Tree | Trained | 87.05% | 0.6579 | 0.8333 | 0.7353 | 0.9537 | 11.93% | 16.67% | 10.96% | 0.02ms |
| **XGBoost** | Gradient Boosted Tree | Trained | 90.65% | 0.7742 | 0.8000 | 0.7869 | 0.9541 | 6.42% | 20.00% | 12.92% | 0.01ms |
| **Random Forest** | Ensemble Trees | Trained | 88.49% | 0.7500 | 0.7000 | 0.7241 | 0.9466 | 6.42% | 30.00% | 10.05% | 0.30ms |
| **ExtraTrees** | Ensemble Trees | Trained | 85.61% | 0.6250 | 0.8333 | 0.7143 | 0.9179 | 13.76% | 16.67% | 15.67% | 0.20ms |
| **MLP** | Neural Network | Trained | 85.61% | 0.7500 | 0.5000 | 0.6000 | 0.8570 | 4.59% | 50.00% | 23.59% | 0.00ms |
| **OC-SVM** | Anomaly Detection | Trained | 63.31% | 0.3220 | 0.6333 | 0.4270 | 0.6329 | 36.70% | 36.67% | 36.68% | 0.00ms |
| **Isolation Forest** | Anomaly Detection | Trained | 69.78% | 0.3889 | 0.7000 | 0.5000 | 0.7017 | 30.28% | 30.00% | 30.14% | 0.04ms |
| **Local Outlier Factor** | Anomaly Detection | Trained | 63.31% | 0.3220 | 0.6333 | 0.4270 | 0.6870 | 36.70% | 36.67% | 36.68% | 0.01ms |
| **Weighted Fusion** | Ensemble Fusion | Trained | 92.81% | 0.8333 | 0.8333 | 0.8333 | 0.9369 | 4.59% | 16.67% | 14.76% | 0.02ms |

## Overall Leaderboard (Mean Across All Four Users)

| Rank | Model | Security Score | Accuracy | F1 | ROC-AUC | FAR (False Acceptance) | FRR (False Rejection) | EER |
|---|---|---|---|---|---|---|---|---|
| #1 | **Weighted Fusion** | **0.5630** | 93.21% | 0.8435 | 0.9594 | 5.29% | 12.52% | 8.82% |
| #2 | **LightGBM** | **0.5187** | 88.19% | 0.7537 | 0.9578 | 11.34% | 13.23% | 11.03% |
| #3 | **CatBoost** | **0.5145** | 87.98% | 0.7473 | 0.9557 | 11.02% | 15.75% | 10.84% |
| #4 | **XGBoost** | **0.4963** | 86.32% | 0.7128 | 0.9512 | 12.37% | 18.32% | 12.18% |
| #5 | **MLP** | **0.4899** | 89.86% | 0.7225 | 0.9052 | 3.20% | 36.28% | 18.25% |
| #6 | **Random Forest** | **0.4742** | 86.14% | 0.6695 | 0.9352 | 9.00% | 32.38% | 11.61% |
| #7 | **ExtraTrees** | **0.4596** | 83.42% | 0.6666 | 0.9092 | 15.84% | 18.99% | 17.67% |
| #8 | **Isolation Forest** | **0.2531** | 65.06% | 0.4422 | 0.6693 | 34.92% | 35.00% | 34.96% |
| #9 | **OC-SVM** | **0.2445** | 63.03% | 0.4202 | 0.6956 | 37.10% | 36.40% | 36.75% |
| #10 | **Local Outlier Factor** | **0.1845** | 56.13% | 0.3746 | 0.6270 | 44.89% | 39.71% | 41.14% |
| #11 | **TabFM** | **0.0168** | 20.71% | 0.3430 | 0.5000 | 100.00% | 0.00% | 50.00% |
