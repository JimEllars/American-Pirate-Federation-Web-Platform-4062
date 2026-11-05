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
    // --host 127.0.0.1 is load-bearing: without it `vite preview` binds to whatever
    // `localhost` resolves to first, and on the GitHub Actions runner that is ::1 while the
    // probe below is 127.0.0.1. The server came up and Playwright never saw it, so the smoke
    // gate failed with "Timed out waiting 120000ms from config.webServer" on the first CI run
    // of this suite (2026-11-03). Binding the probe address explicitly removes the variable.
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
