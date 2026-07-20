import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E test configuration.
 * Tests live in tests/e2e/ and run against the local dev server.
 * In CI, tests run against the Vercel preview deployment URL.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        env: { ...process.env, E2E_TEST: 'true' },
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
})
