import fs from 'fs';
import path from 'path';
import { EntityResolutionEngine, ENTITY_RESOLUTION_THRESHOLDS } from '../src/lib/server/ai/entity-resolution/index.ts';
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
  console.log('   SEVA SAARTHI PHASE 5A: AI MODEL 2 EVALUATION SUITE   ');
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

  const falseOrAmbiguousTop1Samples = [];

  // 1. Strict Blind Evaluation Across Authoritative Ground Truth Set
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
      purpose: 'Strict Blind Ground Truth Evaluation'
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
      } else {
        if (falseOrAmbiguousTop1Samples.length < 5) {
          falseOrAmbiguousTop1Samples.push({
            linkId: link.id,
            matchType: link.match_type,
            targetRecordId: link.source_record_id,
            input: { name: input.name, dob: input.dateOfBirth, father: input.fatherName, district: input.district },
            candidatesCount: result.candidates.length,
            topCandidates: result.candidates.slice(0, 3).map(c => ({
              candidateId: c.candidateId,
              score: c.totalScore,
              tier: c.confidenceTier,
              fieldScores: c.fieldScores,
              isTarget: c.candidateId === link.source_record_id,
              explanation: c.explanation
            }))
          });
        }
      }

      if (isTop3) {
        top3Correct++;
        stats.top3++;
      }
    } else {
      // Ground truth is false (e.g. name collision or distinct citizen non-match)
      if (link.match_type === 'NON_MATCH_NAME_COLLISION') {
        collisionTestsTotal++;
        if (matchedRecord && (matchedRecord.isCollisionWarning || matchedRecord.confidenceTier === 'AMBIGUOUS' || matchedRecord.confidenceTier === 'LOW')) {
          collisionTestsPassed++;
        }
      }

      if (!isPredictedMatch || (matchedRecord && matchedRecord.isCollisionWarning)) {
        trueNegatives++;
        stats.tn++;
      } else {
        falsePositives++;
        stats.fp++;
        if (link.match_type === 'NON_MATCH_NAME_COLLISION') {
          collisionFalseMatchCount++;
        }
      }
    }
  }

  const precision = truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
  const recall = truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const totalPositiveGT = gtLinks.filter(l => l.ground_truth_match).length;
  const top1Accuracy = totalPositiveGT > 0 ? top1Correct / totalPositiveGT : 0;
  const top3Recall = totalPositiveGT > 0 ? top3Correct / totalPositiveGT : 0;

  console.log('--- Evaluation Metrics on Ground Truth ---');
  console.log('True Positives (TP):        ' + truePositives);
  console.log('False Positives (FP):       ' + falsePositives);
  console.log('True Negatives (TN):        ' + trueNegatives);
  console.log('False Negatives (FN):       ' + falseNegatives);
  console.log('False Match Count:          ' + falsePositives);
  console.log('False Non-Match Count:      ' + falseNegatives);
  console.log('Precision:                  ' + (precision * 100).toFixed(2) + '%');
  console.log('Recall:                     ' + (recall * 100).toFixed(2) + '%');
  console.log('F1 Score:                   ' + (f1 * 100).toFixed(2) + '%');
  console.log('Top-1 Accuracy:             ' + (top1Accuracy * 100).toFixed(2) + '%');
  console.log('Top-3 Recall:               ' + (top3Recall * 100).toFixed(2) + '%');
  console.log('Ambiguous Cases Flagged:    ' + ambiguousCount);
  console.log('Collision False Matches:    ' + collisionFalseMatchCount);
  console.log('Collision Guardrail:        ' + collisionTestsPassed + ' / ' + collisionTestsTotal + ' collisions detected\n');

  console.log('--- Category Breakdown ---');
  for (const [cat, s] of Object.entries(categoryStats)) {
    const catAcc = s.tp + s.fn > 0 ? ((s.top1 / (s.tp + s.fn)) * 100).toFixed(2) + '%' : 'N/A';
    const catTop3 = s.tp + s.fn > 0 ? ((s.top3 / (s.tp + s.fn)) * 100).toFixed(2) + '%' : 'N/A';
    console.log('  ' + cat.padEnd(26) + ' (N=' + String(s.total).padStart(3) + '): TP=' + s.tp + ', FP=' + s.fp + ', TN=' + s.tn + ', FN=' + s.fn + ', Top-1=' + catAcc + ', Top-3=' + catTop3);
  }

  console.log('\n--- Sample Non-Top-1 or Ambiguous Instance ---');
  if (falseOrAmbiguousTop1Samples.length > 0) {
    const s = falseOrAmbiguousTop1Samples[0];
    console.log('Link: ' + s.linkId + ' (' + s.matchType + '), Target: ' + s.targetRecordId);
    console.log('Input: ' + JSON.stringify(s.input));
    console.log('Top candidates retrieved (' + s.candidatesCount + ' total):');
    s.topCandidates.forEach((c, idx) => {
      console.log('  #' + (idx+1) + ': ID=' + c.candidateId + ', Score=' + c.score + ', Tier=' + c.tier + ', isTarget=' + c.isTarget);
      console.log('      Scores: Name=' + c.fieldScores.nameScore + ', DOB=' + c.fieldScores.dobScore + ', Father=' + c.fieldScores.fatherScore + ', Addr=' + c.fieldScores.addressScore);
    });
  }

  // Benchmark Assertions
  assert(precision >= 0.95, 'Precision >= 95% (actual: ' + (precision * 100).toFixed(2) + '%)');
  assert(recall >= 0.95, 'Recall >= 95% (actual: ' + (recall * 100).toFixed(2) + '%)');
  assert(f1 >= 0.95, 'F1 Score >= 95% (actual: ' + (f1 * 100).toFixed(2) + '%)');
  assert(falsePositives === 0, 'False Match Count is 0 (actual: ' + falsePositives + ')');
  assert(falseNegatives === 0, 'False Non-Match Count is 0 (actual: ' + falseNegatives + ')');
  assert(top1Accuracy >= 0.80, 'Top-1 Accuracy >= 80% (actual: ' + (top1Accuracy * 100).toFixed(2) + '%)');
  assert(collisionTestsPassed === collisionTestsTotal, 'All ' + collisionTestsTotal + ' collision test cases detected');

  // 2. Unit Verification Scenarios (20 Comprehensive Difficult Cases)
  console.log('\n--- Unit Verification: 20 Difficult Edge Cases ---');

  // Case 1: Caller-allowed registry filtering
  const res1 = await EntityResolutionEngine.matchEntity({
    name: 'Amit Patel',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true
  });
  const reg1 = new Set(res1.candidates.map(c => c.registry));
  assert(reg1.size === 1 && reg1.has('revenue_registry'), 'Case 1: Only caller-allowed registries queried');

  // Case 2: DPDP Consent gate enforcement
  let blocked2 = false;
  try {
    await EntityResolutionEngine.matchEntity({
      name: 'Amit Patel',
      allowedRegistries: ['revenue_registry'],
      consentVerified: false
    });
  } catch (err) {
    if (err.message.includes('DPDP')) blocked2 = true;
  }
  assert(blocked2, 'Case 2: DPDP Consent gate strictly blocked unconsented query');

  // Case 3: Identical names with conflicting DOB (Homonym collision)
  const eval3 = evaluateCandidate(
    { name: 'Ravi Kumar', dateOfBirth: '1990-05-15', allowedRegistries: ['revenue_registry'], consentVerified: true },
    { name: 'Ravi Kumar', dob: '1975-11-20' }
  );
  assert(eval3.isCollisionWarning && eval3.confidenceTier === 'AMBIGUOUS', 'Case 3: Collision warning on identical name + conflicting DOB');

  // Case 4: Identical names with conflicting Father
  const eval4 = evaluateCandidate(
    { name: 'Ravi Kumar', fatherName: 'Suresh Kumar', allowedRegistries: ['revenue_registry'], consentVerified: true },
    { name: 'Ravi Kumar', father_name: 'Venkatesh Rao' }
  );
  assert(eval4.isCollisionWarning && eval4.confidenceTier === 'AMBIGUOUS', 'Case 4: Collision warning on identical name + conflicting Father');

  // Case 5: Identical names with conflicting District & Address
  const eval5 = evaluateCandidate(
    { name: 'Rahul Sharma', district: 'Hyderabad', address: 'H.No 12, MG Road', allowedRegistries: ['revenue_registry'], consentVerified: true },
    { name: 'Rahul Sharma', district: 'Warangal', address: 'Plot 4, Subhash Nagar' }
  );
  assert(eval5.isCollisionWarning && eval5.confidenceTier === 'AMBIGUOUS', 'Case 5: Collision warning on identical name + conflicting District/Address');

  // Case 6: Standard Initials (Kavitha Yadav ~ Kavitha Y.)
  const sim6 = computeNameSimilarity('Kavitha Yadav', 'Kavitha Y.');
  assert(sim6 >= 0.90, 'Case 6: Standard initials matched (score: ' + sim6.toFixed(3) + ')');

  // Case 7: Unspaced dot initials (K.Yadav ~ Kavitha Yadav)
  const sim7 = computeNameSimilarity('K.Yadav', 'Kavitha Yadav');
  assert(sim7 >= 0.90, 'Case 7: Unspaced dot initials recognized (score: ' + sim7.toFixed(3) + ')');

  // Case 8: Multi-word initials (R. K. Sharma ~ Ravi Kumar Sharma)
  const sim8 = computeNameSimilarity('R. K. Sharma', 'Ravi Kumar Sharma');
  assert(sim8 >= 0.90, 'Case 8: Multi-word initials recognized (score: ' + sim8.toFixed(3) + ')');

  // Case 9: Contradictory surname initial blocked (Amit Patel vs Amit P Sharma)
  const sim9 = computeNameSimilarity('Amit Patel', 'Amit P Sharma');
  assert(sim9 < 0.90, 'Case 9: Contradictory surname initial blocked (score: ' + sim9.toFixed(3) + ' < 0.90)');

  // Case 10: Conflicting surname initials blocked (Suresh Kumar Sharma vs Suresh K Verma)
  const sim10 = computeNameSimilarity('Suresh Kumar Sharma', 'Suresh K Verma');
  assert(sim10 < 0.90, 'Case 10: Conflicting surname initials blocked (score: ' + sim10.toFixed(3) + ' < 0.90)');

  // Case 11: Phonetic / spelling transliteration (Suresh ~ Sures)
  const sim11 = computeNameSimilarity('Suresh Kumar', 'Sures Kumar');
  assert(sim11 >= 0.90, 'Case 11: Phonetic transliteration recognized (score: ' + sim11.toFixed(3) + ')');

  // Case 12: Dot Date format (15.05.1990 -> 1990-05-15)
  assert(normalizeDate('15.05.1990') === '1990-05-15', 'Case 12: Dot date format standardized');

  // Case 13: Slash Date format (1990/05/15 -> 1990-05-15)
  assert(normalizeDate('1990/05/15') === '1990-05-15', 'Case 13: Slash date format standardized');

  // Case 14: DMY Slash Date format (15/05/1990 -> 1990-05-15)
  assert(normalizeDate('15/05/1990') === '1990-05-15', 'Case 14: DMY slash date format standardized');

  // Case 15: Missing optional DOB in query against candidate with DOB
  const eval15 = evaluateCandidate(
    { name: 'Amit Patel', allowedRegistries: ['revenue_registry'], consentVerified: true },
    { name: 'Amit Patel', dob: '1985-04-12' }
  );
  assert(eval15.totalScore >= 0.85 && eval15.confidenceTier === 'HIGH', 'Case 15: Missing DOB in query scored neutrally without penalty');

  // Case 16: Missing optional Father in candidate registry
  const eval16 = evaluateCandidate(
    { name: 'Amit Patel', fatherName: 'Mahesh Patel', allowedRegistries: ['land_registry'], consentVerified: true },
    { name: 'Amit Patel' }
  );
  assert(eval16.totalScore >= 0.85 && !eval16.matchedFields.includes('fatherName'), 'Case 16: Missing father in registry scored neutrally without bogus matchedFields');

  // Case 17: Address abbreviation expansion (Cross Road -> X Rd, Nagar -> Ngr)
  const eval17 = evaluateCandidate(
    { name: 'Amit Patel', address: 'Plot 10, Cross Road, Gandhi Nagar', allowedRegistries: ['revenue_registry'], consentVerified: true },
    { name: 'Amit Patel', address: 'Plot 10, X Rd, Gandhi Ngr' }
  );
  assert(eval17.fieldScores.addressScore >= 0.90, 'Case 17: Address abbreviation expansion matched (score: ' + eval17.fieldScores.addressScore.toFixed(3) + ')');

  // Case 18: Pincode regional match tiers vs 6-digit exact
  const eval18a = evaluateCandidate(
    { name: 'Amit Patel', pincode: '500034', allowedRegistries: ['revenue_registry'], consentVerified: true },
    { name: 'Amit Patel', pincode: '500034' }
  );
  const eval18b = evaluateCandidate(
    { name: 'Amit Patel', pincode: '500034', allowedRegistries: ['revenue_registry'], consentVerified: true },
    { name: 'Amit Patel', pincode: '500081' }
  );
  assert(eval18a.fieldScores.pincodeScore === 1.0 && eval18b.fieldScores.pincodeScore === 0.80, 'Case 18: Exact pincode 1.0 vs sub-district match 0.80');

  // Case 19: Empty search string handling
  const res19 = await EntityResolutionEngine.matchEntity({
    name: '   ',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true
  });
  assert(res19.candidates.length === 0, 'Case 19: Empty search string safely returns 0 candidates');

  // Case 20: Multi-candidate ambiguity detection
  const res20 = await EntityResolutionEngine.matchEntity({
    name: 'Lakshmi Reddy',
    allowedRegistries: ['revenue_registry', 'pan_tax_registry'],
    consentVerified: true
  });
  assert(res20.ambiguityDetected, 'Case 20: Multi-candidate ambiguity detected on competing candidates');

  console.log('\n========================================================');
  console.log('   ALL 20 DIFFICULT CASES & AUDIT CHECKS PASSED (100%)  ');
  console.log('========================================================');

  try {
    await closeAuthoritativeDb();
  } catch {}
  process.exit(0);
}

main().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
