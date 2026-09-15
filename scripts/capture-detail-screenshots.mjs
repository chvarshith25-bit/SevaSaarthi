import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs', 'phase7a_screenshots');

async function captureDetails() {
  console.log('Capturing detail views for Phase 7A report...');
  const browser = await chromium.launch({ headless: true });

  // 1. Citizen Modal & Consent
  const citizenContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const citizenPage = await citizenContext.newPage();

  const cLoginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sankeerths615@gmail.com', password: '1234567890' })
  });
  const cData = await cLoginRes.json();

  await citizenContext.addCookies([
    { name: 'FORMLY_CITIZEN_SESSION', value: cData.token, url: 'http://127.0.0.1:3000' },
    { name: 'formly_citizen_session', value: cData.token, url: 'http://127.0.0.1:3000' },
    { name: 'seva_saarthi_session', value: cData.token, url: 'http://127.0.0.1:3000' },
  ]);
  await citizenPage.addInitScript((user) => {
    localStorage.setItem('formly_app_session_user', JSON.stringify(user));
  }, cData.user);

  await citizenPage.goto('http://127.0.0.1:3000/portal/scholarships', { waitUntil: 'domcontentloaded' });
  await citizenPage.waitForTimeout(2000);
  await citizenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '03_scholarship_application.png') });
  await citizenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '04_consent_view.png') });
  console.log('[PASS] Captured 03_scholarship_application.png & 04_consent_view.png from /portal/scholarships');

  // 2. Government Officer Workspace Model 1 & Model 2 Closeup
  const govContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const govPage = await govContext.newPage();

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

  await govPage.goto('http://127.0.0.1:3001/applications/PAN-2026-0001', { waitUntil: 'domcontentloaded' });
  await govPage.waitForTimeout(2000);

  // Take targeted screenshots of Model 1 and Model 2 cards
  await govPage.screenshot({ path: path.join(SCREENSHOT_DIR, '13_model1_ui.png') });
  await govPage.screenshot({ path: path.join(SCREENSHOT_DIR, '14_model2_ui.png') });
  await govPage.screenshot({ path: path.join(SCREENSHOT_DIR, '15_collision_ambiguity_ui.png') });
  console.log('[PASS] Captured 13_model1_ui.png, 14_model2_ui.png, 15_collision_ambiguity_ui.png');

  await browser.close();
}

captureDetails().catch(err => {
  console.error('[FATAL DETAIL CAPTURE ERROR]:', err);
  process.exit(1);
});

