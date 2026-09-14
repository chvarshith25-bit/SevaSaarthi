import { getAuthoritativeDb } from '../src/lib/server/pg-db';
import { querySyntheticRegistry } from '../src/lib/server/connectors';

async function runTests() {
  console.log("=== SEVA SAARTHI PHASE 4 TEST SUITE: SYNTHETIC DATA LAYER ===");
  const db = await getAuthoritativeDb();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details: string = "") {
    if (condition) {
      console.log("  [PASS] " + testName);
      passed++;
    } else {
      console.error("  [FAIL] " + testName + ": " + details);
      failed++;
    }
  }

  // 1. Check master citizens populated
  const masterRes = await db.query("SELECT COUNT(*) as count FROM synthetic_master_citizens");
  const masterCount = parseInt(masterRes.rows[0].count, 10);
  assert(masterCount >= 100, "Master citizens count >= 100", "Found " + masterCount);

  // 2. Check master citizen IDs uniqueness
  const uniqRes = await db.query("SELECT COUNT(DISTINCT citizen_id) as count FROM synthetic_master_citizens");
  assert(parseInt(uniqRes.rows[0].count, 10) === masterCount, "All citizen_ids are unique");

  // 3. Check all 7 departmental registries populated
  const registries = [
    { table: "registry_revenue", name: "Revenue" },
    { table: "registry_education", name: "Education" },
    { table: "registry_agriculture", name: "Agriculture" },
    { table: "registry_health", name: "Health" },
    { table: "registry_housing", name: "Housing" },
    { table: "registry_land", name: "Land" },
    { table: "registry_pan", name: "PAN" }
  ];

  for (const reg of registries) {
    const r = await db.query("SELECT COUNT(*) as count FROM " + reg.table);
    const c = parseInt(r.rows[0].count, 10);
    assert(c > 0, "Registry " + reg.name + " (" + reg.table + ") populated", "Found " + c + " records");
  }

  // 4. Check foreign key integrity to master citizens
  for (const reg of registries) {
    const fkRes = await db.query("SELECT COUNT(*) as orphan_count FROM " + reg.table + " r LEFT JOIN synthetic_master_citizens m ON r.citizen_id = m.citizen_id WHERE r.citizen_id IS NOT NULL AND m.citizen_id IS NULL");
    const orphans = parseInt(fkRes.rows[0].orphan_count, 10);
    assert(orphans === 0, "FK integrity for " + reg.table + " (no orphans)", "Found " + orphans + " orphans");
  }

  // 5. Check ground truth match labels (both true and false exist)
  const gtMatches = await db.query("SELECT COUNT(*) as count FROM synthetic_entity_ground_truth WHERE ground_truth_match = TRUE");
  const gtNonMatches = await db.query("SELECT COUNT(*) as count FROM synthetic_entity_ground_truth WHERE ground_truth_match = FALSE");
  const matchCount = parseInt(gtMatches.rows[0].count, 10);
  const nonMatchCount = parseInt(gtNonMatches.rows[0].count, 10);
  assert(matchCount > 0, "Ground truth positive matches exist", "Found " + matchCount);
  assert(nonMatchCount > 0, "Ground truth negative matches exist", "Found " + nonMatchCount);

  // 6. Check intentional variations exist (INITIALS, FUZZY_NAME, etc.)
  const varTypes = await db.query("SELECT DISTINCT match_type FROM synthetic_entity_ground_truth");
  const matchTypes = varTypes.rows.map((r: any) => r.match_type);
  assert(matchTypes.includes("INITIALS"), "Variation type INITIALS present", "Types: " + matchTypes.join(", "));
  assert(matchTypes.includes("FUZZY_NAME"), "Variation type FUZZY_NAME present");
  assert(matchTypes.includes("EXACT"), "Variation type EXACT present");

  // 7. Check name collision cases exist
  assert(matchTypes.includes("NON_MATCH_NAME_COLLISION"), "Collision match_type NON_MATCH_NAME_COLLISION present");

  // 8. Test querySyntheticRegistry connector retrieval
  const connRes = await querySyntheticRegistry("revenue_registry", {
    requestingApplicationId: "APP-TEST-001",
    requestingDepartmentId: "d0000000-0000-0000-0000-000000000002",
    purpose: "Scholarship Verification Test",
    authorizedFields: ["id", "citizen_id", "name", "annual_income", "certificate_status"],
    consentVerified: true,
    queryParameters: { district: "Hyderabad" }
  });
  assert(connRes.success === true && connRes.records.length > 0, "Connector retrieval executes successfully", "Found " + connRes.records.length + " records");
  assert(connRes.records[0].address === undefined, "Data minimization: unauthorized fields redacted");

  // 9. Test missing optional fields handled cleanly (null father_name, null email)
  const nullFather = await db.query("SELECT COUNT(*) as count FROM synthetic_master_citizens WHERE father_name IS NULL");
  const nullEmail = await db.query("SELECT COUNT(*) as count FROM synthetic_master_citizens WHERE email IS NULL");
  assert(parseInt(nullFather.rows[0].count, 10) > 0, "Synthetic master handles null father_name");
  assert(parseInt(nullEmail.rows[0].count, 10) > 0, "Synthetic master handles null email");

  // 10. Test DPDP consent gate enforcement
  const unconsentedRes = await querySyntheticRegistry("revenue_registry", {
    requestingApplicationId: "APP-TEST-002",
    requestingDepartmentId: "d0000000-0000-0000-0000-000000000002",
    purpose: "Unconsented inquiry",
    authorizedFields: ["name"],
    consentVerified: false,
    queryParameters: { district: "Hyderabad" }
  });
  assert(unconsentedRes.success === false && unconsentedRes.error === "CONSENT_VERIFICATION_REQUIRED", "DPDP Consent gate strictly blocks unconsented queries");

  // 11. Privacy assertions: all Aadhaar and PAN references are synthetic demo values
  const badAadhaar = await db.query('SELECT COUNT(*) as count FROM synthetic_master_citizens WHERE aadhaar_reference NOT LIKE \'AADHAAR-DEMO-%\'');
  const badPan = await db.query('SELECT COUNT(*) as count FROM synthetic_master_citizens WHERE pan_reference NOT LIKE \'PAN-DEMO-%\'');
  assert(parseInt(badAadhaar.rows[0].count, 10) === 0, "All Aadhaar refs match synthetic prefix AADHAAR-DEMO-%");
  assert(parseInt(badPan.rows[0].count, 10) === 0, "All PAN refs match synthetic prefix PAN-DEMO-%");

  console.log("\n=== TEST SUMMARY: " + passed + " PASSED, " + failed + " FAILED ===");
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test suite failed:", err);
  process.exit(1);
});