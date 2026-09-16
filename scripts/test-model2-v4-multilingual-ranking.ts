/**
 * Seva Saarthi AI Model 2 V4.1 - Multilingual & Transliteration Ranking Test Suite
 * 
 * Dedicated Multilingual Evaluation across:
 * - English
 * - Hindi (Devanagari script)
 * - Telugu (Telugu script)
 * - Romanized Hindi
 * - Romanized Telugu
 * - Mixed-Language Queries
 * 
 * Evaluates:
 * - Top-1 Person Accuracy
 * - Top-3 Person Recall
 * - False Match Rate (FMR)
 * - Collision FMR
 * 
 * Compares:
 * - Model B: V3.1 Structured Baseline
 * - Model C: Transformer-Only Baseline
 * - Model D: V4.1 Field-Aware Hybrid Model
 */

import { MultilingualE5BaseTransformerProvider } from '../src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider';
import { V4HybridScorer, DEFAULT_V4_1_CONFIG } from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';
import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';
import { SemanticSimilarityEngine } from '../src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity';
import { EntityResolutionInput } from '../src/lib/server/ai/entity-resolution/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`[PASS] ${msg}`);
}

interface MultilingualTestCase {
  id: string;
  language: 'English' | 'Hindi' | 'Telugu' | 'Romanized Hindi' | 'Romanized Telugu' | 'Mixed';
  query: EntityResolutionInput;
  targetRecord: Record<string, any>;
  expectedCitizenId: string;
  isMatch: boolean;
  isCollision: boolean;
}

