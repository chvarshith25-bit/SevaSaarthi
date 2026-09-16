/**
 * Seva Saarthi AI Model 2 V4.2 - Step 9 Language Router Diagnostic Suite
 * 
 * Measures:
 * 1. English exact-match queries -> routing distribution
 * 2. English Indian names -> routing distribution
 * 3. Devanagari queries -> routing distribution
 * 4. Telugu queries -> routing distribution
 * 5. Romanized Indic queries -> routing distribution
 * 6. Transformer activation rate by language in V4.2
 * 7. Positive & Negative test cases for regex patterns (bh/ch/dh/gh/jh/kh/ph/sh/th, repeated vowels)
 */

import { LanguageRouter } from '../src/lib/server/ai/entity-resolution/v4-transformer/language-router';
import { SelectiveGater } from '../src/lib/server/ai/entity-resolution/v4-transformer/selective-gater';
import { generateCleanSeed20202Benchmark } from './benchmark-model2-v4-seed20202';

export async function runLanguageRouterDiagnostic() {
  console.log('========================================================================');
  console.log('   STEP 9: LANGUAGE ROUTER & GATING TELEMETRY DIAGNOSTIC               ');
  console.log('========================================================================\n');

  const benchmarkQueries = await generateCleanSeed20202Benchmark();

  const distributions: Record<string, Record<string, number>> = {
    'English Exact Match': { ENGLISH: 0, TRANSLITERATED_INDIC: 0, HINDI: 0, TELUGU: 0, MIXED: 0 },
    'English Indian Names': { ENGLISH: 0, TRANSLITERATED_INDIC: 0, HINDI: 0, TELUGU: 0, MIXED: 0 },
    'Devanagari': { ENGLISH: 0, TRANSLITERATED_INDIC: 0, HINDI: 0, TELUGU: 0, MIXED: 0 },
    'Telugu': { ENGLISH: 0, TRANSLITERATED_INDIC: 0, HINDI: 0, TELUGU: 0, MIXED: 0 },
    'Romanized Indic': { ENGLISH: 0, TRANSLITERATED_INDIC: 0, HINDI: 0, TELUGU: 0, MIXED: 0 },
  };

  let englishCount = 0;
  let hindiCount = 0;
  let teluguCount = 0;
  let romanizedCount = 0;

  let v4_2_activations = {
    english: 0,
    hindi: 0,
    telugu: 0,
    transliterated: 0,
  };

  for (const q of benchmarkQueries) {
    const langRes = LanguageRouter.detectLanguage(q.query.name);
    const targetGroup = q.category === 'EXACT_MATCH'
      ? 'English Exact Match'
      : (q.language === 'hi'
        ? 'Devanagari'
        : (q.language === 'te'
          ? 'Telugu'
          : (q.language === 'transliterated_indic'
            ? 'Romanized Indic'
            : 'English Indian Names')));

    distributions[targetGroup][langRes.primaryLanguage] = (distributions[targetGroup][langRes.primaryLanguage] || 0) + 1;

    // Evaluate V4.2 selective gating decision on simulated structured score
    const gateDecision = SelectiveGater.evaluateGate({
      queryText: q.query.name,
      structuredCalibratedScore: q.isMatch ? 0.88 : 0.20,
      structuredConfidenceTier: q.isMatch ? 'HIGH' : 'LOW',
      nameScore: q.isMatch ? 0.95 : 0.20,
      conflictCount: 0,
      isCollision: false,
      availableFieldCount: 4,
    });

    const isActivated = gateDecision.mode !== 'BYPASS_TRANSFORMER';

    if (q.language === 'en') {
      englishCount++;
      if (isActivated) v4_2_activations.english++;
    } else if (q.language === 'hi') {
      hindiCount++;
      if (isActivated) v4_2_activations.hindi++;
    } else if (q.language === 'te') {
      teluguCount++;
      if (isActivated) v4_2_activations.telugu++;
    } else if (q.language === 'transliterated_indic') {
      romanizedCount++;
      if (isActivated) v4_2_activations.transliterated++;
    }
  }

  console.log('--- 1. ROUTING DISTRIBUTIONS BY QUERY TYPE ---');
  console.table(distributions);

  console.log('\n--- 2. V4.2 TRANSFORMER ACTIVATION RATE BY LANGUAGE ---');
  console.table([
    {
      Language: 'English Standard',
      TotalQueries: englishCount,
      TransformerActivated: v4_2_activations.english,
      ActivationRate: `${((v4_2_activations.english / Math.max(1, englishCount)) * 100).toFixed(2)}%`,
    },
    {
      Language: 'Hindi / Devanagari',
      TotalQueries: hindiCount,
      TransformerActivated: v4_2_activations.hindi,
      ActivationRate: `${((v4_2_activations.hindi / Math.max(1, hindiCount)) * 100).toFixed(2)}%`,
    },
    {
      Language: 'Telugu Script',
      TotalQueries: teluguCount,
      TransformerActivated: v4_2_activations.telugu,
      ActivationRate: `${((v4_2_activations.telugu / Math.max(1, teluguCount)) * 100).toFixed(2)}%`,
    },
    {
      Language: 'Romanized Indic / Transliterated',
      TotalQueries: romanizedCount,
      TransformerActivated: v4_2_activations.transliterated,
      ActivationRate: `${((v4_2_activations.transliterated / Math.max(1, romanizedCount)) * 100).toFixed(2)}%`,
    },
  ]);

  console.log('\n--- 3. REGEX OVER-TRIGGERING ANALYSIS (POSITIVE & NEGATIVE TEST CASES) ---');
  const testCases = [
    // Negative cases (Standard English Indian names that contain aspirated consonants: Sharma, Chowdhary, Mukherjee, Bharat)
    { text: 'Sharma', expectedType: 'Standard English Indian name containing "sh"', actual: LanguageRouter.detectLanguage('Sharma').primaryLanguage },
    { text: 'Chowdhary', expectedType: 'Standard English Indian name containing "ch", "dh"', actual: LanguageRouter.detectLanguage('Chowdhary').primaryLanguage },
    { text: 'Bharat', expectedType: 'Standard English Indian name containing "bh"', actual: LanguageRouter.detectLanguage('Bharat').primaryLanguage },
    { text: 'John Smith', expectedType: 'Pure Western English name', actual: LanguageRouter.detectLanguage('John Smith').primaryLanguage },
    // Positive cases (Actual phonetic transliterations with repeated vowels or non-standard phonetics)
    { text: 'Kavithaa Yaadaav', expectedType: 'Elongated transliterated Indic', actual: LanguageRouter.detectLanguage('Kavithaa Yaadaav').primaryLanguage },
    { text: 'Raaaw Kumaaar', expectedType: 'Triple vowel elongation', actual: LanguageRouter.detectLanguage('Raaaw Kumaaar').primaryLanguage },
    { text: 'अमित पटेल', expectedType: 'Devanagari Hindi', actual: LanguageRouter.detectLanguage('अमित पटेल').primaryLanguage },
    { text: 'రవి కుమార్', expectedType: 'Telugu Script', actual: LanguageRouter.detectLanguage('రవి కుమార్').primaryLanguage },
  ];

  console.table(testCases);

  console.log('\n[DIAGNOSTIC FINDING FOR STEP 9]:');
  console.log('The aspirated consonant regex /(bh|ch|dh|gh|jh|kh|ph|sh|th|zh)/i flags standard English Indian spellings (e.g. Sharma, Bharat, Chowdhary)');
  console.log('as TRANSLITERATED_INDIC. Under V4.2 selective gating, this causes Transformer activation for these English Indian names.');
  console.log('Per governance, weights and regexes remain UNMODIFIED in Phase 7F.4.2 until explicitly tuned in subsequent Phase.');
  console.log('\n========================================================================\n');
}

if (process.argv[1]?.endsWith('diagnose-model2-v4-language-router.ts')) {
  runLanguageRouterDiagnostic().catch((err) => {
    console.error('[FATAL] Language router diagnostic failed:', err);
    process.exit(1);
  });
}
