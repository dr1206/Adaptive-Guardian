"""Authoritative Evaluation Pipeline for Adaptive Guardian
Reproducible evaluation of final trained production models on held-out test splits.

Outputs:
  - ml/reports/authoritative_test_evaluation.json
  - ml/reports/authoritative_test_evaluation.csv
  - ml/reports/per_user_confusion_matrices.json
"""

import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    roc_curve,
    confusion_matrix,
    brier_score_loss,
)

ROOT = Path(__file__).resolve().parent.parent

CANONICAL_FEATURES = [
    "accelerationMean",
    "accelerationStd",
    "clickCount",
    "curvatureMean",
    "curvatureStd",
    "dwellMeanMs",
    "dwellStdMs",
    "flightMeanMs",
    "flightStdMs",
    "keysPerSec",
    "mouseTravelPx",
    "scrollAmount",
    "velocityMean",
    "velocityStd",
]

USERS = ["amal", "vyas", "dristi", "manasa"]


def compute_eer(y_true, scores):
    """Compute Equal Error Rate (EER) and the corresponding threshold."""
    fpr, tpr, thresholds = roc_curve(y_true, scores, pos_label=1)
    fnr = 1.0 - tpr
    idx = np.nanargmin(np.abs(fpr - fnr))
    eer = (fpr[idx] + fnr[idx]) / 2.0
    return float(eer), float(thresholds[idx])


def compute_tpr_at_fixed_fpr(y_true, scores, target_fpr=0.05):
    """Compute True Positive Rate at a specified False Positive Rate threshold (e.g. 5%)."""
    fpr, tpr, _ = roc_curve(y_true, scores, pos_label=1)
    valid_indices = np.where(fpr <= target_fpr)[0]
    if len(valid_indices) == 0:
        return 0.0
    return float(tpr[valid_indices[-1]])


