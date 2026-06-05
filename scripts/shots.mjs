import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:5173';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

async function shot(name, { full = false } = {}) {
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log('✓', name);
}

// 1) Public landing (full page)
await page.goto(BASE, { waitUntil: 'networkidle' });
await shot('home', { full: true });

// 2) Login page (social buttons)
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await shot('login');

// Log in as admin
await page.fill('input[type=email]', 'admin@pulsefit.test');
await page.fill('input[type=password]', 'Admin123!');
await page.click('button:has-text("Log in")');
await page.waitForURL('**/admin', { timeout: 15000 });

// 3) Admin dashboard
await shot('admin-dashboard');

// 4) Admin CMS (rich editor)
await page.goto(`${BASE}/admin/content`, { waitUntil: 'networkidle' });
await shot('admin-cms');

// 5) Admin settings (automation toggles)
await page.goto(`${BASE}/admin/settings`, { waitUntil: 'networkidle' });
await shot('admin-settings');

// 6) Admin classes (scheduling)
await page.goto(`${BASE}/admin/classes`, { waitUntil: 'networkidle' });
await shot('admin-classes');

// 7) Member calendar — log in as member in a fresh context
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p2 = await ctx2.newPage();
await p2.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await p2.fill('input[type=email]', 'member@pulsefit.test');
await p2.fill('input[type=password]', 'Member123!');
await p2.click('button:has-text("Log in")');
await p2.waitForURL('**/app', { timeout: 15000 });
await p2.goto(`${BASE}/app/calendar`, { waitUntil: 'networkidle' });
await p2.waitForTimeout(900);
await p2.screenshot({ path: `${OUT}/member-calendar.png` });
console.log('✓ member-calendar');

await browser.close();
console.log('done');
