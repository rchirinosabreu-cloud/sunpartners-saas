import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: 'video/' }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@sunpartners.co');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/cotizaciones/nueva');
  await page.waitForTimeout(2000);

  await page.click('text=02. LOGÍSTICA');
  await page.waitForTimeout(1000);

  // Target inputs
  const inputs = await page.locator('.flatpickr-input');
  const count = await inputs.count();
  console.log(`Found ${count} date inputs`);

  // Interaction: Change each one and check others
  for (let i = 0; i < count; i++) {
    const selector = `.flatpickr-input >> nth=${i}`;
    await page.click(selector);
    // Click a specific day in the calendar (e.g., day 15)
    await page.click('.flatpickr-calendar.open .flatpickr-day:not(.flatpickr-disabled):not(.prevMonthDay):not(.nextMonthDay) >> text=15');
    await page.waitForTimeout(500);
    console.log(`Interacted with input ${i}`);
  }

  await page.screenshot({ path: 'verification/blindaje_final_proof.png' });
  await context.close();
  await browser.close();
})();
