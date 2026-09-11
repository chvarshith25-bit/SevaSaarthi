const { chromium } = require("playwright");
const path = require("path");

const DOCS_IMAGES_DIR = path.resolve(process.cwd(), "docs", "images");

async function fixCitizenScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Login via API to get real session cookie
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sankeerths615@gmail.com", password: "1234567890" })
  });
  const data = await loginRes.json();
  const setCookie = loginRes.headers.get("set-cookie");
  const token = data.token;
  console.log("Logged in citizen, token:", token);

  await context.addCookies([
    { name: "FORMLY_CITIZEN_SESSION", value: token, url: "http://localhost:3000" },
    { name: "formly_citizen_session", value: token, url: "http://localhost:3000" },
    { name: "seva_saarthi_session", value: token, url: "http://localhost:3000" },
  ]);

  const page = await context.newPage();
  await page.addInitScript((user) => {
    localStorage.setItem("formly_app_session_user", JSON.stringify(user));
  }, data.user);

  console.log("Capturing 02-citizen-dashboard.png...");
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(DOCS_IMAGES_DIR, "02-citizen-dashboard.png") });

  console.log("Capturing 03-citizen-document-vault.png...");
  await page.goto("http://localhost:3000/documents", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(DOCS_IMAGES_DIR, "03-citizen-document-vault.png") });

  console.log("Capturing 04-citizen-live-tracker.png...");
  await page.goto("http://localhost:3000/track/PAN-2026-0001", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(DOCS_IMAGES_DIR, "04-citizen-live-tracker.png") });

  await browser.close();
  console.log("Citizen screenshots captured!");
}

fixCitizenScreenshots().catch(console.error);
