const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const DOCS_IMAGES_DIR = path.resolve(process.cwd(), "docs", "images");
const DOCS_DEMO_DIR = path.resolve(process.cwd(), "docs", "demo");

if (!fs.existsSync(DOCS_IMAGES_DIR)) fs.mkdirSync(DOCS_IMAGES_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DEMO_DIR)) fs.mkdirSync(DOCS_DEMO_DIR, { recursive: true });

async function main() {
  console.log("Starting Playwright for high-fidelity media capture...");
  const browser = await chromium.launch({ headless: true });

  // -----------------------------------------------------------------
  // 1. CITIZEN PLATFORM CAPTURE (PORT 3000)
  // -----------------------------------------------------------------
  console.log("Initializing Citizen Context (Port 3000)...");
  const citizenContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: DOCS_DEMO_DIR, size: { width: 1280, height: 720 } }
  });
  const citizenPage = await citizenContext.newPage();

  // 1. Citizen Login
  console.log("Capturing 01-citizen-login.png...");
  await citizenPage.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await citizenPage.waitForTimeout(1000);
  await citizenPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "01-citizen-login.png") });

  // Authenticate Citizen via API
  const cLoginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sankeerths615@gmail.com", password: "1234567890" })
  });
  const cData = await cLoginRes.json();
  console.log("Citizen token:", cData.token);

  await citizenContext.addCookies([
    { name: "FORMLY_CITIZEN_SESSION", value: cData.token, url: "http://localhost:3000" },
    { name: "formly_citizen_session", value: cData.token, url: "http://localhost:3000" },
    { name: "seva_saarthi_session", value: cData.token, url: "http://localhost:3000" },
  ]);
  await citizenPage.addInitScript((user) => {
    localStorage.setItem("formly_app_session_user", JSON.stringify(user));
  }, cData.user);

  // 2. Citizen Dashboard
  console.log("Capturing 02-citizen-dashboard.png...");
  await citizenPage.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });
  await citizenPage.waitForTimeout(2000);
  await citizenPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "02-citizen-dashboard.png") });

  // 3. Citizen Document Vault
  console.log("Capturing 03-citizen-document-vault.png...");
  await citizenPage.goto("http://localhost:3000/documents", { waitUntil: "domcontentloaded" });
  await citizenPage.waitForTimeout(2000);
  await citizenPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "03-citizen-document-vault.png") });

  // 4. Citizen Application Live Tracker
  console.log("Capturing 04-citizen-live-tracker.png...");
  await citizenPage.goto("http://localhost:3000/track/PAN-2026-0001", { waitUntil: "domcontentloaded" });
  await citizenPage.waitForTimeout(2000);
  await citizenPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "04-citizen-live-tracker.png") });

  await citizenPage.close();
  await citizenContext.close();

  // -----------------------------------------------------------------
  // 2. GOVERNMENT PLATFORM CAPTURE (PORT 3001)
  // -----------------------------------------------------------------
  console.log("Initializing Government Context (Port 3001)...");
  const govContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: DOCS_DEMO_DIR, size: { width: 1280, height: 720 } }
  });
  const govPage = await govContext.newPage();

  // 5. Government Login
  console.log("Capturing 05-government-login.png...");
  await govPage.goto("http://localhost:3001/login", { waitUntil: "domcontentloaded" });
  await govPage.waitForTimeout(1000);
  await govPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "05-government-login.png") });

  // Authenticate Government Officer via API
  const gLoginRes = await fetch("http://localhost:3001/api/gov/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sankeerthvss@gmail.com", password: "1234567890" })
  });
  const gData = await gLoginRes.json();
  console.log("Government token:", gData.token);

  await govContext.addCookies([
    { name: "FORMLY_GOV_SESSION", value: gData.token, url: "http://localhost:3001" },
    { name: "formly_gov_session", value: gData.token, url: "http://localhost:3001" },
  ]);
  await govPage.addInitScript((user) => {
    localStorage.setItem("formly_gov_session_v1", JSON.stringify(user));
  }, gData.user);

  // 6. Government Operations Dashboard
  console.log("Capturing 06-government-dashboard.png...");
  await govPage.goto("http://localhost:3001/dashboard", { waitUntil: "domcontentloaded" });
  await govPage.waitForTimeout(2000);
  await govPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "06-government-dashboard.png") });

  // 7. Government Application Queue
  console.log("Capturing 07-government-queue.png...");
  await govPage.goto("http://localhost:3001/applications", { waitUntil: "domcontentloaded" });
  await govPage.waitForTimeout(2000);
  await govPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "07-government-queue.png") });

  // 8. Officer Case Workspace
  console.log("Capturing 08-government-workspace.png...");
  await govPage.goto("http://localhost:3001/applications/PAN-2026-0001", { waitUntil: "domcontentloaded" });
  await govPage.waitForTimeout(2000);
  await govPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "08-government-workspace.png") });

  // 9. Interoperability & Data Mapper
  console.log("Capturing 09-interoperability-hub.png...");
  await govPage.goto("http://localhost:3001/data-mapper", { waitUntil: "domcontentloaded" });
  await govPage.waitForTimeout(2000);
  await govPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "09-interoperability-hub.png") });

  // 10. Audit Center
  console.log("Capturing 10-audit-trail.png...");
  await govPage.goto("http://localhost:3001/audit", { waitUntil: "domcontentloaded" });
  await govPage.waitForTimeout(2000);
  await govPage.screenshot({ path: path.join(DOCS_IMAGES_DIR, "10-audit-trail.png") });

  await govPage.close();
  await govContext.close();

  // Select video
  const files = fs.readdirSync(DOCS_DEMO_DIR);
  const webms = files.filter(f => f.endsWith(".webm") && f !== "formly-prototype-walkthrough.webm");
  if (webms.length > 0) {
    webms.sort((a, b) => {
      const sA = fs.statSync(path.join(DOCS_DEMO_DIR, a)).size;
      const sB = fs.statSync(path.join(DOCS_DEMO_DIR, b)).size;
      return sB - sA;
    });
    const bestVideo = webms[0];
    const targetPath = path.join(DOCS_DEMO_DIR, "formly-prototype-walkthrough.webm");
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    fs.renameSync(path.join(DOCS_DEMO_DIR, bestVideo), targetPath);
    console.log("Best video saved to:", targetPath);
  }

  await browser.close();
  console.log("All media generated successfully!");
}

main().catch((err) => {
  console.error("Error generating media:", err);
  process.exit(1);
});
