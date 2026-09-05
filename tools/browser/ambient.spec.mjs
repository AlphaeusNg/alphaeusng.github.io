import { expect, test } from '@playwright/test';

test('light stays in the opening hero while project cards react locally', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const hero = page.locator('#home-hero');
  const heroBox = await hero.boundingBox();
  expect(heroBox).not.toBeNull();

  await page.mouse.move(heroBox.x + heroBox.width * 0.2, heroBox.y + heroBox.height * 0.35);
  await page.mouse.move(heroBox.x + heroBox.width * 0.7, heroBox.y + heroBox.height * 0.45);
  await expect(hero).toHaveClass(/is-pointer-active/);
  await expect.poll(() => hero.evaluate((element) => element.style.getPropertyValue('--spot-lead-x'))).not.toBe('');

  const story = page.locator('#story');
  await story.scrollIntoViewIfNeeded();
  await expect(page.locator('[data-page-ambient]')).toHaveCount(0);
  await expect(page.locator('.page-light-orb')).toHaveCount(0);
  await expect(page.locator('[data-light-lens]')).toHaveCount(0);
  await expect(page.locator('.elegant-divider')).toHaveCount(1);
  await expect(page.locator('#craft')).toHaveCSS('background-color', 'rgb(17, 24, 39)');
  await expect(page.locator('#connect')).toHaveCSS('background-color', 'rgb(17, 24, 39)');

  const storyBox = await story.evaluate((element) => ({
    paddingTop: Number.parseFloat(getComputedStyle(element).paddingTop),
    scrollMarginTop: Number.parseFloat(getComputedStyle(element).scrollMarginTop),
  }));
  expect(storyBox.paddingTop).toBeGreaterThanOrEqual(128);
  expect(storyBox.scrollMarginTop).toBeGreaterThanOrEqual(128);
  const storyIntro = story.locator('.sticky > p');
  expect(await storyIntro.evaluate(element => Number.parseFloat(getComputedStyle(element).marginTop))).toBeGreaterThan(28);
  const storyCopy = story.locator('.md\\:col-span-7');
  expect(await storyCopy.evaluate(element => Number.parseFloat(getComputedStyle(element).paddingTop))).toBeGreaterThan(20);

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

  await expect(page.locator('[data-page-ambient]')).toHaveCount(0);
  await expect(page.locator('.page-light-orb')).toHaveCount(0);
});
