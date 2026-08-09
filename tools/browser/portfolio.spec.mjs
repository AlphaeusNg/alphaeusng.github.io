import { expect, test } from '@playwright/test';

const HIDDEN_CLASS = /(^|\s)hidden(\s|$)/;
const runtimeErrors = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
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
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/#craft', { waitUntil: 'domcontentloaded' });

  const desktopGeometry = await page.locator('#craft').evaluate(element => ({
    targetTop: element.getBoundingClientRect().top,
    navBottom: document.querySelector('#nav').getBoundingClientRect().bottom,
  }));
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
});
