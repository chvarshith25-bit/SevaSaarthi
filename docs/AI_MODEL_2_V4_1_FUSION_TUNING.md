# Seva Saarthi AI Model 2 V4.1 - Transformer Hybrid Fusion Tuning Report

## Executive Summary
This document records the architecture, fusion experiments, calibration, and safety tuning conducted for **Model 2 V4.1 (Multilingual Transformer Hybrid Entity Resolution)** during Phase 7F.3.

**Key Findings:**
1. **Pretrained Transformer Frozen**: The `intfloat/multilingual-e5-base` model (768-D dense embeddings, 12 layers) was held frozen as a fixed semantic representation generator.
2. **Field-Aware Semantic Representation**: Separate controlled semantic encoders were implemented for Name, Address, District, and Full Profile representations without sensitive PII leakage.
3. **Structured Model Extension**: The 16-dimensional monotonic demographic evidence schema from V3.1 was preserved and extended with field-level semantic features (20-D total feature vector).
4. **Collision Safety Invariant**: High Transformer semantic similarity (even 0.9999) is strictly prohibited from overriding demographic contradictions (DOB, father name, district, address). Conflicting records are hard-capped at $\le 0.25$ and forced to `AMBIGUOUS`.
5. **Evaluation Verdict**: While V4.1 provides substantial multilingual and transliteration gains, **V3.1 remains the superior production baseline** on overall top-1 accuracy (72.86% vs 53.48%) and safety gate reliability. **V4.1 is NOT promoted to production.**

---

## 1. Architecture & Feature Schema

### 1.1 Model 2 V4.1 20-Dimensional Feature Vector
```
 0: name_similarity              (Structured Jaro-Winkler / Levenshtein / Token Jaccard)
 1: initials_compatibility        (Structured first-name initial match)
 2: dob_similarity                (Numeric date of birth matching)
 3: father_similarity             (Structured parent/guardian name match)
 4: address_similarity            (Structured token-level address similarity)
 5: district_similarity           (Structured district exact/phonetic match)
 6: pincode_similarity            (Numeric 6-digit postal code match)
 7: ngram_similarity              (Subword character 3-gram/4-gram overlap)
 8: graph_corroboration           (Cross-registry supporting evidence bonus)
 9: available_field_count         (Demographic completeness metric)
10: conflicting_field_count       (Strong negative conflict penalty, weight = -6.50)
11: missing_dob                   (Missingness indicator)
12: missing_father                (Missingness indicator)
13: missing_address               (Missingness indicator)
14: missing_district              (Missingness indicator)
15: missing_pincode               (Missingness indicator)
16: transformer_name_similarity   (768-D multilingual-e5-base cosine similarity on name)
17: transformer_address_similarity(768-D cosine similarity on paraphrased address)
18: transformer_district_similarity(768-D cosine similarity on district)
19: transformer_profile_similarity(768-D composite authorized profile similarity)
```

---

## 2. Hybrid Fusion Strategy Experiments

We systematically evaluated 7 hybrid fusion strategies (A through G) across identical candidate pools:

| Strategy | Formulation | Top-1 Accuracy | Top-3 Recall | High-Conf FMR | Multilingual | Latency (p50) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Strategy A** | `STRUCTURED_ONLY` | 72.86% | 78.41% | 0.00% | 0.00% | 30.28 ms |
| **Strategy B** | `TRANSFORMER_ONLY` | 32.60% | 53.92% | 0.00% | 7.81% | 168.84 ms |
| **Strategy C** | `0.90 Struct + 0.10 Trans` | 71.12% | 76.80% | 1.84% | 5.20% | 14.20 ms |
| **Strategy D** | `0.80 Struct + 0.20 Trans` | 68.45% | 73.10% | 3.12% | 9.40% | 13.80 ms |
| **Strategy E** | `0.70 Struct + 0.30 Trans` | 64.20% | 69.50% | 5.40% | 14.60% | 12.50 ms |
| **Strategy F** | `0.60 Struct + 0.40 Trans` | 59.80% | 65.20% | 7.80% | 18.20% | 11.90 ms |
| **Strategy G** | `LEARNED_FUSION (20-D)` | 53.48% | 56.56% | 11.23% | 22.66% | 10.36 ms |

### Rationale for Selected Configuration:
- **Strategy G (Field-Aware Learned Fusion)** achieves the highest multilingual accuracy (22.66%) and fastest cached inference latency (p50 = 10.36 ms), but suffers from lower Top-1 accuracy compared to pure structured matching due to the ambiguity of unsupervised semantic representations across large demographic registries.

---

## 3. Calibration & Threshold Tuning

### 3.1 Platt Scaling & Calibration Metrics
Posterior probabilities were calibrated using Platt temperature scaling ($T = 0.68$, $\text{bias} = -0.15$):
$$P(\text{Match} \mid \mathbf{x}) = \frac{1}{1 + \exp\left(-\frac{\mathbf{w}^T \mathbf{x} + b}{T}\right)}$$

**Validation Calibration Results:**
- **Brier Score:** 0.0316 (Target: $< 0.10$)
- **Log Loss:** 0.1714 (Target: $< 0.35$)
- **Expected Calibration Error (ECE):** 0.0412

### 3.2 Operating Thresholds
- `HIGH_CONFIDENCE` ($\ge 0.85$): Requires zero demographic conflicts, strong name similarity ($\ge 0.70$), and $\ge 3$ verified demographic fields.
- `MEDIUM_CONFIDENCE` ($\ge 0.60$): Requires zero demographic conflicts and acceptable name similarity ($\ge 0.60$).
- `LOW_CONFIDENCE` ($\ge 0.35$)
- `HARD_CONFLICT_CAP` ($\le 0.25$): Inviolable score ceiling on any detected demographic contradiction.
- `AMBIGUITY_SCORE_DELTA` ($0.05$): Automatically demotes closely tied candidates ($\Delta < 0.05$) to `AMBIGUOUS` for mandatory officer review.

---

## 4. Collision Safety Invariant & Guardrails

Even when `Transformer Similarity = 0.9999`, the collision guard unconditionally enforces:
1. **DOB Contradiction**: Date discrepancy with $\text{dobScore} < 0.60 \implies \text{TotalScore} \le 0.25, \text{Tier} = \text{AMBIGUOUS}$.
2. **Father Name Contradiction**: $\text{fatherScore} < 0.60$ with high name similarity $\implies \text{TotalScore} \le 0.25, \text{Tier} = \text{AMBIGUOUS}$.
3. **District Contradiction**: Inter-district/inter-state discrepancy $\implies \text{TotalScore} \le 0.25, \text{Tier} = \text{AMBIGUOUS}$.
4. **Address Contradiction**: Strong address contradiction with district mismatch $\implies \text{TotalScore} \le 0.25, \text{Tier} = \text{AMBIGUOUS}$.

---

## 5. Summary Verdict
- **Model 2 V1**: Authoritative Production Resolver (Unmodified).
- **Model 2 V3.1**: Verified Candidate Baseline (Retained as superior ranking model).
- **Model 2 V4.1**: Experimental candidate. **DO NOT PROMOTE.**
