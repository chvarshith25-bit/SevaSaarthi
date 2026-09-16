/**
 * Seva Saarthi AI Model 2 V4.1 - Field-Aware & Field-Level Semantic Representation Tests
 * 
 * Verifies:
 * 1. Field-Aware Semantic Formats (Sections 4 & 5):
 *    - A: Name
 *    - B: Name + Address
 *    - C: Name + District
 *    - D: Name + Address + District
 *    - E: Full authorized semantic profile
 * 2. Strict PII sanitization: Strips raw PAN, Aadhaar, bank accounts, candidate IDs.
 * 3. Real neural embedding and cosine similarity across field representations.
 * 4. Field-level semantic combination: semantic_name + structured_DOB + structured_pincode + semantic_address.
 */

import { MultilingualE5BaseTransformerProvider } from '../src/lib/server/ai/entity-resolution/v4-transformer/transformer-provider';
import { SemanticSimilarityEngine } from '../src/lib/server/ai/entity-resolution/v4-transformer/semantic-similarity';
import { V4HybridScorer, DEFAULT_V4_1_CONFIG } from '../src/lib/server/ai/entity-resolution/v4-transformer/hybrid-scorer';
import { EntityResolutionInput } from '../src/lib/server/ai/entity-resolution/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`[PASS] ${msg}`);
}