def evaluate_production_models():
    results = {}
    csv_rows = []
    confusion_matrices = {}

    all_y_true = []
    all_scores = []
    all_preds = []

    print("=" * 85)
    print("ADAPTIVE GUARDIAN - AUTHORITATIVE HELD-OUT TEST SET EVALUATION")
    print("=" * 85)

    for user in USERS:
        model_dir = ROOT / "models" / user / "final"
        test_file = ROOT / "processed" / user / "test.csv"

        if not model_dir.exists() or not test_file.exists():
            print(f"[-] Missing files for user: {user}")
            continue

        # Load artifacts
        lgb_model = joblib.load(model_dir / "supervised_model.joblib")
        ocsvm_model = joblib.load(model_dir / "ocsvm_model.joblib")
        scaler = joblib.load(model_dir / "scaler.joblib")

        w_lgb = 0.65
        w_ocsvm = 0.35
        threshold = 0.50

        # Load held-out test data
        test_df = pd.read_csv(test_file)
        X_raw = test_df[CANONICAL_FEATURES].values
        label_col = "label" if "label" in test_df.columns else "is_genuine"
        y_true = test_df[label_col].astype(int).values

        # Scale features for OC-SVM
        X_scaled = scaler.transform(X_raw)

        # Supervised probability
        prob_lgb = lgb_model.predict_proba(X_raw)[:, 1]

        # OC-SVM decision function sigmoid scaling
        df_oc = ocsvm_model.decision_function(X_scaled)
        prob_ocsvm = 1.0 / (1.0 + np.exp(-df_oc))

        # Fusion score
        fusion_scores = w_lgb * prob_lgb + w_ocsvm * prob_ocsvm
        preds = (fusion_scores >= threshold).astype(int)

        # Metrics
        cm = confusion_matrix(y_true, preds, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel()

        acc = float(accuracy_score(y_true, preds))
        prec = float(precision_score(y_true, preds, zero_division=0))
        rec = float(recall_score(y_true, preds, zero_division=0))
        f1 = float(f1_score(y_true, preds, zero_division=0))
        roc_auc = float(roc_auc_score(y_true, fusion_scores))
        pr_auc = float(average_precision_score(y_true, fusion_scores))

        far = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
        frr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0
        eer, eer_thresh = compute_eer(y_true, fusion_scores)
        tpr_at_fpr05 = compute_tpr_at_fixed_fpr(y_true, fusion_scores, target_fpr=0.05)
        brier = float(brier_score_loss(y_true, fusion_scores))

        all_y_true.extend(y_true)
        all_scores.extend(fusion_scores)
        all_preds.extend(preds)

        user_metrics = {
            "user": user.capitalize(),
            "test_samples": int(len(test_df)),
            "genuine_samples": int(np.sum(y_true == 1)),
            "impostor_samples": int(np.sum(y_true == 0)),
            "decision_threshold": threshold,
            "weights": {"supervised_lgbm": w_lgb, "ocsvm": w_ocsvm},
            "confusion_matrix": {
                "tp": int(tp),
                "tn": int(tn),
                "fp": int(fp),
                "fn": int(fn),
            },
            "accuracy": round(acc, 5),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "far": round(far, 4),
            "frr": round(frr, 4),
            "eer": round(eer, 4),
            "eer_threshold": round(eer_thresh, 4),
            "tpr_at_fpr05": round(tpr_at_fpr05, 4),
            "brier_score": round(brier, 4),
        }

        results[user.capitalize()] = user_metrics
        confusion_matrices[user.capitalize()] = {
            "matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
            "labels": ["Impostor (0)", "Genuine (1)"],
            "tp": int(tp),
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
        }

        csv_rows.append(
            {
                "User": user.capitalize(),
                "Samples": len(test_df),
                "Genuine": int(np.sum(y_true == 1)),
                "Impostor": int(np.sum(y_true == 0)),
                "Threshold": threshold,
                "Accuracy (%)": round(acc * 100, 2),
                "Precision": round(prec, 4),
                "Recall (TPR)": round(rec, 4),
                "F1-Score": round(f1, 4),
                "ROC-AUC": round(roc_auc, 4),
                "PR-AUC": round(pr_auc, 4),
                "FAR (%)": round(far * 100, 2),
                "FRR (%)": round(frr * 100, 2),
                "EER (%)": round(eer * 100, 2),
                "TPR@FPR=0.05": round(tpr_at_fpr05, 4),
                "Brier Score": round(brier, 4),
                "TP": int(tp),
                "TN": int(tn),
                "FP": int(fp),
                "FN": int(fn),
            }
        )

        print(
            f"[*] User {user.capitalize():<7}: N={len(test_df):<3} | Acc={acc*100:6.2f}% | "
            f"F1={f1:.4f} | ROC-AUC={roc_auc:.4f} | FAR={far*100:5.2f}% | FRR={frr*100:5.2f}% | EER={eer*100:5.2f}% | "
            f"[TP={tp}, TN={tn}, FP={fp}, FN={fn}]"
        )

    # Compute Macro-Averages
    user_names = list(results.keys())
    macro_acc = np.mean([results[u]["accuracy"] for u in user_names])
    macro_prec = np.mean([results[u]["precision"] for u in user_names])
    macro_rec = np.mean([results[u]["recall"] for u in user_names])
    macro_f1 = np.mean([results[u]["f1"] for u in user_names])
    macro_roc = np.mean([results[u]["roc_auc"] for u in user_names])
    macro_pr = np.mean([results[u]["pr_auc"] for u in user_names])
    macro_far = np.mean([results[u]["far"] for u in user_names])
    macro_frr = np.mean([results[u]["frr"] for u in user_names])
    macro_eer = np.mean([results[u]["eer"] for u in user_names])
    macro_tpr_at_fpr05 = np.mean([results[u]["tpr_at_fpr05"] for u in user_names])
    macro_brier = np.mean([results[u]["brier_score"] for u in user_names])

    total_samples = sum([results[u]["test_samples"] for u in user_names])
    total_tp = sum([results[u]["confusion_matrix"]["tp"] for u in user_names])
    total_tn = sum([results[u]["confusion_matrix"]["tn"] for u in user_names])
    total_fp = sum([results[u]["confusion_matrix"]["fp"] for u in user_names])
    total_fn = sum([results[u]["confusion_matrix"]["fn"] for u in user_names])

    results["Macro_Average"] = {
        "test_samples": total_samples,
        "accuracy": round(float(macro_acc), 5),
        "precision": round(float(macro_prec), 4),
        "recall": round(float(macro_rec), 4),
        "f1": round(float(macro_f1), 4),
        "roc_auc": round(float(macro_roc), 4),
        "pr_auc": round(float(macro_pr), 4),
        "far": round(float(macro_far), 4),
        "frr": round(float(macro_frr), 4),
        "eer": round(float(macro_eer), 4),
        "tpr_at_fpr05": round(float(macro_tpr_at_fpr05), 4),
        "brier_score": round(float(macro_brier), 4),
        "total_confusion_matrix": {
            "tp": int(total_tp),
            "tn": int(total_tn),
            "fp": int(total_fp),
            "fn": int(total_fn),
        },
    }

    csv_rows.append(
        {
            "User": "Macro Average",
            "Samples": total_samples,
            "Genuine": "-",
            "Impostor": "-",
            "Threshold": "-",
            "Accuracy (%)": round(float(macro_acc) * 100, 2),
            "Precision": round(float(macro_prec), 4),
            "Recall (TPR)": round(float(macro_rec), 4),
            "F1-Score": round(float(macro_f1), 4),
            "ROC-AUC": round(float(macro_roc), 4),
            "PR-AUC": round(float(macro_pr), 4),
            "FAR (%)": round(float(macro_far) * 100, 2),
            "FRR (%)": round(float(macro_frr) * 100, 2),
            "EER (%)": round(float(macro_eer) * 100, 2),
            "TPR@FPR=0.05": round(float(macro_tpr_at_fpr05), 4),
            "Brier Score": round(float(macro_brier), 4),
            "TP": int(total_tp),
            "TN": int(total_tn),
            "FP": int(total_fp),
            "FN": int(total_fn),
        }
    )

    print("-" * 85)
    print(
        f"[=] MACRO AVERAGE   : N={total_samples:<3} | Acc={macro_acc*100:6.2f}% | "
        f"F1={macro_f1:.4f} | ROC-AUC={macro_roc:.4f} | FAR={macro_far*100:5.2f}% | FRR={macro_frr*100:5.2f}% | EER={macro_eer*100:5.2f}% | "
        f"[TP={total_tp}, TN={total_tn}, FP={total_fp}, FN={total_fn}]"
    )
    print("=" * 85)

    # Save machine-readable outputs
    reports_dir = ROOT / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    json_path = reports_dir / "authoritative_test_evaluation.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    cm_path = reports_dir / "per_user_confusion_matrices.json"
    with open(cm_path, "w", encoding="utf-8") as f:
        json.dump(confusion_matrices, f, indent=2)

    csv_path = reports_dir / "authoritative_test_evaluation.csv"
    pd.DataFrame(csv_rows).to_csv(csv_path, index=False)

    print(f"\n[+] Saved authoritative results successfully:")
    print(f"    - JSON: {json_path}")
    print(f"    - CSV : {csv_path}")
    print(f"    - CM  : {cm_path}")

    return results


if __name__ == "__main__":
    evaluate_production_models()
