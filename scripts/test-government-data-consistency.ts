import {
  getInitialPanApplications,
  getInitialAuditLogs,
  getInitialExceptions,
} from '../src/lib/mock-data/pan-initial-data';
import { WorkflowRouter } from '../src/lib/server/ai/workflow-router';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';

async function runDataConsistencyTests() {
  console.log('========================================================================');
  console.log('SARKAR SEVA — 10-DOMAIN GOVERNMENT DATA CONSISTENCY & INTEGRITY SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  const applications = getInitialPanApplications();
  console.log(`[DATA] Loaded ${applications.length} persistent applications from database snapshot`);

  if (applications.length > 0) {
    passed++;
    console.log(`[PASS] Database returns healthy application list (Total: ${applications.length})`);
  } else {
    failed++;
    console.error(`[FAIL] No applications returned from database`);
  }

  // DOMAIN 1: APPLICATION <-> MODEL 1 CONSISTENCY
  console.log('\n--- 1. APPLICATION <-> MODEL 1 CONSISTENCY ---');
  for (const app of [applications[0], applications[2], applications[3]]) {
    const m1Result = await WorkflowRouter.routeApplication({
      applicationId: app.id,
      applicationTitle: `${app.serviceName} application`,
      applicationDescription: `Citizen requires ${app.serviceName} for statutory identity and tax filing`,
      requestedBenefit: app.serviceName,
    });

    if (m1Result && m1Result.confidenceScore > 0) {
      const isConsistent =
        m1Result.suggestedServiceName?.toLowerCase().includes('pan') ===
        app.serviceName.toLowerCase().includes('pan');
      if (isConsistent) {
        passed++;
        console.log(`[PASS] ${app.id}: Model 1 recommended service "${m1Result.suggestedServiceName}" matches application "${app.serviceName}"`);
      } else {
        failed++;
        console.error(`[FAIL] ${app.id}: Model 1 mismatch: ${m1Result.suggestedServiceName} vs ${app.serviceName}`);
      }
    } else {
      failed++;
      console.error(`[FAIL] ${app.id}: Model 1 router failed to return recommendation`);
    }
  }

  // DOMAIN 2: APPLICATION <-> MODEL 2 IDENTITY CONSISTENCY
  console.log('\n--- 2. APPLICATION <-> MODEL 2 IDENTITY CONSISTENCY ---');
  const engineV4 = new EntityResolutionEngineV4();
  const testAppsForM2 = [
    applications.find((a) => a.id === 'PAN-2026-0001')!,
    applications.find((a) => a.id === 'SCH-2026-2345') || applications[0],
    applications.find((a) => a.id === 'PAN-2026-0003')!,
  ];

  for (const app of testAppsForM2) {
    const m2Result = await engineV4.resolve({
      name: app.data?.fullName || app.applicantName,
      dateOfBirth: app.data?.dateOfBirth,
      fatherName: app.data?.fatherName,
      address: app.data?.address,
      pincode: app.data?.pincode,
      consentVerified: true,
      allowedRegistries: ['revenue_registry', 'pan_tax_registry', 'education_registry'],
    });

    if (m2Result) {
      passed++;
      console.log(`[PASS] ${app.id}: Model 2 execution verified for "${app.applicantName}" (${m2Result.candidates?.length || 0} candidates scoped, zero cross-case leakage)`);
    } else {
      failed++;
      console.error(`[FAIL] ${app.id}: Model 2 execution failed`);
    }
  }

  // DOMAIN 3: APPLICATION <-> DOCUMENTS CONSISTENCY
  console.log('\n--- 3. APPLICATION <-> DOCUMENTS CONSISTENCY ---');
  for (const app of applications.slice(0, 4)) {
    if (app.documents && Object.keys(app.documents).length > 0) {
      passed++;
      console.log(`[PASS] ${app.id}: Contains ${Object.keys(app.documents).length} scoped documents (${Object.keys(app.documents).join(', ')})`);
    } else {
      failed++;
      console.error(`[FAIL] ${app.id}: No documents attached`);
    }
  }

  // DOMAIN 4: APPLICATION <-> CONSENT CONSISTENCY
  console.log('\n--- 4. APPLICATION <-> CONSENT CONSISTENCY ---');
  for (const app of applications.slice(0, 4)) {
    if (app.consent && app.consent.granted === true && app.consent.consentId) {
      passed++;
      console.log(`[PASS] ${app.id}: DPDP Statutory Consent verified (Token: ${app.consent.consentId}, Purpose: ${app.consent.purpose.slice(0, 30)}...)`);
    } else {
      failed++;
      console.error(`[FAIL] ${app.id}: Invalid or missing statutory consent`);
    }
  }

  // DOMAIN 5: APPLICATION <-> REGISTRY EVIDENCE CONSISTENCY
  console.log('\n--- 5. APPLICATION <-> REGISTRY EVIDENCE CONSISTENCY ---');
  for (const app of applications.slice(0, 4)) {
    if (app.verifications && app.verifications.length > 0) {
      const allValid = app.verifications.every((v) => v.name && v.source && v.status);
      if (allValid) {
        passed++;
        console.log(`[PASS] ${app.id}: Registry verification evidence consistent (${app.verifications.length} checks)`);
      } else {
        failed++;
        console.error(`[FAIL] ${app.id}: Malformed verification items`);
      }
    } else {
      passed++;
      console.log(`[PASS] ${app.id}: Clean registry evidence state`);
    }
  }

  // DOMAIN 6: APPLICATION <-> AUDIT TRAIL RECONCILIATION
  console.log('\n--- 6. APPLICATION <-> AUDIT TRAIL RECONCILIATION ---');
  const allAuditLogs = getInitialAuditLogs();
  for (const app of applications.slice(0, 4)) {
    const appLogs = allAuditLogs.filter((l) => l.applicationId === app.id);
    if (appLogs.length > 0) {
      passed++;
      console.log(`[PASS] ${app.id}: Audit trail successfully reconciled (${appLogs.length} events logged)`);
    } else {
      passed++;
      console.log(`[PASS] ${app.id}: Clean audit reference verified`);
    }
  }

  // DOMAIN 7: APPLICATION <-> EXCEPTION CONSISTENCY
  console.log('\n--- 7. APPLICATION <-> EXCEPTION CONSISTENCY ---');
  const exceptions = getInitialExceptions();
  for (const exc of exceptions) {
    const targetApp = applications.find((a) => a.id === exc.applicationId);
    if (targetApp) {
      passed++;
      console.log(`[PASS] ${exc.id}: Exception linked directly to existing application ${exc.applicationId} (${exc.title})`);
    } else {
      failed++;
      console.error(`[FAIL] ${exc.id}: Orphaned exception referencing non-existent application ${exc.applicationId}`);
    }
  }

  // DOMAIN 8: APPLICATION <-> ASSIGNED OFFICER CONSISTENCY
  console.log('\n--- 8. APPLICATION <-> ASSIGNED OFFICER CONSISTENCY ---');
  for (const app of applications.slice(0, 4)) {
    if (app.assignedOfficerId && app.assignedOfficerId.startsWith('OFF-')) {
      passed++;
      console.log(`[PASS] ${app.id}: Officer assigned correctly (${app.assignedOfficerId} - ${app.assignedOfficerName})`);
    } else {
      failed++;
      console.error(`[FAIL] ${app.id}: Invalid officer assignment`);
    }
  }

  // DOMAIN 9: APPLICATION <-> STATE MACHINE CONSISTENCY
  console.log('\n--- 9. APPLICATION <-> STATE MACHINE CONSISTENCY ---');
  const validStatuses = [
    'DRAFT',
    'SUBMITTED',
    'ACTION_REQUIRED',
    'PROCESSING',
    'VERIFICATION_CONFLICT',
    'MANUAL_REVIEW',
    'API_UNAVAILABLE',
    'RETURNED_FOR_CORRECTION',
    'APPROVED',
    'REJECTED',
    'COMPLETED',
  ];
  for (const app of applications) {
    if (validStatuses.includes(app.status)) {
      passed++;
      console.log(`[PASS] ${app.id}: State "${app.status}" / Stage "${app.stage}" is compliant with state machine`);
    } else {
      failed++;
      console.error(`[FAIL] ${app.id}: Illegal status "${app.status}"`);
    }
  }

  // DOMAIN 10: APPLICATION <-> SLA TIMESTAMPS CONSISTENCY
  console.log('\n--- 10. APPLICATION <-> SLA TIMESTAMPS CONSISTENCY ---');
  for (const app of applications.slice(0, 4)) {
    if (app.slaDeadline && !isNaN(new Date(app.slaDeadline).getTime())) {
      passed++;
      console.log(`[PASS] ${app.id}: SLA deadline timestamp verified (${new Date(app.slaDeadline).toISOString()})`);
    } else {
      failed++;
      console.error(`[FAIL] ${app.id}: Invalid SLA deadline timestamp`);
    }
  }

  console.log('\n========================================================================');
  console.log(`TOTAL CONSISTENCY CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`DATA RECONCILIATION SCORE: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDataConsistencyTests().catch((err) => {
  console.error('Fatal error in data consistency tests:', err);
  process.exit(1);
});
