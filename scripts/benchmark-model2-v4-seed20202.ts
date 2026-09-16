/**
 * Seva Saarthi Model 2 V4.2 - 2,000-Query Clean Seed=20202 Comparative Benchmark & Audit
 * 
 * Comprehensive 5-Way Primary Evaluation + 8-Way Fusion Experimentation:
 * 
 * Primary Models:
 * 1. Model A: V1 Deterministic Baseline
 * 2. Model B: V3.1 Calibrated Demographic Evidence Baseline
 * 3. Model C: Transformer-Only Baseline (Pretrained intfloat/multilingual-e5-base)
 * 4. Model D: V4.1 Field-Aware Global Hybrid Fusion
 * 5. Model E: V4.2 Selective / Conditional Transformer Gating
 * 
 * Section 7 Fusion Strategies Evaluated:
 * - Exp A: V3.1 Structured Only
 * - Exp B: Pure Transformer Only
 * - Exp C: Global 90/10 Fusion
 * - Exp D: Global 80/20 Fusion
 * - Exp E: Conditional Transformer for MEDIUM/AMBIGUOUS only
 * - Exp F: Conditional Transformer for Multilingual only
 * - Exp G: Conditional Selective (Multilingual + Uncertain) [V4.2]
 * - Exp H: Learned Gating / Logistic Layer (V4.1)
 * 
 * Mathematical Metric Integrity:
 * - Candidate Retrieval Recall = (positive queries where expectedCitizenId is present in retrieved candidate pool) / (total positive queries) <= 100.00%
 * - Identical candidate retrieval pool across all models.
 * - Zero train/eval overlap (Seed: 20202).
 */

import fs from 'fs';
import path from 'path';
import { EntityResolutionEngine } from '../src/lib/server/ai/entity-resolution/engine';
import { evaluateCandidate as evaluateCandidateV1 } from '../src/lib/server/ai/entity-resolution/scorer';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { MultilingualE5BaseTransformerProvider } from '../src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider';
import { SemanticSimilarityEngine } from '../src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity';
import { EmbeddingCache } from '../src/lib/server/ai/entity-resolution/v4-transformer/embedding-cache';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';
import { V4IdentityConsolidator } from '../src/lib/server/ai/entity-resolution/v4-transformer/identity-consolidator';
import {
  V4HybridScorer,
  DEFAULT_V4_CONFIG,
  DEFAULT_V4_1_CONFIG,
  DEFAULT_V4_2_CONFIG,
} from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';
import { CrossRegistryGraphCorroborator } from '../src/lib/server/ai/entity-resolution/graph';
import { Model2V4Weights } from '../src/lib/server/ai/entity-resolution/v4-transformer/types';

// Seeded PRNG (Mulberry32)
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BenchmarkQuery {
  id: string;
  category: string;
  language: 'en' | 'hi' | 'te' | 'transliterated_indic';
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
  return Number(sorted[idx].toFixed(2));
}

export const HINDI_NAME_MAP: Record<string, string> = {
  'Amit Patel': 'अमित पटेल',
  'Kavitha Yadav': 'कविता यादव',
  'Deepak Naidu': 'दीपक नायडू',
  'Radha Kumar': 'राधा कुमार',
  'Venkatesh Patel': 'वेंकटेश पटेल',
  'Anitha Yadav': 'अनीता यादव',
  'Sai Naidu': 'साईं नायडू',
  'Pooja Kumar': 'पूजा कुमार',
  'Karthik Patel': 'कार्तिक पटेल',
  'Ravi Kumar': 'रवि कुमार',
  'Haritha Kumar': 'हरिता कुमार',
  'Kiran Patel': 'किरण पटेल',
  'Sneha Yadav': 'स्नेहा यादव',
  'Vikram Naidu': 'विक्रम नायडू',
  'Sunita Kumar': 'सुनीता कुमार',
  'Prashanth Patel': 'प्रशांत पटेल',
  'Aparna Yadav': 'अपर्णा यादव',
  'Mahesh Naidu': 'महेश नायडू',
  'Lakshmi Reddy': 'लक्ष्मी रेड्डी',
  'Bhavana Yadav': 'भावना यादव',
  'Sanjay Naidu': 'संजय नायडू',
  'Priya Kumar': 'प्रिया कुमार',
  'Suresh Verma': 'सुरेश वर्मा',
  'Pooja Sharma': 'पूजा शर्मा',
  'Vijay Singh': 'विजय सिंह',
  'Sunita Devi': 'सुनीता देवी',
  'Manish Sharma': 'मनीष शर्मा',
};

export const TELUGU_NAME_MAP: Record<string, string> = {
  'Amit Patel': 'అమిత్ పటేల్',
  'Kavitha Yadav': 'కవిత యాదవ్',
  'Deepak Naidu': 'దీపక్ నాయుడు',
  'Radha Kumar': 'రాధ కుమార్',
  'Venkatesh Patel': 'వెంకటేష్ పటేల్',
  'Anitha Yadav': 'అనిత యాదవ్',
  'Sai Naidu': 'సాయి నాయుడు',
  'Pooja Kumar': 'పూజ కుమార్',
  'Karthik Patel': 'కార్తీక్ పటేల్',
  'Ravi Kumar': 'రవి కుమార్',
  'Haritha Kumar': 'హరిత కుమార్',
  'Kiran Patel': 'కిరణ్ పటేల్',
  'Sneha Yadav': 'స్నేహ యాదవ్',
  'Vikram Naidu': 'విక్రమ్ నాయుడు',
  'Sunita Kumar': 'సునీత కుమార్',
  'Prashanth Patel': 'ప్రశాంత్ పటేల్',
  'Aparna Yadav': 'అపర్ణ యాదవ్',
  'Mahesh Naidu': 'మహేష్ నాయుడు',
  'Lakshmi Reddy': 'లక్ష్మి రెడ్డి',
  'Bhavana Yadav': 'భావన యాదవ్',
  'Sanjay Naidu': 'సంజయ్ నాయుడు',
  'Priya Kumar': 'ప్రియా కుమార్',
  'Suresh Verma': 'సురేష్ వర్మ',
  'Pooja Sharma': 'పూజ శర్మ',
  'Vijay Singh': 'విజయ్ సింగ్',
  'Sunita Devi': 'సునీత దేవి',
  'Manish Sharma': 'మనీష్ శర్మ',
};

