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
  { path: '/propose', heading: /proposition portal|propose|clearance/i },
  { path: '/governance', heading: /proposition portal|propose|clearance/i },
  { path: '/calculator', heading: /great balance/i },
  { path: '/ledger', heading: /the ledger/i },
  { path: '/pay-ratio', heading: /the ledger/i }
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

  // The 501(c)(4) non-deductibility disclosure must be inside the 300x300 frame, not
  // merely inside the viewport. The earlier version of this test only compared against
  // the viewport, so it passed while the text rendered ~42px BELOW the widget's bottom
  // edge — invisible to every donor. Measure against the widget.
  const disclosure = widget.getByText(/not deductible as charitable contributions/i).first();
  await expect(disclosure).toBeVisible();
  const dBox = await disclosure.boundingBox();
  expect(dBox.height).toBeGreaterThan(0);
  expect(dBox.y).toBeGreaterThanOrEqual(box.y - 0.5);
  expect(dBox.y + dBox.height).toBeLessThanOrEqual(box.y + box.height + 0.5);

  // And the widget itself must not overflow its own fixed height.
  const overflow = await widget.evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(overflow, 'widget content overflows its 300px height').toBeLessThanOrEqual(1);
});

test('brand and social assets are real files, not the SPA fallback', async ({ request }) => {
  // A missing /favicon.svg or /og-image.jpg is served index.html with HTTP 200 by the
  // SPA fallback, so status codes prove nothing. Check the bytes.
  const favicon = await request.get('/favicon.svg');
  expect(favicon.status()).toBe(200);
  expect(await favicon.text()).toMatch(/^<svg[\s>]/);

  const og = await request.get('/og-image.png');
  expect(og.status()).toBe(200);
  const bytes = await og.body();
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); // PNG signature

  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toMatch(/^User-agent:/);
});

// Measures settled overflow, and names the widest offending element when there is one.
// A single sample is flaky on a fast runner: a Suspense skeleton or a font swap can widen
// the document for a frame and settle a moment later (seen once in CI on /intelligence at
// 375px, 50px, on a commit that had already passed). What the SOP cares about is the
// settled layout, so poll — and if it never settles, say which element is responsible
// instead of only reporting a number.
const measureOverflow = (page) =>
  page.evaluate(() => {
    const de = document.documentElement;
    const overflow = de.scrollWidth - de.clientWidth;
    if (overflow <= 1) return { overflow, worst: null };
    let worst = null;
    for (const el of document.querySelectorAll('body *')) {
      const rect = el.getBoundingClientRect();
      if (rect.right <= de.clientWidth + 1) continue;
      if (!worst || rect.right > worst.right) {
        worst = {
          right: Math.round(rect.right),
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || '').slice(0, 100)
        };
      }
    }
    return { overflow, worst };
  });

for (const width of [375, 768, 1440]) {
  test(`no horizontal overflow at ${width}px on any route`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
    for (const route of ROUTES) {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#root')).not.toBeEmpty();

      let last = { overflow: 0, worst: null };
      try {
        await expect
          .poll(async () => {
            last = await measureOverflow(page);
            return last.overflow;
          }, { timeout: 8000 })
          .toBeLessThanOrEqual(1);
      } catch (err) {
        throw new Error(
          `horizontal overflow of ${last.overflow}px on ${route.path} at ${width}px` +
            (last.worst
              ? ` — widest element: <${last.worst.tag} class="${last.worst.cls}"> at right=${last.worst.right}px`
              : '')
        );
      }
    }
  });
}

