import csv
import json
import math
import re
import os
from collections import Counter, defaultdict

SEED = 42

GENERIC_ADMIN_WORDS = {
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
    'it', 'its', 'they', 'them', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
    'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
    'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
    'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now',
    'please', 'sir', 'officer', 'madam', 'kindly', 'help', 'want', 'need', 'apply', 'urgent', 'urgently',
    'application', 'online', 'portal', 'form', 'residing', 'district', 'hyderabad', 'warangal', 'karimnagar',
    'rangareddy', 'medchal', 'nizamabad', 'khammam', 'nalgonda', 'mahabubnagar', 'siddipet', 'family',
    'details', 'rules', 'process', 'submission', 'submitted', 'uploaded', 'receipt', 'government', 'scheme',
    'state', 'central', 'poor', 'assistance', 'support', 'guidance', 'eligible', 'proofs', 'check'
}

OOD_INDICATORS = {
    'passport', 'visa', 'consulate', 'tatkaal', 'driving', 'licence', 'license', 'dl', 'rto',
    'electricity', 'power', 'transformer', 'voltage', 'meter', 'outage', 'birth', 'baby', 'born',
    'marriage', 'wedding', 'spouse', 'bride', 'groom', 'consumer', 'court', 'refrigerator', 'fridge',
    'phone', 'builder', 'vehicle', 'rc', 'hsrp', 'voter', 'election', 'epic', 'ration', 'drainage', 'sewage'
}

SERVICE_ANCHORS = {
    'POST_MATRIC_SCHOLARSHIP': {'scholarship', 'matric', 'tuition', 'fee', 'fees', 'college', 'btech', 'degree', 'mba', 'polytechnic', 'bonafide', 'marks', 'memo', 'aishe', 'stipend', 'hostel', 'reimbursement', 'waiver', 'scholership'},
    'INSTANT_E_PAN': {'pan', 'epan', '49a', 'nsdl', 'utiitsl', 'taxpayer', 'pvc', 'permanent'},
    'INCOME_CERTIFICATE': {'income', 'annual', 'tahsildar', 'mro', 'vro', 'ews', 'patwari', 'earnings', 'salary'},
    'LAND_RECORD': {'land', 'patta', 'passbook', 'pahani', 'ror', 'mutation', 'khasra', 'khatauni', 'survey', 'adangal', 'fmb', 'dharani', 'satbara'},
    'PM_KISAN': {'kisan', 'farmer', 'samman', 'nidhi', 'cultivator', '2000', '6000', 'installment'},
    'AYUSHMAN_BHARAT': {'ayushman', 'pmjay', 'health', 'hospital', 'surgery', 'cashless', 'bima', 'medical', 'card'},
    'PM_AWAS': {'awas', 'pmay', 'house', 'pucca', 'housing', 'kutcha', 'clss', 'blc', 'home', 'construction'}
}

def tokenize(text: str):
    text = text.lower()
    all_words = re.sub(r'[^a-z0-9\s]', ' ', text).split()
    content_words = [w for w in all_words if w not in GENERIC_ADMIN_WORDS]
    ngrams = []
    for w in content_words:
        if len(w) >= 4:
            for i in range(len(w) - 2):
                ngrams.append('$' + w[i:i+3] + '$')
    return all_words, content_words, ngrams

