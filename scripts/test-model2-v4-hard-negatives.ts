/**
 * Seva Saarthi Model 2 V4 - Critical Safety & Hard Negatives Test Suite
 * 
 * Verifies that:
 * 1. UNSAFE AUTOMATIC IDENTITY MATCHES = 0
 * 2. HIGH-CONFIDENCE HOMONYM FALSE MATCHES = 0
 * 3. Transformer semantic similarity (even 0.99) NEVER overrides demographic collision guardrails.
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
  console.log('   SEVA SAARTHI: MODEL 2 V4 CRITICAL SAFETY & HARD NEGATIVES TESTS      ');
  console.log('========================================================================\n');

  await getAuthoritativeDb();
  const v4Engine = new EntityResolutionEngineV4();

  let unsafeAutomaticMatches = 0;
  let highConfHomonymFalseMatches = 0;

  // Case 1: Same Name + Different DOB (Severe Contradiction)
  console.log('--- Case 1: Same Name + Different DOB ---');
  const res1 = await v4Engine.resolve({
    name: 'Amit Patel',
    dateOfBirth: '1940-01-01', // True DOB is 1976-02-02
    allowedRegistries: ['revenue_registry', 'pan_tax_registry'],
    consentVerified: true,
  });
  assert(res1.bestMatch !== undefined, 'Candidate retrieved');
  assert(res1.bestMatch?.isCollisionWarning === true, 'Flagged with collision warning');
  assert(res1.bestMatch?.confidenceTier === 'AMBIGUOUS', 'Demoted to AMBIGUOUS');
  assert(res1.bestMatch?.totalScore! <= 0.25, `Total score capped <= 0.25 (got ${res1.bestMatch?.totalScore})`);
  assert(res1.ambiguityDetected === true, 'Ambiguity flagged for officer review');
  if (res1.bestMatch?.confidenceTier === 'HIGH') {
    highConfHomonymFalseMatches++;
    unsafeAutomaticMatches++;
  }

  // Case 2: Same Name + Different Father Name
  console.log('\n--- Case 2: Same Name + Different Father Name ---');
  const res2 = await v4Engine.resolve({
    name: 'Kavitha Yadav',
    fatherName: 'Wrong Contradictory Father', // True father: Gopal Yadav
    dateOfBirth: '1977-03-03',
    allowedRegistries: ['revenue_registry', 'education_registry'],
    consentVerified: true,
  });
  assert(res2.bestMatch?.isCollisionWarning === true, 'Father conflict triggered collision warning');
  assert(res2.bestMatch?.confidenceTier === 'AMBIGUOUS', 'Demoted to AMBIGUOUS');
  assert(res2.bestMatch?.totalScore! <= 0.25, `Score capped <= 0.25 (got ${res2.bestMatch?.totalScore})`);
  if (res2.bestMatch?.confidenceTier === 'HIGH') {
    highConfHomonymFalseMatches++;
    unsafeAutomaticMatches++;
  }

  // Case 3: Same Name + Different District
  console.log('\n--- Case 3: Same Name + Different District ---');
  const res3 = await v4Engine.resolve({
    name: 'Amit Patel',
    district: 'Kanyakumari', // True district: Vijayawada
    allowedRegistries: ['revenue_registry', 'land_registry'],
    consentVerified: true,
  });
  assert(res3.bestMatch?.confidenceTier === 'AMBIGUOUS' || res3.ambiguityDetected, 'District mismatch demoted to AMBIGUOUS / Manual Review');
  assert(res3.bestMatch?.confidenceTier !== 'HIGH', 'District contradiction is NEVER HIGH confidence');

  // Case 4: Same Name + Different Address
  console.log('\n--- Case 4: Same Name + Different Address & District ---');
  const res4 = await v4Engine.resolve({
    name: 'Amit Patel',
    address: 'Completely Different Address, Sector 9, Pune',
    district: 'Pune',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  });
  assert(res4.bestMatch?.confidenceTier === 'AMBIGUOUS' || res4.ambiguityDetected, 'Address + District contradiction routed to manual review');

  // Case 5: Same Name + All Demographic Conflicts
  console.log('\n--- Case 5: Same Name + All Demographic Conflicts ---');
  const res5 = await v4Engine.resolve({
    name: 'Amit Patel',
    dateOfBirth: '1930-10-10',
    fatherName: 'Unrelated Person',
    district: 'Shimla',
    address: 'The Mall Road, Shimla',
    allowedRegistries: ['revenue_registry', 'pan_tax_registry', 'education_registry'],
    consentVerified: true,
  });
  assert(res5.bestMatch?.isCollisionWarning === true, 'All demographic conflicts detected');
  assert(res5.bestMatch?.totalScore! <= 0.25, `Score capped at <= 0.25 (got ${res5.bestMatch?.totalScore})`);
  assert(res5.bestMatch?.confidenceTier === 'AMBIGUOUS', 'Confidence tier is AMBIGUOUS');

  // Case 6: Sparse Candidate + Contradictory Complete Candidate (Sparse Bypass Prevention)
  console.log('\n--- Case 6: Sparse Row Cannot Bypass Contradiction in Complete Row ---');
  const res6 = await v4Engine.resolve({
    name: 'Amit Patel',
    dateOfBirth: '1940-01-01',
    allowedRegistries: ['revenue_registry', 'pan_tax_registry'],
    consentVerified: true,
  });
  const cit1Candidates = res6.candidates.filter((c) => c.citizenId === 'CIT-00001');
  assert(cit1Candidates.length === 1, `Consolidated to 1 candidate for CIT-00001 (found ${cit1Candidates.length})`);
  assert(cit1Candidates[0].isCollisionWarning === true, 'Collision propagated across identity');
  assert(cit1Candidates[0].totalScore <= 0.25, `Identity score capped <= 0.25 (got ${cit1Candidates[0].totalScore})`);

  // Case 7: Same Person Across Multiple Registries (Legitimate Match)
  console.log('\n--- Case 7: Same Person Across Multiple Registries ---');
  const res7 = await v4Engine.resolve({
    name: 'Amit Patel',
    dateOfBirth: '1976-02-02',
    address: 'H.No 2/2, Cross Road 2, Vijayawada',
    district: 'Vijayawada',
    allowedRegistries: ['revenue_registry', 'health_registry', 'pan_tax_registry'],
    consentVerified: true,
  });
  assert(res7.bestMatch?.citizenId === 'CIT-00001', 'Correctly identified CIT-00001');
  assert(res7.bestMatch?.supportingRegistries!.length >= 2, `Corroborated across multiple registries (${res7.bestMatch?.supportingRegistries?.length})`);
  assert(res7.bestMatch?.isCollisionWarning === false, 'No false collision on legitimate match');

  // Case 8: Two Genuinely Different Citizens with Common Surname
  console.log('\n--- Case 8: Two Genuinely Different Citizens with Common Surname ---');
  const res8 = await v4Engine.resolve({
    name: 'Patel',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  });
  assert(res8.candidates.length >= 2, `Found multiple candidates (${res8.candidates.length})`);
  const uniqueCitizenIds = new Set(res8.candidates.map((c) => c.citizenId));
  assert(uniqueCitizenIds.size === res8.candidates.length, 'Every candidate belongs to a DISTINCT citizen ID');

  // Case 9: Cross-Language Homonym with Conflicting DOB
  console.log('\n--- Case 9: Cross-Language Homonym with Conflicting DOB ---');
  const res9 = await v4Engine.resolve({
    name: 'अमित पटेल', // Hindi representation of Amit Patel
    dateOfBirth: '1935-05-05', // Conflicting DOB
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  });
  assert(res9.bestMatch?.isCollisionWarning === true, 'Cross-language homonym with DOB conflict flagged with collision');
  assert(res9.bestMatch?.confidenceTier === 'AMBIGUOUS', 'Cross-language conflict demoted to AMBIGUOUS');
  assert(res9.bestMatch?.totalScore! <= 0.25, `Cross-language conflict score capped <= 0.25 (got ${res9.bestMatch?.totalScore})`);

  // Case 10: Transliteration Collision with Conflicting Father
  console.log('\n--- Case 10: Transliteration Collision with Conflicting Father ---');
  const res10 = await v4Engine.resolve({
    name: 'Deepak Nayudu',
    fatherName: 'Different Father 88',
    dateOfBirth: '1978-04-04',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  });
  assert(res10.bestMatch?.isCollisionWarning === true || res10.bestMatch?.confidenceTier === 'AMBIGUOUS' || res10.ambiguityDetected, 'Transliteration collision flagged for manual review');
  assert(res10.bestMatch?.confidenceTier !== 'HIGH', 'Transliteration collision NEVER HIGH confidence');

  console.log('\n--- SAFETY ASSERTION CHECKS ---');
  assert(unsafeAutomaticMatches === 0, `UNSAFE AUTOMATIC IDENTITY MATCHES = 0 (got ${unsafeAutomaticMatches})`);
  assert(highConfHomonymFalseMatches === 0, `HIGH-CONFIDENCE HOMONYM FALSE MATCHES = 0 (got ${highConfHomonymFalseMatches})`);

  console.log('\n========================================================================');
  console.log('   ALL 10 CRITICAL SAFETY & HARD-NEGATIVE TESTS PASSED (100%)           ');
  console.log('========================================================================');
}

runTests().catch((err) => {
  console.error('[FATAL] Hard negative safety test failure:', err);
  process.exit(1);
});
