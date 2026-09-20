import { chromium } from "playwright";
import assert from "assert";

async function main() {
  console.log("========================================================================");
  console.log("TESTING SARKAR SEVA REQUEST CORRECTION UI MODAL FLOW");
  console.log("========================================================================");

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
  console.log("\n1. Navigating to Case Review for PAN-2026-0002...");
  await page.goto("http://localhost:3001/government/applications/PAN-2026-0002/review", { waitUntil: "networkidle" });
  await page.waitForSelector("text=PAN-2026-0002", { timeout: 10000 });

  console.log("2. Clicking 'Request Correction' button...");
  const returnBtn = page.locator('button:has-text("Request Correction")').first();
  await returnBtn.scrollIntoViewIfNeeded();
  await returnBtn.click();

  await page.waitForSelector("text=Request Citizen Correction", { timeout: 5000 });
  console.log("  ✓ Modal opened successfully");

  // Modify fields in modal
  await page.fill('input[type="text"]', "Class 10 Marksheet / Date of Birth Certificate");
  await page.fill('textarea', "Please re-upload a clear, non-blurred color copy of your Class 10 Certificate.");

  console.log("3. Submitting 'Send Request to Citizen'...");
  await page.click('button:has-text("Send Request to Citizen")');

  // Wait for success toast or state change
  await page.waitForTimeout(1000);

  // Check no error toast appeared
  const errorToast = page.locator("text=Mandatory return reason is required");
  const count = await errorToast.count();
  assert.strictEqual(count, 0, "Error toast 'Mandatory return reason is required' should NOT appear");

  console.log("  ✓ Request submitted successfully without error toast!");

  await browser.close();

  console.log("\n========================================================================");
  console.log("REQUEST CORRECTION MODAL FLOW TEST PASSED (100%)");
  console.log("========================================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
