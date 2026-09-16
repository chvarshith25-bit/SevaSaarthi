/**
 * Seva Saarthi Model 2 V4.2 - Selective Gating Telemetry Audit
 * Phase 7F.4.1 Audit Suite
 * 
 * Verifies and Audits:
 * 1. Selective Gating Activation Behavior:
 *    - Overall activation rate
 *    - English activation rate
 *    - Hindi activation rate
 *    - Telugu activation rate
 *    - Transliterated Indic activation rate
 *    - Ambiguous / uncertain cases activation rate
 *    - Clear exact match activation rate
 * 2. Per-request telemetry:
 *    - Language detected & features
 *    - V3.1 tier & score
 *    - Transformer invoked (YES/NO), Gating Mode & reason
 *    - Gating Alpha/Beta weights
 * 3. Diagnostic Audit on Language Routing Over-Triggering:
 *    - Quantifies how regex patterns (/sh/, /th/, /ch/, /ee/, /aa/) misclassify standard Latin Indian names as TRANSLITERATED_INDIC.
 */

import { SelectiveGater, GatingDecision } from '../src/lib/server/ai/entity-resolution/v4-transformer/selective-gater';
import { LanguageRouter, DetectedLanguage } from '../src/lib/server/ai/entity-resolution/v4-transformer/language-router';

interface GatingAuditQuery {
  id: string;
  name: string;
  category: string;
  expectedLang: string;
  v3ConfidenceTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'AMBIGUOUS';
  v3Score: number;
  nameScore: number;
  conflictCount: number;
  isCollision: boolean;
  availableFieldCount: number;
}

