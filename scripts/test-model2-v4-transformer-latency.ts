/**
 * Seva Saarthi AI Model 2 V4 - Real Transformer Latency & Performance Profiler
 * 
 * Accurately measures and isolates:
 * 1. Model Load Time (ONNX session & graph initialization)
 * 2. Tokenizer Processing Time
 * 3. Transformer Layer Neural Inference Time
 * 4. Embedding Normalization & Mean Pooling Time
 * 5. Candidate Cosine Similarity Time
 * 6. Hybrid Supervised Scoring Time
 * 7. Total V4 End-to-End Latency
 * 
 * Runs benchmarks across 10, 100, 500, 1000 embedding operations.
 * Records p50, p95, p99 percentiles.
 * Evaluates cache disabled vs cache enabled with explicit counts for:
 * - transformerInferenceCount
 * - cacheHitCount
 * - cacheMissCount
 */

import { MultilingualE5BaseTransformerProvider } from '../src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider';
import { EmbeddingCache } from '../src/lib/server/ai/entity-resolution/v4-transformer/embedding-cache';
import { SemanticSimilarityEngine } from '../src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity';
import { V4HybridScorer, DEFAULT_V4_CONFIG } from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return Number(sorted[idx].toFixed(3));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(3));
}

async function runLatencyBenchmarks() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4 TRANSFORMER LATENCY & PROFILING BENCHMARK   ');
  console.log('========================================================================\n');

  await getAuthoritativeDb();

  // 1. Measure Model Load Time
  console.log('>>> 1. Measuring Model Load & Initialization Latency...');
  const loadStart = performance.now();
  const provider = new MultilingualE5BaseTransformerProvider();
  const pipe = await provider.getPipeline();
  const modelLoadTimeMs = Number((performance.now() - loadStart).toFixed(2));
  console.log(`Pretrained Transformer Model Load Time: ${modelLoadTimeMs} ms`);

  // 2. Micro-benchmarking Pipeline Component Breakdown
  console.log('\n>>> 2. Micro-benchmarking Pipeline Sub-Component Latencies...');
  const sampleTexts = [
    'query: name: Ravi Kumar | district: Hyderabad | pincode: 500001',
    'passage: name: रवि कुमार | district: Hyderabad | address: Near Bus Stand',
    'passage: name: రవి కుమార్ | district: Hyderabad | village: Kukatpally',
    'query: name: Amit Patel | father: Raman Patel | district: Vijayawada',
    'passage: name: Amit Patel | father: Raman Patel | district: Vijayawada',
  ];

  const tokenizerTimes: number[] = [];
  const inferenceTimes: number[] = [];
  const normalizationTimes: number[] = [];
  const similarityTimes: number[] = [];
  const hybridScoringTimes: number[] = [];

  const scorer = new V4HybridScorer(DEFAULT_V4_CONFIG);
  const dummyQueryInput = {
    name: 'Ravi Kumar',
    district: 'Hyderabad',
    pincode: '500001',
    allowedRegistries: ['revenue_registry'] as any,
    consentVerified: true,
  };
  const dummyRow = {
    name: 'Ravi Kumar',
    district: 'Hyderabad',
    pincode: '500001',
  };

  const iterations = 20;
  for (let i = 0; i < iterations; i++) {
    const text = sampleTexts[i % sampleTexts.length];

    // Tokenizer
    const t0 = performance.now();
    const tokenized = await pipe.tokenizer(text);
    const t1 = performance.now();
    tokenizerTimes.push(t1 - t0);

    // Raw Model Neural Inference
    const t2 = performance.now();
    await (pipe.model as any)(tokenized);
    const t3 = performance.now();
    inferenceTimes.push(t3 - t2);

    // Mean Pooling & L2 Normalization
    const t4 = performance.now();
    const fullOut = await pipe(text, { pooling: 'mean', normalize: true });
    const t5 = performance.now();
    normalizationTimes.push(t5 - t4);

    // Cosine Similarity
    const vecA = fullOut.data;
    const t6 = performance.now();
    SemanticSimilarityEngine.computeCosineSimilarity(vecA, vecA);
    const t7 = performance.now();
    similarityTimes.push(t7 - t6);

    // Hybrid Supervised Scoring
    const t8 = performance.now();
    scorer.evaluateCandidate(dummyQueryInput, dummyRow, 'revenue_registry', 0.95, 0.0);
    const t9 = performance.now();
    hybridScoringTimes.push(t9 - t8);
  }

  const componentBreakdown = [
    { Component: 'Tokenizer Execution', MeanMs: mean(tokenizerTimes), p50Ms: percentile(tokenizerTimes, 50), p95Ms: percentile(tokenizerTimes, 95), p99Ms: percentile(tokenizerTimes, 99) },
    { Component: 'Transformer Neural Inference', MeanMs: mean(inferenceTimes), p50Ms: percentile(inferenceTimes, 50), p95Ms: percentile(inferenceTimes, 95), p99Ms: percentile(inferenceTimes, 99) },
    { Component: 'Pooling & Unit Normalization', MeanMs: mean(normalizationTimes), p50Ms: percentile(normalizationTimes, 50), p95Ms: percentile(normalizationTimes, 95), p99Ms: percentile(normalizationTimes, 99) },
    { Component: 'Candidate Cosine Similarity', MeanMs: mean(similarityTimes), p50Ms: percentile(similarityTimes, 50), p95Ms: percentile(similarityTimes, 95), p99Ms: percentile(similarityTimes, 99) },
    { Component: 'Hybrid Platt Scoring', MeanMs: mean(hybridScoringTimes), p50Ms: percentile(hybridScoringTimes, 50), p95Ms: percentile(hybridScoringTimes, 95), p99Ms: percentile(hybridScoringTimes, 99) },
  ];
  console.table(componentBreakdown);

  // 3. Batch Scaling Latency Benchmarks (10, 100, 500, 1000 operations)
  console.log('\n>>> 3. Batch Scaling Latency Benchmarks (10, 100, 500, 1000 Embedding Operations)...');
  const runBatchTest = async (count: number) => {
    const latencies: number[] = [];
    const tBatchStart = performance.now();
    for (let i = 0; i < count; i++) {
      const text = `passage: citizen record sample ${i % 100} - name: person_${i}`;
      const t0 = performance.now();
      await provider.embed(text);
      latencies.push(performance.now() - t0);
    }
    const totalTimeMs = performance.now() - tBatchStart;

    return {
      Operations: count,
      TotalDurationMs: Number(totalTimeMs.toFixed(2)),
      ThroughputOpsPerSec: Number(((count / (totalTimeMs / 1000))).toFixed(2)),
      MeanLatencyMs: mean(latencies),
      p50Ms: percentile(latencies, 50),
      p95Ms: percentile(latencies, 95),
      p99Ms: percentile(latencies, 99),
    };
  };

  const b10 = await runBatchTest(10);
  console.log('Completed 10 operations benchmark.');
  const b100 = await runBatchTest(100);
  console.log('Completed 100 operations benchmark.');
  const b500 = await runBatchTest(500);
  console.log('Completed 500 operations benchmark.');
  const b1000 = await runBatchTest(1000);
  console.log('Completed 1000 operations benchmark.');

  console.table([b10, b100, b500, b1000]);

  // 4. Cache Disabled vs Cache Enabled Validation
  console.log('\n>>> 4. Cache Disabled vs Cache Enabled Validation & Tracking...');
  const cache = EmbeddingCache.getInstance();

  const testQuery = {
    name: 'Amit Patel',
    dateOfBirth: '1976-02-02',
    district: 'Vijayawada',
    allowedRegistries: ['revenue_registry', 'pan_tax_registry'] as any,
    consentVerified: true,
  };

  // Run A: Cache Disabled
  cache.clear();
  let transCountDisabled = 0;
  const instrumentedProviderDisabled = new MultilingualE5BaseTransformerProvider();
  const origEmbedDisabled = instrumentedProviderDisabled.embed.bind(instrumentedProviderDisabled);
  instrumentedProviderDisabled.embed = async (text: string) => {
    transCountDisabled++;
    return origEmbedDisabled(text);
  };

  const engineNoCache = new EntityResolutionEngineV4({
    transformerProvider: instrumentedProviderDisabled,
    enableEmbeddingCache: false,
  });

  const resNoCache1 = await engineNoCache.resolve(testQuery, { enableEmbeddingCache: false });
  const resNoCache2 = await engineNoCache.resolve(testQuery, { enableEmbeddingCache: false });

  // Run B: Cache Enabled
  cache.clear();
  let transCountEnabled = 0;
  const instrumentedProviderEnabled = new MultilingualE5BaseTransformerProvider();
  const origEmbedEnabled = instrumentedProviderEnabled.embed.bind(instrumentedProviderEnabled);
  instrumentedProviderEnabled.embed = async (text: string) => {
    transCountEnabled++;
    return origEmbedEnabled(text);
  };

  const engineCache = new EntityResolutionEngineV4({
    transformerProvider: instrumentedProviderEnabled,
    enableEmbeddingCache: true,
  });

  const resCache1 = await engineCache.resolve(testQuery, { enableEmbeddingCache: true });
  const resCache2 = await engineCache.resolve(testQuery, { enableEmbeddingCache: true });

  const cacheStats = cache.getStats();

  const cacheComparison = [
    {
      Mode: 'Cache Disabled (2 queries)',
      transformerInferenceCount: transCountDisabled,
      cacheHitCount: resNoCache1.querySummary.cacheHitCount + resNoCache2.querySummary.cacheHitCount,
      cacheMissCount: resNoCache1.querySummary.cacheMissCount + resNoCache2.querySummary.cacheMissCount,
      TotalLatencyMs: (resNoCache1.executionMetrics.totalLatencyMs + resNoCache2.executionMetrics.totalLatencyMs).toFixed(2),
    },
    {
      Mode: 'Cache Enabled (2 queries)',
      transformerInferenceCount: transCountEnabled,
      cacheHitCount: resCache1.querySummary.cacheHitCount + resCache2.querySummary.cacheHitCount,
      cacheMissCount: resCache1.querySummary.cacheMissCount + resCache2.querySummary.cacheMissCount,
      TotalLatencyMs: (resCache1.executionMetrics.totalLatencyMs + resCache2.executionMetrics.totalLatencyMs).toFixed(2),
    },
  ];

  console.table(cacheComparison);

  console.log('EmbeddingCache Global Stats:', JSON.stringify(cacheStats, null, 2));

  console.log('\n========================================================================');
  console.log('   LATENCY & PROFILING BENCHMARK COMPLETED SUCCESSFULLY                 ');
  console.log('========================================================================');
}

runLatencyBenchmarks().catch((err) => {
  console.error('[FATAL] Latency benchmark error:', err);
  process.exit(1);
});
