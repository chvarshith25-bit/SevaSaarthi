import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve("docs/demo/sarkar-seva/final-review");

async function main() {
  console.log("========================================================================");
  console.log("PHASE 9.0.8 — FINAL SARKAR SEVA OFFICER REVIEW UX VALIDATION");
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

  // 1. Application Overview
  await page.screenshot({ path: path.join(OUTPUT_DIR, "01_application_overview.png"), fullPage: true });
  console.log("  ✓ 01_application_overview.png captured");

  // 2. Verification Summary
  const summaryElement = page.locator("text=VERIFICATION SUMMARY").first();
  await summaryElement.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUTPUT_DIR, "02_verification_summary.png") });
  console.log("  ✓ 02_verification_summary.png captured");

  // 3. AI-assisted identity match - clean case
  const identityElement = page.locator("text=AI-Assisted Identity Match").first();
  await identityElement.scrollIntoViewIfNeeded();
  const aiDetailsBtn = page.locator('button:has-text("View AI Details")');
  if (await aiDetailsBtn.count() > 0) {
    await aiDetailsBtn.click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, "03_ai_assisted_identity_match.png") });
  console.log("  ✓ 03_ai_assisted_identity_match.png captured");

  // 4. Documents Section
  const docSection = page.locator("text=DOCUMENTS").first();
  await docSection.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUTPUT_DIR, "05_documents_section.png") });
  console.log("  ✓ 05_documents_section.png captured");

  // 5. Document Viewer Modal
  console.log("\n[Test 2] Testing Document Viewer Modal...");
  const viewDocBtn = page.locator('button:has-text("View Document")').first();
  await viewDocBtn.scrollIntoViewIfNeeded();
  await viewDocBtn.click();
  await page.waitForSelector("text=SYNTHETIC DEMONSTRATION DOCUMENT", { timeout: 10000 });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "06_document_viewer_modal.png") });
  console.log("  ✓ 06_document_viewer_modal.png captured");
  await page.click('button[title="Close Preview"]');

  // 6. Government Records Section
  const govRecordsSection = page.locator("text=Government Records").first();
  await govRecordsSection.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUTPUT_DIR, "07_government_records_section.png") });
  console.log("  ✓ 07_government_records_section.png captured");

  // 7. Government Record Viewer Modal
  console.log("\n[Test 3] Testing Government Record Viewer Modal...");
  const viewRecordBtn = page.locator('button:has-text("View Record")').first();
  await viewRecordBtn.scrollIntoViewIfNeeded();
  await viewRecordBtn.click();
  await page.waitForSelector("text=SYNTHETIC DEMONSTRATION RECORD", { timeout: 10000 });
  const techBtn = page.locator('button:has-text("View Technical Details")');
  if (await techBtn.count() > 0) {
    await techBtn.click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, "08_government_record_viewer_modal.png") });
  console.log("  ✓ 08_government_record_viewer_modal.png captured");
  await page.click('button:has-text("Close")');

  // 8. Issues Requiring Attention (Clean Case - 0 Issues)
  const issuesSection = page.locator("text=Issues Requiring Attention").first();
  await issuesSection.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUTPUT_DIR, "10_issues_requiring_attention.png") });
  console.log("  ✓ 10_issues_requiring_attention.png captured");

  // 9. Verification Checklist
  const checkListSection = page.locator("text=VERIFICATION CHECKLIST").first();
  await checkListSection.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUTPUT_DIR, "09_verification_checklist.png") });
  console.log("  ✓ 09_verification_checklist.png captured");

  // 10. Decision Panel
  const decisionPanel = page.locator("text=OFFICER DECISION").first();
  await decisionPanel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUTPUT_DIR, "11_decision_panel.png") });
  console.log("  ✓ 11_decision_panel.png captured");

  // 11. Audit History
  const historySection = page.locator("text=DECISION & ACTIVITY HISTORY").first();
  await historySection.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUTPUT_DIR, "12_audit_history.png") });
  console.log("  ✓ 12_audit_history.png captured");

  // Test 2: Conflict Case PAN-2026-0003 (Rahul Verma)
  console.log("\n[Test 4] Testing Demographic Conflict Case PAN-2026-0003...");
  await page.goto("http://localhost:3001/government/applications/PAN-2026-0003/review", { waitUntil: "networkidle" });
  await page.waitForSelector("text=PAN-2026-0003", { timeout: 10000 });
  await page.waitForSelector("text=IDENTITY MATCH NEEDS REVIEW", { timeout: 10000 });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "04_collision_case_pan_0003.png") });
  console.log("  ✓ 04_collision_case_pan_0003.png captured");

  // Test 3: Mobile Layout
  console.log("\n[Test 5] Testing Mobile Review Layout (iPhone 14 / 390x844)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
  });
  await mobileContext.addCookies([
    {
      name: "FORMLY_GOV_SESSION",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3001/government/applications/PAN-2026-0001/review", { waitUntil: "networkidle" });
  await mobilePage.waitForSelector("text=PAN-2026-0001", { timeout: 10000 });
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "13_mobile_review.png"), fullPage: true });
  console.log("  ✓ 13_mobile_review.png captured");

  await browser.close();

  console.log("\n========================================================================");
  console.log("ALL 13 PHASE 9.0.8 BROWSER VALIDATION SCREENSHOTS CAPTURED SUCCESSFULLY!");
  console.log("========================================================================");
}

main().catch((err) => {
  console.error("FATAL Browser Flow Test Error:", err);
  process.exit(1);
});
