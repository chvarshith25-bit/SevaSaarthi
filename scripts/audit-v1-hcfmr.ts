import fs from 'fs';
import path from 'path';
import { generateValidationSeed50505Corpus } from './benchmark-model2-v4-validation-seed50505';
import { evaluateCandidate as evaluateCandidateV1 } from '../src/lib/server/ai/entity-resolution/scorer';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { MultilingualE5BaseTransformerProvider } from '../src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider';
import { SemanticSimilarityEngine } from '../src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity';
import { EmbeddingCache } from '../src/lib/server/ai/entity-resolution/v4-transformer/embedding-cache';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';

async function auditV1Cases() {
  const db = await getAuthoritativeDb();
  const queries = await generateValidationSeed50505Corpus();
  
  const provider = new MultilingualE5BaseTransformerProvider();
  const embeddingCache = EmbeddingCache.getInstance();
  const sim = new SemanticSimilarityEngine(provider, embeddingCache);
  const v4Engine = new EntityResolutionEngineV4(db, sim);

  const negativeQueries = queries.filter(q => !q.isMatch);
  console.log(`Total Negative/Collision/Unauthorized Queries in Seed 50505: ${negativeQueries.length}`);

  const v1HighConfCases: any[] = [];

  for (const qItem of negativeQueries) {
    let rawCandidates: any[] = [];
    try {
      rawCandidates = await (v4Engine as any).retrieveCandidateRows(qItem.query, 25);
    } catch {
      rawCandidates = [];
    }

    const candMatchesV1 = rawCandidates.map((cand: any) => {
      const evalRes = evaluateCandidateV1(qItem.query as any, cand.row);
      return {
        ...evalRes,
        citizenId: cand.row.citizen_id || cand.row.master_citizen_id,
        candidateId: cand.row.id || cand.row.citizen_id,
        registry: cand.registry,
        rawRow: cand.row
      };
    });
    const sortedV1 = [...candMatchesV1].sort((a: any, b: any) => b.totalScore - a.totalScore);
    const topV1 = sortedV1[0];

    if (topV1 && topV1.confidenceTier === 'HIGH') {
      v1HighConfCases.push({
        queryId: qItem.id,
        category: qItem.category,
        query: qItem.query,
        topV1: {
          citizenId: topV1.citizenId,
          score: topV1.totalScore,
          tier: topV1.confidenceTier,
          matchedFields: topV1.matchedFields,
          fieldScores: topV1.fieldScores,
          registry: topV1.registry
        }
      });
    }
  }

  console.log(`\n=================== V1 HIGH CONFIDENCE FALSE MATCHES AUDIT (${v1HighConfCases.length} cases) ===================`);
  
  // Categorize by query category
  const categoryCounts: Record<string, number> = {};
  v1HighConfCases.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });
  console.log('Breakdown by Category:', categoryCounts);

  // Print sample cases
  console.log('\nSample V1 High-Confidence Negative Matches:');
  v1HighConfCases.slice(0, 8).forEach((c, idx) => {
    console.log(`\n--- Case ${idx+1} (${c.queryId}) ---`);
    console.log(`Category: ${c.category}`);
    console.log(`Query: Name="${c.query.name}", DOB="${c.query.dateOfBirth}", Father="${c.query.fatherName}", Dist="${c.query.district}"`);
    console.log(`V1 Matched: Citizen="${c.topV1.citizenId}", Reg="${c.topV1.registry}", Score=${c.topV1.score}, Tier=${c.topV1.tier}`);
    console.log(`V1 Matched Fields:`, c.topV1.matchedFields);
    console.log(`V1 Field Scores:`, c.topV1.fieldScores);
  });
}

auditV1Cases().catch(console.error);
