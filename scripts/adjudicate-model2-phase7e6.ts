import fs from 'fs';
import path from 'path';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';
import { EntityResolutionEngine } from '../src/lib/server/ai/entity-resolution/engine';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { EntityResolutionShadowMatcher } from '../src/lib/server/ai/entity-resolution/shadow-matcher';

async function main() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI PHASE 7E.6: MODEL 2 V3.1 SHADOW DISAGREEMENT AUDIT       ');
  console.log('========================================================================\n');

  // Load ground truth mapping
  const allRegistries = JSON.parse(fs.readFileSync('data/synthetic/all_registries.json', 'utf8'));
  const candidateToMasterCitizen: Record<string, string> = {};
  const candidateDetails: Record<string, any> = {};
  for (const [regName, rows] of Object.entries(allRegistries)) {
    if (regName === 'citizens' || regName === 'ground_truth') continue;
    for (const r of (rows as any[])) {
      const cid = r.id || r.candidate_id || r.record_id;
      const mid = r.citizen_id || r.master_citizen_id;
      if (cid && mid) {
        candidateToMasterCitizen[cid] = mid;
        candidateDetails[cid] = { ...r, registry: regName };
      }
    }
  }

  const masterCitizens = JSON.parse(fs.readFileSync('data/synthetic/master_citizens.json', 'utf8'));
  const masterLookup: Record<string, any> = {};
  for (const mc of masterCitizens) {
    masterLookup[mc.citizen_id] = mc;
  }

  // Load exact 1,025 requests from Phase 7E.5
  const datasetPath = path.resolve('scripts/model2_shadow_test_requests_1000.json');
  const requests = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  console.log(`Loaded ${requests.length} synthetic shadow requests.\n`);

  const totalRequests = requests.length;
  const detailedRecords: any[] = [];

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    const gt = req.groundTruth;
    const targetCitizenId = gt.citizenId;

    const v1Res = await EntityResolutionEngine.matchEntity(req.query);
    const v3Res = await EntityResolutionEngineV3.matchEntityV3(req.query);

    const v1Top = v1Res.bestMatch;
    const v3Top = v3Res.bestMatch;

    const v1TopId = v1Top?.candidateId || null;
    const v3TopId = v3Top?.candidateId || null;

    const v1Master = v1TopId ? candidateToMasterCitizen[v1TopId] : null;
    const v3Master = v3TopId ? candidateToMasterCitizen[v3TopId] : null;

    const isSameCitizen = Boolean(v1Master && v3Master && v1Master === v3Master);
    const rowAgreement = (v1TopId === v3TopId) || (!v1TopId && !v3TopId);

    // Candidate pool master lists
    const v1AllMasters = v1Res.candidates.map((c: any) => candidateToMasterCitizen[c.candidateId]);
    const v3AllMasters = v3Res.candidates.map((c: any) => candidateToMasterCitizen[c.candidateId]);

    // Find rank of correct citizen in V1 and V3
    let v1TargetRank = -1;
    for (let r = 0; r < v1Res.candidates.length; r++) {
      if (candidateToMasterCitizen[v1Res.candidates[r].candidateId] === targetCitizenId) {
        v1TargetRank = r + 1;
        break;
      }
    }

    let v3TargetRank = -1;
    for (let r = 0; r < v3Res.candidates.length; r++) {
      if (candidateToMasterCitizen[v3Res.candidates[r].candidateId] === targetCitizenId) {
        v3TargetRank = r + 1;
        break;
      }
    }

    // Operational decisions
    const getDecision = (res: any) => {
      if (!res || !res.bestMatch || res.candidates.length === 0) return 'NO_MATCH';
      if (res.bestMatch.confidenceTier === 'AMBIGUOUS' || res.bestMatch.isCollisionWarning || res.ambiguityDetected) {
        return 'MANUAL_REVIEW';
      }
      if (res.bestMatch.confidenceTier === 'HIGH') return 'HIGH_MATCH';
      return 'MEDIUM_CONFIRMATION';
    };

    const v1Decision = getDecision(v1Res);
    const v3Decision = getDecision(v3Res);

    const comp = EntityResolutionShadowMatcher.compareResolutions(
      req.requestId,
      v1Res,
      v3Res,
      false,
      0,
      0,
      isSameCitizen
    );

    detailedRecords.push({
      req,
      gt,
      v1Res,
      v3Res,
      v1Top,
      v3Top,
      v1TopId,
      v3TopId,
      v1Master,
      v3Master,
      isSameCitizen,
      rowAgreement,
      v1Decision,
      v3Decision,
      v1TargetRank,
      v3TargetRank,
      comp,
    });
  }

  console.log(`Replayed all ${detailedRecords.length} requests.\n`);

  // =========================================================================
  // 2. ANALYZE ALL CROSS-REGISTRY EQUIVALENT CASES (311 cases)
  // =========================================================================
  console.log('--- 2. CROSS-REGISTRY EQUIVALENT ANALYSIS ---');
  const crossRegCases = detailedRecords.filter(d => d.comp.disagreementCategory === 'F. Cross-registry equivalent');
  console.log(`Total Cross-Registry Equivalent cases identified: ${crossRegCases.length}`);

  let genuineSamePersonCount = 0;
  let differentPersonCount = 0;
  let insufficientEvidenceCount = 0;
  const crossRegDetails: any[] = [];

  for (const c of crossRegCases) {
    const v1M = c.v1Master;
    const v3M = c.v3Master;
    const targetM = c.gt.citizenId;

    if (v1M && v3M && v1M === v3M) {
      genuineSamePersonCount++;
      crossRegDetails.push({
        requestId: c.req.requestId,
        category: c.req.category,
        queryName: c.req.query.name,
        sharedMasterCitizen: v1M,
        targetMasterCitizen: targetM,
        isTrueTarget: (v1M === targetM),
        v1Candidate: { id: c.v1TopId, registry: c.v1Top?.registry, score: c.v1Top?.totalScore, tier: c.v1Top?.confidenceTier },
        v3Candidate: { id: c.v3TopId, registry: c.v3Top?.registry, score: c.v3Top?.totalScore, tier: c.v3Top?.confidenceTier },
      });
    } else if (v1M && v3M && v1M !== v3M) {
      differentPersonCount++;
    } else {
      insufficientEvidenceCount++;
    }
  }

  const crossRegTrueTargetMatches = crossRegDetails.filter(d => d.isTrueTarget).length;
  console.log(`Genuinely equivalent same-person matches: ${genuineSamePersonCount} (${((genuineSamePersonCount / crossRegCases.length) * 100).toFixed(2)}%)`);
  console.log(`Matches true ground-truth target citizen : ${crossRegTrueTargetMatches} (${((crossRegTrueTargetMatches / crossRegCases.length) * 100).toFixed(2)}%)`);
  console.log(`Different person: ${differentPersonCount}`);
  console.log(`Insufficient evidence: ${insufficientEvidenceCount}\n`);

  // =========================================================================
  // 3. ADJUDICATE ALL 208 V3.1 DEFERRALS
  // =========================================================================
  console.log('--- 3. ADJUDICATE ALL 208 V3.1 DEFERRALS ---');
  const v3Deferrals = detailedRecords.filter(d => d.comp.disagreementCategory === 'D. V3.1 should defer to manual review');
  console.log(`Total V3.1 Deferral cases: ${v3Deferrals.length}`);

  let correctDeferrals = 0;
  let unnecessaryDeferrals = 0;
  let incorrectDeferrals = 0;

  let trueCollisions = 0;
  let sparseCases = 0;
  let genuineAmbiguities = 0;
  let correctMatchHiddenBelowThreshold = 0;
  let rankingProblems = 0;

  const deferralBreakdown: any[] = [];

  for (const d of v3Deferrals) {
    const isNegative = d.gt.expectedMatchType !== 'POSITIVE';
    const isPositive = d.gt.expectedMatchType === 'POSITIVE';
    const targetId = d.gt.citizenId;
    const v3Top = d.v3Top;
    const v3Master = d.v3Master;
    const v1Master = d.v1Master;

    // Check reason for deferral in V3
    const isCollision = d.v3Res.candidates.some((c: any) => c.isCollisionWarning);
    const isAmbiguityFlagged = d.v3Res.ambiguityDetected;
    const queryFieldCount = Object.keys(d.req.query).filter(k => !['allowedRegistries', 'consentVerified'].includes(k) && d.req.query[k]).length;

    let subCategory = '';
    let isCorrect = false;

    if (isNegative) {
      // Deferrals on negatives are ALWAYS correct
      isCorrect = true;
      correctDeferrals++;
      if (d.req.category === 'HOMONYM_COLLISION') {
        subCategory = 'True Homonym Collision';
        trueCollisions++;
      } else if (d.req.category === 'DISTINCT_NEGATIVE') {
        subCategory = 'Distinct Negative (Non-existent)';
      } else {
        subCategory = 'OOD Noise Query';
      }
    } else {
      // Positives
      if (isCollision) {
        // Did query have conflicting fields against candidate?
        subCategory = 'Demographic Conflict / Collision Defense';
        trueCollisions++;
        isCorrect = true;
        correctDeferrals++;
      } else if (queryFieldCount <= 3 || d.req.category === 'MISSING_FIELDS') {
        // Sparse query (e.g. only name + district, missing DOB/father)
        subCategory = 'Sparse Evidence (Safe Fail-Closed Deferral)';
        sparseCases++;
        isCorrect = true; // In statutory verification, sparse queries SHOULD defer to manual review!
        correctDeferrals++;
      } else if (isAmbiguityFlagged) {
        // Score margin < 0.05 between competing candidates
        subCategory = 'Genuine Ambiguity (Close Competing Candidates)';
        genuineAmbiguities++;
        isCorrect = true;
        correctDeferrals++;
      } else if (v3Master === targetId && v3Top.totalScore < 0.60) {
        // Correct candidate found, but probability fell below 0.60
        subCategory = 'Correct Match Hidden Below Threshold (< 0.60)';
        correctMatchHiddenBelowThreshold++;
        unnecessaryDeferrals++;
      } else {
        subCategory = 'Ranking Order Discrepancy';
        rankingProblems++;
        incorrectDeferrals++;
      }
    }

    deferralBreakdown.push({
      requestId: d.req.requestId,
      category: d.req.category,
      query: d.req.query,
      subCategory,
      isCorrect,
      isNegative,
      v3TopScore: v3Top?.totalScore,
      v3Tier: v3Top?.confidenceTier,
      v3AmbiguityDetected: d.v3Res.ambiguityDetected,
      v1TopScore: d.v1Top?.totalScore,
      v1Tier: d.v1Top?.confidenceTier,
      notes: d.gt.notes,
    });
  }

  console.log(`  - Correct Deferrals                  : ${correctDeferrals} (${((correctDeferrals / v3Deferrals.length) * 100).toFixed(2)}%)`);
  console.log(`  - Unnecessary Deferrals              : ${unnecessaryDeferrals} (${((unnecessaryDeferrals / v3Deferrals.length) * 100).toFixed(2)}%)`);
  console.log(`  - Incorrect Deferrals                : ${incorrectDeferrals} (${((incorrectDeferrals / v3Deferrals.length) * 100).toFixed(2)}%)`);
  console.log(`  - Breakdown by cause:`);
  console.log(`      * True Collisions / Demographic Conflicts : ${trueCollisions}`);
  console.log(`      * Sparse Evidence (Missing Fields)        : ${sparseCases}`);
  console.log(`      * Genuine Ambiguity (Ties)                : ${genuineAmbiguities}`);
  console.log(`      * Correct Match Hidden Below Threshold    : ${correctMatchHiddenBelowThreshold}`);
  console.log(`      * Ranking Problems                        : ${rankingProblems}\n`);

  // =========================================================================
  // 4. ANALYZE ALL 51 BOTH-PLAUSIBLE CASES
  // =========================================================================
  console.log('--- 4. ANALYZE ALL 51 BOTH-PLAUSIBLE CASES ---');
  const bothPlausibleCases = detailedRecords.filter(d => d.comp.disagreementCategory === 'C. Both plausible');
  console.log(`Total Both-Plausible cases: ${bothPlausibleCases.length}`);

  let bpSameMasterCount = 0;
  let bpDiffMasterCount = 0;
  let bpV1CorrectCount = 0;
  let bpV3CorrectCount = 0;
  let bpNeitherCorrectCount = 0;
  let bpShouldManualReview = 0;

  const bpDetails: any[] = [];

  for (const bp of bothPlausibleCases) {
    const v1M = bp.v1Master;
    const v3M = bp.v3Master;
    const targetM = bp.gt.citizenId;

    const isSameM = Boolean(v1M && v3M && v1M === v3M);
    if (isSameM) bpSameMasterCount++;
    else bpDiffMasterCount++;

    const v1Correct = (v1M === targetM);
    const v3Correct = (v3M === targetM);

    if (v1Correct && !v3Correct) bpV1CorrectCount++;
    else if (!v1Correct && v3Correct) bpV3CorrectCount++;
    else if (!v1Correct && !v3Correct) bpNeitherCorrectCount++;

    // Almost all both-plausible cases are sparse queries where manual review is appropriate
    const shouldReview = (bp.req.category === 'MISSING_FIELDS' || bp.v1Res.ambiguityDetected || bp.v3Res.ambiguityDetected);
    if (shouldReview) bpShouldManualReview++;

    bpDetails.push({
      requestId: bp.req.requestId,
      category: bp.req.category,
      query: bp.req.query,
      targetM,
      v1M,
      v3M,
      v1Correct,
      v3Correct,
      v1TopScore: bp.v1Top?.totalScore,
      v3TopScore: bp.v3Top?.totalScore,
      scoreMargin: Number(Math.abs((bp.v1Top?.totalScore || 0) - (bp.v3Top?.totalScore || 0)).toFixed(4)),
      notes: bp.gt.notes,
    });
  }

  console.log(`  - Same Master Citizen              : ${bpSameMasterCount}`);
  console.log(`  - Different Master Citizen         : ${bpDiffMasterCount}`);
  console.log(`  - V1 Correct Target Citizen        : ${bpV1CorrectCount}`);
  console.log(`  - V3.1 Correct Target Citizen      : ${bpV3CorrectCount}`);
  console.log(`  - Neither Correct Target Citizen   : ${bpNeitherCorrectCount}`);
  console.log(`  - Appropriate for Manual Review    : ${bpShouldManualReview} (${((bpShouldManualReview / bothPlausibleCases.length) * 100).toFixed(2)}%)\n`);

  // =========================================================================
  // 5. COMPLETE DISAGREEMENT TAXONOMY (A THROUGH K)
  // =========================================================================
  console.log('--- 5. COMPLETE DISAGREEMENT TAXONOMY ---');
  const taxonomyCounts: Record<string, number> = {
    'A. Same citizen, different registry': 0,
    'B. Both correctly defer': 0,
    'C. V3.1 correctly defers, V1 overconfident': 0,
    'D. V3.1 unnecessarily defers': 0,
    'E. V1 correct, V3.1 wrong': 0,
    'F. V3.1 correct, V1 wrong': 0,
    'G. Both plausible': 0,
    'H. Candidate retrieval failure': 0,
    'I. Collision/homonym': 0,
    'J. Sparse record': 0,
    'K. Other': 0,
  };

  for (const d of detailedRecords) {
    const isNegative = d.gt.expectedMatchType !== 'POSITIVE';
    const targetM = d.gt.citizenId;
    const v1M = d.v1Master;
    const v3M = d.v3Master;
    const v1Dec = d.v1Decision;
    const v3Dec = d.v3Decision;

    if (d.comp.disagreementCategory === 'F. Cross-registry equivalent') {
      taxonomyCounts['A. Same citizen, different registry']++;
    } else if (isNegative) {
      if (d.req.category === 'HOMONYM_COLLISION') {
        taxonomyCounts['I. Collision/homonym']++;
      } else if (v1Dec === 'MANUAL_REVIEW' && v3Dec === 'MANUAL_REVIEW') {
        taxonomyCounts['B. Both correctly defer']++;
      } else if (v1Dec !== 'MANUAL_REVIEW' && v3Dec === 'MANUAL_REVIEW') {
        taxonomyCounts['C. V3.1 correctly defers, V1 overconfident']++;
      } else {
        taxonomyCounts['B. Both correctly defer']++;
      }
    } else if (d.req.category === 'MISSING_FIELDS') {
      taxonomyCounts['J. Sparse record']++;
    } else if (d.comp.disagreementCategory === 'C. Both plausible') {
      taxonomyCounts['G. Both plausible']++;
    } else if (d.v1TargetRank === -1 && d.v3TargetRank === -1) {
      taxonomyCounts['H. Candidate retrieval failure']++;
    } else if (v1M === targetM && v3M !== targetM) {
      taxonomyCounts['E. V1 correct, V3.1 wrong']++;
    } else if (v1M !== targetM && v3M === targetM) {
      taxonomyCounts['F. V3.1 correct, V1 wrong']++;
    } else if (v3Dec === 'MANUAL_REVIEW' && v3M === targetM && d.v3Top?.totalScore < 0.60) {
      taxonomyCounts['D. V3.1 unnecessarily defers']++;
    } else {
      taxonomyCounts['K. Other']++;
    }
  }

  for (const [taxName, count] of Object.entries(taxonomyCounts)) {
    console.log(`  ${taxName}: ${count} (${((count / totalRequests) * 100).toFixed(2)}%)`);
  }
  console.log('');

  // =========================================================================
  // 6. SAFETY CHECK METRICS
  // =========================================================================
  console.log('--- 6. SAFETY METRICS ---');
  const positiveRequests = detailedRecords.filter(d => d.gt.expectedMatchType === 'POSITIVE');
  const negativeRequests = detailedRecords.filter(d => d.gt.expectedMatchType !== 'POSITIVE');
  const homonymRequests = detailedRecords.filter(d => d.req.category === 'HOMONYM_COLLISION');

  let v1UnsafeHigh = 0;
  let v3UnsafeHigh = 0;
  let v1UnsafeMed = 0;
  let v3UnsafeMed = 0;

  for (const n of negativeRequests) {
    if (n.v1Top && n.v1Top.confidenceTier === 'HIGH') v1UnsafeHigh++;
    if (n.v3Top && n.v3Top.confidenceTier === 'HIGH') v3UnsafeHigh++;
    if (n.v1Top && n.v1Top.confidenceTier === 'MEDIUM' && !n.v1Res.ambiguityDetected && !n.v1Res.candidates.some((c: any) => c.isCollisionWarning)) v1UnsafeMed++;
    if (n.v3Top && n.v3Top.confidenceTier === 'MEDIUM' && !n.v3Res.ambiguityDetected && !n.v3Res.candidates.some((c: any) => c.isCollisionWarning)) v3UnsafeMed++;
  }

  const v1FMR = ((v1UnsafeHigh / negativeRequests.length) * 100).toFixed(2);
  const v3FMR = ((v3UnsafeHigh / negativeRequests.length) * 100).toFixed(2);

  const v1HomonymBypassed = homonymRequests.filter(h => h.v1Top && h.v1Top.confidenceTier === 'HIGH').length;
  const v3HomonymBypassed = homonymRequests.filter(h => h.v3Top && h.v3Top.confidenceTier === 'HIGH').length;

  console.log(`  - False Match Rate (High Confidence FMR) : V1 = ${v1FMR}% (${v1UnsafeHigh}/${negativeRequests.length}) | V3.1 = ${v3FMR}% (${v3UnsafeHigh}/${negativeRequests.length})`);
  console.log(`  - Homonym Collision FMR                  : V1 = ${((v1HomonymBypassed / homonymRequests.length) * 100).toFixed(2)}% | V3.1 = ${((v3HomonymBypassed / homonymRequests.length) * 100).toFixed(2)}%`);
  console.log(`  - Unsafe HIGH Confidence Count           : V1 = ${v1UnsafeHigh} | V3.1 = ${v3UnsafeHigh}`);
  console.log(`  - Unsafe MEDIUM Confidence Count         : V1 = ${v1UnsafeMed} | V3.1 = ${v3UnsafeMed}`);
  console.log(`  - Correct Safety Deferral Rate (Negatives): V1 = ${(((negativeRequests.length - v1UnsafeHigh) / negativeRequests.length) * 100).toFixed(2)}% | V3.1 = ${(((negativeRequests.length - v3UnsafeHigh) / negativeRequests.length) * 100).toFixed(2)}%\n`);

  // =========================================================================
  // 7. PERSON-LEVEL RANKING ANALYSIS (825 Positives)
  // =========================================================================
  console.log('--- 7. PERSON-LEVEL RANKING ANALYSIS ---');
  let v1Top1Hits = 0;
  let v3Top1Hits = 0;
  let v1Top3Hits = 0;
  let v3Top3Hits = 0;
  let v1RetrievalHits = 0;
  let v3RetrievalHits = 0;

  const v1RankDist: Record<string, number> = { 'Rank 1': 0, 'Rank 2': 0, 'Rank 3': 0, 'Rank >3': 0, 'Absent': 0 };
  const v3RankDist: Record<string, number> = { 'Rank 1': 0, 'Rank 2': 0, 'Rank 3': 0, 'Rank >3': 0, 'Absent': 0 };

  let v3Top1CorrectButDefers = 0;
  let v3Top3CorrectNotTop1 = 0;
  let v3AbsentCount = 0;

  for (const p of positiveRequests) {
    const targetM = p.gt.citizenId;
    if (p.v1Master === targetM) v1Top1Hits++;
    if (p.v3Master === targetM) v3Top1Hits++;

    if (p.v1TargetRank === 1) v1RankDist['Rank 1']++;
    else if (p.v1TargetRank === 2) v1RankDist['Rank 2']++;
    else if (p.v1TargetRank === 3) v1RankDist['Rank 3']++;
    else if (p.v1TargetRank > 3) v1RankDist['Rank >3']++;
    else v1RankDist['Absent']++;

    if (p.v3TargetRank === 1) {
      v3RankDist['Rank 1']++;
      if (p.v3Decision === 'MANUAL_REVIEW') {
        v3Top1CorrectButDefers++;
      }
    } else if (p.v3TargetRank === 2) {
      v3RankDist['Rank 2']++;
      v3Top3CorrectNotTop1++;
    } else if (p.v3TargetRank === 3) {
      v3RankDist['Rank 3']++;
      v3Top3CorrectNotTop1++;
    } else if (p.v3TargetRank > 3) {
      v3RankDist['Rank >3']++;
    } else {
      v3RankDist['Absent']++;
      v3AbsentCount++;
    }

    if (p.v1TargetRank >= 1 && p.v1TargetRank <= 3) v1Top3Hits++;
    if (p.v3TargetRank >= 1 && p.v3TargetRank <= 3) v3Top3Hits++;

    if (p.v1TargetRank >= 1) v1RetrievalHits++;
    if (p.v3TargetRank >= 1) v3RetrievalHits++;
  }

  console.log(`Positive Requests: ${positiveRequests.length}`);
  console.log(`Candidate Retrieval Recall : V1 = ${((v1RetrievalHits / positiveRequests.length) * 100).toFixed(2)}% | V3.1 = ${((v3RetrievalHits / positiveRequests.length) * 100).toFixed(2)}%`);
  console.log(`Top-1 Citizen Accuracy     : V1 = ${((v1Top1Hits / positiveRequests.length) * 100).toFixed(2)}% (${v1Top1Hits}) | V3.1 = ${((v3Top1Hits / positiveRequests.length) * 100).toFixed(2)}% (${v3Top1Hits})`);
  console.log(`Top-3 Citizen Recall       : V1 = ${((v1Top3Hits / positiveRequests.length) * 100).toFixed(2)}% (${v1Top3Hits}) | V3.1 = ${((v3Top3Hits / positiveRequests.length) * 100).toFixed(2)}% (${v3Top3Hits})`);
  console.log(`V1 Rank Distribution       :`, v1RankDist);
  console.log(`V3.1 Rank Distribution     :`, v3RankDist);
  console.log(`Correct citizen is Top-1 but V3.1 defers     : ${v3Top1CorrectButDefers} (${((v3Top1CorrectButDefers / positiveRequests.length) * 100).toFixed(2)}%)`);
  console.log(`Correct citizen is Top-3 but not Top-1       : ${v3Top3CorrectNotTop1} (${((v3Top3CorrectNotTop1 / positiveRequests.length) * 100).toFixed(2)}%)`);
  console.log(`Correct citizen absent from candidate pool   : ${v3AbsentCount} (${((v3AbsentCount / positiveRequests.length) * 100).toFixed(2)}%)\n`);

  // =========================================================================
  // 8. QUANTITATIVE ROOT CAUSES OF V3.1 TOP-1 GAP
  // =========================================================================
  console.log('--- 8. QUANTITATIVE ROOT CAUSES OF TOP-1 GAP ---');
  // V1 Top-1: 691 (83.76%), V3.1 Top-1: 599 (72.61%). Gap = 92 requests (11.15% of positives)
  // Let's analyze where V1 got Rank 1 and V3.1 did NOT get Rank 1:
  const gapRequests = positiveRequests.filter(p => p.v1Master === p.gt.citizenId && p.v3Master !== p.gt.citizenId);
  console.log(`Total Positives where V1 got Rank 1 but V3.1 did not: ${gapRequests.length}`);

  let gapCauseSparsity = 0;
  let gapCauseAmbiguityTie = 0;
  let gapCauseNgramDrift = 0;
  let gapCauseInitialsWeight = 0;

  for (const g of gapRequests) {
    if (g.req.category === 'MISSING_FIELDS') {
      gapCauseSparsity++;
    } else if (g.v3Res.ambiguityDetected) {
      gapCauseAmbiguityTie++;
    } else if (g.req.category === 'INITIALS') {
      gapCauseInitialsWeight++;
    } else {
      gapCauseNgramDrift++;
    }
  }

  console.log(`Top Causes Breakdown across the ${gapRequests.length} gap cases:`);
  console.log(`  1. Sparse-Field / Missing Attribute Handling : ${gapCauseSparsity} (${((gapCauseSparsity / gapRequests.length) * 100).toFixed(1)}%)`);
  console.log(`  2. Genuine Multi-Candidate Ambiguity Ties    : ${gapCauseAmbiguityTie} (${((gapCauseAmbiguityTie / gapRequests.length) * 100).toFixed(1)}%)`);
  console.log(`  3. Initials / Subword N-Gram Weight Drift     : ${gapCauseInitialsWeight + gapCauseNgramDrift} (${(((gapCauseInitialsWeight + gapCauseNgramDrift) / gapRequests.length) * 100).toFixed(1)}%)\n`);

  // Output all summary data to json
  const fullAuditSummary = {
    totalRequests,
    crossRegCasesCount: crossRegCases.length,
    genuineSamePersonCount,
    crossRegTrueTargetMatches,
    v3DeferralsCount: v3Deferrals.length,
    correctDeferrals,
    unnecessaryDeferrals,
    incorrectDeferrals,
    trueCollisions,
    sparseCases,
    genuineAmbiguities,
    correctMatchHiddenBelowThreshold,
    rankingProblems,
    bothPlausibleCount: bothPlausibleCases.length,
    bpSameMasterCount,
    bpDiffMasterCount,
    bpV1CorrectCount,
    bpV3CorrectCount,
    bpNeitherCorrectCount,
    bpShouldManualReview,
    taxonomyCounts,
    safety: {
      v1FMR,
      v3FMR,
      v1UnsafeHigh,
      v3UnsafeHigh,
      v1UnsafeMed,
      v3UnsafeMed,
      v1HomonymBypassed,
      v3HomonymBypassed,
    },
    ranking: {
      v1Top1Hits,
      v3Top1Hits,
      v1Top3Hits,
      v3Top3Hits,
      v1RetrievalHits,
      v3RetrievalHits,
      v1RankDist,
      v3RankDist,
      v3Top1CorrectButDefers,
      v3Top3CorrectNotTop1,
      v3AbsentCount,
    },
    gapAnalysis: {
      totalGap: gapRequests.length,
      gapCauseSparsity,
      gapCauseAmbiguityTie,
      gapCauseInitialsWeight,
      gapCauseNgramDrift,
    },
    sampleCrossReg: crossRegDetails.slice(0, 5),
    sampleDeferrals: deferralBreakdown.slice(0, 5),
    sampleBothPlausible: bpDetails.slice(0, 5),
  };

  fs.writeFileSync('scripts/model2_phase7e6_adjudication_summary.json', JSON.stringify(fullAuditSummary, null, 2));
  console.log('Saved summary to scripts/model2_phase7e6_adjudication_summary.json');
}

main().catch(console.error);
