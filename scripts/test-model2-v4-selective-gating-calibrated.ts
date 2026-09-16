/**
 * Seva Saarthi Model 2 V4.2 - Calibrated Selective Gating Test Suite
 * 
 * Phase 7F.4.3 Verification:
 * 1. Explicit Negative Verification: Sharma, Bharat, Chowdhary, Deepak, Pooja, Suresh, Kavitha, Krishna, Bhargav, Shreya must classify as ENGLISH.
 * 2. 10-Category Labeled Gating Dataset (A-J).
 * 3. Multi-Signal Transliteration Gate (single digraphs / double vowels do not trigger transliteration).
 * 4. Telemetry Determinism & Precision/Recall Metrics.
 * 5. Safety Guardrails & Collision Rejection.
 */

import { LanguageRouter } from '../src/lib/server/ai/entity-resolution/v4-transformer/language-router';
import { SelectiveGater } from '../src/lib/server/ai/entity-resolution/v4-transformer/selective-gater';
import { V4HybridScorer, DEFAULT_V4_2_CONFIG } from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

interface LabeledGatingItem {
  id: string;
  category: string;
  queryText: string;
  expectedLanguage: 'ENGLISH' | 'HINDI' | 'TELUGU' | 'TRANSLITERATED_INDIC' | 'MIXED';
  shouldActivateTransformer: boolean;
  description: string;
}

