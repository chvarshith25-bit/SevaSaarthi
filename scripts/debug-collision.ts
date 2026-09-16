import { generateCleanSeed20202Benchmark } from './benchmark-model2-v4-seed20202';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { V4HybridScorer, DEFAULT_V4_2_CONFIG } from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';
import { V4IdentityConsolidator } from '../src/lib/server/ai/entity-resolution/v4-transformer/identity-consolidator';

async function test() {
  const benchmarkQueries = await generateCleanSeed20202Benchmark();
  const collisionQueries = benchmarkQueries.filter(q => q.isCollisionCase);
  const v4Engine = EntityResolutionEngineV4.getInstance();
  const scorerV4_2 = new V4HybridScorer(DEFAULT_V4_2_CONFIG);

  console.log('Total collision queries:', collisionQueries.length);
  for (let i = 0; i < Math.min(10, collisionQueries.length); i++) {
    const item = collisionQueries[i];
    const rawCandidates = await (v4Engine as any).retrieveCandidateRows(item.query, 25);
    
    // V3.1
    let candMatchesV3 = rawCandidates.map((cand: any) =>
      EntityResolutionEngineV3.evaluateCandidateV3(item.query, cand.row, cand.registry, 0.0)
    );
    const consV3 = EntityResolutionEngineV3.consolidateIdentityCandidates(
      item.query, candMatchesV3, EntityResolutionEngineV3.getModelConfig().thresholds
    );

    // V4.2
    let candMatchesV4 = rawCandidates.map((cand: any) =>
      scorerV4_2.evaluateCandidate(item.query, cand.row, cand.registry, 0.0, 0.0)
    );
    const consV4 = V4IdentityConsolidator.consolidate(
      item.query, candMatchesV4, DEFAULT_V4_2_CONFIG.thresholds
    );

    const top3 = consV3.consolidatedCandidates[0];
    const top4 = consV4.consolidatedCandidates[0];
    console.log(`\nQuery ${item.id} (${item.category}):`);
    console.log('V3.1 top:', top3?.confidenceTier, 'isCol:', top3?.isCollisionWarning, 'score:', top3?.totalScore, 'ambig:', consV3.ambiguityDetected);
    console.log('V4.2 top:', top4?.confidenceTier, 'isCol:', top4?.isCollisionWarning, 'score:', top4?.totalScore, 'ambig:', consV4.ambiguityDetected);
    if (top4?.confidenceTier !== 'AMBIGUOUS' && !top4?.isCollisionWarning && !consV4.ambiguityDetected) {
      console.log('  MISMATCH! V4.2 candidates count:', candMatchesV4.length);
      for (const c of candMatchesV4) {
        console.log('   - Cand:', c.citizenId, c.registry, 'score:', c.totalScore, 'tier:', c.confidenceTier, 'isCol:', c.isCollisionWarning, 'fields:', c.fieldScores);
      }
    }
  }
}
test();
