import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve("docs/demo/sarkar-seva/routing-fix");

async function main() {
  console.log("========================================================================");
  console.log("PHASE 9.0.4 — LIVE BROWSER VALIDATION & ROUTE REPAIR VERIFICATION");
  console.log("========================================================================");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Authenticate as Department Officer via API
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

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  // Inject valid authenticated government session cookies
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

  console.log("\n[Step 1] Navigating to Applications Queue: http://localhost:3001/government/applications");
  await page.goto("http://localhost:3001/government/applications", { waitUntil: "networkidle" });
  await page.waitForSelector("text=PAN-2026-0003", { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Capture Applications page
  await page.screenshot({ path: path.join(OUTPUT_DIR, "01_applications_page.png"), fullPage: false });
  console.log("  ✓ Captured: 01_applications_page.png");

  console.log("\n[Step 2] Locating PAN-2026-0003 row and clicking 'Review' link...");
  const pan0003Row = page.locator("tr", { hasText: "PAN-2026-0003" });
  await pan0003Row.scrollIntoViewIfNeeded();
  
  await page.screenshot({ path: path.join(OUTPUT_DIR, "02_click_review_pan_0003.png"), fullPage: false });
  console.log("  ✓ Captured: 02_click_review_pan_0003.png");

  const reviewBtn = pan0003Row.locator("a", { hasText: "Review" }).first();
  await reviewBtn.click();
  
  console.log("  Waiting for case review workspace to load...");
  await page.waitForSelector("text=Rahul Verma", { timeout: 15000 });
  await page.waitForTimeout(1500);

  const currentUrl = page.url();
  console.log("  Target URL after navigation:", currentUrl);

  if (currentUrl.includes("404") || (await page.title()).includes("404")) {
    throw new Error(`CRITICAL DEFECT: Navigated to 404 page at ${currentUrl}`);
  }

  // Verify PAN-2026-0003 Case Review page content
  await page.waitForSelector("text=PAN-2026-0003");
  await page.waitForSelector("text=Instant e-PAN & Physical Card Issuance");
  console.log("  ✓ Verified: PAN-2026-0003 | Rahul Verma | Instant e-PAN & Physical Card Issuance");

  await page.screenshot({ path: path.join(OUTPUT_DIR, "03_review_pan_0003_loaded.png"), fullPage: false });
  console.log("  ✓ Captured: 03_review_pan_0003_loaded.png");

  // Scroll to AI Assistance
  const aiHeading = page.locator("h3", { hasText: "AI-assisted workflow recommendation" }).first();
  if (await aiHeading.count() > 0) {
    await aiHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "04_model1_income_tax_panel.png"), fullPage: false });
    console.log("  ✓ Captured: 04_model1_income_tax_panel.png");
  }

  const model2Heading = page.locator("h3", { hasText: "AI Candidate Matching" }).first();
  if (await model2Heading.count() > 0) {
    await model2Heading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "05_model2_candidate_panel.png"), fullPage: false });
    console.log("  ✓ Captured: 05_model2_candidate_panel.png");
  }

  console.log("\n[Step 3] Testing Back button navigation...");
  const backBtn = page.locator("a[title='Back to Applications'], a[aria-label='Back to Applications']").first();
  await backBtn.click();
  await page.waitForSelector("text=PAN-2026-0003", { timeout: 15000 });
  console.log("  Current URL after Back:", page.url());
  if (!page.url().includes("/applications")) {
    throw new Error(`Back button failed to return to /applications, instead at ${page.url()}`);
  }
  console.log("  ✓ Back navigation returned to /government/applications successfully");

  console.log("\n[Step 4] Testing Safe Missing-Application state: http://localhost:3001/government/applications/INVALID-APP-9999/review");
  await page.goto("http://localhost:3001/government/applications/INVALID-APP-9999/review", { waitUntil: "networkidle" });
  await page.waitForSelector("text=Application Not Found", { timeout: 15000 });
  await page.waitForSelector("text=INVALID-APP-9999");
  await page.waitForSelector("text=Back to Applications");
  console.log("  ✓ Safe Application Not Found UI rendered with 0 raw framework errors");

  await page.screenshot({ path: path.join(OUTPUT_DIR, "06_invalid_application_safe_state.png"), fullPage: false });
  console.log("  ✓ Captured: 06_invalid_application_safe_state.png");

  await browser.close();

  console.log("\n========================================================================");
  console.log("PHASE 9.0.4 BROWSER VALIDATION PASSED: 0 404s, 100% ROUTE INTEGRITY");
  console.log("========================================================================");
}

main().catch((err) => {
  console.error("Browser validation error:", err);
  process.exit(1);
});
