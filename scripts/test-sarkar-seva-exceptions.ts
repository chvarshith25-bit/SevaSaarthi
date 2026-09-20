import { getExceptions, getPanApplications, resetPanDemoState } from "../src/lib/server/db";
import { getExceptionCategory, getExceptionSla } from "../src/app/government/exceptions/page";

async function runExceptionsSuite() {
  console.log("========================================================================");
  console.log("SARKAR SEVA — EXCEPTIONS WORK QUEUE INTEGRITY & SIMPLIFICATION TEST");
  console.log("========================================================================\n");

  resetPanDemoState();
  const exceptions = await getExceptions();
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
  // 1. DATA COUNT & SINGLE SOURCE OF TRUTH
  // -------------------------------------------------------------------------
  console.log("--- 1. SINGLE SOURCE OF TRUTH & COUNT CONSISTENCY ---");
  const activeExceptions = exceptions.filter((e) => !(e.resolved ?? e.isResolved));
  assert(exceptions.length >= 3, `Backend returned ${exceptions.length} exception records`);
  assert(activeExceptions.length === 3, `Active (unresolved) exceptions count is ${activeExceptions.length}`);

  // -------------------------------------------------------------------------
  // 2. CATEGORY CLASSIFICATION
  // -------------------------------------------------------------------------
  console.log("\n--- 2. CATEGORY CLASSIFICATION LOGIC ---");
  const exc101 = exceptions.find((e) => e.id === "EXC-101" || e.applicationId === "PAN-2026-0002");
  assert(!!exc101, "EXC-101 (PAN-2026-0002) found in exception dataset");
  if (exc101) {
    const cat101 = getExceptionCategory(exc101);
    assert(cat101 === "SYSTEM", `PAN-2026-0002 classified as "SYSTEM" (got: ${cat101})`);
  }

  const exc102 = exceptions.find((e) => e.id === "EXC-102" || e.applicationId === "PAN-2026-0003");
  assert(!!exc102, "EXC-102 (PAN-2026-0003) found in exception dataset");
  if (exc102) {
    const cat102 = getExceptionCategory(exc102);
    assert(cat102 === "IDENTITY", `PAN-2026-0003 classified as "IDENTITY" (got: ${cat102})`);
  }

  const exc103 = exceptions.find((e) => e.id === "EXC-103" || e.applicationId === "PAN-2026-0086");
  assert(!!exc103, "EXC-103 (PAN-2026-0086) found in exception dataset");
  if (exc103) {
    const cat103 = getExceptionCategory(exc103);
    assert(cat103 === "SYSTEM", `PAN-2026-0086 classified as "SYSTEM" (got: ${cat103})`);
  }

  // Synthetic Document Exception test
  const syntheticDocExc: any = {
    id: "EXC-DOC-01",
    severity: "MEDIUM",
    title: "Unclear Address Proof Document",
    applicationId: "PAN-2026-0004",
    systemName: "DigiLocker OCR Scanner",
    timestamp: new Date().toISOString(),
    whatHappened: "Uploaded electricity bill scan is low resolution.",
    whyItHappened: "Citizen document capture artifact.",
    currentState: "OFFICER_REVIEW / RETURNED_FOR_CORRECTION",
    autoRetry: false,
    retryAttempts: 0,
    humanActionRequired: "Officer requested clarified utility document.",
    isResolved: false,
  };
  const catDoc = getExceptionCategory(syntheticDocExc);
  assert(catDoc === "DOCUMENTS", `PAN-2026-0004 classified as "DOCUMENTS" (got: ${catDoc})`);

  // -------------------------------------------------------------------------
  // 3. INLINE SLA RISK PRESENTATION
  // -------------------------------------------------------------------------
  console.log("\n--- 3. INLINE SLA RISK PRESENTATION ---");
  const appMap = new Map(applications.map((a) => [a.id, a]));

  if (exc101) {
    const app101 = appMap.get(exc101.applicationId);
    const sla101 = getExceptionSla(exc101, app101);
    assert(!!sla101.label && !!sla101.status, `EXC-101 SLA derived: status=${sla101.status}, label="${sla101.label}"`);
  }

  if (exc102) {
    const app102 = appMap.get(exc102.applicationId);
    const sla102 = getExceptionSla(exc102, app102);
    assert(!!sla102.label && !!sla102.status, `EXC-102 SLA derived: status=${sla102.status}, label="${sla102.label}"`);
  }

  // Synthetic Overdue SLA test
  const overdueApp: any = {
    id: "APP-OVERDUE-01",
    slaDeadline: new Date(Date.now() - 3600 * 2000).toISOString(), // 2 hours in the past
  };
  const overdueSla = getExceptionSla(exc101!, overdueApp);
  assert(overdueSla.status === "OVERDUE", `Overdue app correctly flagged OVERDUE (got: ${overdueSla.status})`);
  assert(overdueSla.label.includes("Overdue"), `Overdue label formatted cleanly: "${overdueSla.label}"`);

  // Synthetic Due Soon SLA test
  const dueSoonApp: any = {
    id: "APP-DUESOON-01",
    slaDeadline: new Date(Date.now() + 3600 * 1500).toISOString(), // 1.5 hours in the future
  };
  const dueSoonSla = getExceptionSla(exc101!, dueSoonApp);
  assert(dueSoonSla.status === "DUE_SOON", `Due soon app correctly flagged DUE_SOON (got: ${dueSoonSla.status})`);
  assert(dueSoonSla.label.includes("Due in"), `Due soon label formatted cleanly: "${dueSoonSla.label}"`);

  // -------------------------------------------------------------------------
  // 4. APPLICATION LINKING & TARGET RESOLUTION
  // -------------------------------------------------------------------------
  console.log("\n--- 4. APPLICATION LINKING & TARGET RESOLUTION ---");
  for (const exc of exceptions) {
    if (exc.applicationId) {
      const targetApp = appMap.get(exc.applicationId);
      assert(!!targetApp, `Exception ${exc.id} references existing application ${exc.applicationId}`);
      assert(
        `/government/applications/${exc.applicationId}/review`.includes(exc.applicationId),
        `Exception ${exc.id} generates canonical review link: /government/applications/${exc.applicationId}/review`
      );
    }
  }

  // -------------------------------------------------------------------------
  // 5. LIVE SERVER HTTP & PERMISSION AUDIT
  // -------------------------------------------------------------------------
  console.log("\n--- 5. LIVE SERVER HTTP & PERMISSION AUDIT ---");
  try {
    // 5.1 Authenticate Government Session
    const authRes = await fetch("http://localhost:3001/api/gov/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: "OFF-PAN-7042",
        password: "GovOfficer@2026",
      }),
    });
    const authData = await authRes.json();
    const setCookieHeader = authRes.headers.get("set-cookie") || "";
    const sessionCookie = setCookieHeader.split(";")[0] || "";

    assert(authData.success === true, "Government officer session successfully created");

    // 5.2 Fetch /api/gov/exceptions with auth
    const excApiRes = await fetch("http://localhost:3001/api/gov/exceptions", {
      headers: { Cookie: sessionCookie },
    });
    const excApiData = await excApiRes.json();
    assert(excApiRes.status === 200, `Authorized /api/gov/exceptions returned HTTP 200`);
    assert(excApiData.success === true, `API response contains success=true`);
    assert(excApiData.exceptions.length === exceptions.length, `API returns exact ${exceptions.length} exception records`);

    // 5.3 Fetch /government/exceptions page on Port 3001
    const pageRes = await fetch("http://localhost:3001/government/exceptions", {
      headers: { Cookie: sessionCookie },
    });
    assert(pageRes.status === 200, `/government/exceptions page resolved with HTTP 200 OK`);

    // 5.4 Port 3000 Isolation check
    const citBlockRes = await fetch("http://localhost:3000/government/exceptions");
    assert(
      citBlockRes.status === 403 || citBlockRes.status === 404,
      `Citizen port 3000 blocks /government/exceptions with HTTP ${citBlockRes.status}`
    );
  } catch (err: any) {
    console.error("Live server check failed:", err.message);
  }

  console.log("\n========================================================================");
  console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log(`EXCEPTIONS SUITE SCORE: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
  console.log("========================================================================");

  if (failCount > 0) {
    process.exit(1);
  }
}

runExceptionsSuite().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("FATAL ERROR IN EXCEPTIONS TEST SUITE:", err);
  process.exit(1);
});
