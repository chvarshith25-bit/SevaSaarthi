import { chromium } from "playwright";
import assert from "assert";

async function main() {
  console.log("========================================================================");
  console.log("TESTING SARKAR SEVA CITIZEN CORRECTION WORKFLOW & ISSUE CLEANUP");
  console.log("========================================================================");

  // 1. Reset demo state
  const rootLogin = await fetch("http://localhost:3001/api/gov/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId: "SYS-ROOT-0099", password: "govsecure2026" }),
  });
  const rootData = await rootLogin.json();
  const resetRes = await fetch("http://localhost:3001/api/gov/reset", {
    method: "POST",
    headers: { Cookie: `FORMLY_GOV_SESSION=${rootData.token}` },
  });
  const resetData = await resetRes.json();
  assert(resetData.success === true, "Database reset succeeded");
  console.log("✓ Initial state cleanly reset");

  // 2. Login as officer
  const loginRes = await fetch("http://localhost:3001/api/gov/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId: "OFF-PAN-7042", password: "GovOfficer@2026" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([
    {
      name: "FORMLY_GOV_SESSION",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  // Test on PAN-2026-0002
  console.log("\n[Test 1] Reviewing PAN-2026-0002 before correction...");
  await page.goto("http://localhost:3001/government/applications/PAN-2026-0002/review", { waitUntil: "networkidle" });
  await page.waitForSelector("text=PAN-2026-0002", { timeout: 10000 });

  // Verify SLA Risk is NOT present
  const slaRiskCount = await page.locator("text=STATUTORY SLA OVERDUE").count();
  assert.strictEqual(slaRiskCount, 0, "SLA Risk card should NOT be in Issues Requiring Attention");
  console.log("  ✓ SLA Risk card successfully removed");

  // Click Request Correction
  console.log("\n[Test 2] Requesting correction from issue card...");
  const reqBtn = page.locator('button:has-text("Request Correction")').first();
  await reqBtn.click();
  await page.waitForSelector("text=Request Citizen Correction", { timeout: 5000 });

  await page.fill('textarea', "Please re-upload a clear color scan of your Class 10 certificate.");
  await page.click('button:has-text("Send Request to Citizen")');

  await page.waitForTimeout(1000);
  console.log("  ✓ Request submitted to citizen");

  // Verify after return
  console.log("\n[Test 3] Verifying clean single issue and disabled duplicate requests...");
  await page.waitForSelector("text=Awaiting Citizen Resubmission", { timeout: 5000 });

  // Verify "Request Correction" button in sticky panel is disabled
  const alreadyReqBtn = page.locator('button:has-text("Correction Already Requested")');
  assert((await alreadyReqBtn.count()) > 0, "Button text should be 'Correction Already Requested'");
  assert(await alreadyReqBtn.isDisabled(), "Button should be disabled to prevent duplicate submissions");
  console.log("  ✓ Sticky 'Request Correction' button is disabled (duplicate requests prevented)");

  // Test "View Instructions" modal
  console.log("\n[Test 4] Testing 'View Instructions' modal...");
  const viewInstrBtn = page.locator('button:has-text("View Instructions")').first();
  await viewInstrBtn.click();
  await page.waitForSelector("text=Citizen Correction Instructions", { timeout: 5000 });
  await page.waitForSelector("text=DISPATCHED TO CITIZEN", { timeout: 5000 });
  console.log("  ✓ 'View Instructions' modal opened showing dispatched instructions");

  await page.click('button:has-text("Close")');
  await page.waitForTimeout(300);

  await browser.close();

  console.log("\n========================================================================");
  console.log("ALL CITIZEN CORRECTION & ISSUE CLEANUP TESTS PASSED (100%)");
  console.log("========================================================================");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
