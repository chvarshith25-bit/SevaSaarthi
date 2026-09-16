import { generateCleanSeed20202Benchmark } from './benchmark-model2-v4-seed20202';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { V4HybridScorer, DEFAULT_V4_2_CONFIG, DEFAULT_V4_1_CONFIG } from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';
import { V4IdentityConsolidator } from '../src/lib/server/ai/entity-resolution/v4-transformer/identity-consolidator';

async function test() {
  const benchmarkQueries = await generateCleanSeed20202Benchmark();
  const collisionQueries = benchmarkQueries.filter(q => q.isCollisionCase);
  const v4Engine = EntityResolutionEngineV4.getInstance();
  const scorerV4_2 = new V4HybridScorer(DEFAULT_V4_2_CONFIG);

  let v3False = 0;
  let v4False = 0;

  for (const item of collisionQueries) {
    const rawCandidates = await (v4Engine as any).retrieveCandidateRows(item.query, 25);
    
    // V3.1
    let candMatchesV3 = rawCandidates.map((cand: any) =>
      EntityResolutionEngineV3.evaluateCandidateV3(item.query, cand.row, cand.registry, 0.0)
    );
    const consV3 = EntityResolutionEngineV3.consolidateIdentityCandidates(
      item.query, candMatchesV3, EntityResolutionEngineV3.getModelConfig().thresholds
    );
    const topV3 = consV3.consolidatedCandidates[0];
    const isV3Col = topV3?.isCollisionWarning ?? false;
    const isV3Reviewed = topV3?.confidenceTier === 'AMBIGUOUS' || consV3.ambiguityDetected || isV3Col;
    if (!isV3Reviewed && topV3) {
      v3False++;
    }

    // V4.2
    let candMatchesV4 = rawCandidates.map((cand: any) =>
      scorerV4_2.evaluateCandidate(item.query, cand.row, cand.registry, 0.0, 0.0)
    );
    const consV4 = V4IdentityConsolidator.consolidate(
      item.query, candMatchesV4, DEFAULT_V4_2_CONFIG.thresholds
    );
    const topV4 = consV4.consolidatedCandidates[0];
    const isV4Col = topV4?.isCollisionWarning ?? false;
    const isV4Reviewed = topV4?.confidenceTier === 'AMBIGUOUS' || consV4.ambiguityDetected || isV4Col;
    if (!isV4Reviewed && topV4) {
      v4False++;
      console.log(`V4.2 false match on query ${item.id}: tier=${topV4.confidenceTier}, score=${topV4.totalScore}, ambig=${consV4.ambiguityDetected}, name=${item.query.name}`);
      for (const c of candMatchesV4) {
        console.log(`  cand ${c.citizenId} reg=${c.registry} tier=${c.confidenceTier} score=${c.totalScore} isCol=${c.isCollisionWarning} nameSim=${c.fieldScores.nameScore} dobSim=${c.fieldScores.dobScore} fatherSim=${c.fieldScores.fatherScore}`);
      }
    }
  }

  console.log(`Summary: total collision queries = ${collisionQueries.length}`);
  console.log(`V3.1 False Matches = ${v3False}`);
  console.log(`V4.2 False Matches = ${v4False}`);
}
test();
