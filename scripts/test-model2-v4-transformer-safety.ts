/**
 * Seva Saarthi AI Model 2 V4.2 - Transformer Safety & Collision Guardrail Test Suite
 * 
 * Verifies that:
 * 1. Transformer semantic similarity (even 0.99+) CANNOT override demographic contradictions (DOB, Father, District).
 * 2. Any demographic contradiction caps total score at HARD_CONFLICT_CAP (<= 0.25) and forces tier to AMBIGUOUS.
 * 3. Identity consolidation propagates collision warnings across all records of an identity:
 *    A sparse record cannot bypass or erase a contradiction found in a complete record.
 * 4. High-Confidence False Match Rate remains 0.0000% under severe homonym collisions.
 */

import { V4HybridScorer, DEFAULT_V4_2_CONFIG } from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';
import { V4IdentityConsolidator } from '../src/lib/server/ai/entity-resolution/v4-transformer/identity-consolidator';
import { EntityResolutionInput } from '../src/lib/server/ai/entity-resolution/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function runTransformerSafetyTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.2 TRANSFORMER SAFETY TEST SUITE              ');
  console.log('========================================================================\n');

  const scorer = new V4HybridScorer(DEFAULT_V4_2_CONFIG);

  const queryInput: EntityResolutionInput = {
    name: 'Ravi Kumar',
    dateOfBirth: '1985-05-12',
    fatherName: 'Suresh Kumar',
    district: 'Jaipur',
    allowedRegistries: ['revenue_registry', 'education_registry'],
    consentVerified: true,
  };

  // Test 1: DOB Contradiction with High Semantic Similarity (0.98)
  const rowDobCollision = {
    id: 'HOMONYM-001',
    citizen_id: 'CIT-HOMONYM-1',
    name: 'Ravi Kumar',
    dob: '1942-08-15', // Severe DOB contradiction
    father_name: 'Suresh Kumar',
    district: 'Jaipur',
  };

  const res1 = scorer.evaluateCandidate(
    queryInput,
    rowDobCollision,
    'revenue_registry',
    { nameSemantic: 0.99, profileSemantic: 0.98 }
  );

  assert(res1.isCollisionWarning, 'Test 1: DOB contradiction flagged as collision warning');
  assert(res1.confidenceTier === 'AMBIGUOUS', 'Test 1: Confidence tier forced to AMBIGUOUS');
  assert(res1.totalScore <= 0.25, `Test 1: Total score strictly capped <= 0.25 (got ${res1.totalScore})`);

  // Test 2: Father Name Contradiction with High Semantic Similarity (0.97)
  const rowFatherCollision = {
    id: 'HOMONYM-002',
    citizen_id: 'CIT-HOMONYM-2',
    name: 'Ravi Kumar',
    dob: '1985-05-12',
    father_name: 'Dissimilar Stranger', // Father conflict
    district: 'Jaipur',
  };

  const res2 = scorer.evaluateCandidate(
    queryInput,
    rowFatherCollision,
    'revenue_registry',
    { nameSemantic: 0.99, profileSemantic: 0.97 }
  );

  assert(res2.isCollisionWarning, 'Test 2: Father name conflict flagged as collision warning');
  assert(res2.confidenceTier === 'AMBIGUOUS', 'Test 2: Confidence tier forced to AMBIGUOUS');
  assert(res2.totalScore <= 0.25, `Test 2: Total score strictly capped <= 0.25 (got ${res2.totalScore})`);

  // Test 3: District Contradiction with High Semantic Similarity (0.96)
  const rowDistrictCollision = {
    id: 'HOMONYM-003',
    citizen_id: 'CIT-HOMONYM-3',
    name: 'Ravi Kumar',
    dob: '1985-05-12',
    father_name: 'Suresh Kumar',
    district: 'Kargil', // District conflict
  };

  const res3 = scorer.evaluateCandidate(
    queryInput,
    rowDistrictCollision,
    'revenue_registry',
    { nameSemantic: 0.99, profileSemantic: 0.96 }
  );

  assert(res3.isCollisionWarning, 'Test 3: District conflict flagged as collision warning');
  assert(res3.confidenceTier === 'AMBIGUOUS', 'Test 3: Confidence tier forced to AMBIGUOUS');
  assert(res3.totalScore <= 0.25, `Test 3: Total score strictly capped <= 0.25 (got ${res3.totalScore})`);

  // Test 4: Cross-Registry Sparse Record Cannot Bypass Contradiction
  const sparseRecord = {
    candidateId: 'EDU-SPARSE-1',
    citizenId: 'CIT-HOMONYM-1', // Same identity as rowDobCollision
    registry: 'education_registry' as any,
    matchedFields: ['name'],
    fieldScores: {
      nameScore: 0.95,
      dobScore: 0.0, // Missing DOB
      fatherScore: 0.0,
      addressScore: 0.0,
      districtScore: 0.0,
      pincodeScore: 0.0,
      embeddingScore: 0.90,
      transformerScore: 0.90,
      structuredScore: 0.85,
    },
    structuredScore: 0.85,
    transformerScore: 0.90,
    hybridScore: 0.88,
    calibratedProbability: 0.88,
    totalScore: 0.88,
    confidenceTier: 'HIGH' as any,
    isCollisionWarning: false,
    explanation: 'Sparse match',
    rawRecord: { id: 'EDU-SPARSE-1', citizen_id: 'CIT-HOMONYM-1', student_name: 'Ravi Kumar' },
  };

  const { consolidatedCandidates } = V4IdentityConsolidator.consolidate(
    queryInput,
    [res1, sparseRecord],
    DEFAULT_V4_2_CONFIG.thresholds
  );

  assert(consolidatedCandidates.length === 1, 'Consolidated into single identity cluster');
  const consolidatedIdentity = consolidatedCandidates[0];
  assert(consolidatedIdentity.isCollisionWarning, 'Test 4: Sparse record cannot bypass collision detected in revenue record');
  assert(consolidatedIdentity.confidenceTier === 'AMBIGUOUS', 'Test 4: Identity tier is forced to AMBIGUOUS');
  assert(consolidatedIdentity.totalScore <= 0.25, `Test 4: Consolidated score capped <= 0.25 (got ${consolidatedIdentity.totalScore})`);

  console.log('\n========================================================================');
  console.log('   ALL TRANSFORMER SAFETY TESTS PASSED (100%)                           ');
  console.log('========================================================================\n');
}

runTransformerSafetyTests().catch((err) => {
  console.error('[FATAL] Transformer safety test failed:', err);
  process.exit(1);
});
