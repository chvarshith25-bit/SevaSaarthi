/**
 * Seva Saarthi Model 2 V4 - Comprehensive Integrity Audit & Benchmark Validation Script
 * Seed: 7777
 */

import fs from 'fs';
import path from 'path';
import { EntityResolutionEngine } from '../src/lib/server/ai/entity-resolution/engine';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { MultilingualE5BaseTransformerProvider } from '../src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider';
import { SemanticSimilarityEngine } from '../src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity';
import { EmbeddingCache } from '../src/lib/server/ai/entity-resolution/v4-transformer/embedding-cache';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';
import { V4IdentityConsolidator } from '../src/lib/server/ai/entity-resolution/v4-transformer/identity-consolidator';
import { DEFAULT_V4_CONFIG } from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';

// Seeded PRNG (Mulberry32)
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface BenchmarkQuery {
  id: string;
  category: string;
  language: string;
  expectedCitizenId?: string;
  isMatch: boolean;
  isCollisionCase: boolean;
  query: {
    name: string;
    dateOfBirth?: string;
    fatherName?: string;
    guardianName?: string;
    address?: string;
    district?: string;
    state?: string;
    pincode?: string;
    allowedRegistries: any[];
    consentVerified: boolean;
  };
}

function calculatePercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return Number(sorted[idx].toFixed(4));
}

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(4));
}

