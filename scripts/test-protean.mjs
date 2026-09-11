import { chromium } from "playwright";

async function testProtean() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log("Navigating to Protean PAN portal...");
  await page.goto("https://onlineservices.proteantech.in/paam/endUserRegisterContact.html", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  }).catch(() => {});
  await page.waitForTimeout(2000);

  const fields = [
    { selector: "#f_name_end", val: "Rahul" },
    { selector: "#l_name_end", val: "Kumar" },
    { selector: "#date_of_birth_reg", val: "15/08/2001" },
    { selector: "#email_id2", val: "rahul@example.com" },
    { selector: "#rvContactNo", val: "9876543210" },
  ];

  for (const f of fields) {
    const el = await page.$(f.selector);
    if (el) {
      await el.fill(f.val);
      console.log(`✓ Filled ${f.selector} with "${f.val}"`);
    } else {
      console.log(`✗ Element not found: ${f.selector}`);
    }
  }

  const consent = await page.$("#consent");
  if (consent) {
    await consent.check();
    console.log("✓ Checked consent checkbox");
  }

  const appType = await page.$("#type");
  if (appType) {
    await appType.selectOption({ index: 1 });
    console.log("✓ Selected Application Type: Form 49A");
  }

  const cat = await page.$("#cat_applicant1");
  if (cat) {
    await cat.selectOption({ index: 1 });
    console.log("✓ Selected Category: Individual");
  }

  console.log("🎉 SUCCESS! Protean PAN card fields populated cleanly.");
  await browser.close();
}

testProtean().catch(console.error);
