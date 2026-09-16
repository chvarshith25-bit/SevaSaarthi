import fs from 'fs';
import path from 'path';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';

async function run() {
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

  const bypassCases: any[] = [];

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    const cat = req.category;
    if (cat === 'HOMONYM_COLLISION') {
      const v3Res = await EntityResolutionEngineV3.matchEntityV3(req.query);
      const v3Top = v3Res.bestMatch;
      if (v3Top && v3Top.totalScore >= 0.60 && !v3Top.isCollisionWarning && v3Top.confidenceTier !== 'AMBIGUOUS') {
        bypassCases.push({
          index: i,
          req,
          v3Res,
          v3Top,
        });
      }
    }
  }

  console.log(`Found ${bypassCases.length} homonym collision bypass cases.\n`);

  for (let idx = 0; idx < bypassCases.length; idx++) {
    const { index, req, v3Res, v3Top } = bypassCases[idx];
    console.log(`========================================================================`);
    console.log(`BYPASS CASE #${idx + 1} (Request Index: ${index})`);
    console.log(`========================================================================`);
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('Ground Truth:', JSON.stringify(req.groundTruth, null, 2));
    console.log('Best Match:');
    console.log(`  Candidate ID: ${v3Top.candidateId}`);
    console.log(`  Citizen ID: ${v3Top.citizenId}`);
    console.log(`  Registry: ${v3Top.registryKey}`);
    console.log(`  Total Score / Prob: ${v3Top.totalScore}`);
    console.log(`  Confidence Tier: ${v3Top.confidenceTier}`);
    console.log(`  isCollisionWarning: ${v3Top.isCollisionWarning}`);
    console.log(`  Supporting Registries: ${JSON.stringify(v3Top.supportingRegistries)}`);
    console.log(`  Field Similarities:`, JSON.stringify(v3Top.fieldSimilarities, null, 2));
    console.log(`  Match Details:`, JSON.stringify(v3Top.matchDetails, null, 2));
    console.log(`  Ambiguity Detected in Response: ${v3Res.ambiguityDetected}`);
    console.log(`  Total Candidates returned: ${v3Res.candidates.length}`);
    for (let cIdx = 0; cIdx < v3Res.candidates.length; cIdx++) {
      const c = v3Res.candidates[cIdx];
      console.log(`    Candidate [${cIdx}]: cid=${c.candidateId}, mid=${c.citizenId}, reg=${c.registryKey}, score=${c.totalScore}, tier=${c.confidenceTier}, warn=${c.isCollisionWarning}`);
    }
    console.log('\n');
  }
}

run().catch(console.error);
