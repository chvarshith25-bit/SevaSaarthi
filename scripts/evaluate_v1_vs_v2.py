import csv
import json
import math
import re
from collections import Counter, defaultdict
from typing import Dict, List, Tuple, Any

# --- Model v1 (Baseline) Definition ---
STOP_WORDS_V1 = {
    "i", "me", "my", "myself", "we", "our", "ours", "you", "your", "he", "him", "his", "she", "her",
    "it", "its", "they", "them", "what", "which", "who", "whom", "this", "that", "these", "those",
    "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do",
    "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until",
    "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during",
    "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over",
    "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all",
    "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
    "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",
    "kavali", "undi", "ledu", "chesa", "cheyali", "padaledu", "chahiye", "hai", "ke", "liye", "me", "se", "ko"
}

def tokenize_v1(text: str) -> List[str]:
    clean = text.lower()
    clean = re.sub(r'[^a-z0-9\s]', ' ', clean)
    tokens = [t for t in clean.split() if len(t) > 1 and t not in STOP_WORDS_V1]
    ngrams = []
    for t in tokens:
        if len(t) >= 4:
            for i in range(len(t) - 2):
                ngrams.append(t[i:i+3])
    return tokens + ngrams

class BaselineModelV1:
    def __init__(self, model_path: str):
        with open(model_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.classes = data["classes"]
        self.service_metadata = data["service_metadata"]
        self.total_docs = data["total_docs"]

    def predict(self, text: str) -> Tuple[str, float, str]:
        tokens = tokenize_v1(text)
        if not tokens:
            return "MANUAL_REVIEW", 0.0, "MANUAL_REVIEW"
        input_counts = Counter(tokens)
        input_norm = math.sqrt(sum(c * c for c in input_counts.values()))
        if input_norm == 0:
            return "MANUAL_REVIEW", 0.0, "MANUAL_REVIEW"

        scores = {}
        for svc, vec in self.classes.items():
            dot = 0.0
            vec_norm = math.sqrt(sum(w * w for w in vec.values()))
            if vec_norm == 0:
                continue
            for token, count in input_counts.items():
                if token in vec:
                    dot += count * vec[token]
            cosine = dot / (input_norm * vec_norm)
            scores[svc] = cosine

        if not scores:
            return "MANUAL_REVIEW", 0.0, "MANUAL_REVIEW"
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_svc, top_score = sorted_scores[0]
        scaled_score = min(1.0, max(0.0, top_score * 1.85))
        scaled_score = round(scaled_score, 3)

        if scaled_score < 0.60:
            tier = "MANUAL_REVIEW"
            pred_svc = "MANUAL_REVIEW"
        elif scaled_score >= 0.85:
            tier = "AUTOMATIC_RECOMMENDATION"
            pred_svc = top_svc
        else:
            tier = "HUMAN_CONFIRMATION_REQUIRED"
            pred_svc = top_svc

        return pred_svc, scaled_score, tier


# --- Model v2 (Calibrated Hybrid Model) ---
import sys
sys.path.append('data/ai/workflow-router')
from train_v2 import CalibratedHybridRouterModel

class UpgradedModelV2:
    def __init__(self, model_path: str):
        self.model = CalibratedHybridRouterModel()
        self.model.load(model_path)
        self.classes = self.model.classes

    def predict(self, text: str) -> Tuple[str, float, str]:
        res = self.model.predict(text)
        return res["suggestedServiceId"], res["confidenceScore"], res["routingTier"]


def calculate_metrics(y_true: List[str], y_pred: List[str], confidences: List[float], classes: List[str]):
    n = len(y_true)
    correct = sum(1 for yt, yp in zip(y_true, y_pred) if yt == yp)
    accuracy = correct / n if n > 0 else 0.0

    confusion_matrix = defaultdict(lambda: defaultdict(int))
    for yt, yp in zip(y_true, y_pred):
        confusion_matrix[yt][yp] += 1

    per_class = {}
    precisions, recalls, f1s = [], [], []

    for c in classes:
        tp = confusion_matrix[c][c]
        fp = sum(confusion_matrix[other][c] for other in classes if other != c) + confusion_matrix['MANUAL_REVIEW'][c]
        fn = sum(confusion_matrix[c][other] for other in classes if other != c) + confusion_matrix[c]['MANUAL_REVIEW']
        support = sum(confusion_matrix[c].values())

        p = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        r = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * p * r) / (p + r) if (p + r) > 0 else 0.0

        per_class[c] = {'precision': p, 'recall': r, 'f1': f1, 'support': support}
        precisions.append(p)
        recalls.append(r)
        f1s.append(f1)

    macro_p = sum(precisions) / len(precisions) if precisions else 0.0
    macro_r = sum(recalls) / len(recalls) if recalls else 0.0
    macro_f1 = sum(f1s) / len(f1s) if f1s else 0.0

    # Expected Calibration Error (ECE) with 10 equal bins
    num_bins = 10
    bin_counts = [0] * num_bins
    bin_correct = [0] * num_bins
    bin_conf_sum = [0.0] * num_bins

    for yt, yp, conf in zip(y_true, y_pred, confidences):
        bin_idx = min(int(conf * num_bins), num_bins - 1)
        bin_counts[bin_idx] += 1
        bin_conf_sum[bin_idx] += conf
        if yt == yp:
            bin_correct[bin_idx] += 1

    ece = 0.0
    reliability_bins = []
    for b in range(num_bins):
        count = bin_counts[b]
        if count > 0:
            avg_conf = bin_conf_sum[b] / count
            acc = bin_correct[b] / count
            ece += (count / n) * abs(acc - avg_conf)
            reliability_bins.append({
                'bin': f"{b/num_bins:.1f}-{(b+1)/num_bins:.1f}",
                'count': count,
                'avg_conf': round(avg_conf, 4),
                'accuracy': round(acc, 4)
            })

    return {
        'accuracy': accuracy,
        'macro_precision': macro_p,
        'macro_recall': macro_r,
        'macro_f1': macro_f1,
        'per_class': per_class,
        'confusion_matrix': confusion_matrix,
        'ece': ece,
        'reliability_bins': reliability_bins
    }


