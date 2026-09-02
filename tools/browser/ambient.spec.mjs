import { expect, test } from '@playwright/test';

test('light follows through one seamless page surface while project cards react locally', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const hero = page.locator('#home-hero');
  const heroBox = await hero.boundingBox();
  expect(heroBox).not.toBeNull();

  await page.mouse.move(heroBox.x + heroBox.width * 0.2, heroBox.y + heroBox.height * 0.35);
  await page.mouse.move(heroBox.x + heroBox.width * 0.7, heroBox.y + heroBox.height * 0.45);
  await expect(hero).toHaveClass(/is-pointer-active/);
  await expect.poll(() => hero.evaluate((element) => element.style.getPropertyValue('--spot-lead-x'))).not.toBe('');

  const ambient = page.locator('[data-page-ambient]');
  const story = page.locator('#story');
  await story.scrollIntoViewIfNeeded();
  const storyBox = await story.boundingBox();
  expect(storyBox).not.toBeNull();
  await page.mouse.move(storyBox.x + storyBox.width * 0.25, storyBox.y + storyBox.height * 0.4);
  await page.mouse.move(storyBox.x + storyBox.width * 0.62, storyBox.y + storyBox.height * 0.5);
  await expect(ambient).toHaveClass(/is-pointer-active/);
  await expect.poll(() => ambient.evaluate(element => element.style.getPropertyValue('--page-light-y'))).not.toBe('');
  const startScale = await ambient.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue('--page-light-scale'))
  );

  await page.evaluate(() => {
    const surface = document.querySelector('[data-page-ambient]');
    window.scrollTo(0, surface.offsetTop + surface.offsetHeight / 2 - window.innerHeight / 2);
  });
  await page.mouse.move(0, 0);
  await page.mouse.move(page.viewportSize().width / 2, page.viewportSize().height / 2);
  await expect.poll(async () => ambient.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue('--page-light-scale'))
  )).toBeLessThan(startScale - 0.2);
  const middleScale = await ambient.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue('--page-light-scale'))
  );

  const connect = page.locator('#connect');
  await connect.scrollIntoViewIfNeeded();
  const connectBox = await connect.boundingBox();
  await page.mouse.move(connectBox.x + connectBox.width * 0.7, connectBox.y + connectBox.height * 0.6);
  await expect.poll(async () => ambient.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue('--page-light-scale'))
  )).toBeGreaterThan(middleScale + 0.1);

  await expect(page.locator('.page-light-orb')).toHaveCount(1);
  await expect(page.locator('[data-light-lens]')).toHaveCount(0);
  await expect(page.locator('.elegant-divider')).toHaveCount(0);
  await expect(page.locator('#craft')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('#connect')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

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

  const ambient = page.locator('[data-page-ambient]');
  const story = page.locator('#story');
  await story.scrollIntoViewIfNeeded();
  const storyBox = await story.boundingBox();
  await page.mouse.move(storyBox.x + storyBox.width / 2, storyBox.y + storyBox.height / 2);
  await expect(ambient).not.toHaveClass(/is-pointer-active/);
  await expect(page.locator('.page-light-orb')).toHaveCSS('display', 'none');
});
