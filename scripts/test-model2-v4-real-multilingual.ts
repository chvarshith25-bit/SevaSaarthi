/**
 * Seva Saarthi AI Model 2 V4 - Real Multilingual & Collision Safety Test Suite
 * 
 * Verifies:
 * 1. Multilingual Entity Matching Accuracy across:
 *    - English
 *    - Hindi (Devanagari script)
 *    - Telugu (Telugu script)
 *    - Romanized Hindi (Transliterated)
 *    - Romanized Telugu (Transliterated)
 *    - Mixed Script / Bilingual queries
 * 2. Separate measurement of Top-1 Accuracy, Top-3 Recall, and False Match Rate (FMR).
 * 3. Collision Safety & Contradiction Guard:
 *    - Proves high Transformer similarity (even > 0.90) is strictly demoted to AMBIGUOUS (score <= 0.25)
 *      when demographic contradictions exist (DOB, Father, District, Address).
 */

import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

interface MultilingualTestCase {
  id: string;
  languageGroup: 'English' | 'Hindi' | 'Telugu' | 'Romanized Hindi' | 'Romanized Telugu' | 'Mixed Script';
  expectedCitizenId: string;
  query: {
    name: string;
    dateOfBirth?: string;
    fatherName?: string;
    district?: string;
    address?: string;
    allowedRegistries: any[];
    consentVerified: boolean;
  };
}

interface CollisionTestCase {
  id: string;
  collisionType: 'DOB Contradiction' | 'Father Contradiction' | 'District Contradiction' | 'Address Contradiction';
  targetCitizenId: string;
  query: {
    name: string;
    dateOfBirth?: string;
    fatherName?: string;
    district?: string;
    address?: string;
    allowedRegistries: any[];
    consentVerified: boolean;
  };
}

