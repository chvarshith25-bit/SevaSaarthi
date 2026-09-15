import fs from 'fs';
import path from 'path';
import { EntityResolutionEngineV3, EXPECTED_V3_FEATURE_NAMES } from '../src/lib/server/ai/entity-resolution/index.ts';
import { getAuthoritativeDb, closeAuthoritativeDb } from '../src/lib/server/pg-db.ts';

function assert(condition, message) {
  if (!condition) {
    console.error('[FAIL] ASSERTION FAILED: ' + message);
    process.exit(1);
  }
  console.log('[PASS] ' + message);
}

async function main() {
  console.log('========================================================');
  console.log('   SEVA SAARTHI PHASE 7E.4.1: MODEL 2 V3 INTEGRITY SUITE');
  console.log('========================================================\n');

  await getAuthoritativeDb();

  // 1. Feature Dimension & Model Artifact Integrity Test
  console.log('--- 1. FEATURE DIMENSION & METADATA INTEGRITY ---');
  const modelJsonPath = path.resolve(process.cwd(), 'data/ai/entity-resolution/model-v3.json');
  const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));

  assert(modelJson.feature_names.length === 16, 'model-v3.json must have exactly 16 feature names (got ' + modelJson.feature_names.length + ')');
  assert(modelJson.weights.length === 16, 'model-v3.json must have exactly 16 weights (got ' + modelJson.weights.length + ')');
  assert(!modelJson.feature_names.includes('agreeing_field_count'), 'agreeing_field_count must be completely eliminated');

  for (let i = 0; i < 16; i++) {
    assert(modelJson.feature_names[i] === EXPECTED_V3_FEATURE_NAMES[i], 'Feature index ' + i + ' must match ' + EXPECTED_V3_FEATURE_NAMES[i]);
  }

  // 2. Calibration Temperature Integrity
  console.log('\n--- 2. CALIBRATION TEMPERATURE INTEGRITY ---');
  const runtimeConfig = EntityResolutionEngineV3.getModelConfig();
  assert(typeof modelJson.temperature === 'number' && modelJson.temperature > 0, 'modelJson temperature must be positive number');
  assert(runtimeConfig.temperature === modelJson.temperature, 'Runtime temperature (' + runtimeConfig.temperature + ') must equal model-v3.json (' + modelJson.temperature + ')');

  // 3. Held-Out Pair Test Evaluation
  console.log('\n--- 3. HELD-OUT TEST SPLIT EVALUATION ---');
  const testDataPath = path.resolve(process.cwd(), 'data/ai/entity-resolution/model2-test-v3.json');
  const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
  console.log('Loaded ' + testData.length + ' test samples from held-out V3 test split.');

  let tp = 0, fp = 0, tn = 0, fn = 0;
  let collisionTests = 0, collisionPassed = 0;
  let brierSum = 0;
  const startTime = Date.now();

  for (const sample of testData) {
    const input = {
      name: sample.query.name || sample.query.full_name,
      dateOfBirth: sample.query.dob || sample.query.dateOfBirth,
      fatherName: sample.query.father_name || sample.query.fatherName,
      address: sample.query.address,
      district: sample.query.district,
      pincode: sample.query.pincode,
      allowedRegistries: ['revenue_registry', 'education_registry', 'agriculture_registry', 'health_registry', 'housing_registry', 'land_registry', 'pan_tax_registry'],
      consentVerified: true,
      enableSemanticEmbeddings: true,
      enableGraphCorroboration: true,
    };

    const regKey = sample.candidate.registry && sample.candidate.registry.includes('_registry') ? sample.candidate.registry : ((sample.candidate.registry || 'revenue') + '_registry');
    const candRaw = {
      id: 'TEST-REC',
      citizen_id: sample.candidate.master_citizen_id || sample.candidate.citizen_id,
      name: sample.candidate.name || sample.candidate.full_name,
      dob: sample.candidate.dob || sample.candidate.dateOfBirth,
      father_name: sample.candidate.father_name || sample.candidate.fatherName,
      address: sample.candidate.address || sample.candidate.village,
      district: sample.candidate.district,
      pincode: sample.candidate.pincode,
    };

    const evaluated = EntityResolutionEngineV3.evaluateCandidateV3(input, candRaw, regKey, sample.graph_corrob || 0.0);
    const prob = evaluated.totalScore;
    const isPredMatch = prob >= 0.60 ? 1 : 0;
    const isTrueMatch = sample.is_match;

    brierSum += (prob - isTrueMatch) ** 2;

    if (sample.match_type === 'HOMONYM_COLLISION' || sample.is_collision) {
      collisionTests++;
      if (evaluated.isCollisionWarning || prob <= 0.35 || evaluated.confidenceTier === 'AMBIGUOUS') {
        collisionPassed++;
      }
    }

    if (isTrueMatch === 1 && isPredMatch === 1) tp++;
    else if (isTrueMatch === 0 && isPredMatch === 1) fp++;
    else if (isTrueMatch === 0 && isPredMatch === 0) tn++;
    else if (isTrueMatch === 1 && isPredMatch === 0) fn++;
  }

  const elapsedMs = Date.now() - startTime;
  const precision = (tp + fp) > 0 ? (tp / (tp + fp)) * 100 : 100;
  const recall = (tp + fn) > 0 ? (tp / (tp + fn)) * 100 : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = ((tp + tn) / testData.length) * 100;
  const brierScore = (brierSum / testData.length).toFixed(4);

  console.log('Accuracy: ' + accuracy.toFixed(2) + '%');
  console.log('Precision: ' + precision.toFixed(2) + '%');
  console.log('Recall: ' + recall.toFixed(2) + '%');
  console.log('Macro F1: ' + f1.toFixed(2) + '%');
  console.log('Brier Score: ' + brierScore);
  if (collisionTests > 0) {
    console.log('Homonym Collision Defenses: ' + collisionPassed + '/' + collisionTests + ' passed (' + ((collisionPassed / collisionTests) * 100).toFixed(1) + '%)\n');
  }

  assert(precision >= 65.0, 'Precision >= 65.0% (got ' + precision.toFixed(2) + '%)');
  assert(accuracy >= 60.0, 'Accuracy >= 60.0% (got ' + accuracy.toFixed(2) + '%)');

  // 4. Missingness Monotonicity Safety Test
  console.log('\n--- 4. MISSINGNESS MONOTONICITY & PHANTOM PROBABILITY TEST ---');
  const baseQuery = {
    name: 'Suresh Kumar Reddy',
    dateOfBirth: '1982-04-12',
    fatherName: 'Venkat Reddy',
    address: 'H.No 12-4, Temple Road, Warangal',
    district: 'Warangal',
    pincode: '506001',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  };
  const fullCand = {
    id: 'REC-1',
    name: 'Suresh Kumar Reddy',
    dob: '1982-04-12',
    father_name: 'Venkat Reddy',
    address: 'H.No 12-4, Temple Road, Warangal',
    district: 'Warangal',
    pincode: '506001',
  };

  const pFull = EntityResolutionEngineV3.evaluateCandidateV3(baseQuery, fullCand, 'revenue_registry').totalScore;
  const pNoDob = EntityResolutionEngineV3.evaluateCandidateV3(baseQuery, { ...fullCand, dob: undefined }, 'revenue_registry').totalScore;
  const pNoFat = EntityResolutionEngineV3.evaluateCandidateV3(baseQuery, { ...fullCand, dob: undefined, father_name: undefined }, 'revenue_registry').totalScore;
  const pNoAddr = EntityResolutionEngineV3.evaluateCandidateV3(baseQuery, { ...fullCand, dob: undefined, father_name: undefined, address: undefined }, 'revenue_registry').totalScore;
  const pNameOnly = EntityResolutionEngineV3.evaluateCandidateV3(baseQuery, { ...fullCand, dob: undefined, father_name: undefined, address: undefined, district: undefined, pincode: undefined }, 'revenue_registry').totalScore;

  console.log('Full Match: ' + pFull + ', No DOB: ' + pNoDob + ', No Fat: ' + pNoFat + ', No Addr: ' + pNoAddr + ', Name Only: ' + pNameOnly);
  assert(pNoDob <= pFull, 'Stripping DOB must never increase score');
  assert(pNoFat <= pNoDob, 'Stripping Father must never increase score');
  assert(pNoAddr <= pNoFat, 'Stripping Address must never increase score');
  assert(pNameOnly <= pNoAddr, 'Name-only candidate must have lowest score among positive matches');

  // 5. Deterministic Repeatability
  console.log('\n--- 5. DETERMINISTIC REPEATABILITY TEST ---');
  const pass1 = await EntityResolutionEngineV3.matchEntityV3(baseQuery);
  const pass2 = await EntityResolutionEngineV3.matchEntityV3(baseQuery);
  assert(pass1.candidates.length === pass2.candidates.length, 'Repeatability candidate count matches');
  if (pass1.candidates.length > 0) {
    assert(pass1.candidates[0].candidateId === pass2.candidates[0].candidateId, 'Repeatability top candidate ID matches');
    assert(pass1.candidates[0].totalScore === pass2.candidates[0].totalScore, 'Repeatability top candidate score matches');
  }

  // 6. DPDP Statutory Consent Enforcement
  console.log('\n--- 6. DPDP STATUTORY CONSENT ENFORCEMENT ---');
  let consentBlocked = false;
  try {
    await EntityResolutionEngineV3.matchEntityV3({ ...baseQuery, consentVerified: false });
  } catch (err) {
    consentBlocked = true;
  }
  assert(consentBlocked, 'matchEntityV3 must throw when consentVerified is false');

  console.log('\n========================================================');
  console.log('   ALL PHASE 7E.4.1 INTEGRITY TESTS PASSED');
  console.log('========================================================\n');

  await closeAuthoritativeDb();
}

main().catch((err) => {
  console.error('Fatal error in Model 2 V3 integrity test:', err);
  process.exit(1);
});