export async function generateCleanSeed7777Benchmark(): Promise<BenchmarkQuery[]> {
  const prng = mulberry32(7777);
  const allRegistriesData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/synthetic/all_registries.json'), 'utf8')
  );
  const citizens = allRegistriesData.citizens || [];
  const queries: BenchmarkQuery[] = [];

  const categories = [
    'EXACT_MATCH',
    'INITIALS',
    'SPELLING_VARIATION',
    'MISSING_FIELDS',
    'ADDRESS_VARIATION',
    'RESTRICTED_REGISTRY',
    'HOMONYM_COLLISION',
    'DISTINCT_NEGATIVE',
    'OOD_NOISE',
    'MULTILINGUAL',
    'TRANSLITERATION',
    'PARAPHRASED_ADDRESS',
  ];

  const allowedRegs = [
    'revenue_registry',
    'education_registry',
    'agriculture_registry',
    'health_registry',
    'housing_registry',
    'land_registry',
    'pan_tax_registry',
  ];

  // Map of known Hindi/Telugu names for real evaluation
  const hindiNameMap: Record<string, string> = {
    'Amit Patel': 'अमित पटेल',
    'Ravi Kumar': 'रवि कुमार',
    'Kavitha Yadav': 'कविता यादव',
    'Deepak Naidu': 'दीपक नायडू',
    'Radha Kumar': 'राधा कुमार',
    'Suresh Verma': 'सुरेश वर्मा',
    'Pooja Sharma': 'पूजा शर्मा',
    'Vijay Singh': 'विजय सिंह',
  };

  const teluguNameMap: Record<string, string> = {
    'Amit Patel': 'అమిత్ పటేల్',
    'Ravi Kumar': 'రవి కుమార్',
    'Kavitha Yadav': 'కవిత యాదవ్',
    'Deepak Naidu': 'దీపక్ నాయుడు',
    'Radha Kumar': 'రాధ కుమార్',
    'Suresh Verma': 'సురేష్ వర్మ',
    'Pooja Sharma': 'పూజ శర్మ',
    'Vijay Singh': 'విజయ్ సింగ్',
  };

  let queryId = 1;

  for (let i = 0; i < 1000; i++) {
    const catIdx = Math.floor(prng() * categories.length);
    const cat = categories[catIdx];
    const citIdx = Math.floor(prng() * citizens.length);
    const citizen = citizens[citIdx];

    let qName = citizen.full_name;
    let qDob: string | undefined = citizen.date_of_birth;
    let qFather: string | undefined = citizen.father_name;
    let qAddress: string | undefined = citizen.address;
    let qDistrict: string | undefined = citizen.district;
    let qPincode: string | undefined = citizen.pincode;
    let isMatch = true;
    let isCollision = false;
    let expectedCitId: string | undefined = citizen.citizen_id;
    let lang = 'en';

    if (cat === 'EXACT_MATCH') {
      // Clean exact match
    } else if (cat === 'INITIALS') {
      const parts = citizen.full_name.split(' ');
      if (parts.length > 1) {
        qName = `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
      }
    } else if (cat === 'SPELLING_VARIATION') {
      qName = citizen.full_name
        .replace(/a/i, 'aa')
        .replace(/i/i, 'ee')
        .replace(/v/i, 'w');
    } else if (cat === 'MISSING_FIELDS') {
      qDob = undefined;
      qFather = undefined;
      qAddress = undefined;
    } else if (cat === 'ADDRESS_VARIATION') {
      qAddress = `Near Old Bus Stand, Block ${Math.floor(prng() * 9) + 1}, ${qDistrict}`;
    } else if (cat === 'RESTRICTED_REGISTRY') {
      // Single registry allowed
    } else if (cat === 'HOMONYM_COLLISION') {
      // Same name, conflicting DOB and father
      qDob = '1942-08-15';
      qFather = `Dissimilar Father ${Math.floor(prng() * 900) + 100}`;
      isMatch = false;
      isCollision = true;
      expectedCitId = undefined;
    } else if (cat === 'DISTINCT_NEGATIVE') {
      qName = `Completely Unrelated Person ${Math.floor(prng() * 9000) + 1000}`;
      qDob = '1935-11-20';
      qFather = 'Unknown Parent';
      qDistrict = 'Kargil';
      isMatch = false;
      isCollision = false;
      expectedCitId = undefined;
    } else if (cat === 'OOD_NOISE') {
      qName = `### INVALID_QUERY_TOKEN_${Math.floor(prng() * 9999)} %%%`;
      qDob = '9999-99-99';
      isMatch = false;
      isCollision = false;
      expectedCitId = undefined;
    } else if (cat === 'MULTILINGUAL') {
      const isHi = prng() > 0.5;
      lang = isHi ? 'hi' : 'te';
      if (isHi) {
        qName = hindiNameMap[citizen.full_name] || 'रवि कुमार';
      } else {
        qName = teluguNameMap[citizen.full_name] || 'రవి కుమార్';
      }
    } else if (cat === 'TRANSLITERATION') {
      lang = 'transliterated_indic';
      qName = citizen.full_name
        .toLowerCase()
        .replace(/k/g, 'c')
        .replace(/v/g, 'w')
        .replace(/sh/g, 's')
        .replace(/th/g, 't');
    } else if (cat === 'PARAPHRASED_ADDRESS') {
      qAddress = `residing permanently at ${citizen.address || 'Civil Lines'}, nearby center`;
    }

    queries.push({
      id: `CLEAN-BENCH-${String(queryId++).padStart(4, '0')}`,
      category: cat,
      language: lang,
      expectedCitizenId: expectedCitId,
      isMatch,
      isCollisionCase: isCollision,
      query: {
        name: qName,
        dateOfBirth: qDob,
        fatherName: qFather,
        guardianName: citizen.guardian_name,
        address: qAddress,
        district: qDistrict,
        state: citizen.state,
        pincode: qPincode,
        allowedRegistries: cat === 'RESTRICTED_REGISTRY' ? ['revenue_registry'] : allowedRegs,
        consentVerified: true,
      },
    });
  }

  return queries;
}

