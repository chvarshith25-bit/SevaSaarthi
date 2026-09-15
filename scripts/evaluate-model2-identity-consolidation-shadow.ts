import fs from 'fs';
import path from 'path';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';
import { EntityResolutionEngine } from '../src/lib/server/ai/entity-resolution/engine';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { EntityResolutionShadowMatcher } from '../src/lib/server/ai/entity-resolution/shadow-matcher';

async function evaluateConsolidatedShadow() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: PHASE 7E.6.1 CONSOLIDATED SHADOW EVALUATION (1,025 REQS)');
  console.log('========================================================================\n');

  // Load ground truth lookup
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

  const datasetPath = path.resolve('scripts/model2_shadow_test_requests_1000.json');
  const requests = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  console.log(`Loaded ${requests.length} shadow requests.\n`);

  let posCount = 0;
  let negCount = 0;
  let homonymCount = 0;

  let v1PosTop1 = 0;
  let v1PosTop3 = 0;
  let v3PosTop1 = 0;
  let v3PosTop3 = 0;

  let v1NegHighFalseMatches = 0;
  let v3NegHighFalseMatches = 0;

  let v1HomonymBypass = 0;
  let v3HomonymBypass = 0;

  let v1AmbiguousCount = 0;
  let v3AmbiguousCount = 0;

  let personLevelAgreements = 0;
  let decisionConcordance = 0;

  const v3Latencies: number[] = [];
  const v1Latencies: number[] = [];

  const categoryBreakdown: Record<string, {
    total: number;
    v1Top1: number;
    v3Top1: number;
    v1Top3: number;
    v3Top3: number;
    v3HighMatches: number;
    v3MediumMatches: number;
    v3Ambiguous: number;
    v3Collisions: number;
    v3FalseMatches: number;
  }> = {};

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    const cat = req.category;
    const gt = req.groundTruth;
    const targetCitizenId = gt.citizenId;

    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = {
        total: 0,
        v1Top1: 0,
        v3Top1: 0,
        v1Top3: 0,
        v3Top3: 0,
        v3HighMatches: 0,
        v3MediumMatches: 0,
        v3Ambiguous: 0,
        v3Collisions: 0,
        v3FalseMatches: 0,
      };
    }
    categoryBreakdown[cat].total++;

    const t0 = performance.now();
    const v1Res = await EntityResolutionEngine.matchEntity(req.query);
    const t1 = performance.now();
    v1Latencies.push(t1 - t0);

    const t2 = performance.now();
    const v3Res = await EntityResolutionEngineV3.matchEntityV3(req.query);
    const t3 = performance.now();
    v3Latencies.push(t3 - t2);

    const v1Top = v1Res.bestMatch;
    const v3Top = v3Res.bestMatch;

    const v1Master = v1Top ? (v1Top.citizenId || candidateToMasterCitizen[v1Top.candidateId]) : null;
    const v3Master = v3Top ? (v3Top.citizenId || candidateToMasterCitizen[v3Top.candidateId]) : null;

    if (v1Master === v3Master) {
      personLevelAgreements++;
    }

    const getDecision = (res: any) => {
      if (!res || !res.bestMatch || res.candidates.length === 0) return 'NO_MATCH';
      if (res.bestMatch.confidenceTier === 'AMBIGUOUS' || res.bestMatch.isCollisionWarning || res.ambiguityDetected) {
        return 'MANUAL_REVIEW';
      }
      if (res.bestMatch.confidenceTier === 'HIGH') return 'HIGH_MATCH';
      return 'MEDIUM_CONFIRMATION';
    };

    const v1Dec = getDecision(v1Res);
    const v3Dec = getDecision(v3Res);
    if (v1Dec === v3Dec) {
      decisionConcordance++;
    }

    if (v3Res.ambiguityDetected || v3Top?.confidenceTier === 'AMBIGUOUS') {
      v3AmbiguousCount++;
      categoryBreakdown[cat].v3Ambiguous++;
    }
    if (v1Res.ambiguityDetected || v1Top?.confidenceTier === 'AMBIGUOUS') {
      v1AmbiguousCount++;
    }

    if (v3Top?.isCollisionWarning) {
      categoryBreakdown[cat].v3Collisions++;
    }
    if (v3Top?.confidenceTier === 'HIGH') {
      categoryBreakdown[cat].v3HighMatches++;
    } else if (v3Top?.confidenceTier === 'MEDIUM') {
      categoryBreakdown[cat].v3MediumMatches++;
    }

    if (gt.expectedMatchType === 'POSITIVE') {
      posCount++;

      const v1Matches = v1Res.candidates.map((c: any) => c.citizenId || candidateToMasterCitizen[c.candidateId]);
      const v3Matches = v3Res.candidates.map((c: any) => c.citizenId || candidateToMasterCitizen[c.candidateId]);

      if (v1Master === targetCitizenId) {
        v1PosTop1++;
        categoryBreakdown[cat].v1Top1++;
      }
      if (v1Matches.slice(0, 3).includes(targetCitizenId)) {
        v1PosTop3++;
        categoryBreakdown[cat].v1Top3++;
      }

      if (v3Master === targetCitizenId) {
        v3PosTop1++;
        categoryBreakdown[cat].v3Top1++;
      }
      if (v3Matches.slice(0, 3).includes(targetCitizenId)) {
        v3PosTop3++;
        categoryBreakdown[cat].v3Top3++;
      }
    } else {
      // Hard Negatives (COLLISION_NEGATIVE, DISTINCT_NEGATIVE)
      negCount++;

      if (cat === 'HOMONYM_COLLISION') {
        homonymCount++;
        // Homonym collision bypass: if scored >= 0.60 without collision warning or ambiguity flag
        if (v3Top && v3Top.totalScore >= 0.60 && !v3Top.isCollisionWarning && v3Top.confidenceTier !== 'AMBIGUOUS') {
          v3HomonymBypass++;
        }
        if (v1Top && v1Top.totalScore >= 0.60 && !v1Top.isCollisionWarning && v1Top.confidenceTier !== 'AMBIGUOUS') {
          v1HomonymBypass++;
        }
      }

      // High-confidence false match: bestMatch has HIGH confidence tier on a negative query
      if (v3Top && v3Top.confidenceTier === 'HIGH') {
        v3NegHighFalseMatches++;
        categoryBreakdown[cat].v3FalseMatches++;
      }
      if (v1Top && v1Top.confidenceTier === 'HIGH') {
        v1NegHighFalseMatches++;
      }
    }
  }

  // Calculate percentiles
  v3Latencies.sort((a, b) => a - b);
  const p50 = v3Latencies[Math.floor(v3Latencies.length * 0.50)];
  const p95 = v3Latencies[Math.floor(v3Latencies.length * 0.95)];
  const p99 = v3Latencies[Math.floor(v3Latencies.length * 0.99)];

  console.log('========================================================================');
  console.log('                      PHASE 7E.6.1 AUDIT METRICS RESULTS               ');
  console.log('========================================================================');
  console.log(`Total Requests Processed: ${requests.length}`);
  console.log(`  - Positive Cases:       ${posCount}`);
  console.log(`  - Negative Cases:       ${negCount} (Homonym Collisions: ${homonymCount})`);
  console.log('------------------------------------------------------------------------');
  console.log('1. CORE SAFETY & COLLISION DEFENSE:');
  console.log(`  - V3.1 High-Confidence False Match Rate on Negatives: ${((v3NegHighFalseMatches / negCount) * 100).toFixed(2)}% (${v3NegHighFalseMatches}/${negCount})`);
  console.log(`  - V3.1 Homonym Collision Bypass Rate:                ${((v3HomonymBypass / homonymCount) * 100).toFixed(2)}% (${v3HomonymBypass}/${homonymCount})`);
  console.log(`  - V1 High-Confidence False Match Rate on Negatives:   ${((v1NegHighFalseMatches / negCount) * 100).toFixed(2)}% (${v1NegHighFalseMatches}/${negCount})`);
  console.log(`  - V1 Homonym Collision Bypass Rate:                  ${((v1HomonymBypass / homonymCount) * 100).toFixed(2)}% (${v1HomonymBypass}/${homonymCount})`);
  console.log('------------------------------------------------------------------------');
  console.log('2. PERSON-LEVEL ACCURACY & RECALL (POSITIVES):');
  console.log(`  - V3.1 Top-1 Citizen Accuracy: ${((v3PosTop1 / posCount) * 100).toFixed(2)}% (${v3PosTop1}/${posCount})`);
  console.log(`  - V3.1 Top-3 Citizen Recall:   ${((v3PosTop3 / posCount) * 100).toFixed(2)}% (${v3PosTop3}/${posCount})`);
  console.log(`  - V1 Top-1 Citizen Accuracy:   ${((v1PosTop1 / posCount) * 100).toFixed(2)}% (${v1PosTop1}/${posCount})`);
  console.log(`  - V1 Top-3 Citizen Recall:     ${((v1PosTop3 / posCount) * 100).toFixed(2)}% (${v1PosTop3}/${posCount})`);
  console.log('------------------------------------------------------------------------');
  console.log('3. PERSON-LEVEL CONCORDANCE:');
  console.log(`  - Person-Level Agreement:      ${((personLevelAgreements / requests.length) * 100).toFixed(2)}% (${personLevelAgreements}/${requests.length})`);
  console.log(`  - Decision Concordance:        ${((decisionConcordance / requests.length) * 100).toFixed(2)}% (${decisionConcordance}/${requests.length})`);
  console.log(`  - V3.1 Ambiguity/Manual Rate:  ${((v3AmbiguousCount / requests.length) * 100).toFixed(2)}% (${v3AmbiguousCount}/${requests.length})`);
  console.log(`  - V1 Ambiguity/Manual Rate:    ${((v1AmbiguousCount / requests.length) * 100).toFixed(2)}% (${v1AmbiguousCount}/${requests.length})`);
  console.log('------------------------------------------------------------------------');
  console.log('4. LATENCY PERCENTILES:');
  console.log(`  - V3.1 Latency p50: ${p50.toFixed(2)} ms`);
  console.log(`  - V3.1 Latency p95: ${p95.toFixed(2)} ms`);
  console.log(`  - V3.1 Latency p99: ${p99.toFixed(2)} ms`);
  console.log('========================================================================\n');

  console.log('CATEGORY BREAKDOWN:');
  console.table(categoryBreakdown);
}

evaluateConsolidatedShadow().catch(err => {
  console.error('Evaluation failed:', err);
  process.exit(1);
});
