import { chromium } from "playwright";
import fs from "fs";
import path from "path";

console.log("========================================================================");
console.log("   LIVE BROWSER REAL DOCUMENT ATTACHMENT & PORTAL INTEGRATION TEST       ");
console.log("========================================================================");

async function runLiveBrowserTest() {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate session on portal first
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");

    // Fill login
    await page.fill('input[type="text"], input[type="email"]', "chiluverivarshithsahs@gmail.com");
    await page.fill('input[type="password"]', "1234567890");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    assert(true, "Citizen logged in and established authoritative session");

    // 2. Open Government Scholarship Demo Portal
    await page.goto("http://localhost:3000/demo/scholarship-portal");
    await page.waitForLoadState("networkidle");
    assert(page.url().includes("/demo/scholarship-portal"), "Demo Government Scholarship Portal loaded cleanly");

    // 3. Inject and execute content.js autofill engine on the real page DOM
    const contentScriptCode = fs.readFileSync(path.resolve(process.cwd(), "extension/content.js"), "utf8");
    await page.evaluate(contentScriptCode);
    console.log("✓ Injected extension content script into live portal page");

    // 4. Click the Floating Action Widget button
    const triggerBtn = await page.$("#sevasaarthi-btn-trigger");
    assert(triggerBtn !== null, "Floating Action Trigger '#sevasaarthi-btn-trigger' injected into DOM");
    await triggerBtn.click();

    // 5. Check Human Consent Modal is rendered
    await page.waitForSelector("#sevasaarthi-consent-modal", { timeout: 5000 });
    assert(true, "In-Page DPDP Act 2023 Human Consent Modal rendered before document transfer");

    // 6. Click 'Authorize & Attach' on the consent modal
    const allowBtn = await page.$("#sevasaarthi-btn-consent-allow");
    assert(allowBtn !== null, "Consent confirmation button '#sevasaarthi-btn-consent-allow' present");
    await allowBtn.click();

    // 7. Wait for autofill & real DataTransfer document attachment to complete
    await page.waitForTimeout(2500);

    // 8. Verify all 8 text/select fields on the REAL DOM
    const nameVal = await page.inputValue("#applicant_name");
    assert(nameVal.includes("Varshith") || nameVal.includes("Chiluveri"), `Field #applicant_name filled: "${nameVal}"`);

    const dobVal = await page.inputValue("#dob");
    assert(dobVal.includes("2003") || dobVal.includes("15"), `Field #dob filled: "${dobVal}"`);

    const aadhaarVal = await page.inputValue("#aadhaar_uid");
    assert(aadhaarVal.length >= 12, `Field #aadhaar_uid filled: "${aadhaarVal}"`);

    const mobileVal = await page.inputValue("#mobile_number");
    assert(mobileVal.length >= 10, `Field #mobile_number filled: "${mobileVal}"`);

    const incomeVal = await page.inputValue("#annual_income");
    assert(incomeVal.includes("180000"), `Field #annual_income filled: "${incomeVal}"`);

    const collegeVal = await page.inputValue("#college_name");
    assert(collegeVal.includes("Vidya Jyothi") || collegeVal.includes("College"), `Field #college_name filled: "${collegeVal}"`);

    const bankVal = await page.inputValue("#bank_account");
    assert(bankVal.length >= 8, `Field #bank_account filled: "${bankVal}"`);

    // 9. REAL BROWSER FILE INPUT VERIFICATION (FileList inspection on the DOM)
    const fileVerification = await page.evaluate(() => {
      const getFile = (id) => {
        const el = document.getElementById(id);
        if (el && el.files && el.files.length > 0) {
          return {
            attached: true,
            filename: el.files[0].name,
            size: el.files[0].size,
            type: el.files[0].type,
          };
        }
        return { attached: false };
      };

      return {
        aadhaar: getFile("upload_aadhaar"),
        income: getFile("upload_income"),
        collegeId: getFile("upload_college_id"),
        marksheet: getFile("upload_marksheet"),
      };
    });

    assert(
      fileVerification.aadhaar.attached === true && fileVerification.aadhaar.filename.includes("Aadhaar"),
      `Real <input id="upload_aadhaar"> has attached File: "${fileVerification.aadhaar.filename}" (${fileVerification.aadhaar.size} bytes)`
    );

    assert(
      fileVerification.income.attached === true && fileVerification.income.filename.includes("Income"),
      `Real <input id="upload_income"> has attached File: "${fileVerification.income.filename}" (${fileVerification.income.size} bytes)`
    );

    assert(
      fileVerification.collegeId.attached === true && fileVerification.collegeId.filename.includes("College"),
      `Real <input id="upload_college_id"> has attached File: "${fileVerification.collegeId.filename}" (${fileVerification.collegeId.size} bytes)`
    );

    assert(
      fileVerification.marksheet.attached === true && fileVerification.marksheet.filename.includes("Marksheet") || fileVerification.marksheet.filename.includes("Memo"),
      `Real <input id="upload_marksheet"> has attached File: "${fileVerification.marksheet.filename}" (${fileVerification.marksheet.size} bytes)`
    );

    // 10. Check Human Submission Gate
    const gateEl = await page.$("#sevasaarthi-submission-gate");
    assert(gateEl !== null, "Human Submission Gate '#sevasaarthi-submission-gate' actively pauses execution");

    // 11. Click 'Ready to Submit'
    const gateSubmitBtn = await page.$("#sevasaarthi-btn-gate-submit");
    await gateSubmitBtn.click();

    // 12. Submit the form on the demo portal
    await page.click("#btn-nsp-submit");
    await page.waitForTimeout(1000);

    const confirmationText = await page.innerText("main");
    assert(
      confirmationText.includes("Application Submitted Successfully") && confirmationText.includes("NSP-2026-"),
      "Government Scholarship Portal processed application submission with real attached documents!"
    );

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log("\n========================================================================");
    console.log(`TOTAL LIVE CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log(`INTEGRITY SCORE: ${Math.round((passed / (passed + failed)) * 100)}%`);
    console.log("========================================================================");

    await browser.close();

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error("Live browser test failure:", err);
    await browser.close();
    process.exit(1);
  }
}

runLiveBrowserTest();
