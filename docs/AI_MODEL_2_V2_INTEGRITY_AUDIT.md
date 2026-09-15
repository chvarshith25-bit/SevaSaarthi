# AI MODEL 2 V2 INTEGRITY, LEAKAGE & CALIBRATION AUDIT REPORT

**Phase**: 7E.1 — Model 2 V2 Independent Integrity Audit  
**Audited Target**: Entity Resolution Model 2 V2 (`entity-resolver-v2`)  
**Auditor**: Antigravity Core Verification & Safety Agent  
**Date**: September 2026  
**Final Audit Assessment**: **VERIFIED WITH ISSUES — FIX REQUIRED BEFORE SHADOW**

---

## 1. Executive Summary

In accordance with Phase 7E.1 requirements, an exhaustive, independent integrity, leakage, calibration, and safety audit was performed on AI Model 2 V2 across its training data, feature pipeline, graph corroborator, calibration parameters, decision thresholds, and runtime safety constraints.

### Audit Verdict Summary:
- **Dataset Partitioning**: **PASSED (Zero ID Leakage)**. 150 synthetic master citizens partitioned strictly into 70% Train (105 IDs), 15% Validation (22 IDs), and 15% Test (23 IDs). Zero citizen ID overlap across splits.
- **Demographic Feature Leakage**: **PASSED**. All 10 demographic/lexical/semantic features are derived exclusively from caller query and candidate records without oracle labels.
- **Graph Corroboration Pipeline**: **FLAGGED (Training Proxy Issue)**. Live inference (`CrossRegistryGraphCorroborator`) is leak-free and builds anchor edges dynamically. However, offline training assigned `graph_corrob = len(reg_records)` (count of true ground-truth links) to positive pairs and `1.0` to negatives, giving the model an offline label proxy that inflated the `graph_corroboration` weight to `+4.4211`.
- **Calibration Integrity**: **PASSED**. Temperature $T=0.20$ was learned strictly on the validation split. ECE ($0.0018$) and Brier score ($0.0011$) were evaluated on the untouched held-out test split.
- **Collision Safety**: **PASSED (100% Defense)**. 92/92 hard homonym collision pairs (identical names with conflicting DOB/Father/District) were safely capped at $\le 0.25$ and flagged as `AMBIGUOUS`.
- **Reproducibility**: **PASSED (100% Deterministic)**. Two consecutive evaluation runs yielded identical metrics (0.0000 delta).
- **DPDP & Production Safety**: **PASSED**. Unconsented queries are strictly blocked, allowed registries are enforced, and Model 2 V1 remains the default production router.

---

## 2. Dataset Leakage Audit

| Split | Sample Count | Master Citizen IDs | Citizen ID Overlap with Test | Candidate ID Overlap with Test | Exact Pair Overlap with Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Train Split** | 1,762 | 105 (70%) | **0 (0.0%)** | **0 (0.0%)** | 4* |
| **Validation Split** | 380 | 22 (15%) | **0 (0.0%)** | **0 (0.0%)** | **0 (0.0%)** |
| **Test Split** | 380 | 23 (15%) | — | — | — |

\* *Note on 4 Exact Overlaps*: The 4 overlapping query-candidate string pairs were generated from distinct citizen IDs (`CIT-00069` vs `CIT-00009`, `CIT-00096` vs `CIT-00036`, etc.) in cases where `dob` was stripped under `VARIATION_MISSING_DOB`. Because the synthetic generator reused standard template names ("Karthik Patel", "Sunita Kumar"), removing DOB caused the residual strings to coincide. Master citizen IDs and candidate IDs were strictly distinct.

---

## 3. Feature Leakage Audit (11 Features)

