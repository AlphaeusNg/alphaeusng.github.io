import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tools/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 15_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [['line']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
