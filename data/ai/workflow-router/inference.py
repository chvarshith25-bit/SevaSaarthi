import json
import sys
from train import WorkflowRouterModel

def run_inference(query: str):
    with open("data/ai/workflow-router/model.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    router = WorkflowRouterModel()
    router.classes = data["classes"]
    router.service_metadata = data["service_metadata"]
    router.total_docs = data["total_docs"]

    svc, conf, meta = router.predict(query)
    result = {
        "query": query,
        "suggested_service_id": svc,
        "confidence_score": conf,
        "department_id": meta.get("department_id"),
        "sub_department_id": meta.get("sub_department_id"),
        "workflow_id": meta.get("workflow_id"),
        "model_version": "workflow-router-v1"
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    q = sys.argv[1] if len(sys.argv) > 1 else "I want to apply for BTech engineering college scholarship"
    run_inference(q)
