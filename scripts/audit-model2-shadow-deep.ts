/**
 * SEVA SAARTHI PHASE 7E.2.1: DEEP METHODOLOGY AUDIT OF SHADOW EVALUATION
 * 
 * Conducts exhaustive ground-truth and multi-metric agreement audit of the 180 shadow requests:
 * 1. Multi-metric agreement (Exact Candidate ID, Citizen ID, Decision Class, Manual Review Decision, Top-3 Overlap)
 * 2. Ground-truth performance matrix (Accuracy, Precision, Recall, F1, FPR, FNR, Correct Deferral)
 * 3. Detailed classification of all 110 disagreements (A, B, C, D, E, F, G)
 * 4. Critical investigation of 81 manual review cases and 24 V2.1-better cases
 * 5. Independent verification of 0 V1-better claim
 * 6. Export audit dataset to JSON and CSV
 */

import fs from 'fs';
import path from 'path';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';
import { EntityResolutionEngine } from '../src/lib/server/ai/entity-resolution/engine';
import { EntityResolutionEngineV2 } from '../src/lib/server/ai/entity-resolution/v2-engine';

interface ShadowRequest {
  requestId: string;
  category: string;
  query: any;
  groundTruth: {
    citizenId: string | null;
    expectedMatchType: string;
    notes: string;
  };
}

