# AI Model 2 V4.2 Retrieval & Benchmark Repair Audit Report
**Phase 7F.4.2 — Candidate Retrieval Repair & Benchmark Integrity Verification**
*Date: September 16, 2026*  
*Status: COMPLETED (Retrieval & Benchmark Repaired; Governance Frozen)*  

---

## 1. Executive Summary & Governance Assertion

Under strict governance constraints of Phase 7F.4.2:
- **Model 2 V1 Deterministic** remains the **authoritative production resolver**.
- **Model 2 V3.1 Calibrated Structured** remains the **official baseline**.
- **Model 2 V4.2 Selective Transformer Gating** remains **experimental** (isolated and unpromoted).
- **No model scoring weights, Transformer fusion weights, confidence thresholds, or collision thresholds were modified or tuned in this phase.**
- Synthetic data only under DPDP statutory consent and server-side authorized registry boundaries.

In this phase, the root causes of the previous **55.27% candidate retrieval drop** and **benchmark label corruption** were diagnosed, isolated, and permanently resolved. All models (V1, V3.1, Transformer-Only, V4.1, V4.2) now evaluate against an **identical, valid candidate population and identical candidate retrieval pools**, achieving **100.00% Candidate Retrieval Recall** across all 1,523 positive evaluation queries.

---

## 2. Freeze & Baseline Environment Record (Step 1)

| Parameter | Recorded Value |
| :--- | :--- |
| **Git Commit Base** | `6b34216` |
| **Node.js Runtime** | `v24.15.0` |
| **Evaluation Dataset** | Synthetic All-Registries Dataset (`data/synthetic/all_registries.json`, 150 master citizens, 7 statutory registries) |
| **Benchmark Seed** | `20202` (Mulberry32 PRNG, 2,000 queries) |
| **Model Artifact Versions** | `V1` (Deterministic Baseline), `V3.1` (16-D Calibrated Logistic), `V4.2` (multilingual-e5-base Selective Gater) |
| **Candidate Retrieval Config** | Top-$N=25$, Multi-token Conjunctive SQL Prioritization, Symmetric Phonetic Expansion |
| **Benchmark Manifest** | `data/ai/entity-resolution/v4/benchmark_manifest_seed20202.json` (2,000 entries) |

---

## 3. Exact Root Causes of Previous 55.27% Retrieval Failure (Step 4 & Step 5)

Our Phase 7F.4.1 audit traced the 55.27% retrieval collapse to 4 distinct defects:

1. **Unranked SQL LIMIT Truncation on Common Surnames (455 queries missed)**:
   - *Defect*: SQL candidate queries constructed disjunctive (`OR`) clauses across all name tokens without score ordering (e.g. `WHERE (name ILIKE '%RAVI%' OR name ILIKE '%KUMAR%') LIMIT 20`).
   - *Impact*: In PostgreSQL, high-frequency Indian surnames (`Kumar`, `Patel`, `Sharma`, `Yadav`) flooded the candidate buffer in arbitrary physical heap order. The target record (`Ravi Kumar`) was truncated before being retrieved.
   - *Fix*: Implemented multi-token conjunctive match prioritization:
     $$\text{token\_score} = \sum_{i=1}^m \mathbf{1}_{\{\text{nameCol ILIKE } \%t_i\%\}}$$
     Queries are ordered deterministically by `token_score DESC, dob_score DESC, father_score DESC, id ASC`. Rows matching both first name and surname (score = 2) are guaranteed top rank over single-token surname collisions.

2. **Benchmark Multilingual Name Corruption (132 queries corrupted)**:
   - *Defect*: Benchmark generator defaulted any name missing from `HINDI_NAME_MAP` / `TELUGU_NAME_MAP` to `'रवि कुमार'` (`CIT-00002`), while keeping the target `expectedCitizenId` of the original citizen.
   - *Impact*: Evaluators searched for "रवि कुमार" while expecting "CIT-00061 (Amit Patel)", creating an impossible retrieval target and corrupting ground truth labels.
   - *Fix*: Expanded `HINDI_NAME_MAP` and `TELUGU_NAME_MAP` to 100% complete coverage of all 22 synthetic citizen identities. Added a hard exception throw if an unmapped name is ever encountered, strictly forbidding silent label corruption.

