import { expect, test } from '@playwright/test';

const HIDDEN_CLASS = /(^|\s)hidden(\s|$)/;
const runtimeErrors = new WeakMap();
const CHART_STUB = `
  window.__chartInstances = [];
  window.Chart = class {
    constructor(canvas, config) {
      this.canvas = canvas;
      this.data = config.data;
      this.options = config.options;
      this.updateCount = 0;
      this.destroyed = false;
      window.__chartInstances.push(this);
    }

    update() {
      this.updateCount += 1;
    }

    destroy() {
      this.destroyed = true;
    }
  };
`;

test.beforeEach(async ({ page, baseURL }) => {
  const errors = [];
  const firstPartyOrigin = new URL(baseURL).origin;
  runtimeErrors.set(page, errors);
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    const source = message.location().url ? ` @ ${message.location().url}` : '';
    if (message.type() === 'error') errors.push(`console: ${message.text()}${source}`);
  });
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin === firstPartyOrigin && response.status() >= 400) {
      errors.push(
        `response: ${response.status()} ${response.request().method()} ${url.pathname}${url.search}`
      );
    }
  });

  await page.route('https://fonts.googleapis.com/**', route =>
    route.fulfill({ contentType: 'text/css', body: '' })
  );
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status: 204 }));
});

test.afterEach(async ({ page }) => {
  await page.waitForTimeout(50);
  expect(runtimeErrors.get(page), 'unexpected browser runtime errors').toEqual([]);
});

test('mobile menu exposes state and restores focus on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const button = page.locator('#mobile-menu-btn');
  const menu = page.locator('#mobile-menu');
  const nav = page.locator('#nav');
  const scrim = page.locator('#mobile-menu-scrim');

  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).not.toHaveClass(HIDDEN_CLASS);
  await expect(nav).toHaveClass(/\bmobile-menu-open\b/);
  await expect(page.locator('body')).toHaveClass(/\bmobile-menu-open\b/);
  await expect(scrim).not.toHaveAttribute('hidden', '');
  await expect(scrim).toHaveAttribute('aria-hidden', 'false');

  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toHaveClass(HIDDEN_CLASS);
  await expect(button).toBeFocused();
});

test('project modal owns focus, traps Tab, and restores its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const trigger = page.locator('button[onclick*="htx-threat"]');
  const modal = page.locator('#project-modal');
  const headerClose = modal.getByRole('button', { name: 'Close modal' });

  await trigger.click();
  await expect(modal).not.toHaveClass(HIDDEN_CLASS);
  await expect(modal).toHaveAttribute('aria-hidden', 'false');
  await expect(headerClose).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(modal.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(headerClose).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(modal).toHaveClass(HIDDEN_CLASS);
  await expect(modal).toHaveAttribute('aria-hidden', 'true');
  await expect(trigger).toBeFocused();
});