async function main() {
  console.log('========================================================');
  console.log('  PHASE 7E.2.1: SHADOW EVALUATION METHODOLOGY AUDIT     ');
  console.log('========================================================\n');

  await getAuthoritativeDb();

  const datasetPath = path.resolve(process.cwd(), 'scripts/model2_shadow_test_requests.json');
  const requests: ShadowRequest[] = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  // Load all registries to build lookup from candidate_id -> citizen_id
  const allRegs = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/synthetic/all_registries.json'), 'utf8'));
  const candToCitMap = new Map<string, string>();

  for (const [regName, rows] of Object.entries(allRegs as Record<string, any[]>)) {
    if (regName === 'citizens' || regName === 'ground_truth') continue;
    for (const r of rows) {
      const cid = r.citizen_id;
      const ref = r.id || r.income_certificate_number || r.scholarship_id || r.land_reference || r.health_scheme_id || r.housing_scheme_id || r.survey_number || r.pan_reference;
      if (ref && cid) {
        candToCitMap.set(String(ref), String(cid));
      }
    }
  }

  console.log(`Loaded ${requests.length} original shadow requests.`);
  console.log(`Mapped ${candToCitMap.size} registry records to master citizen identities.\n`);

  // --- 1. RUN DETAILED INFERENCE & MULTI-METRIC COMPARISON ---
  let exactCandidateAgreementCount = 0;
  let citizenIdentityAgreementCount = 0;
  let decisionClassAgreementCount = 0;
  let manualReviewDecisionAgreementCount = 0;
  let totalTop3OverlapScore = 0;

  // Ground truth metrics tracking
  let v1CorrectMatch = 0, v1IncorrectMatch = 0, v1CorrectlyDeferred = 0, v1IncorrectlyDeferred = 0;
  let v1FalseMatch = 0, v1FalseNegative = 0, v1CorrectNoMatch = 0, v1IncorrectNoMatch = 0;

  let v2CorrectMatch = 0, v2IncorrectMatch = 0, v2CorrectlyDeferred = 0, v2IncorrectlyDeferred = 0;
  let v2FalseMatch = 0, v2FalseNegative = 0, v2CorrectNoMatch = 0, v2IncorrectNoMatch = 0;

  // Disagreement classification tracking
  const disagreementAudit: any[] = [];
  const reclassifiedCategoryCounts: Record<string, number> = {
    'A. V2.1 objectively better': 0,
    'B. V1 objectively better': 0,
    'C. Both objectively correct': 0,
    'D. Both safely defer': 0,
    'E. V2.1 unsafe': 0,
    'F. V1 unsafe': 0,
    'G. Evaluation ambiguity / insufficient evidence': 0,
  };

  // 81 Manual Review investigation buckets
  let mrGenuineAmbiguity = 0;
  let mrRankingDifferencesSameCitizen = 0;
  let mrCollisionGuardrails = 0;
  let mrSparseInput = 0;
  let mrConservativeThreshold = 0;

  for (const req of requests) {
    const gt = req.groundTruth;
    const v1Res = await EntityResolutionEngine.matchEntity(req.query);
    const v2Res = await EntityResolutionEngineV2.matchEntityV2(req.query);

    const v1Top = v1Res.bestMatch;
    const v2Top = v2Res.bestMatch;

    const v1TopId = v1Top?.candidateId || null;
    const v2TopId = v2Top?.candidateId || null;

    const v1CitId = v1TopId ? candToCitMap.get(v1TopId) || v1Top?.citizenId || null : null;
    const v2CitId = v2TopId ? candToCitMap.get(v2TopId) || v2Top?.citizenId || null : null;

    // Decision classes
    const getDecisionClass = (res: any) => {
      if (!res.bestMatch || res.candidates.length === 0) return 'NO_MATCH';
      if (res.ambiguityDetected || res.bestMatch.confidenceTier === 'AMBIGUOUS' || res.candidates.some((c: any) => c.isCollisionWarning)) return 'AMBIGUOUS';
      if (res.bestMatch.confidenceTier === 'HIGH') return 'HIGH_MATCH';
      return 'MEDIUM_CONFIRMATION';
    };

    const v1Class = getDecisionClass(v1Res);
    const v2Class = getDecisionClass(v2Res);

    const v1Defers = (v1Class === 'AMBIGUOUS' || v1Class === 'NO_MATCH');
    const v2Defers = (v2Class === 'AMBIGUOUS' || v2Class === 'NO_MATCH');

    // Agreement Metrics
    const exactCandidateAgree = (v1TopId === v2TopId) || (!v1TopId && !v2TopId);
    if (exactCandidateAgree) exactCandidateAgreementCount++;

    const citizenIdentityAgree = (v1CitId === v2CitId) || (!v1CitId && !v2CitId);
    if (citizenIdentityAgree) citizenIdentityAgreementCount++;

    const decisionClassAgree = (v1Class === v2Class);
    if (decisionClassAgree) decisionClassAgreementCount++;

    const manualReviewAgree = (v1Defers === v2Defers);
    if (manualReviewAgree) manualReviewDecisionAgreementCount++;

    // Top-3 Overlap (Jaccard similarity of citizen identities in top 3)
    const v1Top3Cits = new Set(v1Res.candidates.slice(0, 3).map(c => candToCitMap.get(c.candidateId) || c.citizenId).filter(Boolean));
    const v2Top3Cits = new Set(v2Res.candidates.slice(0, 3).map(c => candToCitMap.get(c.candidateId) || c.citizenId).filter(Boolean));
    if (v1Top3Cits.size === 0 && v2Top3Cits.size === 0) {
      totalTop3OverlapScore += 1.0;
    } else {
      let intersect = 0;
      for (const item of v1Top3Cits) if (v2Top3Cits.has(item)) intersect++;
      const union = new Set([...v1Top3Cits, ...v2Top3Cits]).size;
      totalTop3OverlapScore += union > 0 ? (intersect / union) : 0;
    }

    // Ground-Truth Evaluation: Model 1 V1
    if (gt.expectedMatchType === 'POSITIVE') {
      if (v1CitId === gt.citizenId && !v1Defers) {
        v1CorrectMatch++;
      } else if (v1CitId === gt.citizenId && v1Defers) {
        v1IncorrectlyDeferred++;
      } else if (v1CitId && v1CitId !== gt.citizenId) {
        v1FalseMatch++;
      } else {
        v1FalseNegative++;
      }
    } else if (gt.expectedMatchType === 'COLLISION_NEGATIVE' || gt.expectedMatchType === 'DISTINCT_NEGATIVE') {
      if (v1Defers || !v1TopId) {
        v1CorrectlyDeferred++;
        if (!v1TopId) v1CorrectNoMatch++;
      } else {
        v1FalseMatch++;
      }
    } else if (gt.expectedMatchType === 'AMBIGUOUS' || gt.expectedMatchType === 'SPARSE_AMBIGUOUS') {
      if (v1Defers) {
        v1CorrectlyDeferred++;
      } else {
        v1IncorrectMatch++;
      }
    }

    // Ground-Truth Evaluation: Model 2 V2.1
    if (gt.expectedMatchType === 'POSITIVE') {
      if (v2CitId === gt.citizenId && !v2Defers) {
        v2CorrectMatch++;
      } else if (v2CitId === gt.citizenId && v2Defers) {
        v2IncorrectlyDeferred++;
      } else if (v2CitId && v2CitId !== gt.citizenId) {
        v2FalseMatch++;
      } else {
        v2FalseNegative++;
      }
    } else if (gt.expectedMatchType === 'COLLISION_NEGATIVE' || gt.expectedMatchType === 'DISTINCT_NEGATIVE') {
      if (v2Defers || !v2TopId) {
        v2CorrectlyDeferred++;
        if (!v2TopId) v2CorrectNoMatch++;
      } else {
        v2FalseMatch++;
      }
    } else if (gt.expectedMatchType === 'AMBIGUOUS' || gt.expectedMatchType === 'SPARSE_AMBIGUOUS') {
      if (v2Defers) {
        v2CorrectlyDeferred++;
      } else {
        v2IncorrectMatch++;
      }
    }

    // Re-evaluate Disagreements (where exactCandidateAgree is false)
    if (!exactCandidateAgree) {
      let auditCategory = 'G. Evaluation ambiguity / insufficient evidence';
      let auditReason = '';

      // Case 1: Both identified records belonging to the exact same citizen (Registry Ranking Difference)
      if (v1CitId && v2CitId && v1CitId === v2CitId && v1CitId === gt.citizenId) {
        auditCategory = 'C. Both objectively correct';
        auditReason = `Both models correctly resolved the true citizen (${gt.citizenId}), but ranked different authorized departmental records (V1: ${v1TopId} in ${v1Top?.registry}, V2.1: ${v2TopId} in ${v2Top?.registry}).`;
        mrRankingDifferencesSameCitizen++;
      }
      // Case 2: V2.1 correctly matched positive variant where V1 failed or had low confidence
      else if (gt.expectedMatchType === 'POSITIVE' && v2CitId === gt.citizenId && v1CitId !== gt.citizenId) {
        auditCategory = 'A. V2.1 objectively better';
        auditReason = `V2.1 accurately resolved true citizen ${gt.citizenId} via subword/initial similarity where V1 missed or returned unrelated record.`;
      }
      // Case 3: V1 matched positive where V2.1 failed
      else if (gt.expectedMatchType === 'POSITIVE' && v1CitId === gt.citizenId && v2CitId !== gt.citizenId) {
        auditCategory = 'B. V1 objectively better';
        auditReason = `V1 accurately resolved true citizen ${gt.citizenId} where V2.1 missed.`;
      }
      // Case 4: Both safely deferred on collisions or negative cases
      else if (v1Defers && v2Defers) {
        auditCategory = 'D. Both safely defer';
        auditReason = `Both models appropriately deferred to manual review / ambiguous queue for ${req.category}.`;
        if (req.category.includes('COLLISION')) mrCollisionGuardrails++;
        else if (req.category.includes('SPARSE')) mrSparseInput++;
        else mrGenuineAmbiguity++;
      }
      // Case 5: V1 unsafe (false match on collision/negative)
      else if ((gt.expectedMatchType === 'COLLISION_NEGATIVE' || gt.expectedMatchType === 'DISTINCT_NEGATIVE') && !v1Defers && v2Defers) {
        auditCategory = 'F. V1 unsafe';
        auditReason = `V1 produced an uncalibrated high match on collision/negative, whereas V2.1 safely flagged AMBIGUOUS.`;
      }
      // Case 6: V2.1 unsafe (false match on collision/negative)
      else if ((gt.expectedMatchType === 'COLLISION_NEGATIVE' || gt.expectedMatchType === 'DISTINCT_NEGATIVE') && v1Defers && !v2Defers) {
        auditCategory = 'E. V2.1 unsafe';
        auditReason = `V2.1 failed to defer on collision/negative.`;
      }
      // Case 7: V2.1 too conservative
      else if (gt.expectedMatchType === 'POSITIVE' && v1CitId === gt.citizenId && !v1Defers && v2Defers) {
        auditCategory = 'B. V1 objectively better';
        auditReason = `V1 correctly matched positive citizen while V2.1 was overly conservative and deferred to manual review.`;
        mrConservativeThreshold++;
      } else {
        auditCategory = 'G. Evaluation ambiguity / insufficient evidence';
        auditReason = `Complex multi-candidate ambiguity across ${req.category}.`;
        mrGenuineAmbiguity++;
      }

      reclassifiedCategoryCounts[auditCategory]++;

      disagreementAudit.push({
        requestId: req.requestId,
        category: req.category,
        queryName: req.query.name,
        groundTruthCitizenId: gt.citizenId,
        expectedType: gt.expectedMatchType,
        v1TopId,
        v1CitId,
        v1Tier: v1Top?.confidenceTier,
        v1Score: v1Top?.totalScore,
        v2TopId,
        v2CitId,
        v2Tier: v2Top?.confidenceTier,
        v2Prob: v2Top?.totalScore,
        v1DecisionClass: v1Class,
        v2DecisionClass: v2Class,
        auditCategory,
        auditReason,
        notes: gt.notes,
      });
    }
  }

  const N = requests.length;
  const exactCandAgreementRate = ((exactCandidateAgreementCount / N) * 100).toFixed(2);
  const citIdentityAgreementRate = ((citizenIdentityAgreementCount / N) * 100).toFixed(2);
  const decisionClassAgreementRate = ((decisionClassAgreementCount / N) * 100).toFixed(2);
  const manualReviewAgreementRate = ((manualReviewDecisionAgreementCount / N) * 100).toFixed(2);
  const avgTop3Overlap = ((totalTop3OverlapScore / N) * 100).toFixed(2);

  console.log('--- 1. MULTI-METRIC AGREEMENT AUDIT (N=180) ---');
  console.log(`A. Exact Top-1 Candidate Agreement (Row ID) : ${exactCandAgreementRate}% (${exactCandidateAgreementCount}/${N})`);
  console.log(`B. Same Citizen Identity Agreement (Master ID) : ${citIdentityAgreementRate}% (${citizenIdentityAgreementCount}/${N})`);
  console.log(`C. Same Decision Class Agreement (HIGH/MED/AMB): ${decisionClassAgreementRate}% (${decisionClassAgreementCount}/${N})`);
  console.log(`D. Same Manual-Review Decision Agreement      : ${manualReviewAgreementRate}% (${manualReviewDecisionAgreementCount}/${N})`);
  console.log(`E. Top-3 Candidate Overlap (Mean Jaccard)     : ${avgTop3Overlap}%\n`);

  console.log('--- 2. GROUND-TRUTH DECISION PERFORMANCE ---');
  const calcMetrics = (tp: number, fp: number, tn: number, fn: number) => {
    const prec = (tp + fp) > 0 ? (tp / (tp + fp)) * 100 : 100;
    const rec = (tp + fn) > 0 ? (tp / (tp + fn)) * 100 : 100;
    const f1 = (prec + rec) > 0 ? (2 * prec * rec) / (prec + rec) : 0;
    const fpr = (fp + tn) > 0 ? (fp / (fp + tn)) * 100 : 0;
    const fnr = (fn + tp) > 0 ? (fn / (fn + tp)) * 100 : 0;
    return { prec: prec.toFixed(2), rec: rec.toFixed(2), f1: f1.toFixed(2), fpr: fpr.toFixed(2), fnr: fnr.toFixed(2) };
  };

  const v1Metrics = calcMetrics(v1CorrectMatch, v1FalseMatch, v1CorrectlyDeferred, v1FalseNegative);
  const v2Metrics = calcMetrics(v2CorrectMatch, v2FalseMatch, v2CorrectlyDeferred, v2FalseNegative);

  console.log(`Model 2 V1 (Authoritative):`);
  console.log(`  Correct Matches: ${v1CorrectMatch}, False Matches: ${v1FalseMatch}, False Negatives: ${v1FalseNegative}, Correct Deferrals: ${v1CorrectlyDeferred}`);
  console.log(`  Precision: ${v1Metrics.prec}%, Recall: ${v1Metrics.rec}%, F1: ${v1Metrics.f1}%, FPR: ${v1Metrics.fpr}%, FNR: ${v1Metrics.fnr}%`);
  console.log(`\nModel 2 V2.1 (Calibrated Shadow):`);
  console.log(`  Correct Matches: ${v2CorrectMatch}, False Matches: ${v2FalseMatch}, False Negatives: ${v2FalseNegative}, Correct Deferrals: ${v2CorrectlyDeferred}`);
  console.log(`  Precision: ${v2Metrics.prec}%, Recall: ${v2Metrics.rec}%, F1: ${v2Metrics.f1}%, FPR: ${v2Metrics.fpr}%, FNR: ${v2Metrics.fnr}%\n`);

  console.log('--- 3. RECLASSIFIED DISAGREEMENT AUDIT (110 Cases) ---');
  for (const [k, v] of Object.entries(reclassifiedCategoryCounts)) {
    console.log(`  ${k}: ${v} (${((v / 110) * 100).toFixed(1)}%)`);
  }
  console.log('');

  console.log('--- 4. CRITICAL INVESTIGATION OF THE 81 MANUAL REVIEW CASES ---');
  console.log(`  1. Ranking differences across registries for the SAME citizen : ${mrRankingDifferencesSameCitizen} cases`);
  console.log(`  2. Collision guardrails demoting conflicting demographics     : ${mrCollisionGuardrails} cases`);
  console.log(`  3. Sparse single-token query demotions                       : ${mrSparseInput} cases`);
  console.log(`  4. Genuine multi-candidate ambiguities                       : ${mrGenuineAmbiguity} cases`);
  console.log(`  5. Conservative threshold deferrals                          : ${mrConservativeThreshold} cases\n`);

  // Write machine-readable JSON
  fs.writeFileSync('docs/model2_shadow_disagreements_audit.json', JSON.stringify(disagreementAudit, null, 2));

  // Write machine-readable CSV
  const csvHeaders = ['requestId', 'category', 'queryName', 'groundTruthCitizenId', 'expectedType', 'v1TopId', 'v1CitId', 'v1Tier', 'v2TopId', 'v2CitId', 'v2Tier', 'auditCategory', 'auditReason'];
  const csvRows = [csvHeaders.join(',')];
  for (const d of disagreementAudit) {
    const row = [
      d.requestId,
      d.category,
      `"${d.queryName}"`,
      d.groundTruthCitizenId || 'NONE',
      d.expectedType,
      d.v1TopId || 'NONE',
      d.v1CitId || 'NONE',
      d.v1Tier || 'NONE',
      d.v2TopId || 'NONE',
      d.v2CitId || 'NONE',
      d.v2Tier || 'NONE',
      `"${d.auditCategory}"`,
      `"${d.auditReason.replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  }
  fs.writeFileSync('docs/model2_shadow_disagreements_audit.csv', csvRows.join('\n'));

  console.log('Exported docs/model2_shadow_disagreements_audit.json and docs/model2_shadow_disagreements_audit.csv successfully.');
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