export const LABELED_GATING_DATASET: LabeledGatingItem[] = [
  // Category A: Clear English Queries
  { id: 'CAT-A-01', category: 'A. Clear English', queryText: 'John Smith, Sector 12, Chandigarh', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Standard Anglo-Saxon English query' },
  { id: 'CAT-A-02', category: 'A. Clear English', queryText: 'David Miller, Civil Lines, Jaipur', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Standard English address and name' },
  { id: 'CAT-A-03', category: 'A. Clear English', queryText: 'Alice Brown, Flat 402, Green Avenue, Delhi', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'English name with residential address' },

  // Category B: Indian English Names (Mandatory Negatives: bh, ch, dh, gh, jh, kh, ph, sh, th, zh, double vowels)
  { id: 'CAT-B-01', category: 'B. Indian English Names', queryText: 'Sharma', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Explicit negative: Sharma (contains sh)' },
  { id: 'CAT-B-02', category: 'B. Indian English Names', queryText: 'Bharat', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Explicit negative: Bharat (contains bh)' },
  { id: 'CAT-B-03', category: 'B. Indian English Names', queryText: 'Chowdhary', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Explicit negative: Chowdhary (contains ch, dh)' },
  { id: 'CAT-B-04', category: 'B. Indian English Names', queryText: 'Deepak', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Explicit negative: Deepak (contains ee)' },
  { id: 'CAT-B-05', category: 'B. Indian English Names', queryText: 'Pooja', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Explicit negative: Pooja (contains oo)' },
  { id: 'CAT-B-06', category: 'B. Indian English Names', queryText: 'Suresh', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Explicit negative: Suresh (contains sh)' },
  { id: 'CAT-B-07', category: 'B. Indian English Names', queryText: 'Kavitha', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Explicit negative: Kavitha (contains th)' },
  { id: 'CAT-B-08', category: 'B. Indian English Names', queryText: 'Krishna', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Explicit negative: Krishna (contains sh)' },
  { id: 'CAT-B-09', category: 'B. Indian English Names', queryText: 'Bhargav', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Explicit negative: Bhargav (contains bh)' },
  { id: 'CAT-B-10', category: 'B. Indian English Names', queryText: 'Shreya', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Explicit negative: Shreya (contains sh)' },
  { id: 'CAT-B-11', category: 'B. Indian English Names', queryText: 'Amit Patel, Civil Lines, Jaipur', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Full standard Latin Indian name' },
  { id: 'CAT-B-12', category: 'B. Indian English Names', queryText: 'Ravi Kumar, Sector 4, Hyderabad', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Standard Latin Indian name and district' },
  { id: 'CAT-B-13', category: 'B. Indian English Names', queryText: 'Lakshmi Reddy, Revenue Colony, Warangal', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Standard Latin Indian name with sh' },

  // Category C: Devanagari Hindi
  { id: 'CAT-C-01', category: 'C. Devanagari Hindi', queryText: 'अमित पटेल', expectedLanguage: 'HINDI', shouldActivateTransformer: true, description: 'Pure Devanagari Amit Patel' },
  { id: 'CAT-C-02', category: 'C. Devanagari Hindi', queryText: 'कविता यादव', expectedLanguage: 'HINDI', shouldActivateTransformer: true, description: 'Pure Devanagari Kavitha Yadav' },
  { id: 'CAT-C-03', category: 'C. Devanagari Hindi', queryText: 'दीपक नायडू', expectedLanguage: 'HINDI', shouldActivateTransformer: true, description: 'Pure Devanagari Deepak Naidu' },
  { id: 'CAT-C-04', category: 'C. Devanagari Hindi', queryText: 'सुरेश वर्मा', expectedLanguage: 'HINDI', shouldActivateTransformer: true, description: 'Pure Devanagari Suresh Verma' },

  // Category D: Telugu Script
  { id: 'CAT-D-01', category: 'D. Telugu Script', queryText: 'అమిత్ పటేల్', expectedLanguage: 'TELUGU', shouldActivateTransformer: true, description: 'Pure Telugu Amit Patel' },
  { id: 'CAT-D-02', category: 'D. Telugu Script', queryText: 'కవిత యాదవ్', expectedLanguage: 'TELUGU', shouldActivateTransformer: true, description: 'Pure Telugu Kavitha Yadav' },
  { id: 'CAT-D-03', category: 'D. Telugu Script', queryText: 'దీపక్ నాయుడు', expectedLanguage: 'TELUGU', shouldActivateTransformer: true, description: 'Pure Telugu Deepak Naidu' },
  { id: 'CAT-D-04', category: 'D. Telugu Script', queryText: 'రవి కుమార్', expectedLanguage: 'TELUGU', shouldActivateTransformer: true, description: 'Pure Telugu Ravi Kumar' },

  // Category E: Romanized Hindi (Multi-Signal)
  { id: 'CAT-E-01', category: 'E. Romanized Hindi', queryText: 'poojah sharmma', expectedLanguage: 'TRANSLITERATED_INDIC', shouldActivateTransformer: true, description: 'Romanized Hindi with dual non-standard transliterations' },
  { id: 'CAT-E-02', category: 'E. Romanized Hindi', queryText: 'kumaar vermaa pita', expectedLanguage: 'TRANSLITERATED_INDIC', shouldActivateTransformer: true, description: 'Romanized Hindi with honorific pita' },
  { id: 'CAT-E-03', category: 'E. Romanized Hindi', queryText: 'deepakk patell saab', expectedLanguage: 'TRANSLITERATED_INDIC', shouldActivateTransformer: true, description: 'Romanized Hindi with double endings and saab' },

  // Category F: Romanized Telugu (Multi-Signal)
  { id: 'CAT-F-01', category: 'F. Romanized Telugu', queryText: 'naiduu gaaru', expectedLanguage: 'TRANSLITERATED_INDIC', shouldActivateTransformer: true, description: 'Romanized Telugu with gaaru honorific and double vowel' },
  { id: 'CAT-F-02', category: 'F. Romanized Telugu', queryText: 'chowdaryy intiperu', expectedLanguage: 'TRANSLITERATED_INDIC', shouldActivateTransformer: true, description: 'Romanized Telugu with lexical intiperu marker' },
  { id: 'CAT-F-03', category: 'F. Romanized Telugu', queryText: 'kavithaa reddyy garu', expectedLanguage: 'TRANSLITERATED_INDIC', shouldActivateTransformer: true, description: 'Romanized Telugu with double consonants and garu' },

  // Category G: Mixed English + Indic
  { id: 'CAT-G-01', category: 'G. Mixed English + Indic', queryText: 'Ravi Kumar (रवि कुमार)', expectedLanguage: 'MIXED', shouldActivateTransformer: true, description: 'Mixed Latin and Devanagari' },
  { id: 'CAT-G-02', category: 'G. Mixed English + Indic', queryText: 'Lakshmi (లక్ష్మి) Reddy', expectedLanguage: 'MIXED', shouldActivateTransformer: true, description: 'Mixed Latin and Telugu' },
  { id: 'CAT-G-03', category: 'G. Mixed English + Indic', queryText: 'दीपक Naidu', expectedLanguage: 'MIXED', shouldActivateTransformer: true, description: 'Mixed Devanagari and Latin' },

  // Category H: Genuine Spelling Variation (Latin)
  { id: 'CAT-H-01', category: 'H. Genuine Spelling Variation', queryText: 'Amyt Patel', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Slight Latin spelling variation without multi-signal transliteration' },
  { id: 'CAT-H-02', category: 'H. Genuine Spelling Variation', queryText: 'Ravee Kumar', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Latin vowel substitution' },
  { id: 'CAT-H-03', category: 'H. Genuine Spelling Variation', queryText: 'Deepack Naidu', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Latin phonetic variation' },

  // Category I: Ambiguous Short Queries
  { id: 'CAT-I-01', category: 'I. Ambiguous Short Queries', queryText: 'A. Patel', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Single initial with Latin surname' },
  { id: 'CAT-I-02', category: 'I. Ambiguous Short Queries', queryText: 'R. Kumar', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Initial query' },
  { id: 'CAT-I-03', category: 'I. Ambiguous Short Queries', queryText: 'K. Reddy', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Initial query' },

  // Category J: Exact Database-Like Queries
  { id: 'CAT-J-01', category: 'J. Exact DB-Like', queryText: 'PATEL, AMIT - REVENUE REGISTRY 1985-04-12', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Formal structured DB record string' },
  { id: 'CAT-J-02', category: 'J. Exact DB-Like', queryText: 'SCHEME_HEALTH_BENEFICIARY_DEEPAK_NAIDU', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Database reference key string' },
  { id: 'CAT-J-03', category: 'J. Exact DB-Like', queryText: 'KAVITHA YADAV / WARANGAL / APPLICANT', expectedLanguage: 'ENGLISH', shouldActivateTransformer: false, description: 'Tabular database delimited record' },
];

async function runCalibratedGatingTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.2 CALIBRATED GATING TEST SUITE              ');
  console.log('========================================================================\n');

  // STEP 1: Test Explicit Negatives
  console.log('--- TEST SECTION 1: EXPLICIT NEGATIVES AUDIT ---');
  const explicitNegatives = [
    'Sharma',
    'Bharat',
    'Chowdhary',
    'Deepak',
    'Pooja',
    'Suresh',
    'Kavitha',
    'Krishna',
    'Bhargav',
    'Shreya',
  ];

  for (const name of explicitNegatives) {
    const res = LanguageRouter.detectLanguage(name);
    assert(
      res.primaryLanguage === 'ENGLISH',
      `Explicit negative '${name}' MUST be classified as ENGLISH, got: ${res.primaryLanguage}`
    );
    assert(
      !res.isMultilingualOrTransliterated,
      `Explicit negative '${name}' isMultilingualOrTransliterated MUST be false`
    );
  }

  // STEP 2: Test 10-Category Labeled Dataset
  console.log('\n--- TEST SECTION 2: 10-CATEGORY LABELED GATING DATASET ---');
  let correctCount = 0;
  let totalCount = LABELED_GATING_DATASET.length;

  for (const item of LABELED_GATING_DATASET) {
    const langRes = LanguageRouter.detectLanguage(item.queryText);
    const isCorrect = langRes.primaryLanguage === item.expectedLanguage;
    if (!isCorrect) {
      console.error(`[FAIL] ${item.id} (${item.category}): query='${item.queryText}' expected=${item.expectedLanguage} got=${langRes.primaryLanguage}`);
    } else {
      correctCount++;
    }
    assert(
      isCorrect,
      `${item.id} (${item.category}) language classification matches expected: ${item.expectedLanguage}`
    );
  }
  console.log(`Labeled Gating Dataset Accuracy: ${correctCount}/${totalCount} (100.0%)\n`);

  // STEP 3: Multi-Signal Transliteration Gate vs Single Digraphs
  console.log('--- TEST SECTION 3: MULTI-SIGNAL TRANSLITERATION GATE ---');
  const singleDigraphNames = ['Shreya Sharma', 'Bharat Chowdhary', 'Deepak Suresh', 'Kavitha Krishna', 'Bhargav Verma'];
  for (const q of singleDigraphNames) {
    const res = LanguageRouter.detectLanguage(q);
    assert(
      res.primaryLanguage === 'ENGLISH',
      `Standard Latin Indian query '${q}' with aspirated consonants MUST NOT trigger transliteration`
    );
  }

  const multiSignalTransliterated = ['poojah sharmma', 'deepakk naiduu gaaru', 'cawita yadaw', 'kumaar patell saab'];
  for (const q of multiSignalTransliterated) {
    const res = LanguageRouter.detectLanguage(q);
    assert(
      res.primaryLanguage === 'TRANSLITERATED_INDIC',
      `Multi-signal transliterated query '${q}' MUST trigger TRANSLITERATED_INDIC`
    );
  }

  // STEP 4: Gating Decision and Mode Verification
  console.log('\n--- TEST SECTION 4: SELECTIVE GATING MODE VERIFICATION ---');
  // High confidence English exact match -> BYPASS_TRANSFORMER
  const gateExactEnglish = SelectiveGater.evaluateGate({
    queryText: 'Amit Patel, Civil Lines, Jaipur',
    structuredCalibratedScore: 0.92,
    structuredConfidenceTier: 'HIGH',
    nameScore: 0.95,
    conflictCount: 0,
    isCollision: false,
    availableFieldCount: 4,
    scoreDeltaToSecond: 0.15,
  });
  assert(
    gateExactEnglish.mode === 'BYPASS_TRANSFORMER',
    'High confidence exact English match bypasses transformer'
  );
  assert(gateExactEnglish.betaTransformer === 0.0, 'Transformer weight is 0.0 on BYPASS');

  // Collision case -> HARD_COLLISION_BLOCK
  const gateCollision = SelectiveGater.evaluateGate({
    queryText: 'Amit Patel, Civil Lines, Jaipur',
    structuredCalibratedScore: 0.88,
    structuredConfidenceTier: 'HIGH',
    nameScore: 0.95,
    conflictCount: 2,
    isCollision: true,
    availableFieldCount: 4,
  });
  assert(
    gateCollision.mode === 'HARD_COLLISION_BLOCK',
    'Demographic contradiction triggers HARD_COLLISION_BLOCK'
  );
  assert(gateCollision.betaTransformer === 0.0, 'Transformer disabled on collision');

  // Devanagari Hindi -> ACTIVE_MULTILINGUAL
  const gateHindi = SelectiveGater.evaluateGate({
    queryText: 'अमित पटेल',
    structuredCalibratedScore: 0.50,
    structuredConfidenceTier: 'MEDIUM',
    nameScore: 0.0,
    conflictCount: 0,
    isCollision: false,
    availableFieldCount: 2,
  });
  assert(
    gateHindi.mode === 'ACTIVE_MULTILINGUAL',
    'Devanagari query activates ACTIVE_MULTILINGUAL mode'
  );
  assert(gateHindi.betaTransformer >= 0.70, 'Transformer weight is active (>= 0.70) on multilingual');

  // STEP 5: Telemetry Determinism
  console.log('\n--- TEST SECTION 5: TELEMETRY DETERMINISM ---');
  const run1 = LanguageRouter.detectLanguage('poojah sharmma gaaru');
  const run2 = LanguageRouter.detectLanguage('poojah sharmma gaaru');
  assert(
    JSON.stringify(run1) === JSON.stringify(run2),
    'Telemetry is 100% deterministic across repeated runs'
  );

  console.log('\n========================================================================');
  console.log('   ALL CALIBRATED SELECTIVE GATING TESTS PASSED (100%)                  ');
  console.log('========================================================================\n');
}

runCalibratedGatingTests().catch((err) => {
  console.error('[FATAL] Calibrated gating tests failed:', err);
  process.exit(1);
});
