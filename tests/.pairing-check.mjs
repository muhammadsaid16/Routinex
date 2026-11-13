/**
 * Manual end to end check of the device pairing.
 *
 * Two separate browser instances pair through the local broker. The script
 * prints what each side shows and takes a screenshot of both.
 *
 * Run with: node tests/.pairing-check.mjs
 */
import { chromium } from '/home/zer0/.local/lib/node_modules/@playwright/mcp/node_modules/playwright/index.mjs';

const APP = process.env.APP_URL || 'http://localhost:5173';
const OUT = process.env.OUT_DIR || '.verify';

const results = [];
function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}${detail ? ` (${detail})` : ''}`);
}

async function openApp(browser, label) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      console.log(`  [${label} ${message.type()}] ${message.text()}`);
    }
  });
  page.on('pageerror', (err) => console.log(`  [${label} pageerror] ${err.message}`));
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  return { context, page };
}

async function openSyncPanel(page) {
  const settingsButton = page.locator('button:has(svg.lucide-settings)').first();
  await settingsButton.click();
  await page.getByText('Device Sync & Link').first().waitFor({ timeout: 10000 });
}

async function waitForLabel(page, label, timeout = 45000) {
  await page.getByText(label, { exact: true }).first().waitFor({ timeout });
}

async function openHabits(page) {
  await page.locator('aside nav button:has-text("Habits")').first().click();
  await page.getByText('Habit Management').first().waitFor({ timeout: 10000 });
}

const browserHost = await chromium.launch({ args: ['--no-sandbox'] });
const browserGuest = await chromium.launch({ args: ['--no-sandbox'] });

try {
  const host = await openApp(browserHost, 'host');
  const guest = await openApp(browserGuest, 'guest');

  await openSyncPanel(host.page);
  await openSyncPanel(guest.page);

  // 1. The host waits and shows a code.
  await host.page.getByText('This device hosts').click();
  const codeNode = host.page.locator('span.font-mono.text-lg').first();
  await codeNode.waitFor({ timeout: 20000 });
  const code = (await codeNode.innerText()).trim();
  console.log('  pairing code:', code);

  // 2. The guest joins with that code.
  const input = guest.page.getByPlaceholder('RXT-XXXX-XXXX-XXXX');
  await input.fill(code.replace(/[^0-9A-Z]/gi, ''));
  await guest.page.getByRole('button', { name: 'Link', exact: true }).click();

  await waitForLabel(host.page, 'Linked');
  await waitForLabel(guest.page, 'Linked');
  check('the two devices link through the broker', true, code);

  await host.page.screenshot({ path: `${OUT}/host-linked.png` });
  await guest.page.screenshot({ path: `${OUT}/guest-linked.png` });

  // 3. A record made on the host shows up on the guest.
  await openHabits(host.page);
  await host.page.getByRole('button', { name: 'New Habit' }).click();
  await host.page.getByPlaceholder('e.g. Read non-fiction').fill('Pairing proof habit');
  await host.page.getByRole('button', { name: 'Save Habit' }).click();
  await host.page.getByText('Pairing proof habit').first().waitFor({ timeout: 10000 });

  await openHabits(guest.page);
  const arrived = await guest.page
    .getByText('Pairing proof habit')
    .first()
    .waitFor({ timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  check('a new habit travels to the other device', arrived);

  // 4. The waiting device is reloaded. It takes its id back and the link
  //    comes back by itself.
  await openSyncPanel(host.page);
  await host.page.reload({ waitUntil: 'domcontentloaded' });
  await host.page.waitForTimeout(1500);
  await openSyncPanel(host.page);

  const back = await waitForLabel(host.page, 'Linked', 45000)
    .then(() => true)
    .catch(() => false);
  check('the link comes back after a reload of the waiting device', back);
  await host.page.screenshot({ path: `${OUT}/host-after-reload.png` });

  // 5. The panel shows how to use a private broker.
  const brokerButton = host.page.getByText(/Signalling server:/).first();
  await brokerButton.click();
  const guidance = await host.page
    .getByText('npm run signal')
    .first()
    .waitFor({ timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  check('the panel explains the private broker', guidance);
  await host.page.screenshot({ path: `${OUT}/host-broker-panel.png` });
} finally {
  await browserHost.close();
  await browserGuest.close();
}

// 6. A broker that does not answer. The app must show the real reason and
//    not hide it behind a generic message.
const browserPublic = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const context = await browserPublic.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem(
      'routinix_sync_broker',
      JSON.stringify({ host: '127.0.0.1', port: 9, path: '/', secure: false })
    );
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await openSyncPanel(page);
  await page.getByText('This device hosts').click();

  const message = page.locator('text=/signalling server (did not answer|did not make)/');
  let text = '';
  for (let i = 0; i < 20 && !text; i += 1) {
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText();
    const line = body
      .split('\n')
      .find((row) => /signalling server (did not answer|did not make)/i.test(row));
    text = line || '';
  }
  console.log('  message from a broker that does not answer:', text);
  if (!text) {
    const body = await page.locator('body').innerText();
    const idx = body.indexOf('Device Sync');
    console.log('  panel state:', idx >= 0 ? body.slice(idx, idx + 600) : body.slice(0, 400));
  }
  check(
    'a broker that does not answer shows the real reason',
    /did not answer|did not make the device ready/i.test(text) &&
      !/dropped the link/i.test(text),
    text.slice(0, 80)
  );
  await page.screenshot({ path: `${OUT}/broker-no-answer.png` });
} finally {
  await browserPublic.close();
}

const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exitCode = 1;
