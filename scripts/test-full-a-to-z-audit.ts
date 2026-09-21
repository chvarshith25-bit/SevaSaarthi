import fetch from "node-fetch";

async function runAtoZAudit() {
  console.log("========================================================================");
  console.log("          SEVA SAARTHI / SARKAR SEVA A-TO-Z FULL SYSTEM AUDIT           ");
  console.log("========================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. CITIZEN ROUTES (PORT 3000)
  console.log("\n--- 1. Citizen Platform Routes (Port 3000) ---");
  const citizenRoutes = [
    "/",
    "/dashboard",
    "/applications",
    "/applications/PAN-2026-0001/status",
    "/applications/PAN-2026-0004/status",
    "/services",
    "/services/pan",
    "/services/scholarship",
    "/profile",
    "/documents",
    "/notifications",
    "/help",
    "/login",
    "/signup",
  ];

  for (const route of citizenRoutes) {
    try {
      const res = await fetch(`http://localhost:3000${route}`, { redirect: "manual" });
      assert(
        res.status === 200 || res.status === 307 || res.status === 308,
        `Citizen route ${route} accessible (HTTP ${res.status})`
      );
    } catch (e: any) {
      assert(false, `Citizen route ${route} error: ${e.message}`);
    }
  }

  // 2. GOVERNMENT ROUTES (PORT 3001)
  console.log("\n--- 2. Government Platform Routes (Port 3001) ---");
  const govRoutes = [
    "/government/dashboard",
    "/government/applications",
    "/government/applications?tab=all",
    "/government/applications?tab=assigned",
    "/government/applications?tab=needs_action",
    "/government/applications?tab=verification",
    "/government/applications?tab=returned",
    "/government/applications?tab=completed",
    "/government/applications?tab=exceptions",
    "/government/applications/PAN-2026-0001",
    "/government/applications/PAN-2026-0001/review",
    "/government/applications/PAN-2026-0002/review",
    "/government/applications/PAN-2026-0003/review",
    "/government/applications/PAN-2026-0004/review",
    "/government/exceptions",
    "/government/audit",
    "/government/admin",
    "/government/login",
    "/government/profile",
  ];

  for (const route of govRoutes) {
    try {
      const res = await fetch(`http://localhost:3001${route}`, { redirect: "manual" });
      assert(
        res.status === 200 || res.status === 307 || res.status === 308,
        `Government route ${route} accessible (HTTP ${res.status})`
      );
    } catch (e: any) {
      assert(false, `Government route ${route} error: ${e.message}`);
    }
  }

  // 3. GOVERNMENT API ENDPOINTS & WORKFLOW ACTIONS
  console.log("\n--- 3. Government Backend API & Workflows ---");
  
  // 3.0 Officer Login
  let govCookie = "";
  try {
    const loginRes = await fetch("http://localhost:3001/api/gov/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: "sankeerthvss@gmail.com",
        password: "1234567890",
      }),
    });
    const loginData = (await loginRes.json()) as any;
    assert(loginData.success === true && loginData.token, `Officer login successful (Token: ${loginData.token?.slice(0, 10)}...)`);
    govCookie = `FORMLY_GOV_SESSION=${loginData.token}; formly_gov_session=${loginData.token}`;
  } catch (e: any) {
    assert(false, `Officer login error: ${e.message}`);
  }

  const authHeaders = {
    "Content-Type": "application/json",
    Cookie: govCookie,
  };

  // 3.1 GET /api/gov/me
  try {
    const res = await fetch("http://localhost:3001/api/gov/me", { headers: authHeaders });
    const data = (await res.json()) as any;
    assert(data.success === true && data.employee?.id, `GET /api/gov/me returns authorized officer profile (${data.employee?.name})`);
  } catch (e: any) {
    assert(false, `GET /api/gov/me error: ${e.message}`);
  }

  // 3.2 GET /api/gov/applications
  try {
    const res = await fetch("http://localhost:3001/api/gov/applications", { headers: authHeaders });
    const data = (await res.json()) as any;
    assert(data.success === true && Array.isArray(data.applications) && data.applications.length > 0, `GET /api/gov/applications returns application list (found ${data.applications?.length})`);
  } catch (e: any) {
    assert(false, `GET /api/gov/applications error: ${e.message}`);
  }

  // 3.3 GET /api/gov/applications/PAN-2026-0001
  try {
    const res = await fetch("http://localhost:3001/api/gov/applications/PAN-2026-0001", { headers: authHeaders });
    const data = (await res.json()) as any;
    assert(data.success === true && data.application?.id === "PAN-2026-0001", "GET /api/gov/applications/PAN-2026-0001 returns full application payload");
    assert(data.routingRecommendation !== undefined, "Model 1 routing recommendation payload included");
    assert(Array.isArray(data.entityResolutions), "Model 2 entity resolution candidates array included");
    assert(Array.isArray(data.auditLogs) && data.auditLogs.length > 0, "Audit logs included with application");
  } catch (e: any) {
    assert(false, `GET /api/gov/applications/PAN-2026-0001 error: ${e.message}`);
  }

  // 3.4 GET /api/gov/applications/PAN-2026-0003 (Access Restricted regression check)
  try {
    const res = await fetch("http://localhost:3001/api/gov/applications/PAN-2026-0003", { headers: authHeaders });
    const data = (await res.json()) as any;
    assert(data.success === true && data.application?.id === "PAN-2026-0003", "GET /api/gov/applications/PAN-2026-0003 is NOT blocked by Access Restricted");
  } catch (e: any) {
    assert(false, `GET /api/gov/applications/PAN-2026-0003 error: ${e.message}`);
  }

  // 3.5 GET /api/gov/exceptions
  try {
    const res = await fetch("http://localhost:3001/api/gov/exceptions", { headers: authHeaders });
    const data = (await res.json()) as any;
    assert(data.success === true && Array.isArray(data.exceptions) && data.exceptions.length > 0, `GET /api/gov/exceptions returns active exceptions (found ${data.exceptions?.length})`);
  } catch (e: any) {
    assert(false, `GET /api/gov/exceptions error: ${e.message}`);
  }

  // 3.6 GET /api/gov/audit
  try {
    const res = await fetch("http://localhost:3001/api/gov/audit", { headers: authHeaders });
    const data = (await res.json()) as any;
    assert(data.success === true && Array.isArray(data.auditLogs) && data.auditLogs.length > 0, `GET /api/gov/audit returns tamper-evident audit logs (found ${data.auditLogs?.length})`);
  } catch (e: any) {
    assert(false, `GET /api/gov/audit error: ${e.message}`);
  }

  // 3.7 POST /api/gov/applications (Create new application)
  let createdAppId = "";
  try {
    const res = await fetch("http://localhost:3001/api/gov/applications", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        applicantName: "Audit Test Citizen",
        applicantEmail: "audit.citizen@example.com",
        applicantPhone: "9876543210",
        consentGranted: true,
        citizenData: {
          fullName: "Audit Test Citizen",
          fatherName: "Father Citizen",
          dateOfBirth: "1995-05-15",
          gender: "MALE",
          address: "123 Test Avenue, Cyberabad",
          pincode: "500081",
        },
      }),
    });
    const data = (await res.json()) as any;
    assert(data.success === true && data.application?.id, `POST /api/gov/applications created application with monotonic ID: ${data.application?.id}`);
    createdAppId = data.application?.id;
  } catch (e: any) {
    assert(false, `POST /api/gov/applications error: ${e.message}`);
  }

  // 3.8 Workflow Action: Confirm Route
  if (createdAppId) {
    try {
      const res = await fetch(`http://localhost:3001/api/gov/applications/${createdAppId}/confirm-route`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          serviceId: "a0000000-0000-0000-0000-000000000002",
          departmentId: "d0000000-0000-0000-0000-000000000002",
          officeId: "o0000000-0000-0000-0000-000000000003",
        }),
      });
      const data = (await res.json()) as any;
      assert(data.success === true, `Confirm Route action executed successfully for ${createdAppId} (Response: ${JSON.stringify(data)})`);
    } catch (e: any) {
      assert(false, `Confirm Route error: ${e.message}`);
    }

    // 3.9 Workflow Action: Return for Correction
    try {
      const res = await fetch(`http://localhost:3001/api/gov/applications/${createdAppId}/return`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          category: "Document mismatch",
          field: "Address Proof",
          reason: "Please upload a clearer address proof or updated utility bill.",
        }),
      });
      const data = (await res.json()) as any;
      assert(data.success === true, `Return for Correction action executed successfully for ${createdAppId}`);
    } catch (e: any) {
      assert(false, `Return for Correction error: ${e.message}`);
    }

    // 3.10 Citizen Resubmission for Returned Application (PAN-2026-0004)
    try {
      const res = await fetch("http://localhost:3000/api/track/PAN-2026-0004/resubmit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "FORMLY_CITIZEN_SESSION=test-citizen-token; formly_citizen_session=test-citizen-token; seva_saarthi_session=test-citizen-token",
        },
        body: JSON.stringify({
          updatedFields: {
            address: "123 Updated Street, Cyberabad",
            pincode: "500081",
          },
        }),
      });
      const data = (await res.json()) as any;
      assert(data.success === true, `Citizen resubmission returned PAN-2026-0004 to officer desk`);
    } catch (e: any) {
      assert(false, `Citizen resubmission error: ${e.message}`);
    }

    // 3.11 Workflow Action: Officer Accept / Approve
    try {
      const res = await fetch(`http://localhost:3001/api/gov/applications/${createdAppId}/accept`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          remarks: "All statutory identity verifications and documents validated.",
        }),
      });
      const data = (await res.json()) as any;
      const allocatedPan = data.application?.physicalCard?.panNumber || data.application?.panNumber;
      assert(data.success === true && allocatedPan, `Officer Accept generated statutory identifier: ${allocatedPan}`);
    } catch (e: any) {
      assert(false, `Officer Accept error: ${e.message}`);
    }

    // 3.12 Workflow Action: Advance Physical Card Stages
    try {
      const stages = ["CARD_PRINTING", "DISPATCHED", "DELIVERED"];
      let advanceSuccess = true;
      for (const targetStage of stages) {
        const res = await fetch(`http://localhost:3001/api/gov/applications/${createdAppId}/advance`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ stage: targetStage }),
        });
        const data = (await res.json()) as any;
        if (!data.success) advanceSuccess = false;
      }
      assert(advanceSuccess, `Physical Card pipeline advanced to DELIVERED status for ${createdAppId}`);
    } catch (e: any) {
      assert(false, `Advance Stage error: ${e.message}`);
    }
  }

  // 4. CROSS-SYSTEM & AI PIPELINE INTEGRITY
  console.log("\n--- 4. Cross-System AI Pipeline Integrity ---");
  
  // 4.1 Model 1 Router Verification
  try {
    const { WorkflowRouter } = await import("../src/lib/server/ai/workflow-router");
    const m1Pan = await WorkflowRouter.routeApplication({
      applicationId: "TEST-M1-001",
      serviceId: "a0000000-0000-0000-0000-000000000002",
      serviceName: "Instant e-PAN & Physical Card Issuance (Form 49A)",
      applicationTitle: "Instant e-PAN",
      applicationDescription: "PAN Card Application",
    });
    assert(m1Pan && m1Pan.confidenceScore >= 0.85, "Model 1 routed PAN application with high confidence");

    const m1Sch = await WorkflowRouter.routeApplication({
      applicationId: "TEST-M1-002",
      serviceId: "a0000000-0000-0000-0000-000000000001",
      serviceName: "Post-Matric Scholarship Scheme (NSP)",
      applicationTitle: "Higher Education Scholarship",
      applicationDescription: "Post-Matric scholarship application",
    });
    assert(m1Sch && m1Sch.suggestedDepartmentName?.includes("Education"), "Model 1 routed Scholarship application to Education department");
  } catch (e: any) {
    assert(false, `Model 1 AI Router error: ${e.message}`);
  }

  // 4.2 Model 2 V4.2 Entity Resolution Engine
  try {
    const { EntityResolutionEngineV4 } = await import("../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine");
    const m2Engine = new EntityResolutionEngineV4();
    const m2Result = await m2Engine.resolve({
      name: "Sai Sankeerth",
      dateOfBirth: "1998-05-15",
      fatherName: "V S Sastry",
      address: "Flat 402, Sri Sai Residency, Madhapur, Hyderabad",
      pincode: "500081",
      consentVerified: true,
      allowedRegistries: ["revenue_registry", "pan_tax_registry", "education_registry"],
    });
    assert(m2Result && Array.isArray(m2Result.candidates) && m2Result.candidates.length > 0, `Model 2 V4.2 retrieved candidates (${m2Result.candidates.length} matches, Tier: ${m2Result.bestMatch?.confidenceTier})`);
  } catch (e: any) {
    assert(false, `Model 2 AI Engine error: ${e.message}`);
  }

  // 5. AUDIT & TAMPER-EVIDENCE INTEGRITY
  console.log("\n--- 5. Audit Trail & Cryptographic Verification ---");
  try {
    const { getAuditLogs, calculateAuditTamperHash } = await import("../src/lib/server/db");
    const logs = await getAuditLogs("PAN-2026-0001");
    assert(logs.length > 0, `Audit logs present for PAN-2026-0001 (${logs.length} entries)`);
    let hashCheckPassed = true;
    for (const entry of logs) {
      const recomputed = calculateAuditTamperHash(entry);
      if (entry.tamperHash !== recomputed) {
        hashCheckPassed = false;
      }
    }
    assert(hashCheckPassed, "All audit log entries have cryptographically verified SHA-256 tamper hashes");
  } catch (e: any) {
    assert(false, `Audit integrity check error: ${e.message}`);
  }

  console.log("\n========================================================================");
  console.log(`TOTAL AUDIT CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`SYSTEM INTEGRITY SCORE: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log("========================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAtoZAudit().catch((err) => {
  console.error("FATAL AUDIT ERROR:", err);
  process.exit(1);
});
