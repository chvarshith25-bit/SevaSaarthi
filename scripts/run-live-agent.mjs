import { chromium } from "playwright";

async function runLiveGovernmentAgent() {
  console.log("==================================================");
  console.log("🤖 SEVA SAARTHI AUTONOMOUS LIVE GOVERNMENT & PAN AGENT");
  console.log("==================================================");

  // Applicant Profile Data from Seva Saarthi / Formly Verified Vault
  let profile = {
    fullName: "Citizen Applicant",
    firstName: "Citizen",
    lastName: "",
    dob: "15/08/2001",
    gender: "Male",
    aadhaarNo: "5492 8173 9012",
    mobile: "9876543210",
    email: "citizen@example.com",
    domicileState: "Delhi",
    college: "National Institute of Technology",
    course: "B.Tech Computer Science",
    rollNo: "22071A0589",
    annualIncome: "180000",
    bankAccount: "38491029481",
    bankIfsc: "SBIN0012948",
  };

  if (process.env.USER_PROFILE_JSON) {
    try {
      const parsed = JSON.parse(process.env.USER_PROFILE_JSON);
      profile = { ...profile, ...parsed };
      console.log(`👤 Using actual citizen profile for: ${profile.fullName}`);
    } catch (e) {
      console.warn("Could not parse USER_PROFILE_JSON, falling back to default");
    }
  }

  const targetUrl =
    process.env.TARGET_URL ||
    process.argv[2] ||
    "https://onlineservices.proteantech.in/paam/endUserRegisterContact.html";

  if (process.env.ALLOW_LIVE_PORTAL_AUTOMATION !== "true" && !targetUrl.includes("localhost") && !targetUrl.includes("127.0.0.1")) {
    console.error("==================================================");
    console.error("⛔ STATUTORY COMPLIANCE SAFEGUARD TRIGGERED");
    console.error("Automated headless scraping against live production sovereign government endpoints");
    console.error("(such as proteantech.in / scholarships.gov.in) is prohibited under DPDP Act 2023");
    console.error("and IT Act 2000 Section 43/66 without formal bilateral sovereign API agreements.");
    console.error("Execution halted. Please use Formly Standardized Connectors or local mock endpoints.");
    console.error("==================================================");
    process.exit(0);
  }

  console.log(`🚀 Launching visible Google Chrome/Chromium window on: ${targetUrl}`);

  // Launch a real visible browser window
  const browser = await chromium.launch({
    headless: false,
    slowMo: 80,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: null, // Full screen
  });

  const page = await context.newPage();

  try {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  } catch (err) {
    console.log(`⚠️ Network note: Proceeding with loaded page content.`);
  }

  console.log("💉 Injecting Seva Saarthi AI Floating Companion HUD into the webpage...");

  // Inject Seva Saarthi Floating HUD into the actual webpage DOM
  await page.evaluate((prof) => {
    const hud = document.createElement("div");
    hud.id = "formly-live-hud";
    hud.innerHTML = `
      <div style="position: fixed; top: 16px; right: 16px; z-index: 99999999; background: #0f172a; color: white; padding: 18px; border-radius: 20px; box-shadow: 0 20px 45px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 380px; border: 2px solid #6366f1; animation: slideIn 0.4s ease;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 30px; height: 30px; background: #6366f1; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px;">🤖</div>
            <div>
              <strong style="font-size: 13px; display: block;">Seva Saarthi AI Agent Active</strong>
              <span style="font-size: 10px; color: #94a3b8;">Protean & Govt Portals</span>
            </div>
          </div>
          <span id="formly-status-pill" style="font-size: 10px; background: #22c55e; color: black; font-weight: bold; padding: 3px 8px; border-radius: 9999px;">AUTONOMOUS</span>
        </div>
        
        <div id="formly-action-text" style="font-size: 11px; color: #cbd5e1; margin-bottom: 12px; font-family: monospace; min-height: 32px; background: #1e293b; padding: 10px; border-radius: 10px; line-height: 1.4;">
          Scanning portal controls...
        </div>

        <div id="seva-saarthiroval-box" style="display: none; background: #451a03; border: 1px solid #f59e0b; padding: 14px; border-radius: 14px; margin-top: 10px;">
          <div style="font-size: 12px; font-weight: bold; color: #fef3c7; margin-bottom: 6px;">🛡️ Submission Permission Required</div>
          <div style="font-size: 11px; color: #fde68a; margin-bottom: 10px; line-height: 1.4;">
            All fields filled for <strong>${prof.fullName}</strong>.<br/>
            ⚠️ <em>Please solve the Captcha code shown on the portal and click Submit.</em>
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="formly-btn-approve" style="flex: 1; background: #16a34a; color: white; font-weight: bold; border: none; padding: 9px 12px; border-radius: 10px; cursor: pointer; font-size: 11px;">✓ Ready to Submit</button>
            <button id="formly-btn-cancel" style="flex: 1; background: #334155; color: #e2e8f0; font-weight: bold; border: none; padding: 9px 12px; border-radius: 10px; cursor: pointer; font-size: 11px;">Cancel</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(hud);
  }, profile);

  const updateHud = async (msg) => {
    await page.evaluate((text) => {
      const el = document.getElementById("formly-action-text");
      if (el) el.innerText = text;
    }, msg);
  };

  // 1. Fill Dropdowns on Protean / Government Portal
  console.log("🔍 Inspecting dropdown selectors on page...");
  await updateHud("Selecting Application Type: New PAN - Indian Citizen (Form 49A)...");

  try {
    const selects = await page.$$("select");
    for (const sel of selects) {
      const name = ((await sel.getAttribute("name")) || (await sel.getAttribute("id")) || "").toLowerCase();
      if (name.includes("apptype") || name.includes("type")) {
        await sel.selectOption({ index: 1 }); // Form 49A
        await page.waitForTimeout(500);
      }
      if (name.includes("cat") || name.includes("category")) {
        await sel.selectOption({ label: "INDIVIDUAL" }).catch(() => sel.selectOption({ index: 1 }));
        await page.waitForTimeout(500);
      }
      if (name.includes("title") || name.includes("salutation")) {
        await sel.selectOption({ label: "Shri" }).catch(() => sel.selectOption({ index: 1 }));
        await page.waitForTimeout(500);
      }
    }
  } catch {}

  // 2. Fill Text Inputs
  const fieldMatchers = [
    { key: "lastName", value: profile.lastName, patterns: ["lastname", "last_name", "surname", "txtlastname"] },
    { key: "firstName", value: profile.firstName, patterns: ["firstname", "first_name", "txtfirstname"] },
    { key: "fullName", value: profile.fullName, patterns: ["name", "applicant", "student", "full_name"] },
    { key: "dob", value: profile.dob, patterns: ["dob", "birth", "date", "txtdob"] },
    { key: "mobile", value: profile.mobile, patterns: ["mobile", "phone", "contact", "txtmobile"] },
    { key: "email", value: profile.email, patterns: ["email", "mail", "txtemail"] },
    { key: "aadhaar", value: profile.aadhaarNo, patterns: ["aadhaar", "uid", "aadhar"] },
    { key: "income", value: profile.annualIncome, patterns: ["income", "family_income", "annual"] },
    { key: "college", value: profile.college, patterns: ["college", "institute", "institution", "university"] },
    { key: "rollNo", value: profile.rollNo, patterns: ["roll", "reg", "registration"] },
    { key: "account", value: profile.bankAccount, patterns: ["account", "acc_no", "bank_acc"] },
    { key: "ifsc", value: profile.bankIfsc, patterns: ["ifsc", "ifsc_code"] },
  ];

  let filledCount = 0;

  for (const matcher of fieldMatchers) {
    const selectorQuery = matcher.patterns
      .map((p) => `input[name*="${p}" i], input[id*="${p}" i], input[placeholder*="${p}" i], input[aria-label*="${p}" i]`)
      .join(", ");

    try {
      const inputEl = await page.$(selectorQuery);
      if (inputEl) {
        const val = await inputEl.inputValue();
        if (!val) {
          await inputEl.scrollIntoViewIfNeeded();
          await updateHud(`Auto-filling ${matcher.key}: "${matcher.value}"`);
          console.log(`✍️ Auto-filling field [${matcher.key}] with "${matcher.value}"`);

          await inputEl.evaluate((el) => {
            el.style.border = "3px solid #22c55e";
            el.style.boxShadow = "0 0 12px rgba(34, 197, 94, 0.6)";
          });

          await inputEl.fill(matcher.value);
          filledCount++;
          await page.waitForTimeout(400);
        }
      }
    } catch {}
  }

  // 3. Tick Consent Checkbox
  try {
    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const chk of checkboxes) {
      await chk.check();
      filledCount++;
    }
  } catch {}

  console.log(`✅ Form auto-fill complete (${filledCount} elements updated).`);
  await updateHud(`Form auto-filled with ${filledCount} verified items. Please solve captcha.`);

  // Show in-page Human Approval Dialog
  await page.evaluate(() => {
    const appBox = document.getElementById("seva-saarthiroval-box");
    if (appBox) appBox.style.display = "block";
    const pill = document.getElementById("formly-status-pill");
    if (pill) {
      pill.innerText = "AWAITING APPROVAL";
      pill.style.background = "#f59e0b";
      pill.style.color = "#000";
    }
  });

  console.log("==================================================");
  console.log("🛡️ HUMAN-IN-THE-LOOP APPROVAL REQUIRED");
  console.log("👉 The browser window is open with Protean PAN card form.");
  console.log("👉 All verified fields are filled.");
  console.log("👉 Solve the Captcha in the browser and click 'Ready to Submit'!");
  console.log("==================================================");
}

runLiveGovernmentAgent().catch(console.error);
