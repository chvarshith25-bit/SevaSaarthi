import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { getAuthoritativeDb, pgQuery, closeAuthoritativeDb } from '../src/lib/server/pg-db';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs', 'phase7a_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runPhase7aAudit() {
  console.log('========================================================');
  console.log('   SEVA SAARTHI PHASE 7A: UI/UX & HARDENING AUDIT       ');
  console.log('========================================================\n');

  const auditData = {
    timestamp: new Date().toISOString(),
    metrics: {},
    evaluations: {},
    screenshots: [],
    findings: [],
  };

  await getAuthoritativeDb();

  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------
  // 1. DESKTOP VIEWPORT AUDIT (1440 x 900)
  // -------------------------------------------------------------
  console.log('--- 1. Initializing Desktop Browser Context (1440x900) ---');
  const desktopCitizenContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const citizenPage = await desktopCitizenContext.newPage();

  // Citizen Login
  console.log('Auditing Citizen Login (/login)...');
  const t0_login = Date.now();
  await citizenPage.goto('http://127.0.0.1:3000/login', { waitUntil: 'domcontentloaded' });
  const loginLoadTime = Date.now() - t0_login;
  auditData.metrics['citizen_login_load_ms'] = loginLoadTime;
  await citizenPage.waitForTimeout(1000);
  await citizenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '01_citizen_login.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/01_citizen_login.png');

  // Authenticate Citizen
  const cLoginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sankeerths615@gmail.com', password: '1234567890' })
  });
  const cData = await cLoginRes.json();

  await desktopCitizenContext.addCookies([
    { name: 'FORMLY_CITIZEN_SESSION', value: cData.token, url: 'http://127.0.0.1:3000' },
    { name: 'formly_citizen_session', value: cData.token, url: 'http://127.0.0.1:3000' },
    { name: 'seva_saarthi_session', value: cData.token, url: 'http://127.0.0.1:3000' },
  ]);
  await citizenPage.addInitScript((user) => {
    localStorage.setItem('formly_app_session_user', JSON.stringify(user));
  }, cData.user);

  // Citizen Dashboard
  console.log('Auditing Citizen Dashboard (/dashboard)...');
  const t0_dash = Date.now();
  await citizenPage.goto('http://127.0.0.1:3000/dashboard', { waitUntil: 'domcontentloaded' });
  const dashLoadTime = Date.now() - t0_dash;
  auditData.metrics['citizen_dashboard_load_ms'] = dashLoadTime;
  await citizenPage.waitForTimeout(1500);
  await citizenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '01_citizen_landing_dashboard.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/01_citizen_landing_dashboard.png');

  // Scholarship & Service Discovery
  console.log('Auditing Scholarship Discovery (/services)...');
  await citizenPage.goto('http://127.0.0.1:3000/services', { waitUntil: 'domcontentloaded' });
  await citizenPage.waitForTimeout(1500);
  await citizenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '02_scholarship_discovery.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/02_scholarship_discovery.png');

  // Document Vault
  console.log('Auditing Citizen Document Vault (/documents)...');
  await citizenPage.goto('http://127.0.0.1:3000/documents', { waitUntil: 'domcontentloaded' });
  await citizenPage.waitForTimeout(1500);
  await citizenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '06_citizen_documents.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/06_citizen_documents.png');

  // Citizen Profile
  console.log('Auditing Citizen Profile (/profile)...');
  await citizenPage.goto('http://127.0.0.1:3000/profile', { waitUntil: 'domcontentloaded' });
  await citizenPage.waitForTimeout(1500);
  await citizenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '07_citizen_profile.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/07_citizen_profile.png');

  // Notifications
  console.log('Auditing Notifications (/notifications)...');
  await citizenPage.goto('http://127.0.0.1:3000/notifications', { waitUntil: 'domcontentloaded' });
  await citizenPage.waitForTimeout(1500);
  await citizenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '08_citizen_notifications.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/08_citizen_notifications.png');

  // Help & Support
  console.log('Auditing Help & Support (/help)...');
  await citizenPage.goto('http://127.0.0.1:3000/help', { waitUntil: 'domcontentloaded' });
  await citizenPage.waitForTimeout(1500);
  await citizenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '09_citizen_help.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/09_citizen_help.png');

  // Live Application Tracker
  console.log('Auditing Application Live Tracker (/track/PAN-2026-0001)...');
  await citizenPage.goto('http://127.0.0.1:3000/track/PAN-2026-0001', { waitUntil: 'domcontentloaded' });
  await citizenPage.waitForTimeout(2000);
  await citizenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '05_application_tracking.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/05_application_tracking.png');

  // -------------------------------------------------------------
  // 2. GOVERNMENT OPERATIONS PLATFORM AUDIT (:3001)
  // -------------------------------------------------------------
  console.log('--- 2. Initializing Government Browser Context (:3001) ---');
  const govContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const govPage = await govContext.newPage();

  // Government Login
  console.log('Auditing Government Login (:3001/login)...');
  await govPage.goto('http://127.0.0.1:3001/login', { waitUntil: 'domcontentloaded' });
  await govPage.waitForTimeout(1000);
  await govPage.screenshot({ path: path.join(SCREENSHOT_DIR, '10_government_login.png') });

  // Authenticate Government Officer
  const gLoginRes = await fetch('http://127.0.0.1:3001/api/gov/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sankeerthvss@gmail.com', password: '1234567890' })
  });
  const gData = await gLoginRes.json();

  await govContext.addCookies([
    { name: 'FORMLY_GOV_SESSION', value: gData.token, url: 'http://127.0.0.1:3001' },
    { name: 'formly_gov_session', value: gData.token, url: 'http://127.0.0.1:3001' },
  ]);
  await govPage.addInitScript((user) => {
    localStorage.setItem('formly_gov_session_v1', JSON.stringify(user));
  }, gData.user);

  // Operations Dashboard
  console.log('Auditing Government Dashboard (:3001/dashboard)...');
  await govPage.goto('http://127.0.0.1:3001/dashboard', { waitUntil: 'domcontentloaded' });
  await govPage.waitForTimeout(1500);
  await govPage.screenshot({ path: path.join(SCREENSHOT_DIR, '10_government_dashboard.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/10_government_dashboard.png');

  // Applications Queue
  console.log('Auditing Government Application Queue (:3001/applications)...');
  await govPage.goto('http://127.0.0.1:3001/applications', { waitUntil: 'domcontentloaded' });
  await govPage.waitForTimeout(1500);
  await govPage.screenshot({ path: path.join(SCREENSHOT_DIR, '11_government_queue.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/11_government_queue.png');

  // Officer Case Workspace (AI Model 1 & Model 2 UI)
  console.log('Auditing Officer Case Workspace (:3001/applications/PAN-2026-0001)...');
  await govPage.goto('http://127.0.0.1:3001/applications/PAN-2026-0001', { waitUntil: 'domcontentloaded' });
  await govPage.waitForTimeout(2000);
  await govPage.screenshot({ path: path.join(SCREENSHOT_DIR, '12_officer_workspace.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/12_officer_workspace.png');

  // Cryptographic Audit Center
  console.log('Auditing Audit Center (:3001/audit)...');
  await govPage.goto('http://127.0.0.1:3001/audit', { waitUntil: 'domcontentloaded' });
  await govPage.waitForTimeout(1500);
  await govPage.screenshot({ path: path.join(SCREENSHOT_DIR, '16_audit_trail_ui.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/16_audit_trail_ui.png');

  // -------------------------------------------------------------
  // 3. MOBILE RESPONSIVENESS AUDIT (375 x 812)
  // -------------------------------------------------------------
  console.log('--- 3. Initializing Mobile Browser Context (375x812) ---');
  const mobileCitizenContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mobileCitizenPage = await mobileCitizenContext.newPage();

  await mobileCitizenContext.addCookies([
    { name: 'FORMLY_CITIZEN_SESSION', value: cData.token, url: 'http://127.0.0.1:3000' },
    { name: 'formly_citizen_session', value: cData.token, url: 'http://127.0.0.1:3000' },
    { name: 'seva_saarthi_session', value: cData.token, url: 'http://127.0.0.1:3000' },
  ]);
  await mobileCitizenPage.addInitScript((user) => {
    localStorage.setItem('formly_app_session_user', JSON.stringify(user));
  }, cData.user);

  console.log('Capturing Mobile Citizen Dashboard...');
  await mobileCitizenPage.goto('http://127.0.0.1:3000/dashboard', { waitUntil: 'domcontentloaded' });
  await mobileCitizenPage.waitForTimeout(1500);
  await mobileCitizenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '17_mobile_citizen_view.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/17_mobile_citizen_view.png');

  const mobileGovContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mobileGovPage = await mobileGovContext.newPage();

  await mobileGovContext.addCookies([
    { name: 'FORMLY_GOV_SESSION', value: gData.token, url: 'http://127.0.0.1:3001' },
    { name: 'formly_gov_session', value: gData.token, url: 'http://127.0.0.1:3001' },
  ]);
  await mobileGovPage.addInitScript((user) => {
    localStorage.setItem('formly_gov_session_v1', JSON.stringify(user));
  }, gData.user);

  console.log('Capturing Mobile Government Dashboard...');
  await mobileGovPage.goto('http://127.0.0.1:3001/dashboard', { waitUntil: 'domcontentloaded' });
  await mobileGovPage.waitForTimeout(1500);
  await mobileGovPage.screenshot({ path: path.join(SCREENSHOT_DIR, '18_mobile_government_view.png') });
  auditData.screenshots.push('docs/phase7a_screenshots/18_mobile_government_view.png');

  await browser.close();
  await closeAuthoritativeDb();

  console.log('\n========================================================');
  console.log('   PHASE 7A AUDIT WALKTHROUGH COMPLETED SUCCESSFULLY!  ');
  console.log('========================================================\n');
}

runPhase7aAudit().catch(err => {
  console.error('[FATAL PHASE 7A ERROR]:', err);
  process.exit(1);
});