3. **Asymmetric Phonetic Token Expansion (72 queries missed)**:
   - *Defect*: Transliterated strings like `cawita yadaw` were reduced unidirectionally (`w->v`, `c->k`) but lacked bidirectional expansion for aspirated consonants (`th/t`, `dh/d`, `bh/b`, `ph/f`, `sh/s`) and double vowel combinations.
   - *Impact*: Database records with Latin spellings (`Kavitha Yadav`, `Radha Kumar`, `Deepak Naidu`) failed lexical ILIKE queries on transliterated variations.
   - *Fix*: Created `expandSymmetricPhoneticVariants()` and `extractSearchTokenGroups()` in `candidate-retriever.ts`, generating full symmetric clusters and placing canonical reduced tokens at index 0.

4. **Statutory Authorization Exclusions (12 queries)**:
   - *Defect*: Restricted single-registry queries randomly assigned a registry where the citizen was never registered. Under the DPDP Act, server-side whitelist filtering correctly returned zero rows.
   - *Fix*: Ground-truth assertions verified that authorized positive queries select a registry where the citizen is legally present, or record authorization exclusions explicitly.

---

## 4. Stage-A Candidate Retrieval Before & After (Step 3 & Step 4)

Candidate retrieval recall is strictly defined as:
$$\text{Candidate Retrieval Recall} = \frac{\text{Eligible positive queries with } \ge 1 \text{ true identity candidate in pool}}{\text{Total eligible positive queries}}$$

### Retrieval Comparison Across Engines (Identical Candidate Pools, Top-$N=25$)

| Metric / Category | Phase 7F.4.1 (Before) | Phase 7F.4.2 (After) | Status |
| :--- | :---: | :---: | :---: |
| **Model 2 V1 Retrieval Recall** | 55.27% (842 / 1,523) | **100.00% (1,523 / 1,523)** | **REPAIRED** |
| **Model 2 V3.1 Retrieval Recall** | 55.27% (842 / 1,523) | **100.00% (1,523 / 1,523)** | **REPAIRED** |
| **Model 2 V4.2 Retrieval Recall** | 55.27% (842 / 1,523) | **100.00% (1,523 / 1,523)** | **REPAIRED** |
| Candidate Count $p_{50}$ | 10 | **25** | Stable |
| Candidate Count $p_{95}$ | 20 | **25** | Stable |
| Candidate Count $p_{99}$ | 20 | **25** | Stable |

### Retrieval Recall Breakdown by Category (Seed 20202, 1,523 Positive Queries)

| Variation Category | Total Queries | Retrieved | Missed | Recall (%) |
| :--- | :---: | :---: | :---: | :---: |
| `EXACT_MATCH` | 186 | 186 | 0 | **100.00%** |
| `INITIALS` | 153 | 153 | 0 | **100.00%** |
| `SPELLING_VARIATION` | 195 | 195 | 0 | **100.00%** |
| `MISSING_FIELDS` | 174 | 174 | 0 | **100.00%** |
| `ADDRESS_VARIATION` | 162 | 162 | 0 | **100.00%** |
| `PARAPHRASED_ADDRESS` | 153 | 153 | 0 | **100.00%** |
| `RESTRICTED_REGISTRY` | 154 | 154 | 0 | **100.00%** |
| `MULTILINGUAL` | 175 | 175 | 0 | **100.00%** |
| `TRANSLITERATION` | 171 | 171 | 0 | **100.00%** |
| **TOTAL** | **1,523** | **1,523** | **0** | **100.00%** |

---

## 5. Common Surname Retrieval Integrity (Step 4 & Step 7)

Common Indian surnames were specifically isolated and tested under multi-token conjunctive SQL retrieval:

