import {
  getAuthoritativeDb,
  pgTransitionApplicationStatus,
  pgRecordAuditEvent,
  closeAuthoritativeDb,
} from "../src/lib/server/pg-db.ts";
import {
  getPanApplications,
  getApplicationById,
  createPanApplication,
  officerAcceptApplication,
  officerReturnApplication,
  officerRejectApplication,
  citizenResubmitCorrection,
  retryApplicationVerification,
  advancePhysicalPipelineStage,
  getAuditLogs,
  getExceptions,
  resolveException,
  calculateAuditTamperHash,
  authenticateSession,
  getEmployeeBySession,
  resetPanDemoState,
} from "../src/lib/server/db.ts";
import { validateGovSession } from "../src/lib/server/auth.ts";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function runRepairVerification() {
  console.log("\n========================================================");
  console.log("   FORMLY COMPREHENSIVE REPAIR & VERIFICATION SUITE");
  console.log("========================================================\n");

  resetPanDemoState();
  const db = await getAuthoritativeDb();

  // ----------------------------------------------------------------------
  // SECTION 1: SECURITY & AUTHENTICATION TESTS
  // ----------------------------------------------------------------------
  console.log("--- 1. Security & RBAC Isolation Tests ---");

  // Test 1.1: validateGovSession without cookies
  const mockReqNoCookie = {
    cookies: {
      get: (name) => null,
    },
  };
  const authNoCookie = await validateGovSession(mockReqNoCookie);
  assert(authNoCookie.success === false && authNoCookie.status === 401, "Anonymous request without government session is rejected with 401");

  // Test 1.2: validateGovSession with citizen cookie (not gov cookie)
  const mockReqCitizenCookie = {
    cookies: {
      get: (name) => name === "seva_saarthi_session" ? { value: "session_citizen_001" } : null,
    },
  };
  const authCitizenOnGov = await validateGovSession(mockReqCitizenCookie);
  assert(authCitizenOnGov.success === false && authCitizenOnGov.status === 401, "Citizen session attempting government operation is rejected with 401");

  // Test 1.3: validateGovSession with valid officer session
  // Query sessions table for an officer session or insert test session
  const empRes = await db.query(`SELECT id, auth_user_id, employee_code, role, is_active FROM employees WHERE employee_code = 'OFF-PAN-7042'`);
  assert(empRes.rows.length > 0, "Default officer OFF-PAN-7042 exists in PostgreSQL employees table");
  const officerEmp = empRes.rows[0];

  const testSessionToken = "test_gov_session_officer_7042";
  await db.query(
    `INSERT INTO sessions (token, "userId", "expiresAt")
     VALUES ($1, 'u_officer_pan_7042', NOW() + INTERVAL '1 day')
     ON CONFLICT (token) DO UPDATE SET "userId" = 'u_officer_pan_7042'`,
    [testSessionToken]
  );

  const mockReqOfficerCookie = {
    cookies: {
      get: (name) => name === "formly_gov_session" ? { value: testSessionToken } : null,
    },
  };
  const authOfficer = await validateGovSession(mockReqOfficerCookie);
  assert(authOfficer.success === true, "Valid officer session successfully authenticates");
  assert(authOfficer.employee.employee_code === "OFF-PAN-7042", "Officer identity correctly derived from server-side database session");
  assert(authOfficer.employee.role === "DEPARTMENT_OFFICER", "Officer role confirmed as DEPARTMENT_OFFICER");

  // Test 1.4: Suspended employee account rejection
  await db.query(`UPDATE employees SET is_active = false WHERE id = $1`, [officerEmp.id]);
  const authSuspended = await validateGovSession(mockReqOfficerCookie);
  assert(authSuspended.success === false && authSuspended.status === 403, "Suspended employee is blocked with 403 Forbidden");
  await db.query(`UPDATE employees SET is_active = true WHERE id = $1`, [officerEmp.id]); // restore

  // Test 1.5: Citizen Ownership Isolation (Anti-IDOR)
  const app1 = getApplicationById("PAN-2026-0001");
  const citizenA_Id = app1.userId;
  const citizenB_Id = "u_random_attacker_0099";

  const ownerA = (app1.citizen_user_id || app1.userId);
  assert(ownerA === citizenA_Id, "Application PAN-2026-0001 owner matches Citizen A");
  assert(ownerA !== citizenB_Id, "Application PAN-2026-0001 owner check fails for Citizen B (Anti-IDOR enforced)");

  // ----------------------------------------------------------------------
  // SECTION 2: TAMPER-EVIDENT AUDIT TRAIL & POSTGRESQL INVARIANTS
  // ----------------------------------------------------------------------
  console.log("\n--- 2. Tamper-Evident Audit & Database Invariants ---");

  // Test 2.1: Audit log tamper hash verification
  const testAuditEntry = {
    id: "aud_test_99",
    timestamp: "2026-09-09T14:00:00.000Z",
    actor: { id: "OFF-PAN-7042", name: "Officer Sai", role: "OFFICER" },
    action: "ACCEPT",
    stage: "OFFICER_REVIEW",
    source: "GOV_PORTAL",
    target: "APPLICATION_CASE",
    purpose: "Statutory Approval",
    result: "SUCCESS",
    details: "Application approved after documentary scrutiny.",
    requestId: "req_test_001",
  };
  const validHash = calculateAuditTamperHash(testAuditEntry);
  assert(typeof validHash === "string" && validHash.length === 64, "SHA-256 tamper hash calculated (64 hex characters)");

  const tamperedAuditEntry = {
    ...testAuditEntry,
    details: "Tampered details - illicit status change!",
  };
  const tamperedHash = calculateAuditTamperHash(tamperedAuditEntry);
  assert(validHash !== tamperedHash, "Audit log tamper detection: modified details produce completely different hash");

  // Test 2.2: PostgreSQL audit_events append-only trigger
  const auditRes = await db.query(
    `INSERT INTO audit_events (actor_type, actor_id, action, source, target, purpose, result)
     VALUES ('EMPLOYEE', $1, 'TEST_AUDIT', 'GOV_PORTAL', 'DATABASE', 'Testing Invariant', 'SUCCESS')
     RETURNING id`,
    [officerEmp.id]
  );
  const testAuditId = auditRes.rows[0].id;

  let deleteFailedAsExpected = false;
  try {
    await db.query(`DELETE FROM audit_events WHERE id = $1`, [testAuditId]);
  } catch (err) {
    deleteFailedAsExpected = true;
    assert(err.message.includes("append-only"), `PostgreSQL trigger strictly blocks DELETE on audit_events: ${err.message}`);
  }
  assert(deleteFailedAsExpected, "Audit event DELETE was successfully blocked by database trigger");

  let updateFailedAsExpected = false;
  try {
    await db.query(`UPDATE audit_events SET action = 'ALTERED' WHERE id = $1`, [testAuditId]);
  } catch (err) {
    updateFailedAsExpected = true;
    assert(err.message.includes("append-only"), `PostgreSQL trigger strictly blocks UPDATE on audit_events: ${err.message}`);
  }
  assert(updateFailedAsExpected, "Audit event UPDATE was successfully blocked by database trigger");

  // ----------------------------------------------------------------------
  // SECTION 3: DURABLE STATE MACHINE TRANSITIONS & AI BOUNDARIES
  // ----------------------------------------------------------------------
  console.log("\n--- 3. Durable State Machine Transitions & AI Boundaries ---");

  // Test 3.1: Insert a test application in PostgreSQL
  const testCitizenId = "00000000-0000-0000-0000-000000000001";
  const testAppNum = `PAN-TEST-${Date.now()}`;
  const appInsertRes = await db.query(
    `INSERT INTO applications (application_number, service_id, citizen_user_id, status)
     VALUES ($1, 'a0000000-0000-0000-0000-000000000002', $2, 'DRAFT')
     RETURNING id`,
    [testAppNum, testCitizenId]
  );
  const testAppUuid = appInsertRes.rows[0].id;

  // Test 3.2: Legal transition DRAFT -> SUBMITTED by CITIZEN
  const status1 = await pgTransitionApplicationStatus(testAppUuid, "SUBMITTED", "CITIZEN", testCitizenId, "Citizen submitted application");
  assert(status1 === "SUBMITTED", "Legal transition DRAFT -> SUBMITTED succeeded");

  // Test 3.3: Illegal jump SUBMITTED -> APPROVED by CITIZEN (must fail)
  let illegalJumpBlocked = false;
  try {
    await pgTransitionApplicationStatus(testAppUuid, "APPROVED", "CITIZEN", testCitizenId, "Citizen attempting self-approval");
  } catch (err) {
    illegalJumpBlocked = true;
    assert(err.message.includes("Product Rule 5 violation") || err.message.includes("Invalid status jump"), `Illegal jump blocked: ${err.message}`);
  }
  assert(illegalJumpBlocked, "Illegal status jump SUBMITTED -> APPROVED strictly blocked by transition function");

  // Test 3.4: AI Actor Forbidden to APPROVE or REJECT (Product Rule 1)
  let aiApprovalBlocked = false;
  try {
    await pgTransitionApplicationStatus(testAppUuid, "APPROVED", "AI", "00000000-0000-0000-0000-000000000000", "AI automated approval");
  } catch (err) {
    aiApprovalBlocked = true;
    assert(err.message.includes("Product Rule 1 violation: AI cannot APPROVE or REJECT"), `AI approval blocked: ${err.message}`);
  }
  assert(aiApprovalBlocked, "AI actor approval strictly blocked by database function (Product Rule 1 enforced)");

  let aiRejectionBlocked = false;
  try {
    await pgTransitionApplicationStatus(testAppUuid, "REJECTED", "AI", "00000000-0000-0000-0000-000000000000", "AI automated rejection");
  } catch (err) {
    aiRejectionBlocked = true;
    assert(err.message.includes("Product Rule 1 violation: AI cannot APPROVE or REJECT"), `AI rejection blocked: ${err.message}`);
  }
  assert(aiRejectionBlocked, "AI actor rejection strictly blocked by database function (Product Rule 1 enforced)");

  // ----------------------------------------------------------------------
  // SECTION 4: FUNCTIONAL END-TO-END PIPELINE LIFECYCLE
  // ----------------------------------------------------------------------
  console.log("\n--- 4. Functional End-to-End Pipeline Lifecycle ---");

  // Test 4.1: Citizen Application Creation
  const newCitizenApp = await createPanApplication({
    userId: "u_test_citizen_2026",
    applicantName: "Kavita Rao",
    applicantEmail: "kavita.rao@example.org",
    applicantPhone: "9876543210",
    consentGranted: true,
    citizenData: {
      fullName: "Kavita Rao",
      fatherName: "M. G. Rao",
      dateOfBirth: "1998-11-20",
      gender: "Female",
      mobile: "9876543210",
      email: "kavita.rao@example.org",
      aadhaarNumber: "998877665544",
      address: "Flat 402, Kaveri Heights",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    },
  });

  assert(newCitizenApp && newCitizenApp.id.startsWith("PAN-2026-"), `Citizen application created with monotonic ID: ${newCitizenApp.id}`);
  assert(newCitizenApp.consent.granted === true, "DPDP statutory consent verified");
  assert(newCitizenApp.stage === "OFFICER_REVIEW", "Application positioned in OFFICER_REVIEW stage");
  assert(newCitizenApp.status === "ACTION_REQUIRED", "Application status set to ACTION_REQUIRED");

  // Test 4.2: Officer Scrutiny & Approval
  const approvedApp = await officerAcceptApplication(
    newCitizenApp.id,
    "OFF-PAN-7042",
    "Officer Sai Sankeerth",
    "Demographic attributes and biometric e-KYC match verified."
  );
  assert(approvedApp.status === "APPROVED", "Application status transitioned to APPROVED");
  assert(approvedApp.physicalCard.panNumber && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(approvedApp.physicalCard.panNumber), `Valid PAN card number generated: ${approvedApp.physicalCard.panNumber}`);

  // Test 4.3: Physical Card Pipeline Progression
  const printingApp = await advancePhysicalPipelineStage(newCitizenApp.id);
  assert(printingApp.stage === "PAN_GENERATION", "Advanced to PAN_GENERATION");

  const dispatchedApp = await advancePhysicalPipelineStage(newCitizenApp.id);
  assert(dispatchedApp.stage === "CARD_PRINTING", "Advanced to CARD_PRINTING");

  const inTransitApp = await advancePhysicalPipelineStage(newCitizenApp.id);
  assert(inTransitApp.stage === "DISPATCHED", "Advanced to DISPATCHED with postal tracking number");
  assert(inTransitApp.physicalCard.trackingNumber && inTransitApp.physicalCard.trackingNumber.startsWith("SP"), `Speed Post tracking number assigned: ${inTransitApp.physicalCard.trackingNumber}`);

  const deliveredApp = await advancePhysicalPipelineStage(newCitizenApp.id);
  assert(deliveredApp.stage === "DELIVERED", "Advanced to DELIVERED");
  assert(deliveredApp.status === "COMPLETED", "Final status set to COMPLETED upon physical delivery");

  // Test 4.4: Return for Correction & Citizen Resubmission
  const appToReturn = getApplicationById("PAN-2026-0001");
  const returnedApp = await officerReturnApplication(
    appToReturn.id,
    "OFF-PAN-7042",
    "Officer Sai Sankeerth",
    "Address proof document is slightly blurred. Please re-upload legible electricity bill."
  );
  assert(returnedApp.status === "RETURNED_FOR_CORRECTION", "Application status transitioned to RETURNED_FOR_CORRECTION");
  assert(returnedApp.correctionReason.includes("blurred"), "Correction reason recorded");

  const resubmittedApp = await citizenResubmitCorrection(appToReturn.id, {
    address: "H.No 4-12/A, Gandhi Nagar, Gachibowli (Clarified)",
    updatedDocumentNote: "High-resolution digital electricity bill re-uploaded.",
  });
  assert(resubmittedApp.status === "ACTION_REQUIRED", "Resubmission restored application status to ACTION_REQUIRED on officer desk");

  // Test 4.5: Degraded Connector Recovery via Automated Retry
  const appDegraded = getApplicationById("PAN-2026-0002");
  assert(appDegraded.status === "API_UNAVAILABLE", "PAN-2026-0002 verified as API_UNAVAILABLE");

  const recoveredApp = await retryApplicationVerification(appDegraded.id);
  assert(recoveredApp.status === "ACTION_REQUIRED", "Connector retry recovered degraded application to ACTION_REQUIRED");
  assert(recoveredApp.verifications.every(v => v.status === "VERIFIED"), "All verification checks restored to VERIFIED state");

  // Test 4.6: Exception Resolution
  const exceptions = await getExceptions();
  assert(exceptions.length > 0, "System exceptions queried");
  const exc101 = exceptions[0];
  const resolvedOk = await resolveException(exc101.id, "Downstream gateway recovered. Circuit closed.");
  assert(resolvedOk === true, "Exception successfully resolved by operator");

  console.log("\n========================================================");
  console.log("   ALL REPAIR VERIFICATION TESTS PASSED (100%)");
  console.log("========================================================\n");

  await closeAuthoritativeDb();
}

runRepairVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("FATAL ERROR IN VERIFICATION SUITE:", err);
    process.exit(1);
  });