async function testFieldSemanticRepresentations() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.1 FIELD-LEVEL SEMANTIC SIMILARITY TESTS     ');
  console.log('========================================================================\n');

  const provider = new MultilingualE5BaseTransformerProvider();

  // Test 1: Field-Aware Semantic Formats
  console.log('--- Test 1: Semantic Representation Formats (A-E) ---');
  const sampleFields = {
    name: 'Vijay Kumar Singh',
    fatherName: 'Ranveer Singh',
    address: 'Plot 12, Hitech City Main Rd',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
  };

  const repA = SemanticSimilarityEngine.formatCompositeSemanticText(sampleFields, 'NAME_ONLY', true);
  const repB = SemanticSimilarityEngine.formatCompositeSemanticText(sampleFields, 'NAME_ADDRESS', true);
  const repC = SemanticSimilarityEngine.formatCompositeSemanticText(sampleFields, 'NAME_DISTRICT', true);
  const repD = SemanticSimilarityEngine.formatCompositeSemanticText(sampleFields, 'NAME_ADDRESS_DISTRICT', true);
  const repE = SemanticSimilarityEngine.formatCompositeSemanticText(sampleFields, 'FULL_PROFILE', true);

  console.log(`Rep A (Name): ${repA.text}`);
  console.log(`Rep B (Name+Address): ${repB.text}`);
  console.log(`Rep C (Name+District): ${repC.text}`);
  console.log(`Rep D (Name+Addr+Dist): ${repD.text}`);
  console.log(`Rep E (Full Profile): ${repE.text}`);

  assert(repA.text === 'query: name: Vijay Kumar Singh', 'Rep A matches exact name format');
  assert(repB.text.includes('name: Vijay Kumar Singh') && repB.text.includes('address: Plot 12, Hitech City Main Rd'), 'Rep B contains name and address');
  assert(repC.text.includes('district: Hyderabad'), 'Rep C contains name and district');
  assert(repD.text.includes('address:') && repD.text.includes('district:'), 'Rep D contains address and district');
  assert(repE.text.includes('father: Ranveer Singh') && repE.text.includes('pincode: 500081'), 'Rep E contains full authorized profile');

  // Test 2: PII Redaction Audit
  console.log('\n--- Test 2: Raw PII Identifier Stripping Audit ---');
  const dirtyRow = {
    name: 'Vijay Kumar Singh',
    address: 'Plot 12, Hitech City',
    district: 'Hyderabad',
    aadhaar_number: '9999-8888-7777',
    pan_card_no: 'ABCDE1234F',
    bank_account_number: '123456789012',
    secret_token: 'xyz987',
  };
  const passageRep = SemanticSimilarityEngine.formatPassageSemanticText(dirtyRow, 'revenue_registry');
  console.log(`Sanitized Passage: ${passageRep.text}`);
  assert(!passageRep.text.includes('9999-8888-7777'), 'Aadhaar was stripped from passage');
  assert(!passageRep.text.includes('ABCDE1234F'), 'PAN was stripped from passage');
  assert(!passageRep.text.includes('123456789012'), 'Bank account was stripped from passage');
  assert(passageRep.hasSensitiveFields, 'Sensitive fields were detected and flagged');

  // Test 3: Real Neural Embeddings for Field-Level Similarities
  console.log('\n--- Test 3: Field-Level Semantic Similarities (Name, Address, District) ---');
  const qNameVec = await provider.embed(repA.text);
  const passNameRep = SemanticSimilarityEngine.formatCompositeSemanticText({ name: 'V. K. Singh' }, 'NAME_ONLY', false);
  const pNameVec = await provider.embed(passNameRep.text);
  const nameSim = SemanticSimilarityEngine.computeCosineSimilarity(qNameVec, pNameVec);
  console.log(`Semantic Name Similarity ("Vijay Kumar Singh" vs "V. K. Singh"): ${nameSim.toFixed(4)}`);
  assert(nameSim >= 0.85, 'Semantic name similarity captures abbreviation (> 0.85)');

  const qAddrRep = SemanticSimilarityEngine.formatFieldSemanticText('address', 'Hitech City, Madhapur', true);
  const pAddrRep = SemanticSimilarityEngine.formatFieldSemanticText('address', 'Plot 12, Cyber Towers, Madhapur, Hitech City', false);
  const qAddrVec = await provider.embed(qAddrRep.text);
  const pAddrVec = await provider.embed(pAddrRep.text);
  const addrSim = SemanticSimilarityEngine.computeCosineSimilarity(qAddrVec, pAddrVec);
  console.log(`Semantic Address Similarity: ${addrSim.toFixed(4)}`);
  assert(addrSim >= 0.85, 'Semantic address similarity captures paraphrased address (> 0.85)');

  // Test 4: Evaluation of Combined Field-Level Scorer
  console.log('\n--- Test 4: Field-Level Semantic Scorer Evaluation ---');
  const scorer = new V4HybridScorer(DEFAULT_V4_1_CONFIG);
  const evalInput: EntityResolutionInput = {
    name: 'Vijay Kumar Singh',
    dateOfBirth: '1985-06-20',
    address: 'Hitech City, Madhapur',
    district: 'Hyderabad',
    pincode: '500081',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  };
  const evalRow = {
    name: 'V. K. Singh',
    dob: '1985-06-20',
    address: 'Plot 12, Cyber Towers, Madhapur, Hitech City',
    district: 'Hyderabad',
    pincode: '500081',
    citizen_id: 'CIT-FIELD-01',
    id: 'REC-F-01',
  };

  const evalResult = scorer.evaluateCandidate(evalInput, evalRow, 'revenue_registry', {
    nameSemantic: nameSim,
    addressSemantic: addrSim,
    districtSemantic: 1.0,
    profileSemantic: 0.93,
  });

  console.log(`Combined Field Match Score: ${evalResult.totalScore}, Tier: ${evalResult.confidenceTier}`);
  assert(evalResult.totalScore >= 0.85, 'Combined field-level match achieves HIGH confidence');
  assert(evalResult.confidenceTier === 'HIGH', 'Tier is HIGH');

  console.log('\n========================================================================');
  console.log('   ALL FIELD-LEVEL SEMANTIC SIMILARITY TESTS PASSED (100%)              ');
  console.log('========================================================================');
}

testFieldSemanticRepresentations().catch((err) => {
  console.error('[FATAL] Field semantic test failed:', err);
  process.exit(1);
});