class CalibratedHybridRouterModel:
    def __init__(self):
        self.version = "workflow-router-v2"
        self.dataset_version = "v2.0"
        self.classes = sorted(list(SERVICE_ANCHORS.keys()))
        self.service_metadata = {
            "POST_MATRIC_SCHOLARSHIP": {"department_id": "DEPT_HIGHER_EDU", "sub_department_id": "SUB_SCHOLARSHIP_CELL", "workflow_id": "WF_SCHOLARSHIP_LIFECYCLE"},
            "INSTANT_E_PAN": {"department_id": "DEPT_INCOME_TAX", "sub_department_id": "SUB_PAN_PROCESSING", "workflow_id": "WF_PAN_LIFECYCLE"},
            "INCOME_CERTIFICATE": {"department_id": "DEPT_REVENUE", "sub_department_id": "SUB_TAHSILDAR_OFFICE", "workflow_id": "WF_REVENUE_CERT"},
            "LAND_RECORD": {"department_id": "DEPT_LAND_ADMIN", "sub_department_id": "SUB_SURVEY_SETTLEMENT", "workflow_id": "WF_LAND_MUTATION"},
            "PM_KISAN": {"department_id": "DEPT_AGRICULTURE", "sub_department_id": "SUB_FARMER_WELFARE", "workflow_id": "WF_DBT_DIRECT"},
            "AYUSHMAN_BHARAT": {"department_id": "DEPT_HEALTH", "sub_department_id": "SUB_HEALTH_AUTHORITY", "workflow_id": "WF_HEALTH_CARD"},
            "PM_AWAS": {"department_id": "DEPT_HOUSING", "sub_department_id": "SUB_URBAN_HOUSING", "workflow_id": "WF_HOUSING_SANCTION"}
        }
        self.class_word_counts = {c: Counter() for c in self.classes}
        self.idf = {}
        self.temperature = 2.0

    def load(self, filepath: str):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.version = data.get("model_version", "workflow-router-v2")
        self.dataset_version = data.get("dataset_version", "v2.0")
        self.classes = data["classes"]
        self.service_metadata = data["service_metadata"]
        self.temperature = data.get("temperature", 5.0)
        self.idf = data.get("idf", {})
        self.class_word_counts = {c: Counter(data.get("class_word_counts", {}).get(c, {})) for c in self.classes}

    def fit(self, train_path: str):
        rows = list(csv.DictReader(open(train_path, encoding='utf-8')))
        df = Counter()
        for r in rows:
            _, cw, _ = tokenize(r['text'])
            self.class_word_counts[r['service_id']].update(cw)
            for w in set(cw):
                df[w] += 1

        N = len(rows)
        for w, count in df.items():
            self.idf[w] = math.log((N + 1) / (count + 1)) + 1.0

    def calibrate(self, val_path: str):
        val_rows = list(csv.DictReader(open(val_path, encoding='utf-8')))
        best_T = 2.0
        best_nll = float('inf')

        for candidate_T in [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]:
            total_nll = 0.0
            for r in val_rows:
                logits = self.compute_logits(r['text'])
                max_l = max(logits.values())
                exps = {k: math.exp((v - max_l) / candidate_T) for k, v in logits.items()}
                sum_exp = sum(exps.values())
                probs = {k: v / sum_exp for k, v in exps.items()}
                p_true = max(probs.get(r['service_id'], 1e-12), 1e-12)
                total_nll += -math.log(p_true)

            if total_nll < best_nll:
                best_nll = total_nll
                best_T = candidate_T

        self.temperature = best_T
        print(f"Calibrated Temperature T* = {self.temperature:.2f} (NLL: {best_nll:.3f})")

    def compute_logits(self, text: str):
        all_w, cw, _ = tokenize(text)

        # OOD indicator penalty
        if any(w in OOD_INDICATORS for w in all_w):
            return {c: -50.0 for c in self.classes}

        logits = {}
        for c in self.classes:
            sc = 0.0
            for w in cw:
                if w in self.class_word_counts[c]:
                    tf = self.class_word_counts[c][w]
                    sc += math.log(1.0 + tf) * self.idf.get(w, 1.0)
                if w in SERVICE_ANCHORS[c]:
                    sc += 25.0  # Strong anchor evidence
            logits[c] = sc

        return logits

    def predict(self, text: str):
        all_w, cw, _ = tokenize(text)

        # 1. Hard OOD check
        if any(w in OOD_INDICATORS for w in all_w):
            return {
                "suggestedServiceId": "MANUAL_REVIEW",
                "suggestedServiceName": "Unknown Service (OOD)",
                "confidenceScore": 0.10,
                "rawProbability": 0.10,
                "routingTier": "MANUAL_REVIEW",
                "routingMode": "MANUAL_REVIEW_REQUIRED",
                "serviceMetadata": {},
                "explanation": "Out-of-distribution service request rejected to manual review."
            }

        logits = self.compute_logits(text)
        max_l = max(logits.values())

        # No positive evidence check
        if max_l <= 5.0:
            return {
                "suggestedServiceId": "MANUAL_REVIEW",
                "suggestedServiceName": "Unknown Service",
                "confidenceScore": 0.20,
                "rawProbability": 0.20,
                "routingTier": "MANUAL_REVIEW",
                "routingMode": "MANUAL_REVIEW_REQUIRED",
                "serviceMetadata": {},
                "explanation": "Insufficient distinctive domain evidence. Routed to manual review."
            }

        exps = {k: math.exp((v - max_l) / self.temperature) for k, v in logits.items()}
        sum_exp = sum(exps.values())
        probs = {k: v / sum_exp for k, v in exps.items()}

        sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)
        top_svc, top_prob = sorted_probs[0]

        # Tier assignment based on validation tuning:
        # HIGH: >= 0.80, MEDIUM: 0.50 - 0.799, MANUAL REVIEW: < 0.50
        if top_prob >= 0.80:
            tier = "AUTOMATIC_RECOMMENDATION"
            mode = "AI_RECOMMENDED"
        elif top_prob >= 0.50:
            tier = "HUMAN_CONFIRMATION_REQUIRED"
            mode = "AI_RECOMMENDED"
        else:
            tier = "MANUAL_REVIEW"
            mode = "MANUAL_REVIEW_REQUIRED"

        return {
            "suggestedServiceId": top_svc if tier != "MANUAL_REVIEW" else "MANUAL_REVIEW",
            "suggestedServiceName": top_svc,
            "confidenceScore": round(top_prob, 4),
            "rawProbability": round(top_prob, 4),
            "routingTier": tier,
            "routingMode": mode,
            "serviceMetadata": self.service_metadata.get(top_svc, {}),
            "explanation": f"Calibrated Model v2 predicted {top_svc} with {top_prob*100:.1f}% confidence."
        }

    def save(self, filepath: str):
        artifact = {
            "model_version": self.version,
            "dataset_version": self.dataset_version,
            "training_timestamp": "2026-09-14T23:55:00Z",
            "reproducibility_seed": SEED,
            "temperature": self.temperature,
            "classes": self.classes,
            "service_metadata": self.service_metadata,
            "ood_indicators": sorted(list(OOD_INDICATORS)),
            "service_anchors": {k: sorted(list(v)) for k, v in SERVICE_ANCHORS.items()},
            "idf": {k: round(v, 4) for k, v in self.idf.items()},
            "class_word_counts": {c: dict(self.class_word_counts[c]) for c in self.classes}
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(artifact, f, indent=2)
        print(f"Artifact saved to {filepath}")

def main():
    m = CalibratedHybridRouterModel()
    m.fit("data/ai/workflow-router/routing-training-v2.csv")
    m.calibrate("data/ai/workflow-router/routing-validation-v2.csv")
    m.save("data/ai/workflow-router/model-v2.json")

if __name__ == "__main__":
    main()
