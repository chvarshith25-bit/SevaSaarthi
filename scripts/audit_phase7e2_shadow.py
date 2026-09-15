import json
import csv
import os
import math

def run_audit():
    print("========================================================")
    print("   PHASE 7E.2.1: SHADOW EVALUATION METHODOLOGY AUDIT   ")
    print("========================================================\n")

    with open('data/synthetic/master_citizens.json', 'r', encoding='utf-8') as f:
        citizens = json.load(f)

    with open('data/synthetic/all_registries.json', 'r', encoding='utf-8') as f:
        regs = json.load(f)

    # Build mapping from candidate_id -> citizen_id
    cand_to_citizen = {}
    for reg_name, rows in regs.items():
        if reg_name in ('citizens', 'ground_truth'):
            continue
        for r in rows:
            cid = r.get('citizen_id')
            ref = r.get('id') or r.get('income_certificate_number') or r.get('scholarship_id') or r.get('land_reference') or r.get('health_scheme_id') or r.get('housing_scheme_id') or r.get('survey_number') or r.get('pan_reference')
            if ref and cid:
                cand_to_citizen[str(ref)] = cid

    with open('scripts/model2_shadow_test_requests.json', 'r', encoding='utf-8') as f:
        requests = json.load(f)

    # Run dual evaluation using node runner or direct shadow evaluator
    # Let's read the shadow log results or evaluate directly
    # We will write a TypeScript helper to produce full resolution objects for the 180 requests
    print("Loaded candidate-to-citizen lookup with", len(cand_to_citizen), "entries.")
    print("Loaded", len(requests), "original shadow requests.\n")

if __name__ == '__main__':
    run_audit()
