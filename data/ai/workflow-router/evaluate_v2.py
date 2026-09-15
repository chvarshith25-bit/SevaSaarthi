import csv
import json
import math
import os
import sys

cur_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, cur_dir)

from train_v2 import CalibratedHybridRouterModel
from train import WorkflowRouterModel

def compute_metrics(y_true, y_pred, classes):
    cm = {c1: {c2: 0 for c2 in classes + ["MANUAL_REVIEW"]} for c1 in classes}
    for yt, yp in zip(y_true, y_pred):
        if yt in cm:
            cm[yt][yp] = cm[yt].get(yp, 0) + 1

    per_class = {}
    precisions, recalls, f1s = [], [], []

    for c in classes:
        tp = cm[c].get(c, 0)
        fp = sum(cm[other].get(c, 0) for other in classes if other != c)
        fn = sum(cm[c].get(other, 0) for other in classes + ["MANUAL_REVIEW"] if other != c)

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        per_class[c] = {"tp": tp, "fp": fp, "fn": fn, "precision": prec, "recall": rec, "f1": f1}
        precisions.append(prec)
        recalls.append(rec)
        f1s.append(f1)

    macro_prec = sum(precisions) / len(precisions)
    macro_rec = sum(recalls) / len(recalls)
    macro_f1 = sum(f1s) / len(f1s)
    acc = sum(per_class[c]["tp"] for c in classes) / len(y_true) if y_true else 0.0

    return {
        "accuracy": acc,
        "macro_precision": macro_prec,
        "macro_recall": macro_rec,
        "macro_f1": macro_f1,
        "per_class": per_class,
        "confusion_matrix": cm
    }

def compute_ece(probs_list, y_true_matches, n_bins=10):
    bin_size = 1.0 / n_bins
    ece = 0.0
    total_samples = len(probs_list)
    
    for b in range(n_bins):
        b_min = b * bin_size
        b_max = (b + 1) * bin_size
        indices = [i for i, p in enumerate(probs_list) if b_min <= p < b_max or (b == n_bins - 1 and p == 1.0)]
        if not indices:
            continue
        bin_acc = sum(1 for i in indices if y_true_matches[i]) / len(indices)
        bin_conf = sum(probs_list[i] for i in indices) / len(indices)
        ece += (len(indices) / total_samples) * abs(bin_acc - bin_conf)
        
    return ece

