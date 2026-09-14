import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const outputPath = path.resolve('artifacts/kanban-current-month.png');
const bogotaParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
}).formatToParts(new Date());
const year = bogotaParts.find(part => part.type === 'year').value;
const month = bogotaParts.find(part => part.type === 'month').value;
const expectedMonth = `${year}-${month}`;
const monthLabel = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  month: 'long',
}).format(new Date());

const users = [{
  id: 'user-1',
  nombre: 'Laura Operaciones',
  username: 'laura',
  role: 'ADMIN',
  fotoPerfilUrl: null,
}];
const clients = [{ id: 'client-1', razon_social: 'Cliente demostración' }];
const baseTask = {
  userId: 'user-1',
  collaboratorId: null,
  clientId: 'client-1',
  user: users[0],
  collaborator: null,
  client: clients[0],
  fechaLimite: new Date(Date.now() + 86400000).toISOString(),
  isPriority: false,
  isImprorrogable: false,
  comentarios: '',
  order: 0,
  updatedAt: new Date().toISOString(),
};
let tasks = [
  { ...baseTask, id: 'task-pending', titulo: 'Tarea pendiente de prueba', status: 'PENDIENTE' },
  { ...baseTask, id: 'task-progress', titulo: 'Tarea en proceso existente', status: 'EN_PROCESO' },
  { ...baseTask, id: 'task-done', titulo: 'Realizado durante el mes', status: 'REALIZADO' },
];
let requestedCompletedMonth = null;
let persistedStatus = null;

await mkdir(path.dirname(outputPath), { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.route('**/api/tasks**', async route => {
  const request = route.request();
  const url = new URL(request.url());

  if (request.method() === 'GET') {
    requestedCompletedMonth = url.searchParams.get('completedMonth');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tasks) });
    return;
  }

  if (request.method() === 'PUT') {
    const id = url.pathname.split('/').pop();
    const payload = request.postDataJSON();
    persistedStatus = payload.status;
    tasks = tasks.map(task => task.id === id ? { ...task, ...payload, updatedAt: new Date().toISOString() } : task);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tasks.find(task => task.id === id)),
    });
    return;
  }

  await route.fallback();
});
await page.route('**/api/users', route => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(users),
}));
await page.route('**/api/clients', route => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(clients),
}));
await page.route('**/api/auth/me', route => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(users[0]),
}));

await page.goto('http://127.0.0.1:4173/tasks');
await page.getByText('Tarea pendiente de prueba', { exact: true }).waitFor();

if (requestedCompletedMonth !== expectedMonth) {
  throw new Error(`Expected completedMonth=${expectedMonth}, received ${requestedCompletedMonth}`);
}

const completedHeading = page.getByRole('heading', {
  name: new RegExp(`Realizados.*${monthLabel}`, 'i'),
});
await completedHeading.waitFor();

const source = page.getByText('Tarea pendiente de prueba', { exact: true }).locator('xpath=ancestor::div[@role="button"][1]');
const target = page.locator('h3').filter({ hasText: 'En proceso' }).locator('xpath=ancestor::div[contains(@class,"flex-col")][1]');
const sourceBox = await source.boundingBox();
const targetBox = await target.boundingBox();
if (!sourceBox || !targetBox) throw new Error('Could not locate drag source or destination');

await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
await page.mouse.down();
await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 180, { steps: 16 });
await page.mouse.up();
await page.waitForFunction(() => {
  const heading = [...document.querySelectorAll('h4')]
    .find(element => element.textContent === 'Tarea pendiente de prueba');
  const card = heading?.closest('[role="button"]');
  return card && Number.parseFloat(getComputedStyle(card).opacity) === 1;
});

if (persistedStatus !== 'EN_PROCESO') {
  throw new Error(`Expected EN_PROCESO to be persisted, received ${persistedStatus}`);
}

const movedOpacity = Number.parseFloat(await source.evaluate(element => getComputedStyle(element).opacity));
const completedCard = page.getByText('Realizado durante el mes', { exact: true }).locator('xpath=ancestor::div[@role="button"][1]');
const completedOpacity = Number.parseFloat(await completedCard.evaluate(element => getComputedStyle(element).opacity));
if (movedOpacity !== 1) {
  throw new Error(`Expected the moved open task opacity to be 1, received ${movedOpacity}`);
}
if (completedOpacity !== 0.7) {
  throw new Error(`Expected the completed task opacity to remain 0.7, received ${completedOpacity}`);
}

await page.waitForTimeout(500);
const settledMovedOpacity = Number.parseFloat(await source.evaluate(element => getComputedStyle(element).opacity));
if (settledMovedOpacity !== 1) {
  throw new Error(`Expected the settled open task opacity to remain 1, received ${settledMovedOpacity}`);
}
await page.screenshot({ path: outputPath, fullPage: true });
console.log(JSON.stringify({
  outputPath,
  requestedCompletedMonth,
  persistedStatus,
  movedOpacity,
  settledMovedOpacity,
  completedOpacity,
  completedHeading: await completedHeading.textContent(),
}, null, 2));

await browser.close();
