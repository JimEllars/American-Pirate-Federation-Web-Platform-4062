import { test, expect } from '@playwright/test';

/**
 * Playwright smoke suite (SOP §5 Gateway 3).
 *
 * Scope note: `vite preview` serves the static build only — Pages Functions are not
 * mounted, so this suite does not exercise /api/*. It proves the SPA boots on every
 * registered route, that no route throws into the ErrorBoundary, and that the two
 * interactive surfaces the SOP names (Passport modal, The Chest widget) actually work.
 */

const ROUTES = [
  { path: '/', heading: /american pirate federation/i },
  { path: '/intelligence', heading: /intel/i },
  { path: '/policies', heading: /policies/i },
  { path: '/events', heading: /fleet muster/i },
  { path: '/podcast', heading: /transmission/i },
  { path: '/shop', heading: /armory/i },
  { path: '/donate', heading: /fund the fleet/i },
  { path: '/propose', heading: /direct democracy|propose/i }
];

// The ErrorBoundary fallback copy. Its presence means a component threw during render.
const FATAL_UI = /INTERFACE INITIALIZATION FAILED/i;

const ignoreBenignConsoleNoise = (text) =>
  // No thirdweb client ID is configured in CI; RPC hosts may be unreachable from the
  // runner. Neither is an app regression.
  /clientId|client id|VITE_|Failed to fetch|Failed to load resource|net::ERR|favicon/i.test(text);

const collectProblems = (page) => {
  const problems = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (ignoreBenignConsoleNoise(text)) return;
    problems.push(`console: ${text}`);
  });

  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));

  page.on('response', (res) => {
    const url = res.url();
    if (!url.startsWith('http://127.0.0.1:4173')) return;
    if (res.status() >= 400) problems.push(`${res.status()} ${url}`);
  });

  return problems;
};

for (const route of ROUTES) {
  test(`route ${route.path} mounts without a fatal error`, async ({ page }) => {
    const problems = collectProblems(page);

    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), `${route.path} should return 200`).toBe(200);

    // The Web3 layer takes a few seconds to settle on a cold start; wait for the router
    // to swap the Suspense skeleton for real content.
    await expect(page.locator('#root')).not.toBeEmpty();

    await expect(page.locator('body')).toContainText(route.heading);
    await expect(page.locator('body'), `${route.path} rendered the ErrorBoundary`).not.toContainText(FATAL_UI);

    expect(problems, `problems on ${route.path}:\n${problems.join('\n')}`).toEqual([]);
  });
}

test('unknown route renders NotFound rather than a blank screen', async ({ page }) => {
  await page.goto('/this-route-does-not-exist', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('body')).toContainText(/404/i);
});

test('Pirate Passport modal opens as a dialog and closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const trigger = page.getByRole('button', { name: /^passport$/i }).first();
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toContainText(/pirate passport/i);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('The Chest: 300x300, monthly by default, working ladder, visible disclosure', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/donate', { waitUntil: 'domcontentloaded' });

  const widget = page.locator('.w-\\[300px\\].h-\\[300px\\]');
  await expect(widget).toBeVisible();

  const box = await widget.boundingBox();
  expect(Math.round(box.width)).toBe(300);
  expect(Math.round(box.height)).toBe(300);

  // Recurring is the documented default.
  const monthly = page.getByRole('button', { name: /^monthly$/i });
  await expect(monthly).toHaveClass(/border-apf-emerald/);

  // The ladder re-selects an amount.
  const fifty = page.getByRole('button', { name: /^\$50$/ });
  await fifty.click();
  await expect(fifty).toHaveClass(/bg-apf-emerald/);

  const once = page.getByRole('button', { name: /one-time/i });
  await once.click();
  await expect(once).toHaveClass(/border-apf-emerald/);

  // The 501(c)(4) non-deductibility disclosure must be present and not clipped.
  const disclosure = page.getByText(/not deductible as charitable contributions/i).first();
  await expect(disclosure).toBeVisible();
  const dBox = await disclosure.boundingBox();
  expect(dBox.height).toBeGreaterThan(0);
  expect(dBox.y + dBox.height).toBeLessThanOrEqual(901);
});

test('treasury ledger publishes no invented transactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const ledgerTab = page.getByRole('button', { name: /mothership ledger/i });
  await expect(ledgerTab).toBeVisible();
  await ledgerTab.click();

  await expect(page.locator('body')).toContainText(/AUDIT STATUS/i);

  const body = await page.locator('body').innerText();
  // Fixture rows removed in this change: truncated hashes, invented grant totals, a
  // placeholder IPFS CID, and the "LIVE SIMULATION // METRICS VERIFIED" banner.
  expect(body).not.toMatch(/0x3e4|0x1a2/);
  expect(body).not.toMatch(/bafybei/i);
  expect(body).not.toMatch(/LIVE SIMULATION/i);
  expect(body).not.toMatch(/Labor Union Support Node|Education Grants Pool/i);
});
