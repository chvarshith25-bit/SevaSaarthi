import fs from 'fs';
import path from 'path';
import { EntityResolutionEngineV2 } from '../src/lib/server/ai/entity-resolution/index.ts';
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
  console.log('   SEVA SAARTHI PHASE 7E: AI MODEL 2 V2 EVALUATION SUITE');
  console.log('========================================================\n');

  await getAuthoritativeDb();

  // 1. Load Test Dataset
  const testDataPath = path.resolve(process.cwd(), 'data/ai/entity-resolution/model2-test.json');
  const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
  console.log(`Loaded ${testData.length} test samples from held-out test split.`);

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let collisionTests = 0;
  let collisionPassed = 0;
  let brierSum = 0;

  const startTime = Date.now();

  for (const sample of testData) {
    const input = {
      name: sample.query.full_name,
      dateOfBirth: sample.query.dob,
      fatherName: sample.query.father_name,
      address: sample.query.address,
      district: sample.query.district,
      pincode: sample.query.pincode,
      allowedRegistries: ['revenue_registry', 'education_registry', 'agriculture_registry', 'health_registry', 'housing_registry', 'land_registry', 'pan_tax_registry'],
      consentVerified: true,
      enableSemanticEmbeddings: true,
      enableGraphCorroboration: true,
    };

    const regKey = sample.candidate.registry.includes('_registry') ? sample.candidate.registry : `${sample.candidate.registry}_registry`;
    const candRaw = {
      id: 'TEST-REC',
      citizen_id: sample.candidate.master_citizen_id,
      name: sample.candidate.name,
      dob: sample.candidate.dob,
      father_name: sample.candidate.father_name,
      address: sample.candidate.address,
      district: sample.candidate.district,
      pincode: sample.candidate.pincode,
    };

    const evaluated = EntityResolutionEngineV2.evaluateCandidateV2(input, candRaw, regKey, sample.graph_corrob || 1.0);
    const prob = evaluated.totalScore;
    const isPredMatch = prob >= 0.60 ? 1 : 0;
    const isTrueMatch = sample.is_match;

    brierSum += (prob - isTrueMatch) ** 2;

    if (sample.match_type === 'HOMONYM_COLLISION') {
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
  const avgLatencyMs = (elapsedMs / testData.length).toFixed(2);

  const precision = (tp + fp) > 0 ? (tp / (tp + fp)) * 100 : 100;
  const recall = (tp + fn) > 0 ? (tp / (tp + fn)) * 100 : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = ((tp + tn) / testData.length) * 100;
  const brierScore = (brierSum / testData.length).toFixed(4);

  console.log('\n--- EVALUATION METRICS ON HELD-OUT TEST SPLIT ---');
  console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
  console.log(`Precision: ${precision.toFixed(2)}%`);
  console.log(`Recall: ${recall.toFixed(2)}%`);
  console.log(`Macro F1: ${f1.toFixed(2)}%`);
  console.log(`Brier Score: ${brierScore}`);
  console.log(`Average Latency per Match: ${avgLatencyMs} ms`);
  console.log(`Homonym Collision Defenses: ${collisionPassed}/${collisionTests} passed (${((collisionPassed/collisionTests)*100).toFixed(1)}%)\n`);

  assert(precision >= 95.0, `Precision must be >= 95.0% (got ${precision.toFixed(2)}%)`);
  assert(recall >= 95.0, `Recall must be >= 95.0% (got ${recall.toFixed(2)}%)`);
  assert(collisionPassed === collisionTests, `All homonym collision guardrails must trigger (got ${collisionPassed}/${collisionTests})`);

  // 2. DPDP Statutory Consent Enforcement Verification
  console.log('\n--- DPDP STATUTORY CONSENT ENFORCEMENT ---');
  let consentBlocked = false;
  try {
    await EntityResolutionEngineV2.matchEntityV2({
      name: 'Test Citizen',
      allowedRegistries: ['revenue_registry'],
      consentVerified: false, // Violation
    });
  } catch (err) {
    consentBlocked = true;
  }
  assert(consentBlocked, 'Model 2 V2 must reject unconsented entity resolution requests with DPDP violation');

  console.log('\n========================================================');
  console.log('   AI MODEL 2 V2 EVALUATION SUITE COMPLETED SUCCESSFULLY ');
  console.log('========================================================\n');

  await closeAuthoritativeDb();
}

main().catch(async (err) => {
  console.error('Fatal Error:', err);
  await closeAuthoritativeDb();
  process.exit(1);
});
