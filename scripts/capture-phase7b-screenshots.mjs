import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
  const screenshotDir = path.resolve('docs/phase7b_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  console.log('1. Capturing Services Quick Filters (1440px)...');
  await page.goto('http://127.0.0.1:3000/services', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '01_quick_filters.png'), fullPage: false });

  console.log('2. Capturing Mobile Quick Filters Layout (375px)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://127.0.0.1:3000/services', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '04_mobile_layout.png'), fullPage: false });

  console.log('3. Capturing Document Vault Guidance...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:3000/documents', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '03_document_guidance.png'), fullPage: false });

  console.log('4. Capturing Gov Workspace Side-by-Side Candidate Comparison...');
  await page.goto('http://127.0.0.1:3001/gov/workspace/PAN-2026-0001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotDir, '02_candidate_comparison.png'), fullPage: false });

  await browser.close();
  console.log('All Phase 7B screenshots captured successfully in docs/phase7b_screenshots/');
}

main().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
