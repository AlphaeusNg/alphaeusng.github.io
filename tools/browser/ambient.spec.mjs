import { expect, test } from '@playwright/test';

test('hero light leads the pointer and project cards react locally', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const hero = page.locator('#home-hero');
  const heroBox = await hero.boundingBox();
  expect(heroBox).not.toBeNull();

  await page.mouse.move(heroBox.x + heroBox.width * 0.2, heroBox.y + heroBox.height * 0.35);
  await page.mouse.move(heroBox.x + heroBox.width * 0.7, heroBox.y + heroBox.height * 0.45);
  await expect(hero).toHaveClass(/is-pointer-active/);
  await expect.poll(() => hero.evaluate((element) => element.style.getPropertyValue('--spot-lead-x'))).not.toBe('');

  const card = page.locator('#craft .card').first();
  await card.scrollIntoViewIfNeeded();
  const cardBox = await card.boundingBox();
  expect(cardBox).not.toBeNull();
  await page.mouse.move(cardBox.x + cardBox.width * 0.8, cardBox.y + cardBox.height * 0.3);
  await expect.poll(() => card.evaluate((element) => element.style.getPropertyValue('--card-x'))).not.toBe('');
  await expect.poll(() => card.evaluate((element) => element.style.getPropertyValue('--card-ry'))).not.toBe('0deg');
});

test('reduced motion keeps the atmosphere static', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const hero = page.locator('#home-hero');
  const box = await hero.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(hero).not.toHaveClass(/is-pointer-active/);
  await expect(hero).toHaveCSS('--spot-x', '72%');
});
