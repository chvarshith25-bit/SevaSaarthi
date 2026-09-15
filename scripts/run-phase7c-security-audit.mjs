import { getAuthoritativeDb, pgQuery, closeAuthoritativeDb } from "../src/lib/server/pg-db.ts";
import { resolveApplicationIdentity, getAuthorizedRegistriesForService } from "../src/lib/server/ai/orchestrator.ts";
import { WorkflowRouter } from "../src/lib/server/ai/workflow-router.ts";
import { EntityResolutionEngine } from "../src/lib/server/ai/entity-resolution/engine.ts";

async function main() {
  console.log("========================================================");
  console.log("   PHASE 7C: COMPREHENSIVE SECURITY & API AUDIT SUITE   ");
  console.log("========================================================");

  await getAuthoritativeDb();

  let passCount = 0;
  let testCount = 0;

  function assert(condition, message) {
    testCount++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  // 1. Consent Enforcement Gate (AI Model 2)
  console.log("\n--- 1. Testing AI Model 2 Statutory Consent Verification Gate ---");
  try {
    await EntityResolutionEngine.matchEntity({
      name: "Sai Sankeerth",
      allowedRegistries: ["revenue_registry"],
      consentVerified: false,
      purpose: "Test unconsented retrieval"
    });
    assert(false, "Unconsented Model 2 query must be blocked");
  } catch (err) {
    assert(err.message.includes("DPDP Statutory Consent Violation"), "DPDP Consent gate strictly threw violation error on consentVerified=false");
  }

  // 2. Caller-Restricted Authorized Registries
  console.log("\n--- 2. Testing Authorized Registry Boundaries ---");
  const scholarshipRegs = getAuthorizedRegistriesForService("Post-Matric Scholarship");
  assert(
    scholarshipRegs.includes("revenue_registry") && scholarshipRegs.includes("education_registry") && !scholarshipRegs.includes("health_registry"),
    "Scholarship workflow strictly permits only revenue & education registries and excludes health/housing"
  );

  const landRegs = getAuthorizedRegistriesForService("ROR Mutation");
  assert(
    landRegs.includes("land_registry") && !landRegs.includes("pan_tax_registry"),
    "Land workflow strictly excludes pan_tax_registry"
  );

  // 3. Ground Truth Isolation from Production Inference
  console.log("\n--- 3. Testing Ground-Truth & Master ID Isolation ---");
  const sampleRes = await EntityResolutionEngine.matchEntity({
    name: "Sai Sankeerth",
    allowedRegistries: ["revenue_registry"],
    consentVerified: true,
    purpose: "Audit check"
  });
  const hasMasterIdLeaked = sampleRes.candidates.some(c => "master_citizen_id" in c || "ground_truth_match" in c);
  assert(!hasMasterIdLeaked, "Model 2 candidate output contains zero oracle master_citizen_id or ground_truth_match fields");

  // 4. Product Rule 1 Invariance: AI Never Modifies Statutory Application Status
  console.log("\n--- 4. Testing AI Decision Invariance ---");
  const routerRes = await WorkflowRouter.routeApplication({
    applicationId: "AUDIT-001",
    applicationTitle: "Post-Matric Scholarship",
    serviceName: "Post-Matric Scholarship Scheme (NSP)"
  });
  assert(
    routerRes.routingMode === "AUTOMATIC_ROUTED" || routerRes.routingMode === "HUMAN_CONFIRMATION_REQUIRED",
    "Model 1 returns advisory routing recommendations without declaring statutory approval/rejection"
  );

  // 5. Database Constraints & Immutable Audit Events Trigger
  console.log("\n--- 5. Testing Database Immutability & Audit Trigger ---");
  try {
    await pgQuery("DELETE FROM audit_events WHERE 1=1");
    assert(false, "DELETE on audit_events should be prohibited by trigger");
  } catch (err) {
    assert(
      err.message.includes("Product Rule 19 violation") || err.message.includes("audit_events is strictly append-only"),
      "Audit events table is strictly append-only; database trigger blocked DELETE"
    );
  }

  // 6. SQL Injection Resilience on AI Orchestrator Queries
  console.log("\n--- 6. Testing SQL Injection Resilience ---");
  try {
    await resolveApplicationIdentity("'; DROP TABLE applications; --", { callerUserId: "audit-user" });
    assert(false, "SQL injection string should result in Application not found, not SQL syntax error");
  } catch (err) {
    assert(err.message.includes("Application not found"), "Parameterized query prevented SQL injection payload execution");
  }

  console.log("\n========================================================");
  console.log(`   SECURITY AUDIT RESULTS: ${passCount} / ${testCount} PASSED (${Math.round((passCount / testCount) * 100)}%)   `);
  console.log("========================================================");

  await closeAuthoritativeDb();
}

main().catch(err => {
  console.error("Fatal audit error:", err);
  process.exit(1);
});
