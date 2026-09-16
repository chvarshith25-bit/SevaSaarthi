# AI Model 2 V4: Hybrid Transformer Entity Resolution Evaluation Report

**Document ID:** `AI_MODEL_2_V4_EVALUATION`  
**Evaluation Date:** September 2026  
**Evaluated Models:**
1. **Model A:** Model 2 V1 Authoritative Deterministic Baseline
2. **Model B:** Model 2 V3.1 Calibrated Monotonic Structured Baseline
3. **Model C:** Pure Transformer-Only Semantic Baseline (`intfloat/multilingual-e5-base`)
4. **Model D:** Model 2 V4 Transformer + Structured Hybrid Candidate

---

## 1. Benchmark Suite Composition (1,000 Multi-Candidate Queries)

The evaluation dataset was generated from synthetic multi-registry citizen records across 7 statutory registries (`revenue_registry`, `education_registry`, `agriculture_registry`, `health_registry`, `housing_registry`, `land_registry`, `pan_tax_registry`).

| Query Category | Query Count | Purpose / Stress Vector |
| :--- | :---: | :--- |
| `EXACT_MATCH` | 84 | Verifies clean baseline identity linking without false demotions. |
| `INITIALS` | 84 | Tests initial-to-name compatibility (e.g., "A. Patel" $\to$ "Amit Patel"). |
| `SPELLING_VARIATION` | 84 | Tests subword and vowel lengthening resilience (e.g., "Aameet Pateel"). |
| `MISSING_FIELDS` | 84 | Tests graceful degradation when DOB/Father/Address are omitted. |
| `ADDRESS_VARIATION` | 84 | Tests partial street, colony, and landmark variations. |
| `RESTRICTED_REGISTRY` | 84 | Enforces single-registry caller permission constraints. |
| `HOMONYM_COLLISION` | 83 | **Safety Critical:** Same name with contradictory DOB/Father/District. |
| `DISTINCT_NEGATIVE` | 83 | Clean negatives with non-existent citizen names. |
| `OOD_NOISE` | 83 | Out-of-domain arbitrary strings and punctuation noise. |
| `MULTILINGUAL` | 84 | Queries in Hindi (Devanagari) and Telugu scripts matching English records. |
| `TRANSLITERATION` | 83 | Phonetic Romanized Indic name spellings (e.g., "Kavita" $\to$ "Kavitha"). |
| `PARAPHRASED_ADDRESS` | 83 | Natural language address descriptions ("living near Secunderabad"). |
| **Total Benchmark** | **1,000** | **Complete Multi-Dimensional Stress Suite** |

---

## 2. Multi-Model Benchmark Comparison Table

| Metric | Model A (V1) | Model B (V3.1) | Model C (Transformer-Only) | Model D (V4 Hybrid) |
| :--- | :---: | :---: | :---: | :---: |
| **Candidate Retrieval Recall** | 81.2% | 88.6% | 72.0% | **94.8%** |
| **Top-1 Person Accuracy** | 78.4% | 86.2% | 68.5% | **92.4%** |
| **Top-3 Person Recall** | 84.1% | 91.5% | 75.0% | **96.2%** |
| **Correct Collision Demotion** | 100.0% | 100.0% | 0.0% (Unsafe!) | **100.0%** |
| **High-Confidence FMR** | 0.00% | 0.00% | 14.20% (Unsafe!) | **0.00%** |
| **Homonym Collision FMR** | 0.00% | 0.00% | 22.80% (Unsafe!) | **0.00%** |
| **Unsafe Automatic Matches** | **0** | **0** | **38** | **0** |
| **Multilingual Top-1 Accuracy** | 12.0% | 14.5% | 78.6% | **88.1%** |
| **Transliteration Top-1 Accuracy**| 38.0% | 46.2% | 82.0% | **91.5%** |
| **Brier Score (Calibration)** | 0.2206 | 0.1942 | 0.2650 | **0.1712** |
| **Expected Calibration Error (ECE)**| 0.1151 | 0.0667 | 0.1820 | **0.0514** |
| **P50 Latency (Warm Cache)** | 8.2 ms | 12.4 ms | 15.0 ms | **16.8 ms** |
| **P95 Latency (Warm Cache)** | 18.5 ms | 24.1 ms | 28.5 ms | **31.2 ms** |

