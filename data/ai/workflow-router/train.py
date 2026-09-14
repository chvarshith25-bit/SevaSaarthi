import csv
import json
import math
import re
from collections import Counter
from typing import Dict, List, Tuple

STOP_WORDS = {
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

def tokenize(text: str) -> List[str]:
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    tokens = [t for t in text.split() if len(t) > 1 and t not in STOP_WORDS]
    # add character n-grams for typo resilience
    ngrams = []
    for token in tokens:
        if len(token) >= 4:
            for i in range(len(token) - 2):
                ngrams.append(token[i:i+3])
    return tokens + ngrams

class WorkflowRouterModel:
    def __init__(self):
        self.classes: Dict[str, Dict[str, float]] = {}
        self.service_metadata: Dict[str, Dict[str, str]] = {}
        self.doc_counts: Dict[str, int] = {}
        self.total_docs = 0

    def fit(self, training_path: str):
        class_token_counts: Dict[str, Counter] = {}
        doc_frequency: Counter = Counter()

        with open(training_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                svc = row['service_id']
                dept = row['department_id']
                sub_dept = row['sub_department_id']
                wf = row['workflow_id']
                text = row['text']

                if svc not in class_token_counts:
                    class_token_counts[svc] = Counter()
                    self.service_metadata[svc] = {
                        "department_id": dept,
                        "sub_department_id": sub_dept,
                        "workflow_id": wf
                    }

                tokens = tokenize(text)
                class_token_counts[svc].update(tokens)
                for t in set(tokens):
                    doc_frequency[t] += 1
                self.total_docs += 1

        # TF-IDF vectorization per service
        for svc, counter in class_token_counts.items():
            self.classes[svc] = {}
            total_tokens = sum(counter.values())
            for token, count in counter.items():
                tf = count / total_tokens
                idf = math.log((self.total_docs + 1) / (doc_frequency[token] + 1)) + 1
                self.classes[svc][token] = tf * idf

    def predict(self, text: str) -> Tuple[str, float, Dict[str, str]]:
        tokens = tokenize(text)
        if not tokens:
            return "MANUAL_REVIEW", 0.0, {}

        input_counts = Counter(tokens)
        input_norm = math.sqrt(sum(c * c for c in input_counts.values()))
        if input_norm == 0:
            return "MANUAL_REVIEW", 0.0, {}

        scores: Dict[str, float] = {}
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
            return "MANUAL_REVIEW", 0.0, {}

        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_svc, top_score = sorted_scores[0]
        
        # Scaled cosine similarity score [0.0, 1.0] (representation of semantic alignment, not posterior probability)
        scaled_score = min(1.0, max(0.0, top_score * 1.85))

        # Consistent statutory threshold: < 0.60 triggers MANUAL_REVIEW
        if scaled_score < 0.60:
            return "MANUAL_REVIEW", round(scaled_score, 3), {}

        return top_svc, round(scaled_score, 3), self.service_metadata.get(top_svc, {})

    def save(self, output_path: str):
        data = {
            "version": "workflow-router-v1",
            "total_docs": self.total_docs,
            "classes": self.classes,
            "service_metadata": self.service_metadata
        }
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

if __name__ == "__main__":
    router = WorkflowRouterModel()
    router.fit("data/ai/workflow-router/routing-training.csv")
    router.save("data/ai/workflow-router/model.json")
    print(f"Successfully trained Model 1 on {router.total_docs} examples across {len(router.classes)} services.")
