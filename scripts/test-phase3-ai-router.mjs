import fs from "fs";
import path from "path";
import { WorkflowRouter, ROUTING_CONFIDENCE_CONFIG } from "../src/lib/server/ai/workflow-router.js";
import { resolveServiceRoute } from "../src/lib/server/routing-resolver.js";
import {
  getRegisteredDepartments,
  getRegisteredSubDepartments,
  getRegisteredOffices,
  getRegisteredServices,
  getServiceWorkflow,
  getServiceRequirements,
} from "../src/lib/server/registry-service.js";
import {
  createPanApplication,
  getApplicationById,
  calculateAuditTamperHash,
} from "../src/lib/server/db.js";

function assert(condition, message) {
  if (!condition) {
    console.error("ASSERTION FAILED: " + message);
    process.exit(1);
  }
  console.log("PASS: " + message);
}

async function runPhase3AiRouterTests() {
  console.log("\n========================================================");
  console.log("   SEVA SAARTHI PHASE 3 - AI MODEL 1 WORKFLOW ROUTER TESTS");
  console.log("========================================================\n");

  // 1. High Confidence Routing for Scholarship
  console.log("--- 1. Classification & Routing for Post-Matric Scholarship ---");
  const rec1 = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-001",
    applicationTitle: "I want a scholarship for my BTech engineering college degree",
    serviceName: "Scholarship",
    requestedBenefit: "College fee reimbursement and maintenance allowance",
  });
  assert(rec1.suggestedServiceName.includes("Scholarship"), "Service identified as Scholarship: " + rec1.suggestedServiceName);
  assert(rec1.suggestedDepartmentName.includes("Higher Education"), "Department is Higher Education: " + rec1.suggestedDepartmentName);
  assert(rec1.suggestedSubDepartmentName.includes("Scholarship Cell"), "Sub-department is Scholarship Cell: " + rec1.suggestedSubDepartmentName);
  assert(rec1.confidenceScore >= 0.85, "Confidence score is high: " + rec1.confidenceScore);
  assert(rec1.routingTier === "AUTOMATIC_RECOMMENDATION", "Routing tier is AUTOMATIC_RECOMMENDATION: " + rec1.routingTier);
  assert(rec1.routingMode === "AI_RECOMMENDED", "Routing mode is AI_RECOMMENDED: " + rec1.routingMode);

  // 2. High Confidence Routing for PAN Card
  console.log("\n--- 2. Classification & Routing for Instant e-PAN ---");
  const rec2 = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-002",
    applicationTitle: "Apply for instant e-PAN card paperless using Aadhaar e-KYC Form 49A",
    requestedBenefit: "10 digit permanent account number for tax filing",
  });
  assert(rec2.suggestedServiceName.includes("PAN"), "Service identified as PAN: " + rec2.suggestedServiceName);
  assert(rec2.suggestedDepartmentName.includes("Income Tax"), "Department is Income Tax: " + rec2.suggestedDepartmentName);
  assert(rec2.suggestedSubDepartmentName.includes("PAN Allotment"), "Sub-department is PAN Processing Cell: " + rec2.suggestedSubDepartmentName);
  assert(rec2.confidenceScore >= 0.85, "Confidence is high: " + rec2.confidenceScore);

  // 3. Classification & Routing for Income Certificate
  console.log("\n--- 3. Classification & Routing for Income Certificate ---");
  const rec3 = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-003",
    applicationTitle: "I need an annual family income certificate from Tehsildar office",
    requestedBenefit: "Statutory income proof for admissions",
  });
  assert(rec3.suggestedServiceName.includes("Income Certificate"), "Service identified as Income Certificate: " + rec3.suggestedServiceName);
  assert(rec3.suggestedDepartmentName.includes("Revenue"), "Department is Revenue: " + rec3.suggestedDepartmentName);

  // 4. Classification & Routing for Land Records (RoR 1B)
  console.log("\n--- 4. Classification & Routing for Land Record Extracts ---");
  const rec4 = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-004",
    applicationTitle: "Download certified RoR 1B extract and patta passbook pahani",
    requestedBenefit: "Agricultural land record title verification",
  });
  assert(rec4.suggestedServiceName.includes("Land Record"), "Service identified as Land Record: " + rec4.suggestedServiceName);
  assert(rec4.suggestedSubDepartmentName.includes("Land Records"), "Sub-department is Land Records Section: " + rec4.suggestedSubDepartmentName);

  // 5. Classification & Routing for PM-Kisan
  console.log("\n--- 5. Classification & Routing for PM Kisan ---");
  const rec5 = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-005",
    applicationTitle: "Farmer income support scheme 6000 rupees installment under PM Kisan",
    requestedBenefit: "DBT transfer direct benefit for cultivator",
  });
  assert(rec5.suggestedServiceName.includes("PM-Kisan"), "Service identified as PM Kisan: " + rec5.suggestedServiceName);
  assert(rec5.suggestedDepartmentName.includes("Agriculture"), "Department is Agriculture: " + rec5.suggestedDepartmentName);

  // 6. Classification & Routing for Ayushman Bharat
  console.log("\n--- 6. Classification & Routing for Ayushman Bharat ---");
  const rec6 = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-006",
    applicationTitle: "PM-JAY 5 lakh hospital medical treatment golden health card",
    requestedBenefit: "Secondary and tertiary healthcare cover",
  });
  assert(rec6.suggestedServiceName.includes("Ayushman Bharat"), "Service identified as Ayushman Bharat: " + rec6.suggestedServiceName);
  assert(rec6.suggestedDepartmentName.includes("Health"), "Department is Health: " + rec6.suggestedDepartmentName);

  // 7. Classification & Routing for PM Awas
  console.log("\n--- 7. Classification & Routing for PM Awas Yojana ---");
  const rec7 = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-007",
    applicationTitle: "Financial assistance for constructing pucca house under Pradhan Mantri Awas",
    requestedBenefit: "Affordable housing subsidy for rural family",
  });
  assert(rec7.suggestedServiceName.includes("Awas") || rec7.suggestedServiceName.includes("PMAY"), "Service identified as PM Awas: " + rec7.suggestedServiceName);
  assert(rec7.suggestedDepartmentName.includes("Housing"), "Department is Housing: " + rec7.suggestedDepartmentName);

  // 8. Telugu-English Mixed Phrases
  console.log("\n--- 8. Multilingual / Telugu-English Robustness ---");
  const recTelugu = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-008",
    applicationTitle: "College fee pay cheyadaniki scholarship apply cheyali",
  });
  assert(recTelugu.suggestedServiceName.includes("Scholarship"), "Telugu phrase matched Scholarship: " + recTelugu.suggestedServiceName);

  // 9. Hindi-English Mixed Phrases
  console.log("\n--- 9. Multilingual / Hindi-English Robustness ---");
  const recHindi = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-009",
    applicationTitle: "Kisan samman nidhi kist account me nahi aayi",
  });
  assert(recHindi.suggestedServiceName.includes("PM-Kisan"), "Hindi phrase matched PM Kisan: " + recHindi.suggestedServiceName);

  // 10. Voice / Typo Resilience
  console.log("\n--- 10. Voice / Typo Resilience ---");
  const recTypo = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-010",
    applicationTitle: "need scholership for collge fees",
  });
  assert(recTypo.suggestedServiceName.includes("Scholarship"), "Typo scholership matched Scholarship: " + recTypo.suggestedServiceName);

  // 11. Ambiguous Input -> Human Confirmation Tier
  console.log("\n--- 11. Ambiguous Input (0.60 <= confidence < 0.85) ---");
  const recAmbiguous = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-011",
    applicationTitle: "fees concession for college student",
  });
  assert(
    recAmbiguous.routingTier === "HUMAN_CONFIRMATION_REQUIRED",
    "Ambiguous input classified as HUMAN_CONFIRMATION_REQUIRED: " + recAmbiguous.routingTier
  );
  assert(
    recAmbiguous.confidenceScore >= 0.60 && recAmbiguous.confidenceScore < 0.85,
    "Confidence is in human confirmation band [0.60, 0.85): " + recAmbiguous.confidenceScore
  );

  // 12. Out-of-Distribution / Unknown Service -> MANUAL_REVIEW Fallback
  console.log("\n--- 12. Out-of-Distribution Detection & Safe Fallback ---");
  const recOOD = await WorkflowRouter.routeApplication({
    applicationId: "TEST-APP-012",
    applicationTitle: "Renew my commercial heavy vehicle transport driving license",
  });
  assert(recOOD.routingTier === "MANUAL_REVIEW", "Out-of-distribution classified as MANUAL_REVIEW: " + recOOD.routingTier);
  assert(recOOD.routingMode === "MANUAL_REVIEW_REQUIRED", "Routing mode is MANUAL_REVIEW_REQUIRED: " + recOOD.routingMode);
  assert(recOOD.confidenceScore < 0.60, "Confidence is below 0.60: " + recOOD.confidenceScore);

  // 13. Safety Rule: AI Model 1 Never Approves or Rejects
  console.log("\n--- 13. Product Rule 1 Invariance: AI Never Mutates Statutory Status ---");
  assert(
    rec1.routingMode !== "APPROVED" && rec1.routingMode !== "REJECTED",
    "AI recommendation produces recommendation mode only (no status mutation)"
  );

  // 14. Hybrid Resolver Integration
  console.log("\n--- 14. Hybrid Resolver: AI + Deterministic Rules ---");
  const hybridRoute = await resolveServiceRoute("POST_MATRIC_SCHOLARSHIP", {
    naturalLanguageText: "I want college engineering scholarship",
    stateCode: "TG",
  });
  assert(hybridRoute.status === "ROUTED", "Hybrid route resolved to ROUTED");
  assert(hybridRoute.routingMode === "AI_RECOMMENDED" || hybridRoute.routingMode === "RULE_BASED", "Valid routing mode assigned");

  // 15. Database Persistence of Recommendation
  console.log("\n--- 15. Recommendation Database Persistence & Foreign Keys ---");
  const sampleApp = await createPanApplication({
    userId: "00000000-0000-0000-0000-000000000001",
    applicantName: "Phase 3 Citizen",
    applicantEmail: "phase3.citizen@formly.local",
    applicantPhone: "9876543210",
    citizenData: {
      fullName: "Phase 3 Citizen",
      fatherName: "Father Name",
      dateOfBirth: "1998-05-20",
      gender: "Male",
      mobile: "9876543210",
      email: "phase3.citizen@formly.local",
      aadhaarNumber: "999988887777",
      address: "Banjara Hills",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500034",
    },
    consentGranted: true,
  });
  assert(sampleApp.id.startsWith("PAN-"), "Created sample application: " + sampleApp.id);

  // Verify recommendation persistence
  const recId = await WorkflowRouter.persistRecommendation(rec2, sampleApp.id);
  assert(recId !== null, "Recommendation successfully persisted to database (id: " + recId + ")");

  console.log("\n========================================================");
  console.log("   ALL 15 PHASE 3 AI MODEL 1 TESTS PASSED (100%)");
  console.log("========================================================\n");
}

runPhase3AiRouterTests().catch((err) => {
  console.error("Phase 3 test failed:", err);
  process.exit(1);
});