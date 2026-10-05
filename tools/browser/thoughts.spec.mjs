import { expect, test } from '@playwright/test';

async function openReader(page, width, height) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width, height });
  await page.goto('/pages/alphaeus-thoughts.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#letter h2').first()).toHaveText('Opening thought');
}

test('opens his letter with the four pictures', async ({ page }) => {
  await openReader(page, 1280, 800);
  await expect(page.getByRole('heading', { level: 1, name: "Alphaeus' thoughts" })).toBeVisible();
  await expect(page.locator('#letter')).toContainText('with utmost love in the hope of unity');
  await expect(page.locator('#letter')).toContainText('for each verse and its explanation');
  await expect(page.locator('#meta')).toContainText('minute read');
  await expect(page.locator('#source-link')).toHaveAttribute('href', /1qqXT6QfX_3ep1EMuEpqc021aJ3Vwd1EOTasuRBkqR1I/);
  await page.waitForFunction(() => {
    const images = [...document.querySelectorAll('#letter img')];
    return images.length === 4 && images.every((image) => image.complete && image.naturalWidth > 0);
  });
  await expect(page.locator('#letter figcaption').first()).toContainText('with utmost love in the hope of unity');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  const sizes = await page.evaluate(() => {
    const body = document.querySelector('#letter p');
    const note = [...document.querySelectorAll('#letter em')].find((node) => node.textContent.startsWith('26/1/26'));
    const tiny = document.querySelector('#letter [data-size="9"]');
    return {
      body: Number.parseFloat(getComputedStyle(body).fontSize),
      note: Number.parseFloat(getComputedStyle(note).fontSize),
      tiny: Number.parseFloat(getComputedStyle(tiny).fontSize),
    };
  });
  expect(sizes.note).toBeLessThan(sizes.body);
  expect(sizes.tiny).toBeLessThan(sizes.note);
});

test('search and notes stay on his words', async ({ page }) => {
  await openReader(page, 1280, 800);
  await page.keyboard.press('/');
  await expect(page.locator('#search-input')).toBeFocused();
  await page.locator('#search-input').fill('unity');
  await expect(page.locator('#search-count')).toContainText('of');
  await page.getByRole('button', { name: 'Next match' }).click();
  await expect(page.locator('mark.current')).toBeVisible();

  const noteButton = page.getByRole('button', { name: 'Show note 1' }).first();
  await noteButton.click();
  await expect(page.locator('#note-body')).toContainText('exploring beyond LCOC');
  await expect(page.locator('#note-close')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#note-close')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#note-backdrop')).toBeHidden();
  await expect(noteButton).toBeFocused();
});

test('the outline and verse toggle move through the argument', async ({ page }) => {
  await openReader(page, 1280, 800);
  await page.locator('#outline').getByRole('link', { name: 'Theology of Baptism', exact: true }).click();
  await expect(page).toHaveURL(/#h\.bntnfey0svma$/);
  await expect.poll(async () => page.evaluate(() => {
    const bar = document.querySelector('.read-bar').getBoundingClientRect();
    const heading = document.getElementById('h.bntnfey0svma').getBoundingClientRect();
    const clear = heading.top >= bar.bottom - 2 && heading.top < bar.bottom + 120;
    return clear ? 'ok' : `bar ${Math.round(bar.bottom)} heading ${Math.round(heading.top)}`;
  })).toBe('ok');

  const church = page.locator('#letter [data-lens="coc"]').first();
  const faith = page.locator('#letter [data-lens="fide"]').first();
  await expect(church).toBeVisible();
  await expect(faith).toBeVisible();
  await page.getByRole('radio', { name: 'Both' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('body')).toHaveAttribute('data-lens', 'coc');
  await expect(faith).toBeHidden();
  await page.getByRole('radio', { name: 'Faith alone' }).click();
  await expect(church).toBeHidden();
  await expect(faith).toBeVisible();
  await expect(page.locator('#letter')).toContainText('Additional Context');
  await page.getByRole('radio', { name: 'Both' }).click();
  await expect(church).toBeVisible();
  await expect(faith).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue · Why I feel convicted to explore beyond LCOC' })).toHaveCount(1);
});

test('a phone can open the contents without sideways scrolling', async ({ page }) => {
  await openReader(page, 320, 700);
  const overflow = () => page.evaluate(() => {
    const root = document.documentElement;
    if (root.scrollWidth <= root.clientWidth + 1) return '';
    const nodes = [...document.body.querySelectorAll('*')];
    const wide = nodes.find((node) => node.scrollWidth > root.clientWidth + 1);
    return wide ? `${wide.tagName}.${wide.className} ${wide.scrollWidth}` : `document ${root.scrollWidth}`;
  });
  expect(await overflow()).toBe('');
  await expect(page.locator('#outline-open')).toBeVisible();
  await expect(page.locator('.read-shell > .outline')).toBeHidden();
  await page.locator('#outline-open').click();
  await expect(page.locator('#outline-dialog')).toBeVisible();
  await page.locator('#outline-mobile').getByRole('link', { name: 'Opening thought', exact: true }).click();
  await expect(page.locator('#outline-dialog')).toBeHidden();
  await expect(page.locator('#h\\.cvxcaz2nq4c3')).toBeFocused();
  expect(await overflow()).toBe('');
});

test('home opens the reader and keeps the original document', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#journey-documents', { waitUntil: 'domcontentloaded' });
  const reader = page.getByRole('link', { name: "Alphaeus' thoughts", exact: true });
  await expect(reader).toHaveAttribute('href', 'pages/alphaeus-thoughts.html');
  await expect(page.getByRole('link', { name: 'Original document' })).toHaveAttribute('href', /1qqXT6QfX_3ep1EMuEpqc021aJ3Vwd1EOTasuRBkqR1I/);
  await reader.click();
  await expect(page).toHaveURL(/\/pages\/alphaeus-thoughts\.html$/);
  await expect(page.locator('#letter')).toContainText('Hello');
});
