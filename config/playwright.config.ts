import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '../tests',
  testIgnore: '**/helpers/**',
  outputDir: '../report/test-results',
  fullyParallel: false,
  retries: 1,
  timeout: 30_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../report/playwright-html', open: 'never' }],
    ['junit', { outputFile: '../report/junit-results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
  },
});
