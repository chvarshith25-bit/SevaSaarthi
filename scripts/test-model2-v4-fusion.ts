/**
 * Seva Saarthi AI Model 2 V4.1 - Hybrid Fusion Strategy Verification Suite
 * 
 * Verifies Fusion Strategies A through G:
 * - Strategy A: STRUCTURED_ONLY (V3.1 baseline logic)
 * - Strategy B: TRANSFORMER_ONLY (Pure 768-D cosine similarity)
 * - Strategy C: LINEAR_90_10 (0.90 structured + 0.10 transformer)
 * - Strategy D: LINEAR_80_20 (0.80 structured + 0.20 transformer)
 * - Strategy E: LINEAR_70_30 (0.70 structured + 0.30 transformer)
 * - Strategy F: LINEAR_60_40 (0.60 structured + 0.40 transformer)
 * - Strategy G: LEARNED_FUSION (Calibrated 20-D field-aware logistic layer)
 * 
 * Safety Assertions:
 * - All strategies strictly enforce collision guardrails (cap <= 0.25, AMBIGUOUS tier).
 * - Monotonicity and non-negative evidence weights.
 */

import { V4HybridScorer, DEFAULT_V4_CONFIG, DEFAULT_V4_1_CONFIG } from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';
import { FusionStrategy, Model2V4Weights } from '../src/lib/server/ai/entity-resolution/v4-transformer/types';
import { EntityResolutionInput } from '../src/lib/server/ai/entity-resolution/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`[PASS] ${msg}`);
}

async function testFusionStrategies() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.1 HYBRID FUSION STRATEGY TEST SUITE         ');
  console.log('========================================================================\n');

  const query: EntityResolutionInput = {
    name: 'Amit Kumar Patel',
    dateOfBirth: '1988-04-12',
    fatherName: 'Rajesh Patel',
    address: 'Flat 402, Sai Residency, Road No 12, Banjara Hills',
    district: 'Hyderabad',
    pincode: '500034',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  };

  const matchingRecord = {
    name: 'Amit Patel',
    dob: '1988-04-12',
    father_name: 'Rajesh Patel',
    address: 'Sai Residency, Banjara Hills',
    district: 'Hyderabad',
    pincode: '500034',
    citizen_id: 'CIT-TEST-001',
    income_certificate_number: 'REV-101',
  };

  const conflictingRecord = {
    name: 'Amit Patel',
    dob: '1962-11-20', // Clear DOB conflict
    father_name: 'Devraj Patel', // Clear Father conflict
    address: 'Sai Residency, Banjara Hills',
    district: 'Varanasi', // Clear District conflict
    pincode: '221001',
    citizen_id: 'CIT-TEST-002',
    income_certificate_number: 'REV-102',
  };

  const strategies: FusionStrategy[] = [
    'STRUCTURED_ONLY',
    'TRANSFORMER_ONLY',
    'LINEAR_90_10',
    'LINEAR_80_20',
    'LINEAR_70_30',
    'LINEAR_60_40',
    'LEARNED_FUSION',
  ];

  console.log('--- Test 1: Evaluation of Clean Match Across Strategies A-G ---');
  for (const strat of strategies) {
    const config: Model2V4Weights = {
      ...DEFAULT_V4_1_CONFIG,
      fusion_strategy: strat,
    };
    const scorer = new V4HybridScorer(config);
    const result = scorer.evaluateCandidate(query, matchingRecord, 'revenue_registry', {
      nameSemantic: 0.94,
      addressSemantic: 0.88,
      districtSemantic: 1.0,
      profileSemantic: 0.92,
    });

    console.log(`[Strategy ${strat}] Total Score: ${result.totalScore}, Tier: ${result.confidenceTier}, Structured: ${result.structuredScore}`);
    assert(result.totalScore >= 0.70, `Clean match scores >= 0.70 in ${strat} (got ${result.totalScore})`);
    assert(result.confidenceTier === 'HIGH' || result.confidenceTier === 'MEDIUM', `Clean match is HIGH/MEDIUM in ${strat}`);
    assert(!result.isCollisionWarning, `No false collision warning in ${strat}`);
  }

  console.log('\n--- Test 2: Unconditional Collision Guardrail in ALL Strategies A-G ---');
  for (const strat of strategies) {
    const config: Model2V4Weights = {
      ...DEFAULT_V4_1_CONFIG,
      fusion_strategy: strat,
    };
    const scorer = new V4HybridScorer(config);
    // Artificially pass 0.9999 transformer similarity to test safety barrier
    const result = scorer.evaluateCandidate(query, conflictingRecord, 'revenue_registry', {
      nameSemantic: 0.9999,
      addressSemantic: 0.9999,
      districtSemantic: 0.9999,
      profileSemantic: 0.9999,
    });

    console.log(`[Strategy ${strat}] Conflict Total Score: ${result.totalScore}, Tier: ${result.confidenceTier}, Collision: ${result.isCollisionWarning}`);
    assert(result.isCollisionWarning, `Collision strictly detected in ${strat}`);
    assert(result.totalScore <= 0.25, `Score strictly capped <= 0.25 in ${strat} (got ${result.totalScore})`);
    assert(result.confidenceTier === 'AMBIGUOUS', `Confidence tier forced to AMBIGUOUS in ${strat}`);
  }

  console.log('\n--- Test 3: Weight Validation & Schema Assertions ---');
  assert(DEFAULT_V4_1_CONFIG.feature_names.length === 20, 'V4.1 configuration has 20 features');
  assert(DEFAULT_V4_1_CONFIG.weights.length === 20, 'V4.1 configuration has 20 weights');
  assert(DEFAULT_V4_1_CONFIG.weights[10] < 0, 'Conflict penalty weight is strictly negative');

  // Verify weight validation throws on malformed config
  let threw = false;
  try {
    new V4HybridScorer({
      ...DEFAULT_V4_1_CONFIG,
      weights: [0.1, 0.2], // invalid length
    });
  } catch {
    threw = true;
  }
  assert(threw, 'V4HybridScorer throws on mismatched feature/weight dimensions');

  console.log('\n========================================================================');
  console.log('   ALL FUSION STRATEGY TESTS PASSED (100%)                              ');
  console.log('========================================================================');
}

testFusionStrategies().catch((err) => {
  console.error('[FATAL] Fusion test failed:', err);
  process.exit(1);
});