test('mobile navigation drawer opens and closes without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const menuButton = page.locator('nav button').filter({ has: page.locator('svg') }).last();
  await menuButton.click();

  // The drawer renders the same route list as the desktop bar.
  await expect(page.getByRole('link', { name: /^donate$/i }).first()).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
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

// ---------------------------------------------------------------------------
// SOP Playbook D — the two growth instruments named in the playbook, and the
// governance route. These were 404s on 2026-11-02 (audit F12).
// ---------------------------------------------------------------------------

test('the Great Balance Calculator computes Article XIV arithmetic exactly', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/calculator', { waitUntil: 'domcontentloaded' });

  const monthly = page.getByTestId('gb-monthly');
  const annual = page.getByTestId('gb-annual');

  // Default: $32,000 single, no dependents. 33% of the $8,000 gap = $2,640/yr = $220/mo.
  await expect(monthly).toHaveText('$220');
  await expect(annual).toHaveText('$2,640');

  // Edge case: $0 income, married, two dependents.
  //   0.33 × ($60,000 − 0) = $19,800  +  2 × $4,800 = $9,600  →  $29,400/yr = $2,450/mo
  await page.locator('#gb-income').fill('0');
  await page.getByRole('button', { name: /^married/i }).click();
  const addChild = page.getByRole('button', { name: /add one dependent/i });
  await addChild.click();
  await addChild.click();
  await expect(monthly).toHaveText('$2,450');
  await expect(annual).toHaveText('$29,400');

  // Edge case: above the floor with no dependents pays nothing, and says so rather than
  // rendering a blank or a negative.
  await page.getByRole('button', { name: /^individual/i }).click();
  await page.locator('#gb-income').fill('10000000');
  await expect(monthly).toHaveText('$0');
  await expect(page.locator('body')).toContainText(/pays nothing/i);

  // Negative input is read as zero, not as a refund. (Clear the two dependents first so
  // the assertion is the adult floor alone: 0.33 × $40,000 = $13,200/yr = $1,100/mo.)
  const removeChild = page.getByRole('button', { name: /remove one dependent/i });
  await removeChild.click();
  await removeChild.click();
  await page.locator('#gb-income').fill('-5000');
  await expect(page.locator('body')).toContainText(/negative income is read as \$0/i);
  await expect(monthly).toHaveText('$1,100');
});

test('the ledger publishes no invented settlements or pay ratios', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ledger', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('tab', { name: /treasury/i })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('body')).toContainText(/no settlements recorded/i);
  // Law 2: the frontend must not offer a way to move treasury funds. Assert on controls,
  // not on prose — the panel's own copy says there is no transfer control.
  await expect(page.getByRole('button', { name: /withdraw|transfer|send|approve/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /withdraw|transfer|send|approve/i })).toHaveCount(0);

  await page.getByRole('tab', { name: /pay ratio/i }).click();
  await expect(page.locator('body')).toContainText(/no verified filings ingested/i);

  // The explorer routes the reader to the filing rather than estimating a ratio.
  const edgar = page.getByRole('link', { name: /open on sec edgar/i });
  await expect(edgar).toBeVisible();
  expect(await edgar.getAttribute('href')).toMatch(/^https:\/\/www\.sec\.gov\/edgar\/search\//);

  // /pay-ratio is the same surface, opened on that panel.
  await page.goto('/pay-ratio', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('tab', { name: /pay ratio/i })).toHaveAttribute('aria-selected', 'true');
});

test('/policies publishes the doctrine of record, not a foreign platform', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/policies', { waitUntil: 'domcontentloaded' });

  // Doctrine titles (supabase/migrations/20261102120000_*). The live table held a different
  // organisation's policy set on 2026-11-02; the page must not render those titles.
  // auto-waiting assertions, not innerText: the page mounts behind Suspense.
  const body = page.locator('body');
  await expect(body).toContainText('The Zero-Data Protocol');
  await expect(body).toContainText('Generational Stewardship & Competency Cap');
  await expect(body).not.toContainText('Direct Democracy Architecture');
  await expect(body).not.toContainText('Net Neutrality Restoration');
});

for (const width of [1280, 1440, 1920]) {
  test(`desktop navigation stays on one row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const nav = page.locator('nav').first();
    const box = await nav.boundingBox();
    // The bar is h-16 (64px). A wrapped link row makes it taller and pushes the wallet
    // control below the header (audit F18).
    expect(Math.round(box.height), `navigation wrapped at ${width}px`).toBeLessThanOrEqual(68);

    // And every control must sit inside the bar, not underneath it.
    for (const label of ['Intel', 'Transmissions', 'Directives', 'Fleet Muster', 'Armory', 'Governance', 'Donate', 'Tools', 'Passport']) {
      const control = nav.getByText(label, { exact: true }).first();
      await expect(control, `${label} missing from the desktop bar`).toBeVisible();
      const cbox = await control.boundingBox();
      expect(cbox.y + cbox.height, `${label} renders below the header at ${width}px`).toBeLessThanOrEqual(64.5);
    }
  });
}

test('the Tools menu reaches the Playbook D instruments', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.getByText('Tools', { exact: true }).first().click();
  const calculator = page.getByRole('link', { name: /balance calculator/i }).first();
  await expect(calculator).toBeVisible();
  await calculator.click();
  await expect(page.locator('body')).toContainText(/great balance/i);
});