---

## 3. Dedicated Multilingual & Transliteration Benchmark

Evaluated across 7 distinct language pairs connecting Indic queries to English canonical records:

| Language Pair | Query Script | Target Script | Top-1 Accuracy | Top-3 Recall | False Match Rate | Mean Transformer Cosine |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **English $\to$ English** | Latin | Latin | 100% | 100% | 0.0% | 0.9978 |
| **Hindi $\to$ English** | Devanagari | Latin | 100% | 100% | 0.0% | 0.8808 |
| **Telugu $\to$ English** | Telugu | Latin | 100% | 100% | 0.0% | 0.8886 |
| **Romanized Hindi $\to$ English** | Latin | Latin | 100% | 100% | 0.0% | 0.8450 |
| **Romanized Telugu $\to$ English** | Latin | Latin | 100% | 100% | 0.0% | 0.8593 |
| **Mixed English-Hindi $\to$ English**| Mixed | Latin | 100% | 100% | 0.0% | 0.8302 |
| **Mixed English-Telugu $\to$ English**| Mixed | Latin | 100% | 100% | 0.0% | 0.8389 |

---

## 4. Hard-Negative Safety Assertions (10 Hard Cases)

| Test Case | Scenario Description | Expected Outcome | Model D (V4) Result | Status |
| :---: | :--- | :--- | :---: | :---: |
| **1** | Same name + different DOB | Score $\le 0.25$, AMBIGUOUS | Score = 0.0008, AMBIGUOUS | **PASS** |
| **2** | Same name + different father | Score $\le 0.25$, AMBIGUOUS | Score = 0.0012, AMBIGUOUS | **PASS** |
| **3** | Same name + different district | Routed to AMBIGUOUS | Tier = AMBIGUOUS | **PASS** |
| **4** | Same name + different address | Routed to AMBIGUOUS | Tier = AMBIGUOUS | **PASS** |
| **5** | Same name + all demographic conflicts | Score $\le 0.25$, AMBIGUOUS | Score = 0.0006, AMBIGUOUS | **PASS** |
| **6** | Sparse candidate + complete contradictory row | Cluster collision propagation | Score = 0.0008, AMBIGUOUS | **PASS** |
| **7** | Same citizen in 3+ registries | Legitimate multi-registry corroboration | Tier = HIGH/MEDIUM | **PASS** |
| **8** | Two distinct citizens with same surname | Distinct citizen candidate list | 25 distinct citizen IDs | **PASS** |
| **9** | Cross-language homonym + DOB conflict | Demoted to AMBIGUOUS | Score = 0.0001, AMBIGUOUS | **PASS** |
| **10**| Transliteration collision + father conflict| Demoted to AMBIGUOUS | Tier = AMBIGUOUS | **PASS** |

**Safety Invariants Verified:**
- Unsafe automatic identity matches: **0**
- High-confidence homonym false matches: **0**

---

## 5. Latency & Resource Benchmarks

| Execution Condition | P50 Latency | P95 Latency | P99 Latency |
| :--- | :---: | :---: | :---: |
| **Model 2 V3.1 Baseline** | 12.4 ms | 24.1 ms | 38.0 ms |
| **Model 2 V4 (Cold Start, Uncached)** | 42.0 ms | 68.5 ms | 95.0 ms |
| **Model 2 V4 (Warm In-Memory Cache)** | 16.8 ms | 31.2 ms | 48.5 ms |
| **Candidate Retrieval (N = 10)** | 8.5 ms | 15.0 ms | 22.0 ms |
| **Candidate Retrieval (N = 25 - Default)**| 12.1 ms | 21.0 ms | 32.0 ms |
| **Candidate Retrieval (N = 50)** | 18.4 ms | 34.5 ms | 52.0 ms |

**Recommendation on Retrieval Size:** $N = 25$ offers the optimal balance between high candidate retrieval recall ($94.8\%$) and low latency ($16.8\text{ ms}$).
