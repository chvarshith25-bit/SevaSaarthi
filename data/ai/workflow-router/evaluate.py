import csv
import json
from train import WorkflowRouterModel

def evaluate(model_path: str, test_path: str):
    with open(model_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    router = WorkflowRouterModel()
    router.classes = data["classes"]
    router.service_metadata = data["service_metadata"]
    router.total_docs = data["total_docs"]

    total = 0
    correct_svc = 0
    correct_dept = 0
    correct_subdept = 0
    correct_wf = 0

    true_positives = {}
    false_positives = {}
    false_negatives = {}

    ood_total = 0
    ood_detected = 0

    with open(test_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            text = row['text']
            expected_svc = row['service_id']
            expected_dept = row['department_id']
            expected_sub = row['sub_department_id']
            expected_wf = row['workflow_id']

            pred_svc, conf, meta = router.predict(text)

            if expected_svc == "MANUAL_REVIEW":
                ood_total += 1
                if pred_svc == "MANUAL_REVIEW" or conf < 0.60:
                    ood_detected += 1
                continue

            if pred_svc == expected_svc:
                correct_svc += 1
                true_positives[expected_svc] = true_positives.get(expected_svc, 0) + 1
            else:
                false_positives[pred_svc] = false_positives.get(pred_svc, 0) + 1
                false_negatives[expected_svc] = false_negatives.get(expected_svc, 0) + 1

            if meta.get("department_id") == expected_dept:
                correct_dept += 1
            if meta.get("sub_department_id") == expected_sub:
                correct_subdept += 1
            if meta.get("workflow_id") == expected_wf:
                correct_wf += 1

    in_scope_total = total - ood_total
    svc_acc = correct_svc / in_scope_total if in_scope_total else 0.0
    dept_acc = correct_dept / in_scope_total if in_scope_total else 0.0
    sub_acc = correct_subdept / in_scope_total if in_scope_total else 0.0
    wf_acc = correct_wf / in_scope_total if in_scope_total else 0.0
    ood_acc = ood_detected / ood_total if ood_total else 1.0

    print("==================================================")
    print("   AI MODEL 1 (WORKFLOW ROUTER) EVALUATION REPORT")
    print("==================================================")
    print(f"Total Test Set Samples: {total}")
    print(f"In-Distribution Samples: {in_scope_total}")
    print(f"Out-of-Distribution (Manual Review) Samples: {ood_total}\n")

    print(f"Service Accuracy:       {svc_acc*100:.2f}% ({correct_svc}/{in_scope_total})")
    print(f"Department Accuracy:    {dept_acc*100:.2f}% ({correct_dept}/{in_scope_total})")
    print(f"Sub-Department Accuracy:{sub_acc*100:.2f}% ({correct_subdept}/{in_scope_total})")
    print(f"Workflow Accuracy:      {wf_acc*100:.2f}% ({correct_wf}/{in_scope_total})")
    print(f"Manual Review Detection:{ood_acc*100:.2f}% ({ood_detected}/{ood_total})\n")

    # Macro Precision / Recall / F1
    all_classes = set(router.classes.keys())
    precisions = []
    recalls = []
    f1s = []

    for c in all_classes:
        tp = true_positives.get(c, 0)
        fp = false_positives.get(c, 0)
        fn = false_negatives.get(c, 0)
        p = tp / (tp + fp) if (tp + fp) > 0 else 1.0
        r = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * p * r) / (p + r) if (p + r) > 0 else 0.0
        precisions.append(p)
        recalls.append(r)
        f1s.append(f1)

    macro_p = sum(precisions) / len(precisions) if precisions else 0.0
    macro_r = sum(recalls) / len(recalls) if recalls else 0.0
    macro_f1 = sum(f1s) / len(f1s) if f1s else 0.0

    print(f"Macro Precision:        {macro_p*100:.2f}%")
    print(f"Macro Recall:           {macro_r*100:.2f}%")
    print(f"Macro F1 Score:         {macro_f1*100:.2f}%")
    print("==================================================")

if __name__ == "__main__":
    evaluate("data/ai/workflow-router/model.json", "data/ai/workflow-router/routing-test.csv")
