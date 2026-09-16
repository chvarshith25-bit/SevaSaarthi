/**
 * Seva Saarthi AI Model 2 V4.2 - Selective Gating Test Suite
 * 
 * Verifies that SelectiveGater makes accurate gating decisions across all 5 operational cases:
 * - Case A: High-confidence English structured match -> BYPASS_TRANSFORMER (100% structured)
 * - Case B: Medium-confidence English structured match -> LIGHT_ADVISORY (85% structured / 15% transformer)
 * - Case C: Ambiguous / tied English match -> MODERATE_RERANK (55% structured / 45% transformer)
 * - Case D: Multilingual / Transliterated -> ACTIVE_MULTILINGUAL (25% structured / 75% transformer)
 * - Case E: Demographic conflict -> HARD_COLLISION_BLOCK (Score capped <= 0.25, AMBIGUOUS)
 */

import { SelectiveGater } from '../src/lib/server/ai/entity-resolution/v4-transformer/selective-gater';
import { V4FieldSimilarityScores } from '../src/lib/server/ai/entity-resolution/v4-transformer/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function runSelectiveGatingTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.2 SELECTIVE GATING TEST SUITE               ');
  console.log('========================================================================\n');

  // Case A: High Confidence Exact English Match
  const gateA = SelectiveGater.evaluateGate({
    queryText: 'Ravi Kumar Civil Lines Jaipur',
    structuredCalibratedScore: 0.94,
    structuredConfidenceTier: 'HIGH',
    nameScore: 0.95,
    conflictCount: 0,
    isCollision: false,
    availableFieldCount: 4,
    scoreDeltaToSecond: 0.20,
  });

  assert(gateA.mode === 'BYPASS_TRANSFORMER', 'Case A: mode is BYPASS_TRANSFORMER');
  assert(gateA.alphaStructured === 1.0, 'Case A: alphaStructured is 1.0');
  assert(gateA.betaTransformer === 0.0, 'Case A: betaTransformer is 0.0');

  const fieldScoresA: V4FieldSimilarityScores = {
    nameScore: 0.95,
    dobScore: 1.0,
    fatherScore: 1.0,
    addressScore: 0.8,
    districtScore: 1.0,
    pincodeScore: 1.0,
    embeddingScore: 0.85,
    transformerScore: 0.85,
    structuredScore: 0.94,
    nameSemanticScore: 0.85,
    profileSemanticScore: 0.85,
  };
  const scoreA = SelectiveGater.computeGatedScore(0.94, fieldScoresA, gateA);
  assert(scoreA === 0.94, 'Case A: computed score strictly equals structured probability without transformer distortion');

  // Case B: Medium Confidence English Match
  const gateB = SelectiveGater.evaluateGate({
    queryText: 'R. Kumar Jaipur',
    structuredCalibratedScore: 0.72,
    structuredConfidenceTier: 'MEDIUM',
    nameScore: 0.75,
    conflictCount: 0,
    isCollision: false,
    availableFieldCount: 2,
    scoreDeltaToSecond: 0.10,
  });

  assert(gateB.mode === 'LIGHT_ADVISORY', 'Case B: mode is LIGHT_ADVISORY');
  assert(gateB.alphaStructured === 0.85, 'Case B: alphaStructured is 0.85');
  assert(gateB.betaTransformer === 0.15, 'Case B: betaTransformer is 0.15');

  // Case C: Ambiguous / Tied candidates
  const gateC = SelectiveGater.evaluateGate({
    queryText: 'Ravi Jaipur',
    structuredCalibratedScore: 0.52,
    structuredConfidenceTier: 'AMBIGUOUS',
    nameScore: 0.50,
    conflictCount: 0,
    isCollision: false,
    availableFieldCount: 2,
    scoreDeltaToSecond: 0.02,
  });

  assert(gateC.mode === 'MODERATE_RERANK', 'Case C: mode is MODERATE_RERANK');
  assert(gateC.alphaStructured === 0.55, 'Case C: alphaStructured is 0.55');
  assert(gateC.betaTransformer === 0.45, 'Case C: betaTransformer is 0.45');

  // Case D: Multilingual query (Hindi)
  const gateD = SelectiveGater.evaluateGate({
    queryText: 'रवि कुमार जयपुर',
    structuredCalibratedScore: 0.30, // Lexical edit distance fails on Hindi vs English
    structuredConfidenceTier: 'LOW',
    nameScore: 0.0,
    conflictCount: 0,
    isCollision: false,
    availableFieldCount: 2,
  });

  assert(gateD.mode === 'ACTIVE_MULTILINGUAL', 'Case D: mode is ACTIVE_MULTILINGUAL');
  assert(gateD.alphaStructured === 0.25, 'Case D: alphaStructured is 0.25');
  assert(gateD.betaTransformer === 0.75, 'Case D: betaTransformer is 0.75');

  const fieldScoresD: V4FieldSimilarityScores = {
    nameScore: 0.0,
    dobScore: 0.0,
    fatherScore: 0.0,
    addressScore: 0.0,
    districtScore: 0.0,
    pincodeScore: 0.0,
    embeddingScore: 0.91,
    transformerScore: 0.91,
    structuredScore: 0.15,
    nameSemanticScore: 0.92,
    profileSemanticScore: 0.90,
  };
  const scoreD = SelectiveGater.computeGatedScore(0.30, fieldScoresD, gateD);
  assert(scoreD >= 0.70, `Case D: multilingual cross-lingual match boosted via transformer semantics (score: ${scoreD})`);

  // Case E: Demographic Conflict (Collision)
  const gateE = SelectiveGater.evaluateGate({
    queryText: 'Ravi Kumar Jaipur',
    structuredCalibratedScore: 0.95,
    structuredConfidenceTier: 'AMBIGUOUS',
    nameScore: 1.0,
    conflictCount: 1, // DOB conflict!
    isCollision: true,
    availableFieldCount: 3,
  });

  assert(gateE.mode === 'HARD_COLLISION_BLOCK', 'Case E: mode is HARD_COLLISION_BLOCK');
  const fieldScoresE: V4FieldSimilarityScores = {
    nameScore: 1.0,
    dobScore: 0.1,
    fatherScore: 0.0,
    addressScore: 0.0,
    districtScore: 1.0,
    pincodeScore: 0.0,
    embeddingScore: 0.98,
    transformerScore: 0.98,
    structuredScore: 0.40,
    nameSemanticScore: 0.99,
    profileSemanticScore: 0.98,
  };
  const scoreE = SelectiveGater.computeGatedScore(0.95, fieldScoresE, gateE);
  assert(scoreE <= 0.25, `Case E: score strictly capped <= 0.25 despite 0.98 transformer similarity (score: ${scoreE})`);

  console.log('\n========================================================================');
  console.log('   ALL SELECTIVE GATING TESTS PASSED (100%)                             ');
  console.log('========================================================================\n');
}

runSelectiveGatingTests().catch((err) => {
  console.error('[FATAL] Selective gating test failed:', err);
  process.exit(1);
});