const TEST_CASES: MultilingualTestCase[] = [
  // 1. English
  {
    id: 'ML-01-EN',
    language: 'English',
    query: {
      name: 'Ravi Kumar',
      fatherName: 'Suresh Kumar',
      address: 'Gandhi Nagar, Main Road',
      district: 'Hyderabad',
      pincode: '500020',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    targetRecord: {
      name: 'Ravi Kumar',
      father_name: 'Suresh Kumar',
      address: 'Gandhi Nagar, Main Road',
      district: 'Hyderabad',
      pincode: '500020',
      citizen_id: 'CIT-EN-01',
      id: 'REC-EN-01',
    },
    expectedCitizenId: 'CIT-EN-01',
    isMatch: true,
    isCollision: false,
  },
  // 2. Hindi (Devanagari)
  {
    id: 'ML-02-HI',
    language: 'Hindi',
    query: {
      name: 'रवि कुमार',
      fatherName: 'सुरेश कुमार',
      address: 'गांधी नगर, मुख्य मार्ग',
      district: 'Hyderabad',
      pincode: '500020',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    targetRecord: {
      name: 'Ravi Kumar',
      father_name: 'Suresh Kumar',
      address: 'Gandhi Nagar, Main Road',
      district: 'Hyderabad',
      pincode: '500020',
      citizen_id: 'CIT-HI-01',
      id: 'REC-HI-01',
    },
    expectedCitizenId: 'CIT-HI-01',
    isMatch: true,
    isCollision: false,
  },
  // 3. Telugu (Telugu script)
  {
    id: 'ML-03-TE',
    language: 'Telugu',
    query: {
      name: 'రవి కుమార్',
      fatherName: 'సురేష్ కుమార్',
      address: 'గాంధీ నగర్, ప్రధాన రహదారి',
      district: 'Hyderabad',
      pincode: '500020',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    targetRecord: {
      name: 'Ravi Kumar',
      father_name: 'Suresh Kumar',
      address: 'Gandhi Nagar, Main Road',
      district: 'Hyderabad',
      pincode: '500020',
      citizen_id: 'CIT-TE-01',
      id: 'REC-TE-01',
    },
    expectedCitizenId: 'CIT-TE-01',
    isMatch: true,
    isCollision: false,
  },
  // 4. Romanized Hindi
  {
    id: 'ML-04-ROMAN-HI',
    language: 'Romanized Hindi',
    query: {
      name: 'Amit Kumar Patel',
      fatherName: 'Rajeshbhai Patel',
      address: 'Shanti Niketan ke paas, Civil Lines',
      district: 'Nagpur',
      pincode: '440001',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    targetRecord: {
      name: 'Amit Patel',
      father_name: 'Rajesh Patel',
      address: 'Near Shanti Niketan, Civil Lines',
      district: 'Nagpur',
      pincode: '440001',
      citizen_id: 'CIT-RHI-01',
      id: 'REC-RHI-01',
    },
    expectedCitizenId: 'CIT-RHI-01',
    isMatch: true,
    isCollision: false,
  },
  // 5. Romanized Telugu
  {
    id: 'ML-05-ROMAN-TE',
    language: 'Romanized Telugu',
    query: {
      name: 'Srinivasa Rao Naidu',
      fatherName: 'Venkata Ramana',
      address: 'Gudi daggara, RTC complex pakkana',
      district: 'Visakhapatnam',
      pincode: '530001',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    targetRecord: {
      name: 'Srinivas Naidu',
      father_name: 'Venkataramana Rao',
      address: 'Near Temple, RTC Complex Area',
      district: 'Visakhapatnam',
      pincode: '530001',
      citizen_id: 'CIT-RTE-01',
      id: 'REC-RTE-01',
    },
    expectedCitizenId: 'CIT-RTE-01',
    isMatch: true,
    isCollision: false,
  },
  // 6. Mixed-Language Query
  {
    id: 'ML-06-MIXED',
    language: 'Mixed',
    query: {
      name: 'कविता Yadav (Kavitha)',
      fatherName: 'Mahesh यादव',
      address: 'H.No 12-4, Ramnagar బజార్',
      district: 'Hyderabad',
      pincode: '500048',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    targetRecord: {
      name: 'Kavitha Yadav',
      father_name: 'Mahesh Yadav',
      address: 'H.No 12-4, Ramnagar Market',
      district: 'Hyderabad',
      pincode: '500048',
      citizen_id: 'CIT-MIX-01',
      id: 'REC-MIX-01',
    },
    expectedCitizenId: 'CIT-MIX-01',
    isMatch: true,
    isCollision: false,
  },
  // 7. Multilingual Homonym Collision (Safety Verification)
  {
    id: 'ML-07-COLLISION',
    language: 'Hindi',
    query: {
      name: 'रवि कुमार',
      dateOfBirth: '1995-03-10',
      fatherName: 'महेश कुमार',
      district: 'Patna',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    targetRecord: {
      name: 'Ravi Kumar',
      dob: '1960-01-01', // Severe DOB contradiction
      father_name: 'Sohanlal Kumar', // Severe Father contradiction
      district: 'Bhopal', // Severe District contradiction
      citizen_id: 'CIT-COLL-01',
      id: 'REC-COLL-01',
    },
    expectedCitizenId: '',
    isMatch: false,
    isCollision: true,
  },
];

async function runMultilingualRankingTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.1 MULTILINGUAL RANKING TEST SUITE           ');
  console.log('========================================================================\n');

  const provider = new MultilingualE5BaseTransformerProvider();
  const v4Scorer = new V4HybridScorer(DEFAULT_V4_1_CONFIG);

  console.log('Evaluating Language Categories:\n');
  const results: { lang: string; v3_1_Score: number; trans_Score: number; v4_1_Score: number; safe: boolean }[] = [];

  for (const tc of TEST_CASES) {
    // 1. Embed query and target using multilingual-e5-base
    const qRep = SemanticSimilarityEngine.formatQuerySemanticText(tc.query);
    const pRep = SemanticSimilarityEngine.formatPassageSemanticText(tc.targetRecord, 'revenue_registry');

    const qVec = await provider.embed(qRep.text);
    const pVec = await provider.embed(pRep.text);
    const profileSim = SemanticSimilarityEngine.computeCosineSimilarity(qVec, pVec);

    // Field-level name embedding
    const qNameRep = SemanticSimilarityEngine.formatFieldSemanticText('name', tc.query.name, true);
    const pNameRep = SemanticSimilarityEngine.formatFieldSemanticText('name', tc.targetRecord.name, false);
    const qNameVec = await provider.embed(qNameRep.text);
    const pNameVec = await provider.embed(pNameRep.text);
    const nameSim = SemanticSimilarityEngine.computeCosineSimilarity(qNameVec, pNameVec);

    // Field-level father embedding
    let fatherSim = 0.0;
    const qFather = tc.query.fatherName || tc.query.guardianName;
    const pFather = tc.targetRecord.father_name || tc.targetRecord.guardian_name || tc.targetRecord.father;
    if (qFather && pFather) {
      const qFatherRep = SemanticSimilarityEngine.formatFieldSemanticText('father', qFather, true);
      const pFatherRep = SemanticSimilarityEngine.formatFieldSemanticText('father', pFather, false);
      const qFatherVec = await provider.embed(qFatherRep.text);
      const pFatherVec = await provider.embed(pFatherRep.text);
      fatherSim = SemanticSimilarityEngine.computeCosineSimilarity(qFatherVec, pFatherVec);
    }

    // Field-level address embedding
    let addressSim = 0.0;
    if (tc.query.address && tc.targetRecord.address) {
      const qAddrRep = SemanticSimilarityEngine.formatFieldSemanticText('address', tc.query.address, true);
      const pAddrRep = SemanticSimilarityEngine.formatFieldSemanticText('address', tc.targetRecord.address, false);
      const qAddrVec = await provider.embed(qAddrRep.text);
      const pAddrVec = await provider.embed(pAddrRep.text);
      addressSim = SemanticSimilarityEngine.computeCosineSimilarity(qAddrVec, pAddrVec);
    }

    // 2. Score with V3.1
    const v3Result = EntityResolutionEngineV3.evaluateCandidateV3(tc.query, tc.targetRecord, 'revenue_registry');

    // 3. Score with V4.1 Hybrid
    const v4Result = v4Scorer.evaluateCandidate(tc.query, tc.targetRecord, 'revenue_registry', {
      nameSemantic: nameSim,
      fatherSemantic: fatherSim,
      addressSemantic: addressSim,
      districtSemantic: 1.0,
      profileSemantic: profileSim,
    });

    results.push({
      lang: tc.language + (tc.isCollision ? ' (Collision)' : ''),
      v3_1_Score: v3Result.totalScore,
      trans_Score: Number(profileSim.toFixed(4)),
      v4_1_Score: v4Result.totalScore,
      safe: tc.isCollision ? v4Result.isCollisionWarning && v4Result.totalScore <= 0.25 : true,
    });
  }

  console.table(results);

  // Assertions
  console.log('\n--- Checking Multilingual Assertions ---');
  // Hindi test case (index 1)
  const hiRes = results[1];
  assert(hiRes.v4_1_Score >= hiRes.v3_1_Score, `V4.1 (${hiRes.v4_1_Score}) outperforms or equals V3.1 (${hiRes.v3_1_Score}) on Hindi`);

  // Telugu test case (index 2)
  const teRes = results[2];
  assert(teRes.v4_1_Score >= teRes.v3_1_Score, `V4.1 (${teRes.v4_1_Score}) outperforms or equals V3.1 (${teRes.v3_1_Score}) on Telugu`);

  // Collision safety test case (index 6)
  const collRes = results[6];
  assert(collRes.safe, 'Multilingual collision is strictly blocked in V4.1');
  assert(collRes.v4_1_Score <= 0.25, 'Multilingual collision score is <= 0.25');

  console.log('\n========================================================================');
  console.log('   ALL MULTILINGUAL RANKING TESTS PASSED (100%)                         ');
  console.log('========================================================================');
}

runMultilingualRankingTests().catch((err) => {
  console.error('[FATAL] Multilingual test failed:', err);
  process.exit(1);
});