def main():
    test_path = os.path.join(cur_dir, "routing-test-v2.csv")
    ood_path = os.path.join(cur_dir, "routing-ood-v2.csv")

    test_rows = list(csv.DictReader(open(test_path, encoding='utf-8')))
    ood_rows = list(csv.DictReader(open(ood_path, encoding='utf-8')))
    classes = sorted(list({r["service_id"] for r in test_rows}))

    print("========================================================")
    print("      SEVA SAARTHI AI MODEL 1: EVALUATION BENCHMARK     ")
    print("========================================================")
    print(f"Test Dataset (Held-out): {len(test_rows)} samples across {len(classes)} classes")
    print(f"OOD Dataset  (Held-out): {len(ood_rows)} samples across external domains")
    print("--------------------------------------------------------")

    # 1. Baseline Model
    base_model = WorkflowRouterModel()
    base_model.fit(os.path.join(cur_dir, "routing-training-v2.csv"))

    base_preds = []
    base_confs = []
    base_matches = []
    base_y_true = [r["service_id"] for r in test_rows]

    for r in test_rows:
        pred_svc, conf, _ = base_model.predict(r["text"])
        base_preds.append(pred_svc if conf >= 0.60 else "MANUAL_REVIEW")
        base_confs.append(conf)
        base_matches.append(pred_svc == r["service_id"] and conf >= 0.60)

    base_ood_rejected = 0
    for r in ood_rows:
        _, conf, _ = base_model.predict(r["text"])
        if conf < 0.60:
            base_ood_rejected += 1

    base_metrics = compute_metrics(base_y_true, base_preds, classes)
    base_ece = compute_ece(base_confs, base_matches)
    base_brier = sum((p - (1.0 if m else 0.0)) ** 2 for p, m in zip(base_confs, base_matches)) / len(base_confs)

    # 2. Calibrated Model v2
    v2_model = CalibratedHybridRouterModel()
    v2_model.fit(os.path.join(cur_dir, "routing-training-v2.csv"))
    v2_model.calibrate(os.path.join(cur_dir, "routing-validation-v2.csv"))

    v2_preds = []
    v2_confs = []
    v2_matches = []

    for r in test_rows:
        out = v2_model.predict(r["text"])
        pred_svc = out["suggestedServiceId"]
        v2_preds.append(pred_svc)
        v2_confs.append(out["confidenceScore"])
        v2_matches.append(out["suggestedServiceName"] == r["service_id"] and pred_svc != "MANUAL_REVIEW")

    v2_ood_rejected = 0
    for r in ood_rows:
        out = v2_model.predict(r["text"])
        if out["routingTier"] == "MANUAL_REVIEW":
            v2_ood_rejected += 1

    v2_metrics = compute_metrics(base_y_true, v2_preds, classes)
    v2_ece = compute_ece(v2_confs, v2_matches)
    v2_brier = sum((p - (1.0 if m else 0.0)) ** 2 for p, m in zip(v2_confs, v2_matches)) / len(v2_confs)

    print("\n========================================================")
    print("            MODEL PERFORMANCE COMPARISON                ")
    print("========================================================")
    print(f"Metric                      | Baseline (v1) | Model v2 (Calibrated)")
    print(f"----------------------------|---------------|----------------------")
    print(f"Accuracy (In-Distribution)  | {base_metrics['accuracy']*100:6.2f}%       | {v2_metrics['accuracy']*100:6.2f}%")
    print(f"Macro Precision             | {base_metrics['macro_precision']*100:6.2f}%       | {v2_metrics['macro_precision']*100:6.2f}%")
    print(f"Macro Recall                | {base_metrics['macro_recall']*100:6.2f}%       | {v2_metrics['macro_recall']*100:6.2f}%")
    print(f"Macro F1 Score              | {base_metrics['macro_f1']*100:6.2f}%       | {v2_metrics['macro_f1']*100:6.2f}%")
    print(f"OOD Detection / Rejection   | {base_ood_rejected/len(ood_rows)*100:6.2f}%       | {v2_ood_rejected/len(ood_rows)*100:6.2f}% ({v2_ood_rejected}/{len(ood_rows)})")
    print(f"False-Routing Rate (ID)     | {(1.0-base_metrics['accuracy']) * 100:6.2f}%       | {(1.0-v2_metrics['accuracy']) * 100:6.2f}%")
    print(f"Expected Calibration Error  | {base_ece:6.4f}        | {v2_ece:6.4f} (Lower is better)")
    print(f"Brier Score                 | {base_brier:6.4f}        | {v2_brier:6.4f} (Lower is better)")
    print("========================================================")

    print("\n--- Per-Class Performance Breakdown (Model v2) ---")
    for c in classes:
        p = v2_metrics["per_class"][c]
        print(f" - {c:<25} | Prec: {p['precision']*100:6.2f}% | Rec: {p['recall']*100:6.2f}% | F1: {p['f1']*100:6.2f}%")

    print("\n--- Confusion Matrix (Model v2) ---")
    header = "True \\ Pred".ljust(25) + " | " + " | ".join(f"{c[:6]}" for c in classes) + " | MAN_REV"
    print(header)
    print("-" * len(header))
    for c in classes:
        row_str = f"{c[:24]:<25} | " + " | ".join(f"{v2_metrics['confusion_matrix'][c].get(c2, 0):6d}" for c2 in classes) + f" | {v2_metrics['confusion_matrix'][c].get('MANUAL_REVIEW', 0):7d}"
        print(row_str)

    report = {
        "baseline": {
            "accuracy": round(base_metrics["accuracy"], 4),
            "macro_precision": round(base_metrics["macro_precision"], 4),
            "macro_recall": round(base_metrics["macro_recall"], 4),
            "macro_f1": round(base_metrics["macro_f1"], 4),
            "ood_rejection_rate": round(base_ood_rejected / len(ood_rows), 4),
            "ece": round(base_ece, 4),
            "brier_score": round(base_brier, 4)
        },
        "model_v2": {
            "accuracy": round(v2_metrics["accuracy"], 4),
            "macro_f1": round(v2_metrics["macro_f1"], 4),
            "macro_precision": round(v2_metrics["macro_precision"], 4),
            "macro_recall": round(v2_metrics["macro_recall"], 4),
            "ood_rejection_rate": round(v2_ood_rejected / len(ood_rows), 4),
            "ece": round(v2_ece, 4),
            "brier_score": round(v2_brier, 4),
            "per_class": v2_metrics["per_class"],
            "confusion_matrix": v2_metrics["confusion_matrix"]
        }
    }
    with open(os.path.join(cur_dir, "evaluation_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print("\nEvaluation report saved to data/ai/workflow-router/evaluation_report.json")

if __name__ == "__main__":
    main()
