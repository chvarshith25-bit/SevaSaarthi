/**
 * Seva Saarthi AI Model 2 V4.2 - Language Routing Test Suite
 * 
 * Verifies that LanguageRouter accurately classifies:
 * 1. Standard English queries (e.g., 'Amit Patel', 'Ravi Kumar')
 * 2. Devanagari / Hindi script queries (e.g., 'अमित पटेल', 'रवि कुमार')
 * 3. Telugu script queries (e.g., 'రవి కుమార్', 'అమిత్ పటేల్')
 * 4. Transliterated Indic queries (e.g., 'kavitha yadaav', 'sharmma', 'raoo')
 * 5. Mixed-script / multilingual inputs
 */

import { LanguageRouter } from '../src/lib/server/ai/entity-resolution/v4-transformer/language-router';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function runLanguageRoutingTests() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.2 LANGUAGE ROUTING TEST SUITE               ');
  console.log('========================================================================\n');

  // Test 1: Standard English
  const resEn = LanguageRouter.detectLanguage('Amit Patel, Civil Lines, Jaipur');
  assert(resEn.primaryLanguage === 'ENGLISH', 'Standard English correctly classified as ENGLISH');
  assert(!resEn.isMultilingualOrTransliterated, 'Standard English isMultilingualOrTransliterated is false');
  assert(resEn.scriptBreakdown.latin > 0, 'Latin character count > 0');
  assert(resEn.scriptBreakdown.devanagari === 0, 'Devanagari character count is 0');
  assert(resEn.scriptBreakdown.telugu === 0, 'Telugu character count is 0');

  // Test 2: Pure Devanagari / Hindi
  const resHi = LanguageRouter.detectLanguage('अमित पटेल');
  assert(resHi.primaryLanguage === 'HINDI', 'Devanagari correctly classified as HINDI');
  assert(resHi.isMultilingualOrTransliterated, 'Hindi isMultilingualOrTransliterated is true');
  assert(resHi.scriptBreakdown.devanagari > 0, 'Devanagari character count > 0');
  assert(resHi.scriptBreakdown.latin === 0, 'Latin character count is 0');

  // Test 3: Pure Telugu
  const resTe = LanguageRouter.detectLanguage('రవి కుమార్');
  assert(resTe.primaryLanguage === 'TELUGU', 'Telugu correctly classified as TELUGU');
  assert(resTe.isMultilingualOrTransliterated, 'Telugu isMultilingualOrTransliterated is true');
  assert(resTe.scriptBreakdown.telugu > 0, 'Telugu character count > 0');
  assert(resTe.scriptBreakdown.latin === 0, 'Latin character count is 0');

  // Test 4: Transliterated Indic
  const resTrans1 = LanguageRouter.detectLanguage('Kavitha Yadaav');
  assert(resTrans1.primaryLanguage === 'TRANSLITERATED_INDIC', 'Elongated vowel transliteration classified as TRANSLITERATED_INDIC');
  assert(resTrans1.isMultilingualOrTransliterated, 'Transliteration isMultilingualOrTransliterated is true');

  const resTrans2 = LanguageRouter.detectLanguage('Ravi Kumaar Sharmaa');
  assert(resTrans2.primaryLanguage === 'TRANSLITERATED_INDIC', 'Repeated vowel Indic transliteration classified as TRANSLITERATED_INDIC');

  // Test 5: Mixed Script
  const resMixed = LanguageRouter.detectLanguage('Ravi Kumar (रवि कुमार)');
  assert(resMixed.primaryLanguage === 'MIXED', 'Mixed Latin + Devanagari classified as MIXED');
  assert(resMixed.isMultilingualOrTransliterated, 'Mixed isMultilingualOrTransliterated is true');
  assert(resMixed.scriptBreakdown.latin > 0 && resMixed.scriptBreakdown.devanagari > 0, 'Both Latin and Devanagari breakdown detected');

  // Test 6: Query object detection
  const resQueryObj = LanguageRouter.detectQueryLanguage({
    name: 'दीपक नायडू',
    district: 'Hyderabad',
  });
  assert(resQueryObj.primaryLanguage === 'MIXED' || resQueryObj.isMultilingualOrTransliterated, 'Query object with Indic name classified as multilingual');

  console.log('\n========================================================================');
  console.log('   ALL LANGUAGE ROUTING TESTS PASSED (100%)                             ');
  console.log('========================================================================\n');
}

runLanguageRoutingTests().catch((err) => {
  console.error('[FATAL] Language routing test failed:', err);
  process.exit(1);
});
