import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    actionTimeout: 5000,
    navigationTimeout: 30000,
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
