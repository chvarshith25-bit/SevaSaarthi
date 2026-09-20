import fs from 'fs';
import path from 'path';
import { evaluateCandidate as evaluateCandidateV1 } from '../src/lib/server/ai/entity-resolution/scorer';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { MultilingualE5BaseTransformerProvider } from '../src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider';
import { SemanticSimilarityEngine } from '../src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity';
import { EmbeddingCache } from '../src/lib/server/ai/entity-resolution/v4-transformer/embedding-cache';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';
import { CrossRegistryGraphCorroborator } from '../src/lib/server/ai/entity-resolution/graph';

async function diagnose() {
  const db = await getAuthoritativeDb();
  
  // Load queries from benchmark generator
  const { generateFreshShadowSeed40404Corpus } = await import('./benchmark-model2-v4-shadow-seed40404');
  const queries = await generateFreshShadowSeed40404Corpus();
  
  console.log('Total Generated Queries:', queries.length);
  
  const provider = new MultilingualE5BaseTransformerProvider();
  const embeddingCache = EmbeddingCache.getInstance();
  const sim = new SemanticSimilarityEngine(provider, embeddingCache);
  const v4 = new EntityResolutionEngineV4(db, sim);
  
  // Warm cache
  const allRegistriesData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/synthetic/all_registries.json'), 'utf8')
  );
  const uniqueTexts = new Set<string>();
  const citizens = allRegistriesData.citizens || [];
  for (const c of citizens) {
    uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('name', c.full_name, false).text);
    uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('name', c.full_name, true).text);
    if (c.father_name) {
      uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('father', c.father_name, false).text);
      uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('father', c.father_name, true).text);
    }
  }
  const textArray = Array.from(uniqueTexts);
  for (let b = 0; b < textArray.length; b += 32) {
    const batch = textArray.slice(b, b + 32);
    const embs = await provider.embedBatch(batch);
    for (let k = 0; k < batch.length; k++) {
      const key = EmbeddingCache.computeCacheKey(batch[k], provider.modelId);
      embeddingCache.set(key, embs[k], batch[k]);
    }
  }
  
  const negativeQueries = queries.filter(q => !q.isMatch);
  console.log('Total Negative/Collision/Unauthorized queries:', negativeQueries.length);
  
  const falsePositives: any[] = [];
  
  for (const q of negativeQueries) {
    if (!q.query.consentVerified) continue;
    
    const rawCandidates = await (v4 as any).retrieveCandidateRows(q.query, 25);
    
    // V1
    const candMatchesV1 = rawCandidates.map((cand: any) => {
      const evalRes = evaluateCandidateV1(q.query as any, cand.row);
      return {
        ...evalRes,
        citizenId: cand.row.citizen_id || cand.row.master_citizen_id,
        candidateId: cand.row.id || cand.row.citizen_id,
      };
    });
    const sortedV1 = [...candMatchesV1].sort((a: any, b: any) => b.totalScore - a.totalScore);
    const topV1 = sortedV1[0];

    // V3
    let candMatchesV3 = rawCandidates.map((cand: any) =>
      EntityResolutionEngineV3.evaluateCandidateV3(q.query as any, cand.row, cand.registry, 0.0)
    );
    if (q.query.allowedRegistries.length > 1 && candMatchesV3.length > 0) {
      const graphMap = CrossRegistryGraphCorroborator.corroborateCandidates(candMatchesV3);
      candMatchesV3 = candMatchesV3.map((c: any) => {
        const gr = graphMap.get(c.candidateId);
        if (gr && gr.corroborationBonus > 0 && !c.isCollisionWarning) {
          return EntityResolutionEngineV3.evaluateCandidateV3(q.query as any, c.rawRecord, c.registry, gr.corroborationBonus);
        }
        return c;
      });
    }
    const consV3 = EntityResolutionEngineV3.consolidateIdentityCandidates(
      q.query as any,
      candMatchesV3,
      EntityResolutionEngineV3.getModelConfig().thresholds
    );
    const topV3 = consV3.consolidatedCandidates[0];

    // V4
    let resV4: any = null;
    try {
      resV4 = await v4.resolve(q.query);
    } catch (e) {
      resV4 = null;
    }
    
    if (resV4 && resV4.bestMatch && resV4.bestMatch.confidenceTier === 'HIGH') {
      falsePositives.push({
        query: q,
        v4: resV4,
        topV1,
        topV3
      });
    }
  }
  
  console.log(`\n=================== AUDIT OF THE ${falsePositives.length} FALSE POSITIVES ===================`);
  
  falsePositives.forEach((fp, idx) => {
    console.log(`\n------------------- False Positive Case #${idx + 1} -------------------`);
    console.log('Query ID:', fp.query.id);
    console.log('Category:', fp.query.category);
    console.log('Expected Citizen ID:', fp.query.expectedCitizenId || 'NONE');
    console.log('Query Input:', JSON.stringify(fp.query.query));
    console.log('V4 Best Match:', {
      citizenId: fp.v4.bestMatch?.masterCitizenId || fp.v4.bestMatch?.citizenId,
      score: fp.v4.bestMatch?.similarityScore,
      tier: fp.v4.bestMatch?.confidenceTier,
      isCollision: fp.v4.bestMatch?.collisionWarning,
      explanation: fp.v4.bestMatch?.explanation
    });
    console.log('V4 Candidates Top 3:');
    fp.v4.candidates.slice(0, 3).forEach((c: any, i: number) => {
      console.log(`  Candidate ${i+1}: ID=${c.masterCitizenId || c.citizenId}, Score=${c.similarityScore}, Registry=${c.registry}`);
      console.log(`    FieldScores:`, c.fieldScores);
      console.log(`    MissingFields:`, c.missingFields);
      console.log(`    CollisionFlags:`, c.collisionFlags);
    });
    console.log('V4 Gating Decision:', JSON.stringify(fp.v4.gatingDecision));
    console.log('V1 Decision:', {
      tier: fp.topV1?.confidenceTier,
      score: fp.topV1?.totalScore,
      citizenId: fp.topV1?.citizenId,
      isCollision: fp.topV1?.isCollisionWarning
    });
    console.log('V3.1 Decision:', {
      tier: fp.topV3?.confidenceTier,
      score: fp.topV3?.totalScore,
      citizenId: fp.topV3?.citizenId,
      isCollision: fp.topV3?.isCollisionWarning
    });
  });
}

diagnose().catch(err => {
  console.error(err);
  process.exit(1);
});
