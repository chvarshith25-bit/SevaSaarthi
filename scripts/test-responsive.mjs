import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const viewports = [
  { name: "320x568 (iPhone SE)", width: 320, height: 568 },
  { name: "360x800 (Android Standard)", width: 360, height: 800 },
  { name: "375x812 (iPhone Mini)", width: 375, height: 812 },
  { name: "390x844 (iPhone 14)", width: 390, height: 844 },
  { name: "412x915 (Pixel 7)", width: 412, height: 915 },
  { name: "430x932 (iPhone 14 Pro Max)", width: 430, height: 932 },
  { name: "768x1024 (iPad)", width: 768, height: 1024 },
  { name: "1280x800 (Laptop)", width: 1280, height: 800 },
  { name: "1440x900 (Desktop)", width: 1440, height: 900 },
];

async function run() {
  const screenshotsDir = path.resolve("public", "screenshots-responsive");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.addCookies([{
    name: "seva_saarthi_session",
    value: "e9bbc43c261f78e8c7a080ec05b882c8e3bf394a7426bd01e24c1f4217e4420b",
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  }]);

  const page = await context.newPage();
  let allPassed = true;

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const check = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;
      const hasHorizontalScroll = scrollWidth > innerWidth;
      const hamburger = document.querySelector('button[aria-label="Open navigation menu"]');
      const isHamburgerVisible = hamburger ? window.getComputedStyle(hamburger).display !== 'none' && hamburger.offsetParent !== null : false;
      const desktopSidebar = document.querySelector('aside.hidden.md\\:flex');
      const isDesktopSidebarVisible = desktopSidebar ? window.getComputedStyle(desktopSidebar).display !== 'none' && desktopSidebar.offsetParent !== null : false;

      return {
        scrollWidth,
        innerWidth,
        hasHorizontalScroll,
        isHamburgerVisible,
        isDesktopSidebarVisible,
      };
    });

    const passed = !check.hasHorizontalScroll;
    if (!passed) allPassed = false;

    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${vp.name}: scrollWidth=${check.scrollWidth}, innerWidth=${check.innerWidth}, horizontalScroll=${check.hasHorizontalScroll}, hamburger=${check.isHamburgerVisible}, desktopSidebar=${check.isDesktopSidebarVisible}`);

    if ([320, 375, 430, 768, 1280, 1440].includes(vp.width)) {
      const ssPath = path.join(screenshotsDir, `viewport-${vp.width}x${vp.height}.png`);
      await page.screenshot({ path: ssPath, fullPage: false });
    }
  }

  console.log("\n--- Testing Mobile Drawer Interaction on 375x812 ---");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const hamburgerBtn = page.locator('button[aria-label="Open navigation menu"]');
  await hamburgerBtn.click();
  await page.waitForTimeout(500);

  const drawerVisible = await page.evaluate(() => {
    const drawer = document.querySelector('aside[aria-label="Navigation drawer"]');
    if (!drawer) return false;
    const rect = drawer.getBoundingClientRect();
    return rect.left >= 0 && rect.width > 0;
  });

  console.log(`Drawer opened: ${drawerVisible ? 'PASS' : 'FAIL'}`);
  const drawerSSPath = path.join(screenshotsDir, "mobile-drawer-open.png");
  await page.screenshot({ path: drawerSSPath });

  const closeBtn = page.locator('button[aria-label="Close navigation"]');
  await closeBtn.click();
  await page.waitForTimeout(500);

  const drawerClosed = await page.evaluate(() => {
    const drawer = document.querySelector('aside[aria-label="Navigation drawer"]');
    if (!drawer) return true;
    const rect = drawer.getBoundingClientRect();
    return rect.right <= 0;
  });

  console.log(`Drawer closed: ${drawerClosed ? 'PASS' : 'FAIL'}`);

  await browser.close();
  console.log("\nAll tests completed. Result:", allPassed && drawerVisible && drawerClosed ? "ALL PASSED!" : "SOME FAILED");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
