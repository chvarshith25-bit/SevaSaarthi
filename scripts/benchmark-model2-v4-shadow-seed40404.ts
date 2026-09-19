/**
 * Seva Saarthi Model 2 V4.2 - Final Controlled Shadow Deployment Evaluation Suite
 * Phase 7F.4.5 — 3,000-Query Fresh Seed=40404 Corpus
 * 
 * Objectives:
 * 1. Generate 3,000 fresh synthetic requests across 24 categories (Seed 40404).
 * 2. Immutable Ground-Truth Manifest (data/ai/entity-resolution/v4/shadow_manifest_seed40404.json).
 * 3. 3-System Evaluation: V1 (Authoritative), V3.1 (Baseline), V4.2 (Passive Shadow).
 * 4. Person-Level Resolution & Cross-Registry Equivalence.
 * 5. Forensic Safety Metrics (HC-FMR, Unsafe Matches, Homonym Bypass, Fallback).
 * 6. Multilingual & Script Breakdown (7 Categories).
 * 7. Gating & Neural Telemetry.
 * 8. 6-Class Disagreement Taxonomy (A through F).
 * 9. Latency Profiling (p50/p95/p99 for V1, V3.1, V4.2 Active vs Passive).
 * 10. State-Mutation Invariance Verification across 11 tables.
 * 11. Replay Determinism Verification.
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

// Seeded PRNG (Mulberry32)
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ShadowQuery {
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

export interface ShadowManifestEntry {
  requestId: string;
  expectedCitizenId?: string;
  language: string;
  queryText: string;
  authorizedRegistries: string[];
  expectedRegistry?: string;
  variationCategory: string;
  isMatch: boolean;
  isCollisionCase: boolean;
}

export interface GatingTelemetryRecord {
  requestId: string;
  category: string;
  languageClass: string;
  routingReason: string;
  gatingMode: string;
  alpha: number;
  beta: number;
  transformerActivated: boolean;
  candidateCount: number;
  topScore: number;
  secondScore: number;
  scoreMargin: number;
  confidenceTier: string;
  manualReview: boolean;
  safetyOverride: boolean;
  fallbackUsed: boolean;
  fallbackReason?: string;
  latencyMs: number;
}

export interface SystemComparisonResult {
  requestId: string;
  category: string;
  expectedCitizenId?: string;
  v1: {
    candidateCount: number;
    topCandidateId?: string;
    topCitizenId?: string;
    topScore: number;
    confidenceTier: string;
    isCorrectTop1: boolean;
    isCorrectTop3: boolean;
    isManualReview: boolean;
    latencyMs: number;
  };
  v3: {
    candidateCount: number;
    topCandidateId?: string;
    topCitizenId?: string;
    topScore: number;
    confidenceTier: string;
    isCorrectTop1: boolean;
    isCorrectTop3: boolean;
    isManualReview: boolean;
    latencyMs: number;
  };
  v4: {
    candidateCount: number;
    topCandidateId?: string;
    topCitizenId?: string;
    topScore: number;
    confidenceTier: string;
    isCorrectTop1: boolean;
    isCorrectTop3: boolean;
    isManualReview: boolean;
    latencyMs: number;
    telemetry: GatingTelemetryRecord;
  };
  disagreementClass: 'A_EQUIVALENT' | 'B_V1_CORRECT' | 'C_V3_CORRECT' | 'D_V4_CORRECT' | 'E_BOTH_PLAUSIBLE' | 'F_UNSAFE_V4' | 'NONE_AGREED';
}

function calculatePercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return Number(sorted[idx].toFixed(2));
}

// 24 Structured Categories
export const SHADOW_CATEGORIES = [
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

export async function generateFreshShadowSeed40404Corpus(): Promise<ShadowQuery[]> {
  const prng = mulberry32(40404);
  const allRegistriesData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/synthetic/all_registries.json'), 'utf8')
  );
  const citizens = allRegistriesData.citizens || [];
  const queries: ShadowQuery[] = [];

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

  let queryId = 1;
  const manifestEntries: ShadowManifestEntry[] = [];

  for (let i = 0; i < 3000; i++) {
    const catIdx = i % SHADOW_CATEGORIES.length;
    const cat = SHADOW_CATEGORIES[catIdx];
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

    const citRegs = citizenRegistryPresence.get(citizen.citizen_id) || new Set(['revenue_registry']);
    const regList = Array.from(citRegs);
    let expectedRegistry: string = regList[0] || 'revenue_registry';

    switch (cat) {
      case 'EXACT_ENGLISH':
        // Pure exact match
        break;
      case 'INDIAN_ENGLISH_NAME':
        // Standard Indian name variations
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
        qName = `Citizen ${citizen.full_name}`;
        qAddress = `Near ${citizen.district || 'City'} Town`;
        break;
      case 'HINDI_DEVANAGARI':
        lang = 'hi';
        const hiName = HINDI_NAME_MAP[citizen.full_name];
        if (!hiName) throw new Error(`Missing Hindi map for ${citizen.full_name}`);
        qName = hiName;
        break;
      case 'TELUGU_SCRIPT':
        lang = 'te';
        const teName = TELUGU_NAME_MAP[citizen.full_name];
        if (!teName) throw new Error(`Missing Telugu map for ${citizen.full_name}`);
        qName = teName;
        break;
      case 'ROMANIZED_HINDI':
        lang = 'transliterated_indic';
        qName = citizen.full_name
          .toLowerCase()
          .replace(/k/g, 'c')
          .replace(/v/g, 'w')
          .replace(/sh/g, 's')
          .replace(/th/g, 't');
        break;
      case 'ROMANIZED_TELUGU':
        lang = 'transliterated_indic';
        qName = `${citizen.full_name.toLowerCase().replace(/th/g, 't').replace(/dh/g, 'd')} gaaru`;
        break;
      case 'MIXED_SCRIPT':
        lang = 'mixed';
        const hiMixed = HINDI_NAME_MAP[citizen.full_name] || citizen.full_name;
        qName = `${citizen.full_name} (${hiMixed})`;
        break;
      case 'MISSING_DOB':
        qDob = undefined;
        break;
      case 'MISSING_FATHER':
        qFather = undefined;
        break;
      case 'MISSING_ADDRESS':
        qAddress = undefined;
        qDistrict = undefined;
        qPincode = undefined;
        break;
      case 'SPARSE_REGISTRY':
        qDob = undefined;
        qFather = undefined;
        qAddress = undefined;
        break;
      case 'DUPLICATE_NAME':
        // Same name across different synthetic registries
        break;
      case 'SAME_NAME_DIFF_DOB':
        qDob = '1945-08-15';
        qFather = `Dissimilar Father ${Math.floor(prng() * 900) + 100}`;
        isMatch = false;
        isCollision = true;
        expectedCitId = undefined;
        break;
      case 'SAME_NAME_DIFF_FATHER':
        qFather = `Dissimilar Father ${Math.floor(prng() * 900) + 100}`;
        qDistrict = 'Dissimilar District';
        isMatch = false;
        isCollision = true;
        expectedCitId = undefined;
        break;
      case 'CROSS_REG_EQUIVALENT':
        // Authorized for specific single secondary registry where citizen exists
        const chosenReg = regList[Math.floor(prng() * regList.length)] || 'revenue_registry';
        qAllowedRegs = [chosenReg];
        expectedRegistry = chosenReg;
        break;
      case 'CROSS_REG_CONFLICT':
        qDob = '1950-01-01';
        qFather = 'Conflicting Ancestor';
        qDistrict = 'Conflicting District';
        isMatch = false;
        isCollision = true;
        expectedCitId = undefined;
        break;
      case 'UNRELATED_NEGATIVE':
        qName = `Completely Unrelated Citizen ${Math.floor(prng() * 90000) + 10000}`;
        qDob = '1930-10-10';
        qFather = 'Unknown Ancestor';
        qDistrict = 'Leh';
        isMatch = false;
        isCollision = false;
        expectedCitId = undefined;
        break;
      case 'HARD_NEGATIVE':
        // Close name variant of a real person but completely distinct citizen identity
        qName = `${citizen.full_name.split(' ')[0]} Chawla`;
        qDob = '1965-06-15';
        qFather = 'Distinct Father Name';
        qDistrict = 'Bhopal';
        isMatch = false;
        isCollision = false;
        isHardNegative = true;
        expectedCitId = undefined;
        break;
      case 'UNAUTHORIZED_REGISTRY':
        // Request restricted to a registry where target citizen does NOT exist
        const unauthRegs = allAllowedRegs.filter((r) => !citRegs.has(r));
        if (unauthRegs.length > 0) {
          qAllowedRegs = [unauthRegs[0]];
          isMatch = false;
          expectedCitId = undefined;
          isUnauthorized = true;
        }
        break;
      case 'RESTRICTED_FIELD':
        consentVerified = false; // DPDP gate test
        isUnauthorized = true;
        break;
      case 'MALFORMED_REQUEST':
        qName = `### INVALID_TOKEN_${Math.floor(prng() * 9999)} %%%`;
        qDob = '9999-99-99';
        isMatch = false;
        expectedCitId = undefined;
        break;
    }

    const reqId = `SHADOW-40404-${String(queryId++).padStart(5, '0')}`;

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
      isHardNegative,
      isUnauthorizedRequest: isUnauthorized,
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
        consentVerified,
      },
    });

    manifestEntries.push({
      requestId: reqId,
      expectedCitizenId: expectedCitId,
      language: lang,
      queryText: qName,
      authorizedRegistries: qAllowedRegs,
      expectedRegistry: isMatch ? expectedRegistry : undefined,
      variationCategory: cat,
      isMatch,
      isCollisionCase: isCollision,
    });
  }

  // Save immutable shadow manifest
  try {
    const manifestDir = path.resolve(process.cwd(), 'data/ai/entity-resolution/v4');
    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(manifestDir, 'shadow_manifest_seed40404.json'),
      JSON.stringify(manifestEntries, null, 2),
      'utf8'
    );
  } catch (mErr) {
    console.warn('[Shadow] Warning: Could not write shadow manifest file:', mErr);
  }

  return queries;
}

// Database state snapshot calculation
export async function computeDatabaseSnapshotHash(): Promise<{ totalRows: number; tablesHash: string }> {
  const db = await getAuthoritativeDb();
  const tables = [
    'applications',
    'application_routing_recommendations',
    'synthetic_master_citizens',
    'registry_revenue',
    'registry_education',
    'registry_agriculture',
    'registry_health',
    'registry_housing',
    'registry_land',
    'registry_pan',
    'sub_departments',
  ];

  let totalRows = 0;
  const tableHashes: string[] = [];

  for (const table of tables) {
    const res = await db.query(`SELECT * FROM "${table}" ORDER BY 1 ASC`);
    const rowList = res.rows || [];
    totalRows += rowList.length;
    const hash = crypto.createHash('sha256').update(JSON.stringify(rowList)).digest('hex');
    tableHashes.push(`${table}:${rowList.length}:${hash}`);
  }

  const tablesHash = crypto.createHash('sha256').update(tableHashes.join('|')).digest('hex');
  return { totalRows, tablesHash };
}

export async function runControlledShadowDeployment() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.2 CONTROLLED SHADOW DEPLOYMENT EVALUATION   ');
  console.log('   Phase 7F.4.5 — 3,000 Fresh Queries (Seed 40404)                      ');
  console.log('========================================================================\n');

  // STEP 1: FREEZE & SNAPSHOT
  console.log('STEP 1: Verifying baseline freeze and capturing DB state hash...');
  const baselineSnapshot = await computeDatabaseSnapshotHash();
  console.log(`Baseline DB State: Total Rows = ${baselineSnapshot.totalRows}, SHA-256 = ${baselineSnapshot.tablesHash.slice(0, 16)}...\n`);

  // STEP 2 & 3: CORPUS GENERATION & INTEGRITY
  console.log('STEP 2 & 3: Generating fresh 3,000-query shadow corpus and asserting ground truth...');
  const shadowQueries = await generateFreshShadowSeed40404Corpus();
  console.log(`Successfully generated ${shadowQueries.length} fresh shadow queries.`);
  const positiveQueries = shadowQueries.filter((q) => q.isMatch && q.expectedCitizenId);
  const collisionQueries = shadowQueries.filter((q) => q.isCollisionCase);
  const hardNegativeQueries = shadowQueries.filter((q) => q.isHardNegative);
  const unauthQueries = shadowQueries.filter((q) => q.isUnauthorizedRequest);
  console.log(`- Positive Queries:       ${positiveQueries.length}`);
  console.log(`- Collision Queries:      ${collisionQueries.length}`);
  console.log(`- Hard Negative Queries:  ${hardNegativeQueries.length}`);
  console.log(`- Unauthorized Queries:   ${unauthQueries.length}\n`);

  // STEP 4: INITIALIZE SYSTEMS
  console.log('STEP 4: Initializing Model 2 V1, V3.1, and V4.2 engines...');
  const v4Engine = EntityResolutionEngineV4.getInstance();

  // Load candidate mapping helper
  const allRegistriesData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/synthetic/all_registries.json'), 'utf8')
  );
  const candidateToCitizenMap = new Map<string, string>();
  for (const regKey of ['revenue', 'education', 'agriculture', 'health', 'housing', 'land', 'pan']) {
    const list = (allRegistriesData as any)[regKey] || [];
    for (const item of list) {
      if (item.id && item.citizen_id) {
        candidateToCitizenMap.set(item.id, item.citizen_id);
      }
    }
  }

  // Pre-warming Transformer Provider Cache
  console.log('>>> Pre-warming Transformer Provider embedding cache for shadow evaluation...');
  const provider = new MultilingualE5BaseTransformerProvider();
  const embeddingCache = EmbeddingCache.getInstance();
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
  const tWarmStart = performance.now();
  for (let b = 0; b < textArray.length; b += 32) {
    const batch = textArray.slice(b, b + 32);
    const embs = await provider.embedBatch(batch);
    for (let k = 0; k < batch.length; k++) {
      const key = EmbeddingCache.computeCacheKey(batch[k], provider.modelId);
      embeddingCache.set(key, embs[k], batch[k]);
    }
  }
  console.log(`Pre-warming completed in ${((performance.now() - tWarmStart) / 1000).toFixed(2)}s.\n`);

  // System Trackers
  const v1Latencies: number[] = [];
  const v3Latencies: number[] = [];
  const v4Latencies: number[] = [];
  const v4ActiveTransformerLatencies: number[] = [];
  const v4PassiveLatencies: number[] = [];

  let v1Top1Matches = 0;
  let v1Top3Matches = 0;
  let v1HighConfFMR = 0;
  let v1UnsafeMatches = 0;
  let v1ManualReviews = 0;

  let v3Top1Matches = 0;
  let v3Top3Matches = 0;
  let v3HighConfFMR = 0;
  let v3UnsafeMatches = 0;
  let v3ManualReviews = 0;

  let v4Top1Matches = 0;
  let v4Top3Matches = 0;
  let v4HighConfFMR = 0;
  let v4UnsafeMatches = 0;
  let v4ManualReviews = 0;
  let v4TransformerActivations = 0;
  let v4Fallbacks = 0;
  let v4HomonymBypasses = 0;
  let v4RetrievalHits = 0;

  const telemetryRecords: GatingTelemetryRecord[] = [];
  const comparisons: SystemComparisonResult[] = [];

  // Multilingual Stats Breakdown
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

  // Disagreement Taxonomy Counts
  const disagreementCounts: Record<string, number> = {
    A_EQUIVALENT: 0,
    B_V1_CORRECT: 0,
    C_V3_CORRECT: 0,
    D_V4_CORRECT: 0,
    E_BOTH_PLAUSIBLE: 0,
    F_UNSAFE_V4: 0,
    NONE_AGREED: 0,
  };

  console.log('Executing 3-way evaluation on 3,000 queries...');
  const startTime = Date.now();

  for (let idx = 0; idx < shadowQueries.length; idx++) {
    const qItem = shadowQueries[idx];

    // Determine Linguistic Display Key
    let langKey = 'English';
    if (qItem.category === 'INDIAN_ENGLISH_NAME') langKey = 'Indian English names';
    else if (qItem.category === 'HINDI_DEVANAGARI') langKey = 'Hindi Devanagari';
    else if (qItem.category === 'TELUGU_SCRIPT') langKey = 'Telugu script';
    else if (qItem.category === 'ROMANIZED_HINDI') langKey = 'Romanized Hindi';
    else if (qItem.category === 'ROMANIZED_TELUGU') langKey = 'Romanized Telugu';
    else if (qItem.category === 'MIXED_SCRIPT') langKey = 'Mixed script';

    languageBreakdown[langKey].total++;
    if (qItem.isMatch) languageBreakdown[langKey].positive++;

    // 1. Candidate Retrieval from authorized registries (shared identical pool)
    let rawCandidates: any[] = [];
    try {
      rawCandidates = await (v4Engine as any).retrieveCandidateRows(qItem.query, 25);
    } catch (e) {
      // e.g. DPDP unverified consent thrown
      rawCandidates = [];
    }

    const candCitIds = rawCandidates.map((c: any) => c.row.citizen_id || c.row.master_citizen_id || c.row.id);
    const retrievedTrue = qItem.expectedCitizenId ? candCitIds.includes(qItem.expectedCitizenId) : false;
    if (retrievedTrue) v4RetrievalHits++;

    // 2. Run V1 Deterministic Scoring
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
    const v1Lat = performance.now() - t0_v1;
    v1Latencies.push(v1Lat);

    const v1IsTop1 = qItem.isMatch && !!qItem.expectedCitizenId && topV1?.citizenId === qItem.expectedCitizenId;
    const v1IsTop3 = qItem.isMatch && !!qItem.expectedCitizenId && top3CitIdsV1.includes(qItem.expectedCitizenId);
    const v1IsManual = topV1?.confidenceTier === 'AMBIGUOUS' || topV1?.confidenceTier === 'MEDIUM' || !topV1;

    if (v1IsTop1) {
      v1Top1Matches++;
      languageBreakdown[langKey].v1Top1++;
    }
    if (v1IsTop3) v1Top3Matches++;
    if (v1IsManual) v1ManualReviews++;
    if (!qItem.isMatch && topV1?.confidenceTier === 'HIGH') {
      v1HighConfFMR++;
      v1UnsafeMatches++;
    }

    // 3. Run V3.1 Structured Scoring
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
    const v3Lat = performance.now() - t0_v3;
    v3Latencies.push(v3Lat);

    const v3IsTop1 = qItem.isMatch && !!qItem.expectedCitizenId && topV3?.citizenId === qItem.expectedCitizenId;
    const v3IsTop3 = qItem.isMatch && !!qItem.expectedCitizenId && top3CitIdsV3.includes(qItem.expectedCitizenId);
    const v3IsManual = topV3?.confidenceTier === 'AMBIGUOUS' || topV3?.confidenceTier === 'MEDIUM' || !topV3;

    if (v3IsTop1) {
      v3Top1Matches++;
      languageBreakdown[langKey].v3Top1++;
    }
    if (v3IsTop3) v3Top3Matches++;
    if (v3IsManual) v3ManualReviews++;
    if (!qItem.isMatch && topV3?.confidenceTier === 'HIGH') {
      v3HighConfFMR++;
      v3UnsafeMatches++;
    }

    // 4. Run V4.2 Hybrid Engine (Passive Shadow)
    const t0_v4 = performance.now();
    let v4Result: any = null;
    try {
      v4Result = await v4Engine.resolve(qItem.query as any);
    } catch (e) {
      v4Result = { bestMatch: undefined, candidates: [], querySummary: {}, disclaimer: '', fallbackUsed: true, fallbackReason: String(e) };
    }
    const v4Lat = performance.now() - t0_v4;
    v4Latencies.push(v4Lat);

    const v4TopCand = v4Result?.bestMatch;
    const v4TopCitizenId = v4TopCand?.citizenId || (v4TopCand ? candidateToCitizenMap.get(v4TopCand.candidateId) : undefined);
    const v4Candidates = v4Result?.candidates || [];
    const v4Top3CitizenIds = v4Candidates.slice(0, 3).map((c: any) => c.citizenId || candidateToCitizenMap.get(c.candidateId));
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
      v4ManualReviews++;
      languageBreakdown[langKey].v4ManualReview++;
    }

    // Safety checks for V4
    if (!qItem.isMatch && v4ConfidenceTier === 'HIGH') {
      v4HighConfFMR++;
      v4UnsafeMatches++;
      languageBreakdown[langKey].v4Fmr++;
    }
    if (qItem.isCollisionCase && v4ConfidenceTier === 'HIGH') {
      v4HomonymBypasses++;
    }
    if (v4Result?.fallbackUsed) {
      v4Fallbacks++;
    }

    // Gating & Telemetry
    const topScore = v4TopCand ? v4TopCand.totalScore || 0 : 0;
    const secondScore = v4Candidates.length > 1 ? v4Candidates[1].totalScore || 0 : 0;
    const scoreMargin = Number((topScore - secondScore).toFixed(4));
    const transformerActivated = (v4TopCand?.gatingDecision?.betaTransformer ?? 0) > 0 || (v4TopCand?.gatingDecision?.isMultilingual ?? false);

    if (transformerActivated) {
      v4TransformerActivations++;
      v4ActiveTransformerLatencies.push(v4Lat);
      languageBreakdown[langKey].v4TransformerActive++;
    } else {
      v4PassiveLatencies.push(v4Lat);
    }

    const telemetry: GatingTelemetryRecord = {
      requestId: qItem.id,
      category: qItem.category,
      languageClass: v4TopCand?.gatingDecision?.detectedLanguage || (qItem.language === 'en' ? 'ENGLISH' : 'MULTILINGUAL'),
      routingReason: v4TopCand?.gatingDecision?.reason || 'DEFAULT',
      gatingMode: v4TopCand?.gatingDecision?.mode || 'STRUCTURED_ONLY',
      alpha: v4TopCand?.gatingDecision?.alphaStructured ?? 1.0,
      beta: v4TopCand?.gatingDecision?.betaTransformer ?? 0.0,
      transformerActivated,
      candidateCount: v4Candidates.length,
      topScore,
      secondScore,
      scoreMargin,
      confidenceTier: v4ConfidenceTier,
      manualReview: v4IsManual,
      safetyOverride: v4TopCand?.isCollisionWarning || false,
      fallbackUsed: !!v4Result?.fallbackUsed,
      fallbackReason: v4Result?.fallbackReason,
      latencyMs: Number(v4Lat.toFixed(2)),
    };
    telemetryRecords.push(telemetry);

    // Disagreement Taxonomy Classification (Step 9)
    let diagClass: 'A_EQUIVALENT' | 'B_V1_CORRECT' | 'C_V3_CORRECT' | 'D_V4_CORRECT' | 'E_BOTH_PLAUSIBLE' | 'F_UNSAFE_V4' | 'NONE_AGREED' = 'NONE_AGREED';
    if (!qItem.isMatch && v4ConfidenceTier === 'HIGH') {
      diagClass = 'F_UNSAFE_V4';
    } else if (topV1?.citizenId === v4TopCitizenId && topV3?.citizenId === v4TopCitizenId) {
      diagClass = 'NONE_AGREED'; // Full consensus
    } else if (qItem.isMatch && v4TopCitizenId === qItem.expectedCitizenId && (topV1?.citizenId === qItem.expectedCitizenId || topV3?.citizenId === qItem.expectedCitizenId)) {
      diagClass = 'A_EQUIVALENT';
    } else if (qItem.isMatch && v4TopCitizenId === qItem.expectedCitizenId && topV3?.citizenId !== qItem.expectedCitizenId) {
      diagClass = 'D_V4_CORRECT';
    } else if (qItem.isMatch && topV3?.citizenId === qItem.expectedCitizenId && v4TopCitizenId !== qItem.expectedCitizenId) {
      diagClass = 'C_V3_CORRECT';
    } else if (qItem.isMatch && topV1?.citizenId === qItem.expectedCitizenId && v4TopCitizenId !== qItem.expectedCitizenId) {
      diagClass = 'B_V1_CORRECT';
    } else {
      diagClass = 'E_BOTH_PLAUSIBLE';
    }

    disagreementCounts[diagClass]++;

    comparisons.push({
      requestId: qItem.id,
      category: qItem.category,
      expectedCitizenId: qItem.expectedCitizenId,
      v1: {
        candidateCount: sortedV1.length,
        topCandidateId: topV1?.candidateId,
        topCitizenId: topV1?.citizenId,
        topScore: topV1?.totalScore || 0,
        confidenceTier: topV1?.confidenceTier || 'AMBIGUOUS',
        isCorrectTop1: v1IsTop1,
        isCorrectTop3: v1IsTop3,
        isManualReview: v1IsManual,
        latencyMs: Number(v1Lat.toFixed(2)),
      },
      v3: {
        candidateCount: consV3.consolidatedCandidates.length,
        topCandidateId: topV3?.candidateId,
        topCitizenId: topV3?.citizenId,
        topScore: topV3?.totalScore || 0,
        confidenceTier: topV3?.confidenceTier || 'AMBIGUOUS',
        isCorrectTop1: v3IsTop1,
        isCorrectTop3: v3IsTop3,
        isManualReview: v3IsManual,
        latencyMs: Number(v3Lat.toFixed(2)),
      },
      v4: {
        candidateCount: v4Candidates.length,
        topCandidateId: v4TopCand?.candidateId,
        topCitizenId: v4TopCitizenId,
        topScore: v4TopCand?.totalScore || 0,
        confidenceTier: v4ConfidenceTier,
        isCorrectTop1: v4IsTop1,
        isCorrectTop3: v4IsTop3,
        isManualReview: v4IsManual,
        latencyMs: Number(v4Lat.toFixed(2)),
        telemetry,
      },
      disagreementClass: diagClass,
    });

    if ((idx + 1) % 500 === 0 || idx === shadowQueries.length - 1) {
      console.log(`Evaluated ${idx + 1} / ${shadowQueries.length} queries (${((idx + 1) / shadowQueries.length * 100).toFixed(1)}%)...`);
    }
  }

  const elapsedTotal = (Date.now() - startTime) / 1000;
  console.log(`\nCompleted 3-Way Shadow Evaluation in ${elapsedTotal.toFixed(1)}s.`);

  // STEP 11: POST-RUN STATE MUTATION AUDIT
  console.log('\nSTEP 11: Verifying Database State Invariance across all 11 tables...');
  const postSnapshot = await computeDatabaseSnapshotHash();
  const stateMutationDetected = baselineSnapshot.tablesHash !== postSnapshot.tablesHash;
  if (stateMutationDetected) {
    console.error('CRITICAL: State mutation detected during shadow run!');
  } else {
    console.log(`[PASS] Zero database state mutations verified! (Hash: ${postSnapshot.tablesHash.slice(0, 16)}...)`);
  }

  // STEP 13: REPLAY DETERMINISM
  console.log('\nSTEP 13: Verifying Replay Determinism on seed 40404 sample...');
  let replayMismatches = 0;
  const replaySampleIndices = [0, 50, 100, 250, 500, 750, 1000, 1500, 2000, 2500, 2999];
  for (const rIdx of replaySampleIndices) {
    const qSample = shadowQueries[rIdx];
    const prevComp = comparisons[rIdx];
    const v4Replay = await v4Engine.resolve(qSample.query as any);
    const replayTopId = v4Replay?.bestMatch?.citizenId || (v4Replay?.bestMatch ? candidateToCitizenMap.get(v4Replay.bestMatch.candidateId) : undefined);
    const replayTier = v4Replay?.bestMatch?.confidenceTier || 'AMBIGUOUS';
    if (replayTopId !== prevComp.v4.topCitizenId || replayTier !== prevComp.v4.confidenceTier) {
      replayMismatches++;
      console.error(`Replay mismatch at query ${qSample.id}: expected (${prevComp.v4.topCitizenId}, ${prevComp.v4.confidenceTier}) vs got (${replayTopId}, ${replayTier})`);
    }
  }
  console.log(`Replay Determinism Check: ${replayMismatches === 0 ? '100.00% DETERMINISTIC' : 'NON-DETERMINISM DETECTED'}`);

  // LATENCY COMPUTATION
  const v1P50 = calculatePercentile(v1Latencies, 50);
  const v1P95 = calculatePercentile(v1Latencies, 95);
  const v1P99 = calculatePercentile(v1Latencies, 99);

  const v3P50 = calculatePercentile(v3Latencies, 50);
  const v3P95 = calculatePercentile(v3Latencies, 95);
  const v3P99 = calculatePercentile(v3Latencies, 99);

  const v4P50 = calculatePercentile(v4Latencies, 50);
  const v4P95 = calculatePercentile(v4Latencies, 95);
  const v4P99 = calculatePercentile(v4Latencies, 99);

  const v4ActiveP50 = calculatePercentile(v4ActiveTransformerLatencies, 50);
  const v4ActiveP95 = calculatePercentile(v4ActiveTransformerLatencies, 95);
  const v4ActiveP99 = calculatePercentile(v4ActiveTransformerLatencies, 99);

  const v4PassiveP50 = calculatePercentile(v4PassiveLatencies, 50);
  const v4PassiveP95 = calculatePercentile(v4PassiveLatencies, 95);
  const v4PassiveP99 = calculatePercentile(v4PassiveLatencies, 99);

  // SUMMARY CALCULATIONS
  const totalPositive = positiveQueries.length;
  const totalNegative = shadowQueries.length - totalPositive;
  const totalCollision = collisionQueries.length;

  const v1Top1Acc = Number(((v1Top1Matches / totalPositive) * 100).toFixed(2));
  const v1Top3Rec = Number(((v1Top3Matches / totalPositive) * 100).toFixed(2));
  const v3Top1Acc = Number(((v3Top1Matches / totalPositive) * 100).toFixed(2));
  const v3Top3Rec = Number(((v3Top3Matches / totalPositive) * 100).toFixed(2));
  const v4Top1Acc = Number(((v4Top1Matches / totalPositive) * 100).toFixed(2));
  const v4Top3Rec = Number(((v4Top3Matches / totalPositive) * 100).toFixed(2));
  const v4RetrievalRecall = Number(((v4RetrievalHits / totalPositive) * 100).toFixed(2));

  const v4HcFmr = Number(((v4HighConfFMR / Math.max(1, totalNegative)) * 100).toFixed(3));
  const v4HomonymFmr = Number(((v4HomonymBypasses / Math.max(1, totalCollision)) * 100).toFixed(3));
  const v4ManualReviewRate = Number(((v4ManualReviews / shadowQueries.length) * 100).toFixed(2));
  const v4TransformerActivationRate = Number(((v4TransformerActivations / shadowQueries.length) * 100).toFixed(2));

  console.log('\n========================================================================');
  console.log('   CONTROLLED SHADOW EVALUATION SUMMARY RESULTS                        ');
  console.log('========================================================================');
  console.log(`Total Synthetic Queries:        ${shadowQueries.length}`);
  console.log(`Total Positive Queries:         ${totalPositive}`);
  console.log(`Candidate Retrieval Recall:     ${v4RetrievalRecall}%`);
  console.log('--- Model Comparison ---');
  console.log(`V1 Deterministic:   Top-1 = ${v1Top1Acc}%, Top-3 = ${v1Top3Rec}%, HC-FMR = ${(v1HighConfFMR/totalNegative*100).toFixed(2)}%, p95 Latency = ${v1P95}ms`);
  console.log(`V3.1 Structured:    Top-1 = ${v3Top1Acc}%, Top-3 = ${v3Top3Rec}%, HC-FMR = ${(v3HighConfFMR/totalNegative*100).toFixed(2)}%, p95 Latency = ${v3P95}ms`);
  console.log(`V4.2 Hybrid Shadow: Top-1 = ${v4Top1Acc}%, Top-3 = ${v4Top3Rec}%, HC-FMR = ${v4HcFmr}%, p95 Latency = ${v4P95}ms`);
  console.log('--- Safety Invariants ---');
  console.log(`Unsafe Automatic Matches:       ${v4UnsafeMatches}`);
  console.log(`Homonym Collision Bypass Count: ${v4HomonymBypasses} (${v4HomonymFmr}%)`);
  console.log(`Transformer Activation Rate:    ${v4TransformerActivationRate}% (${v4TransformerActivations} / ${shadowQueries.length})`);
  console.log(`Fallback Invocations:           ${v4Fallbacks}`);
  console.log(`State Mutations Detected:       ${stateMutationDetected ? 'YES' : '0 (NONE)'}`);
  console.log('\n--- Multilingual Breakdown (7 Categories) ---');
  console.log('| Language / Script Group | Total | Positives | V1 Top-1 | V3.1 Top-1 | V4.2 Top-1 | V4.2 Top-3 | V4.2 FMR | V4.2 Manual Rev | Transformer Active |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  for (const [grp, st] of Object.entries(languageBreakdown)) {
    const v1Acc = st.positive > 0 ? ((st.v1Top1 / st.positive) * 100).toFixed(1) + '%' : 'N/A';
    const v3Acc = st.positive > 0 ? ((st.v3Top1 / st.positive) * 100).toFixed(1) + '%' : 'N/A';
    const v4Acc = st.positive > 0 ? ((st.v4Top1 / st.positive) * 100).toFixed(1) + '%' : 'N/A';
    const v4Rec = st.positive > 0 ? ((st.v4Top3 / st.positive) * 100).toFixed(1) + '%' : 'N/A';
    const negCount = st.total - st.positive;
    const fmrStr = negCount > 0 ? ((st.v4Fmr / negCount) * 100).toFixed(2) + '%' : '0.0%';
    const manRevStr = ((st.v4ManualReview / st.total) * 100).toFixed(1) + '%';
    const transActStr = ((st.v4TransformerActive / st.total) * 100).toFixed(1) + '%';
    console.log(`| ${grp} | ${st.total} | ${st.positive} | ${v1Acc} | ${v3Acc} | ${v4Acc} | ${v4Rec} | ${fmrStr} | ${manRevStr} | ${transActStr} |`);
  }

  console.log('\n--- Cross-Registry Disagreement Taxonomy (Step 9) ---');
  console.log(`- Category A (Same Master Citizen / Equivalent Record): ${disagreementCounts.A_EQUIVALENT} (${((disagreementCounts.A_EQUIVALENT / shadowQueries.length) * 100).toFixed(2)}%)`);
  console.log(`- Category B (V1 Correct, V4.2 Disagreed):               ${disagreementCounts.B_V1_CORRECT} (${((disagreementCounts.B_V1_CORRECT / shadowQueries.length) * 100).toFixed(2)}%)`);
  console.log(`- Category C (V3.1 Correct, V4.2 Disagreed):             ${disagreementCounts.C_V3_CORRECT} (${((disagreementCounts.C_V3_CORRECT / shadowQueries.length) * 100).toFixed(2)}%)`);
  console.log(`- Category D (V4.2 Correct, Baseline Missed):            ${disagreementCounts.D_V4_CORRECT} (${((disagreementCounts.D_V4_CORRECT / shadowQueries.length) * 100).toFixed(2)}%)`);
  console.log(`- Category E (Both Plausible / Manual Review Required):   ${disagreementCounts.E_BOTH_PLAUSIBLE} (${((disagreementCounts.E_BOTH_PLAUSIBLE / shadowQueries.length) * 100).toFixed(2)}%)`);
  console.log(`- Category F (Unsafe V4.2 Result):                       ${disagreementCounts.F_UNSAFE_V4} (${((disagreementCounts.F_UNSAFE_V4 / shadowQueries.length) * 100).toFixed(2)}%)`);
  console.log(`- Consensus (All Models Agreed):                         ${disagreementCounts.NONE_AGREED} (${((disagreementCounts.NONE_AGREED / shadowQueries.length) * 100).toFixed(2)}%)`);

  console.log('\n--- Latency Breakdown (Step 10) ---');
  console.log(`V1 Deterministic:       p50 = ${v1P50}ms | p95 = ${v1P95}ms | p99 = ${v1P99}ms`);
  console.log(`V3.1 Structured:        p50 = ${v3P50}ms | p95 = ${v3P95}ms | p99 = ${v3P99}ms`);
  console.log(`V4.2 Overall:           p50 = ${v4P50}ms | p95 = ${v4P95}ms | p99 = ${v4P99}ms`);
  console.log(`V4.2 Transformer Active: p50 = ${v4ActiveP50}ms | p95 = ${v4ActiveP95}ms | p99 = ${v4ActiveP99}ms`);
  console.log(`V4.2 Passive Gated:     p50 = ${v4PassiveP50}ms | p95 = ${v4PassiveP95}ms | p99 = ${v4PassiveP99}ms`);
  console.log('========================================================================\n');

  // Write full JSON result
  try {
    const resPath = path.resolve(process.cwd(), 'data/ai/entity-resolution/v4/shadow_results_seed40404.json');
    fs.writeFileSync(
      resPath,
      JSON.stringify(
        {
          summary: {
            totalQueries: shadowQueries.length,
            totalPositive,
            totalNegative,
            totalCollision,
            v4RetrievalRecall,
            v1: { top1Acc: v1Top1Acc, top3Rec: v1Top3Rec, highConfFmr: Number(((v1HighConfFMR / totalNegative) * 100).toFixed(2)), p50: v1P50, p95: v1P95, p99: v1P99 },
            v3: { top1Acc: v3Top1Acc, top3Rec: v3Top3Rec, highConfFmr: Number(((v3HighConfFMR / totalNegative) * 100).toFixed(2)), p50: v3P50, p95: v3P95, p99: v3P99 },
            v4: { top1Acc: v4Top1Acc, top3Rec: v4Top3Rec, highConfFmr: v4HcFmr, homonymFmr: v4HomonymFmr, unsafeMatches: v4UnsafeMatches, manualReviewRate: v4ManualReviewRate, transformerActivationRate: v4TransformerActivationRate, fallbacks: v4Fallbacks, p50: v4P50, p95: v4P95, p99: v4P99, activeP50: v4ActiveP50, activeP95: v4ActiveP95, activeP99: v4ActiveP99, passiveP50: v4PassiveP50, passiveP95: v4PassiveP95, passiveP99: v4PassiveP99 },
          },
          languageBreakdown,
          disagreementCounts,
        },
        null,
        2
      ),
      'utf8'
    );
  } catch (rErr) {
    console.warn('Could not write shadow_results_seed40404.json:', rErr);
  }

  return {
    baselineSnapshot,
    postSnapshot,
    stateMutationDetected,
    replayMismatches,
    totalQueries: shadowQueries.length,
    totalPositive,
    totalNegative,
    totalCollision,
    v1: {
      top1Acc: v1Top1Acc,
      top3Rec: v1Top3Rec,
      highConfFmr: Number(((v1HighConfFMR / totalNegative) * 100).toFixed(2)),
      p50: v1P50,
      p95: v1P95,
      p99: v1P99,
    },
    v3: {
      top1Acc: v3Top1Acc,
      top3Rec: v3Top3Rec,
      highConfFmr: Number(((v3HighConfFMR / totalNegative) * 100).toFixed(2)),
      p50: v3P50,
      p95: v3P95,
      p99: v3P99,
    },
    v4: {
      retrievalRecall: v4RetrievalRecall,
      top1Acc: v4Top1Acc,
      top3Rec: v4Top3Rec,
      highConfFmr: v4HcFmr,
      homonymFmr: v4HomonymFmr,
      unsafeMatches: v4UnsafeMatches,
      manualReviewRate: v4ManualReviewRate,
      transformerActivationRate: v4TransformerActivationRate,
      fallbacks: v4Fallbacks,
      p50: v4P50,
      p95: v4P95,
      p99: v4P99,
      activeP50: v4ActiveP50,
      activeP95: v4ActiveP95,
      activeP99: v4ActiveP99,
      passiveP50: v4PassiveP50,
      passiveP95: v4PassiveP95,
      passiveP99: v4PassiveP99,
    },
    languageBreakdown,
    disagreementCounts,
  };
}

if (require.main === module) {
  runControlledShadowDeployment()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal Shadow Evaluation Error:', err);
      process.exit(1);
    });
}
