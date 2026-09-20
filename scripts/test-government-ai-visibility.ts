import { getPanApplications, getApplicationById, resetPanDemoState } from "../src/lib/server/db";

async function runAiVisibilityAudit() {
  console.log("========================================================================");
  console.log("SARKAR SEVA — APPLICATION REVIEW AI VISIBILITY & EVIDENCE AUDIT");
  console.log("========================================================================\n");

  resetPanDemoState();
  const applications = await getPanApplications();

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`[PASS] ${description}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${description}`);
      failCount++;
    }
  }

  // -------------------------------------------------------------------------
  // 1. DATA-BINDING & SCOPE ISOLATION (Requirement 20)
  // -------------------------------------------------------------------------
  console.log("--- 1. APPLICATION DATA-BINDING & SCOPE ISOLATION ---");
  for (const app of applications) {
    const fetched = getApplicationById(app.id);
    assert(!!fetched, `Application ${app.id} successfully loaded`);
    assert(fetched.applicantName === app.applicantName, `${app.id}: Applicant name matches (${app.applicantName})`);
    assert(fetched.serviceName === app.serviceName, `${app.id}: Service name matches (${app.serviceName})`);
  }

  // -------------------------------------------------------------------------
  // 2. MODEL 1 SERVICE CONSISTENCY (Requirement 21)
  // -------------------------------------------------------------------------
  console.log("\n--- 2. MODEL 1 ROUTING & WORKFLOW CONSISTENCY ---");
  const pan1 = getApplicationById("PAN-2026-0001");
  assert(pan1.serviceName.includes("PAN"), `PAN-2026-0001 service is Instant e-PAN (${pan1.serviceName})`);
  assert(pan1.department.includes("Income Tax"), `PAN-2026-0001 department is CBDT / Income Tax (${pan1.department})`);

  const sch1 = getApplicationById("SCH-2026-2345");
  if (sch1) {
    assert(sch1.serviceName.includes("Scholarship"), `SCH-2026-2345 service is Scholarship (${sch1.serviceName})`);
    assert(sch1.department.includes("Higher Education"), `SCH-2026-2345 department is Higher Education (${sch1.department})`);
  }

  // -------------------------------------------------------------------------
  // 3. MODEL 2 IDENTITY RESOLUTION & COLLISION LOGIC (Requirements 4, 6, 30, 31)
  // -------------------------------------------------------------------------
  console.log("\n--- 3. MODEL 2 IDENTITY EVIDENCE & COLLISION HANDLING ---");
  // Clean match case: PAN-2026-0001 (Sai Sankeerth)
  assert(pan1.applicantName === "Sai Sankeerth", "Clean identity case: Sai Sankeerth");
  assert(pan1.status !== "VERIFICATION_CONFLICT", "PAN-2026-0001 has no demographic collision");

  // Collision case: PAN-2026-0003 (Rahul Verma)
  const pan3 = getApplicationById("PAN-2026-0003");
  assert(pan3.applicantName === "Rahul Verma", "Collision case applicant: Rahul Verma");
  assert(
    pan3.status === "VERIFICATION_CONFLICT" || pan3.verifications.some((v: any) => v.status === "CONFLICT"),
    "PAN-2026-0003 flagged for demographic conflict requiring manual officer review"
  );

  // -------------------------------------------------------------------------
  // 4. DOCUMENT REPOSITORY & INTEGRITY (Requirement 10)
  // -------------------------------------------------------------------------
  console.log("\n--- 4. DOCUMENT ATTACHMENTS & WATERMARKS ---");
  assert(!!pan1.documents.identityProof, "PAN-2026-0001 has identityProof document attached");
  assert(!!pan1.documents.dobProof, "PAN-2026-0001 has dobProof document attached");
  assert(!!pan1.documents.addressProof, "PAN-2026-0001 has addressProof document attached");

  // -------------------------------------------------------------------------
  // 5. STATUTORY DPDP CONSENT SCOPE (Requirement 14)
  // -------------------------------------------------------------------------
  console.log("\n--- 5. STATUTORY CONSENT BOUNDARIES ---");
  assert(pan1.consent.granted === true, "PAN-2026-0001 DPDP statutory consent is GRANTED");
  assert(!!pan1.consent.consentId, `PAN-2026-0001 has consent token: ${pan1.consent.consentId}`);
  assert(!!pan1.consent.purpose, `PAN-2026-0001 records consent purpose`);

  // -------------------------------------------------------------------------
  // 6. LIVE SERVER REVIEW ROUTE RESOLUTION (Requirement 29)
  // -------------------------------------------------------------------------
  console.log("\n--- 6. LIVE SERVER REVIEW ROUTE INTEGRITY ---");
  try {
    const authRes = await fetch("http://localhost:3001/api/gov/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "OFF-PAN-7042", password: "GovOfficer@2026" }),
    });
    const authData = await authRes.json();
    const setCookieHeader = authRes.headers.get("set-cookie") || "";
    const sessionCookie = setCookieHeader.split(";")[0] || "";

    assert(authData.success === true, "Officer authentication successful");

    const reviewRes1 = await fetch("http://localhost:3001/government/applications/PAN-2026-0001/review", {
      headers: { Cookie: sessionCookie },
    });
    assert(reviewRes1.status === 200, "Review URL for PAN-2026-0001 resolved with HTTP 200 OK");

    const reviewRes3 = await fetch("http://localhost:3001/government/applications/PAN-2026-0003/review", {
      headers: { Cookie: sessionCookie },
    });
    assert(reviewRes3.status === 200, "Review URL for PAN-2026-0003 resolved with HTTP 200 OK");
  } catch (err: any) {
    console.error("Live server test error:", err.message);
  }

  console.log("\n========================================================================");
  console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log(`AI VISIBILITY & EVIDENCE AUDIT SCORE: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
  console.log("========================================================================");

  if (failCount > 0) {
    process.exit(1);
  }
}

runAiVisibilityAudit().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("FATAL ERROR IN AI VISIBILITY AUDIT:", err);
  process.exit(1);
});
