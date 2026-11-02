import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright smoke configuration (SOP §5 Gateway 3).
 *
 * Note on scope: `vite preview` serves the static build only. Pages Functions
 * (functions/api/*) are NOT mounted here, so API contract tests belong in a separate
 * `wrangler pages dev` project. What this suite proves is that the SPA boots, every
 * registered route renders, and the interactive surfaces the SOP names actually work.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'off',
    screenshot: 'off',
    video: 'off'
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
