/**
 * Seva Saarthi AI Model 2 V4.2 - Person-Level Ranking & Consolidation Test Suite
 * 
 * Verifies:
 * 1. Multiple authorized registry rows for the same master_citizen_id consolidate into a SINGLE identity candidate.
 * 2. Cross-registry supporting evidence (supportingRegistries, supportingRecordIds) are aggregated.
 * 3. Elimination of false self-ties across different registries.
 * 4. Reranking operates strictly across distinct person identities.
 */

import { V4IdentityConsolidator } from '../src/lib/server/ai/entity-resolution/v4-transformer/identity-consolidator';
import { V4CandidateMatchResult } from '../src/lib/server/ai/entity-resolution/v4-transformer/types';
import { DEFAULT_V4_2_CONFIG } from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function runPersonLevelRankingTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.2 PERSON-LEVEL RANKING TEST SUITE           ');
  console.log('========================================================================\n');

  const queryInput = {
    name: 'Ravi Kumar',
    dateOfBirth: '1985-05-12',
    fatherName: 'Suresh Kumar',
    address: 'Flat 204, Ganga Apartments, Civil Lines',
    district: 'Jaipur',
    pincode: '302001',
    allowedRegistries: ['revenue_registry', 'health_registry', 'agriculture_registry'] as any,
    consentVerified: true,
  };

  // Mock candidate records from 3 registries for CIT-001 (same citizen) and 1 record for CIT-002 (different citizen)
  const rawCandidates: V4CandidateMatchResult[] = [
    {
      candidateId: 'REV-101',
      citizenId: 'CIT-001',
      registry: 'revenue_registry',
      matchedFields: ['name', 'dob', 'fatherName'],
      fieldScores: {
        nameScore: 0.95,
        dobScore: 1.0,
        fatherScore: 0.92,
        addressScore: 0.0,
        districtScore: 0.0,
        pincodeScore: 0.0,
        embeddingScore: 0.90,
        transformerScore: 0.90,
        structuredScore: 0.88,
      },
      structuredScore: 0.88,
      transformerScore: 0.90,
      hybridScore: 0.89,
      calibratedProbability: 0.89,
      totalScore: 0.89,
      confidenceTier: 'HIGH',
      isCollisionWarning: false,
      explanation: 'Revenue match',
      rawRecord: { id: 'REV-101', citizen_id: 'CIT-001', name: 'Ravi Kumar', dob: '1985-05-12' },
    },
    {
      candidateId: 'HLT-202',
      citizenId: 'CIT-001',
      registry: 'health_registry',
      matchedFields: ['name', 'dob'],
      fieldScores: {
        nameScore: 0.95,
        dobScore: 1.0,
        fatherScore: 0.0,
        addressScore: 0.0,
        districtScore: 0.0,
        pincodeScore: 0.0,
        embeddingScore: 0.88,
        transformerScore: 0.88,
        structuredScore: 0.85,
      },
      structuredScore: 0.85,
      transformerScore: 0.88,
      hybridScore: 0.86,
      calibratedProbability: 0.86,
      totalScore: 0.86,
      confidenceTier: 'HIGH',
      isCollisionWarning: false,
      explanation: 'Health match',
      rawRecord: { id: 'HLT-202', citizen_id: 'CIT-001', beneficiary_name: 'Ravi Kumar', dob: '1985-05-12' },
    },
    {
      candidateId: 'AGR-303',
      citizenId: 'CIT-001',
      registry: 'agriculture_registry',
      matchedFields: ['name', 'address', 'district'],
      fieldScores: {
        nameScore: 0.95,
        dobScore: 0.0,
        fatherScore: 0.0,
        addressScore: 0.85,
        districtScore: 1.0,
        pincodeScore: 0.0,
        embeddingScore: 0.91,
        transformerScore: 0.91,
        structuredScore: 0.82,
      },
      structuredScore: 0.82,
      transformerScore: 0.91,
      hybridScore: 0.85,
      calibratedProbability: 0.85,
      totalScore: 0.85,
      confidenceTier: 'HIGH',
      isCollisionWarning: false,
      explanation: 'Agriculture match',
      rawRecord: { id: 'AGR-303', citizen_id: 'CIT-001', farmer_name: 'Ravi Kumar', village: 'Civil Lines', district: 'Jaipur' },
    },
    // Different Person
    {
      candidateId: 'REV-999',
      citizenId: 'CIT-002',
      registry: 'revenue_registry',
      matchedFields: ['name'],
      fieldScores: {
        nameScore: 0.85,
        dobScore: 0.0,
        fatherScore: 0.0,
        addressScore: 0.0,
        districtScore: 0.0,
        pincodeScore: 0.0,
        embeddingScore: 0.70,
        transformerScore: 0.70,
        structuredScore: 0.50,
      },
      structuredScore: 0.50,
      transformerScore: 0.70,
      hybridScore: 0.55,
      calibratedProbability: 0.55,
      totalScore: 0.55,
      confidenceTier: 'MEDIUM',
      isCollisionWarning: false,
      explanation: 'Another person match',
      rawRecord: { id: 'REV-999', citizen_id: 'CIT-002', name: 'Ravi K. Sharma' },
    },
  ];

  const { consolidatedCandidates, ambiguityDetected } = V4IdentityConsolidator.consolidate(
    queryInput,
    rawCandidates,
    DEFAULT_V4_2_CONFIG.thresholds
  );

  // Assertions
  assert(consolidatedCandidates.length === 2, `Consolidated to 2 distinct person identities (got ${consolidatedCandidates.length})`);
  
  const top1 = consolidatedCandidates[0];
  assert(top1.citizenId === 'CIT-001', 'Top-1 identity is CIT-001');
  assert(top1.identityRecordCount === 3, 'CIT-001 aggregated 3 registry records');
  assert(top1.supportingRegistries?.length === 3, 'CIT-001 lists all 3 supporting registries');
  assert(top1.supportingRecordIds?.length === 3, 'CIT-001 lists all 3 supporting record IDs');
  assert(top1.fieldScores.nameScore === 0.95, 'Name score aggregated');
  assert(top1.fieldScores.dobScore === 1.0, 'DOB score aggregated from revenue/health');
  assert(top1.fieldScores.districtScore === 1.0, 'District score aggregated from agriculture');
  assert(!ambiguityDetected, 'No ambiguity detected between distinct score levels (0.89 vs 0.55)');

  console.log('\n========================================================================');
  console.log('   ALL PERSON-LEVEL RANKING TESTS PASSED (100%)                         ');
  console.log('========================================================================\n');
}

runPersonLevelRankingTests().catch((err) => {
  console.error('[FATAL] Person level ranking test failed:', err);
  process.exit(1);
});