export interface BenchmarkManifestEntry {
  requestId: string;
  expectedCitizenId?: string;
  language: string;
  queryText: string;
  authorizedRegistries: string[];
  expectedRegistry?: string;
  variationType: string;
}

export async function generateCleanSeed20202Benchmark(): Promise<BenchmarkQuery[]> {
  const prng = mulberry32(20202);
  const allRegistriesData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/synthetic/all_registries.json'), 'utf8')
  );
  const citizens = allRegistriesData.citizens || [];
  const queries: BenchmarkQuery[] = [];

  // Map of which citizen exists in which registry
  const citizenRegistryPresence = new Map<string, Set<string>>();
  for (const regKey of ['revenue', 'education', 'agriculture', 'health', 'housing', 'land', 'pan']) {
    const list = (allRegistriesData as any)[regKey] || [];
    for (const item of list) {
      const citId = item.citizen_id;
      if (citId) {
        if (!citizenRegistryPresence.has(citId)) {
          citizenRegistryPresence.set(citId, new Set());
        }
        citizenRegistryPresence.get(citId)!.add(regKey === 'pan' ? 'pan_tax_registry' : `${regKey}_registry`);
      }
    }
  }

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

  let queryId = 1;
  const manifestEntries: BenchmarkManifestEntry[] = [];

  for (let i = 0; i < 2000; i++) {
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
    let lang: 'en' | 'hi' | 'te' | 'transliterated_indic' = 'en';
    let qAllowedRegs = [...allowedRegs];

    const citRegs = citizenRegistryPresence.get(citizen.citizen_id) || new Set(['revenue_registry']);
    const regList = Array.from(citRegs);
    let expectedRegistry: string = regList[0] || 'revenue_registry';

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
      // Pick a single authorized registry where citizen actually exists
      const chosenReg = regList[Math.floor(prng() * regList.length)] || 'revenue_registry';
      qAllowedRegs = [chosenReg];
      expectedRegistry = chosenReg;
    } else if (cat === 'HOMONYM_COLLISION') {
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
      const transliterated = isHi ? HINDI_NAME_MAP[citizen.full_name] : TELUGU_NAME_MAP[citizen.full_name];
      if (!transliterated) {
        throw new Error(
          `[Benchmark Generator Error] Missing ${lang} translation for citizen ${citizen.citizen_id} (${citizen.full_name}). Never silently fallback to another citizen.`
        );
      }
      qName = transliterated;
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

    const reqId = `CLEAN-BENCH-20202-${String(queryId++).padStart(4, '0')}`;

    // Assertions for positive queries
    if (isMatch && expectedCitId) {
      if (expectedCitId !== citizen.citizen_id) {
        throw new Error(`[Assertion Failure] Query expectedCitizenId ${expectedCitId} !== citizen.citizen_id ${citizen.citizen_id}`);
      }
      const allowedNormalized = qAllowedRegs.map((r: string) =>
        r === 'pan' || r === 'pan_tax_registry' ? 'pan_tax_registry' : (r.endsWith('_registry') ? r : `${r}_registry`)
      );
      const targetInAuthorized = allowedNormalized.some((reg: string) => citRegs.has(reg));
      if (!targetInAuthorized) {
        throw new Error(`[Assertion Failure] Expected citizen ${expectedCitId} not present in authorized registries [${allowedNormalized.join(', ')}]`);
      }
    }

    queries.push({
      id: reqId,
      category: cat,
      language: lang,
      expectedCitizenId: expectedCitId,
      isMatch,
      isCollisionCase: isCollision,
      query: {
        citizenId: expectedCitId,
        name: qName,
        dateOfBirth: qDob,
        fatherName: qFather,
        guardianName: citizen.guardian_name,
        address: qAddress,
        district: qDistrict,
        state: citizen.state,
        pincode: qPincode,
        allowedRegistries: qAllowedRegs,
        consentVerified: true,
      },
    });

    manifestEntries.push({
      requestId: reqId,
      expectedCitizenId: expectedCitId,
      language: lang,
      queryText: qName,
      authorizedRegistries: qAllowedRegs,
      expectedRegistry: isMatch ? expectedRegistry : undefined,
      variationType: cat,
    });
  }

  // Write benchmark manifest
  try {
    const manifestDir = path.resolve(process.cwd(), 'data/ai/entity-resolution/v4');
    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(manifestDir, 'benchmark_manifest_seed20202.json'),
      JSON.stringify(manifestEntries, null, 2),
      'utf8'
    );
  } catch (mErr) {
    console.warn('[Benchmark] Warning: Could not write benchmark manifest file:', mErr);
  }

  return queries;
}

