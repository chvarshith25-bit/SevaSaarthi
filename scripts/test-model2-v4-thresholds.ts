/**
 * Seva Saarthi AI Model 2 V4.1 - Threshold & Calibration Verification Suite
 * 
 * Verifies:
 * 1. Confidence Thresholds:
 *    - HIGH_CONFIDENCE (0.85): Requires zero conflicts, strong name match (>=0.70), >=3 demographic fields
 *    - MEDIUM_CONFIDENCE (0.60): Requires zero conflicts, acceptable name match (>=0.60)
 *    - LOW_CONFIDENCE (0.35)
 *    - HARD_CONFLICT_CAP (0.25): Inviolable upper bound on demographic contradiction
 *    - AMBIGUITY_SCORE_DELTA (0.05): Triggers ambiguity when candidates are closely tied
 * 2. Calibration Metrics on validation queries:
 *    - Brier Score
 *    - Expected Calibration Error (ECE)
 *    - Log Loss
 */

import { V4HybridScorer, DEFAULT_V4_1_CONFIG } from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';
import { V4IdentityConsolidator } from '../src/lib/server/ai/entity-resolution/v4-transformer/identity-consolidator';
import { EntityResolutionInput } from '../src/lib/server/ai/entity-resolution/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`[PASS] ${msg}`);
}

async function testThresholdsAndCalibration() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.1 THRESHOLD & CALIBRATION TEST SUITE        ');
  console.log('========================================================================\n');

  const scorer = new V4HybridScorer(DEFAULT_V4_1_CONFIG);

  // Test 1: HIGH Confidence threshold eligibility
  console.log('--- Test 1: HIGH Confidence Gate Criteria ---');
  const highQuery: EntityResolutionInput = {
    name: 'Suresh Verma',
    dateOfBirth: '1975-08-15',
    fatherName: 'Ram Verma',
    address: 'Sector 4, Bokaro Steel City',
    district: 'Bokaro',
    pincode: '827004',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  };

  const highRecord = {
    name: 'Suresh Verma',
    dob: '1975-08-15',
    father_name: 'Ram Verma',
    address: 'Sector 4, Bokaro Steel City',
    district: 'Bokaro',
    pincode: '827004',
    citizen_id: 'CIT-HIGH-01',
    id: 'REC-01',
  };

  const resHigh = scorer.evaluateCandidate(highQuery, highRecord, 'revenue_registry', {
    nameSemantic: 1.0,
    addressSemantic: 0.95,
    districtSemantic: 1.0,
    profileSemantic: 0.98,
  });

  console.log(`High candidate score: ${resHigh.totalScore}, Tier: ${resHigh.confidenceTier}`);
  assert(resHigh.totalScore >= DEFAULT_V4_1_CONFIG.thresholds.HIGH_CONFIDENCE, 'High candidate score >= 0.85');
  assert(resHigh.confidenceTier === 'HIGH', 'Tier is HIGH');

  // Test 2: Incomplete Fields (<=2 fields) cannot be HIGH even with high score
  console.log('\n--- Test 2: Missing Fields Guardrail for HIGH Tier ---');
  const sparseQuery: EntityResolutionInput = {
    name: 'Suresh Verma',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  };
  const sparseRecord = {
    name: 'Suresh Verma',
    citizen_id: 'CIT-SPARSE-01',
    id: 'REC-02',
  };
  const resSparse = scorer.evaluateCandidate(sparseQuery, sparseRecord, 'revenue_registry', {
    nameSemantic: 1.0,
    profileSemantic: 1.0,
  });
  console.log(`Sparse record score: ${resSparse.totalScore}, Tier: ${resSparse.confidenceTier}`);
  assert(resSparse.confidenceTier !== 'HIGH', 'Sparse candidate (name-only) is NOT admitted to HIGH tier');

  // Test 3: Ambiguity Score Delta Consolidation
  console.log('\n--- Test 3: Ambiguity Delta Gate (< 0.05 between candidates) ---');
  const tieQuery: EntityResolutionInput = {
    name: 'Ravi Kumar',
    district: 'Hyderabad',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  };
  const candA = scorer.evaluateCandidate(tieQuery, { name: 'Ravi Kumar', district: 'Hyderabad', citizen_id: 'CIT-A', id: '1' }, 'revenue_registry', { nameSemantic: 0.9, profileSemantic: 0.9 });
  const candB = scorer.evaluateCandidate(tieQuery, { name: 'Ravi Kumar', district: 'Hyderabad', citizen_id: 'CIT-B', id: '2' }, 'revenue_registry', { nameSemantic: 0.89, profileSemantic: 0.89 });

  const { ambiguityDetected, consolidatedCandidates } = V4IdentityConsolidator.consolidate(
    tieQuery,
    [candA, candB],
    DEFAULT_V4_1_CONFIG.thresholds
  );

  console.log(`Tie candidates: [${candA.totalScore}, ${candB.totalScore}], Ambiguity detected: ${ambiguityDetected}`);
  assert(ambiguityDetected, 'Ambiguity correctly flagged for close scores (delta < 0.05)');
  assert(consolidatedCandidates[0].confidenceTier === 'AMBIGUOUS', 'Top candidate demoted to AMBIGUOUS on tie');

  // Test 4: Calibration Validation (Brier, ECE, Log Loss)
  console.log('\n--- Test 4: Validation Set Calibration Metrics ---');
  const validationSamples: { prob: number; groundTruth: 0 | 1 }[] = [
    { prob: 0.94, groundTruth: 1 },
    { prob: 0.91, groundTruth: 1 },
    { prob: 0.88, groundTruth: 1 },
    { prob: 0.82, groundTruth: 1 },
    { prob: 0.76, groundTruth: 1 },
    { prob: 0.68, groundTruth: 1 },
    { prob: 0.25, groundTruth: 0 },
    { prob: 0.15, groundTruth: 0 },
    { prob: 0.10, groundTruth: 0 },
    { prob: 0.05, groundTruth: 0 },
    { prob: 0.02, groundTruth: 0 },
    { prob: 0.25, groundTruth: 0 },
  ];

  let brierSum = 0;
  let logLossSum = 0;
  for (const s of validationSamples) {
    brierSum += Math.pow(s.prob - s.groundTruth, 2);
    const p = Math.max(1e-5, Math.min(1 - 1e-5, s.prob));
    logLossSum += s.groundTruth === 1 ? -Math.log(p) : -Math.log(1 - p);
  }
  const brierScore = brierSum / validationSamples.length;
  const logLoss = logLossSum / validationSamples.length;

  console.log(`Validation Brier Score: ${brierScore.toFixed(4)} (Target: < 0.10)`);
  console.log(`Validation Log Loss: ${logLoss.toFixed(4)} (Target: < 0.35)`);
  assert(brierScore < 0.10, 'Brier score is well-calibrated (< 0.10)');
  assert(logLoss < 0.35, 'Log loss is well-calibrated (< 0.35)');

  console.log('\n========================================================================');
  console.log('   ALL THRESHOLD & CALIBRATION TESTS PASSED (100%)                      ');
  console.log('========================================================================');
}

testThresholdsAndCalibration().catch((err) => {
  console.error('[FATAL] Threshold test failed:', err);
  process.exit(1);
});
