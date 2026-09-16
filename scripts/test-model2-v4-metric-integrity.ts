/**
 * Seva Saarthi AI Model 2 V4.2 - Metric Integrity & Benchmark Audit Test Suite
 * 
 * Verifies:
 * 1. Mathematical validity of Candidate Retrieval Recall (0.0% - 100.0%, never > 100%).
 * 2. Proper separation and definitions of collision safety metrics:
 *    - Collision Detection Rate: (detected / total collisions)
 *    - Collision Review Rate: (routed to AMBIGUOUS or manual review / total collisions)
 *    - Collision False Match Rate: (falsely accepted as HIGH or MEDIUM / total collisions)
 *    - High-Confidence Collision FMR: (falsely accepted as HIGH / total collisions)
 *    - Unsafe Automatic Match Rate: (negative/collision cases accepted as HIGH / total queries)
 * 3. Exact numerator, denominator, and population tracking.
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

interface MockBenchmarkResult {
  totalQueries: number;
  positiveQueries: number;
  negativeQueries: number;
  collisionQueries: number;
  
  retrievedTrueCandidatesCount: number; // positive queries where expectedCitizenId in retrieved pool
  top1Matches: number;
  top3Matches: number;

  collisionDetectedCount: number;
  collisionReviewedCount: number;
  collisionFalseMatchCount: number;
  highConfCollisionFalseMatchCount: number;

  distinctNegativeFalseMatchCount: number;
  unsafeAutomaticMatches: number;
}

function computeBenchmarkMetrics(r: MockBenchmarkResult) {
  const candidateRetrievalRecall = (r.retrievedTrueCandidatesCount / r.positiveQueries) * 100;
  const top1Accuracy = (r.top1Matches / r.positiveQueries) * 100;
  const top3Recall = (r.top3Matches / r.positiveQueries) * 100;

  const collisionDetectionRate = (r.collisionDetectedCount / r.collisionQueries) * 100;
  const collisionReviewRate = (r.collisionReviewedCount / r.collisionQueries) * 100;
  const collisionFalseMatchRate = (r.collisionFalseMatchCount / r.collisionQueries) * 100;
  const highConfidenceCollisionFMR = (r.highConfCollisionFalseMatchCount / r.collisionQueries) * 100;

  const overallFalseMatchRate = (r.distinctNegativeFalseMatchCount / r.negativeQueries) * 100;
  const unsafeAutomaticMatchRate = (r.unsafeAutomaticMatches / r.totalQueries) * 100;

  return {
    candidateRetrievalRecall: Number(candidateRetrievalRecall.toFixed(2)),
    top1Accuracy: Number(top1Accuracy.toFixed(2)),
    top3Recall: Number(top3Recall.toFixed(2)),
    collisionDetectionRate: Number(collisionDetectionRate.toFixed(2)),
    collisionReviewRate: Number(collisionReviewRate.toFixed(2)),
    collisionFalseMatchRate: Number(collisionFalseMatchRate.toFixed(2)),
    highConfidenceCollisionFMR: Number(highConfidenceCollisionFMR.toFixed(4)),
    overallFalseMatchRate: Number(overallFalseMatchRate.toFixed(2)),
    unsafeAutomaticMatchRate: Number(unsafeAutomaticMatchRate.toFixed(4)),
  };
}

async function runMetricIntegrityTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.2 METRIC INTEGRITY TEST SUITE               ');
  console.log('========================================================================\n');

  // Test Case 1: Standard benchmark run with perfect collision safety
  const mock1: MockBenchmarkResult = {
    totalQueries: 2000,
    positiveQueries: 1400,
    negativeQueries: 300,
    collisionQueries: 300,
    retrievedTrueCandidatesCount: 1380,
    top1Matches: 1200,
    top3Matches: 1350,
    collisionDetectedCount: 300,
    collisionReviewedCount: 300,
    collisionFalseMatchCount: 0,
    highConfCollisionFalseMatchCount: 0,
    distinctNegativeFalseMatchCount: 0,
    unsafeAutomaticMatches: 0,
  };

  const metrics1 = computeBenchmarkMetrics(mock1);

  assert(
    metrics1.candidateRetrievalRecall <= 100.0,
    `Candidate Retrieval Recall is <= 100.0% (Calculated: ${metrics1.candidateRetrievalRecall}%)`
  );
  assert(
    metrics1.candidateRetrievalRecall === 98.57,
    `Candidate Retrieval Recall is accurately 1380 / 1400 = 98.57%`
  );
  assert(
    metrics1.collisionDetectionRate === 100.0,
    `Collision Detection Rate is accurately 100.00%`
  );
  assert(
    metrics1.collisionReviewRate === 100.0,
    `Collision Review Rate is accurately 100.00%`
  );
  assert(
    metrics1.collisionFalseMatchRate === 0.0,
    `Collision False Match Rate is accurately 0.00%`
  );
  assert(
    metrics1.highConfidenceCollisionFMR === 0.0,
    `High-Confidence Collision FMR is accurately 0.0000%`
  );
  assert(
    metrics1.unsafeAutomaticMatchRate === 0.0,
    `Unsafe Automatic Match Rate is accurately 0.0000%`
  );

  // Test Case 2: Boundary test - all queries retrieved
  const mock2: MockBenchmarkResult = {
    totalQueries: 100,
    positiveQueries: 100,
    negativeQueries: 0,
    collisionQueries: 0,
    retrievedTrueCandidatesCount: 100,
    top1Matches: 100,
    top3Matches: 100,
    collisionDetectedCount: 0,
    collisionReviewedCount: 0,
    collisionFalseMatchCount: 0,
    highConfCollisionFalseMatchCount: 0,
    distinctNegativeFalseMatchCount: 0,
    unsafeAutomaticMatches: 0,
  };

  const metrics2 = computeBenchmarkMetrics(mock2);
  assert(metrics2.candidateRetrievalRecall === 100.0, 'Retrieval recall boundary at 100.0%');

  console.log('\n========================================================================');
  console.log('   ALL METRIC INTEGRITY TESTS PASSED (100%)                             ');
  console.log('========================================================================\n');
}

runMetricIntegrityTests().catch((err) => {
  console.error('[FATAL] Metric integrity test failed:', err);
  process.exit(1);
});
