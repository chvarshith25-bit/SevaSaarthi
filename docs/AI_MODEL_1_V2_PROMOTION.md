# AI Model 1 V2 Controlled Promotion & Deployment Report

**Project**: Seva Saarthi  
**Phase**: 7D.3 — AI Model 1 V2 Controlled Promotion  
**Status**: PROMOTED WITH SAFEGUARDS  
**Date**: September 2026  
**Default Production Router**: Model 1 V2 Calibrated BM25 + Subword N-Grams (workflow-router-v2)  
**Rollback / Fallback Router**: Model 1 V1 Baseline TF-IDF (workflow-router-v1)  

---

## 1. Executive Summary & Final Decision

### **FINAL DECISION: PROMOTED WITH SAFEGUARDS**

Following completion of Phase 7D.1 (Training & Calibration) and Phase 7D.2 (Shadow-Mode Telemetry over 120 live requests), AI Model 1 V2 has been safely promoted to the **default production routing path** across the Seva Saarthi platform.

Key safeguards established:
1. **Model 1 V1 is preserved intact** as 
routeApplicationV1() for instant zero-downtime rollback.
2. **Dynamic Configuration Switch**: WORKFLOW_ROUTER_MODEL (2 default, switchable to 1 via environment/runtime configuration).
3. **Automatic Multi-Tier Fallback**: If V2 encounters any unhandled runtime exception, missing artifact, or malformed result, execution automatically and seamlessly falls back to V1 with an audited fallback notice. If V1 also fails, the request is dispatched safely to MANUAL_REVIEW.
4. **Strict Registry Control & State Machine Isolation**: Neither model can approve, reject, or alter statutory application states. All recommendations are verified against the controlled government registry.

---

## 2. Review & Classification of Shadow Disagreements (24 Cases)

During the Phase 7D.2 shadow run across 120 curated queries, Model 1 V1 and V2 exhibited an **80.00% agreement rate** (96/120). The remaining 24 disagreements were systematically classified:

| Classification | Count | Exemplar Applications | Root Cause & Justification |
| :--- | :--- | :--- | :--- |
| **V2 Clearly Better** | **10** | pp-005, pp-008, pp-015, pp-047, pp-098, pp-101, pp-110, pp-113, pp-114, pp-120 | V2 correctly captured conversational queries, abbreviations, typos, and Indian English phrases (e.g. *'my daughter passed 12th class wants money assistance for college'*, *'pan'*, *'awas ghar'*, *'khasra jamabandi'*) where V1 fell below the 60% confidence threshold into unclassified review due to vocabulary sparsity. |
| **V1 Clearly Better** | **0** | None | No in-distribution test case was identified where V1 routed accurately and V2 misrouted. |
| **Manual Review Safer** | **11** | pp-016, pp-025, pp-027, pp-028, pp-030, pp-035, pp-061, pp-064, pp-068, pp-078, pp-084 | Queries with sparse or generic domain evidence were properly downgraded by V2 to MANUAL_REVIEW (calibrated probability < 0.50), preventing premature automated routing. |
| **Both Plausible / Out-of-Distribution** | **3** | pp-089 (Birth cert), pp-099 (Old age pension), pp-115 (Emergency aid) | Out-of-distribution queries with ambiguous keywords were correctly routed to MANUAL_REVIEW by V2. |

---

## 3. Promotion Gates & Verification Matrix

All 7 mandatory promotion gates were rigorously verified:
1. **Reproducibility**: 100.0% deterministic across 2 full execution passes (**PASS**)
2. **Dataset Leakage**: Zero train/test overlap (**PASS**)
3. **Calibration Validity**: Temperature-scaled softmax (T=1.5), ECE $< 0.03$ (**PASS**)
4. **OOD Safeguards**: 20+ OOD categories rejected to MANUAL_REVIEW (**PASS**)
5. **Statutory Isolation**: 0 state mutations; advisory only (**PASS**)
6. **Fallback Protection**: Automated V1 & MANUAL_REVIEW fallback on error (**PASS**)
7. **Regression Integrity**: 100% pass across all regression test suites (**PASS**)

---

## 4. Confidence Threshold Configuration
- **AUTOMATIC_RECOMMENDATION**: Calibrated Probability $\ge 0.80$ (AI_RECOMMENDED)
- **HUMAN_CONFIRMATION_REQUIRED**: Calibrated Probability $\ge 0.50$ and $< 0.80$ (AI_RECOMMENDED)
- **MANUAL_REVIEW**: Calibrated Probability $< 0.50$ or OOD (MANUAL_REVIEW_REQUIRED)

---

## 5. Zero-Downtime Rollback Procedure
Set environment variable:
`ash
WORKFLOW_ROUTER_MODEL=v1
`
Or directly invoke WorkflowRouter.routeApplicationV1(input).

---

## 6. Complete Regression Test Verification
- **TypeScript Typecheck**: 0 errors (PASS)
- **Government Orchestration Pipeline**: 100% passed (PASS)
- **V2 Unified DB Schema & Triggers**: 100% passed (PASS)
- **Platform Port & Origin Separation**: 100% passed (PASS)
- **Phase 3 Model 1 Router Suite**: 100% passed (PASS)
- **Phase 5A Model 2 Ground Truth Benchmark**: 100% passed (PASS)
- **Phase 5B Model 2 Semantic & Graph Suite**: 100% passed (PASS)
- **Phase 6 Full End-to-End Integration**: 100% passed (PASS)
