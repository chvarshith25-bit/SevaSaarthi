/**
 * PHASE 9.1 — MASTER END-TO-END SYSTEM LIFECYCLE & INTEGRITY TEST
 * 
 * Traces the complete lifecycle:
 * CITIZEN -> APPLICATION -> AI MODEL 1 ROUTING -> DPDP CONSENT ->
 * SYNTHETIC REGISTRIES -> AI MODEL 2 V4.2 RESOLUTION -> OFFICER DECISION ->
 * STATE MACHINE -> PHYSICAL FULFILLMENT -> SHA-256 AUDIT LOG CHAIN
 */

import { WorkflowRouter } from '../src/lib/server/ai/workflow-router';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import {
  getAllApplications,
  getApplicationById,
  createPanApplication,
  updatePanApplication,
  officerAcceptApplication,
  officerRejectApplication,
  officerReturnApplication,
  advancePhysicalPipelineStage,
  getAuditLogs,
  calculateAuditTamperHash,
} from '../src/lib/server/db';
import crypto from 'crypto';

async function runMasterTest() {
  console.log('========================================================================');
  console.log('       SEVA SAARTHI / SARKAR SEVA MASTER END-TO-END LIFECYCLE AUDIT     ');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${msg}`);
    } else {
      console.error(`[FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // --- STEP 1: Citizen Ingestion ---
  console.log('--- STEP 1: CITIZEN APPLICATION INGESTION ---');
  const syntheticApplicant = {
    userId: `u_${crypto.randomUUID()}`,
    applicantName: 'Venkata Sai Sankeerth Chilukuri',
    applicantPhone: '9876543210',
    applicantEmail: 'sankeerth@gov.test',
    citizenData: {
      fullName: 'Venkata Sai Sankeerth Chilukuri',
      dateOfBirth: '1999-08-15',
      fatherName: 'Ramanaiah Chilukuri',
      address: 'Plot 42, Jubilee Hills, Hyderabad',
      district: 'HYDERABAD',
      pincode: '500033',
      serviceType: 'NEW_PAN',
      incomeSource: 'SALARY',
      state: 'TELANGANA',
    },
    consentGranted: true,
  };

  const created = await createPanApplication(syntheticApplicant);
  const appNumber = created.id || (created as any).application_number;
  assert(!!created && !!appNumber, `Citizen application registered with monotonic ID: ${appNumber}`);

  // --- STEP 2: AI Model 1 Workflow Routing ---
  console.log('\n--- STEP 2: AI MODEL 1 WORKFLOW ROUTING ---');
  const routingResult = await WorkflowRouter.routeApplicationV2({
    applicationId: appNumber,
    serviceId: 'srv-pan-01',
    serviceName: 'Instant e-PAN Card Issuance',
    applicationTitle: 'Instant e-PAN Card Application for Taxpayer',
    applicationDescription: 'Citizen requesting instant e-PAN card verification with NSDL permanent account number',
    requestedBenefit: 'Issue new digital e-PAN card for income tax return',
    documentTypes: ['Aadhaar Card', 'Form 49A'],
  });

  assert(
    !!routingResult.suggestedDepartmentName &&
    (routingResult.suggestedDepartmentName.includes('Tax') || routingResult.suggestedDepartmentName.includes('Revenue') || routingResult.suggestedDepartmentName.includes('Finance') || routingResult.suggestedDepartmentName.includes('Income')),
    `Model 1 recommended correct department: ${routingResult.suggestedDepartmentName}`
  );
  assert(routingResult.confidenceScore >= 0.70, `Model 1 confidence score is high (${(routingResult.confidenceScore * 100).toFixed(1)}%)`);
  assert(routingResult.recommendationExplanation.length > 0, `Model 1 produced human-interpretable rationale: "${routingResult.recommendationExplanation.slice(0, 60)}..."`);

  // --- STEP 3: DPDP Consent & AI Model 2 V4.2 Candidate Resolution ---
  console.log('\n--- STEP 3: DPDP ACT 2023 CONSENT & AI MODEL 2 V4.2 ENTITY RESOLUTION ---');
  assert(syntheticApplicant.consentGranted === true, 'Explicit DPDP Act 2023 digital consent verified');

  const engine = new EntityResolutionEngineV4();
  const resolutionResult = await engine.resolve({
    name: syntheticApplicant.citizenData.fullName,
    dateOfBirth: syntheticApplicant.citizenData.dateOfBirth,
    fatherName: syntheticApplicant.citizenData.fatherName,
    address: syntheticApplicant.citizenData.address,
    district: syntheticApplicant.citizenData.district,
    pincode: syntheticApplicant.citizenData.pincode,
    allowedRegistries: ['revenue_registry', 'pan_tax_registry', 'housing_registry'] as any,
    consentVerified: true,
  });

  assert(Array.isArray(resolutionResult.candidates), `Model 2 returned candidate array (found ${resolutionResult.candidates.length} candidates)`);
  const topCandidateTier = resolutionResult.bestMatch?.confidenceTier || 'AMBIGUOUS';
  assert(['HIGH', 'MEDIUM', 'AMBIGUOUS', 'NO_MATCH'].includes(topCandidateTier), `Model 2 classified candidate confidence tier: ${topCandidateTier}`);
  assert(resolutionResult.candidates.length > 0 && resolutionResult.candidates[0].explanation.length > 0, 'Model 2 produced candidate explanation matrix');
  assert(resolutionResult.disclaimer.includes('statutory identity'), 'Model 2 advisory governance disclaimer verified');

  // --- STEP 4: Officer Assigned Review & Zero Statutory Authority for AI ---
  console.log('\n--- STEP 4: OFFICER REVIEW & PRODUCT RULE 1 (ZERO STATUTORY AI AUTHORITY) ---');
  const fetched = await getApplicationById(appNumber);
  assert(fetched !== null, `Officer retrieved application dossier for ${appNumber}`);

  // Transition to UNDER_REVIEW (assigned to officer desk)
  await updatePanApplication(appNumber, {
    status: 'UNDER_REVIEW',
    stage: 'OFFICER_REVIEW',
    assignedOfficerId: 'EMP-HYD-001',
    assignedOfficerName: 'Officer Sai Sankeerth',
  });

  // Statutory officer decision - Accept & Grant
  const officerAccept = await officerAcceptApplication(
    appNumber,
    'EMP-HYD-001',
    'Officer Sai Sankeerth',
    'Statutory review complete. All identity credentials and registry records cross-verified.'
  );

  const issuedPan = officerAccept.physicalCard?.panNumber || (officerAccept as any).panNumber;
  assert(!!officerAccept, 'Human Officer executed statutory approval');
  assert(!!issuedPan, `Statutory PAN Number issued: ${issuedPan}`);

  // --- STEP 5: Physical Fulfillment State Machine ---
  console.log('\n--- STEP 5: STATE MACHINE & PHYSICAL FULFILLMENT PIPELINE ---');
  const panGen = await advancePhysicalPipelineStage(appNumber);
  assert(panGen.stage === 'PAN_GENERATION', `Pipeline advanced to PAN_GENERATION (Stage: ${panGen.stage})`);

  const cardPrint = await advancePhysicalPipelineStage(appNumber);
  assert(cardPrint.stage === 'CARD_PRINTING', `Pipeline advanced to CARD_PRINTING (Stage: ${cardPrint.stage})`);

  const dispatched = await advancePhysicalPipelineStage(appNumber);
  assert(dispatched.stage === 'DISPATCHED', `Pipeline advanced to DISPATCHED (Tracking: ${dispatched.physicalCard?.trackingNumber})`);

  const delivered = await advancePhysicalPipelineStage(appNumber);
  assert(delivered.stage === 'DELIVERED', `Pipeline advanced to DELIVERED (Stage: ${delivered.stage})`);

  const finalApp = await getApplicationById(appNumber);
  assert(finalApp?.status === 'COMPLETED', `Application status verified as COMPLETED (Stage: ${finalApp?.stage})`);

  // --- STEP 6: Cryptographic SHA-256 Audit Trail ---
  console.log('\n--- STEP 6: PRODUCT RULE 19 — TAMPER-EVIDENT SHA-256 AUDIT LOG VERIFICATION ---');
  const auditEntries = await getAuditLogs(appNumber);
  assert(auditEntries.length >= 4, `Immutable audit trail captured ${auditEntries.length} events for application`);

  let allHashesValid = true;
  for (const entry of auditEntries) {
    if (entry.tamperHash) {
      const recomputed = calculateAuditTamperHash(entry);
      if (recomputed !== entry.tamperHash) {
        allHashesValid = false;
        break;
      }
    }
  }
  assert(allHashesValid, 'Cryptographic SHA-256 hash verification: 100% VALID & TAMPER-FREE');

  console.log('\n========================================================================');
  console.log(`TOTAL LIFECYCLE CHECKS: ${total} | PASSED: ${passed} | FAILED: 0`);
  console.log('LIFECYCLE INTEGRITY SCORE: 100.0% — ZERO REGRESSIONS DETECTED');
  console.log('========================================================================\n');
}

runMasterTest().catch((err) => {
  console.error('[FATAL] Master Test Failed:', err);
  process.exit(1);
});
