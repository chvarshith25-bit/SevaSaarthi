# Seva Saarthi AI Model 2 V4.2 — Benchmark Integrity & Diagnostic Audit Report
**Phase 7F.4.1 Audit Execution**  
**Timestamp:** 2026-09-16T21:55:00.000Z  
**Engine:** Model 2 Entity Resolution Engine (V1 Deterministic / V3.1 Structured / V4.2 Selective Hybrid)  
**Status:** **INVESTIGATION COMPLETE — CODE & BENCHMARK AUDITED (NO TUNING PERFORMED)**

---

## Executive Summary & Final Verdict

During Phase 7F.4 execution, Candidate Retrieval Recall was reported at **55.27%**, down from earlier reported retrieval recall (~94–98%). This audit independently verified the mathematical, database, and architectural mechanisms responsible for this result.

### Final Verdict:
**B. BENCHMARK INVALID — FIX REQUIRED** & **D. V3.1 REMAINS BASELINE**

1. **Retrieval Pipeline Truncation (67.81% of misses):** The candidate retrieval pipeline uses an unranked SQL query with an aggressive per-registry limit (`LIMIT 10-20`) and total candidate cap (`topN=25`). On high-frequency Indian surnames (`Patel`, `Kumar`, `Sharma`, `Yadav`), common tokens match 40+ rows; SQL returns the earliest table records, truncating valid target citizens located deeper in the database table (e.g. `CIT-00140`, `CIT-00141`).
2. **Benchmark Generator Label Mismatch (19.67% of misses):** The benchmark generator generated multilingual queries by picking a random citizen from `all_registries.json` (150 citizens), but the translation dictionary (`HINDI_NAME_MAP` / `TELUGU_NAME_MAP`) only contained 10 names. For unmapped citizens, the query name defaulted to `'रवि कुमार'` (CIT-00002) while expecting the ground-truth citizen ID `CIT-00045`. Retrieval correctly retrieved CIT-00002, which the benchmark marked as a retrieval miss.
3. **Phonetic Normalization Asymmetry (10.73% of misses):** Transliterated queries (`cawita yadaw` for `Kavitha Yadav`) replace `th` with `t`. The SQL token generator only reduced `th -> t` rather than expanding `t -> th`, so SQL searched for `CAWITA` or `YADAW` against `Kavitha`, returning 0 rows.
4. **Selective Gating Over-Triggering:** Language router regexes (`/(bh|ch|dh|gh|jh|kh|ph|sh|th|zh)/i` and `/([aeiou])\1+/i`) over-trigger on ~85% of standard Latin Indian names (e.g. `Deepak`, `Pooja`, `Suresh`, `Kavitha`), misclassifying clean English queries as `TRANSLITERATED_INDIC` and unnecessarily invoking the Transformer.
5. **No Tuning Performed:** Model weights, thresholds, and scoring coefficients remain strictly frozen. V3.1 remains the authoritative, validated baseline.

---

## A. Current Code Snapshot & Reproducibility State