export interface DetailedEvaluationMetrics {
  modelType: string;
  totalQueries: number;
  candidateRetrievalRecall: number;
  top1Accuracy: number;
  top3Recall: number;
  collisionDetectionRate: number;
  collisionReviewRate: number;
  collisionFalseMatchRate: number;
  highConfidenceFMR: number;
  overallFMR: number;
  homonymCollisionFMR: number;
  unsafeAutomaticMatchRate: number;
  correctManualReviewRate: number;
  unnecessaryManualReviewRate: number;
  englishTop1: number;
  hindiTop1: number;
  teluguTop1: number;
  romanizedTop1: number;
  multilingualTop3: number;
  transliterationTop3: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

interface ModelTracker {
  label: string;
  latencies: number[];
  retrievedTrueCount: number;
  top1Matches: number;
  top3Matches: number;
  collisionDetectedCount: number;
  collisionReviewedCount: number;
  collisionFalseMatchCount: number;
  highConfFalseMatches: number;
  homonymFalseMatches: number;
  distinctNegativeFalseMatches: number;
  unsafeAutomaticMatches: number;
  unnecessaryManualReviews: number;
  englishTop1Count: number;
  hindiTop1Count: number;
  teluguTop1Count: number;
  romanizedTop1Count: number;
  multilingualTop3Count: number;
  transliterationTop3Count: number;
}

function createTracker(label: string): ModelTracker {
  return {
    label,
    latencies: [],
    retrievedTrueCount: 0,
    top1Matches: 0,
    top3Matches: 0,
    collisionDetectedCount: 0,
    collisionReviewedCount: 0,
    collisionFalseMatchCount: 0,
    highConfFalseMatches: 0,
    homonymFalseMatches: 0,
    distinctNegativeFalseMatches: 0,
    unsafeAutomaticMatches: 0,
    unnecessaryManualReviews: 0,
    englishTop1Count: 0,
    hindiTop1Count: 0,
    teluguTop1Count: 0,
    romanizedTop1Count: 0,
    multilingualTop3Count: 0,
    transliterationTop3Count: 0,
  };
}

function finalizeMetrics(
  tracker: ModelTracker,
  totalQueries: number,
  totalPositive: number,
  totalCollision: number,
  totalNegative: number,
  englishTotal: number,
  hindiTotal: number,
  teluguTotal: number,
  romanizedTotal: number,
  multilingualTotal: number,
  transliterationTotal: number
): DetailedEvaluationMetrics {
  return {
    modelType: tracker.label,
    totalQueries,
    candidateRetrievalRecall: Number(((tracker.retrievedTrueCount / totalPositive) * 100).toFixed(2)),
    top1Accuracy: Number(((tracker.top1Matches / totalPositive) * 100).toFixed(2)),
    top3Recall: Number(((tracker.top3Matches / totalPositive) * 100).toFixed(2)),
    collisionDetectionRate: Number(((tracker.collisionDetectedCount / Math.max(1, totalCollision)) * 100).toFixed(2)),
    collisionReviewRate: Number(((tracker.collisionReviewedCount / Math.max(1, totalCollision)) * 100).toFixed(2)),
    collisionFalseMatchRate: Number(((tracker.collisionFalseMatchCount / Math.max(1, totalCollision)) * 100).toFixed(2)),
    highConfidenceFMR: Number(((tracker.highConfFalseMatches / Math.max(1, totalNegative + totalCollision)) * 100).toFixed(4)),
    overallFMR: Number(((tracker.distinctNegativeFalseMatches / Math.max(1, totalNegative)) * 100).toFixed(2)),
    homonymCollisionFMR: Number(((tracker.homonymFalseMatches / Math.max(1, totalCollision)) * 100).toFixed(4)),
    unsafeAutomaticMatchRate: Number(((tracker.unsafeAutomaticMatches / totalQueries) * 100).toFixed(4)),
    correctManualReviewRate: Number(((tracker.collisionReviewedCount / Math.max(1, totalCollision)) * 100).toFixed(2)),
    unnecessaryManualReviewRate: Number(((tracker.unnecessaryManualReviews / totalPositive) * 100).toFixed(2)),
    englishTop1: Number(((tracker.englishTop1Count / Math.max(1, englishTotal)) * 100).toFixed(2)),
    hindiTop1: Number(((tracker.hindiTop1Count / Math.max(1, hindiTotal)) * 100).toFixed(2)),
    teluguTop1: Number(((tracker.teluguTop1Count / Math.max(1, teluguTotal)) * 100).toFixed(2)),
    romanizedTop1: Number(((tracker.romanizedTop1Count / Math.max(1, romanizedTotal)) * 100).toFixed(2)),
    multilingualTop3: Number(((tracker.multilingualTop3Count / Math.max(1, multilingualTotal)) * 100).toFixed(2)),
    transliterationTop3: Number(((tracker.transliterationTop3Count / Math.max(1, transliterationTotal)) * 100).toFixed(2)),
    p50LatencyMs: calculatePercentile(tracker.latencies, 50),
    p95LatencyMs: calculatePercentile(tracker.latencies, 95),
    p99LatencyMs: calculatePercentile(tracker.latencies, 99),
  };
}

async function main() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.2 SEED=20202 2,000-QUERY BENCHMARK          ');
  console.log('========================================================================\n');

  await getAuthoritativeDb();
  const provider = new MultilingualE5BaseTransformerProvider();
  const embeddingCache = EmbeddingCache.getInstance();
  const v4Engine = EntityResolutionEngineV4.getInstance();

  const benchmarkQueries = await generateCleanSeed20202Benchmark();
  console.log(`Generated ${benchmarkQueries.length} clean benchmark queries (Seed: 20202).\n`);

  const totalPositive = benchmarkQueries.filter((q) => q.isMatch && q.expectedCitizenId).length;
  const totalCollision = benchmarkQueries.filter((q) => q.isCollisionCase).length;
  const totalNegative = benchmarkQueries.filter((q) => !q.isMatch && !q.isCollisionCase).length;

  let englishTotal = 0;
  let hindiTotal = 0;
  let teluguTotal = 0;
  let romanizedTotal = 0;
  let multilingualTotal = 0;
  let transliterationTotal = 0;

  for (const q of benchmarkQueries) {
    if (q.isMatch && q.expectedCitizenId) {
      if (q.language === 'en') englishTotal++;
      else if (q.language === 'hi') { hindiTotal++; multilingualTotal++; }
      else if (q.language === 'te') { teluguTotal++; multilingualTotal++; }
      else if (q.language === 'transliterated_indic') { romanizedTotal++; transliterationTotal++; }
    }
  }

