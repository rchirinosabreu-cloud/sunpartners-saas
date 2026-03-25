import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
        dir: 'video/',
        size: { width: 1280, height: 720 }
    }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@sunpartners.co');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:5173/cotizaciones/nueva');
  await page.waitForTimeout(2000);
  await page.click('text=02. LOGÍSTICA');
  await page.waitForTimeout(1000);

  const flatpickrIds = ['m-i', 'm-f', 'e-i', 'e-f', 'd-i', 'd-f'];
  const values = {};

  console.log('--- START ROBUST BLINDAJE TEST ---');

  for (let i = 0; i < flatpickrIds.length; i++) {
    const id = flatpickrIds[i];
    console.log(`Step ${i+1}: Interacting with #${id}...`);

    await page.click(`#${id}`);
    await page.waitForTimeout(500);

    const dayToPick = (20 + i).toString(); // Using days 20, 21, 22... to avoid 12:00 conflict
    await page.click(`.flatpickr-calendar.open .flatpickr-day:not(.flatpickr-disabled):not(.prevMonthDay):not(.nextMonthDay) >> text=${dayToPick}`);
    await page.waitForTimeout(1000);

    const newVal = await page.inputValue(`#${id}`);
    values[id] = newVal;
    console.log(`  Set #${id} to: ${newVal}`);

    // Verify ALL other fields haven't changed from their last known state
    for (const otherId of flatpickrIds) {
      const currentVal = await page.inputValue(`#${otherId}`);
      if (otherId === id) continue;

      const expectedVal = values[otherId] || '';
      if (currentVal === expectedVal) {
        console.log(`  [OK] Field #${otherId} is ${currentVal === '' ? 'empty' : 'unchanged'}`);
      } else {
        console.error(`  [FAIL] Field #${otherId} CHANGED! Expected: "${expectedVal}", Got: "${currentVal}"`);
        process.exit(1);
      }
    }
    console.log('-----------------------------');
  }

  await page.screenshot({ path: 'verification/blindaje_final_v4.png' });
  await context.close();
  await browser.close();
  console.log('--- ALL DATE FIELDS ARE INDEPENDENT (BLINDAJE CONFIRMED) ---');
})();
