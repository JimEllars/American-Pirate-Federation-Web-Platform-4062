# Brand asset rendering

`og-template.html` is the source of `public/og-image.png` (1200×630 Open Graph /
Twitter card image). It is checked in so the asset can be regenerated rather than
re-photographed by hand.

Re-render after editing the template:

```bash
npm run preview -- --port 4173 &    # any static server will do
npx playwright screenshot --viewport-size=1200,630 \
  --wait-for-timeout=500 scripts/brand/og-template.html public/og-image.png
```

Or, from Node (already a dev dependency via `@playwright/test`):

```js
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto('file://' + process.cwd() + '/scripts/brand/og-template.html');
await page.waitForTimeout(400);
await page.screenshot({ path: 'public/og-image.png' });
await browser.close();
```

Keep the frame, the sigil and the palette (`#050505`, `#9400D3`, `#00FF66`, VT323) in
sync with `tailwind.config.js` and `public/favicon.svg`.