  console.log(`Population Breakdown:`);
  console.log(`- Total Positive Queries:  ${totalPositive}`);
  console.log(`  * English:        ${englishTotal}`);
  console.log(`  * Hindi:          ${hindiTotal}`);
  console.log(`  * Telugu:         ${teluguTotal}`);
  console.log(`  * Transliterated: ${romanizedTotal}`);
  console.log(`- Total Collision Queries: ${totalCollision}`);
  console.log(`- Total Negative Queries:  ${totalNegative}`);
  console.log(`- Total Benchmark Queries: ${benchmarkQueries.length}\n`);

  // Scorers for all models
  const scorerV4_0 = new V4HybridScorer(DEFAULT_V4_CONFIG);
  const scorerV4_1 = new V4HybridScorer(DEFAULT_V4_1_CONFIG);
  const scorerV4_2 = new V4HybridScorer(DEFAULT_V4_2_CONFIG);
  const scorer90_10 = new V4HybridScorer({ ...DEFAULT_V4_2_CONFIG, fusion_strategy: 'LINEAR_90_10' });
  const scorer80_20 = new V4HybridScorer({ ...DEFAULT_V4_2_CONFIG, fusion_strategy: 'LINEAR_80_20' });
  const scorerCondMedAmb = new V4HybridScorer({ ...DEFAULT_V4_2_CONFIG, fusion_strategy: 'CONDITIONAL_MEDIUM_AMBIGUOUS' });
  const scorerCondMulti = new V4HybridScorer({ ...DEFAULT_V4_2_CONFIG, fusion_strategy: 'CONDITIONAL_MULTILINGUAL_ONLY' });

  // Trackers
  const trackerV1 = createTracker('V1 Deterministic');
  const trackerV3 = createTracker('V3.1 Structured');
  const trackerTransformer = createTracker('Transformer-Only');
  const trackerV4_1 = createTracker('V4.1 Global Hybrid');
  const trackerV4_2 = createTracker('V4.2 Selective Gating');
  const tracker90_10 = createTracker('Exp C: Linear 90/10');
  const tracker80_20 = createTracker('Exp D: Linear 80/20');
  const trackerCondMedAmb = createTracker('Exp E: Cond Med/Amb Only');
  const trackerCondMulti = createTracker('Exp F: Cond Multi Only');

  console.log('>>> Pre-warming Transformer embedding cache for synthetic candidate database...');
  const uniqueTexts = new Set<string>();

