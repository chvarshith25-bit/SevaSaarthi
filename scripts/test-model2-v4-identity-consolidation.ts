/**
 * Seva Saarthi Model 2 V4 - Identity Consolidation & Cluster Propagation Tests
 */

import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function runTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4 IDENTITY CONSOLIDATION TESTS                 ');
  console.log('========================================================================\n');

  await getAuthoritativeDb();
  const v4Engine = new EntityResolutionEngineV4();

  // Test 1: Single citizen represented in multiple registries
  console.log('--- Test 1: Multi-Registry Consolidation (CIT-00001) ---');
  const res1 = await v4Engine.resolve({
    name: 'Amit Patel',
    dateOfBirth: '1976-02-02',
    guardianName: 'Guardian 1',
    address: 'H.No 2/2, Cross Road 2, Vijayawada',
    district: 'Vijayawada',
    allowedRegistries: ['revenue_registry', 'health_registry', 'pan_tax_registry'],
    consentVerified: true,
  });

  assert(res1.bestMatch?.citizenId === 'CIT-00001', 'Best match is consolidated CIT-00001');
  assert(res1.bestMatch?.supportingRegistries!.length >= 2, `Corroborated across multiple registries (${res1.bestMatch?.supportingRegistries?.length})`);
  assert(res1.bestMatch?.supportingRecordIds!.length >= 2, `Tracks supporting record IDs (${res1.bestMatch?.supportingRecordIds?.length})`);

  // Count candidates for CIT-00001
  const cit1List = res1.candidates.filter((c) => c.citizenId === 'CIT-00001');
  assert(cit1List.length === 1, `CIT-00001 consolidated to exactly 1 candidate (found ${cit1List.length})`);
  assert(res1.ambiguityDetected === false, 'No artificial self-tie ambiguity between records of the same citizen');

  // Test 2: Collision Propagation across Cluster
  console.log('\n--- Test 2: Collision Propagation across Identity Cluster ---');
  const res2 = await v4Engine.resolve({
    name: 'Amit Patel',
    dateOfBirth: '1940-01-01', // Conflict
    allowedRegistries: ['revenue_registry', 'pan_tax_registry'],
    consentVerified: true,
  });

  const cit1Colliding = res2.candidates.filter((c) => c.citizenId === 'CIT-00001');
  assert(cit1Colliding.length === 1, 'CIT-00001 cluster collapsed into 1 entry');
  assert(cit1Colliding[0].isCollisionWarning === true, 'Collision flag propagated across entire cluster');
  assert(cit1Colliding[0].confidenceTier === 'AMBIGUOUS', 'Demoted to AMBIGUOUS');
  assert(cit1Colliding[0].totalScore <= 0.25, `Cluster score capped <= 0.25 (got ${cit1Colliding[0].totalScore})`);

  // Test 3: Multiple Distinct Citizens
  console.log('\n--- Test 3: Multiple Distinct Citizens Partitioning ---');
  const res3 = await v4Engine.resolve({
    name: 'Kumar',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  });
  assert(res3.candidates.length >= 2, `Retrieved distinct candidate pool (${res3.candidates.length})`);
  const ids = res3.candidates.map((c) => c.citizenId || c.candidateId);
  const uniqueIds = new Set(ids);
  assert(uniqueIds.size === ids.length, 'Every consolidated candidate belongs to a unique citizen ID');

  console.log('\n========================================================================');
  console.log('   ALL V4 IDENTITY CONSOLIDATION TESTS PASSED (100%)                    ');
  console.log('========================================================================');
}

runTests().catch((err) => {
  console.error('[FATAL] Identity consolidation test failure:', err);
  process.exit(1);
});
