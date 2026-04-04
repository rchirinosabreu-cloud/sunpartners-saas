import { test, expect } from '@playwright/test';

test('verify client deletion and new quotation features', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login');
  await page.getByLabel('Correo Electrónico').fill('admin@sunpartners.co');
  await page.getByLabel('Contraseña').fill('SunBTL2026_Premium');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // Wait for dashboard
  await page.waitForURL('**/dashboard');

  // 1. Verify Client Delete Button in Directory
  await page.goto('http://localhost:5173/clientes');
  await page.waitForSelector('table');

  // Look for the delete icon (trash)
  const trashIcon = page.locator('span.material-symbols-outlined:has-text("delete")').first();
  await expect(trashIcon).toBeVisible();

  // Click trash icon to see modal
  await trashIcon.click();
  await expect(page.getByText('¿Estás seguro de eliminar a')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();

  // 2. Verify New Quotation - Searchable Select and Stock Warning
  await page.goto('http://localhost:5173/cotizaciones/nueva');

  // Station 1: Select Client (just pick the first one)
  await page.waitForSelector('select');
  const clientSelect = page.locator('select').first();
  const options = await clientSelect.locator('option').all();
  if (options.length > 1) {
      await clientSelect.selectOption({ index: 1 });
  }
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Station 2: Dates (skip/continue if pre-filled or fill basic)
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Station 3: Calculator
  // Verify SearchableSelect is present
  const searchableInput = page.getByPlaceholder('Buscar equipo...');
  await expect(searchableInput).toBeVisible();

  // Search for something
  await searchableInput.fill('Silla');
  await page.waitForTimeout(500); // Wait for filter

  // Select an item from the dropdown
  await page.locator('div.cursor-pointer:has-text("Silla")').first().click();

  // Trigger stock warning (if we know an item with low stock)
  // According to the video, Sillas Tiffany has 5 stock.
  const qtyInput = page.locator('input[type="number"]').first();
  await qtyInput.fill('10');

  // Wait for warning icon
  const warningIcon = page.locator('span.material-symbols-outlined:has-text("warning")');
  await expect(warningIcon).toBeVisible();

  // Hover to see tooltip
  await warningIcon.hover();
  await expect(page.getByText('Stock insuficiente')).toBeVisible();

  // 3. Verify Edit button in Quotation Detail
  // We need an existing draft. For now, let's just check the UI elements exist.

  await page.screenshot({ path: 'frontend-verification.png', fullPage: true });
});