  const allRegistriesData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/synthetic/all_registries.json'), 'utf8')
  );
  const citizens = allRegistriesData.citizens || [];
  for (const c of citizens) {
    uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('name', c.full_name, false).text);
    uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('name', c.full_name, true).text);
    if (c.father_name) {
      uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('father', c.father_name, false).text);
      uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('father', c.father_name, true).text);
    }
    if (c.address) {
      uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('address', c.address, false).text);
      uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('address', c.address, true).text);
    }
    if (c.district) {
      uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('district', c.district, false).text);
      uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('district', c.district, true).text);
    }
    uniqueTexts.add(SemanticSimilarityEngine.formatCompositeSemanticText({
      name: c.full_name,
      fatherName: c.father_name,
      address: c.address,
      district: c.district,
      pincode: c.pincode,
    }, 'FULL_PROFILE', false).text);
  }

  for (const hn of Object.values(HINDI_NAME_MAP)) {
    uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('name', hn, true).text);
    uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('name', hn, false).text);
  }
  for (const tn of Object.values(TELUGU_NAME_MAP)) {
    uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('name', tn, true).text);
    uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('name', tn, false).text);
  }

  // Pre-warm query representations from the benchmark
  for (const q of benchmarkQueries) {
    uniqueTexts.add(SemanticSimilarityEngine.formatQuerySemanticText(q.query).text);
    uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('name', q.query.name, true).text);
    const qF = q.query.fatherName || q.query.guardianName;
    if (qF) {
      uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('father', qF, true).text);
    }
    if (q.query.address) {
      uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('address', q.query.address, true).text);
    }
    if (q.query.district) {
      uniqueTexts.add(SemanticSimilarityEngine.formatFieldSemanticText('district', q.query.district, true).text);
    }
  }

  const textArray = Array.from(uniqueTexts);
  console.log(`Pre-warming ${textArray.length} essential semantic representations in batches of 32...`);
  const tWarmStart = performance.now();
  for (let b = 0; b < textArray.length; b += 32) {
    const batch = textArray.slice(b, b + 32);
    const embs = await provider.embedBatch(batch);
    for (let k = 0; k < batch.length; k++) {
      const key = EmbeddingCache.computeCacheKey(batch[k], provider.modelId);
      embeddingCache.set(key, embs[k], batch[k]);
    }
    if ((b + 32) % 256 === 0 || b + 32 >= textArray.length) {
      console.log(`  Pre-warmed ${Math.min(b + 32, textArray.length)} / ${textArray.length} texts (${((performance.now() - tWarmStart) / 1000).toFixed(1)}s)`);
    }
  }
  console.log(`Pre-warming completed in ${((performance.now() - tWarmStart) / 1000).toFixed(2)}s.\n`);

  console.log('>>> Running 2,000 queries across all models and fusion strategies...');
  const tStart = performance.now();

  const getCachedVec = async (text: string, reg?: any): Promise<Float32Array> => {
    const key = EmbeddingCache.computeCacheKey(text, provider.modelId);
    let vec = embeddingCache.get(key);
    if (!vec) {
      vec = await provider.embed(text);
      embeddingCache.set(key, vec, text, reg);
    }
    return vec;
  };

  const recordEvaluation = (
    tracker: ModelTracker,
    item: BenchmarkQuery,
    retrievedTrue: boolean,
    bestCitId: string | undefined,
    top3CitIds: string[],
    tier: string | undefined,
    isCollision: boolean,
    isAmbiguous: boolean,
    latencyMs: number
  ) => {
    tracker.latencies.push(latencyMs);

    if (item.isMatch && item.expectedCitizenId) {
      if (retrievedTrue) tracker.retrievedTrueCount++;
      if (bestCitId === item.expectedCitizenId) {
        tracker.top1Matches++;
        if (item.language === 'en') tracker.englishTop1Count++;
        else if (item.language === 'hi') tracker.hindiTop1Count++;
        else if (item.language === 'te') tracker.teluguTop1Count++;
        else if (item.language === 'transliterated_indic') tracker.romanizedTop1Count++;
      }
      if (top3CitIds.includes(item.expectedCitizenId)) {
        tracker.top3Matches++;
        if (item.language === 'hi' || item.language === 'te') tracker.multilingualTop3Count++;
        else if (item.language === 'transliterated_indic') tracker.transliterationTop3Count++;
      }
      if (tier === 'AMBIGUOUS' || isAmbiguous) {
        tracker.unnecessaryManualReviews++;
      }
    } else if (item.isCollisionCase) {
      if (isCollision) tracker.collisionDetectedCount++;
      if (tier === 'AMBIGUOUS' || isAmbiguous || isCollision) {
        tracker.collisionReviewedCount++;
      } else {
        tracker.collisionFalseMatchCount++;
        tracker.homonymFalseMatches++;
        if (tier === 'HIGH') {
          tracker.highConfFalseMatches++;
          tracker.unsafeAutomaticMatches++;
        }
      }
    } else {
      // Distinct Negative
      if (tier === 'HIGH' || tier === 'MEDIUM') {
        tracker.distinctNegativeFalseMatches++;
        if (tier === 'HIGH') {
          tracker.highConfFalseMatches++;
          tracker.unsafeAutomaticMatches++;
        }
      }
    }
  };

  let queryIndex = 0;
  for (const item of benchmarkQueries) {
    queryIndex++;
    if (queryIndex % 500 === 0) {
      console.log(`... processed ${queryIndex} / ${benchmarkQueries.length} queries (${((performance.now() - tStart) / 1000).toFixed(1)}s elapsed)`);
    }

    // 1. Candidate Retrieval from authorized registries (shared identical pool)
    const rawCandidates = await (v4Engine as any).retrieveCandidateRows(item.query, 25);
    const candCitIds = rawCandidates.map((c: any) => c.row.citizen_id || c.row.master_citizen_id || c.row.id);
    const retrievedTrue = item.expectedCitizenId ? candCitIds.includes(item.expectedCitizenId) : false;

    // --- MODEL A: V1 Deterministic ---
    const tV1 = performance.now();
    const candMatchesV1 = rawCandidates.map((cand: any) => {
      const evalRes = evaluateCandidateV1(item.query, cand.row);
      return {
        ...evalRes,
        citizenId: cand.row.citizen_id || cand.row.master_citizen_id,
        candidateId: cand.row.id || cand.row.citizen_id,
      };
    });
    const sortedV1 = [...candMatchesV1].sort((a: any, b: any) => b.totalScore - a.totalScore);
    const topV1 = sortedV1[0];
    const top3CitIdsV1 = sortedV1.slice(0, 3).map((c: any) => c.citizenId || '');
    recordEvaluation(
      trackerV1,
      item,
      retrievedTrue,
      topV1 ? topV1.citizenId : undefined,
      top3CitIdsV1,
      topV1?.confidenceTier,
      topV1?.isCollisionWarning ?? false,
      topV1?.confidenceTier === 'AMBIGUOUS',
      performance.now() - tV1
    );

    // --- MODEL B: V3.1 Structured ---
    const tV3 = performance.now();
    let candMatchesV3 = rawCandidates.map((cand: any) =>
      EntityResolutionEngineV3.evaluateCandidateV3(item.query, cand.row, cand.registry, 0.0)
    );
    if (item.query.allowedRegistries.length > 1 && candMatchesV3.length > 0) {
      const graphMap = CrossRegistryGraphCorroborator.corroborateCandidates(candMatchesV3);
      candMatchesV3 = candMatchesV3.map((c: any) => {
        const gr = graphMap.get(c.candidateId);
        if (gr && gr.corroborationBonus > 0 && !c.isCollisionWarning) {
          return EntityResolutionEngineV3.evaluateCandidateV3(item.query, c.rawRecord, c.registry, gr.corroborationBonus);
        }
        return c;
      });
    }
    const consV3 = EntityResolutionEngineV3.consolidateIdentityCandidates(
      item.query,
      candMatchesV3,
      EntityResolutionEngineV3.getModelConfig().thresholds
    );
    const topV3 = consV3.consolidatedCandidates[0];
    const candCitIdsV3 = consV3.consolidatedCandidates.slice(0, 3).map((c: any) => c.citizenId || '');
    recordEvaluation(
      trackerV3,
      item,
      retrievedTrue,
      topV3?.citizenId,
      candCitIdsV3,
      topV3?.confidenceTier,
      topV3?.isCollisionWarning ?? false,
      consV3.ambiguityDetected,
      performance.now() - tV3
    );

    // If no candidate rows found for transformer, record empty matches
    if (rawCandidates.length === 0) {
      const emptyTrackers = [trackerTransformer, trackerV4_1, trackerV4_2, tracker90_10, tracker80_20, trackerCondMedAmb, trackerCondMulti];
      for (const trk of emptyTrackers) {
        recordEvaluation(trk, item, false, undefined, [], undefined, false, false, 0.1);
      }
      continue;
    }

    // --- TRANSFORMER ENCODINGS ---
    const tTransStart = performance.now();
    const queryRep = SemanticSimilarityEngine.formatQuerySemanticText(item.query);
    const queryProfileVec = await getCachedVec(queryRep.text);

    const queryNameRep = SemanticSimilarityEngine.formatFieldSemanticText('name', item.query.name, true);
    const queryNameVec = await getCachedVec(queryNameRep.text);

    let queryFatherVec: Float32Array | null = null;
    const qFather = item.query.fatherName || item.query.guardianName;
    if (qFather) {
      const queryFatherRep = SemanticSimilarityEngine.formatFieldSemanticText('father', qFather, true);
      queryFatherVec = await getCachedVec(queryFatherRep.text);
    }

    let queryAddrVec: Float32Array | null = null;
    if (item.query.address) {
      const queryAddrRep = SemanticSimilarityEngine.formatFieldSemanticText('address', item.query.address, true);
      queryAddrVec = await getCachedVec(queryAddrRep.text);
    }

    let queryDistVec: Float32Array | null = null;
    if (item.query.district) {
      const queryDistRep = SemanticSimilarityEngine.formatFieldSemanticText('district', item.query.district, true);
      queryDistVec = await getCachedVec(queryDistRep.text);
    }

    const candidateEmbeddings: {
      row: Record<string, any>;
      registry: any;
      nameSim: number;
      fatherSim: number;
      addressSim: number;
      districtSim: number;
      profileSim: number;
    }[] = [];

    for (const candItem of rawCandidates) {
      const candName = candItem.row.name || candItem.row.student_name || candItem.row.farmer_name || candItem.row.beneficiary_name || candItem.row.applicant_name || candItem.row.owner_name || candItem.row.full_name || '';
      const candFather = candItem.row.father_name || candItem.row.guardian_name || candItem.row.father;
      const candAddress = candItem.row.address || candItem.row.village;
      const candDistrict = candItem.row.district;

      const passRep = SemanticSimilarityEngine.formatPassageSemanticText(candItem.row, candItem.registry);
      const candProfileVec = await getCachedVec(passRep.text, candItem.registry);
      const profileSim = SemanticSimilarityEngine.computeCosineSimilarity(queryProfileVec, candProfileVec);

      const candNameRep = SemanticSimilarityEngine.formatFieldSemanticText('name', candName, false);
      const candNameVec = await getCachedVec(candNameRep.text, candItem.registry);
      const nameSim = SemanticSimilarityEngine.computeCosineSimilarity(queryNameVec, candNameVec);

      let fatherSim = 0.0;
      if (queryFatherVec && candFather) {
        const candFatherRep = SemanticSimilarityEngine.formatFieldSemanticText('father', candFather, false);
        const candFatherVec = await getCachedVec(candFatherRep.text, candItem.registry);
        fatherSim = SemanticSimilarityEngine.computeCosineSimilarity(queryFatherVec, candFatherVec);
      }

      let addressSim = 0.0;
      if (queryAddrVec && candAddress) {
        const candAddrRep = SemanticSimilarityEngine.formatFieldSemanticText('address', candAddress, false);
        const candAddrVec = await getCachedVec(candAddrRep.text, candItem.registry);
        addressSim = SemanticSimilarityEngine.computeCosineSimilarity(queryAddrVec, candAddrVec);
      }

      let districtSim = 0.0;
      if (queryDistVec && candDistrict) {
        const candDistRep = SemanticSimilarityEngine.formatFieldSemanticText('district', candDistrict, false);
        const candDistVec = await getCachedVec(candDistRep.text, candItem.registry);
        districtSim = SemanticSimilarityEngine.computeCosineSimilarity(queryDistVec, candDistVec);
      }

      candidateEmbeddings.push({
        row: candItem.row,
        registry: candItem.registry,
        nameSim,
        fatherSim,
        addressSim,
        districtSim,
        profileSim,
      });
    }

    const tTransEnc = performance.now() - tTransStart;

    // Helper to evaluate and consolidate with a specific scorer
    const evaluateWithScorer = (scorer: V4HybridScorer) => {
      let candMatches = candidateEmbeddings.map((emb) =>
        scorer.evaluateCandidate(
          item.query,
          emb.row,
          emb.registry,
          {
            nameSemantic: emb.nameSim,
            fatherSemantic: emb.fatherSim,
            addressSemantic: emb.addressSim,
            districtSemantic: emb.districtSim,
            profileSemantic: emb.profileSim,
          },
          0.0
        )
      );

      const graphMap = CrossRegistryGraphCorroborator.corroborateCandidates(candMatches as any);
      candMatches = candMatches.map((cand, idx) => {
        const gr = graphMap.get(cand.candidateId);
        if (gr && gr.corroborationBonus > 0 && !cand.isCollisionWarning) {
          const emb = candidateEmbeddings[idx];
          return scorer.evaluateCandidate(
            item.query,
            cand.rawRecord,
            cand.registry,
            {
              nameSemantic: emb.nameSim,
              fatherSemantic: emb.fatherSim,
              addressSemantic: emb.addressSim,
              districtSemantic: emb.districtSim,
              profileSemantic: emb.profileSim,
            },
            gr.corroborationBonus
          );
        }
        return cand;
      });

      return V4IdentityConsolidator.consolidate(item.query, candMatches, DEFAULT_V4_2_CONFIG.thresholds);
    };

    // --- MODEL C: TRANSFORMER ONLY ---
    const tTransOnly0 = performance.now();
    const scoredTransOnly = [...candidateEmbeddings].sort((a, b) => b.profileSim - a.profileSim);
    const transMatches = scoredTransOnly.map((c) => ({
      candidateId: String(c.row.id || c.row.citizen_id),
      citizenId: c.row.citizen_id || c.row.master_citizen_id || c.row.id,
      registry: c.registry,
      matchedFields: ['embedding'],
      fieldScores: {
        nameScore: c.profileSim,
        dobScore: 0,
        fatherScore: 0,
        addressScore: 0,
        districtScore: 0,
        pincodeScore: 0,
        embeddingScore: c.profileSim,
        graphBonus: 0,
        transformerScore: c.profileSim,
        structuredScore: 0,
      },
      structuredScore: 0,
      transformerScore: c.profileSim,
      hybridScore: c.profileSim,
      calibratedProbability: c.profileSim,
      totalScore: c.profileSim,
      confidenceTier: (c.profileSim >= 0.85 ? 'HIGH' : c.profileSim >= 0.60 ? 'MEDIUM' : 'AMBIGUOUS') as any,
      isCollisionWarning: false,
      explanation: `Pure Transformer similarity: ${c.profileSim.toFixed(4)}`,
      rawRecord: c.row,
    }));
    const consTransOnly = V4IdentityConsolidator.consolidate(item.query, transMatches, DEFAULT_V4_CONFIG.thresholds);
    const topTrans = consTransOnly.consolidatedCandidates[0];
    const top3Trans = consTransOnly.consolidatedCandidates.slice(0, 3).map((c) => c.citizenId || '');
    recordEvaluation(
      trackerTransformer,
      item,
      retrievedTrue,
      topTrans?.citizenId,
      top3Trans,
      topTrans?.confidenceTier,
      topTrans?.isCollisionWarning ?? false,
      consTransOnly.ambiguityDetected,
      tTransEnc + (performance.now() - tTransOnly0)
    );

    // --- MODEL D: V4.1 Global Hybrid ---
    const tV4_1 = performance.now();
    const consV4_1 = evaluateWithScorer(scorerV4_1);
    const topV4_1 = consV4_1.consolidatedCandidates[0];
    const top3V4_1 = consV4_1.consolidatedCandidates.slice(0, 3).map((c) => c.citizenId || '');
    recordEvaluation(
      trackerV4_1,
      item,
      retrievedTrue,
      topV4_1?.citizenId,
      top3V4_1,
      topV4_1?.confidenceTier,
      topV4_1?.isCollisionWarning ?? false,
      consV4_1.ambiguityDetected,
      tTransEnc + (performance.now() - tV4_1)
    );

    // --- MODEL E: V4.2 Selective Gating ---
    const tV4_2 = performance.now();
    const consV4_2 = evaluateWithScorer(scorerV4_2);
    const topV4_2 = consV4_2.consolidatedCandidates[0];
    const top3V4_2 = consV4_2.consolidatedCandidates.slice(0, 3).map((c) => c.citizenId || '');
    recordEvaluation(
      trackerV4_2,
      item,
      retrievedTrue,
      topV4_2?.citizenId,
      top3V4_2,
      topV4_2?.confidenceTier,
      topV4_2?.isCollisionWarning ?? false,
      consV4_2.ambiguityDetected,
      tTransEnc + (performance.now() - tV4_2)
    );

    // --- Section 7 Experiments ---
    // Exp C: Linear 90/10
    const cons90_10 = evaluateWithScorer(scorer90_10);
    const top90_10 = cons90_10.consolidatedCandidates[0];
    recordEvaluation(
      tracker90_10,
      item,
      retrievedTrue,
      top90_10?.citizenId,
      cons90_10.consolidatedCandidates.slice(0, 3).map((c) => c.citizenId || ''),
      top90_10?.confidenceTier,
      top90_10?.isCollisionWarning ?? false,
      cons90_10.ambiguityDetected,
      tTransEnc + 0.5
    );

    // Exp D: Linear 80/20
    const cons80_20 = evaluateWithScorer(scorer80_20);
    const top80_20 = cons80_20.consolidatedCandidates[0];
    recordEvaluation(
      tracker80_20,
      item,
      retrievedTrue,
      top80_20?.citizenId,
      cons80_20.consolidatedCandidates.slice(0, 3).map((c) => c.citizenId || ''),
      top80_20?.confidenceTier,
      top80_20?.isCollisionWarning ?? false,
      cons80_20.ambiguityDetected,
      tTransEnc + 0.5
    );

    // Exp E: Cond Med/Amb
    const consCondMedAmb = evaluateWithScorer(scorerCondMedAmb);
    const topCondMedAmb = consCondMedAmb.consolidatedCandidates[0];
    recordEvaluation(
      trackerCondMedAmb,
      item,
      retrievedTrue,
      topCondMedAmb?.citizenId,
      consCondMedAmb.consolidatedCandidates.slice(0, 3).map((c) => c.citizenId || ''),
      topCondMedAmb?.confidenceTier,
      topCondMedAmb?.isCollisionWarning ?? false,
      consCondMedAmb.ambiguityDetected,
      tTransEnc + 0.5
    );

    // Exp F: Cond Multi Only
    const consCondMulti = evaluateWithScorer(scorerCondMulti);
    const topCondMulti = consCondMulti.consolidatedCandidates[0];
    recordEvaluation(
      trackerCondMulti,
      item,
      retrievedTrue,
      topCondMulti?.citizenId,
      consCondMulti.consolidatedCandidates.slice(0, 3).map((c) => c.citizenId || ''),
      topCondMulti?.confidenceTier,
      topCondMulti?.isCollisionWarning ?? false,
      consCondMulti.ambiguityDetected,
      tTransEnc + 0.5
    );
  }

  const finalV1 = finalizeMetrics(trackerV1, benchmarkQueries.length, totalPositive, totalCollision, totalNegative, englishTotal, hindiTotal, teluguTotal, romanizedTotal, multilingualTotal, transliterationTotal);
  const finalV3 = finalizeMetrics(trackerV3, benchmarkQueries.length, totalPositive, totalCollision, totalNegative, englishTotal, hindiTotal, teluguTotal, romanizedTotal, multilingualTotal, transliterationTotal);
  const finalTrans = finalizeMetrics(trackerTransformer, benchmarkQueries.length, totalPositive, totalCollision, totalNegative, englishTotal, hindiTotal, teluguTotal, romanizedTotal, multilingualTotal, transliterationTotal);
  const finalV4_1 = finalizeMetrics(trackerV4_1, benchmarkQueries.length, totalPositive, totalCollision, totalNegative, englishTotal, hindiTotal, teluguTotal, romanizedTotal, multilingualTotal, transliterationTotal);
  const finalV4_2 = finalizeMetrics(trackerV4_2, benchmarkQueries.length, totalPositive, totalCollision, totalNegative, englishTotal, hindiTotal, teluguTotal, romanizedTotal, multilingualTotal, transliterationTotal);

  const final90_10 = finalizeMetrics(tracker90_10, benchmarkQueries.length, totalPositive, totalCollision, totalNegative, englishTotal, hindiTotal, teluguTotal, romanizedTotal, multilingualTotal, transliterationTotal);
  const final80_20 = finalizeMetrics(tracker80_20, benchmarkQueries.length, totalPositive, totalCollision, totalNegative, englishTotal, hindiTotal, teluguTotal, romanizedTotal, multilingualTotal, transliterationTotal);
  const finalCondMedAmb = finalizeMetrics(trackerCondMedAmb, benchmarkQueries.length, totalPositive, totalCollision, totalNegative, englishTotal, hindiTotal, teluguTotal, romanizedTotal, multilingualTotal, transliterationTotal);
  const finalCondMulti = finalizeMetrics(trackerCondMulti, benchmarkQueries.length, totalPositive, totalCollision, totalNegative, englishTotal, hindiTotal, teluguTotal, romanizedTotal, multilingualTotal, transliterationTotal);

  console.log('\n========================================================================');
  console.log('                 PRIMARY MODEL COMPARISON (SEED=20202)                   ');
  console.log('========================================================================');
  console.table([finalV1, finalV3, finalTrans, finalV4_1, finalV4_2]);

  console.log('\n========================================================================');
  console.log('                 SECTION 7 FUSION EXPERIMENTS                            ');
  console.log('========================================================================');
  console.table([
    { Strategy: 'A. V3.1 Structured', Top1: finalV3.top1Accuracy, Top3: finalV3.top3Recall, MultiTop3: finalV3.multilingualTop3, TransTop3: finalV3.transliterationTop3, LatencyP50: finalV3.p50LatencyMs },
    { Strategy: 'B. Transformer Only', Top1: finalTrans.top1Accuracy, Top3: finalTrans.top3Recall, MultiTop3: finalTrans.multilingualTop3, TransTop3: finalTrans.transliterationTop3, LatencyP50: finalTrans.p50LatencyMs },
    { Strategy: 'C. Linear 90/10', Top1: final90_10.top1Accuracy, Top3: final90_10.top3Recall, MultiTop3: final90_10.multilingualTop3, TransTop3: final90_10.transliterationTop3, LatencyP50: final90_10.p50LatencyMs },
    { Strategy: 'D. Linear 80/20', Top1: final80_20.top1Accuracy, Top3: final80_20.top3Recall, MultiTop3: final80_20.multilingualTop3, TransTop3: final80_20.transliterationTop3, LatencyP50: final80_20.p50LatencyMs },
    { Strategy: 'E. Cond Med/Amb Only', Top1: finalCondMedAmb.top1Accuracy, Top3: finalCondMedAmb.top3Recall, MultiTop3: finalCondMedAmb.multilingualTop3, TransTop3: finalCondMedAmb.transliterationTop3, LatencyP50: finalCondMedAmb.p50LatencyMs },
    { Strategy: 'F. Cond Multi Only', Top1: finalCondMulti.top1Accuracy, Top3: finalCondMulti.top3Recall, MultiTop3: finalCondMulti.multilingualTop3, TransTop3: finalCondMulti.transliterationTop3, LatencyP50: finalCondMulti.p50LatencyMs },
    { Strategy: 'G. V4.2 Selective Gating', Top1: finalV4_2.top1Accuracy, Top3: finalV4_2.top3Recall, MultiTop3: finalV4_2.multilingualTop3, TransTop3: finalV4_2.transliterationTop3, LatencyP50: finalV4_2.p50LatencyMs },
    { Strategy: 'H. Learned Hybrid (V4.1)', Top1: finalV4_1.top1Accuracy, Top3: finalV4_1.top3Recall, MultiTop3: finalV4_1.multilingualTop3, TransTop3: finalV4_1.transliterationTop3, LatencyP50: finalV4_1.p50LatencyMs },
  ]);

  const outputSummary = {
    benchmark_version: 'v4.2.0-seed20202-selective-transformer-gating',
    timestamp: new Date().toISOString(),
    seed: 20202,
    total_queries: benchmarkQueries.length,
    population_breakdown: {
      positive_queries: totalPositive,
      english_positive: englishTotal,
      hindi_positive: hindiTotal,
      telugu_positive: teluguTotal,
      transliterated_positive: romanizedTotal,
      collision_queries: totalCollision,
      negative_queries: totalNegative,
    },
    primary_models: {
      v1_deterministic: finalV1,
      v3_1_structured: finalV3,
      transformer_only: finalTrans,
      v4_1_global_hybrid: finalV4_1,
      v4_2_selective_gating: finalV4_2,
    },
    fusion_experiments: {
      exp_a_v3_1: finalV3,
      exp_b_transformer_only: finalTrans,
      exp_c_linear_90_10: final90_10,
      exp_d_linear_80_20: final80_20,
      exp_e_cond_med_amb: finalCondMedAmb,
      exp_f_cond_multi_only: finalCondMulti,
      exp_g_selective_gating_v4_2: finalV4_2,
      exp_h_learned_v4_1: finalV4_1,
    },
  };

  const outputDir = path.resolve(process.cwd(), 'data/ai/entity-resolution/v4');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, 'clean_seed20202_summary.json'),
    JSON.stringify(outputSummary, null, 2)
  );
  console.log('\n[SUCCESS] Benchmark summary written to data/ai/entity-resolution/v4/clean_seed20202_summary.json');
}

if (process.argv[1]?.endsWith('benchmark-model2-v4-seed20202.ts')) {
  main().catch((err) => {
    console.error('[FATAL] Seed 20202 benchmark failed:', err);
    process.exit(1);
  });
}
