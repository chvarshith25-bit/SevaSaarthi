import fs from 'fs';
import path from 'path';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { MultilingualE5BaseTransformerProvider } from '../src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider';
import { SemanticSimilarityEngine } from '../src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity';
import { EmbeddingCache } from '../src/lib/server/ai/entity-resolution/v4-transformer/embedding-cache';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';

async function testTuning() {
  const db = await getAuthoritativeDb();
  const { generateFreshShadowSeed40404Corpus } = await import('./benchmark-model2-v4-shadow-seed40404');
  const queries = await generateFreshShadowSeed40404Corpus();
  
  console.log('Loaded queries:', queries.length);
  
  // Test subset: English + 7 false positive cases + Indic
  const provider = new MultilingualE5BaseTransformerProvider();
  const embeddingCache = EmbeddingCache.getInstance();
  const sim = new SemanticSimilarityEngine(provider, embeddingCache);
  const v4 = new EntityResolutionEngineV4(db, sim);
  
  // Test the 7 false positive queries specifically
  const targetIds = [
    'SHADOW-40404-00232',
    'SHADOW-40404-00496',
    'SHADOW-40404-00544',
    'SHADOW-40404-02352',
    'SHADOW-40404-02368',
    'SHADOW-40404-02512',
    'SHADOW-40404-02680',
  ];
  
  const fpQueries = queries.filter(q => targetIds.includes(q.id));
  console.log(`Found ${fpQueries.length} target FP queries.`);
  
  for (const q of fpQueries) {
    const res = await v4.resolve(q.query);
    console.log(`Query ${q.id} (${q.category}): tier=${res.bestMatch?.confidenceTier}, score=${res.bestMatch?.similarityScore}, isCollision=${res.bestMatch?.collisionWarning}`);
  }
}

testTuning().catch(console.error);
