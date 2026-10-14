import { expect, test } from '@playwright/test';

const routes = ['/', '/pages/dca-calculator.html', '/pages/seeking-biblical-truth/', '/pages/conviction.html', '/pages/alphaeus-thoughts.html', '/pages/feedback/', '/pages/sg-transit.html'];

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status: 204 }));
  await page.route('https://www.gstatic.com/firebasejs/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
});

test('public page layouts reflow at phone, tablet, desktop and enlarged text sizes', async ({ page }) => {
  test.setTimeout(120_000);
  for (const [width, enlarged] of [[320, false], [375, false], [768, false], [1280, false], [640, false], [375, true]]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'load' });
      if (enlarged) {
        await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
        await expect(page.locator('html')).toHaveCSS('font-size', '32px');
      }
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const actual = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(actual, `${route} at ${width}px${enlarged ? ' with 200% root text' : ''}`).toBeLessThanOrEqual(width + 1);
    }
  }
});

test('quote actions and the chip editor keep usable sizes on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/pages/dca-calculator.html', { waitUntil: 'load' });
  for (const id of ['refreshQuotes', 'enableRealtime']) {
    const box = await page.locator(`#${id}`).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
  await page.locator('#editQuickAmounts summary').click();
  await page.locator('#quickAmountInput').focus();
  await expect(page.locator('#quickAmountInput')).toBeFocused();
  const input = await page.locator('#quickAmountInput').boundingBox();
  expect(input.x).toBeGreaterThanOrEqual(0);
  expect(input.x + input.width).toBeLessThanOrEqual(320);
  await page.locator('#editQuickAmounts summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('thought footnote controls retain their compact 24px targets', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/pages/alphaeus-thoughts.html', { waitUntil: 'load' });
  await expect(page.locator('.footnote').first()).toBeVisible();
  const box = await page.locator('.footnote').first().boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
  await page.locator('.footnote').first().click();
  await expect(page.locator('#note')).toBeVisible();
  await page.locator('#note-close').click();
  await expect(page.locator('.footnote').first()).toBeFocused();
});
