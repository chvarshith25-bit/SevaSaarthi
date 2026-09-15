import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';
import { EntityResolutionEngine } from '../src/lib/server/ai/entity-resolution/engine';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { EntityResolutionShadowMatcher, Model2ShadowComparison } from '../src/lib/server/ai/entity-resolution/shadow-matcher';

async function main() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI PHASE 7E.5: MODEL 2 V3.1 CONTROLLED SHADOW RUN (1,025)   ');
  console.log('========================================================================\n');

  const db = await getAuthoritativeDb();

  // Load ground truth citizen links and registry mapping
  const allRegistries = JSON.parse(fs.readFileSync('data/synthetic/all_registries.json', 'utf8'));
  const candidateToMasterCitizen: Record<string, string> = {};
  for (const [regName, rows] of Object.entries(allRegistries)) {
    if (regName === 'citizens' || regName === 'ground_truth') continue;
    for (const r of (rows as any[])) {
      const cid = r.id || r.candidate_id || r.record_id;
      const mid = r.citizen_id || r.master_citizen_id;
      if (cid && mid) {
        candidateToMasterCitizen[cid] = mid;
      }
    }
  }

  // Load 1,025 generated shadow requests
  const datasetPath = path.resolve('scripts/model2_shadow_test_requests_1000.json');
  const requests = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  console.log(`Loaded ${requests.length} synthetic shadow requests from ${datasetPath}.\n`);

  // Clear existing shadow log table for clean run
  await db.query('DELETE FROM model2_shadow_log');

  // Measure database state before run for Zero Side Effects verification
  const appCountBefore = Number((await db.query('SELECT COUNT(*) as c FROM applications')).rows[0].c);
  const decisionCountBefore = Number((await db.query('SELECT COUNT(*) as c FROM application_decisions')).rows[0].c);
  const citizenCountBefore = Number((await db.query('SELECT COUNT(*) as c FROM synthetic_master_citizens')).rows[0].c);

  console.log('--- 1. EXECUTING SHADOW MODE COMPARISON RUN ---');
  const results: any[] = [];
  const v1Latencies: number[] = [];
  const v3Latencies: number[] = [];

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];

    // V1 Execution
    const v1Start = performance.now();
    const v1Res = await EntityResolutionEngine.matchEntity(req.query);
    const v1Lat = performance.now() - v1Start;
    v1Latencies.push(v1Lat);

    // V3.1 Execution
    const v3Start = performance.now();
    let v3Res = null;
    let fallback = false;
    try {
      v3Res = await EntityResolutionEngineV3.matchEntityV3(req.query);
    } catch (e) {
      fallback = true;
    }
    const v3Lat = performance.now() - v3Start;
    v3Latencies.push(v3Lat);

    // Person-level equivalence check
    const v1TopId = v1Res.bestMatch?.candidateId || null;
    const v3TopId = v3Res?.bestMatch?.candidateId || null;
    const v1Master = v1TopId ? (candidateToMasterCitizen[v1TopId] || null) : null;
    const v3Master = v3TopId ? (candidateToMasterCitizen[v3TopId] || null) : null;
    const isSameCitizen = Boolean(v1Master && v3Master && v1Master === v3Master);

    const comparison = EntityResolutionShadowMatcher.compareResolutions(
      req.requestId,
      v1Res,
      v3Res,
      fallback,
      Number(v1Lat.toFixed(2)),
      Number(v3Lat.toFixed(2)),
      isSameCitizen
    );

    await EntityResolutionShadowMatcher.logShadowTelemetry(comparison);
    results.push({
      req,
      comparison,
      v1Res,
      v3Res,
      v1Master,
      v3Master,
      isSameCitizen,
    });
  }

  const logCount = Number((await db.query('SELECT COUNT(*) as c FROM model2_shadow_log')).rows[0].c);
  console.log(`Successfully logged ${logCount} shadow telemetry records.\n`);

  // --- 2. ZERO SIDE EFFECTS VERIFICATION ---
  console.log('--- 2. ZERO SIDE EFFECTS VERIFICATION ---');
  const appCountAfter = Number((await db.query('SELECT COUNT(*) as c FROM applications')).rows[0].c);
  const decisionCountAfter = Number((await db.query('SELECT COUNT(*) as c FROM application_decisions')).rows[0].c);
  const citizenCountAfter = Number((await db.query('SELECT COUNT(*) as c FROM synthetic_master_citizens')).rows[0].c);

  const appDelta = appCountAfter - appCountBefore;
  const decisionDelta = decisionCountAfter - decisionCountBefore;
  const citizenDelta = citizenCountAfter - citizenCountBefore;

  console.log(`Applications table delta: ${appDelta}`);
  console.log(`Decisions table delta: ${decisionDelta}`);
  console.log(`Master citizens table delta: ${citizenDelta}`);
  if (appDelta === 0 && decisionDelta === 0 && citizenDelta === 0) {
    console.log('[PASS] ZERO statutory side effects verified across all 1,025 requests.\n');
  } else {
    throw new Error(`[FAIL] Unintended state mutation detected! Delta: ${appDelta}, ${decisionDelta}, ${citizenDelta}`);
  }

  // --- 3. DETERMINISM VERIFICATION ---
  console.log('--- 3. DETERMINISM VERIFICATION (100 Sample Dual Runs) ---');
  let determinismMismatches = 0;
  for (let i = 0; i < 100; i++) {
    const item = results[i];
    const v1Res2 = await EntityResolutionEngine.matchEntity(item.req.query);
    const v3Res2 = await EntityResolutionEngineV3.matchEntityV3(item.req.query);
    const comp2 = EntityResolutionShadowMatcher.compareResolutions(
      item.req.requestId,
      v1Res2,
      v3Res2,
      false,
      0,
      0,
      item.isSameCitizen
    );
    if (
      comp2.agreement !== item.comparison.agreement ||
      comp2.v1TopCandidateId !== item.comparison.v1TopCandidateId ||
      comp2.v3TopCandidateId !== item.comparison.v3TopCandidateId ||
      comp2.disagreementCategory !== item.comparison.disagreementCategory
    ) {
      determinismMismatches++;
    }
  }
  console.log(`Determinism check across 100 sample dual runs: ${determinismMismatches} discrepancies.`);
  if (determinismMismatches === 0) {
    console.log('[PASS] 100% Determinism confirmed across independent runs.\n');
  } else {
    throw new Error('[FAIL] Non-deterministic behavior detected!');
  }

  // --- 4. COMPUTE DETAILED SHADOW TELEMETRY METRICS ---
  console.log('--- 4. DETAILED SHADOW METRICS & BENCHMARK ---');

  const totalRequests = results.length;
  let rowAgreementCount = 0;
  let personAgreementCount = 0;
  let decisionConcordanceCount = 0;

  let totalPositives = 0;
  let v1Top1Hits = 0;
  let v3Top1Hits = 0;
  let v1Top3Hits = 0;
  let v3Top3Hits = 0;
  let v1RetrievalHits = 0;
  let v3RetrievalHits = 0;

  let totalNegatives = 0;
  let v1FalseMatches = 0;
  let v3FalseMatches = 0;
  let totalHomonyms = 0;
  let v1HomonymCollisionsBypassed = 0;
  let v3HomonymCollisionsBypassed = 0;

  let v1FalseNegatives = 0;
  let v3FalseNegatives = 0;

  let v1AmbiguousCount = 0;
  let v3AmbiguousCount = 0;
  let v1CollisionWarningCount = 0;
  let v3CollisionWarningCount = 0;

  let correctManualReviewCount = 0;
  let totalManualReviewEligible = 0;
  let unnecessaryManualReviewCountV3 = 0;
  let totalUnambiguousExact = 0;

  const disagreementCategoryCounts: Record<string, number> = {
    'A. V3.1 clearly better': 0,
    'B. V1 clearly better': 0,
    'C. Both plausible': 0,
    'D. V3.1 should defer to manual review': 0,
    'E. V1 should defer to manual review': 0,
    'F. Cross-registry equivalent': 0,
    'NONE': 0,
  };

  const sampleDisagreementsByCategory: Record<string, any[]> = {
    'A. V3.1 clearly better': [],
    'B. V1 clearly better': [],
    'C. Both plausible': [],
    'D. V3.1 should defer to manual review': [],
    'E. V1 should defer to manual review': [],
    'F. Cross-registry equivalent': [],
  };

  const getOperationalDecision = (res: any) => {
    if (!res || !res.bestMatch || res.candidates.length === 0) return 'NO_MATCH';
    if (res.bestMatch.confidenceTier === 'AMBIGUOUS' || res.bestMatch.isCollisionWarning) {
      return 'MANUAL_REVIEW';
    }
    if (res.bestMatch.confidenceTier === 'HIGH') return 'HIGH_MATCH';
    return 'MEDIUM_CONFIRMATION';
  };

  for (const item of results) {
    const { req, comparison, v1Res, v3Res, v1Master, v3Master, isSameCitizen } = item;
    const gt = req.groundTruth;
    const targetCitizenId = gt.citizenId;

    if (comparison.agreement) rowAgreementCount++;
    if (comparison.agreement || isSameCitizen) personAgreementCount++;

    const v1Decision = getOperationalDecision(v1Res);
    const v3Decision = getOperationalDecision(v3Res);
    if (v1Decision === v3Decision) {
      decisionConcordanceCount++;
    }

    disagreementCategoryCounts[comparison.disagreementCategory] =
      (disagreementCategoryCounts[comparison.disagreementCategory] || 0) + 1;

    if (comparison.disagreementCategory !== 'NONE') {
      if (sampleDisagreementsByCategory[comparison.disagreementCategory].length < 3) {
        sampleDisagreementsByCategory[comparison.disagreementCategory].push({
          requestId: req.requestId,
          category: req.category,
          query: req.query,
          gtCitizenId: gt.citizenId,
          v1Top: comparison.v1TopCandidateId,
          v1Master,
          v1Confidence: comparison.v1Confidence,
          v1Tier: comparison.v1Tier,
          v3Top: comparison.v3TopCandidateId,
          v3Master,
          v3Probability: comparison.v3Probability,
          v3Tier: comparison.v3Tier,
          disagreementCategory: comparison.disagreementCategory,
          notes: gt.notes,
        });
      }
    }

    if (v1Res.ambiguityDetected) v1AmbiguousCount++;
    if (v3Res && v3Res.ambiguityDetected) v3AmbiguousCount++;

    if (v1Res.candidates.some((c: any) => c.isCollisionWarning)) v1CollisionWarningCount++;
    if (v3Res && v3Res.candidates.some((c: any) => c.isCollisionWarning)) v3CollisionWarningCount++;

    // Ground Truth Evaluations
    if (gt.expectedMatchType === 'POSITIVE') {
      totalPositives++;

      // Top-1 Accuracy (matches true citizen ID)
      if (v1Master === targetCitizenId) v1Top1Hits++;
      if (v3Master === targetCitizenId) v3Top1Hits++;

      // Top-3 Recall
      const v1Top3Masters = v1Res.candidates.slice(0, 3).map((c: any) => candidateToMasterCitizen[c.candidateId]);
      const v3Top3Masters = v3Res ? v3Res.candidates.slice(0, 3).map((c: any) => candidateToMasterCitizen[c.candidateId]) : [];
      if (v1Top3Masters.includes(targetCitizenId)) v1Top3Hits++;
      if (v3Top3Masters.includes(targetCitizenId)) v3Top3Hits++;

      // Retrieval Recall
      const v1AllMasters = v1Res.candidates.map((c: any) => candidateToMasterCitizen[c.candidateId]);
      const v3AllMasters = v3Res ? v3Res.candidates.map((c: any) => candidateToMasterCitizen[c.candidateId]) : [];
      if (v1AllMasters.includes(targetCitizenId)) v1RetrievalHits++;
      if (v3AllMasters.includes(targetCitizenId)) v3RetrievalHits++;

      // False Negatives (no candidate found or only low tier)
      if (!v1Res.bestMatch || v1Res.bestMatch.confidenceTier === 'LOW') v1FalseNegatives++;
      if (!v3Res || !v3Res.bestMatch || v3Res.bestMatch.confidenceTier === 'LOW') v3FalseNegatives++;

      // Unnecessary Manual Review on exact matches
      if (req.category === 'EXACT_MATCH') {
        totalUnambiguousExact++;
        if (v3Decision === 'MANUAL_REVIEW') {
          unnecessaryManualReviewCountV3++;
        }
      }
    } else {
      totalNegatives++;
      totalManualReviewEligible++;

      const isV1Defers = (v1Decision === 'MANUAL_REVIEW' || v1Decision === 'NO_MATCH');
      const isV3Defers = (v3Decision === 'MANUAL_REVIEW' || v3Decision === 'NO_MATCH');

      if (isV3Defers) {
        correctManualReviewCount++;
      }

      if (v1Res.bestMatch && !isV1Defers) {
        v1FalseMatches++;
      }
      if (v3Res && v3Res.bestMatch && !isV3Defers) {
        v3FalseMatches++;
      }

      if (req.category === 'HOMONYM_COLLISION') {
        totalHomonyms++;
        if (v1Res.bestMatch && !isV1Defers) v1HomonymCollisionsBypassed++;
        if (v3Res && v3Res.bestMatch && !isV3Defers) v3HomonymCollisionsBypassed++;
      }
    }
  }

  // Calculate percentages
  const rowAgreeRate = ((rowAgreementCount / totalRequests) * 100).toFixed(2);
  const personAgreeRate = ((personAgreementCount / totalRequests) * 100).toFixed(2);
  const decisionConcordanceRate = ((decisionConcordanceCount / totalRequests) * 100).toFixed(2);

  const v1Top1Acc = ((v1Top1Hits / totalPositives) * 100).toFixed(2);
  const v3Top1Acc = ((v3Top1Hits / totalPositives) * 100).toFixed(2);

  const v1Top3Rec = ((v1Top3Hits / totalPositives) * 100).toFixed(2);
  const v3Top3Rec = ((v3Top3Hits / totalPositives) * 100).toFixed(2);

  const v1RetrievalRec = ((v1RetrievalHits / totalPositives) * 100).toFixed(2);
  const v3RetrievalRec = ((v3RetrievalHits / totalPositives) * 100).toFixed(2);

  const v1FMR = ((v1FalseMatches / totalNegatives) * 100).toFixed(2);
  const v3FMR = ((v3FalseMatches / totalNegatives) * 100).toFixed(2);

  const v1FNR = ((v1FalseNegatives / totalPositives) * 100).toFixed(2);
  const v3FNR = ((v3FalseNegatives / totalPositives) * 100).toFixed(2);

  const correctMRRate = ((correctManualReviewCount / totalManualReviewEligible) * 100).toFixed(2);
  const unnecMRRate = ((unnecessaryManualReviewCountV3 / totalUnambiguousExact) * 100).toFixed(2);

  const v1HomonymFMR = ((v1HomonymCollisionsBypassed / totalHomonyms) * 100).toFixed(2);
  const v3HomonymFMR = ((v3HomonymCollisionsBypassed / totalHomonyms) * 100).toFixed(2);

  // Latency calculation
  v1Latencies.sort((a, b) => a - b);
  v3Latencies.sort((a, b) => a - b);
  const p50 = (arr: number[]) => arr[Math.floor(arr.length * 0.50)].toFixed(2);
  const p95 = (arr: number[]) => arr[Math.floor(arr.length * 0.95)].toFixed(2);
  const p99 = (arr: number[]) => arr[Math.floor(arr.length * 0.99)].toFixed(2);

  console.log(`Total Evaluated Shadow Requests : ${totalRequests}`);
  console.log(`Row-Level Agreement Rate        : ${rowAgreeRate}% (${rowAgreementCount}/${totalRequests})`);
  console.log(`Person-Level Agreement Rate     : ${personAgreeRate}% (${personAgreementCount}/${totalRequests})`);
  console.log(`Decision Concordance Rate       : ${decisionConcordanceRate}% (${decisionConcordanceCount}/${totalRequests})`);
  console.log(`\nPositive Query Performance (${totalPositives} requests):`);
  console.log(`  Top-1 Citizen Accuracy        : V1 = ${v1Top1Acc}% (${v1Top1Hits}/${totalPositives}) | V3.1 = ${v3Top1Acc}% (${v3Top1Hits}/${totalPositives})`);
  console.log(`  Top-3 Citizen Recall          : V1 = ${v1Top3Rec}% (${v1Top3Hits}/${totalPositives}) | V3.1 = ${v3Top3Rec}% (${v3Top3Hits}/${totalPositives})`);
  console.log(`  Candidate Retrieval Recall    : V1 = ${v1RetrievalRec}% (${v1RetrievalHits}/${totalPositives}) | V3.1 = ${v3RetrievalRec}% (${v3RetrievalHits}/${totalPositives})`);
  console.log(`  False Negative Rate (FNR)     : V1 = ${v1FNR}% (${v1FalseNegatives}/${totalPositives}) | V3.1 = ${v3FNR}% (${v3FalseNegatives}/${totalPositives})`);
  console.log(`\nNegative / Collision Safety (${totalNegatives} requests):`);
  console.log(`  False Match Rate (FMR)        : V1 = ${v1FMR}% (${v1FalseMatches}/${totalNegatives}) | V3.1 = ${v3FMR}% (${v3FalseMatches}/${totalNegatives})`);
  console.log(`  Homonym Collision FMR         : V1 = ${v1HomonymFMR}% (${v1HomonymCollisionsBypassed}/${totalHomonyms}) | V3.1 = ${v3HomonymFMR}% (${v3HomonymCollisionsBypassed}/${totalHomonyms})`);
  console.log(`  Correct Manual-Review Rate    : ${correctMRRate}% (${correctManualReviewCount}/${totalManualReviewEligible})`);
  console.log(`  Unnecessary Manual-Review Rate: ${unnecMRRate}% (${unnecessaryManualReviewCountV3}/${totalUnambiguousExact})`);
  console.log(`\nLatencies:`);
  console.log(`  V1   - p50: ${p50(v1Latencies)}ms, p95: ${p95(v1Latencies)}ms, p99: ${p99(v1Latencies)}ms`);
  console.log(`  V3.1 - p50: ${p50(v3Latencies)}ms, p95: ${p95(v3Latencies)}ms, p99: ${p99(v3Latencies)}ms`);
  console.log(`\nDisagreement Category Breakdown:`);
  for (const [k, v] of Object.entries(disagreementCategoryCounts)) {
    console.log(`  - ${k}: ${v} (${((v / totalRequests) * 100).toFixed(2)}%)`);
  }

  // Save report data for documentation
  const reportData = {
    totalRequests,
    totalPositives,
    totalNegatives,
    totalHomonyms,
    rowAgreeRate,
    rowAgreementCount,
    personAgreeRate,
    personAgreementCount,
    decisionConcordanceRate,
    decisionConcordanceCount,
    v1Top1Acc,
    v1Top1Hits,
    v3Top1Acc,
    v3Top1Hits,
    v1Top3Rec,
    v1Top3Hits,
    v3Top3Rec,
    v3Top3Hits,
    v1RetrievalRec,
    v1RetrievalHits,
    v3RetrievalRec,
    v3RetrievalHits,
    v1FMR,
    v1FalseMatches,
    v3FMR,
    v3FalseMatches,
    v1FNR,
    v1FalseNegatives,
    v3FNR,
    v3FalseNegatives,
    correctMRRate,
    correctManualReviewCount,
    unnecMRRate,
    unnecessaryManualReviewCountV3,
    v1HomonymFMR,
    v1HomonymCollisionsBypassed,
    v3HomonymFMR,
    v3HomonymCollisionsBypassed,
    v1Latencies: { p50: p50(v1Latencies), p95: p95(v1Latencies), p99: p99(v1Latencies) },
    v3Latencies: { p50: p50(v3Latencies), p95: p95(v3Latencies), p99: p99(v3Latencies) },
    disagreementCategoryCounts,
    sampleDisagreementsByCategory,
  };

  fs.writeFileSync('scripts/model2_shadow_1000_results.json', JSON.stringify(reportData, null, 2));
  console.log('\nResults saved to scripts/model2_shadow_1000_results.json');
}

main().catch(err => {
  console.error('Shadow evaluation failed:', err);
  process.exit(1);
});
