/**
 * Seva Saarthi Model 2 V4 - Core Transformer & Embedding Provider Tests
 */

import { MultilingualE5BaseTransformerProvider } from '../src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider';
import { EmbeddingCache } from '../src/lib/server/ai/entity-resolution/v4-transformer/embedding-cache';
import { SemanticSimilarityEngine } from '../src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function runTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4 TRANSFORMER PROVIDER & CACHE TESTS          ');
  console.log('========================================================================\n');

  const provider = new MultilingualE5BaseTransformerProvider();

  // Test 1: Model Identifier & Dimensionality
  console.log('--- Test 1: Model Metadata & Vector Dimensions ---');
  assert(provider.modelId === 'intfloat/multilingual-e5-base', 'Model ID is intfloat/multilingual-e5-base');
  assert(provider.dimension === 768, 'Embedding dimension is exactly 768');
  assert(provider.maxTokens === 512, 'Max token length is 512');

  // Test 2: Embedding Generation & Normalization
  console.log('\n--- Test 2: Embedding Generation & L2 Unit Normalization ---');
  const vec1 = await provider.embed('query: name: Ravi Kumar | district: Hyderabad');
  assert(vec1.length === 768, 'Generated vector has 768 elements');
  let normSq = 0;
  for (let i = 0; i < vec1.length; i++) normSq += vec1[i] * vec1[i];
  const l2Norm = Math.sqrt(normSq);
  assert(Math.abs(l2Norm - 1.0) < 1e-4, `Vector is unit-normalized (L2 norm: ${l2Norm.toFixed(4)})`);

  // Test 3: Determinism & Reproducibility
  console.log('\n--- Test 3: Deterministic Inference Reproducibility ---');
  const vec2 = await provider.embed('query: name: Ravi Kumar | district: Hyderabad');
  let isIdentical = true;
  for (let i = 0; i < vec1.length; i++) {
    if (vec1[i] !== vec2[i]) {
      isIdentical = false;
      break;
    }
  }
  assert(isIdentical, 'Two runs on identical text produce identical float embeddings');

  // Test 4: Cosine Similarity
  console.log('\n--- Test 4: Semantic Cosine Similarity Range ---');
  const vecPassage = await provider.embed('passage: name: Ravi Kumar | district: Hyderabad');
  const simIdentical = provider.similarity(vec1, vec1);
  const simPassage = provider.similarity(vec1, vecPassage);
  const vecUnrelated = await provider.embed('passage: name: Sunita Devi | district: Patna');
  const simUnrelated = provider.similarity(vec1, vecUnrelated);

  assert(simIdentical >= 0.999, `Self-similarity is ~1.0 (got ${simIdentical.toFixed(4)})`);
  assert(simPassage > simUnrelated, `Semantically close passage (${simPassage.toFixed(3)}) > unrelated passage (${simUnrelated.toFixed(3)})`);
  assert(simUnrelated >= 0.0 && simUnrelated <= 1.0, 'Similarity score is bounded in [0.0, 1.0]');

  // Test 5: Embedding Cache SHA-256 Hashing & Invalidation
  console.log('\n--- Test 5: Safe Embedding Cache Key Hashing & Invalidation ---');
  const cache = EmbeddingCache.getInstance(100);
  cache.clear();

  const key1 = EmbeddingCache.computeCacheKey('name: Ravi Kumar | district: Hyderabad', provider.modelId);
  const key2 = EmbeddingCache.computeCacheKey('name: Ravi Kumar | district: Hyderabad', provider.modelId);
  assert(key1 === key2, 'Cache key is deterministic SHA-256');

  cache.set(key1, vec1, 'name: Ravi Kumar | district: Hyderabad', 'revenue_registry');
  assert(cache.has(key1), 'Cache contains stored embedding');
  const cachedVec = cache.get(key1);
  assert(cachedVec !== null && cachedVec[0] === vec1[0], 'Retrieved embedding matches cached vector');

  // Audit: sensitive pattern blocking in cache
  const blocked = cache.set('bad-key', vec1, 'Aadhaar: 1234 5678 9012', 'revenue_registry');
  assert(!blocked, 'Cache strictly blocks storing raw Aadhaar pattern');

  // Invalidation by registry
  const invalidatedCount = cache.invalidateByRegistry('revenue_registry');
  assert(invalidatedCount === 1, 'Invalidated 1 entry for revenue_registry');
  assert(!cache.has(key1), 'Entry is no longer in cache');

  // Test 6: Controlled Semantic Representation & PII Stripping
  console.log('\n--- Test 6: Controlled Semantic Representation Formatter ---');
  const queryRep = SemanticSimilarityEngine.formatQuerySemanticText({
    name: 'Ravi Kumar',
    district: 'Hyderabad',
    pincode: '500001',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  });
  assert(queryRep.text.startsWith('query: '), 'Query text is prefixed with "query: "');
  assert(queryRep.text.includes('name: Ravi Kumar'), 'Query contains name field');
  assert(!queryRep.hasSensitiveFields, 'Query has no sensitive fields flagged');

  const passageRep = SemanticSimilarityEngine.formatPassageSemanticText(
    {
      name: 'Ravi Kumar',
      district: 'Hyderabad',
      pan_reference: 'SECRET-PAN-123',
    },
    'revenue_registry'
  );
  assert(passageRep.text.startsWith('passage: '), 'Passage text is prefixed with "passage: "');
  assert(!passageRep.text.includes('SECRET-PAN-123'), 'Passage text strictly stripped sensitive PAN reference');

  console.log('\n========================================================================');
  console.log('   ALL V4 TRANSFORMER & CACHE UNIT TESTS PASSED (100%)                  ');
  console.log('========================================================================');
}

runTests().catch((err) => {
  console.error('[FATAL] Test failure:', err);
  process.exit(1);
});
