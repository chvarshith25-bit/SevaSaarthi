# AI Model 2 V4: Hybrid Transformer Entity Resolution Architecture

**Project:** Seva Saarthi — Government Interoperability & AI-Assisted Entity Resolution  
**Module:** `src/lib/server/ai/entity-resolution/v4-transformer/`  
**Model Version:** `v4.0.0-experimental`  
**Governance Status:** `EXPERIMENTAL` (Production: `DISABLED`)  
**Authoritative Production Resolver:** Model 2 V1  
**Current Production Candidate Baseline:** Model 2 V3.1  

---

## 1. Executive Summary & Objective

Model 2 V4 is an experimental hybrid entity resolution system combining:
1. **Calibrated Structured Demographic Evidence:** Name, date of birth, father/guardian name, full address, district, and pincode matching.
2. **Real Multilingual Transformer Semantic Embeddings:** Pretrained `intfloat/multilingual-e5-base` (768 dimensions, 12 layers) based on XLM-RoBERTa.
3. **Identity-Level Candidate Consolidation:** Multi-registry cluster merging by `master_citizen_id` (Phase 7E.6.1).
4. **Demographic Collision & Safety Guardrails:** Hard collision penalty preventing homonym false matches.
5. **Calibrated Confidence:** Platt temperature scaling ($T = 0.68$) mapping composite logits to posterior probabilities.
6. **Statutory Human-in-the-Loop Governance:** Gated by DPDP Act citizen consent verification; all outputs are advisory evidence for authorized government officers.

---

## 2. Target Architecture Pipeline

```text
                  Citizen Query
                        │
                        ▼
            Consent Verification Gate (DPDP Act)
                        │
                        ▼
       Authorized Registry Retrieval (Top-N: 10 / 25 / 50)
                        │
                        ▼
   ┌────────────────────────────────────────────────────────┐
   │                                                        │
   │   Structured Entity Evidence                           │
   │   - Jaro-Winkler Name Similarity & Initials            │
   │   - Date of Birth Consistency & Transposition          │
   │   - Father / Guardian Compatibility                    │
   │   - Address Token Jaccard & Substring Containment      │
   │   - District Jaro-Winkler Matching                     │
   │   - Pincode Delivery Area Hierarchy                    │
   │   - Missingness Indicators                             │
   │   - Demographic Conflict Penalty (Strictly Negative)   │
   │                                                        │
   │                           +                            │
   │                                                        │
   │   Transformer Semantic Encoder                         │
   │   - intfloat/multilingual-e5-base                      │
   │   - 768-dimensional dense unit-normalized vectors       │
   │   - "query: " and "passage: " e5 prefix conventions    │
   │   - Cross-lingual semantic alignment (En, Hi, Te)      │
   │                                                        │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
               Hybrid Monotonic Logit Fusion
                               │
                               ▼
       Identity-Level Consolidation (master_citizen_id)
                               │
                               ▼
            Collision Safety & Conflict Demotion
         (Score capped <= 0.25 on any contradiction)
                               │
                               ▼
         Calibrated Confidence (Platt Scaling, T=0.68)
                               │
                               ▼
           HIGH / MEDIUM / LOW / AMBIGUOUS Tiers
                               │
                               ▼
            Government Officer Verification
```

---

## 3. Transformer Model Specifications

| Parameter | Specification |
| :--- | :--- |
| **Model Identifier** | `intfloat/multilingual-e5-base` |
| **Model Source** | Hugging Face Official Repository |
| **Base Architecture** | XLM-RoBERTa (multilingual masked language model) |
| **Transformer Layers** | 12 Transformer encoder blocks |
| **Hidden Dimension** | 768 float32 dimensions |
| **Attention Heads** | 12 multi-head self-attention mechanisms |
| **Max Sequence Length** | 512 tokens |
| **Prefix Standard** | `query: ` (for input queries) / `passage: ` (for registry records) |
| **Training Regime** | Zero-shot pretrained multilingual semantic encoder (no in-domain fine-tuning initially) |
| **Language Support** | 100+ languages including English, Hindi, Telugu, and Romanized/transliterated variations |

