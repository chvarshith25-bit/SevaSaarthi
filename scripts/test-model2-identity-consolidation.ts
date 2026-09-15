import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function runTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V3.1 IDENTITY CONSOLIDATION & SAFETY TESTS      ');
  console.log('========================================================================\n');

  // Test A: Same name + conflicting DOB across two registries
  console.log('--- Test A: Same Name + Conflicting DOB across two registries ---');
  const resA = await EntityResolutionEngineV3.matchEntityV3({
    name: 'Amit Patel',
    dateOfBirth: '1940-01-01', // Conflict with true DOB (1976-02-02)
    allowedRegistries: ['revenue_registry', 'pan_tax_registry'],
    consentVerified: true,
  });
  assert(resA.bestMatch !== undefined, 'Found candidate for Amit Patel');
  assert(resA.bestMatch?.isCollisionWarning === true, 'Best match flagged with isCollisionWarning: true');
  assert(resA.bestMatch?.confidenceTier === 'AMBIGUOUS', 'Confidence tier demoted to AMBIGUOUS');
  assert(resA.bestMatch?.totalScore! <= 0.25, `Total score capped <= 0.25 (got ${resA.bestMatch?.totalScore})`);
  assert(resA.ambiguityDetected === true, 'Ambiguity detected flagged on response');

  // Test B: Same name + conflicting Father across two registries
  console.log('\n--- Test B: Same Name + Conflicting Father across two registries ---');
  const resB = await EntityResolutionEngineV3.matchEntityV3({
    name: 'Kavitha Yadav',
    dateOfBirth: '1977-03-03',
    fatherName: 'Completely Wrong Father Name', // True father: Gopal Yadav
    allowedRegistries: ['revenue_registry', 'education_registry'],
    consentVerified: true,
  });
  assert(resB.bestMatch?.isCollisionWarning === true, 'Conflicting father triggered isCollisionWarning');
  assert(resB.bestMatch?.confidenceTier === 'AMBIGUOUS', 'Conflicting father demoted to AMBIGUOUS');
  assert(resB.bestMatch?.totalScore! <= 0.25, `Conflicting father score capped <= 0.25 (got ${resB.bestMatch?.totalScore})`);

  // Test C: Same name + conflicting District across two registries
  console.log('\n--- Test C: Same Name + Conflicting District across two registries ---');
  const resC = await EntityResolutionEngineV3.matchEntityV3({
    name: 'Amit Patel',
    district: 'Kanyakumari',
    pincode: '629001',
    allowedRegistries: ['revenue_registry', 'land_registry'],
    consentVerified: true,
  });
  assert(resC.bestMatch?.confidenceTier === 'AMBIGUOUS' || resC.ambiguityDetected, 'Conflicting district routed to AMBIGUOUS / Manual Review');

  // Test D: Complete contradictory row + sparse same-person row
  console.log('\n--- Test D: Complete Contradictory Row + Sparse Same-Person Row ---');
  const resD = await EntityResolutionEngineV3.matchEntityV3({
    name: 'Amit Patel',
    dateOfBirth: '1940-01-01',
    allowedRegistries: ['revenue_registry', 'pan_tax_registry'],
    consentVerified: true,
  });
  const cit1Candidates = resD.candidates.filter(c => c.citizenId === 'CIT-00001');
  assert(cit1Candidates.length === 1, `CIT-00001 consolidated to exactly 1 candidate (found ${cit1Candidates.length})`);
  assert(cit1Candidates[0].isCollisionWarning === true, 'CIT-00001 consolidated candidate has collision warning');
  assert(cit1Candidates[0].totalScore <= 0.25, `CIT-00001 score capped <= 0.25 (got ${cit1Candidates[0].totalScore})`);

  // Test E: Same citizen represented in 3+ registries
  console.log('\n--- Test E: Same citizen represented in 3+ registries ---');
  const resE = await EntityResolutionEngineV3.matchEntityV3({
    name: 'Amit Patel',
    dateOfBirth: '1976-02-02',
    guardianName: 'Guardian 1',
    address: 'H.No 2/2, Cross Road 2, Vijayawada',
    district: 'Vijayawada',
    allowedRegistries: ['revenue_registry', 'health_registry', 'pan_tax_registry'],
    consentVerified: true,
  });
  assert(resE.bestMatch?.citizenId === 'CIT-00001', 'Best match is CIT-00001');
  assert(resE.bestMatch?.confidenceTier === 'HIGH' || resE.bestMatch?.confidenceTier === 'MEDIUM', `Best match tier is HIGH/MEDIUM (got ${resE.bestMatch?.confidenceTier})`);
  assert(resE.bestMatch?.supportingRegistries!.length >= 2, `Corroborated across multiple registries (found ${resE.bestMatch?.supportingRegistries?.length})`);
  assert(resE.ambiguityDetected === false, 'No artificial self-tie ambiguity between records of the same person');

  // Test F: Two genuinely different citizens with same name
  console.log('\n--- Test F: Two genuinely different citizens with same name ---');
  const resF = await EntityResolutionEngineV3.matchEntityV3({
    name: 'Patel',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  });
  assert(resF.candidates.length >= 2, `Retrieved multiple distinct citizen candidates (found ${resF.candidates.length})`);
  const distinctCitizenIds = new Set(resF.candidates.map(c => c.citizenId));
  assert(distinctCitizenIds.size === resF.candidates.length, 'Every candidate in list belongs to a DISTINCT citizen ID');

  // Test G: Clean distinct negative query
  console.log('\n--- Test G: Clean Distinct Negative Query ---');
  const resG = await EntityResolutionEngineV3.matchEntityV3({
    name: 'NonExistent Citizen XYZ99',
    allowedRegistries: ['revenue_registry', 'health_registry'],
    consentVerified: true,
  });
  assert(resG.candidates.length === 0, 'Zero candidates found for non-existent citizen');

  console.log('\n========================================================================');
  console.log('   ALL IDENTITY CONSOLIDATION & SAFETY TESTS PASSED (100%)              ');
  console.log('========================================================================\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
