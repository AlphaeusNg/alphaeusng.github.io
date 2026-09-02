import { expect, test } from '@playwright/test';

test('light follows through the hero and section lenses while project cards react locally', async ({ page }) => {
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
  const storyBox = await story.boundingBox();
  expect(storyBox).not.toBeNull();
  await page.mouse.move(storyBox.x + storyBox.width * 0.25, storyBox.y + storyBox.height * 0.4);
  await page.mouse.move(storyBox.x + storyBox.width * 0.62, storyBox.y + storyBox.height * 0.5);
  await expect(story).toHaveClass(/is-pointer-active/);
  await expect.poll(() => story.evaluate((element) => element.style.getPropertyValue('--lens-lead-x'))).not.toBe('');

  const storyLens = await story.evaluate(element => getComputedStyle(element).getPropertyValue('--lens-primary-rgb'));
  const journeyLens = await page.locator('#journey').evaluate(element => getComputedStyle(element).getPropertyValue('--lens-primary-rgb'));
  expect(storyLens).not.toBe(journeyLens);

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

  const story = page.locator('#story');
  await story.scrollIntoViewIfNeeded();
  const storyBox = await story.boundingBox();
  await page.mouse.move(storyBox.x + storyBox.width / 2, storyBox.y + storyBox.height / 2);
  await expect(story).not.toHaveClass(/is-pointer-active/);
  await expect(story).toHaveCSS('--lens-x', '68%');
});
