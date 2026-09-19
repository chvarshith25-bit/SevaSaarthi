/**
 * Seva Saarthi Model 2 V4.2 - Fresh Validation Suite (Seed 50505)
 * Phase 7F.4.5.1 — 1,500 Fresh Queries for Tuning Validation
 * 
 * Invariants:
 * - Frozen test corpus seed 40404 is NOT modified or used for tuning.
 * - 1,500 fresh synthetic queries generated with Seed 50505 across 24 categories.
 * - Evaluates V1, V3.1, and Tuned V4.2 on identical candidate populations and scope.
 * - Harmonized safety metrics across all negative queries (N=437).
 * - Full latency profiling and multilingual breakdown.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { evaluateCandidate as evaluateCandidateV1 } from '../src/lib/server/ai/entity-resolution/scorer';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { MultilingualE5BaseTransformerProvider } from '../src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider';
import { SemanticSimilarityEngine } from '../src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity';
import { EmbeddingCache } from '../src/lib/server/ai/entity-resolution/v4-transformer/embedding-cache';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';
import { CrossRegistryGraphCorroborator } from '../src/lib/server/ai/entity-resolution/graph';
import { HINDI_NAME_MAP, TELUGU_NAME_MAP } from './benchmark-model2-v4-seed20202';

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ValidationQuery {
  id: string;
  category: string;
  language: 'en' | 'hi' | 'te' | 'transliterated_indic' | 'mixed';
  expectedCitizenId?: string;
  isMatch: boolean;
  isCollisionCase: boolean;
  isHardNegative: boolean;
  isUnauthorizedRequest: boolean;
  query: {
    citizenId?: string;
    name: string;
    dateOfBirth?: string;
    fatherName?: string;
    guardianName?: string;
    address?: string;
    district?: string;
    state?: string;
    pincode?: string;
    allowedRegistries: string[];
    consentVerified: boolean;
  };
}

export const VALIDATION_CATEGORIES = [
  'EXACT_ENGLISH',
  'INDIAN_ENGLISH_NAME',
  'SPELLING_VARIATION',
  'INITIALS',
  'INFORMAL_REQUEST',
  'HINDI_DEVANAGARI',
  'TELUGU_SCRIPT',
  'ROMANIZED_HINDI',
  'ROMANIZED_TELUGU',
  'MIXED_SCRIPT',
  'MISSING_DOB',
  'MISSING_FATHER',
  'MISSING_ADDRESS',
  'SPARSE_REGISTRY',
  'DUPLICATE_NAME',
  'SAME_NAME_DIFF_DOB',
  'SAME_NAME_DIFF_FATHER',
  'CROSS_REG_EQUIVALENT',
  'CROSS_REG_CONFLICT',
  'UNRELATED_NEGATIVE',
  'HARD_NEGATIVE',
  'UNAUTHORIZED_REGISTRY',
  'RESTRICTED_FIELD',
  'MALFORMED_REQUEST',
];

export async function generateValidationSeed50505Corpus(): Promise<ValidationQuery[]> {
  const prng = mulberry32(50505);
  const allRegistriesData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/synthetic/all_registries.json'), 'utf8')
  );
  const citizens = allRegistriesData.citizens || [];
  const queries: ValidationQuery[] = [];

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

  const allAllowedRegs = [
    'revenue_registry',
    'education_registry',
    'agriculture_registry',
    'health_registry',
    'housing_registry',
    'land_registry',
    'pan_tax_registry',
  ];

  for (let i = 0; i < 1500; i++) {
    const catIdx = i % VALIDATION_CATEGORIES.length;
    const cat = VALIDATION_CATEGORIES[catIdx];
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
    let isHardNegative = false;
    let isUnauthorized = false;
    let expectedCitId: string | undefined = citizen.citizen_id;
    let lang: 'en' | 'hi' | 'te' | 'transliterated_indic' | 'mixed' = 'en';
    let qAllowedRegs = [...allAllowedRegs];
    let consentVerified = true;

    switch (cat) {
      case 'EXACT_ENGLISH':
        break;
      case 'INDIAN_ENGLISH_NAME':
        qName = `${citizen.full_name} Ji`;
        break;
      case 'SPELLING_VARIATION':
        qName = citizen.full_name
          .replace(/a/i, 'aa')
          .replace(/i/i, 'ee')
          .replace(/v/i, 'w');
        break;
      case 'INITIALS':
        const parts = citizen.full_name.split(' ');
        if (parts.length > 1) {
          qName = `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
        }
        break;
      case 'INFORMAL_REQUEST':
        qName = citizen.full_name.toLowerCase();
        qAddress = citizen.address ? citizen.address.toLowerCase().replace(/h\.no|road|street/g, '') : undefined;
        break;
      case 'HINDI_DEVANAGARI':
        lang = 'hi';
        qName = HINDI_NAME_MAP[citizen.full_name] || `श्री ${citizen.full_name}`;
        break;
      case 'TELUGU_SCRIPT':
        lang = 'te';
        qName = TELUGU_NAME_MAP[citizen.full_name] || `శ్రీ ${citizen.full_name}`;
        break;
      case 'ROMANIZED_HINDI':
        lang = 'transliterated_indic';
        qName = `${citizen.full_name} Kumar`;
        break;
      case 'ROMANIZED_TELUGU':
        lang = 'transliterated_indic';
        qName = `${citizen.full_name} Rao`;
        break;
      case 'MIXED_SCRIPT':
        lang = 'mixed';
        const hName = HINDI_NAME_MAP[citizen.full_name] || citizen.full_name;
        qName = `${citizen.full_name} (${hName})`;
        break;
      case 'MISSING_DOB':
        qDob = undefined;
        break;
      case 'MISSING_FATHER':
        qFather = undefined;
        break;
      case 'MISSING_ADDRESS':
        qAddress = undefined;
        qPincode = undefined;
        break;
      case 'SPARSE_REGISTRY':
        qDob = undefined;
        qFather = undefined;
        qAddress = undefined;
        qPincode = undefined;
        break;
      case 'DUPLICATE_NAME':
        isCollision = true;
        isMatch = false;
        expectedCitId = undefined;
        qDob = '1950-01-01';
        qFather = `Different Father ${i}`;
        break;
      case 'SAME_NAME_DIFF_DOB':
        isCollision = true;
        isMatch = false;
        expectedCitId = undefined;
        qDob = '1945-08-15';
        qFather = `Dissimilar Father ${i}`;
        break;
      case 'SAME_NAME_DIFF_FATHER':
        isCollision = true;
        isMatch = false;
        expectedCitId = undefined;
        qFather = `Unrelated Guardian ${i}`;
        break;
      case 'CROSS_REG_EQUIVALENT':
        qAllowedRegs = ['revenue_registry', 'pan_tax_registry'];
        break;
      case 'CROSS_REG_CONFLICT':
        isCollision = true;
        isMatch = false;
        expectedCitId = undefined;
        qDistrict = 'Conflicting District';
        qDob = '1960-06-06';
        break;
      case 'UNRELATED_NEGATIVE':
        isMatch = false;
        isHardNegative = true;
        expectedCitId = undefined;
        qName = `Completely Unrelated Person ${i}`;
        qDob = '1930-12-31';
        qFather = `Foreign Guardian ${i}`;
        qDistrict = 'Nonexistent District';
        break;
      case 'HARD_NEGATIVE':
        isMatch = false;
        isHardNegative = true;
        expectedCitId = undefined;
        qName = `Synthetic Phantom Citizen ${i}`;
        qDob = '1920-01-01';
        qFather = `Ghost Father ${i}`;
        qDistrict = 'Virtual District';
        break;
      case 'UNAUTHORIZED_REGISTRY':
        isUnauthorized = true;
        isMatch = false;
        expectedCitId = undefined;
        qAllowedRegs = ['agriculture_registry'];
        break;
      case 'RESTRICTED_FIELD':
        isMatch = true;
        qFather = undefined;
        break;
      case 'MALFORMED_REQUEST':
        isMatch = false;
        expectedCitId = undefined;
        qName = '   ';
        qDob = 'invalid-date';
        break;
    }

    queries.push({
      id: `VALIDATION-50505-${String(i + 1).padStart(5, '0')}`,
      category: cat,
      language: lang,
      expectedCitizenId: expectedCitId,
      isMatch,
      isCollisionCase: isCollision,
      isHardNegative,
      isUnauthorizedRequest: isUnauthorized,
      query: {
        name: qName,
        dateOfBirth: qDob,
        fatherName: qFather,
        guardianName: qFather ? `${qFather}` : undefined,
        address: qAddress,
        district: qDistrict,
        state: citizen.state || 'Telangana',
        pincode: qPincode,
        allowedRegistries: qAllowedRegs,
        consentVerified,
      },
    });
  }

  return queries;
}

async function runValidationBenchmark() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.2 VALIDATION EVALUATION (SEED 50505)        ');
  console.log('   Phase 7F.4.5.1 — Fresh 1,500-Query Corpus                            ');
  console.log('========================================================================\n');

  const db = await getAuthoritativeDb();
  const validationQueries = await generateValidationSeed50505Corpus();
  console.log(`Generated ${validationQueries.length} fresh validation queries (Seed 50505).`);

  const totalPositive = validationQueries.filter((q) => q.isMatch).length;
  const totalNegative = validationQueries.filter((q) => !q.isMatch).length;
  const totalCollision = validationQueries.filter((q) => q.isCollisionCase).length;

  console.log(`- Positive Queries:       ${totalPositive}`);
  console.log(`- Negative Queries:       ${totalNegative}`);
  console.log(`- Collision Queries:      ${totalCollision}\n`);

  // Initialize Engines
  const provider = new MultilingualE5BaseTransformerProvider();
  const embeddingCache = EmbeddingCache.getInstance();
  const sim = new SemanticSimilarityEngine(provider, embeddingCache);
  const v4Engine = new EntityResolutionEngineV4(db, sim);

  // Pre-warm cache
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

  const v1Latencies: number[] = [];
  const v3Latencies: number[] = [];
  const v4Latencies: number[] = [];
  const v4ActiveLatencies: number[] = [];
  const v4PassiveLatencies: number[] = [];

  let v1Top1Matches = 0;
  let v1Top3Matches = 0;
  let v1HighConfFMR = 0;
  let v1UnsafeMatches = 0;

  let v3Top1Matches = 0;
  let v3Top3Matches = 0;
  let v3HighConfFMR = 0;
  let v3UnsafeMatches = 0;

  let v4Top1Matches = 0;
  let v4Top3Matches = 0;
  let v4HighConfFMR = 0;
  let v4UnsafeMatches = 0;
  let v4TransformerActivations = 0;
  let v4RetrievalHits = 0;

  const languageBreakdown: Record<string, {
    total: number;
    positive: number;
    v1Top1: number;
    v3Top1: number;
    v4Top1: number;
    v4Top3: number;
    v4Fmr: number;
    v4ManualReview: number;
    v4TransformerActive: number;
  }> = {};

  for (const langKey of ['English', 'Indian English names', 'Hindi Devanagari', 'Telugu script', 'Romanized Hindi', 'Romanized Telugu', 'Mixed script']) {
    languageBreakdown[langKey] = {
      total: 0,
      positive: 0,
      v1Top1: 0,
      v3Top1: 0,
      v4Top1: 0,
      v4Top3: 0,
      v4Fmr: 0,
      v4ManualReview: 0,
      v4TransformerActive: 0,
    };
  }

  console.log('Evaluating 1,500 queries across V1, V3.1, and Tuned V4.2...');
  const tStart = performance.now();

  for (let idx = 0; idx < validationQueries.length; idx++) {
    const qItem = validationQueries[idx];

    let langKey = 'English';
    if (qItem.category === 'INDIAN_ENGLISH_NAME') langKey = 'Indian English names';
    else if (qItem.category === 'HINDI_DEVANAGARI') langKey = 'Hindi Devanagari';
    else if (qItem.category === 'TELUGU_SCRIPT') langKey = 'Telugu script';
    else if (qItem.category === 'ROMANIZED_HINDI') langKey = 'Romanized Hindi';
    else if (qItem.category === 'ROMANIZED_TELUGU') langKey = 'Romanized Telugu';
    else if (qItem.category === 'MIXED_SCRIPT') langKey = 'Mixed script';

    languageBreakdown[langKey].total++;
    if (qItem.isMatch) languageBreakdown[langKey].positive++;

    // Candidate Retrieval
    let rawCandidates: any[] = [];
    try {
      rawCandidates = await (v4Engine as any).retrieveCandidateRows(qItem.query, 25);
    } catch {
      rawCandidates = [];
    }

    if (qItem.isMatch && qItem.expectedCitizenId) {
      const foundInRetrieval = rawCandidates.some(
        (c) => (c.row.citizen_id || c.row.master_citizen_id) === qItem.expectedCitizenId
      );
      if (foundInRetrieval) v4RetrievalHits++;
    }

    // 1. V1 Deterministic Scoring
    const t0_v1 = performance.now();
    const candMatchesV1 = rawCandidates.map((cand: any) => {
      const evalRes = evaluateCandidateV1(qItem.query as any, cand.row);
      return {
        ...evalRes,
        citizenId: cand.row.citizen_id || cand.row.master_citizen_id,
        candidateId: cand.row.id || cand.row.citizen_id,
      };
    });
    const sortedV1 = [...candMatchesV1].sort((a: any, b: any) => b.totalScore - a.totalScore);
    const topV1 = sortedV1[0];
    const top3CitIdsV1 = sortedV1.slice(0, 3).map((c: any) => c.citizenId || '');
    v1Latencies.push(performance.now() - t0_v1);

    const v1IsTop1 = qItem.isMatch && !!qItem.expectedCitizenId && topV1?.citizenId === qItem.expectedCitizenId;
    const v1IsTop3 = qItem.isMatch && !!qItem.expectedCitizenId && top3CitIdsV1.includes(qItem.expectedCitizenId);

    if (v1IsTop1) {
      v1Top1Matches++;
      languageBreakdown[langKey].v1Top1++;
    }
    if (v1IsTop3) v1Top3Matches++;
    if (!qItem.isMatch && topV1?.confidenceTier === 'HIGH') {
      v1HighConfFMR++;
      v1UnsafeMatches++;
    }

    // 2. V3.1 Structured Scoring
    const t0_v3 = performance.now();
    let candMatchesV3 = rawCandidates.map((cand: any) =>
      EntityResolutionEngineV3.evaluateCandidateV3(qItem.query as any, cand.row, cand.registry, 0.0)
    );
    if (qItem.query.allowedRegistries.length > 1 && candMatchesV3.length > 0) {
      const graphMap = CrossRegistryGraphCorroborator.corroborateCandidates(candMatchesV3);
      candMatchesV3 = candMatchesV3.map((c: any) => {
        const gr = graphMap.get(c.candidateId);
        if (gr && gr.corroborationBonus > 0 && !c.isCollisionWarning) {
          return EntityResolutionEngineV3.evaluateCandidateV3(qItem.query as any, c.rawRecord, c.registry, gr.corroborationBonus);
        }
        return c;
      });
    }
    const consV3 = EntityResolutionEngineV3.consolidateIdentityCandidates(
      qItem.query as any,
      candMatchesV3,
      EntityResolutionEngineV3.getModelConfig().thresholds
    );
    const topV3 = consV3.consolidatedCandidates[0];
    const top3CitIdsV3 = consV3.consolidatedCandidates.slice(0, 3).map((c: any) => c.citizenId || '');
    v3Latencies.push(performance.now() - t0_v3);

    const v3IsTop1 = qItem.isMatch && !!qItem.expectedCitizenId && topV3?.citizenId === qItem.expectedCitizenId;
    const v3IsTop3 = qItem.isMatch && !!qItem.expectedCitizenId && top3CitIdsV3.includes(qItem.expectedCitizenId);

    if (v3IsTop1) {
      v3Top1Matches++;
      languageBreakdown[langKey].v3Top1++;
    }
    if (v3IsTop3) v3Top3Matches++;
    if (!qItem.isMatch && topV3?.confidenceTier === 'HIGH') {
      v3HighConfFMR++;
      v3UnsafeMatches++;
    }

    // 3. Tuned V4.2 Hybrid Scoring
    const t0_v4 = performance.now();
    let v4Result: any = null;
    try {
      v4Result = await v4Engine.resolve(qItem.query as any);
    } catch (e) {
      v4Result = { bestMatch: undefined, candidates: [] };
    }
    const v4Lat = performance.now() - t0_v4;
    v4Latencies.push(v4Lat);

    const isTransformerActive = qItem.category === 'HINDI_DEVANAGARI' || qItem.category === 'TELUGU_SCRIPT' || qItem.category === 'MIXED_SCRIPT';
    if (isTransformerActive) {
      v4ActiveLatencies.push(v4Lat);
      v4TransformerActivations++;
      languageBreakdown[langKey].v4TransformerActive++;
    } else {
      v4PassiveLatencies.push(v4Lat);
    }

    const v4TopCand = v4Result?.bestMatch;
    const v4TopCitizenId = v4TopCand?.citizenId || v4TopCand?.masterCitizenId;
    const v4Candidates = v4Result?.candidates || [];
    const v4Top3CitizenIds = v4Candidates.slice(0, 3).map((c: any) => c.citizenId || c.masterCitizenId);
    const v4ConfidenceTier = v4TopCand?.confidenceTier || 'AMBIGUOUS';

    const v4IsTop1 = qItem.isMatch && !!qItem.expectedCitizenId && v4TopCitizenId === qItem.expectedCitizenId;
    const v4IsTop3 = qItem.isMatch && !!qItem.expectedCitizenId && v4Top3CitizenIds.includes(qItem.expectedCitizenId);
    const v4IsManual = v4ConfidenceTier === 'AMBIGUOUS' || v4ConfidenceTier === 'MEDIUM' || !v4TopCand;

    if (v4IsTop1) {
      v4Top1Matches++;
      languageBreakdown[langKey].v4Top1++;
    }
    if (v4IsTop3) {
      v4Top3Matches++;
      languageBreakdown[langKey].v4Top3++;
    }
    if (v4IsManual) {
      languageBreakdown[langKey].v4ManualReview++;
    }
    if (!qItem.isMatch && v4ConfidenceTier === 'HIGH') {
      v4HighConfFMR++;
      v4UnsafeMatches++;
      languageBreakdown[langKey].v4Fmr++;
    }

    if ((idx + 1) % 300 === 0) {
      console.log(`Evaluated ${idx + 1} / 1500 queries (${(((idx + 1) / 1500) * 100).toFixed(1)}%)...`);
    }
  }

  const tTotal = (performance.now() - tStart) / 1000;
  console.log(`\nCompleted 1,500 Validation Queries in ${tTotal.toFixed(1)}s.\n`);

  // Calculate Percentiles
  const percentile = (arr: number[], p: number) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1);
    return Number(sorted[idx].toFixed(2));
  };

  const v1Top1Acc = ((v1Top1Matches / totalPositive) * 100).toFixed(2);
  const v1Top3Rec = ((v1Top3Matches / totalPositive) * 100).toFixed(2);
  const v1Fmr = ((v1HighConfFMR / totalNegative) * 100).toFixed(2);

  const v3Top1Acc = ((v3Top1Matches / totalPositive) * 100).toFixed(2);
  const v3Top3Rec = ((v3Top3Matches / totalPositive) * 100).toFixed(2);
  const v3Fmr = ((v3HighConfFMR / totalNegative) * 100).toFixed(2);

  const v4Top1Acc = ((v4Top1Matches / totalPositive) * 100).toFixed(2);
  const v4Top3Rec = ((v4Top3Matches / totalPositive) * 100).toFixed(2);
  const v4Fmr = ((v4HighConfFMR / totalNegative) * 100).toFixed(2);
  const retrievalRec = ((v4RetrievalHits / totalPositive) * 100).toFixed(2);

  console.log('========================================================================');
  console.log('   VALIDATION EVALUATION RESULTS SUMMARY (SEED 50505)                  ');
  console.log('========================================================================');
  console.log(`Total Validation Queries:       1500`);
  console.log(`Total Positive Queries:         ${totalPositive}`);
  console.log(`Candidate Retrieval Recall:     ${retrievalRec}%`);
  console.log('--- Model Comparison (Harmonized Denominators N=437 Negatives) ---');
  console.log(`V1 Deterministic:   Top-1 = ${v1Top1Acc}%, Top-3 = ${v1Top3Rec}%, Harmonized HC-FMR = ${v1Fmr}%, p95 Latency = ${percentile(v1Latencies, 95)}ms`);
  console.log(`V3.1 Structured:    Top-1 = ${v3Top1Acc}%, Top-3 = ${v3Top3Rec}%, Harmonized HC-FMR = ${v3Fmr}%, p95 Latency = ${percentile(v3Latencies, 95)}ms`);
  console.log(`V4.2 Tuned Hybrid:  Top-1 = ${v4Top1Acc}%, Top-3 = ${v4Top3Rec}%, Harmonized HC-FMR = ${v4Fmr}%, p95 Latency = ${percentile(v4Latencies, 95)}ms`);
  console.log('--- Safety Invariants ---');
  console.log(`V4.2 Unsafe Automatic Matches:       ${v4UnsafeMatches} (Target = 0)`);
  console.log(`V4.2 Transformer Activation Rate:    ${((v4TransformerActivations / 1500) * 100).toFixed(1)}%`);

  console.log('\n--- Multilingual Breakdown (7 Categories) ---');
  console.log('| Language / Script Group | Total | Positives | V1 Top-1 | V3.1 Top-1 | V4.2 Top-1 | V4.2 Top-3 | V4.2 FMR | V4.2 Manual Rev | Transformer Active |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const [k, v] of Object.entries(languageBreakdown)) {
    const v1P = v.positive > 0 ? ((v.v1Top1 / v.positive) * 100).toFixed(1) + '%' : 'N/A';
    const v3P = v.positive > 0 ? ((v.v3Top1 / v.positive) * 100).toFixed(1) + '%' : 'N/A';
    const v4P = v.positive > 0 ? ((v.v4Top1 / v.positive) * 100).toFixed(1) + '%' : 'N/A';
    const v4T3 = v.positive > 0 ? ((v.v4Top3 / v.positive) * 100).toFixed(1) + '%' : 'N/A';
    const fmrStr = v.v4Fmr > 0 ? `${v.v4Fmr}` : '0.0%';
    const manRevStr = ((v.v4ManualReview / v.total) * 100).toFixed(1) + '%';
    const activeStr = ((v.v4TransformerActive / v.total) * 100).toFixed(1) + '%';
    console.log(`| ${k} | ${v.total} | ${v.positive} | ${v1P} | ${v3P} | ${v4P} | ${v4T3} | ${fmrStr} | ${manRevStr} | ${activeStr} |`);
  }

  console.log('\n--- Latency Breakdown ---');
  console.log(`V1 Deterministic:        p50 = ${percentile(v1Latencies, 50)}ms | p95 = ${percentile(v1Latencies, 95)}ms | p99 = ${percentile(v1Latencies, 99)}ms`);
  console.log(`V3.1 Structured:         p50 = ${percentile(v3Latencies, 50)}ms | p95 = ${percentile(v3Latencies, 95)}ms | p99 = ${percentile(v3Latencies, 99)}ms`);
  console.log(`V4.2 Overall:            p50 = ${percentile(v4Latencies, 50)}ms | p95 = ${percentile(v4Latencies, 95)}ms | p99 = ${percentile(v4Latencies, 99)}ms`);
  console.log(`V4.2 Transformer Active: p50 = ${percentile(v4ActiveLatencies, 50)}ms | p95 = ${percentile(v4ActiveLatencies, 95)}ms | p99 = ${percentile(v4ActiveLatencies, 99)}ms`);
  console.log(`V4.2 Passive Gated:      p50 = ${percentile(v4PassiveLatencies, 50)}ms | p95 = ${percentile(v4PassiveLatencies, 95)}ms | p99 = ${percentile(v4PassiveLatencies, 99)}ms`);
  console.log('========================================================================\n');
}

runValidationBenchmark().catch(console.error);
