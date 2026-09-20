import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve("docs/demo/sarkar-seva/final-review");

async function main() {
  console.log("========================================================================");
  console.log("PHASE 9.0.7 — COMPLETE SARKAR SEVA CASE REVIEW BROWSER VALIDATION");
  console.log("========================================================================");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Authenticate as Officer
  console.log("\n[Auth] Authenticating as Officer OFF-PAN-7042...");
  const loginRes = await fetch("http://localhost:3001/api/gov/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId: "OFF-PAN-7042", password: "GovOfficer@2026" }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    throw new Error(`Failed to login: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.token;
  console.log("  ✓ Session token acquired successfully:", token.slice(0, 12) + "...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  await context.addCookies([
    {
      name: "FORMLY_GOV_SESSION",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "formly_gov_session",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  // Test 1: Clean Case PAN-2026-0001 (Sai Sankeerth)
  console.log("\n[Test 1] Visiting Case Review: http://localhost:3001/government/applications/PAN-2026-0001/review");
  await page.goto("http://localhost:3001/government/applications/PAN-2026-0001/review", { waitUntil: "networkidle" });
  await page.waitForSelector("text=PAN-2026-0001", { timeout: 10000 });

  // 1. Overview screenshot
  await page.screenshot({ path: path.join(OUTPUT_DIR, "01_application_overview.png"), fullPage: true });
  console.log("  ✓ 01_application_overview.png captured");

  // 2. Workflow routing
  const routingElement = page.locator("text=Workflow Routing").first();
  await routingElement.scrollIntoViewIfNeeded();
  await page.click('button:has-text("View routing details")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "02_workflow_routing.png") });
  console.log("  ✓ 02_workflow_routing.png captured");

  // 3. AI-assisted identity match
  const identityElement = page.locator("text=AI-Assisted Identity Match").first();
  await identityElement.scrollIntoViewIfNeeded();
  await page.click('button:has-text("View AI Technical Details")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "03_ai_assisted_identity_match.png") });
  console.log("  ✓ 03_ai_assisted_identity_match.png captured");

  // 4. Document Viewer Modal
  console.log("\n[Test 2] Testing Document Viewer Modal...");
  const viewDocBtn = page.locator('button:has-text("View Document")').first();
  await viewDocBtn.scrollIntoViewIfNeeded();
  await viewDocBtn.click();
  await page.waitForSelector("text=SYNTHETIC DEMONSTRATION DOCUMENT", { timeout: 10000 });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "05_document_viewer_modal.png") });
  console.log("  ✓ 05_document_viewer_modal.png captured");
  await page.click('button[title="Close Preview"]');

  // 5. Government Record Viewer Modal
  console.log("\n[Test 3] Testing Government Record Viewer Modal...");
  const viewRecordBtn = page.locator('button:has-text("View Record")').first();
  await viewRecordBtn.scrollIntoViewIfNeeded();
  await viewRecordBtn.click();
  await page.waitForSelector("text=SYNTHETIC DEMONSTRATION RECORD", { timeout: 10000 });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "06_government_record_viewer_modal.png") });
  console.log("  ✓ 06_government_record_viewer_modal.png captured");
  await page.click('button[title="Close Record"]');

  // 6. Verification Checklist
  const verificationElement = page.locator("text=Verification Checklist").first();
  await verificationElement.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUTPUT_DIR, "07_verification_checklist.png") });
  console.log("  ✓ 07_verification_checklist.png captured");

  // 7. Decision & Activity History
  const historyElement = page.locator("text=Decision & Activity History").first();
  await historyElement.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUTPUT_DIR, "08_decision_activity_history.png") });
  console.log("  ✓ 08_decision_activity_history.png captured");

  // 8. Officer Decision Safety Modal
  console.log("\n[Test 4] Testing Officer Decision Confirmation Modal...");
  const approveBtn = page.locator('button:has-text("Approve Application")').first();
  await approveBtn.scrollIntoViewIfNeeded();
  await approveBtn.click();
  await page.waitForSelector("text=OFFICER CONFIRMATION", { timeout: 10000 });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "09_officer_decision_modal.png") });
  console.log("  ✓ 09_officer_decision_modal.png captured");
  await page.click('button:has-text("Cancel")');

  // 9. Collision Case: PAN-2026-0003 (Rahul Verma)
  console.log("\n[Test 5] Visiting Collision Case: PAN-2026-0003...");
  await page.goto("http://localhost:3001/government/applications/PAN-2026-0003/review", { waitUntil: "networkidle" });
  await page.waitForSelector("text=IDENTITY CONFLICT DETECTED", { timeout: 10000 });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "04_collision_case_pan_0003.png"), fullPage: true });
  console.log("  ✓ 04_collision_case_pan_0003.png captured");

  // 10. Mobile Responsive Review (375x812)
  console.log("\n[Test 6] Testing Mobile Viewport (375x812)...");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://localhost:3001/government/applications/PAN-2026-0001/review", { waitUntil: "networkidle" });
  await page.waitForSelector("text=PAN-2026-0001", { timeout: 10000 });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "10_mobile_review.png"), fullPage: true });
  console.log("  ✓ 10_mobile_review.png captured");

  await browser.close();
  console.log("\n========================================================================");
  console.log("ALL 10 BROWSER VALIDATION SCREENSHOTS CAPTURED (100%)");
  console.log("========================================================================");
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("FATAL ERROR IN LIVE BROWSER REVIEW TEST:", err);
  process.exit(1);
});