def evaluate_ood(model, ood_path: str):
    ood_samples = []
    with open(ood_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            ood_samples.append(row['text'])

    total_ood = len(ood_samples)
    rejected_to_manual_review = 0
    false_routed = 0
    routes_by_class = Counter()

    for text in ood_samples:
        pred_svc, conf, tier = model.predict(text)
        if pred_svc == 'MANUAL_REVIEW' or tier == 'MANUAL_REVIEW':
            rejected_to_manual_review += 1
        else:
            false_routed += 1
            routes_by_class[pred_svc] += 1

    rejection_rate = rejected_to_manual_review / total_ood if total_ood > 0 else 0.0
    false_acceptance_rate = false_routed / total_ood if total_ood > 0 else 0.0

    return {
        'total_ood': total_ood,
        'rejected': rejected_to_manual_review,
        'false_routed': false_routed,
        'rejection_rate': rejection_rate,
        'false_acceptance_rate': false_acceptance_rate,
        'routes_by_class': dict(routes_by_class)
    }


def main():
    test_path = 'data/ai/workflow-router/routing-test-v2.csv'
    ood_path = 'data/ai/workflow-router/routing-ood-v2.csv'
    model_v1_path = 'data/ai/workflow-router/model.json'
    model_v2_path = 'data/ai/workflow-router/model-v2.json'

    # Load test data
    test_texts, test_labels = [], []
    with open(test_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            test_texts.append(row['text'])
            test_labels.append(row['service_id'])

    classes = sorted(list(set(test_labels)))

    print("==========================================================")
    print("      AI MODEL 1 RIGOROUS COMPARATIVE EVALUATION")
    print("==========================================================")
    print(f"Held-out In-Distribution Test Samples: {len(test_texts)}")
    print(f"Held-out Out-Of-Distribution (OOD) Samples: 400")
    print(f"Evaluated Classes ({len(classes)}): {', '.join(classes)}\\n")

    # Evaluate Baseline Model v1
    v1 = BaselineModelV1(model_v1_path)
    v1_preds, v1_confs, v1_tiers = [], [], []
    for txt in test_texts:
        p, c, t = v1.predict(txt)
        v1_preds.append(p)
        v1_confs.append(c)
        v1_tiers.append(t)

    v1_metrics = calculate_metrics(test_labels, v1_preds, v1_confs, classes)
    v1_ood = evaluate_ood(v1, ood_path)

    # Evaluate Upgraded Model v2
    v2 = UpgradedModelV2(model_v2_path)
    v2_preds, v2_confs, v2_tiers = [], [], []
    for txt in test_texts:
        p, c, t = v2.predict(txt)
        v2_preds.append(p)
        v2_confs.append(c)
        v2_tiers.append(t)

    v2_metrics = calculate_metrics(test_labels, v2_preds, v2_confs, classes)
    v2_ood = evaluate_ood(v2, ood_path)

    print("--- 1. OVERALL IN-DISTRIBUTION TEST PERFORMANCE ---")
    print(f"{'Metric':<25} | {'Baseline (v1)':<15} | {'Upgraded (v2)':<15}")
    print("-" * 60)
    print(f"{'Accuracy':<25} | {v1_metrics['accuracy']*100:>13.2f}% | {v2_metrics['accuracy']*100:>13.2f}%")
    print(f"{'Macro Precision':<25} | {v1_metrics['macro_precision']*100:>13.2f}% | {v2_metrics['macro_precision']*100:>13.2f}%")
    print(f"{'Macro Recall':<25} | {v1_metrics['macro_recall']*100:>13.2f}% | {v2_metrics['macro_recall']*100:>13.2f}%")
    print(f"{'Macro F1':<25} | {v1_metrics['macro_f1']*100:>13.2f}% | {v2_metrics['macro_f1']*100:>13.2f}%")
    print(f"{'Expected Calib Error (ECE)':<25} | {v1_metrics['ece']:>14.4f} | {v2_metrics['ece']:>14.4f}")
    print("-" * 60)

    print("\\n--- 2. PER-CLASS METRICS COMPARISON (TEST-V2) ---")
    print(f"{'Class':<25} | {'v1 F1':<8} | {'v2 F1':<8} | {'v1 Rec':<8} | {'v2 Rec':<8} | {'Support'}")
    print("-" * 75)
    for c in classes:
        m1 = v1_metrics['per_class'][c]
        m2 = v2_metrics['per_class'][c]
        print(f"{c:<25} | {m1['f1']*100:>6.1f}% | {m2['f1']*100:>6.1f}% | {m1['recall']*100:>6.1f}% | {m2['recall']*100:>6.1f}% | {m2['support']}")
    print("-" * 75)

    print("\\n--- 3. OUT-OF-DISTRIBUTION (OOD) SAFETY & REJECTION ---")
    print(f"{'Metric':<30} | {'Baseline (v1)':<15} | {'Upgraded (v2)':<15}")
    print("-" * 65)
    print(f"{'Total Unseen OOD Samples':<30} | {v1_ood['total_ood']:>15} | {v2_ood['total_ood']:>15}")
    print(f"{'Correctly Rejected to Review':<30} | {v1_ood['rejected']:>15} | {v2_ood['rejected']:>15}")
    print(f"{'False Acceptance (False Routed)':<30} | {v1_ood['false_routed']:>15} | {v2_ood['false_routed']:>15}")
    print(f"{'OOD Rejection Rate':<30} | {v1_ood['rejection_rate']*100:>13.2f}% | {v2_ood['rejection_rate']*100:>13.2f}%")
    print(f"{'False Acceptance Rate':<30} | {v1_ood['false_acceptance_rate']*100:>13.2f}% | {v2_ood['false_acceptance_rate']*100:>13.2f}%")
    print("-" * 65)

    print("\\n--- 4. CONFUSION MATRIX (MODEL V2 ON TEST-V2) ---")
    header = f"{'True / Pred':<25} | " + " | ".join(f"{c[:8]:<8}" for c in classes) + " | MANUAL_REV"
    print(header)
    print("-" * len(header))
    for true_c in classes:
        row_str = f"{true_c:<25} | "
        for pred_c in classes:
            cnt = v2_metrics['confusion_matrix'][true_c][pred_c]
            row_str += f"{cnt:>8} | "
        cnt_mr = v2_metrics['confusion_matrix'][true_c]['MANUAL_REVIEW']
        row_str += f"{cnt_mr:>10}"
        print(row_str)

    # Save detailed evaluation report as JSON
    report = {
        'v1_metrics': {
            'accuracy': v1_metrics['accuracy'],
            'macro_precision': v1_metrics['macro_precision'],
            'macro_recall': v1_metrics['macro_recall'],
            'macro_f1': v1_metrics['macro_f1'],
            'ece': v1_metrics['ece'],
            'per_class': v1_metrics['per_class'],
            'reliability_bins': v1_metrics['reliability_bins']
        },
        'v2_metrics': {
            'accuracy': v2_metrics['accuracy'],
            'macro_precision': v2_metrics['macro_precision'],
            'macro_recall': v2_metrics['macro_recall'],
            'macro_f1': v2_metrics['macro_f1'],
            'ece': v2_metrics['ece'],
            'per_class': v2_metrics['per_class'],
            'reliability_bins': v2_metrics['reliability_bins']
        },
        'v1_ood': v1_ood,
        'v2_ood': v2_ood
    }
    with open('data/ai/workflow-router/evaluation_comparison.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    print("\\nSaved evaluation comparison to data/ai/workflow-router/evaluation_comparison.json")

if __name__ == '__main__':
    main()
