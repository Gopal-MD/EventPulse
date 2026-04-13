const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/visual',
  timeout: 30_000,
  use: {
    headless: true,
    viewport: { width: 1365, height: 768 },
    ignoreHTTPSErrors: true,
  },
  webServer: [
    {
      command: 'npm run start:test --prefix backend',
      url: 'http://127.0.0.1:8080/api/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev --prefix frontend -- --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
