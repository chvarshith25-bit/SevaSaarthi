import fs from 'fs';
import path from 'path';
import {
  EntityResolutionEngine,
  ENTITY_RESOLUTION_THRESHOLDS,
  EnglishNgramEmbedder,
  getEmbeddingProvider,
  setEmbeddingProvider,
  CrossRegistryGraphCorroborator,
} from '../src/lib/server/ai/entity-resolution/index.ts';
import { normalizeDate } from '../src/lib/server/ai/entity-resolution/normalizer.ts';
import { computeNameSimilarity } from '../src/lib/server/ai/entity-resolution/similarity.ts';
import { evaluateCandidate } from '../src/lib/server/ai/entity-resolution/scorer.ts';
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
  console.log('   SEVA SAARTHI PHASE 5B: AI MODEL 2 EVALUATION SUITE   ');
  console.log('   (Semantic N-Gram Embeddings & Graph Corroboration)   ');
  console.log('========================================================\n');

  await getAuthoritativeDb();

  const dataPath = path.resolve(process.cwd(), 'data/synthetic/all_registries.json');
  const allData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const citizensMap = new Map();
  for (const c of allData.citizens) {
    citizensMap.set(c.citizen_id, c);
  }

  const gtLinks = allData.ground_truth;
  console.log('Total ground truth links to evaluate: ' + gtLinks.length);

  const categoryStats = {
    EXACT: { tp: 0, fp: 0, tn: 0, fn: 0, top1: 0, top3: 0, total: 0 },
    INITIALS: { tp: 0, fp: 0, tn: 0, fn: 0, top1: 0, top3: 0, total: 0 },
    FUZZY_NAME: { tp: 0, fp: 0, tn: 0, fn: 0, top1: 0, top3: 0, total: 0 },
    NON_MATCH_NAME_COLLISION: { tp: 0, fp: 0, tn: 0, fn: 0, top1: 0, top3: 0, total: 0 },
    NON_MATCH_DISTINCT: { tp: 0, fp: 0, tn: 0, fn: 0, top1: 0, top3: 0, total: 0 },
  };

  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;
  let top1Correct = 0;
  let top3Correct = 0;
  let ambiguousCount = 0;
  let collisionTestsPassed = 0;
  let collisionTestsTotal = 0;
  let collisionFalseMatchCount = 0;

  // 1. Strict Blind Evaluation Across Authoritative Ground Truth Set with Semantic Embeddings
  for (const link of gtLinks) {
    const master = citizensMap.get(link.master_citizen_id);
    if (!master) continue;

    // Strict Blind Input: strictly permitted demographic fields only (no IDs, no GT labels)
    const input = {
      name: master.full_name,
      dateOfBirth: master.date_of_birth,
      fatherName: master.father_name || undefined,
      guardianName: master.guardian_name || undefined,
      address: master.address,
      district: master.district,
      pincode: master.pincode,
      allowedRegistries: [link.source_registry],
      consentVerified: true,
      enableSemanticEmbeddings: true,
      enableGraphCorroboration: true,
      purpose: 'Strict Blind Ground Truth Phase 5B Evaluation'
    };

    const result = await EntityResolutionEngine.matchEntity(input);
    if (result.ambiguityDetected) {
      ambiguousCount++;
    }

    const matchedRecord = result.candidates.find(c => c.candidateId === link.source_record_id);
    const isPredictedMatch = matchedRecord && 
      (matchedRecord.totalScore >= 0.70 || matchedRecord.confidenceTier === 'HIGH' || matchedRecord.confidenceTier === 'MEDIUM') &&
      !matchedRecord.isCollisionWarning;

    const stats = categoryStats[link.match_type] || { tp: 0, fp: 0, tn: 0, fn: 0, top1: 0, top3: 0, total: 0 };
    stats.total++;

    const isTop1 = result.bestMatch && result.bestMatch.candidateId === link.source_record_id;
    const isTop3 = result.candidates.slice(0, 3).some(c => c.candidateId === link.source_record_id);

    if (link.ground_truth_match) {
      if (isPredictedMatch) {
        truePositives++;
        stats.tp++;
      } else {
        falseNegatives++;
        stats.fn++;
        console.log('[FN] Link: ' + link.id + ' (' + link.match_type + '), Reg: ' + link.source_registry + ', Rec: ' + link.source_record_id);
      }

      if (isTop1) {
        top1Correct++;
        stats.top1++;
      }
      if (isTop3) {
        top3Correct++;
        stats.top3++;
      }
    } else {
      // Negative Ground Truth Controls
      if (isPredictedMatch) {
        falsePositives++;
        stats.fp++;
        if (link.match_type === 'NON_MATCH_NAME_COLLISION') {
          collisionFalseMatchCount++;
          console.error('[COLLISION FALSE MATCH] Link: ' + link.id + ' matched incorrectly!');
        }
      } else {
        trueNegatives++;
        stats.tn++;
        if (link.match_type === 'NON_MATCH_NAME_COLLISION') {
          collisionTestsPassed++;
        }
      }
      if (link.match_type === 'NON_MATCH_NAME_COLLISION') {
        collisionTestsTotal++;
      }
    }
  }

  const positiveGroundTruthCount = truePositives + falseNegatives;
  const negativeGroundTruthCount = trueNegatives + falsePositives;
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const top1Accuracy = positiveGroundTruthCount > 0 ? top1Correct / positiveGroundTruthCount : 0;
  const top3Recall = positiveGroundTruthCount > 0 ? top3Correct / positiveGroundTruthCount : 0;

  console.log('\n========================================================');
  console.log('         PHASE 5B BENCHMARK METRICS SUMMARY             ');
  console.log('========================================================');
  console.log('True Positives (TP)           : ' + truePositives + ' / ' + positiveGroundTruthCount);
  console.log('False Positives (FP)          : ' + falsePositives);
  console.log('True Negatives (TN)           : ' + trueNegatives + ' / ' + negativeGroundTruthCount);
  console.log('False Negatives (FN)          : ' + falseNegatives);
  console.log('Precision                     : ' + (precision * 100).toFixed(2) + '%');
  console.log('Recall                        : ' + (recall * 100).toFixed(2) + '%');
  console.log('F1 Score                      : ' + (f1 * 100).toFixed(2) + '%');
  console.log('Top-1 Accuracy (on Positives) : ' + (top1Accuracy * 100).toFixed(2) + '%');
  console.log('Top-3 Recall   (on Positives) : ' + (top3Recall * 100).toFixed(2) + '%');
  console.log('Collision Guardrail Tests     : ' + collisionTestsPassed + ' / ' + collisionTestsTotal + ' passed');
  console.log('Collision False Matches       : ' + collisionFalseMatchCount);
  console.log('Ambiguous Flags Detected      : ' + ambiguousCount);
  console.log('========================================================\n');

  console.log('CATEGORY BREAKDOWN:');
  for (const [cat, s] of Object.entries(categoryStats)) {
    const catTotalPos = s.tp + s.fn;
    const catTop1Pct = catTotalPos > 0 ? ((s.top1 / catTotalPos) * 100).toFixed(2) : 'N/A';
    const catPrec = (s.tp + s.fp) > 0 ? ((s.tp / (s.tp + s.fp)) * 100).toFixed(2) : '100.00';
    const catRec = (s.tp + s.fn) > 0 ? ((s.tp / (s.tp + s.fn)) * 100).toFixed(2) : '100.00';
    console.log(' - ' + cat.padEnd(26) + ' | TP:' + String(s.tp).padStart(3) + ' | FP:' + String(s.fp).padStart(2) + ' | TN:' + String(s.tn).padStart(2) + ' | FN:' + String(s.fn).padStart(2) + ' | Top-1:' + catTop1Pct.padStart(6) + '% | Prec:' + catPrec.padStart(6) + '% | Rec:' + catRec.padStart(6) + '%');
  }

  // Mandatory Assertions
  assert(precision === 1.0, 'Precision must remain 100%');
  assert(recall === 1.0, 'Recall must remain 100%');
  assert(f1 === 1.0, 'F1 Score must remain 100%');
  assert(collisionFalseMatchCount === 0, 'Collision False Match count must be 0');
  assert(top3Recall === 1.0, 'Top-3 Recall must be 100%');
  assert(top1Accuracy >= 0.85, 'Top-1 Accuracy must be >= 85%');

  console.log('\n========================================================');
  console.log('      PHASE 5B COMPONENT & EDGE CASE UNIT TESTS         ');
  console.log('========================================================\n');

  // Test 1: Embedding Cosine Similarity and Vector Normalization
  console.log('--- Test 1: English N-Gram Embedding Engine ---');
  const embedder = new EnglishNgramEmbedder(128);
  const vec1 = await embedder.generateEmbedding('Suresh Kumar');
  const vec2 = await embedder.generateEmbedding('Sures Kumar');
  const vec3 = await embedder.generateEmbedding('Deepak Verma');
  
  const sim12 = embedder.computeCosineSimilarity(vec1, vec2);
  const sim13 = embedder.computeCosineSimilarity(vec1, vec3);
  console.log('Cosine similarity ("Suresh Kumar" vs "Sures Kumar"):', sim12.toFixed(4));
  console.log('Cosine similarity ("Suresh Kumar" vs "Deepak Verma"):', sim13.toFixed(4));
  assert(sim12 > 0.85, 'Phonetic variant "Suresh" vs "Sures" must have high cosine similarity (> 0.85)');
  assert(sim13 < 0.60, 'Distinct name "Deepak Verma" must have lower cosine similarity (< 0.60)');

  // Test 2: Address Substring & Contraction Vectorization
  console.log('\n--- Test 2: Address Token Contraction Embeddings ---');
  const addrVec1 = await embedder.generateEmbedding('H.No 12, Cross Road 4, Indiranagar, Bengaluru');
  const addrVec2 = await embedder.generateEmbedding('HNO 12 X RD 4 INDIRANGR BENGALURU');
  const addrSim = embedder.computeCosineSimilarity(addrVec1, addrVec2);
  console.log('Address cosine similarity (Contraction overlap):', addrSim.toFixed(4));
  assert(addrSim > 0.80, 'Address contraction must produce high cosine similarity (> 0.80)');

  // Test 3: Pluggable Architecture Test
  console.log('\n--- Test 3: Pluggable Provider Swap ---');
  const originalProvider = getEmbeddingProvider();
  assert(originalProvider.modelId === 'seva-saarthi-english-subword-v1', 'Default provider must be English subword');
  
  const customProvider = {
    modelId: 'mock-future-indicbert-v2',
    dimension: 256,
    async generateEmbedding(text) {
      return new Float32Array(256).fill(0.1);
    },
    async generateBatchEmbeddings(texts) {
      return texts.map(() => new Float32Array(256).fill(0.1));
    },
    computeCosineSimilarity() {
      return 0.95;
    }
  };
  setEmbeddingProvider(customProvider);
  assert(getEmbeddingProvider().modelId === 'mock-future-indicbert-v2', 'Provider setter must swap active provider');
  setEmbeddingProvider(originalProvider); // Restore original
  assert(getEmbeddingProvider().modelId === 'seva-saarthi-english-subword-v1', 'Original provider restored');

  // Test 4: Cross-Registry Multi-Registry Retrieval with Graph Corroboration
  console.log('\n--- Test 4: Multi-Registry Resolution with Cross-Registry Corroboration ---');
  const multiRegInput = {
    name: 'Kavitha Yadav',
    dateOfBirth: '1987-11-04',
    fatherName: 'Venkatesh Yadav',
    district: 'Bengaluru Urban',
    address: '45, 2nd Main, Indiranagar',
    pincode: '560038',
    allowedRegistries: ['revenue_registry', 'agriculture_registry', 'pan_tax_registry'],
    consentVerified: true,
    enableSemanticEmbeddings: true,
    enableGraphCorroboration: true,
    purpose: 'Multi-Registry Corroboration Verification'
  };
  const multiRes = await EntityResolutionEngine.matchEntity(multiRegInput);
  console.log('Total candidates found across 3 registries:', multiRes.candidates.length);
  assert(multiRes.candidates.length > 0, 'Must retrieve candidates from authorized registries');
  assert(multiRes.bestMatch.confidenceTier === 'HIGH', 'Best match should have HIGH confidence tier');
  console.log('Top match:', multiRes.bestMatch.registry, multiRes.bestMatch.candidateId, 'Score:', multiRes.bestMatch.totalScore);

  // Test 5: DPDP Statutory Consent Enforcement
  console.log('\n--- Test 5: DPDP Consent Enforcement Guardrail ---');
  try {
    await EntityResolutionEngine.matchEntity({
      name: 'Illegal Unconsented Query',
      allowedRegistries: ['revenue_registry'],
      consentVerified: false,
    });
    assert(false, 'Should have thrown DPDP Statutory Consent Violation error');
  } catch (err) {
    assert(err.message.includes('DPDP Statutory Consent Violation'), 'Properly threw DPDP consent error: ' + err.message);
  }

  // Test 6: Strict Collision Guardrail with Same Name / Different Father
  console.log('\n--- Test 6: Homonym Collision Guardrail Protection ---');
  const evalCollision = evaluateCandidate(
    { name: 'Ravi Kumar', fatherName: 'Suresh Kumar', allowedRegistries: ['revenue_registry'], consentVerified: true },
    { name: 'Ravi Kumar', father_name: 'Venkatesh Rao' }
  );
  assert(evalCollision.isCollisionWarning === true, 'Conflicting father name must trigger collision warning');
  assert(evalCollision.confidenceTier === 'AMBIGUOUS', 'Collision must demote confidence to AMBIGUOUS');

  console.log('\n========================================================');
  console.log('  ALL PHASE 5B BENCHMARKS & TEST SUITES PASSED (100%)   ');
  console.log('========================================================\n');

  await closeAuthoritativeDb();
}

main().catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