export async function runGatingTelemetryAudit() {
  console.log('========================================================================');
  console.log('   PHASE 7F.4.1: MODEL 2 V4.2 SELECTIVE GATING TELEMETRY AUDIT          ');
  console.log('========================================================================\n');

  const testQueries: GatingAuditQuery[] = [
    // Clear Exact Matches (Standard English)
    { id: 'GT-001', name: 'Amit Patel', category: 'EXACT_ENGLISH', expectedLang: 'en', v3ConfidenceTier: 'HIGH', v3Score: 0.95, nameScore: 1.0, conflictCount: 0, isCollision: false, availableFieldCount: 4 },
    { id: 'GT-002', name: 'Ravi Kumar', category: 'EXACT_ENGLISH', expectedLang: 'en', v3ConfidenceTier: 'HIGH', v3Score: 0.96, nameScore: 1.0, conflictCount: 0, isCollision: false, availableFieldCount: 4 },
    { id: 'GT-003', name: 'Sunil Das', category: 'EXACT_ENGLISH', expectedLang: 'en', v3ConfidenceTier: 'HIGH', v3Score: 0.94, nameScore: 1.0, conflictCount: 0, isCollision: false, availableFieldCount: 4 },

    // Multilingual Indic (Hindi)
    { id: 'GT-004', name: 'अमित पटेल', category: 'HINDI_SCRIPT', expectedLang: 'hi', v3ConfidenceTier: 'AMBIGUOUS', v3Score: 0.05, nameScore: 0.0, conflictCount: 0, isCollision: false, availableFieldCount: 1 },
    { id: 'GT-005', name: 'रवि कुमार', category: 'HINDI_SCRIPT', expectedLang: 'hi', v3ConfidenceTier: 'AMBIGUOUS', v3Score: 0.05, nameScore: 0.0, conflictCount: 0, isCollision: false, availableFieldCount: 1 },

    // Multilingual Indic (Telugu)
    { id: 'GT-006', name: 'అమిత్ పటేల్', category: 'TELUGU_SCRIPT', expectedLang: 'te', v3ConfidenceTier: 'AMBIGUOUS', v3Score: 0.05, nameScore: 0.0, conflictCount: 0, isCollision: false, availableFieldCount: 1 },
    { id: 'GT-007', name: 'రవి కుమార్', category: 'TELUGU_SCRIPT', expectedLang: 'te', v3ConfidenceTier: 'AMBIGUOUS', v3Score: 0.05, nameScore: 0.0, conflictCount: 0, isCollision: false, availableFieldCount: 1 },

    // Transliterated / Romanized Indic
    { id: 'GT-008', name: 'Ameet Patel', category: 'TRANSLITERATED', expectedLang: 'transliterated_indic', v3ConfidenceTier: 'MEDIUM', v3Score: 0.65, nameScore: 0.85, conflictCount: 0, isCollision: false, availableFieldCount: 3 },
    { id: 'GT-009', name: 'Ravee Kumaar', category: 'TRANSLITERATED', expectedLang: 'transliterated_indic', v3ConfidenceTier: 'MEDIUM', v3Score: 0.62, nameScore: 0.82, conflictCount: 0, isCollision: false, availableFieldCount: 3 },

    // Ambiguous English Cases (Medium or Ambiguous tier)
    { id: 'GT-010', name: 'A. Patel', category: 'INITIALS_AMBIGUOUS', expectedLang: 'en', v3ConfidenceTier: 'AMBIGUOUS', v3Score: 0.45, nameScore: 0.60, conflictCount: 0, isCollision: false, availableFieldCount: 2 },
    { id: 'GT-011', name: 'R. K.', category: 'INITIALS_AMBIGUOUS', expectedLang: 'en', v3ConfidenceTier: 'AMBIGUOUS', v3Score: 0.35, nameScore: 0.50, conflictCount: 0, isCollision: false, availableFieldCount: 1 },
    { id: 'GT-012', name: 'Kumar', category: 'SINGLE_TOKEN_AMBIGUOUS', expectedLang: 'en', v3ConfidenceTier: 'AMBIGUOUS', v3Score: 0.40, nameScore: 0.55, conflictCount: 0, isCollision: false, availableFieldCount: 1 },
  ];

  const telemetryRecords: any[] = [];
  const stats = {
    total: testQueries.length,
    invokedCount: 0,
    englishTotal: 0,
    englishInvoked: 0,
    hindiTotal: 0,
    hindiInvoked: 0,
    teluguTotal: 0,
    teluguInvoked: 0,
    transliteratedTotal: 0,
    transliteratedInvoked: 0,
    ambiguousTotal: 0,
    ambiguousInvoked: 0,
    clearExactTotal: 0,
    clearExactInvoked: 0,
  };

  for (const q of testQueries) {
    const langInfo = LanguageRouter.detectLanguage(q.name);
    const decision = SelectiveGater.evaluateGate({
      queryText: q.name,
      structuredCalibratedScore: q.v3Score,
      structuredConfidenceTier: q.v3ConfidenceTier,
      nameScore: q.nameScore,
      conflictCount: q.conflictCount,
      isCollision: q.isCollision,
      availableFieldCount: q.availableFieldCount,
    });

    const isInvoked = decision.mode !== 'BYPASS_TRANSFORMER' && decision.mode !== 'HARD_COLLISION_BLOCK';
    if (isInvoked) stats.invokedCount++;

    if (q.category === 'EXACT_ENGLISH') {
      stats.clearExactTotal++;
      if (isInvoked) stats.clearExactInvoked++;
      stats.englishTotal++;
      if (isInvoked) stats.englishInvoked++;
    } else if (q.category === 'HINDI_SCRIPT') {
      stats.hindiTotal++;
      if (isInvoked) stats.hindiInvoked++;
    } else if (q.category === 'TELUGU_SCRIPT') {
      stats.teluguTotal++;
      if (isInvoked) stats.teluguInvoked++;
    } else if (q.category === 'TRANSLITERATED') {
      stats.transliteratedTotal++;
      if (isInvoked) stats.transliteratedInvoked++;
    } else if (q.category === 'INITIALS_AMBIGUOUS' || q.category === 'SINGLE_TOKEN_AMBIGUOUS') {
      stats.ambiguousTotal++;
      if (isInvoked) stats.ambiguousInvoked++;
      stats.englishTotal++;
      if (isInvoked) stats.englishInvoked++;
    }

    telemetryRecords.push({
      id: q.id,
      name: q.name,
      category: q.category,
      detectedLang: langInfo.primaryLanguage,
      gatingMode: decision.mode,
      alphaStructured: decision.alphaStructured,
      betaTransformer: decision.betaTransformer,
      transformerInvoked: isInvoked ? 'YES' : 'NO',
      reason: decision.reason,
    });
  }

  console.log('--- TELEMETRY TRACE ---');
  console.table(telemetryRecords);

  console.log('\n--- ACTIVATION RATES ---');
  console.log(`Overall Activation Rate:             ${stats.invokedCount} / ${stats.total} (${((stats.invokedCount / stats.total) * 100).toFixed(2)}%)`);
  console.log(`Clear Exact Matches Activation Rate: ${stats.clearExactInvoked} / ${stats.clearExactTotal} (${((stats.clearExactInvoked / Math.max(1, stats.clearExactTotal)) * 100).toFixed(2)}%) [Target: 0%]`);
  console.log(`Hindi Queries Activation Rate:       ${stats.hindiInvoked} / ${stats.hindiTotal} (${((stats.hindiInvoked / Math.max(1, stats.hindiTotal)) * 100).toFixed(2)}%) [Target: 100%]`);
  console.log(`Telugu Queries Activation Rate:      ${stats.teluguInvoked} / ${stats.teluguTotal} (${((stats.teluguInvoked / Math.max(1, stats.teluguTotal)) * 100).toFixed(2)}%) [Target: 100%]`);
  console.log(`Transliterated Activation Rate:      ${stats.transliteratedInvoked} / ${stats.transliteratedTotal} (${((stats.transliteratedInvoked / Math.max(1, stats.transliteratedTotal)) * 100).toFixed(2)}%) [Target: 100%]`);
  console.log(`Ambiguous English Activation Rate:   ${stats.ambiguousInvoked} / ${stats.ambiguousTotal} (${((stats.ambiguousInvoked / Math.max(1, stats.ambiguousTotal)) * 100).toFixed(2)}%) [Target: 100%]`);

  // Diagnostic sub-audit on regex over-triggering
  console.log('\n--- DIAGNOSTIC: OVER-TRIGGERING OF TRANSLITERATION PATTERNS ON STANDARD LATIN NAMES ---');
  const commonIndianNames = [
    'Deepak Naidu',   // contains 'ee'
    'Pooja Sharma',   // contains 'oo', 'sh'
    'Suresh Varma',   // contains 'sh'
    'Kavitha Yadav',  // contains 'th'
    'Vijay Singh',    // contains 'gh'
    'Radha Kumar',    // contains 'dh'
  ];

  const overTriggerAudit = commonIndianNames.map((name) => {
    const res = LanguageRouter.detectLanguage(name);
    return {
      Name: name,
      DetectedLanguage: res.primaryLanguage,
      IsTransliteratedFlag: res.isMultilingualOrTransliterated,
      MatchedFeatures: res.detectedFeatures.join(', '),
      DiagnosticVerdict: res.primaryLanguage === 'TRANSLITERATED_INDIC' ? 'OVER-TRIGGERED' : 'CLEAN_ENGLISH',
    };
  });
  console.table(overTriggerAudit);

  if (stats.clearExactInvoked !== 0) {
    console.error('[FAIL] Clear exact matches activated Transformer unnecessarily!');
    process.exit(1);
  }
  if (stats.hindiInvoked !== stats.hindiTotal || stats.teluguInvoked !== stats.teluguTotal) {
    console.error('[FAIL] Indic script queries failed to invoke Transformer!');
    process.exit(1);
  }

  console.log('\n[PASS] Selective gating telemetry verified.\n');
}

if (require.main === module) {
  runGatingTelemetryAudit().catch((err) => {
    console.error('[FATAL] Gating telemetry audit failed:', err);
    process.exit(1);
  });
}
