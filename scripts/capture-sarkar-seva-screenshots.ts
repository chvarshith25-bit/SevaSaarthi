import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'docs', 'demo', 'sarkar-seva');

async function captureScreenshots() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('Launching Playwright browser for SARKAR SEVA screens...');
  const browser = await chromium.launch({ headless: true });
  
  // 1. Officer Context
  const officerContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  await officerContext.addCookies([
    {
      name: 'FORMLY_GOV_SESSION',
      value: encodeURIComponent(JSON.stringify({
        userId: 'OFF-PAN-7042',
        email: 'sankeerthvss@gmail.com',
        role: 'OFFICER',
        name: 'Sai Sankeerth',
        department: 'Income Tax Department – PAN Division',
      })),
      domain: 'localhost',
      path: '/',
    },
  ]);

  const page = await officerContext.newPage();

  try {
    // 1. Dashboard
    console.log('Capturing Dashboard...');
    await page.goto('http://localhost:3001/government/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dashboard.png'), fullPage: false });

    // 2. Applications Queue
    console.log('Capturing Applications...');
    await page.goto('http://localhost:3001/government/applications', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_applications.png'), fullPage: false });

    // 3. Application Review (Overview & Top)
    console.log('Capturing Application Review Overview...');
    await page.goto('http://localhost:3001/government/applications/PAN-2026-0001/review', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_application_review_overview.png'), fullPage: false });

    // 4. AI Assistance
    console.log('Capturing AI Assistance...');
    const aiSection = await page.$('text=2. AI Assistance & Decision Support');
    if (aiSection) {
      await aiSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_ai_assistance.png'), fullPage: false });

    // 5. Documents
    console.log('Capturing Documents & Evidence...');
    const docSection = await page.$('text=3. Documents & Evidence');
    if (docSection) {
      await docSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_documents.png'), fullPage: false });

    // 6. Consent & Evidence
    console.log('Capturing Consent & Government Records...');
    const consentSection = await page.$('text=4. Consent & Government Records');
    if (consentSection) {
      await consentSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_consent_and_evidence.png'), fullPage: false });

    // 7. Verification Checklist
    console.log('Capturing Verification Checklist...');
    const verifySection = await page.$('text=5. Verification Checklist');
    if (verifySection) {
      await verifySection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_verification_checklist.png'), fullPage: false });

    // 8. Decision Panel
    console.log('Capturing Decision Panel...');
    const decisionSection = await page.$('text=OFFICER DECISION');
    if (decisionSection) {
      await decisionSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_decision_panel.png'), fullPage: false });

    // 9. Exceptions
    console.log('Capturing Exceptions...');
    await page.goto('http://localhost:3001/government/exceptions', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_exceptions.png'), fullPage: false });

    // 10. Audit
    console.log('Capturing Audit...');
    await page.goto('http://localhost:3001/government/audit', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_audit.png'), fullPage: false });

    // 11. Administration (as Admin user)
    console.log('Capturing Administration Hub...');
    const adminContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    await adminContext.addCookies([
      {
        name: 'FORMLY_GOV_SESSION',
        value: encodeURIComponent(JSON.stringify({
          userId: 'ADMIN-SYS-001',
          email: 'admin@nic.in',
          role: 'SYS_ADMIN',
          name: 'Chief Systems Administrator',
          department: 'National Informatics Centre',
        })),
        domain: 'localhost',
        path: '/',
      },
    ]);
    const adminPage = await adminContext.newPage();
    await adminPage.goto('http://localhost:3001/government/admin', { waitUntil: 'networkidle', timeout: 15000 });
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '11_administration.png'), fullPage: false });
    await adminContext.close();

    // 12. Mobile Review View
    console.log('Capturing Mobile Review View...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3001/government/applications/PAN-2026-0001/review', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_mobile_review.png'), fullPage: false });

    console.log('All 12 screenshots captured successfully into docs/demo/sarkar-seva/!');
  } catch (err: any) {
    console.error('Screenshot capture error:', err.message);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