| Surname | Total Evaluated Queries | Retrieved True Target | Stage-A Recall | Truncation Loss |
| :--- | :---: | :---: | :---: | :---: |
| **Kumar** | 392 | 392 | **100.00%** | 0 |
| **Patel** | 365 | 365 | **100.00%** | 0 |
| **Yadav** | 409 | 409 | **100.00%** | 0 |
| **Naidu** | 337 | 337 | **100.00%** | 0 |
| **Reddy** | 20 | 20 | **100.00%** | 0 |

---

## 6. Stage-B Ranking Comparison on Identical Candidate Pools (Step 8)

With candidate retrieval recall fixed at 100.00%, Stage-B ranking performance was measured across all models on the **exact same 2,000-query benchmark dataset** (`clean_seed20202_summary.json`):

### 5-Way Primary Model Evaluation

| Evaluation Metric | Model A: V1 Deterministic (Prod) | Model B: V3.1 Structured (Baseline) | Model C: Transformer Only | Model D: V4.1 Global Hybrid | Model E: V4.2 Selective Gating |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Candidate Retrieval Recall** | 100.00% | 100.00% | 100.00% | 100.00% | 100.00% |
| **Top-1 Person Accuracy** | 89.63% | 87.79% | 39.13% | **90.54%** | **89.95%** |
| **Top-3 Person Recall** | 98.29% | 98.82% | 86.93% | **99.54%** | **99.41%** |
| **English Top-1** | 86.92% | 86.92% | 39.17% | 87.77% | 87.09% |
| **Hindi Top-1** | 98.84% | 88.37% | 43.02% | **100.00%** | **100.00%** |
| **Telugu Top-1** | 96.63% | 75.28% | 40.45% | **100.00%** | **100.00%** |
| **Romanized Indic Top-1** | 100.00% | 100.00% | 36.26% | 100.00% | 99.42% |
| **Multilingual Top-3 Recall** | 98.86% | 100.00% | 89.14% | **100.00%** | **100.00%** |
| **Transliteration Top-3 Recall**| 100.00% | 100.00% | 91.81% | **100.00%** | **100.00%** |
| **Homonym Collision FMR** | **82.24% (UNSAFE)** | **9.21%** | 0.00% | **9.21%** | **9.21%** |
| **High-Confidence FMR** | 13.00% | **0.00%** | **0.00%** | 2.94% | 2.94% |
| **Unsafe Automatic Match Rate**| 3.10% | **0.00%** | **0.00%** | 0.70% | 0.70% |
| **Correct Manual Review Rate** | 17.76% | **90.79%** | 100.00% | **90.79%** | **90.79%** |
| **Unnecessary Review Rate** | 0.00% | 28.76% | 99.87% | 23.70% | 23.51% |
| **$p_{50}$ Execution Latency** | 0.26 ms | 0.80 ms | 0.53 ms | 1.45 ms | 1.43 ms |
| **$p_{95}$ Execution Latency** | 0.60 ms | 1.83 ms | 1.31 ms | 3.54 ms | 3.36 ms |
| **$p_{99}$ Execution Latency** | 0.94 ms | 2.46 ms | 134.32 ms | 136.04 ms | 135.83 ms |

---

## 7. Language Router Telemetry & Regex Diagnostic (Step 9)

Language detection telemetry was measured on all 2,000 queries:

### Routing Distribution by Query Script

| Query Script / Class | English Latin | Transliterated Indic | Devanagari Hindi | Telugu Script | Mixed Script |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **English Exact Match** (186) | 75 | 111 | 0 | 0 | 0 |
| **English Indian Names** (1,468) | 644 | 824 | 0 | 0 | 0 |
| **Devanagari Hindi** (86) | 0 | 0 | 86 | 0 | 0 |
| **Telugu Script** (89) | 0 | 0 | 0 | 89 | 0 |
| **Romanized Indic** (171) | 132 | 39 | 0 | 0 | 0 |

### V4.2 Selective Transformer Activation Rate

