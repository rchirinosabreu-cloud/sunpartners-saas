const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  // Create video directory if it doesn't exist
  if (!fs.existsSync('verification/video')) {
    fs.mkdirSync('verification/video', { recursive: true });
  }
  const context = await browser.newContext({
    recordVideo: {
      dir: 'verification/video/',
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // 1. Login
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@sunpartners.co');
    await page.fill('input[type="password"]', 'SunBTL2026_Premium');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('Login successful.');
    await page.waitForTimeout(1000);

    // 2. Navigate to New Quotation
    await page.goto('http://localhost:5173/cotizaciones/nueva');
    await page.waitForSelector('h2:has-text("CONSTRUCTOR DE COTIZACIONES")');
    console.log('Internal Constructor loaded.');
    await page.screenshot({ path: 'verification/internal_constructor.png' });
    await page.waitForTimeout(1000);

    // 3. Create a quick quotation to get a secure link
    await page.selectOption('select', { index: 1 }); // Select first client
    await page.fill('input[type="text"] >> nth=0', 'Evento Final de Verificación');
    await page.click('button:has-text("Siguiente Estación")');
    await page.waitForTimeout(500);

    // Station 2: Logistics (Isolated Dates)
    console.log('Station 2: Logistics');
    await page.click('button:has-text("Siguiente Estación")');
    await page.waitForTimeout(500);

    // Station 3: Inventory
    console.log('Station 3: Inventory');
    await page.click('button:has-text("+ Equipo")');
    await page.waitForTimeout(500);
    await page.selectOption('table select', { index: 1 });
    await page.click('button:has-text("Siguiente Estación")');
    await page.waitForTimeout(500);

    // Station 4: Finish
    console.log('Station 4: Finish');
    await page.click('button:has-text("Finalizar Propuesta Maestro")');
    await page.waitForURL('**/cotizaciones/*');
    console.log('Quotation created.');
    await page.waitForTimeout(1000);

    // 4. Generate and visit Secure Link
    console.log('Generating secure link...');
    await page.click('button:has-text("Enviar y Generar Link")');
    await page.waitForSelector('button:has-text("Ver Portal")');
    await page.screenshot({ path: 'verification/detail_with_link.png' });

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("Ver Portal")')
    ]);
    await newPage.waitForLoadState();
    console.log('Public Portal loaded.');
    await newPage.waitForTimeout(1000);
    await newPage.screenshot({ path: 'verification/public_portal.png', fullPage: true });

    // 5. Test Approval Flow
    await newPage.click('button:has-text("Confirmar Propuesta")');
    await newPage.waitForTimeout(500);
    await newPage.screenshot({ path: 'verification/approve_modal.png' });
    await newPage.click('button:has-text("Aceptar y Formalizar")');
    await newPage.waitForSelector('h2:has-text("Gestión Finalizada")');
    console.log('Approval successful.');
    await newPage.screenshot({ path: 'verification/approval_success.png' });
    await newPage.waitForTimeout(1000);

  } catch (err) {
    console.error('Error during verification:', err);
    await page.screenshot({ path: 'verification/error_screenshot.png' });
  } finally {
    await context.close();
    await browser.close();
  }
})();
