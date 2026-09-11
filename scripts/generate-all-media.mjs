import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const DOCS_IMAGES_DIR = path.resolve(process.cwd(), "docs", "images");
const DOCS_DEMO_DIR = path.resolve(process.cwd(), "docs", "demo");

if (!fs.existsSync(DOCS_IMAGES_DIR)) fs.mkdirSync(DOCS_IMAGES_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DEMO_DIR)) fs.mkdirSync(DOCS_DEMO_DIR, { recursive: true });

async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function smoothScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 150;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight / 2) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  await delay(600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await delay(600);
}

async function generateMedia() {
  console.log("=== FORMLY MEDIA GENERATION (SCREENSHOTS + VIDEO WALKTHROUGH) ===");

  // 1. Authenticate Citizen API
  console.log("Authenticating Citizen (sankeerths615@gmail.com)...");
  const citLoginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sankeerths615@gmail.com", password: "1234567890" }),
  });
  const citData = await citLoginRes.json();
  if (!citData.token) throw new Error("Citizen auth failed: " + JSON.stringify(citData));
  const citToken = citData.token;
  console.log("Citizen authenticated successfully. Token:", citToken.slice(0, 12) + "...");

  // 2. Authenticate Government Officer API
  console.log("Authenticating Government Officer (sankeerthvss@gmail.com)...");
  const govLoginRes = await fetch("http://localhost:3001/api/gov/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sankeerthvss@gmail.com", password: "1234567890" }),
  });
  const govData = await govLoginRes.json();
  if (!govData.token) throw new Error("Government auth failed: " + JSON.stringify(govData));
  const govToken = govData.token;
  console.log("Officer authenticated successfully. Token:", govToken.slice(0, 12) + "...");

  // 3. Launch browser
  const browser = await chromium.launch({ headless: true });

  // Record video in single context so the whole end-to-end prototype walkthrough is captured in one video
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: DOCS_DEMO_DIR, size: { width: 1280, height: 720 } },
  });

  // Inject cookies for both origins
  await context.addCookies([
    // Citizen cookies for port 3000
    { name: "FORMLY_CITIZEN_SESSION", value: citToken, url: "http://localhost:3000" },
    { name: "formly_citizen_session", value: citToken, url: "http://localhost:3000" },
    { name: "seva_saarthi_session", value: citToken, url: "http://localhost:3000" },
    // Government cookies for port 3001
    { name: "FORMLY_GOV_SESSION", value: govToken, url: "http://localhost:3001" },
    { name: "formly_gov_session", value: govToken, url: "http://localhost:3001" },
  ]);

  const page = await context.newPage();

  // Attach local storage state for citizen and gov user objects
  await page.addInitScript(
    ({ citUser, govUser }) => {
      try {
        if (window.location.port === "3000") {
          localStorage.setItem("formly_app_session_user", JSON.stringify(citUser));
          localStorage.setItem("formly_user_v1", JSON.stringify(citUser));
        } else if (window.location.port === "3001") {
          localStorage.setItem("formly_gov_session_v1", JSON.stringify(govUser));
          localStorage.setItem("formly_gov_employee_v1", JSON.stringify(govUser));
        }
      } catch (e) {}
    },
    { citUser: citData.user, govUser: govData.user }
  );

  // -------------------------------------------------------------
  // STEP 1: CITIZEN PLATFORM
  // -------------------------------------------------------------

  // 1. Citizen Login Screen (Unauthenticated context test)
  console.log("1. Capturing 01-citizen-login.png...");
  const anonContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const anonPage = await anonContext.newPage();
  await anonPage.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await delay(1500);
  await anonPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "01-citizen-login.png") });
  await anonPage.close();
  await anonContext.close();

  // 2. Citizen Dashboard
  console.log("2. Capturing 02-citizen-dashboard.png...");
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });
  await delay(2500);
  await page.screenshot({ path: path.join(DOCS_IMAGES_DIR, "02-citizen-dashboard.png") });
  await smoothScroll(page);
  await delay(1000);

  // 3. Citizen Document Vault
  console.log("3. Capturing 03-citizen-document-vault.png...");
  await page.goto("http://localhost:3000/documents", { waitUntil: "domcontentloaded" });
  await delay(2500);
  await page.screenshot({ path: path.join(DOCS_IMAGES_DIR, "03-citizen-document-vault.png") });
  await smoothScroll(page);
  await delay(1000);

  // 4. Citizen Application Live Tracker
  console.log("4. Capturing 04-citizen-live-tracker.png...");
  await page.goto("http://localhost:3000/applications/PAN-2026-0001/status", { waitUntil: "domcontentloaded" });
  try {
    await page.waitForSelector("text=PAN-2026-0001", { timeout: 10000 });
  } catch (e) {}
  await delay(2000);
  await page.screenshot({ path: path.join(DOCS_IMAGES_DIR, "04-citizen-live-tracker.png") });
  await smoothScroll(page);
  await delay(1000);

  // -------------------------------------------------------------
  // STEP 2: GOVERNMENT OPERATIONS PLATFORM
  // -------------------------------------------------------------

  // 5. Government Login Screen
  console.log("5. Capturing 05-government-login.png...");
  const govAnonContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const govAnonPage = await govAnonContext.newPage();
  await govAnonPage.goto("http://localhost:3001/login", { waitUntil: "domcontentloaded" });
  await delay(1500);
  await govAnonPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "05-government-login.png") });
  await govAnonPage.close();
  await govAnonContext.close();

  // 6. Government Operations Dashboard
  console.log("6. Capturing 06-government-dashboard.png...");
  await page.goto("http://localhost:3001/dashboard", { waitUntil: "domcontentloaded" });
  try {
    await page.waitForSelector("text=Good morning", { timeout: 10000 });
  } catch (e) {}
  await delay(2000);
  await page.screenshot({ path: path.join(DOCS_IMAGES_DIR, "06-government-dashboard.png") });
  await smoothScroll(page);
  await delay(1000);

  // 7. Government Application Queue
  console.log("7. Capturing 07-government-queue.png...");
  await page.goto("http://localhost:3001/applications", { waitUntil: "domcontentloaded" });
  try {
    await page.waitForSelector("text=PAN-2026-0001", { timeout: 10000 });
  } catch (e) {}
  await delay(2000);
  await page.screenshot({ path: path.join(DOCS_IMAGES_DIR, "07-government-queue.png") });
  await smoothScroll(page);
  await delay(1000);

  // 8. Officer Case Workspace
  console.log("8. Capturing 08-government-workspace.png...");
  await page.goto("http://localhost:3001/applications/PAN-2026-0001", { waitUntil: "domcontentloaded" });
  try {
    await page.waitForSelector("text=PAN-2026-0001", { timeout: 10000 });
  } catch (e) {}
  await delay(2500);
  await page.screenshot({ path: path.join(DOCS_IMAGES_DIR, "08-government-workspace.png") });
  await smoothScroll(page);
  await delay(1500);

  // 9. Interoperability Hub & Data Mapper
  console.log("9. Capturing 09-interoperability-hub.png...");
  await page.goto("http://localhost:3001/data-mapper", { waitUntil: "domcontentloaded" });
  await delay(2500);
  await page.screenshot({ path: path.join(DOCS_IMAGES_DIR, "09-interoperability-hub.png") });
  await smoothScroll(page);
  await delay(1000);

  // 10. Audit Center
  console.log("10. Capturing 10-audit-trail.png...");
  await page.goto("http://localhost:3001/audit", { waitUntil: "domcontentloaded" });
  await delay(2500);
  await page.screenshot({ path: path.join(DOCS_IMAGES_DIR, "10-audit-trail.png") });
  await smoothScroll(page);
  await delay(1000);

  console.log("Closing page and saving demo video...");
  await page.close();
  await context.close();
  await browser.close();

  // Find generated webm video and rename to standard name
  const files = fs.readdirSync(DOCS_DEMO_DIR);
  const webms = files.filter((f) => f.endsWith(".webm") && f !== "formly-prototype-walkthrough.webm");
  if (webms.length > 0) {
    webms.sort((a, b) => {
      const sA = fs.statSync(path.join(DOCS_DEMO_DIR, a)).size;
      const sB = fs.statSync(path.join(DOCS_DEMO_DIR, b)).size;
      return sB - sA;
    });
    const bestVideo = webms[0];
    const finalVideoPath = path.join(DOCS_DEMO_DIR, "formly-prototype-walkthrough.webm");
    if (fs.existsSync(finalVideoPath)) fs.unlinkSync(finalVideoPath);
    fs.renameSync(path.join(DOCS_DEMO_DIR, bestVideo), finalVideoPath);

    // Clean up any remaining temporary webm files
    for (const other of webms.slice(1)) {
      try {
        fs.unlinkSync(path.join(DOCS_DEMO_DIR, other));
      } catch {}
    }

    const stat = fs.statSync(finalVideoPath);
    console.log(`Video walkthrough recorded successfully: ${finalVideoPath} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
  }

  // Print summary of screenshots
  console.log("\n=== VERIFIED SCREENSHOTS IN docs/images/ ===");
  const images = fs.readdirSync(DOCS_IMAGES_DIR).filter((f) => f.endsWith(".png"));
  for (const img of images) {
    const stat = fs.statSync(path.join(DOCS_IMAGES_DIR, img));
    console.log(`  ✓ ${img} (${(stat.size / 1024).toFixed(1)} KB)`);
  }
}

generateMedia().catch((err) => {
  console.error("Failed to generate media:", err);
  process.exit(1);
});