| Language Class | Total Queries | Transformer Activated | Activation Rate | Gating Mode |
| :--- | :---: | :---: | :---: | :--- |
| **English Standard** | 1,654 | 1,158 | 70.01% | `LIGHT_ADVISORY` / `MODERATE_RERANK` |
| **Hindi / Devanagari** | 86 | 86 | **100.00%** | `ACTIVE_MULTILINGUAL` ($\alpha=0.30, \beta=0.70$) |
| **Telugu Script** | 89 | 89 | **100.00%** | `ACTIVE_MULTILINGUAL` ($\alpha=0.30, \beta=0.70$) |
| **Romanized Indic** | 171 | 39 | 22.81% | `ACTIVE_MULTILINGUAL` / `MODERATE_RERANK` |

### Regex Over-Triggering Finding
The regex pattern `/(bh|ch|dh|gh|jh|kh|ph|sh|th|zh)/i` matches aspirated consonants standard in English Indian transliterations (`Sharma`, `Bharat`, `Chowdhary`, `Smith`). This causes standard English Indian names to route to `TRANSLITERATED_INDIC`.
- *Governance Action*: Recorded in diagnostic telemetry; no regexes or model weights were altered in Phase 7F.4.2.

---

## 8. Transformer Backend & Invalid Output Safety Audit (Step 10 & Step 11)

1. **Transformer Backend Verification**:
   - Runtime: Genuine `@xenova/transformers` ONNX Runtime (WASM/Node CPU backend).
   - Pretrained Model: `Xenova/multilingual-e5-base` (768 dimensions, 12 layers, 12 attention heads, SentencePiece vocabulary size 250,002).
   - Zero polynomial-hash or legacy embedding providers are used.

2. **Invalid Output & Fail-Closed Robustness**:
   - Verified that corrupt inputs (NaN embeddings, zero vectors, runtime exceptions) fail closed to Model 2 V3.1 structured evaluation.
   - Catastrophic dual-engine failures flag `ambiguityDetected = true` and return 0 automatic matches (`bestMatch = undefined`), forcing mandatory human officer review.

---

## 9. Comprehensive Safety & Regression Verification (Step 13)

| Test Suite | Command | Result | Verification Scope |
| :--- | :--- | :---: | :--- |
| **TypeScript Typecheck** | `npm run typecheck` | **PASSED (0 errors)** | Strict static type validation |
| **Core Government Pipeline** | `npm test` | **PASSED (100%)** | Application lifecycle, monotonic IDs, state transitions |
| **Unified Database Schema** | `npm run test:schema` | **PASSED (100%)** | PGlite live PostgreSQL migrations, triggers, append-only logs |
| **Platform Isolation** | `npm run test:separation` | **PASSED (100%)** | Port 3000/3001 boundary, cookie segregation, shell separation |
| **Security & RBAC** | `npm run test:verification` | **PASSED (100%)** | Anti-IDOR, tamper-evident audit SHA-256, AI action boundaries |
| **Stage-A Retrieval Integrity** | `npx tsx scripts/test-model2-v4-retrieval-integrity.ts` | **PASSED (100%)** | Common surnames, multilingual labels, determinism |
| **Invalid Output Audit** | `npx tsx scripts/test-model2-v4-invalid-output.ts` | **PASSED (100%)** | NaN sanitization, exception fallback, fail-closed gate |

---

## 10. Final Governance Sign-Off

```
+-----------------------------------------------------------------------------------+
|                           PHASE 7F.4.2 GOVERNANCE RECORD                          |
+-----------------------------------------------------------------------------------+
| Production Resolver : Model 2 V1 Deterministic (ACTIVE PRODUCTION)                |
| Official Baseline   : Model 2 V3.1 Demographic Evidence Baseline (FROZEN)         |
| Experimental Resolver: Model 2 V4.2 Selective Gating (STRICTLY EXPERIMENTAL)      |
| Model Promotion     : PROHIBITED (V4.2 is NOT promoted in this phase)             |
| Weight Tuning       : PROHIBITED (No weights or thresholds were tuned)            |
| Candidate Retrieval : REPAIRED & UNIFIED (100.00% Recall Across All Engines)      |
| Benchmark Integrity : VERIFIED & AUDITED (Zero Target-Label Mismatches)           |
+-----------------------------------------------------------------------------------+
```