| Feature Name | Computation Source | Available at Inference? | Uses Ground Truth? | Reveals Citizen ID? | Uses Future Info? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name_sim` | Levenshtein + Jaro-Winkler on `query.name` vs `cand.name` | **YES** | **NO** | **NO** | **NO** |
| `initials_compat` | Initial-to-full name expansion heuristic | **YES** | **NO** | **NO** | **NO** |
| `dob_sim` | Date component match ($1.0$ exact, $0.5$ neutral, $0.0$ conflict) | **YES** | **NO** | **NO** | **NO** |
| `father_sim` | Jaro-Winkler on `query.father` vs `cand.father` | **YES** | **NO** | **NO** | **NO** |
| `address_sim` | Jaccard token + Jaro-Winkler address overlap | **YES** | **NO** | **NO** | **NO** |
| `district_sim` | Normalized district string match | **YES** | **NO** | **NO** | **NO** |
| `pincode_sim` | Exact match ($1.0$), 3-digit zone ($0.6$), mismatch ($0.0$) | **YES** | **NO** | **NO** | **NO** |
| `ngram_cosine` | Subword 3/4-gram TF-IDF cosine similarity | **YES** | **NO** | **NO** | **NO** |
| `agreeing_count` | Proportion of fields with similarity $\ge 0.70$ | **YES** | **NO** | **NO** | **NO** |
| `conflicting_count`| Proportion of fields with contradiction $\le 0.20$ | **YES** | **NO** | **NO** | **NO** |
| `graph_corroboration`| Cross-registry anchor node bonus | **YES** | **FLAGGED (In Training Only)** | **NO** | **NO** |

---

## 4. Graph Corroboration Audit (Critical Finding)

1. **Production Engine (`CrossRegistryGraphCorroborator`)**:
   - The runtime engine in `src/lib/server/ai/entity-resolution/graph/graph-corroborator.ts` is legitimate, privacy-preserving, and leak-free.
   - It identifies anchor candidates within the caller query batch (`confidenceTier === 'HIGH'`, `score >= 0.85`, `DOB/Father >= 0.85`, no collision) and awards a small bonus ($+0.04$ to $+0.06$) to candidate records in other registries matching name and district.
2. **Training-Time Discrepancy (`build_phase7e.py`)**:
   - During offline dataset construction, positive pairs were assigned `graph_corrob = len(reg_records)` (the total number of true registry records for that citizen in the synthetic DB), yielding `corrob = min(1.0, count/3.0) \approx 1.0`.
   - Negative pairs were assigned `graph_corrob = 1.0`, yielding `corrob = min(1.0, 1.0/3.0) = 0.333`.
   - **Impact**: The model learned a massive weight `w[10] = +4.4211` on this feature. In real single-record inference where cross-registry graph bonus is $0$ or small, this difference artificially suppresses the unassisted logit.
   - **Remediation**: Before running shadow mode or promotion, the offline training dataset must be updated to use simulated batch graph bonuses ($[0, 0.06]$) rather than `len(reg_records)`.

---

## 5. Calibration & Threshold Audit

Evaluated on the untouched held-out test split ($N=380$):

| Metric | Measured Value | Standard Required | Status |
| :--- | :--- | :--- | :--- |
| **Calibration Temperature ($T$)** | $0.20$ | Fitted on Validation Set Only | **PASSED** |
| **Expected Calibration Error (ECE)** | **$0.0018$** | $< 0.0300$ (Well-Calibrated) | **PASSED** |
| **Brier Score** | **$0.0011$** | $< 0.0500$ (High Reliability) | **PASSED** |
| **Log Loss** | **$0.0028$** | Lower is better | **PASSED** |

### Test Split Decision Tier Breakdown:
- **`HIGH` Confidence ($\ge 0.85$, 0 conflicts)**: 196 candidates (51.58%)
- **`MEDIUM` Confidence ($\ge 0.60$)**: 1 candidate (0.26%)
- **`AMBIGUOUS` (Escalated to Officer Review)**: 95 candidates (25.00%)
- **`LOW` Confidence / `NO_MATCH` ($< 0.35$)**: 88 candidates (23.16%)

---

## 6. Homonym Collision Defense Audit

Tested against 92 hard-negative synthetic collision pairs (e.g. "Ravi Kumar" in Adilabad vs "Ravi Kumar" in Nizamabad with conflicting DOB/Father/District):
- **Collision Detection Rate**: **100.0% (92 / 92)**
- **False Match Count on Collisions**: **0 (0.0%)**
- **Forced Match Rate**: **0.0%**
- **Guardrail Action**: All 92 colliding candidates were capped at $\le 0.25$ and routed to `AMBIGUOUS` / mandatory officer review.

---

## 7. Reproducibility Audit

The full evaluation pipeline was run twice under identical seed conditions (`seed=42`):
- **Accuracy Run 1 vs Run 2**: $99.74\% \to 99.74\%$ ($\Delta = 0.0000$)
- **Precision Run 1 vs Run 2**: $99.49\% \to 99.49\%$ ($\Delta = 0.0000$)
- **Recall Run 1 vs Run 2**: $100.0\% \to 100.0\%$ ($\Delta = 0.0000$)
- **ECE Run 1 vs Run 2**: $0.0018 \to 0.0018$ ($\Delta = 0.0000$)
- **Brier Score Run 1 vs Run 2**: $0.0011 \to 0.0011$ ($\Delta = 0.0000$)

---

## 8. Production Safety & DPDP Compliance

1. **Consent Gate**: Unconsented queries (`consentVerified === false`) immediately abort with `DPDP Statutory Consent Violation`.
2. **Registry Containment**: Only caller-authorized registries (`allowedRegistries`) are queried.
3. **Statutory Adjudication Invariant**: Model 2 V2 output is strictly an advisory candidate ranking. No legal identity merge or application status transition is performed by AI.
4. **Zero-Downtime Rollback**: Model 2 V1 deterministic engine is active as the default production resolver.

---

## 9. Final Assessment & Required Remediation

### Final Verdict: **B. VERIFIED WITH ISSUES — FIX REQUIRED BEFORE SHADOW**

### Exact Remediation Required:
1. **Graph Feature Retraining**: Update `scripts/build_dataset_model2.py` / `build_phase7e.py` to compute `graph_corroboration` by passing candidate batches through `CrossRegistryGraphCorroborator` rather than using ground-truth `len(reg_records)`.
2. **Re-fit Model 2 V2 Weights**: Re-train logistic weights and re-calibrate temperature $T$ with the realistic graph feature.
3. **Re-verify Held-Out Test Set**: Confirm that test accuracy, precision, recall, ECE, and Brier score remain $\ge 95\%$ without the training proxy.
4. **Preserve Production Default**: Keep Model 2 V1 active until the remediation and shadow evaluation are complete.
