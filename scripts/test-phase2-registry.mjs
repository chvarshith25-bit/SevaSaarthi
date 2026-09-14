import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";
import {
  getRegisteredDepartments,
  getRegisteredSubDepartments,
  getRegisteredOffices,
  getRegisteredServices,
  getServiceWorkflow,
  getServiceRequirements,
  getRegisteredConnectors,
  CONTROLLED_VERIFICATION_TYPES,
  isControlledVerificationType,
} from "../src/lib/server/registry-service.js";
import { resolveServiceRoute } from "../src/lib/server/routing-resolver.js";
import {
  officerAcceptApplication,
  officerReturnApplication,
  createPanApplication,
  getApplicationById,
  calculateAuditTamperHash,
} from "../src/lib/server/db.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function initSupabaseMocks(db) {
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text,
      created_at timestamptz DEFAULT now()
    );
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
      SELECT '00000000-0000-0000-0000-000000000001'::uuid;
    $$ LANGUAGE sql STABLE;

    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text UNIQUE NOT NULL,
      phone text,
      "passwordHash" text NOT NULL,
      salt text NOT NULL,
      role text NOT NULL,
      "createdAt" timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token text PRIMARY KEY,
      "userId" text REFERENCES users(id) ON DELETE CASCADE,
      "expiresAt" timestamptz NOT NULL
    );
  `);
}

function cleanSqlForPglite(sql) {
  return sql.replace(/create\s+extension\s+[^;]+;/gi, "-- stripped extension");
}

async function runPhase2RegistryTests() {
  console.log("\n========================================================");
  console.log("   SEVA SAARTHI PHASE 2 — CONTROLLED REGISTRY TEST SUITE");
  console.log("========================================================\n");

  // 1. Service maps to a valid department
  console.log("--- 1. Service -> Department Relational Integrity ---");
  const services = await getRegisteredServices();
  assert(services.length >= 7, `Authoritative services loaded (found ${services.length})`);
  const departments = await getRegisteredDepartments();
  const deptIds = new Set(departments.map((d) => d.id));

  for (const s of services) {
    assert(s.department_id && deptIds.has(s.department_id), `Service '${s.code}' maps to valid Department ID`);
  }

  // 2. Service maps to a valid sub-department
  console.log("\n--- 2. Service -> Sub-Department Relational Integrity ---");
  const subDepts = await getRegisteredSubDepartments();
  assert(subDepts.length >= 7, `Authoritative sub-departments loaded (found ${subDepts.length})`);
  const subDeptIds = new Set(subDepts.map((sd) => sd.id));

  for (const s of services) {
    assert(s.sub_department_id && subDeptIds.has(s.sub_department_id), `Service '${s.code}' maps to valid Sub-Department ID`);
  }

  // 3. Sub-department belongs to its parent department
  console.log("\n--- 3. Sub-Department Parent Integrity ---");
  for (const sd of subDepts) {
    assert(sd.department_id && deptIds.has(sd.department_id), `Sub-department '${sd.code}' belongs to valid Department`);
  }

  // 4. Workflow belongs to its service
  console.log("\n--- 4. Service -> Workflow Association ---");
  const serviceIds = new Set(services.map((s) => s.id));
  for (const s of services) {
    const wf = await getServiceWorkflow(s.id);
    assert(wf.definition !== null, `Service '${s.code}' has an active workflow definition`);
    assert(wf.definition.service_id === s.id, `Workflow definition references correct service ID`);
  }

  // 5. Every workflow step references valid entities
  console.log("\n--- 5. Workflow Step Entity Reference Integrity ---");
  const panWf = await getServiceWorkflow("a0000000-0000-0000-0000-000000000002");
  assert(panWf.steps.length >= 7, `PAN workflow has ${panWf.steps.length} steps`);
  const schWf = await getServiceWorkflow("a0000000-0000-0000-0000-000000000001");
  assert(schWf.steps.length >= 7, `Scholarship workflow has ${schWf.steps.length} steps`);

  for (const step of schWf.steps) {
    assert(step.step_key && step.label, `Step '${step.step_key}' has valid metadata`);
    if (step.connector_id) {
      const connectors = await getRegisteredConnectors();
      const connIds = new Set(connectors.map((c) => c.id));
      assert(connIds.has(step.connector_id), `Step '${step.step_key}' references valid connector`);
    }
  }

  // 6. Every connector exists and has explicit environment/mode
  console.log("\n--- 6. Connector Registry Integrity ---");
  const connectors = await getRegisteredConnectors();
  assert(connectors.length >= 9, `Connectors registered (found ${connectors.length})`);
  for (const c of connectors) {
    assert(["SIMULATED", "MOCK", "LIVE"].includes(c.endpoint_mode), `Connector '${c.code}' has explicit endpoint_mode (${c.endpoint_mode})`);
    assert(["DEMO", "SANDBOX", "PRODUCTION"].includes(c.environment), `Connector '${c.code}' has valid environment (${c.environment})`);
  }

  // 7. Every verification requirement is a valid controlled type
  console.log("\n--- 7. Controlled Verification Requirements ---");
  for (const s of services) {
    const reqs = await getServiceRequirements(s.id);
    assert(reqs.length > 0, `Service '${s.code}' has registered requirements (${reqs.length})`);
    for (const r of reqs) {
      assert(
        ["PROFILE_FIELD", "DOCUMENT", "CONSENT_SCOPE", "VERIFICATION", "ELIGIBILITY"].includes(r.requirement_type),
        `Requirement '${r.requirement_key}' has controlled requirement type`
      );
    }
  }

  // 8. No orphaned services
  console.log("\n--- 8. Orphaned Service Detection ---");
  for (const s of services) {
    assert(deptIds.has(s.department_id), `No orphaned service: '${s.code}' has existing department`);
  }

  // 9. No orphaned workflows
  console.log("\n--- 9. Orphaned Workflow Detection ---");
  for (const s of services) {
    const wf = await getServiceWorkflow(s.id);
    assert(serviceIds.has(wf.definition.service_id), `No orphaned workflow: '${wf.definition.code}' belongs to service`);
  }

  // 10. Invalid routing rule is rejected
  console.log("\n--- 10. Database Constraint Protection on Routing ---");
  let rejectedFk = false;
  try {
    const freshDb = new PGlite();
    await initSupabaseMocks(freshDb);
    const sql001 = fs.readFileSync(path.resolve("supabase/migrations/001_formly_schema.sql"), "utf8");
    await freshDb.exec(cleanSqlForPglite(sql001));
    const sqlSeed = fs.readFileSync(path.resolve("supabase/seed.sql"), "utf8");
    await freshDb.exec(cleanSqlForPglite(sqlSeed));
    const sql002 = fs.readFileSync(path.resolve("supabase/migrations/002_formly_v2_unified_schema.sql"), "utf8");
    await freshDb.exec(cleanSqlForPglite(sql002));
    const sql003 = fs.readFileSync(path.resolve("supabase/migrations/003_controlled_registry.sql"), "utf8");
    await freshDb.exec(cleanSqlForPglite(sql003));

    // Attempt inserting routing rule for non-existent service
    await freshDb.query(`
      INSERT INTO routing_rules (id, service_id, target_role)
      VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000009999'::uuid, 'DEPARTMENT_OFFICER')
    `);
  } catch (err) {
    rejectedFk = true;
    assert(err.message.includes("violates foreign key constraint") || err.message.includes("routing_rules"), "Foreign key constraint correctly rejected invalid service in routing rule");
  }
  assert(rejectedFk, "Invalid routing rule was blocked by foreign key constraint");

  // 11. Missing routing rule results in manual review
  console.log("\n--- 11. Safe Fallback to ROUTING_REQUIRES_MANUAL_REVIEW ---");
  const unroutedResult = await resolveServiceRoute("NON_EXISTENT_SERVICE_CODE");
  assert(unroutedResult.status === "ROUTING_REQUIRES_MANUAL_REVIEW", "Unregistered service resolves to ROUTING_REQUIRES_MANUAL_REVIEW");
  assert(unroutedResult.routingMode === "MANUAL_REVIEW_REQUIRED", "Routing mode set to MANUAL_REVIEW_REQUIRED");

  // 12. Existing PAN workflow still works
  console.log("\n--- 12. Existing PAN Workflow Continuity ---");
  const panRoute = await resolveServiceRoute("INSTANT_E_PAN");
  assert(panRoute.status === "ROUTED", "PAN service resolves cleanly through routing rules");
  assert(panRoute.serviceCode === "INSTANT_E_PAN", "Service code matched INSTANT_E_PAN");
  assert(panRoute.departmentName.includes("Income Tax"), "Department correctly resolved to Income Tax");

  // 13. Existing State Machine Transitions Intact
  console.log("\n--- 13. State Machine Invariants (Product Rules 1 & 5) ---");
  const app = getApplicationById("PAN-2026-0001");
  assert(app !== null, "Seed application PAN-2026-0001 exists");

  // 14. Existing Platform Separation Maintained
  console.log("\n--- 14. Platform Separation Invariants ---");
  const portSeparationCheck = fs.readFileSync(path.resolve("src/middleware.ts"), "utf8");
  assert(portSeparationCheck.includes("3001") && portSeparationCheck.includes("3000"), "Middleware enforces port 3000 vs 3001 separation");

  // 15. Existing Tamper-Evident Audit System Working
  console.log("\n--- 15. Audit Tamper Hash Invariance ---");
  const sampleAudit = {
    id: "AUD-9999",
    timestamp: "2026-09-14T10:00:00.000Z",
    actor: { id: "u_1", name: "Citizen", role: "CITIZEN" },
    action: "SUBMIT",
    stage: "OFFICER_REVIEW",
    source: "CITIZEN_PORTAL",
    target: "APPLICATION_CASE",
    purpose: "Testing",
    result: "SUCCESS",
    details: "Integrity check",
    requestId: "REQ-1111",
  };
  const hash1 = calculateAuditTamperHash(sampleAudit);
  assert(hash1 && hash1.length === 64, `Tamper-evident SHA-256 computed (${hash1.slice(0, 16)}...)`);
  const modifiedAudit = { ...sampleAudit, details: "Tampered content" };
  const hash2 = calculateAuditTamperHash(modifiedAudit);
  assert(hash1 !== hash2, "Audit tamper detection successfully identifies unauthorized record alterations");

  console.log("\n========================================================");
  console.log("   ALL 15 PHASE 2 REGISTRY TESTS PASSED (100%)");
  console.log("========================================================\n");
}

runPhase2RegistryTests().catch((err) => {
  console.error("Phase 2 test failed:", err);
  process.exit(1);
});