---

## 4. Controlled Semantic Input Representations

To protect citizen privacy and uphold DPDP statutory field minimization, raw database rows are never passed blindly to the embedding encoder.

### A. Query Semantic Representation
```text
query: name: Ravi Kumar | father: Suresh Kumar | address: Kukatpally | district: Hyderabad | pincode: 500072
```

### B. Registry Passage Representation
```text
passage: name: Ravi Kumar | father: Suresh Kumar | address: Flat 402, Kukatpally Main Rd | district: Hyderabad | pincode: 500072
```

### C. Field Minimization & Sensitive Identifier Stripping
The following fields are strictly stripped prior to embedding and cache hashing:
- Raw Aadhaar numbers / UIDAI references
- PAN numbers / Income tax identifiers
- Bank account numbers and IFSC codes
- Authentication secrets and internal database keys

---

## 5. Safe Embedding Cache Architecture

Static registry records are frequently evaluated across multiple citizen applications. To optimize latency while maintaining zero PII leakage:
- **Cache Key:** `SHA-256(model_version + "::" + normalized_semantic_text)`
- **Eviction Policy:** In-memory LRU with configurable capacity (default 10,000 entries).
- **Safety Audit:** Built-in regex guards reject caching if raw 12-digit Aadhaar, 10-char PAN, or authentication secrets are detected.
- **Invalidation:** Targeted invalidation by record key, registry table (`invalidateByRegistry`), or complete flush (`clear()`).

---

## 6. Monotonic Hybrid Scoring & Calibration

The V4 engine combines a 16-dimensional feature vector into a calibrated posterior probability:

$$z = b + \sum_{i=1}^{16} w_i \cdot x_i$$

$$P(\text{Match} \mid x) = \sigma\left(\frac{z}{T}\right) = \frac{1}{1 + e^{-z / T}}$$

### Feature Weights and Hyperparameters ($T = 0.68$, $b = -0.12$)
1. `name_similarity`: $+0.22$
2. `initials_compatibility`: $+1.25$
3. `dob_similarity`: $+0.20$
4. `father_similarity`: $+0.20$
5. `address_similarity`: $+0.20$
6. `district_similarity`: $+0.25$
7. `pincode_similarity`: $+0.20$
8. `transformer_e5_similarity`: $+0.35$ (Advisory semantic boost)
9. `graph_corroboration`: $+0.20$
10. `available_field_count`: $0.00$
11. `conflicting_field_count`: $-6.50$ (Strictly negative demographic conflict penalty)
12–16. Missingness indicators: $0.00$

---

## 7. Hard Collision Safety Guardrails

**Universal Invariant:** High semantic similarity (even cosine $\ge 0.99$) CANNOT override demographic contradictions.

If any demographic conflict is detected:
1. `isCollisionWarning` is set to `true`.
2. Total composite score is capped at $\le 0.25$ (`HARD_CONFLICT_CAP`).
3. Confidence tier is forced to `AMBIGUOUS`.
4. Mandatory human government officer review is triggered.

---

## 8. Multi-Registry Identity Consolidation (Phase 7E.6.1)

- Candidates across authorized registries are unified by `master_citizen_id`.
- Multiple registry rows for the same citizen form a single identity candidate.
- If ANY record belonging to an identity contains a demographic contradiction, the ENTIRE identity cluster is demoted to `AMBIGUOUS` with score $\le 0.25$.
- Eliminates artificial self-ties and prevents sparse records from bypassing contradictions.

---

## 9. Fail-Closed Fallback Architecture

If Transformer embedding generation fails (hardware OOM, network timeout, model exception):
$$\text{V4} \xrightarrow{\text{Failure}} \text{V3.1} \xrightarrow{\text{Failure}} \text{V1} \xrightarrow{\text{Failure}} \text{Fail-Closed Manual Review}$$
The system never approves or accepts an identity automatically on exception.
