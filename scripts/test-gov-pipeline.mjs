import fs from "fs";
import path from "path";
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
  resetPanDemoState,
} from "../src/lib/server/db.ts";
import {
  SYSTEM_SCHEMAS,
  mapToCanonical,
  mapFromCanonical,
  runCrossSystemValidation,
} from "../src/lib/server/data-mapper.ts";
import { simulateConnectorCall } from "../src/lib/server/connectors.ts";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function runTests() {
  console.log("\n========================================================");
  console.log("   FORMLY GOVERNMENT PIPELINE & ORCHESTRATION TESTS");
  console.log("========================================================\n");

  // 1. Reset Demo State
  resetPanDemoState();
  const initialApps = getPanApplications();
  assert(initialApps.length >= 4, `Initial applications loaded (found ${initialApps.length})`);

  // Verify the 4 specific prompt cases
  const pan0001 = getApplicationById("PAN-2026-0001");
  const pan0002 = getApplicationById("PAN-2026-0002");
  const pan0003 = getApplicationById("PAN-2026-0003");
  const pan0004 = getApplicationById("PAN-2026-0004");

  assert(pan0001 && pan0001.applicantName === "Sai Sankeerth", "Case 1: PAN-2026-0001 is Sai Sankeerth");
  assert(pan0001.stage === "OFFICER_REVIEW", "Case 1 stage is OFFICER_REVIEW");
  assert(pan0002 && pan0002.status === "API_UNAVAILABLE", "Case 2: PAN-2026-0002 is API_UNAVAILABLE");
  assert(pan0003 && pan0003.status === "VERIFICATION_CONFLICT", "Case 3: PAN-2026-0003 has DOB VERIFICATION_CONFLICT");
  assert(pan0004 && pan0004.status === "RETURNED_FOR_CORRECTION", "Case 4: PAN-2026-0004 is RETURNED_FOR_CORRECTION");

  // 2. Test Data Mapper
  console.log("\n--- Testing Data Mapper ---");
  const rawUidai = {
    full_name: "Sai Sankeerth",
    date_of_birth: "23/07/2004",
    mobile_no: "+91-1234567890",
    uid: "1234 5678 9876",
    pin_code: "500081",
  };
  const canonicalFromUidai = mapToCanonical("uidai", rawUidai);
  assert(canonicalFromUidai.fullName === "Sai Sankeerth", "Data Mapper normalized UIDAI full_name -> fullName");
  assert(canonicalFromUidai.dateOfBirth === "2004-07-23", "Data Mapper standardized UIDAI date format DD/MM/YYYY -> YYYY-MM-DD");
  assert(canonicalFromUidai.mobile === "1234567890", "Data Mapper normalized phone to 10 digits");

  const rawNsdl = {
    personName: "SAI SANKEERTH",
    dob: "23-07-2004",
    phone: "1234567890",
  };
  const canonicalFromNsdl = mapToCanonical("nsdl_pan", rawNsdl);
  assert(canonicalFromNsdl.fullName === "SAI SANKEERTH", "Data Mapper normalized NSDL personName -> fullName");
  assert(canonicalFromNsdl.dateOfBirth === "2004-07-23", "Data Mapper standardized NSDL date format DD-MM-YYYY -> YYYY-MM-DD");

  // 3. Test Cross-System Validation Engine
  console.log("\n--- Testing Cross-System Validation Engine ---");
  const matchingChecks = runCrossSystemValidation(
    {
      fullName: "Sai Sankeerth",
      fatherName: "Suresh Kumar",
      dateOfBirth: "2004-07-23",
      gender: "Male",
      mobile: "1234567890",
      email: "sankeerths615@gmail.com",
      aadhaarNumber: "123456789876",
      address: "Gandhi Nagar",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500081",
    },
    { full_name: "Sai Sankeerth", date_of_birth: "23/07/2004", pin_code: "500081" },
    { candidate_name: "Sai Sankeerth", birth_date: "2004-07-23" }
  );

  const nameCheck = matchingChecks.find((c) => c.id === "chk_name");
  const dobCheck = matchingChecks.find((c) => c.id === "chk_dob");
  assert(nameCheck && nameCheck.status === "VERIFIED", "Cross-system name match verified");
  assert(dobCheck && dobCheck.status === "VERIFIED", "Cross-system DOB match verified");

  // Mismatch check (like Case 3 Rahul Verma)
  const conflictChecks = runCrossSystemValidation(
    {
      fullName: "Rahul Verma",
      fatherName: "Kishore Verma",
      dateOfBirth: "1999-05-14",
      gender: "Male",
      mobile: "9123456780",
      email: "rahul@test.com",
      aadhaarNumber: "776655443322",
      address: "Andheri",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400069",
    },
    { full_name: "Rahul Verma", date_of_birth: "2000-05-14", pin_code: "400069" },
    { candidate_name: "Rahul Verma", birth_date: "1999-05-14" }
  );
  const conflictDobCheck = conflictChecks.find((c) => c.id === "chk_dob");
  assert(conflictDobCheck && conflictDobCheck.status === "CONFLICT", "Conflict detected: DOB 1999 vs 2000 flagged CONFLICT");

  // 4. Test Officer Decision & Automated Pipeline Propagation
  console.log("\n--- Testing Officer Accept & Physical Pipeline ---");
  const acceptedApp = officerAcceptApplication("PAN-2026-0001", "OFF-PAN-7042", "Officer Sai Sankeerth", "All credentials match.");
  assert(acceptedApp.stage === "APPROVED", "Officer Accept transitioned stage to APPROVED");
  assert(acceptedApp.physicalCard?.panNumber !== undefined, `PAN generated: ${acceptedApp.physicalCard?.panNumber}`);

  // Advance to PAN Generation
  const panGenStage = advancePhysicalPipelineStage("PAN-2026-0001");
  assert(panGenStage.stage === "PAN_GENERATION", "Pipeline advanced to PAN_GENERATION");

  // Advance to Printing
  const printStage = advancePhysicalPipelineStage("PAN-2026-0001");
  assert(printStage.stage === "CARD_PRINTING", "Pipeline advanced to CARD_PRINTING");

  // Advance to Dispatched
  const dispatchStage = advancePhysicalPipelineStage("PAN-2026-0001");
  assert(dispatchStage.stage === "DISPATCHED", "Pipeline advanced to DISPATCHED");
  assert(dispatchStage.physicalCard?.trackingNumber !== undefined, `Speed post tracking number assigned: ${dispatchStage.physicalCard?.trackingNumber}`);

  // Advance to Delivered
  const deliveredStage = advancePhysicalPipelineStage("PAN-2026-0001");
  assert(deliveredStage.stage === "DELIVERED", "Pipeline advanced to DELIVERED");
  assert(deliveredStage.status === "COMPLETED", "Status set to COMPLETED upon delivery");

  // 5. Test Return for Correction & Citizen Resubmission
  console.log("\n--- Testing Return for Correction & Citizen Resubmission ---");
  const returnedApp = officerReturnApplication("PAN-2026-0004", "OFF-PAN-7042", "Officer Sai", "Address proof cropped");
  assert(returnedApp.status === "RETURNED_FOR_CORRECTION", "Returned status set to RETURNED_FOR_CORRECTION");

  const resubmittedApp = citizenResubmitCorrection("PAN-2026-0004", {
    address: "Plot 45, Indiranagar 2nd Stage, Bengaluru - 560038",
    updatedDocumentNote: "High-resolution full utility bill re-uploaded",
  });
  assert(resubmittedApp.status === "ACTION_REQUIRED", "Citizen resubmission re-placed application into ACTION_REQUIRED on officer desk");
  assert(resubmittedApp.documents.addressProof.status === "VERIFIED", "Address proof marked revalidated");

  // 6. Test Connector Retry for PAN-2026-0002
  console.log("\n--- Testing Connector Retry for Case 2 ---");
  const retriedApp = retryApplicationVerification("PAN-2026-0002");
  assert(retriedApp.status === "ACTION_REQUIRED", "Connector retry recovered case 2 into ACTION_REQUIRED");
  assert(retriedApp.verifications.every((v) => v.status === "VERIFIED"), "All verifications marked verified after retry");
  assert(retriedApp.documents.dobProof.status === "VERIFIED", "dobProof document status updated to VERIFIED on retry");

  // 7. Test Monotonic ID Generation
  console.log("\n--- Testing Monotonic Unique ID Generation ---");
  const newApp1 = createPanApplication({
    userId: "u_test_1",
    applicantName: "Test Citizen One",
    applicantEmail: "test1@example.com",
    applicantPhone: "9876543210",
    consentGranted: true,
    citizenData: {
      fullName: "Test Citizen One",
      fatherName: "Parent One",
      dateOfBirth: "2000-01-01",
      gender: "Male",
      mobile: "9876543210",
      email: "test1@example.com",
      aadhaarNumber: "111122223333",
      address: "123 Main St",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500001",
    },
  });
  assert(newApp1.id === "PAN-2026-0005", `First new application has unique monotonic ID: ${newApp1.id}`);

  const newApp2 = createPanApplication({
    userId: "u_test_2",
    applicantName: "Test Citizen Two",
    applicantEmail: "test2@example.com",
    applicantPhone: "9876543211",
    consentGranted: true,
    citizenData: {
      fullName: "Test Citizen Two",
      fatherName: "Parent Two",
      dateOfBirth: "2001-02-02",
      gender: "Female",
      mobile: "9876543211",
      email: "test2@example.com",
      aadhaarNumber: "222233334444",
      address: "456 Oak Rd",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500002",
    },
  });
  assert(newApp2.id === "PAN-2026-0006", `Second new application has unique monotonic ID: ${newApp2.id}`);

  // 8. Test State Transition Guards
  console.log("\n--- Testing State Transition Guards ---");
  // Cannot advance physical pipeline from unapproved OFFICER_REVIEW
  const unapprovedStage = advancePhysicalPipelineStage("PAN-2026-0003");
  assert(unapprovedStage.stage === "GOVERNMENT_PROCESSING", "advancePhysicalPipelineStage refused to advance unapproved stage");

  // Reject an application
  const rejectedApp = officerRejectApplication("PAN-2026-0003", "OFF-PAN-7042", "Officer Sai", "Irreconcilable demographic mismatch");
  assert(rejectedApp.status === "REJECTED", "Case 3 successfully rejected");

  // Cannot accept a rejected application
  let acceptRejectedThrew = false;
  try {
    officerAcceptApplication("PAN-2026-0003", "OFF-PAN-7042", "Officer Sai");
  } catch (err) {
    acceptRejectedThrew = true;
  }
  assert(acceptRejectedThrew, "Guard blocked accepting an already REJECTED application");

  // Cannot return an already approved/delivered application
  let returnDeliveredThrew = false;
  try {
    officerReturnApplication("PAN-2026-0001", "OFF-PAN-7042", "Officer Sai", "Try returning delivered card");
  } catch (err) {
    returnDeliveredThrew = true;
  }
  assert(returnDeliveredThrew, "Guard blocked returning an already approved/delivered application");

  // 9. Test Audit Log Trail & Tamper Verification
  console.log("\n--- Testing Audit Logs ---");
  const logs = getAuditLogs("PAN-2026-0001");
  assert(logs.length >= 5, `Audit log entries captured for PAN-2026-0001 (found ${logs.length})`);
  assert(logs.every((l) => Boolean(l.tamperHash)), "All audit entries have SHA-256 tamper verification hashes");

  console.log("\n========================================================");
  console.log("   ALL ORCHESTRATION PIPELINE TESTS PASSED (100%)");
  console.log("========================================================\n");
}

runTests().catch((e) => {
  console.error("Test suite failed:", e);
  process.exit(1);
});
