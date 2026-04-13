const { test, expect } = require('@playwright/test');

test('map page visual baseline', async ({ page }) => {
  await page.route('**/api/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ mapsApiKey: '' }),
    });
  });

  await page.route('**/api/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        gates: {
          'Gate 1': { crowdLevel: 70, status: 'Medium' },
          'Gate 2': { crowdLevel: 20, status: 'Low' },
          'Gate 3': { crowdLevel: 15, status: 'Low' },
          'Gate 4': { crowdLevel: 25, status: 'Low' },
        },
        alerts: [
          { id: 1, message: '[System Fallback] Gate 1 is highly crowded! Please use Gate 2.' },
        ],
        foodQueues: [
          { id: 1, name: 'Burger Queen', waitTime: 5 },
          { id: 2, name: 'Nacho King', waitTime: 3 },
          { id: 3, name: 'Pizza Planet', waitTime: 11 },
          { id: 4, name: 'Vegan Bytes', waitTime: 4 },
        ],
        tickets: {},
      }),
    });
  });

  await page.goto('http://127.0.0.1:5173/nav', { waitUntil: 'networkidle' });

  const main = page.locator('main[aria-label="Live Stadium Navigation"]');
  await expect(main).toBeVisible();

  await expect(main).toHaveScreenshot('map-page.png', {
    maxDiffPixelRatio: 0.03,
    animations: 'disabled',
  });
});