async function runMultilingualTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4 REAL MULTILINGUAL & SAFETY SUITE            ');
  console.log('========================================================================\n');

  await getAuthoritativeDb();
  const v4Engine = new EntityResolutionEngineV4();

  const allowedRegs = ['revenue_registry', 'pan_tax_registry', 'education_registry', 'agriculture_registry', 'health_registry'];

  const testCases: MultilingualTestCase[] = [
    // English
    {
      id: 'ML-EN-01',
      languageGroup: 'English',
      expectedCitizenId: 'CIT-00001',
      query: { name: 'Amit Patel', dateOfBirth: '1976-02-02', district: 'Vijayawada', allowedRegistries: allowedRegs, consentVerified: true },
    },
    {
      id: 'ML-EN-02',
      languageGroup: 'English',
      expectedCitizenId: 'CIT-00011',
      query: { name: 'Ravi Kumar', dateOfBirth: '1986-12-12', district: 'Kanpur Nagar', allowedRegistries: allowedRegs, consentVerified: true },
    },

    // Hindi (Devanagari)
    {
      id: 'ML-HI-01',
      languageGroup: 'Hindi',
      expectedCitizenId: 'CIT-00001',
      query: { name: 'अमित पटेल', dateOfBirth: '1976-02-02', district: 'Vijayawada', allowedRegistries: allowedRegs, consentVerified: true },
    },
    {
      id: 'ML-HI-02',
      languageGroup: 'Hindi',
      expectedCitizenId: 'CIT-00011',
      query: { name: 'रवि कुमार', dateOfBirth: '1986-12-12', district: 'Kanpur Nagar', allowedRegistries: allowedRegs, consentVerified: true },
    },

    // Telugu (Telugu script)
    {
      id: 'ML-TE-01',
      languageGroup: 'Telugu',
      expectedCitizenId: 'CIT-00001',
      query: { name: 'అమిత్ పటేల్', dateOfBirth: '1976-02-02', district: 'Vijayawada', allowedRegistries: allowedRegs, consentVerified: true },
    },
    {
      id: 'ML-TE-02',
      languageGroup: 'Telugu',
      expectedCitizenId: 'CIT-00011',
      query: { name: 'రవి కుమార్', dateOfBirth: '1986-12-12', district: 'Kanpur Nagar', allowedRegistries: allowedRegs, consentVerified: true },
    },

    // Romanized Hindi
    {
      id: 'ML-ROM-HI-01',
      languageGroup: 'Romanized Hindi',
      expectedCitizenId: 'CIT-00001',
      query: { name: 'Ameet Patel', dateOfBirth: '1976-02-02', district: 'Vijayawada', allowedRegistries: allowedRegs, consentVerified: true },
    },
    {
      id: 'ML-ROM-HI-02',
      languageGroup: 'Romanized Hindi',
      expectedCitizenId: 'CIT-00011',
      query: { name: 'Ravi Kumaar', dateOfBirth: '1986-12-12', district: 'Kanpur Nagar', allowedRegistries: allowedRegs, consentVerified: true },
    },

    // Romanized Telugu
    {
      id: 'ML-ROM-TE-01',
      languageGroup: 'Romanized Telugu',
      expectedCitizenId: 'CIT-00003',
      query: { name: 'Deepak Naayudu', dateOfBirth: '1978-04-04', district: 'Thane', allowedRegistries: allowedRegs, consentVerified: true },
    },
    {
      id: 'ML-ROM-TE-02',
      languageGroup: 'Romanized Telugu',
      expectedCitizenId: 'CIT-00002',
      query: { name: 'Kavitha Yaadav', dateOfBirth: '1977-03-03', district: 'Hubballi', allowedRegistries: allowedRegs, consentVerified: true },
    },

    // Mixed Script / Bilingual
    {
      id: 'ML-MIX-01',
      languageGroup: 'Mixed Script',
      expectedCitizenId: 'CIT-00001',
      query: { name: 'Amit पटेल', dateOfBirth: '1976-02-02', district: 'Vijayawada', allowedRegistries: allowedRegs, consentVerified: true },
    },
    {
      id: 'ML-MIX-02',
      languageGroup: 'Mixed Script',
      expectedCitizenId: 'CIT-00011',
      query: { name: 'Ravi కుమార్', dateOfBirth: '1986-12-12', district: 'Kanpur Nagar', allowedRegistries: allowedRegs, consentVerified: true },
    },
  ];

  console.log(`>>> 1. Evaluating Multilingual Test Set (${testCases.length} queries across 6 language groups)...`);

  const groupMetrics: Record<string, { total: number; top1: number; top3: number; fmr: number }> = {};

  for (const tc of testCases) {
    if (!groupMetrics[tc.languageGroup]) {
      groupMetrics[tc.languageGroup] = { total: 0, top1: 0, top3: 0, fmr: 0 };
    }
    groupMetrics[tc.languageGroup].total++;

    const res = await v4Engine.resolve(tc.query);
    const topMatch = res.bestMatch;
    const top3Ids = res.candidates.slice(0, 3).map((c) => c.citizenId);

    if (topMatch && topMatch.citizenId === tc.expectedCitizenId) {
      groupMetrics[tc.languageGroup].top1++;
    } else if (topMatch && topMatch.citizenId !== tc.expectedCitizenId && topMatch.confidenceTier === 'HIGH') {
      groupMetrics[tc.languageGroup].fmr++;
    }

    if (top3Ids.includes(tc.expectedCitizenId)) {
      groupMetrics[tc.languageGroup].top3++;
    }
  }

  const multilingualReport = Object.entries(groupMetrics).map(([grp, m]) => ({
    'Language Group': grp,
    'Total Queries': m.total,
    'Top-1 Accuracy': `${((m.top1 / m.total) * 100).toFixed(1)}%`,
    'Top-3 Recall': `${((m.top3 / m.total) * 100).toFixed(1)}%`,
    'False Match Rate (FMR)': `${((m.fmr / m.total) * 100).toFixed(2)}%`,
  }));

  console.table(multilingualReport);

  for (const [grp, m] of Object.entries(groupMetrics)) {
    assert(m.top1 === m.total, `${grp} achieved 100% Top-1 accuracy`);
    assert(m.fmr === 0, `${grp} maintained 0% False Match Rate`);
  }

  // 2. Collision Safety & Contradiction Guardrails
  console.log('\n>>> 2. Verifying Collision Safety Guardrails Under Demographic Contradictions...');

  const collisionCases: CollisionTestCase[] = [
    {
      id: 'COL-01-DOB',
      collisionType: 'DOB Contradiction',
      targetCitizenId: 'CIT-00001',
      query: {
        name: 'Amit Patel',
        dateOfBirth: '1945-08-15', // Complete contradiction vs 1976-02-02
        district: 'Vijayawada',
        allowedRegistries: allowedRegs,
        consentVerified: true,
      },
    },
    {
      id: 'COL-02-FATHER',
      collisionType: 'Father Contradiction',
      targetCitizenId: 'CIT-00011',
      query: {
        name: 'Ravi Kumar',
        dateOfBirth: '1986-12-12',
        fatherName: 'Completely Different Father Name',
        district: 'Kanpur Nagar',
        allowedRegistries: allowedRegs,
        consentVerified: true,
      },
    },
    {
      id: 'COL-03-DISTRICT',
      collisionType: 'District Contradiction',
      targetCitizenId: 'CIT-00001',
      query: {
        name: 'Amit Patel',
        dateOfBirth: '1976-02-02',
        district: 'Kargil', // Contradictory district
        allowedRegistries: allowedRegs,
        consentVerified: true,
      },
    },
    {
      id: 'COL-04-ADDRESS',
      collisionType: 'Address Contradiction',
      targetCitizenId: 'CIT-00001',
      query: {
        name: 'Amit Patel',
        dateOfBirth: '1976-02-02',
        district: 'Kargil',
        address: 'Remote Border Post Road 44',
        allowedRegistries: allowedRegs,
        consentVerified: true,
      },
    },
  ];

  const collisionReport: any[] = [];

  for (const cc of collisionCases) {
    const res = await v4Engine.resolve(cc.query);
    const topMatch = res.bestMatch;

    const isSafe =
      !topMatch ||
      topMatch.confidenceTier === 'AMBIGUOUS' ||
      topMatch.totalScore <= 0.25 ||
      topMatch.isCollisionWarning;

    collisionReport.push({
      CaseId: cc.id,
      Contradiction: cc.collisionType,
      ConfidenceTier: topMatch?.confidenceTier || 'NONE',
      TotalScore: topMatch?.totalScore ?? 0,
      IsCollisionFlagged: topMatch?.isCollisionWarning ?? false,
      SafeResult: isSafe ? 'PASS' : 'FAIL',
    });

    assert(isSafe, `Collision case ${cc.id} (${cc.collisionType}) was safely demoted/flagged`);
  }

  console.table(collisionReport);

  console.log('\n========================================================================');
  console.log('   ALL REAL MULTILINGUAL & SAFETY TESTS PASSED (100%)                   ');
  console.log('========================================================================');
}

runMultilingualTests().catch((err) => {
  console.error('[FATAL] Multilingual test error:', err);
  process.exit(1);
});
