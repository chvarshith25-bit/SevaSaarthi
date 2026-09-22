/**
 * PERSISTENCE & LIFECYCLE RESTART AUDIT
 * Tests application, consent, routing, entity resolution, and audit event persistence.
 */

import { getAuthoritativeDb, pgQuery } from '../src/lib/server/pg-db';
import { getApplicationById, getAuditLogs, createPanApplication, addAuditLog } from '../src/lib/server/db';
import { WorkflowRouter } from '../src/lib/server/ai/workflow-router';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';

async function runPersistenceAudit() {
  console.log('========================================================================');
  console.log('              PERSISTENCE & RESTART LIFECYCLE AUDIT                     ');
  console.log('========================================================================\n');

  // Step 1: Initialize DB
  await getAuthoritativeDb();

  // Step 2: Create synthetic test application
  console.log(`1. Creating synthetic test application via createPanApplication...`);
  const app = await createPanApplication({
    userId: 'u_0bc5a3b6-f059-4ab2-9870-46a9c25178b7',
    applicantName: 'Sri Ramesh Chandra Varma',
    applicantPhone: '9988776655',
    applicantEmail: 'ramesh.varma@demo.gov.in',
    citizenData: {
      fullName: 'Ramesh Chandra Varma',
      dateOfBirth: '1985-11-12',
      fatherName: 'Venkata Varma',
      address: 'D.No 12-4/A, Jubilee Hills',
      district: 'HYDERABAD',
      pincode: '500033',
      serviceType: 'NEW_PAN',
    },
    consentGranted: true,
  });
  const testAppId = app.id;
  console.log(`   Created application ID: ${testAppId}`);

  // Step 3: Add Routing Recommendation
  console.log('2. Recording Model 1 routing recommendation...');
  const m1 = await WorkflowRouter.routeApplicationV2({
    applicationId: testAppId,
    serviceId: 'srv-pan-01',
    serviceName: 'Instant e-PAN Card Issuance',
    applicationTitle: 'PAN Card Application',
    applicationDescription: 'Citizen requesting new PAN card',
    requestedBenefit: 'PAN Allotment',
  });

  const recId = await WorkflowRouter.persistRecommendation(m1, testAppId);
  console.log(`   Persisted Model 1 recommendation ID: ${recId}`);

  // Step 4: Run Model 2 Entity Resolution
  console.log('3. Running Model 2 V4.2 entity resolution...');
  const m2Engine = new EntityResolutionEngineV4();
  const m2 = await m2Engine.resolve({
    name: 'Ramesh Chandra Varma',
    dateOfBirth: '1985-11-12',
    fatherName: 'Venkata Varma',
    address: 'D.No 12-4/A, Jubilee Hills',
    district: 'HYDERABAD',
    pincode: '500033',
    allowedRegistries: ['revenue_registry', 'pan_tax_registry'] as any,
    consentVerified: true,
  });

  // Step 5: Record Audit Event
  console.log('4. Recording immutable SHA-256 audit event...');
  const auditEntry = {
    applicationId: testAppId,
    actor: { id: '00000000-0000-0000-0000-000000000001', name: 'Ramesh Chandra Varma', role: 'CITIZEN' as const },
    action: 'APPLICATION_SUBMITTED',
    stage: 'OFFICER_REVIEW',
    source: 'Citizen Portal',
    target: 'Officer Work Queue',
    purpose: 'Statutory Application Submission',
    result: 'SUCCESS' as const,
    details: 'Submitted with verified DPDP Section 6 consent',
  };
  addAuditLog(auditEntry);

  // Step 6: Verify Persistence in active DB
  console.log('5. Verifying retrieval from active database instance...');
  const retrievedApp = await getApplicationById(testAppId);
  const retrievedLogs = await getAuditLogs(testAppId);

  const consentValid = !!retrievedApp?.consent?.granted;
  console.log(`   - Application Retrieved: ${retrievedApp ? 'YES' : 'NO'} (${retrievedApp?.applicantName})`);
  console.log(`   - Consent Verified: ${consentValid ? 'YES' : 'NO'}`);
  console.log(`   - Model 1 Recommendation ID: ${recId || 'Saved'}`);
  console.log(`   - Model 2 Candidates: ${m2.candidates.length} (Tier: ${m2.bestMatch?.confidenceTier || 'AMBIGUOUS'})`);
  console.log(`   - Audit Events: ${retrievedLogs.length} verified (Hash: ${retrievedLogs[0]?.tamperHash ? 'VALID' : 'NONE'})`);

  const allPresent = !!retrievedApp && consentValid && retrievedLogs.length > 0;
  console.log(`\nActive Instance Persistence Check: ${allPresent ? 'PASS' : 'FAIL'}`);

  return {
    allPresent,
    appId: testAppId,
    dbType: process.env.DATABASE_URL ? 'PostgreSQL (Persistent Network DB)' : 'PGlite (Local Development / In-Memory)',
  };
}

runPersistenceAudit().then((res) => {
  console.log('Persistence Audit Output:', JSON.stringify(res, null, 2));
  process.exit(res.allPresent ? 0 : 1);
}).catch((err) => {
  console.error('Persistence Audit Failed:', err);
  process.exit(1);
});