- **Git Branch:** `main`
- **Git Commit:** `6b34216` (`feat(ai): complete Phase 7F.1, 7F.2, and 7F.3 Transformer backend & fusion tuning`)
- **Working Tree State:** Clean / Unchanged Model Weights (`data/ai/entity-resolution/v4/model_weights_v4.json`)
- **Key Source Files Audited:**
  - [`src/lib/server/ai/entity-resolution/v4-transformer/v4-engine.ts`](file:///c:/Formly-main/src/lib/server/ai/entity-resolution/v4-transformer/v4-engine.ts)
  - [`src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer.ts`](file:///c:/Formly-main/src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer.ts)
  - [`src/lib/server/ai/entity-resolution/v4-transformer/selective-gater.ts`](file:///c:/Formly-main/src/lib/server/ai/entity-resolution/v4-transformer/selective-gater.ts)
  - [`src/lib/server/ai/entity-resolution/v4-transformer/language-router.ts`](file:///c:/Formly-main/src/lib/server/ai/entity-resolution/v4-transformer/language-router.ts)
  - [`src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider.ts`](file:///c:/Formly-main/src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider.ts)
  - [`src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity.ts`](file:///c:/Formly-main/src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity.ts)
  - [`src/lib/server/ai/entity-resolution/v4-transformer/identity-consolidator.ts`](file:///c:/Formly-main/src/lib/server/ai/entity-resolution/v4-transformer/identity-consolidator.ts)
  - [`src/lib/server/ai/entity-resolution/v3-engine.ts`](file:///c:/Formly-main/src/lib/server/ai/entity-resolution/v3-engine.ts)
- **Benchmark Script:** [`scripts/benchmark-model2-v4-seed20202.ts`](file:///c:/Formly-main/scripts/benchmark-model2-v4-seed20202.ts)
- **Benchmark Output:** [`data/ai/entity-resolution/v4/clean_seed20202_summary.json`](file:///c:/Formly-main/data/ai/entity-resolution/v4/clean_seed20202_summary.json)
- **Synthetic Ground Truth:** [`data/synthetic/all_registries.json`](file:///c:/Formly-main/data/synthetic/all_registries.json) (150 synthetic citizens, 7 government registries)

---

## B. Benchmark Dataset Specification

- **Total Queries:** $N = 2,000$
- **PRNG Seed:** `20202` (Mulberry32 deterministic generator)
- **Partition Breakdown:**
  - **Positive Ground-Truth Queries:** $1,500$ (75.0%)
    - English: $1,155$
    - Hindi (Devanagari): $82$
    - Telugu (Telugu Script): $90$
    - Transliterated Indic: $173$
  - **Homonym Collision Queries:** $161$ (8.05%)
  - **Distinct Negative / OOD Queries:** $339$ (16.95%)
  - **Total Disjoint Population:** $1,500 + 161 + 339 = 2,000$ queries ($100.00\%$)
- **Query Categories ($12$ Distinct Classes):**
  1. `EXACT_MATCH` ($171$ positive)
  2. `INITIALS` ($160$ positive)
  3. `SPELLING_VARIATION` ($185$ positive)
  4. `MISSING_FIELDS` ($174$ positive)
  5. `ADDRESS_VARIATION` ($162$ positive)
  6. `RESTRICTED_REGISTRY` ($161$ positive)
  7. `HOMONYM_COLLISION` ($161$ collision)
  8. `DISTINCT_NEGATIVE` ($175$ negative)
  9. `OOD_NOISE` ($164$ negative)
  10. `MULTILINGUAL` ($172$ positive)
  11. `TRANSLITERATION` ($173$ positive)
  12. `PARAPHRASED_ADDRESS` ($142$ positive)

---

## C. Candidate Retrieval Formula & Invariant Verification

$$\text{Candidate Retrieval Recall} = \frac{\sum_{i=1}^{N_{\text{pos}}} \mathbf{1}\left[\text{expected\_citizen\_id}_i \in \{\text{retrieved\_candidate\_citizen\_ids}_i\}\right]}{N_{\text{pos}}} \times 100\%$$

- **Mathematical Upper Bound:** $\le 100.00\%$
- **Total Positive Queries ($N_{\text{pos}}$):** $1,500$
- **Total Positive Targets Retrieved:** $829$
- **Candidate Retrieval Recall Result:** $\mathbf{55.27\%}$ ($829 / 1,500$)
- **Total Positive Targets Missed:** $671$ ($44.73\%$)

---

## D. Diagnostic Investigation of the 55.27% Retrieval Result

Every single one of the $671$ missed candidate retrieval queries was individually audited and classified against the required root-cause taxonomy:

| Root Cause Code | Root Cause Classification | Missed Queries | % of Misses | Primary Mechanism |
|---|---|---|---|---|
| **A** | **SQL Retrieval (Limit & Truncation)** | **455** | **67.81%** | SQL `LIMIT 10-20` on common surname tokens (`Patel`, `Kumar`, `Yadav`, `Sharma`) returns first 20 rows, truncating higher-index target citizens (e.g. `CIT-00140`). |
| **G** | **Benchmark Bug (Label Mismatch)** | **132** | **19.67%** | `HINDI_NAME_MAP` only contains 10 names; unmapped citizens defaulted to `'रवि कुमार'` (CIT-00002) while expecting CIT-XXXX. |
| **D** | **Name Normalization / Phonetics** | **72** | **10.73%** | Transliteration query `cawita` (`th->t`) did not expand `t->th` during SQL tokenization against Latin `Kavitha`. |
| **F** | **Registry Authorization (DPDP)** | **12** | **1.79%** | Target citizen exists only in `education_registry`, but query restricted to `revenue_registry`. |
| **B** | Language Routing Error | 0 | 0.00% | Language routing occurs after Stage A retrieval. |
| **C** | Selective Gating Error | 0 | 0.00% | Selective gating occurs during Stage B ranking. |
| **E** | Candidate Filtering Error | 0 | 0.00% | No post-SQL candidate filter dropped valid target rows. |
| **H** | Identity Mapping Error | 0 | 0.00% | All target citizens exist in master synthetic database. |
| **TOTAL** | **All Missed Queries** | **671** | **100.00%** | **Overall Retrieval Recall: 55.27%** |

### Category-by-Category Retrieval Recall Breakdown:
- `RESTRICTED_REGISTRY`: $127 / 161$ (**78.88%**)
- `PARAPHRASED_ADDRESS`: $98 / 142$ (**69.01%**)
- `MISSING_FIELDS`: $108 / 174$ (**62.07%**)
- `INITIALS`: $95 / 160$ (**59.38%**)
- `EXACT_MATCH`: $100 / 171$ (**58.48%**)
- `TRANSLITERATION`: $101 / 173$ (**58.38%**)
- `ADDRESS_VARIATION`: $90 / 162$ (**55.56%**)
- `SPELLING_VARIATION`: $70 / 185$ (**37.84%**)
- `MULTILINGUAL`: $40 / 172$ (**23.26%**)

---

## E. Retrieval-Only Comparison (Stage A vs Stage B Separation)

To confirm whether retrieval loss was model-independent, V1, V3.1, and V4.2 retrieval were evaluated on the **exact same candidate population and authorized registry set** without ranking:

| Model Retrieval Stage | Population Evaluated | Shared Stage A Candidate Pool | Retrieval Recall (%) | Median Candidates (p50) | 95th Percentile Candidates (p95) | Missed Target Count |
|---|---|---|---|---|---|---|
| **V1 Deterministic** | 1,500 Positives | Shared Authorized DB | **55.27%** | 20 | 25 | 671 |
| **V3.1 Structured** | 1,500 Positives | Shared Authorized DB | **55.27%** | 20 | 25 | 671 |
| **V4.2 Selective Gating** | 1,500 Positives | Shared Authorized DB | **55.27%** | 20 | 25 | 671 |

### Key Finding:
When evaluated on the same shared Stage A candidate pool, **all three models exhibit the exact same 55.27% candidate retrieval recall**. This proves conclusively that the drop is located in **Stage A SQL token generation and candidate retrieval**, NOT in V4.2 Transformer scoring or selective gating.

---

## F. Ranking-Only Comparison (Clean Benchmark Seed=20202)

With identical candidate pools ($55.27\%$ upper bound), the models were evaluated strictly on **Stage B candidate ranking and disambiguation**:

| Model Architecture | Candidate Retrieval Recall | Top-1 Person Accuracy | Top-3 Person Recall | Homonym Collision FMR | Correct Manual Review Rate | English Top-1 | Hindi Top-1 | Telugu Top-1 | Romanized Top-1 | p50 Latency (ms) | p95 Latency (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **V1 Deterministic** | 55.27% | 51.93% | 54.87% | **20.50%** | 79.50% | 55.24% | 14.63% | 31.11% | 58.38% | 0.77 | 1.31 |
| **V3.1 Structured (Baseline)** | 55.27% | 48.47% | 54.00% | **0.00%** | 100.00% | 53.16% | 7.32% | 8.89% | 57.23% | 1.89 | 3.43 |
| **Transformer-Only** | 55.27% | 29.33% | 52.67% | **0.00%** | 100.00% | 32.81% | 3.66% | 16.67% | 24.86% | 1.21 | 2.05 |
| **V4.1 Global Hybrid** | 55.27% | 52.00% | 55.00% | **0.00%** | 100.00% | 55.32% | 14.63% | 31.11% | 58.38% | 3.21 | 5.69 |
| **V4.2 Selective Gating** | 55.27% | 49.07% | 52.87% | **0.00%** | 100.00% | 52.29% | 10.98% | 28.89% | 56.07% | 3.22 | 5.37 |

### Fusion Experiments (Section 7 Strategies):
- **Exp A (V3.1 Structured Only):** Top-1 = 48.47%, Top-3 = 54.00%, Multi Top-3 = 23.26%, p50 = 1.89ms
- **Exp B (Pure Transformer Only):** Top-1 = 29.33%, Top-3 = 52.67%, Multi Top-3 = 18.60%, p50 = 1.21ms
- **Exp C (Linear 90/10 Fusion):** Top-1 = 49.07%, Top-3 = 52.73%, Multi Top-3 = 20.35%, p50 = 1.61ms
- **Exp D (Linear 80/20 Fusion):** Top-1 = 48.93%, Top-3 = 52.73%, Multi Top-3 = 20.35%, p50 = 1.61ms
- **Exp E (Conditional Medium/Ambiguous):** Top-1 = 48.80%, Top-3 = 51.47%, Multi Top-3 = 20.35%, p50 = 1.61ms
- **Exp F (Conditional Multilingual Only):** Top-1 = 48.53%, Top-3 = 52.07%, Multi Top-3 = 20.35%, p50 = 1.61ms
- **Exp G (V4.2 Selective Gating):** Top-1 = 49.07%, Top-3 = 52.87%, Multi Top-3 = 20.35%, p50 = 3.22ms
- **Exp H (V4.1 Learned Hybrid):** Top-1 = 52.00%, Top-3 = 55.00%, Multi Top-3 = 23.26%, p50 = 3.21ms

---

## G. Gating Telemetry & Language Routing Analysis

Telemetry captured via [`scripts/test-model2-v4-gating-telemetry.ts`](file:///c:/Formly-main/scripts/test-model2-v4-gating-telemetry.ts):

### Activation Rates Across Linguistic Categories:
- **Hindi Devanagari Queries:** $100.00\%$ ($2 / 2$) $\rightarrow$ `ACTIVE_MULTILINGUAL` ($\alpha=0.25, \beta=0.75$)
- **Telugu Script Queries:** $100.00\%$ ($2 / 2$) $\rightarrow$ `ACTIVE_MULTILINGUAL` ($\alpha=0.25, \beta=0.75$)
- **Transliterated Queries:** $100.00\%$ ($2 / 2$) $\rightarrow$ `ACTIVE_MULTILINGUAL` ($\alpha=0.25, \beta=0.75$)
- **Ambiguous English Queries:** $100.00\%$ ($3 / 3$) $\rightarrow$ `MODERATE_RERANK` ($\alpha=0.55, \beta=0.45$)
- **Clear Exact English Matches (No Indic phonemes):** $0.00\%$ ($0 / 3$) $\rightarrow$ `BYPASS_TRANSFORMER` ($\alpha=1.00, \beta=0.00$)
- **Overall Selective Gating Activation Rate:** $75.00\%$

### Language Router Over-Triggering Finding:
The language router regex in [`src/lib/server/ai/entity-resolution/v4-transformer/language-router.ts`](file:///c:/Formly-main/src/lib/server/ai/entity-resolution/v4-transformer/language-router.ts) uses:
- `/([aeiou])\1+/i` (double vowels: `aa`, `ee`, `oo`)
- `/(bh|ch|dh|gh|jh|kh|ph|sh|th|zh)/i` (aspirated consonants)

Standard Indian names written in standard Latin script:
- `Deepak Naidu` contains `ee` $\rightarrow$ triggers `TRANSLITERATED_INDIC`
- `Pooja Sharma` contains `oo` and `sh` $\rightarrow$ triggers `TRANSLITERATED_INDIC`
- `Suresh Varma` contains `sh` $\rightarrow$ triggers `TRANSLITERATED_INDIC`
- `Kavitha Yadav` contains `th` $\rightarrow$ triggers `TRANSLITERATED_INDIC`
- `Vijay Singh` contains `gh` $\rightarrow$ triggers `TRANSLITERATED_INDIC`
- `Radha Kumar` contains `dh` $\rightarrow$ triggers `TRANSLITERATED_INDIC`

As a result, ~85% of standard Latin-script Indian names are classified as `TRANSLITERATED_INDIC` rather than standard English, bypassing Case A and invoking the Transformer even on clear exact matches.

---

## H. Real Transformer Backend Verification

Verified via [`scripts/test-model2-v4-real-transformer.ts`](file:///c:/Formly-main/scripts/test-model2-v4-real-transformer.ts):

- **Pretrained Model ID:** `intfloat/multilingual-e5-base` (`Xenova/multilingual-e5-base`)
- **Neural Architecture:** `XLMRobertaModel` (12 transformer layers, 768 hidden dimensions, 12 self-attention heads)
- **Vocabulary Size:** $250,002$ tokens (multilingual SentencePiece)
- **Inference Runtime:** Real ONNX Runtime (WASM/Node CPU backend)
- **Output Embeddings:** Real 768-D Float32 vectors, verified L2 unit-normalized ($\|\mathbf{v}\|_2 = 1.0000 \pm 10^{-4}$)
- **Cross-Lingual Semantic Cosine Similarities:**
  - `query: Ravi Kumar` $\leftrightarrow$ `passage: Ravi Kumar` (EN-EN): **0.9236**
  - `query: Ravi Kumar` $\leftrightarrow$ `passage: रवि कुमार` (EN-HI): **0.9042**
  - `query: Ravi Kumar` $\leftrightarrow$ `passage: రవి కుమార్` (EN-TE): **0.9014**
  - `query: Ravi Kumar` $\leftrightarrow$ `passage: Ravi Kumaar` (EN-Romanized): **0.9133**
  - `query: Ravi Kumar` $\leftrightarrow$ `passage: Suresh Patel` (Unrelated 1): **0.8828**
  - `query: Ravi Kumar` $\leftrightarrow$ `passage: Priya Sharma` (Unrelated 2): **0.8801**
  - `query: Ravi Kumar` $\leftrightarrow$ `passage: Sunita Devi` (Unrelated 3): **0.8816**
- **100-Query Uncached Forward Passes:** $100$ forward passes completed with $0$ cache hits, generating $100 \times 768\text{-D}$ embeddings.

---

## I. Audit of "Model Produced Invalid Output" & Fallback Safety

Verified via [`scripts/test-model2-v4-invalid-output.ts`](file:///c:/Formly-main/scripts/test-model2-v4-invalid-output.ts):

1. **Origin of "Model produced invalid output":**
   - The error occurred during agent benchmark execution when tool output streaming or JSON parsing encountered malformed non-JSON payloads.
2. **Transformer NaN Handling Gap:**
   - In [`src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity.ts`](file:///c:/Formly-main/src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity.ts), `computeCosineSimilarity` does not sanitize `NaN` inputs, returning `NaN`.
3. **Fail-Closed Fallback Architecture:**
   - When the Transformer provider throws an exception (simulated crash), V4.2 catches the error, sets `fallbackUsed: true`, preserves structured V3.1 candidates, and adds the advisory legal disclaimer.
   - On catastrophic double failure (both V4 and V3 failing), the engine returns `candidates: []`, `ambiguityDetected: true`, `bestMatch: undefined`, and mandatory manual review disclaimer.
   - **No invalid output or exception can ever create an automatic identity decision.**

---

## J. Safety Metrics & Person-Level Invariants

Verified via [`scripts/test-model2-v4-person-level-metrics.ts`](file:///c:/Formly-main/scripts/test-model2-v4-person-level-metrics.ts):

- **Identity-Level Consolidation (Phase 7E.6.1):** Multiple candidate records for the same `master_citizen_id` across different registries (e.g. Revenue row + PAN row) are consolidated into a single person identity candidate.
- **Collision Propagation:** A collision warning or demographic contradiction on ANY registry row propagates to the entire consolidated identity, demoting the person to `AMBIGUOUS`.
- **Absolute Demographic Overrides:**
  - Semantic similarity $= 0.98$ + DOB Conflict $\rightarrow$ `isCollisionWarning: true`, Tier = `AMBIGUOUS`, Probability $\le 0.25$.
  - Semantic similarity $= 0.99$ + Father Name Conflict $\rightarrow$ `isCollisionWarning: true`, Tier = `AMBIGUOUS`.
- **Homonym Collision FMR:**
  - V1 Deterministic: **20.50%** (Unsafe)
  - V3.1 Structured: **0.00%** (Safe)
  - V4.1 Global Hybrid: **0.00%** (Safe)
  - V4.2 Selective Gating: **0.00%** (Safe)

---

## K. Error Taxonomy & Missed Query Counts

Across all $2,000$ queries in Seed=20202:

| Error Code | Classification | Miss Count | Percentage |
|---|---|---|---|
| **A** | Retrieval: SQL LIMIT Truncation | 455 | 67.81% |
| **G** | Benchmark: Unmapped Multilingual Label | 132 | 19.67% |
| **D** | Normalization: Asymmetric Phonetic Tokens | 72 | 10.73% |
| **F** | Authorization: Out-of-Registry Ground Truth | 12 | 1.79% |
| **B/C/E/H** | Routing / Gating / Filtering / Identity | 0 | 0.00% |

---

## L. Remaining Issues & Next Priorities

1. **Fix Stage A Candidate Retrieval SQL Limits:** Expand per-registry candidate fetching or implement tiered token search so common surnames (`Patel`, `Kumar`, `Sharma`) do not truncate target citizens past row 20.
2. **Fix Benchmark Indic Dictionary Coverage:** Expand `HINDI_NAME_MAP` and `TELUGU_NAME_MAP` to cover all 150 synthetic citizens in `all_registries.json` to eliminate artificial ground-truth mismatches.
3. **Refine Language Router Transliteration Patterns:** Distinguish standard Indian Latin names (`Deepak`, `Pooja`, `Suresh`) from genuine phonetically distorted transliterations (`deeepak`, `poojaah`, `surais`) so Case A exact structured matches bypass the Transformer as intended.
4. **Sanitize `NaN` in Cosine Similarity:** Add `isNaN` checks in `computeCosineSimilarity` to return safe `0.0`.
5. **DO NOT PROMOTE V4.2 YET:** Keep V3.1 as the authoritative baseline until the Stage A retrieval pipeline and benchmark generator are corrected.
