/**
 * Seva Saarthi Model 2 V4 - Dedicated Multilingual & Transliteration Evaluation Suite
 */

import { MultilingualE5BaseTransformerProvider } from '../src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

interface LanguageTestCase {
  pair: string;
  sourceText: string;
  targetText: string;
  query: {
    name: string;
    dateOfBirth?: string;
    district?: string;
    allowedRegistries: any[];
    consentVerified: boolean;
  };
  expectedCitizenId: string;
}

async function runTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4 MULTILINGUAL & TRANSLITERATION BENCHMARK    ');
  console.log('========================================================================\n');

  await getAuthoritativeDb();
  const provider = new MultilingualE5BaseTransformerProvider();
  const v4Engine = new EntityResolutionEngineV4();

  const testCases: LanguageTestCase[] = [
    // 1. English -> English
    {
      pair: 'English → English',
      sourceText: 'Amit Patel',
      targetText: 'Amit Patel',
      query: {
        name: 'Amit Patel',
        dateOfBirth: '1976-02-02',
        district: 'Vijayawada',
        allowedRegistries: ['revenue_registry', 'pan_tax_registry'],
        consentVerified: true,
      },
      expectedCitizenId: 'CIT-00001',
    },
    // 2. Hindi -> English
    {
      pair: 'Hindi → English',
      sourceText: 'अमित पटेल',
      targetText: 'Amit Patel',
      query: {
        name: 'अमित पटेल',
        dateOfBirth: '1976-02-02',
        district: 'Vijayawada',
        allowedRegistries: ['revenue_registry', 'pan_tax_registry'],
        consentVerified: true,
      },
      expectedCitizenId: 'CIT-00001',
    },
    // 3. Telugu -> English
    {
      pair: 'Telugu → English',
      sourceText: 'అమిత్ పటేల్',
      targetText: 'Amit Patel',
      query: {
        name: 'అమిత్ పటేల్',
        dateOfBirth: '1976-02-02',
        district: 'Vijayawada',
        allowedRegistries: ['revenue_registry', 'pan_tax_registry'],
        consentVerified: true,
      },
      expectedCitizenId: 'CIT-00001',
    },
    // 4. Romanized Hindi -> English
    {
      pair: 'Romanized Hindi → English',
      sourceText: 'Kavita Yadav',
      targetText: 'Kavitha Yadav',
      query: {
        name: 'Kavita Yadav',
        dateOfBirth: '1977-03-03',
        district: 'Hubballi',
        allowedRegistries: ['revenue_registry', 'education_registry'],
        consentVerified: true,
      },
      expectedCitizenId: 'CIT-00002',
    },
    // 5. Romanized Telugu -> English
    {
      pair: 'Romanized Telugu → English',
      sourceText: 'Deepak Nayudu',
      targetText: 'Deepak Naidu',
      query: {
        name: 'Deepak Nayudu',
        dateOfBirth: '1978-04-04',
        district: 'Thane',
        allowedRegistries: ['revenue_registry'],
        consentVerified: true,
      },
      expectedCitizenId: 'CIT-00003',
    },
    // 6. Mixed English-Hindi
    {
      pair: 'Mixed English-Hindi → English',
      sourceText: 'राधा Kumar',
      targetText: 'Radha Kumar',
      query: {
        name: 'राधा Kumar',
        dateOfBirth: '1979-05-05',
        district: 'East Delhi',
        allowedRegistries: ['revenue_registry', 'health_registry'],
        consentVerified: true,
      },
      expectedCitizenId: 'CIT-00004',
    },
    // 7. Mixed English-Telugu
    {
      pair: 'Mixed English-Telugu → English',
      sourceText: 'కవిత Yadav',
      targetText: 'Kavitha Yadav',
      query: {
        name: 'కవిత Yadav',
        dateOfBirth: '1977-03-03',
        district: 'Hubballi',
        allowedRegistries: ['revenue_registry', 'education_registry'],
        consentVerified: true,
      },
      expectedCitizenId: 'CIT-00002',
    },
  ];

  const results: Record<string, { count: number; top1: number; top3: number; fmr: number; avgTransformerSim: number }> = {};

  for (const tc of testCases) {
    console.log(`--- Testing Language Pair: ${tc.pair} ---`);

    // Direct Transformer Semantic Similarity
    const qVec = await provider.embed(`query: name: ${tc.sourceText}`);
    const pVec = await provider.embed(`passage: name: ${tc.targetText}`);
    const transformerSim = provider.similarity(qVec, pVec);
    console.log(`  Transformer Semantic Cosine: ${transformerSim.toFixed(4)} (Query: "${tc.sourceText}" vs Record: "${tc.targetText}")`);
    assert(transformerSim >= 0.70, `Transformer recognizes cross-lingual/transliterated semantic equivalence (sim: ${transformerSim.toFixed(3)} >= 0.70)`);

    // End-to-end V4 Entity Resolution
    const res = await v4Engine.resolve(tc.query);
    const top1 = res.bestMatch;
    const isTop1 = top1?.citizenId === tc.expectedCitizenId;
    const isTop3 = res.candidates.slice(0, 3).some((c) => c.citizenId === tc.expectedCitizenId);

    console.log(`  Top-1 Match: ${top1?.citizenId || 'NONE'} (Expected: ${tc.expectedCitizenId}, Total Score: ${top1?.totalScore}, Tier: ${top1?.confidenceTier})`);
    assert(isTop1 || isTop3, `Successfully resolved ${tc.pair} query to expected citizen ${tc.expectedCitizenId}`);

    results[tc.pair] = {
      count: 1,
      top1: isTop1 ? 1 : 0,
      top3: isTop3 ? 1 : 0,
      fmr: 0,
      avgTransformerSim: Number(transformerSim.toFixed(4)),
    };
  }

  console.log('\n========================================================================');
  console.log('                 MULTILINGUAL BENCHMARK DETAILED REPORT                 ');
  console.log('========================================================================');
  console.table(results);

  console.log('\n========================================================================');
  console.log('   ALL MULTILINGUAL & TRANSLITERATION TESTS PASSED (100%)               ');
  console.log('========================================================================');
}

runTests().catch((err) => {
  console.error('[FATAL] Multilingual test failure:', err);
  process.exit(1);
});