test('hash navigation clears the sticky header and moves mobile focus to content', async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = `
        @media (min-width: 768px) {
          .project-tabs-inner { padding-block: 2rem !important; }
        }
      `;
      document.head.append(style);
    }, { once: true });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/#craft', { waitUntil: 'domcontentloaded' });

  const desktopGeometry = await page.locator('#craft').evaluate(element => ({
    targetTop: element.getBoundingClientRect().top,
    navBottom: document.querySelector('#nav').getBoundingClientRect().bottom,
    navHeight: document.querySelector('#nav').offsetHeight,
    scrollOffset: Number.parseFloat(window.getComputedStyle(element).scrollMarginTop),
  }));
  expect(desktopGeometry.scrollOffset).toBeCloseTo(desktopGeometry.navHeight, 0);
  expect(desktopGeometry.targetTop).toBeGreaterThanOrEqual(desktopGeometry.navBottom - 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#mobile-menu-btn').click();
  await page.getByRole('button', { name: /Work/ }).click();
  await page.locator('#mobile-menu a[href="#story"]').click();

  await expect(page).toHaveURL(/#story$/);
  await expect(page.locator('#mobile-menu')).toHaveClass(HIDDEN_CLASS);
  await expect(page.locator('#mobile-menu-btn')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('body')).not.toHaveClass(/\bmobile-menu-open\b/);
  await expect(page.locator('#story')).toBeFocused();

  const mobileGeometry = await page.locator('#story').evaluate(element => ({
    targetTop: element.getBoundingClientRect().top,
    navBottom: document.querySelector('#nav').getBoundingClientRect().bottom,
  }));
  expect(mobileGeometry.targetTop).toBeGreaterThanOrEqual(mobileGeometry.navBottom - 1);

  await page.goto('/#%', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#nav')).toBeVisible();
});

test('conviction page renders ledger data and switches benchmark views', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/npm/chart.js', route =>
    route.fulfill({ contentType: 'application/javascript', body: CHART_STUB })
  );
  await page.route('https://cdn.tailwindcss.com/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );

  await page.goto('/pages/conviction.html', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#transactionWindow')).toHaveText(
    'November 19, 2020 -> May 7, 2026'
  );
  await expect(page.locator('#transactionCount')).toHaveText('64 total');
  await expect(page.locator('#currentShares')).toHaveText('159.42 shares');
  await expect(page.locator('#buySellCount')).toHaveText('54 buys / 10 sells');
  await expect(page.locator('#capitalDeployed')).toHaveText('$60,959');
  await expect(page.locator('#saleProceeds')).toHaveText('$16,570');
  await expect(page.locator('#benchmarkTslaValue')).toHaveText('$70,136');
  await expect(page.locator('#benchmarkSpyValue')).toHaveText('$70,955');
  await expect(page.locator('#benchmarkDifference')).toHaveText('-$818');
  await expect(page.locator('#benchmarkNetCapital')).toHaveText('$44,388');
  await expect(page.locator('#benchmarkChartStatus')).toContainText(
    'Latest valuation month: May 2026. Current value differential: -$818.'
  );

  const recentRows = page.locator('#recentTransactionsBody tr');
  await expect(recentRows).toHaveCount(6);
  await expect(recentRows.first()).toContainText('May 7, 2026');
  await expect(recentRows.first()).toContainText('Buy');
  await expect(recentRows.first()).toContainText('3.42');
  await expect(recentRows.first()).toContainText('$409');
  await expect(recentRows.first()).toContainText('-$1,400');

  await expect.poll(() => page.evaluate(() => window.__chartInstances.length)).toBe(2);
  expect(await page.evaluate(() => window.__chartInstances.map(chart => ({
    labels: chart.data.datasets.map(dataset => dataset.label),
    updateCount: chart.updateCount,
  })))).toEqual([
    { labels: ['Monthly net shares', 'Cumulative shares'], updateCount: 0 },
    {
      labels: ['TSLA position value', 'SPY benchmark value', 'Net invested capital'],
      updateCount: 0,
    },
  ]);

  const valueButton = page.locator('[data-view="value"]');
  const deltaButton = page.locator('[data-view="delta"]');
  const flowsButton = page.locator('[data-view="flows"]');
  await expect(valueButton).toHaveAttribute('aria-pressed', 'true');

  await deltaButton.click();
  await expect(valueButton).toHaveAttribute('aria-pressed', 'false');
  await expect(deltaButton).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => window.__chartInstances[1].updateCount)).toBe(1);
  expect(await page.evaluate(() =>
    window.__chartInstances[1].data.datasets.map(dataset => dataset.label)
  )).toEqual(['TSLA minus SPY']);

  await flowsButton.click();
  await expect(deltaButton).toHaveAttribute('aria-pressed', 'false');
  await expect(flowsButton).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => window.__chartInstances[1].updateCount)).toBe(2);
  expect(await page.evaluate(() =>
    window.__chartInstances[1].data.datasets.map(dataset => dataset.label)
  )).toEqual(['Monthly capital flow', 'Net invested capital']);
});
