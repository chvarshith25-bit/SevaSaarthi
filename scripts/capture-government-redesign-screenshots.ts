import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'docs', 'demo', 'government-redesign');

async function captureScreenshots() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('Launching Playwright browser to capture Redesigned Government Portal screens...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  // Set officer session cookie
  await context.addCookies([
    {
      name: 'FORMLY_GOV_SESSION',
      value: encodeURIComponent(JSON.stringify({
        userId: 'OFF-PAN-7042',
        email: 'sankeerthvss@gmail.com',
        role: 'OFFICER',
        name: 'Sai Sankeerth (Senior Verification Officer)',
      })),
      domain: 'localhost',
      path: '/',
    },
  ]);

  const page = await context.newPage();

  try {
    // 1. Dashboard
    console.log('Capturing Dashboard...');
    await page.goto('http://localhost:3001/government/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_government_dashboard.png'), fullPage: false });

    // 2. Applications Queue
    console.log('Capturing Applications Queue...');
    await page.goto('http://localhost:3001/government/applications', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_applications_queue.png'), fullPage: false });

    // 3. Application Workspace - Overview Tab
    console.log('Capturing Application Workspace (Overview)...');
    await page.goto('http://localhost:3001/government/applications/PAN-2026-0001', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_application_workspace_overview.png'), fullPage: false });

    // 4. Application Workspace - AI Intelligence & Model 2 Tab
    console.log('Capturing Application Workspace (AI Evidence)...');
    try {
      await page.click('button:has-text("AI Intelligence")');
      await page.waitForTimeout(600);
    } catch {
      // tab click fallback
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_application_ai_intelligence_model2.png'), fullPage: false });

    // 5. Application Workspace - Verification Checklist Tab
    console.log('Capturing Application Workspace (Verification Checklist)...');
    try {
      await page.click('button:has-text("Verification Checklist")');
      await page.waitForTimeout(600);
    } catch {
      // tab click fallback
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_application_verification_checklist.png'), fullPage: false });

    // 6. Exceptions
    console.log('Capturing Exceptions Desk...');
    await page.goto('http://localhost:3001/government/exceptions', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_exceptions_desk.png'), fullPage: false });

    // 7. Audit Log
    console.log('Capturing Audit Trail...');
    await page.goto('http://localhost:3001/government/audit', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_audit_trail.png'), fullPage: false });

    // 8. Admin Hub
    console.log('Capturing Admin Hub...');
    await page.goto('http://localhost:3001/government/admin', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_admin_hub.png'), fullPage: false });

    // 9. Mobile Responsive View
    console.log('Capturing Mobile Responsive View...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3001/government/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_mobile_dashboard.png'), fullPage: false });

    console.log('All screenshots captured successfully into docs/demo/government-redesign/');
  } catch (err: any) {
    console.error('Screenshot capture error:', err.message);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