async function main() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4 INTEGRITY AUDIT & BENCHMARK VALIDATION      ');
  console.log('========================================================================\n');

  const db = await getAuthoritativeDb();
  const provider = new MultilingualE5BaseTransformerProvider();
  const v4Engine = new EntityResolutionEngineV4();
  const embeddingCache = EmbeddingCache.getInstance();

  // -------------------------------------------------------------
  // PART 1: TRANSFORMER AUTHENTICITY & INFERENCE PROFILING
  // -------------------------------------------------------------
  console.log('>>> 1. PROFILING TRANSFORMER PROVIDER (100, 500, 1000 EMBEDDINGS)...');
  const sampleTexts = [
    'query: name: Ravi Kumar | district: Hyderabad | address: Hyderabad',
    'passage: name: Ravi Kumar | district: Hyderabad | address: Near Bus Stand',
    'query: name: Amit Patel | district: Vijayawada',
    'passage: name: Kavitha Yadav | district: Hubballi | father: Gopal Yadav',
    'query: name: दीपक नायडू | district: Thane',
  ];

  const profileCount = async (count: number) => {
    const latencies: number[] = [];
    for (let i = 0; i < count; i++) {
      const text = sampleTexts[i % sampleTexts.length] + ` | iter: ${i}`;
      const t0 = performance.now();
      await provider.embed(text);
      const t1 = performance.now();
      latencies.push(t1 - t0);
    }
    return {
      count,
      mean: calculateMean(latencies),
      p50: calculatePercentile(latencies, 50),
      p95: calculatePercentile(latencies, 95),
      p99: calculatePercentile(latencies, 99),
    };
  };

  const p100 = await profileCount(100);
  const p500 = await profileCount(500);
  const p1000 = await profileCount(1000);

  console.log('Provider Embedding Generation Latencies:');
  console.table([p100, p500, p1000]);

  // -------------------------------------------------------------
  // PART 2: CACHE ENABLED VS DISABLED COMPARISON
  // -------------------------------------------------------------
  console.log('\n>>> 2. CACHE ENABLED VS CACHE DISABLED BENCHMARK...');
  const cacheTestQueries = sampleTexts.slice(0, 5);
  
  // Cold & Uncached
  embeddingCache.clear();
  const uncachedLatencies: number[] = [];
  for (const txt of cacheTestQueries) {
    const t0 = performance.now();
    await provider.embed(txt);
    uncachedLatencies.push(performance.now() - t0);
  }

  // Populate cache
  for (const txt of cacheTestQueries) {
    const emb = await provider.embed(txt);
    const key = EmbeddingCache.computeCacheKey(txt, provider.modelId);
    embeddingCache.set(key, emb, txt, 'revenue_registry');
  }

  // Cached Lookups
  const cachedLatencies: number[] = [];
  for (const txt of cacheTestQueries) {
    const key = EmbeddingCache.computeCacheKey(txt, provider.modelId);
    const t0 = performance.now();
    const vec = embeddingCache.get(key);
    cachedLatencies.push(performance.now() - t0);
  }

  console.log('Uncached Embedding Mean Latency (ms):', calculateMean(uncachedLatencies));
  console.log('Cached Lookup Mean Latency (ms):', calculateMean(cachedLatencies));

  // -------------------------------------------------------------
  // PART 3: MULTILINGUAL COSINE SIMILARITY CONTROLLED PAIRS
  // -------------------------------------------------------------
  console.log('\n>>> 3. CONTROLLED MULTILINGUAL COSINE SIMILARITY MATRIX...');
  const multiPairs = [
    { type: 'English Exact', q: 'query: name: Ravi Kumar', p: 'passage: name: Ravi Kumar' },
    { type: 'Hindi to English', q: 'query: name: रवि कुमार', p: 'passage: name: Ravi Kumar' },
    { type: 'Telugu to English', q: 'query: name: రవి కుమార్', p: 'passage: name: Ravi Kumar' },
    { type: 'Romanized to English', q: 'query: name: Ravi Kumaar', p: 'passage: name: Ravi Kumar' },
    { type: 'Mixed Lang to English', q: 'query: name: Ravi Kumar Hyderabad', p: 'passage: name: Ravi Kumar' },
    { type: 'Hindi Unrelated', q: 'query: name: रवि कुमार', p: 'passage: name: Amit Patel' },
    { type: 'Telugu Unrelated', q: 'query: name: రవి కుమార్', p: 'passage: name: Sunita Devi' },
    { type: 'English Unrelated', q: 'query: name: Ravi Kumar', p: 'passage: name: Pooja Sharma' },
  ];

  const simResults: any[] = [];
  for (const pair of multiPairs) {
    const vecQ = await provider.embed(pair.q);
    const vecP = await provider.embed(pair.p);
    const sim = provider.similarity(vecQ, vecP);
    simResults.push({
      Pair: pair.type,
      Query: pair.q,
      Passage: pair.p,
      'Cosine Similarity': Number(sim.toFixed(4)),
    });
  }
  console.table(simResults);

  // -------------------------------------------------------------
  // PART 4: 1,000-QUERY CLEAN SEED=7777 BENCHMARK
  // -------------------------------------------------------------
  console.log('\n>>> 4. GENERATING CLEAN SEED=7777 1,000-QUERY BENCHMARK...');
  const benchmarkQueries = await generateCleanSeed7777Benchmark();
  console.log(`Generated ${benchmarkQueries.length} clean benchmark queries.`);

  // Evaluate Models:
  // A: V1 Deterministic
  // B: V3.1 Calibrated Structured
  // C: REAL Transformer-Only (identical database candidate retrieval, ranking solely by cosine similarity)
  // D: V4 Transformer Hybrid

  const runEvaluation = async (modelType: 'V1' | 'V3.1' | 'REAL_TRANSFORMER_ONLY' | 'V4') => {
    const latencies: number[] = [];
    let retrievedCount = 0;
    let top1Matches = 0;
    let top3Matches = 0;
    let correctManualReviews = 0;
    let unnecessaryManualReviews = 0;
    let falseMatches = 0;
    let highConfFalseMatches = 0;
    let homonymFalseMatches = 0;
    let unsafeAutomaticMatches = 0;
    let falseNegatives = 0;
    let multilingualTop1 = 0;
    let transliterationTop1 = 0;
    let multilingualTotal = 0;
    let transliterationTotal = 0;

    for (const item of benchmarkQueries) {
      const t0 = performance.now();
      let bestCitId: string | undefined;
      let top3CitIds: string[] = [];
      let tier: string | undefined;
      let isCollision = false;
      let isAmbiguous = false;

      if (modelType === 'V1') {
        const res = await EntityResolutionEngine.matchEntity(item.query);
        const top = res.candidates[0];
        if (top) {
          bestCitId = top.citizenId || top.rawRecord?.citizen_id;
          top3CitIds = res.candidates.slice(0, 3).map((c) => c.citizenId || c.rawRecord?.citizen_id || '');
          tier = top.confidenceTier;
          isCollision = top.isCollisionWarning;
        }
        isAmbiguous = res.ambiguityDetected;
      } else if (modelType === 'V3.1') {
        const res = await EntityResolutionEngineV3.matchEntityV3(item.query);
        const top = res.bestMatch;
        if (top) {
          bestCitId = top.citizenId;
          top3CitIds = res.candidates.slice(0, 3).map((c) => c.citizenId || '');
          tier = top.confidenceTier;
          isCollision = top.isCollisionWarning;
        }
        isAmbiguous = res.ambiguityDetected;
      } else if (modelType === 'REAL_TRANSFORMER_ONLY') {
        // REAL Transformer candidate ranking using standard database candidate retrieval!
        // Retrieve candidate rows identically to V4
        const rawCandidates = await (v4Engine as any).retrieveCandidateRows(item.query, 25);
        if (rawCandidates.length > 0) {
          const queryRep = SemanticSimilarityEngine.formatQuerySemanticText(item.query);
          const queryVec = await provider.embed(queryRep.text);

          const scoredCandidates: { citId: string; sim: number; raw: any; reg: any }[] = [];
          for (const candItem of rawCandidates) {
            const passRep = SemanticSimilarityEngine.formatPassageSemanticText(candItem.row, candItem.registry);
            const passVec = await provider.embed(passRep.text);
            const sim = SemanticSimilarityEngine.computeCosineSimilarity(queryVec, passVec);
            const citId = candItem.row.citizen_id || candItem.row.master_citizen_id || candItem.row.id;
            scoredCandidates.push({ citId, sim, raw: candItem.row, reg: candItem.registry });
          }

          // Sort descending by pure cosine similarity
          scoredCandidates.sort((a, b) => b.sim - a.sim);

          // Map to candidate match format for consolidation
          const candidateMatches = scoredCandidates.map((c) => ({
            candidateId: String(c.raw.id || c.citId),
            citizenId: c.citId,
            registry: c.reg,
            matchedFields: ['embedding'],
            fieldScores: {
              nameScore: c.sim,
              dobScore: 0,
              fatherScore: 0,
              addressScore: 0,
              districtScore: 0,
              pincodeScore: 0,
              embeddingScore: c.sim,
              graphBonus: 0,
              transformerScore: c.sim,
              structuredScore: 0,
            },
            structuredScore: 0,
            transformerScore: c.sim,
            hybridScore: c.sim,
            calibratedProbability: c.sim,
            totalScore: c.sim,
            confidenceTier: (c.sim >= 0.85 ? 'HIGH' : c.sim >= 0.60 ? 'MEDIUM' : 'AMBIGUOUS') as any,
            isCollisionWarning: false, // Transformer alone has NO demographic collision guard!
            explanation: `Pure Transformer similarity: ${c.sim.toFixed(4)}`,
            rawRecord: c.raw,
          }));

          const { consolidatedCandidates, ambiguityDetected } = V4IdentityConsolidator.consolidate(
            item.query,
            candidateMatches,
            DEFAULT_V4_CONFIG.thresholds
          );

          if (consolidatedCandidates.length > 0) {
            const top = consolidatedCandidates[0];
            bestCitId = top.citizenId;
            top3CitIds = consolidatedCandidates.slice(0, 3).map((c) => c.citizenId || '');
            tier = top.confidenceTier;
            isCollision = top.isCollisionWarning;
          }
          isAmbiguous = ambiguityDetected;
        }
      } else if (modelType === 'V4') {
        const res = await v4Engine.resolve(item.query);
        const top = res.bestMatch;
        if (top) {
          bestCitId = top.citizenId;
          top3CitIds = res.candidates.slice(0, 3).map((c) => c.citizenId || '');
          tier = top.confidenceTier;
          isCollision = top.isCollisionWarning;
        }
        isAmbiguous = res.ambiguityDetected;
      }

      const latency = performance.now() - t0;
      latencies.push(latency);

      if (top3CitIds.length > 0) retrievedCount++;

      // Score against ground truth
      if (item.isMatch && item.expectedCitizenId) {
        if (bestCitId === item.expectedCitizenId) {
          top1Matches++;
        }
        if (top3CitIds.includes(item.expectedCitizenId)) {
          top3Matches++;
        }
        if (tier === 'AMBIGUOUS' || isAmbiguous) {
          unnecessaryManualReviews++;
        }
        if (!bestCitId && top3CitIds.length === 0) {
          falseNegatives++;
        }
      } else if (item.isCollisionCase) {
        if (tier === 'AMBIGUOUS' || isAmbiguous || isCollision) {
          correctManualReviews++;
        } else {
          homonymFalseMatches++;
          if (tier === 'HIGH') highConfFalseMatches++;
          unsafeAutomaticMatches++;
        }
      } else {
        // Distinct negative / OOD
        if (tier === 'HIGH' || tier === 'MEDIUM') {
          falseMatches++;
          if (tier === 'HIGH') {
            highConfFalseMatches++;
            unsafeAutomaticMatches++;
          }
        }
      }

      if (item.category === 'MULTILINGUAL') {
        multilingualTotal++;
        if (bestCitId === item.expectedCitizenId) multilingualTop1++;
      } else if (item.category === 'TRANSLITERATION') {
        transliterationTotal++;
        if (bestCitId === item.expectedCitizenId) transliterationTop1++;
      }
    }

    const totalPositive = benchmarkQueries.filter((q) => q.isMatch).length;
    const totalCollision = benchmarkQueries.filter((q) => q.isCollisionCase).length;
    const totalNegative = benchmarkQueries.filter((q) => !q.isMatch && !q.isCollisionCase).length;

    return {
      modelType,
      totalQueries: benchmarkQueries.length,
      retrievalRecall: Number(((retrievedCount / totalPositive) * 100).toFixed(2)),
      top1Accuracy: Number(((top1Matches / totalPositive) * 100).toFixed(2)),
      top3Recall: Number(((top3Matches / totalPositive) * 100).toFixed(2)),
      correctManualReviewRate: Number(((correctManualReviews / Math.max(1, totalCollision)) * 100).toFixed(2)),
      unnecessaryManualReviewRate: Number(((unnecessaryManualReviews / totalPositive) * 100).toFixed(2)),
      falseMatchRate: Number(((falseMatches / Math.max(1, totalNegative)) * 100).toFixed(2)),
      highConfidenceFMR: Number(((highConfFalseMatches / Math.max(1, totalNegative + totalCollision)) * 100).toFixed(4)),
      homonymCollisionFMR: Number(((homonymFalseMatches / Math.max(1, totalCollision)) * 100).toFixed(4)),
      unsafeAutomaticMatchRate: Number(((unsafeAutomaticMatches / benchmarkQueries.length) * 100).toFixed(4)),
      multilingualAccuracy: Number(((multilingualTop1 / Math.max(1, multilingualTotal)) * 100).toFixed(2)),
      transliterationAccuracy: Number(((transliterationTop1 / Math.max(1, transliterationTotal)) * 100).toFixed(2)),
      p50LatencyMs: calculatePercentile(latencies, 50),
      p95LatencyMs: calculatePercentile(latencies, 95),
      p99LatencyMs: calculatePercentile(latencies, 99),
    };
  };

  console.log('\n>>> Evaluating Model A (V1 Deterministic)...');
  const resV1 = await runEvaluation('V1');
  console.log('>>> Evaluating Model B (V3.1 Structured Baseline)...');
  const resV3 = await runEvaluation('V3.1');
  console.log('>>> Evaluating Model C (REAL Transformer-Only Baseline)...');
  const resTrans = await runEvaluation('REAL_TRANSFORMER_ONLY');
  console.log('>>> Evaluating Model D (V4 Hybrid Transformer)...');
  const resV4 = await runEvaluation('V4');

  console.log('\n========================================================================');
  console.log('                 CLEAN SEED=7777 BENCHMARK RESULTS                      ');
  console.log('========================================================================');
  console.table([resV1, resV3, resTrans, resV4]);

  const outputData = {
    benchmark_version: 'v4.0.0-seed7777-clean-audit',
    timestamp: new Date().toISOString(),
    total_queries: benchmarkQueries.length,
    profiling: {
      p100,
      p500,
      p1000,
      cached_mean_ms: calculateMean(cachedLatencies),
      uncached_mean_ms: calculateMean(uncachedLatencies),
    },
    multilingual_pairs: simResults,
    models: {
      model_a_v1: resV1,
      model_b_v3_1: resV3,
      model_c_real_transformer: resTrans,
      model_d_v4_hybrid: resV4,
    },
  };

  fs.writeFileSync(
    path.resolve(process.cwd(), 'data/ai/entity-resolution/v4/clean_audit_7777_summary.json'),
    JSON.stringify(outputData, null, 2)
  );
  console.log('\nAudit summary recorded to data/ai/entity-resolution/v4/clean_audit_7777_summary.json');
}

main().catch((err) => {
  console.error('[FATAL] Audit script error:', err);
  process.exit(1);
});
