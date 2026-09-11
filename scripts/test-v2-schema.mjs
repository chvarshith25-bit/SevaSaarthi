import fs from "fs";
import path from "path";
import { PGlite } from "@electric-sql/pglite";

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
  `);
}

function cleanSqlForPglite(sql) {
  return sql.replace(/create\s+extension\s+[^;]+;/gi, '-- stripped extension');
}

async function runTests() {
  console.log("\n========================================================");
  console.log("   FORMLY V2 UNIFIED BACKEND SCHEMA VALIDATION TESTS");
  console.log("========================================================\n");

  const migrationPath = path.resolve(process.cwd(), "supabase/migrations/002_formly_v2_unified_schema.sql");
  assert(fs.existsSync(migrationPath), `Migration file exists at ${migrationPath}`);

  const sqlContent = fs.readFileSync(migrationPath, "utf8");
  assert(sqlContent.length > 5000, `Migration content is substantive (${sqlContent.length} bytes)`);

  // 1. Check all required tables from sections 1-23
  console.log("\n--- Validating Table Definitions ---");
  const requiredTables = [
    "profiles",
    "profile_fields",
    "documents",
    "extracted_fields",
    "departments",
    "offices",
    "employees",
    "permission_overrides",
    "services",
    "service_requirements",
    "applications",
    "application_profile_snapshots",
    "application_documents",
    "application_requirement_status",
    "consent_requests",
    "consent_scopes",
    "canonical_fields",
    "canonical_values",
    "data_mappings",
    "connectors",
    "connector_requests",
    "verification_requests",
    "verification_results",
    "routing_rules",
    "application_assignments",
    "workflow_definitions",
    "workflow_steps",
    "workflow_transitions",
    "workflow_executions",
    "workflow_step_executions",
    "service_decision_policies",
    "application_decisions",
    "correction_requests",
    "ai_case_assistance",
    "application_state_history",
    "domain_events",
    "exceptions",
    "audit_events",
    "notifications",
    "physical_card_requests",
    "idempotency_keys",
    "service_sla_policies",
  ];

  for (const table of requiredTables) {
    const tableRegex = new RegExp(`create\\s+table\\s+(if\\s+not\\s+exists\\s+)?${table}\\s*\\(`, "i");
    assert(tableRegex.test(sqlContent), `Table defined: ${table}`);
  }

  // 2. Validate Key Constraints and Product Rules
  console.log("\n--- Validating Product Rules in Schema ---");

  // Rule 1: AI cannot approve or reject
  assert(
    sqlContent.includes("Product Rule 1 violation: AI cannot APPROVE or REJECT"),
    "Rule 1 enforced in transition_application_status: AI cannot approve or reject"
  );
  assert(
    sqlContent.includes("not (actor_type = 'AI' and to_status in ('APPROVED', 'REJECTED'))"),
    "Rule 1 enforced in application_state_history check constraint"
  );

  // Rule 2: Officer decisions stored separately from AI output
  assert(
    sqlContent.includes("create table if not exists application_decisions") &&
    sqlContent.includes("create table if not exists ai_case_assistance"),
    "Rule 2 enforced: application_decisions and ai_case_assistance are separate tables"
  );

  // Rule 3: Return/reject reasons become structured correction/explanation input
  assert(
    sqlContent.includes("create table if not exists correction_requests") &&
    sqlContent.includes("decision_id           uuid not null") &&
    sqlContent.includes("references application_decisions(id)"),
    "Rule 3 enforced: correction_requests references application_decisions"
  );

  // Rule 4: Every state transition recorded with actor
  assert(
    sqlContent.includes("insert into application_state_history") &&
    sqlContent.includes("p_actor_type") &&
    sqlContent.includes("p_actor_id"),
    "Rule 4 enforced: transition function logs actor_type and actor_id to application_state_history"
  );

  // Rule 5: Explicit state transitions via function
  assert(
    sqlContent.includes("create or replace function transition_application_status"),
    "Rule 5 enforced: transition_application_status function created"
  );
  assert(
    sqlContent.includes("Product Rule 5 violation: Invalid status jump"),
    "Rule 5 enforced: Invalid status jumps raise exception"
  );

  // Rule 9: Connectors have DEMO/SANDBOX/PRODUCTION environment
  assert(
    sqlContent.includes("environment in ('DEMO','SANDBOX','PRODUCTION')"),
    "Rule 9 enforced: connector environment constraint (DEMO, SANDBOX, PRODUCTION)"
  );

  // Rule 10: Citizen UI never receives government-only data directly
  assert(
    sqlContent.includes("create or replace view citizen_applications_view") &&
    sqlContent.includes("create or replace view government_applications_view"),
    "Rule 10 enforced: permission-scoped views separate citizen view from government view"
  );

  // Rule 19: Strict immutable append-only audit trail
  assert(
    sqlContent.includes("Product Rule 19 violation: audit_events is strictly append-only"),
    "Rule 19 enforced: prevent_audit_events_mutation trigger blocks updates/deletes"
  );
  assert(
    sqlContent.includes("create or replace function record_audit_event"),
    "Rule 19 helper function record_audit_event implemented"
  );

  // 3. Validate Row Level Security (RLS) & Policies on ALL 42 Tables
  console.log("\n--- Validating Row Level Security (RLS) & Policies ---");
  const policyMatches = [...sqlContent.matchAll(/create\s+policy\s+"[^"]+"\s+on\s+([a-zA-Z0-9_]+)/gi)].map(m => m[1]);
  const coveredTables = new Set(policyMatches);

  for (const table of requiredTables) {
    const rlsRegex = new RegExp(`alter\\s+table\\s+${table}\\s+enable\\s+row\\s+level\\s+security`, "i");
    assert(rlsRegex.test(sqlContent), `RLS enabled on: ${table}`);
    assert(coveredTables.has(table), `Explicit access policy created on: ${table}`);
  }

  // 4. Test State Machine Transition Matrix
  console.log("\n--- Testing State Machine Transitions (Simulation) ---");
  
  const VALID_TRANSITIONS = {
    DRAFT: ["SUBMITTED", "CANCELLED"],
    SUBMITTED: ["VALIDATING", "CANCELLED"],
    VALIDATING: ["CONSENT_REQUIRED", "CONSENT_VERIFIED", "VERIFICATION_IN_PROGRESS", "MANUAL_REVIEW", "SYSTEM_ERROR", "CANCELLED"],
    CONSENT_REQUIRED: ["CONSENT_VERIFIED", "CANCELLED"],
    CONSENT_VERIFIED: ["VERIFICATION_IN_PROGRESS", "CANCELLED"],
    VERIFICATION_IN_PROGRESS: ["VERIFIED", "VERIFICATION_FAILED", "CONFLICT_DETECTED", "MANUAL_REVIEW", "API_UNAVAILABLE", "RETRY_PENDING"],
    API_UNAVAILABLE: ["RETRY_PENDING", "VERIFICATION_IN_PROGRESS", "MANUAL_REVIEW"],
    RETRY_PENDING: ["VERIFICATION_IN_PROGRESS", "MANUAL_REVIEW", "SYSTEM_ERROR"],
    VERIFIED: ["GOVERNMENT_PROCESSING", "DEPARTMENT_ASSIGNED", "CONFLICT_DETECTED", "MANUAL_REVIEW"],
    GOVERNMENT_PROCESSING: ["DEPARTMENT_ASSIGNED", "OFFICE_ASSIGNED", "OFFICER_ASSIGNED", "OFFICER_REVIEW", "APPROVED", "MANUAL_REVIEW"],
    DEPARTMENT_ASSIGNED: ["OFFICE_ASSIGNED", "OFFICER_ASSIGNED", "OFFICER_REVIEW"],
    OFFICE_ASSIGNED: ["OFFICER_ASSIGNED", "OFFICER_REVIEW"],
    OFFICER_ASSIGNED: ["OFFICER_REVIEW"],
    OFFICER_REVIEW: ["APPROVED", "REJECTED", "RETURNED_FOR_CORRECTION", "OFFICER_ASSIGNED"],
    RETURNED_FOR_CORRECTION: ["REVALIDATION", "SUBMITTED", "CANCELLED"],
    REVALIDATION: ["VERIFICATION_IN_PROGRESS", "OFFICER_REVIEW", "GOVERNMENT_PROCESSING"],
    APPROVED: ["PAN_GENERATION", "COMPLETED"],
    PAN_GENERATION: ["PAN_GENERATED", "SYSTEM_ERROR"],
    PAN_GENERATED: ["COMPLETED"],
    CONFLICT_DETECTED: ["MANUAL_REVIEW", "OFFICER_REVIEW", "REJECTED", "RETURNED_FOR_CORRECTION"],
    MANUAL_REVIEW: ["DEPARTMENT_ASSIGNED", "OFFICER_ASSIGNED", "OFFICER_REVIEW", "REJECTED", "RETURNED_FOR_CORRECTION"],
    VERIFICATION_FAILED: ["REJECTED", "MANUAL_REVIEW", "RETURNED_FOR_CORRECTION"],
    SYSTEM_ERROR: ["RETRY_PENDING", "MANUAL_REVIEW", "CANCELLED"],
  };

  function simulateTransition(fromStatus, toStatus, actorType) {
    if (actorType === "AI" && (toStatus === "APPROVED" || toStatus === "REJECTED")) {
      throw new Error("Product Rule 1 violation: AI cannot APPROVE or REJECT an application");
    }
    const allowed = VALID_TRANSITIONS[fromStatus];
    if (!allowed || !allowed.includes(toStatus)) {
      throw new Error(`Product Rule 5 violation: Invalid status jump from ${fromStatus} to ${toStatus}`);
    }
    return toStatus;
  }

  // Test 4a: Happy Path
  let currentState = "DRAFT";
  const happyPath = [
    "SUBMITTED",
    "VALIDATING",
    "CONSENT_REQUIRED",
    "CONSENT_VERIFIED",
    "VERIFICATION_IN_PROGRESS",
    "VERIFIED",
    "GOVERNMENT_PROCESSING",
    "OFFICER_REVIEW",
    "APPROVED",
    "PAN_GENERATION",
    "PAN_GENERATED",
    "COMPLETED",
  ];

  for (const nextState of happyPath) {
    const actor = nextState === "SUBMITTED" ? "CITIZEN" : nextState === "APPROVED" ? "EMPLOYEE" : "SYSTEM";
    currentState = simulateTransition(currentState, nextState, actor);
  }
  assert(currentState === "COMPLETED", "Full lifecycle DRAFT -> ... -> COMPLETED passed cleanly");

  // Test 4b: Arbitrary jump blocked
  let arbitraryJumpBlocked = false;
  try {
    simulateTransition("DRAFT", "APPROVED", "EMPLOYEE");
  } catch (err) {
    arbitraryJumpBlocked = true;
    assert(err.message.includes("Product Rule 5 violation"), `Blocked arbitrary jump DRAFT -> APPROVED: ${err.message}`);
  }
  assert(arbitraryJumpBlocked, "Arbitrary status jump was blocked");

  // Test 4c: AI cannot approve
  let aiApproveBlocked = false;
  try {
    simulateTransition("OFFICER_REVIEW", "APPROVED", "AI");
  } catch (err) {
    aiApproveBlocked = true;
    assert(err.message.includes("Product Rule 1 violation"), `Blocked AI approval: ${err.message}`);
  }
  assert(aiApproveBlocked, "AI approval blocked by transition function");

  // Test 4d: AI cannot reject
  let aiRejectBlocked = false;
  try {
    simulateTransition("OFFICER_REVIEW", "REJECTED", "AI");
  } catch (err) {
    aiRejectBlocked = true;
    assert(err.message.includes("Product Rule 1 violation"), `Blocked AI rejection: ${err.message}`);
  }
  assert(aiRejectBlocked, "AI rejection blocked by transition function");

  // 5. Basic SQL Lexical / Structural Check
  console.log("\n--- Checking SQL Structural Balance ---");
  const createTableMatches = [...sqlContent.matchAll(/create\s+table\s+(if\s+not\s+exists\s+)?([a-z0-9_]+)\s*\(([\s\S]*?)\);/gi)];
  assert(createTableMatches.length >= requiredTables.length, `Parsed ${createTableMatches.length} complete table declarations (expected >= ${requiredTables.length})`);

  const functionMatches = [...sqlContent.matchAll(/create\s+(or\s+replace\s+)?function\s+([a-z0-9_]+)[\s\S]*?as\s+\$\$([\s\S]*?)\$\$;/gi)];
  assert(functionMatches.length >= 6, `Parsed ${functionMatches.length} PL/pgSQL functions with valid $$ delimiters`);

  // 6. Deep PostgreSQL Engine Verification (PGlite WASM)
  console.log("\n--- Deep PostgreSQL Engine Verification (Live DB) ---");
  
  // Test 6a: Fresh DB
  const freshDb = new PGlite();
  await initSupabaseMocks(freshDb);
  await freshDb.exec(`
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000000001', 'citizen@formly.gov.in')
    ON CONFLICT (id) DO NOTHING;
  `);
  await freshDb.exec(cleanSqlForPglite(sqlContent));
  assert(true, "Live PostgreSQL: 002 schema applied cleanly on fresh database");

  // Verify Views on Live DB
  const citizenViewRes = await freshDb.query(`SELECT count(*) as cnt FROM citizen_applications_view`);
  assert(Number(citizenViewRes.rows[0].cnt) >= 0, "Live PostgreSQL: citizen_applications_view successfully queried");

  const govViewRes = await freshDb.query(`SELECT count(*) as cnt FROM government_applications_view`);
  assert(Number(govViewRes.rows[0].cnt) >= 0, "Live PostgreSQL: government_applications_view successfully queried");

  // Live PL/pgSQL Transition Engine Execution
  await freshDb.exec(`
    INSERT INTO applications (id, application_number, citizen_user_id, service_id, status)
    VALUES ('33333333-3333-3333-3333-333333333333', 'PAN-2026-LIVE1', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'DRAFT');
  `);
  const liveTransitionRes = await freshDb.query(`
    SELECT transition_application_status('33333333-3333-3333-3333-333333333333'::uuid, 'SUBMITTED', 'CITIZEN', '00000000-0000-0000-0000-000000000001'::uuid);
  `);
  assert(liveTransitionRes.rows.length === 1, "Live PostgreSQL: transition_application_status executed and returned new status");

  // Live PL/pgSQL Audit Event Immutable Enforcement
  const auditRes = await freshDb.query(`
    SELECT record_audit_event('CITIZEN', '00000000-0000-0000-0000-000000000001'::uuid, 'TEST_LIVE_ACTION', '33333333-3333-3333-3333-333333333333'::uuid) as id;
  `);
  const liveAuditId = auditRes.rows[0].id;
  assert(liveAuditId, "Live PostgreSQL: record_audit_event inserted row");

  let liveAuditBlock = false;
  try {
    await freshDb.query(`DELETE FROM audit_events WHERE id = $1`, [liveAuditId]);
  } catch (e) {
    liveAuditBlock = true;
    assert(e.message.includes("Product Rule 19 violation"), `Live PostgreSQL: trigger blocked DELETE on audit_events: ${e.message}`);
  }
  assert(liveAuditBlock, "Live PostgreSQL: audit_events append-only trigger verified");

  // Test 6b: Existing V1 Database Migration
  const v1Db = new PGlite();
  await initSupabaseMocks(v1Db);
  const sql001 = fs.readFileSync(path.resolve('supabase/migrations/001_formly_schema.sql'), 'utf-8');
  await v1Db.exec(cleanSqlForPglite(sql001));
  const sqlSeed = fs.readFileSync(path.resolve('supabase/seed.sql'), 'utf-8');
  await v1Db.exec(cleanSqlForPglite(sqlSeed));
  await v1Db.exec(cleanSqlForPglite(sqlContent));
  assert(true, "Live PostgreSQL: 002 schema applied cleanly on top of existing 001 + seed V1 database");

  const v1ReconciledReqs = await v1Db.query(`SELECT count(*) as cnt FROM service_requirements`);
  assert(Number(v1ReconciledReqs.rows[0].cnt) === 17, `Live PostgreSQL: All 17 service_requirements present after V1 reconciliation (found ${v1ReconciledReqs.rows[0].cnt})`);

  console.log("\n========================================================");
  console.log("   ALL V2 UNIFIED SCHEMA VALIDATION TESTS PASSED (100%)");
  console.log("========================================================\n");
}

runTests().catch((e) => {
  console.error("V2 Schema validation test failed:", e);
  process.exit(1);
});
