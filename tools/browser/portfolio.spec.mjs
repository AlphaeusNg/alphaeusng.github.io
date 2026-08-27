import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const HIDDEN_CLASS = /(^|\s)hidden(\s|$)/;
const runtimeErrors = new WeakMap();
const VAULT_FIXTURE = JSON.parse(readFileSync(
  new URL('../../pages/seeking-biblical-truth/vault-data.json', import.meta.url),
  'utf8'
));
const D3_RUNTIME = readFileSync(
  new URL('../../node_modules/d3/dist/d3.min.js', import.meta.url),
  'utf8'
);
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
const FIREBASE_APP_STUB = `
  window.__feedbackWrites = [];
  window.__feedbackReject = false;
  function firestore() {
    return {
      collection(name) {
        return {
          add(payload) {
            window.__feedbackWrites.push({ collection: name, payload });
            if (window.__feedbackReject) {
              return Promise.reject(new Error('private inbox unavailable'));
            }
            return Promise.resolve({ id: 'feedback-Ab12c3' });
          },
        };
      },
    };
  }
  firestore.FieldValue = {
    serverTimestamp() {
      return '__SERVER_TIMESTAMP__';
    },
  };
  window.firebase = {
    apps: [],
    initializeApp(config) {
      this.apps.push({ config });
    },
    firestore,
  };
`;
const DCA_FIREBASE_STUB = `
  function auth() {
    return {
      onAuthStateChanged(cb) { cb(null); return function () {}; },
      currentUser: null,
      signInWithPopup() { return Promise.reject({ code: 'auth/popup-closed-by-user' }); },
      signOut() { return Promise.resolve(); },
    };
  }
  auth.GoogleAuthProvider = function () {
    this.setCustomParameters = function () {};
  };
  function firestore() {
    return {
      collection() {
        return {
          doc() {
            return {
              get() { return Promise.resolve({ exists: false, data() { return null; } }); },
              set() { return Promise.resolve(); },
              onSnapshot(cb) {
                cb({ exists: false, metadata: { hasPendingWrites: false }, data() { return null; } });
                return function () {};
              },
            };
          },
        };
      },
    };
  }
  firestore.FieldValue = { serverTimestamp() { return '__SERVER_TIMESTAMP__'; } };
  window.firebase = {
    apps: [],
    initializeApp(config) { this.apps.push({ config }); return this; },
    auth,
    firestore,
  };
`;

async function mockDcaQuotes(page, {
  tsla = 347.07,
  spcx = 140.535,
  asOf = new Date().toISOString(),
  timestampPrecision = 'minute',
  marketStatus = 'Open',
} = {}) {
  await page.route('https://www.gstatic.com/firebasejs/**', route => {
    const url = route.request().url();
    if (url.includes('firebase-app-compat')) {
      return route.fulfill({ contentType: 'application/javascript', body: DCA_FIREBASE_STUB });
    }
    return route.fulfill({ contentType: 'application/javascript', body: '' });
  });
  await page.route(
    'https://raw.githubusercontent.com/AlphaeusNg/alphaeusng.github.io/dca-live/data/dca_live_quotes.json**',
    route => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        schemaVersion: 1,
        generatedAt: asOf,
        marketTimezone: 'America/New_York',
        symbols: {
          TSLA: {
            price: tsla,
            asOf,
            timestampPrecision,
            marketStatus,
            isRealTime: true,
            netChange: 4.12,
            percentChange: 0.0104,
          },
          SPCX: {
            price: spcx,
            asOf,
            timestampPrecision,
            marketStatus,
            isRealTime: true,
            netChange: 0.4,
            percentChange: 0.0045,
          },
        },
      }),
    })
  );
}

async function mockAlpacaStream(page, { tsla = 410.5, spcx = 91.25 } = {}) {
  await page.addInitScript(({ tslaPrice, spcxPrice }) => {
    window.__alpacaSent = [];
    class MockAlpacaWebSocket {
      constructor(url) {
        this.url = url;
        this.readyState = 1;
        queueMicrotask(() => {
          if (this.onopen) this.onopen();
          this.emit([{ T: 'success', msg: 'connected' }]);
        });
      }

      send(payload) {
        const message = JSON.parse(payload);
        window.__alpacaSent.push(message);
        if (message.action === 'auth') {
          queueMicrotask(() => this.emit([{ T: 'success', msg: 'authenticated' }]));
        } else if (message.action === 'subscribe') {
          queueMicrotask(() => this.emit([
            { T: 'subscription', trades: message.trades },
            { T: 't', S: 'TSLA', p: tslaPrice, s: 5, t: new Date().toISOString(), x: 'V' },
            { T: 't', S: 'SPCX', p: spcxPrice, s: 3, t: new Date().toISOString(), x: 'V' },
          ]));
        }
      }

      emit(messages) {
        if (this.onmessage) this.onmessage({ data: JSON.stringify(messages) });
      }

      close(code = 1000, reason = '') {
        this.readyState = 3;
        if (this.onclose) this.onclose({ code, reason });
      }
    }
    window.WebSocket = MockAlpacaWebSocket;
  }, { tslaPrice: tsla, spcxPrice: spcx });
}

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

test('home Ko-fi chip sits with the coffee card and footer Feedback is a real link', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const card = page.locator('.support-card');
  const coffeeLink = card.locator('a[href*="ko-fi.com"]');
  const footerKofi = page.locator('footer a.alphaeus-kofi-support__fallback');
  const footerFeedback = page.locator('footer a.alphaeus-kofi-support__feedback');

  await expect(card.locator('.support-card-icon')).toHaveCount(0);
  await expect(card.locator('#kofi-support-widget')).toHaveCount(0);
  await expect(coffeeLink).toHaveText('coffee');
  await expect(coffeeLink).toHaveAttribute('href', 'https://ko-fi.com/K1V623R7BV');
  const cardPad = await card.evaluate((el) => {
    const s = getComputedStyle(el);
    return { left: parseFloat(s.paddingLeft), right: parseFloat(s.paddingRight) };
  });
  if (cardPad.left < 24 || cardPad.right < 24) {
    throw new Error(`support card padding is too tight: ${JSON.stringify(cardPad)}`);
  }

  await expect(page.locator('.alphaeus-kofi-support')).toContainText('Found this project helpful?');
  await expect(footerKofi).toBeVisible();
  await expect(footerKofi).toHaveText(/Support me on Ko-fi/);
  await expect(footerKofi.locator('img.alphaeus-kofi-support__icon')).toHaveCount(1);
  await expect(footerFeedback).toBeVisible();
  await expect(footerFeedback).toHaveText('Feedback');
  await expect(footerFeedback).toHaveAttribute(
    'href',
    /\/pages\/feedback\/\?project=Portfolio/
  );
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

test('home surfaces AIly in tabs, craft, mobile, and footer', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#project-tabs a[href="https://alphaeusng.github.io/AIly/"]')).toBeVisible();
  await expect(page.locator('#craft a[href="https://alphaeusng.github.io/AIly/"]')).toHaveText(/Open AIly/);
  await expect(page.locator('#craft a[href="https://github.com/AlphaeusNg/AIly/releases"]')).toHaveText(/Packages/);
  await expect(page.locator('footer a[href="https://alphaeusng.github.io/AIly/"]')).toHaveText('AIly');
  await expect(page.locator('footer a[href="https://alphaeusng.github.io/KoboForge/"]')).toHaveText('KoboForge');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#mobile-menu-btn').click();
  await expect(page.locator('#mobile-project-links a[href="https://alphaeusng.github.io/AIly/"]')).toHaveText('AIly');
  await expect(page.locator('#mobile-project-links a[href="https://github.com/AlphaeusNg/AIly/releases"]')).toHaveText(/Packages/);
});

test('feedback preselects AIly and keeps a GitHub draft when Firebase cannot initialize', async ({ page }) => {
  await page.route('https://www.gstatic.com/firebasejs/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );

  await page.goto('/pages/feedback/?project=AIly', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#project')).toHaveValue('AIly');
  const fallback = page.locator('#github-fallback');
  await expect(fallback).toBeVisible();
  await page.locator('#message').fill('The Setup checklist should resume chapters 3 to 5.');
  await page.locator('#submit-button').click();
  const fallbackHref = await fallback.getAttribute('href');
  const fallbackUrl = new URL(fallbackHref);
  expect(fallbackUrl.searchParams.get('title')).toBe('Feedback — AIly: Suggestion');
  expect(fallbackUrl.searchParams.get('body')).toContain(
    '**Source:** https://alphaeusng.github.io/AIly/'
  );
});

test('vault viewer indexes and opens note paths containing a literal percent sign', async ({ page }) => {
  const payload = structuredClone(VAULT_FIXTURE);
  const fixtureNote = payload.nodes.find(node => node.type === 'note');
  const previousId = fixtureNote.id;
  fixtureNote.id = '100% Truth.md';
  fixtureNote.path = fixtureNote.id;
  fixtureNote.title = '100% Truth';
  payload.links.forEach(link => {
    if (link.source === previousId) link.source = fixtureNote.id;
    if (link.target === previousId) link.target = fixtureNote.id;
  });

  await page.route('https://cdn.tailwindcss.com/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.route('https://d3js.org/d3.v7.min.js', route =>
    route.fulfill({ contentType: 'application/javascript', body: D3_RUNTIME })
  );
  await page.route('https://cdn.jsdelivr.net/npm/markdown-it/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.route('https://cdn.jsdelivr.net/npm/dompurify/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.route('https://www.gstatic.com/firebasejs/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.route('https://raw.githubusercontent.com/AlphaeusNg/Seeking-Biblical-Truth/main/**', route =>
    route.fulfill({ contentType: 'text/markdown', body: '# Local test note\n' })
  );
  await page.route('**/pages/seeking-biblical-truth/vault-data.json', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(payload) })
  );

  await page.goto('/pages/seeking-biblical-truth/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vault-summary')).toContainText('55 Markdown notes');
  await page.locator('#search').fill('100% Truth');
  await page.getByRole('button', { name: '100% Truth', exact: true }).click();

  await expect(page.locator('#note-panel h2')).toHaveText('100% Truth');
  await expect(page).toHaveURL(/#\/100%25%20Truth\.md$/);
});

test('conviction page renders ledger data and switches benchmark views', async ({ page }) => {
  await mockDcaQuotes(page);
  await page.route('https://cdn.jsdelivr.net/npm/chart.js', route =>
    route.fulfill({ contentType: 'application/javascript', body: CHART_STUB })
  );
  await page.route('https://cdn.tailwindcss.com/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );

  await page.goto('/pages/conviction.html', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.dca-lab-cta strong')).toHaveText('Conviction DCA Lab');
  await expect(page.locator('.dca-lab-cta strong')).not.toContainText('New:');
  await expect(page.locator('#dcaSnapshotMeta')).toHaveText(/Nasdaq snapshot|Recent TSLA/);
  await expect(page.locator('.dca-lab-cta')).toHaveAttribute(
    'aria-label',
    'Open Conviction DCA Lab calculator'
  );
  await expect(page.locator('.dca-lab-cta')).toHaveAttribute(
    'href',
    /dca-calculator\.html\?d=\d{4}-\d{2}-\d{2}#planner/
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.dca-lab-cta')).toBeVisible();
  const ctaBox = await page.locator('.dca-lab-cta').boundingBox();
  expect(ctaBox?.height || 0).toBeGreaterThan(64);
  await page.setViewportSize({ width: 1280, height: 720 });

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

test('DCA Lab builds a budget-capped plan and persists its local journal', async ({ page }) => {
  await mockDcaQuotes(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/pages/dca-calculator.html', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#heroTslaPrice')).toContainText('$');
  await expect(page.locator('#heroSpcxPrice')).toContainText('$');
  await expect(page.locator('#totalRecommendation')).not.toHaveText('—');
  await expect(page.locator('#tslaConfidenceBadge')).toContainText('sessions');
  await expect(page.locator('#spcxConfidenceBadge')).toContainText('limited');
  await expect(page.locator('#recommendationReasons')).toContainText('capped at 1.75×');
  await expect(page.locator('#allocationOutput')).toHaveText('TSLA 70% · SPCX 30%');
  await expect(page.locator('#budgetProgress')).toHaveAttribute('role', 'progressbar');
  await expect(page.locator('#budgetProgress')).toHaveAttribute('aria-valuetext', /monthly cap invested/);

  const tslaChart = page.locator('#tslaSparkline');
  const tslaTooltip = page.locator('#tslaChartTooltip');
  const tslaAllRange = page.locator('[data-chart-symbol="TSLA"][data-chart-range="all"]');
  await expect(tslaChart.locator('svg polyline')).toBeVisible();
  await expect(page.locator('[data-chart-symbol="TSLA"][data-chart-range="66"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(tslaChart).toHaveAttribute('role', 'slider');
  await expect(tslaChart).toHaveAttribute('aria-valuemax', /\d+/);
  await expect(tslaAllRange).toHaveText('Max');
  await tslaAllRange.click();
  await expect(tslaAllRange).toHaveAttribute('aria-pressed', 'true');
  expect(await tslaChart.evaluate(element => getComputedStyle(element).touchAction)).toBe('pan-y');
  await tslaChart.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    element.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      pointerType: 'touch',
      clientX: bounds.left + (bounds.width * 0.3),
      clientY: bounds.top + (bounds.height * 0.5),
    }));
  });
  await expect(tslaTooltip).toBeVisible();
  await tslaChart.hover({ position: { x: 140, y: 70 } });
  await expect(tslaTooltip).toBeVisible();
  await expect(tslaTooltip).toContainText('$');
  await tslaChart.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#tslaChartSummary')).toContainText('$');

  await page.locator('#planDate').fill('2026-08-18');
  await page.locator('#monthlyBudget').fill('3000');
  await page.locator('#tslaAllocation').fill('70');
  await page.locator('#tslaInvested').fill('0');
  await page.locator('#spcxInvested').fill('0');
  await expect(page.locator('#nextSessionLabel')).toContainText('Aug 18, 2026');
  await expect(page.locator('#nextSessionLabel')).toContainText('sessions left');
  await expect(page.locator('#catchUpBadge')).toBeHidden();
  await expect(page.locator('#budgetPercent')).toContainText('% of cap');
  await expect(page.locator('#paceStatus')).toContainText('daily pace');
  await expect(page.locator('#jumpToday')).toBeVisible();
  await expect(page.locator('#marketSession')).not.toHaveText('Checking…');
  await expect(page.locator('#marketClock')).toContainText(/ET|EDT|EST/);
  await expect(page.locator('#tslaSignalLabel')).not.toHaveText('');
  await expect(page.locator('[data-chart-symbol="TSLA"][data-chart-range="132"]')).toHaveText('6M');
  await page.locator('[data-alloc="50"]').click();
  await expect(page.locator('#allocationOutput')).toHaveText('TSLA 50% · SPCX 50%');
  await page.locator('[data-alloc="70"]').click();
  await expect(page.locator('#allocationOutput')).toHaveText('TSLA 70% · SPCX 30%');

  await page.locator('#planDate').fill('2026-08-31');
  await expect(page.locator('#nextSessionLabel')).toContainText('last session');
  await expect(page.locator('#catchUpBadge')).toBeVisible();
  await page.locator('#planDate').fill('2026-08-18');
  await expect(page.locator('#catchUpBadge')).toBeHidden();
  await expect(page.locator('#allocationOutput')).toHaveText('TSLA 70% · SPCX 30%');

  await page.locator('#tslaInvested').fill('2500');
  await page.locator('#spcxInvested').fill('800');
  await expect(page.locator('#calculatorStatus')).toContainText('over the $3,000.00 cap');
  await expect(page.locator('#budgetProgress')).toHaveClass(/is-over/);
  await page.locator('#tslaInvested').fill('0');
  await page.locator('#spcxInvested').fill('0');

  await page.locator('#planDate').fill('2026-08-31');
  await page.locator('#tslaInvested').fill('2500');
  await page.locator('#spcxInvested').fill('0');
  await expect(page.locator('#budgetRemaining')).toHaveText('$500.00');
  expect(Number(await page.locator('#tslaFillAmount').inputValue())).toBe(0);
  expect(Number(await page.locator('#spcxFillAmount').inputValue())).toBe(500);
  await expect(page.locator('#recommendationReasons')).toContainText('underweight holding');
  await page.locator('#planDate').fill('2026-08-18');
  await page.locator('#tslaInvested').fill('0');
  await page.locator('#spcxInvested').fill('0');

  const suggested = Number(
    (await page.locator('#totalRecommendation').textContent()).replace(/[$,]/g, '')
  );
  expect(suggested).toBeGreaterThan(0);
  expect(suggested).toBeLessThanOrEqual(3000);

  await expect(page.locator('#tslaPrice')).toBeDisabled();
  await expect(page.locator('#resetPrices')).toBeHidden();
  await page.locator('#tslaManualToggle').check();
  await expect(page.locator('#tslaPrice')).toBeEnabled();
  await expect(page.locator('#resetPrices')).toBeVisible();
  await page.locator('#resetPrices').click();
  await expect(page.locator('#tslaPrice')).toBeDisabled();
  await expect(page.locator('#resetPrices')).toBeHidden();
  await page.locator('#jumpToday').click();
  await page.locator('#tslaManualToggle').check();
  await page.locator('#tslaPrice').fill('340.25');
  await expect(page.locator('#tslaShares')).toContainText('@ $340.25');
  await tslaChart.focus();
  await page.keyboard.press('End');
  await expect(tslaTooltip).toContainText('$340.25');

  await page.locator('#tslaFillAmount').fill('20');
  await page.locator('#spcxFillAmount').fill('30');
  await expect(page.locator('#recordTotalNote')).toContainText('Recording');
  await page.locator('#recordPurchase').click();
  await expect(page.locator('#journalBody tr')).toHaveCount(2);
  await expect(page.locator('#journalSummary')).toContainText('$50.00');
  await expect(page.locator('#calculatorStatus')).toContainText('No brokerage order was placed');
  await page.locator('#undoLast').click();
  await expect(page.locator('#journalBody tr')).toHaveCount(0);
  await expect(page.locator('#calculatorStatus')).toContainText('Last recorded session was removed');
  await page.locator('#recordPurchase').click();
  await expect(page.locator('#journalBody tr')).toHaveCount(2);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#journalBody tr')).toHaveCount(2);
  await expect(page.locator('#budgetInvested')).not.toHaveText('$0.00');
  await expect(page.locator('#journalScope')).toContainText('This month');

  await page.evaluate(() => {
    const key = 'alphaeus-conviction-dca-lab-v1';
    const saved = JSON.parse(localStorage.getItem(key));
    saved.ledger.push({
      id: 'old-entry',
      date: '2024-01-02',
      symbol: 'TSLA',
      amount: 100,
      price: 250,
      shares: 0.4,
      multiplier: 1,
      priceMode: 'manual',
    });
    saved.months['2024-01'] = { TSLA: 100, SPCX: 0 };
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#journalScope').click();
  await expect(page.locator('#journalBody tr')).toHaveCount(3);
  await page.locator('#monthlyBudget').fill('3100');
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('alphaeus-conviction-dca-lab-v1'));
    return saved.ledger.some(entry => entry.id === 'old-entry');
  })).toBe(true);

  await page.goto('/pages/dca-calculator.html?d=2026-08-15&budget=4500', {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator('#planDate')).toHaveValue('2026-08-17');
  await expect(page.locator('#monthlyBudget')).toHaveValue('4500');
  await expect(page.locator('#calculatorStatus')).toContainText('next U.S. trading session');
  await page.goto('/pages/dca-calculator.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#monthlyBudget')).toHaveValue('3100');
});

test('DCA Lab replaces the snapshot with live last-sale quotes', async ({ page }) => {
  await mockDcaQuotes(page, { tsla: 401.25, spcx: 88.5 });

  await page.goto('/pages/dca-calculator.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#heroTslaPrice')).toHaveText('$401.25');
  await expect(page.locator('#heroSpcxPrice')).toHaveText('$88.50');
  await expect(page.locator('#marketFreshness')).toHaveText('Recent last sale');
  await expect(page.locator('#marketFreshness')).toHaveClass(/is-live/);
  await expect(page.locator('#marketTimestamp')).toContainText('Feed updated');
  await expect(page.locator('#tslaPriceMeta')).toContainText('Nasdaq last sale');
  await expect(page.locator('#refreshQuotes')).toHaveAttribute(
    'aria-label',
    'Refresh recent Nasdaq quotes'
  );

  await page.locator('#tslaManualToggle').check();
  await page.locator('#tslaPrice').fill('340.25');
  await expect(page.locator('#heroTslaPrice')).toHaveText('$340.25');
  await expect(page.locator('#heroTslaMove')).toHaveText('Manual');
  await expect(page.locator('#heroTslaMove')).toHaveClass(/is-manual/);
  await expect(page.locator('#tslaPriceMeta')).toHaveText("Manual override · used in today's plan");
  await expect(page.locator('#marketFreshness')).toHaveText('Recent last sale · TSLA manual');
  await expect(page.locator('#heroSpcxPrice')).toHaveText('$88.50');
  await expect(page.locator('#dataConfidence')).toHaveText('Manual price in use');

  await page.locator('#spcxManualToggle').check();
  await page.locator('#spcxPrice').fill('91.00');
  await expect(page.locator('#heroSpcxPrice')).toHaveText('$91.00');
  await expect(page.locator('#marketFreshness')).toHaveText('Manual prices');
  await expect(page.locator('#marketFreshness')).not.toHaveClass(/is-live/);
  await page.locator('#resetPrices').click();
  await expect(page.locator('#marketFreshness')).toHaveText('Recent last sale');
  await expect(page.locator('#heroTslaPrice')).toHaveText('$401.25');
  await expect(page.locator('#tslaPriceMeta')).toContainText('Nasdaq last sale');
});

test('DCA Lab labels date-only Nasdaq closes without inventing a time', async ({ page }) => {
  const dateOnly = new Date().toISOString().slice(0, 10);
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${dateOnly}T00:00:00Z`));
  await mockDcaQuotes(page, {
    asOf: dateOnly,
    timestampPrecision: 'date',
    marketStatus: 'Closed',
  });

  await page.goto('/pages/dca-calculator.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#tslaPriceMeta')).toContainText(
    `Nasdaq last sale · ${dateLabel} (date only) · Closed`
  );
  await expect(page.locator('#spcxPriceMeta')).toContainText(`${dateLabel} (date only) · Closed`);
});

test('DCA Lab streams Alpaca trades without persisting credentials', async ({ page }) => {
  await mockDcaQuotes(page);
  await mockAlpacaStream(page);
  await page.goto('/pages/dca-calculator.html', { waitUntil: 'domcontentloaded' });

  await page.locator('#enableRealtime').click();
  await expect(page.locator('#realtimeDialog')).toBeVisible();
  await page.locator('#alpacaKeyId').fill('PKTEST-KEY');
  await page.locator('#alpacaSecret').fill('test-secret-value');
  await page.locator('#alpacaFeed').selectOption('iex');
  await page.locator('#connectRealtime').click();

  await expect(page.locator('#enableRealtime')).toHaveText('Live');
  await expect(page.locator('#enableRealtime')).toHaveClass(/is-connected/);
  await expect(page.locator('#heroTslaPrice')).toHaveText('$410.50');
  await expect(page.locator('#heroSpcxPrice')).toHaveText('$91.25');
  await expect(page.locator('#marketFreshness')).toHaveText('Live · streaming');
  await expect(page.locator('#marketTimestamp')).toContainText('Last tick');
  await expect(page.locator('#tslaPriceMeta')).toContainText('Alpaca IEX trade');
  await expect(page.locator('#realtimeDialog')).toBeHidden();

  expect(await page.evaluate(() => ({
    local: Object.values(localStorage).join(' '),
    session: Object.values(sessionStorage).join(' '),
    sent: window.__alpacaSent,
  }))).toEqual({
    local: expect.not.stringContaining('test-secret-value'),
    session: expect.not.stringContaining('test-secret-value'),
    sent: [
      { action: 'auth', key: 'PKTEST-KEY', secret: 'test-secret-value' },
      { action: 'subscribe', trades: ['TSLA', 'SPCX'] },
    ],
  });

  await page.locator('#enableRealtime').click();
  await page.locator('#disconnectRealtime').click();
  await expect(page.locator('#enableRealtime')).toHaveText('Go real-time');
  await expect(page.locator('#realtimeStatus')).toContainText('disconnected');
});

test('DCA Lab keeps denied journal writes visibly session-only and recovers', async ({ page }) => {
  await mockDcaQuotes(page);
  await page.addInitScript(() => {
    window.__denyDcaStorage = true;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key, value) {
      if (this === localStorage
          && key === 'alphaeus-conviction-dca-lab-v1'
          && window.__denyDcaStorage) {
        throw new DOMException('Storage denied for test', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    };
  });
  await page.goto('/pages/dca-calculator.html', { waitUntil: 'domcontentloaded' });

  await page.locator('#recordPurchase').click();
  await expect(page.locator('#journalBody tr')).toHaveCount(2);
  await expect(page.locator('#calculatorStatus')).toContainText('No brokerage order was placed');
  await expect(page.locator('#storageNotice')).toContainText('only until this tab closes');
  expect(await page.evaluate(() => localStorage.getItem('alphaeus-conviction-dca-lab-v1'))).toBeNull();

  await page.evaluate(() => { window.__denyDcaStorage = false; });
  await page.locator('#monthlyBudget').fill('3100');
  await expect(page.locator('#storageNotice')).toBeHidden();
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('alphaeus-conviction-dca-lab-v1'));
    return saved?.ledger?.length;
  })).toBe(2);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#journalBody tr')).toHaveCount(2);
});

test('DCA Lab quarantines malformed saved state and persists its repair', async ({ page }) => {
  await mockDcaQuotes(page);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('dca-malformed-state-seeded')) return;
    sessionStorage.setItem('dca-malformed-state-seeded', '1');
    localStorage.setItem('alphaeus-conviction-dca-lab-v1', JSON.stringify({
      settings: {
        monthlyBudget: 'not-a-budget',
        tslaAllocation: 500,
        strategyId: 'invented',
        manualPrices: { TSLA: { enabled: true, value: 'not-a-price' } },
      },
      months: {
        '2026-08': { TSLA: 100, SPCX: 0 },
        '2026-99': { TSLA: 500, SPCX: 500 },
        broken: { TSLA: 500, SPCX: 500 },
      },
      ledger: [
        {
          id: 'valid-entry',
          date: '2026-08-18',
          symbol: 'TSLA',
          amount: 100,
          price: 300,
          shares: 0.333333,
          multiplier: 1,
          priceMode: 'manual',
        },
        null,
        { id: 'broken-entry', date: null, symbol: 'SPCX', amount: 'many' },
        {
          id: 'invalid-date-entry',
          date: '2026-99-99',
          symbol: 'SPCX',
          amount: 50,
          price: 100,
          shares: 0.5,
        },
        {
          id: 'x'.repeat(200),
          date: '2026-08-19',
          symbol: 'SPCX',
          amount: 50,
          price: 100,
          shares: 0.5,
        },
        {
          id: 'bounded-entry',
          batchId: 'b'.repeat(200),
          date: '2026-08-20',
          symbol: 'SPCX',
          amount: 50,
          price: 100,
          shares: 0.5,
          priceMode: 'm'.repeat(200),
        },
      ],
    }));
  });
  await page.goto('/pages/dca-calculator.html', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#totalRecommendation')).not.toHaveText('—');
  await expect(page.locator('#monthlyBudget')).toHaveValue('3000');
  await expect(page.locator('#allocationOutput')).toHaveText('TSLA 70% · SPCX 30%');
  await expect(page.locator('#tslaManualToggle')).not.toBeChecked();
  await expect(page.locator('#journalBody tr')).toHaveCount(2);
  await expect(page.locator('#storageNotice')).toContainText('invalid saved data');

  await page.locator('#monthlyBudget').fill('3100');
  await expect(page.locator('#storageNotice')).toBeHidden();
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('alphaeus-conviction-dca-lab-v1'));
    return {
      budget: saved.settings.monthlyBudget,
      ledger: saved.ledger.map((entry) => ({
        id: entry.id,
        batchId: entry.batchId || null,
        priceMode: entry.priceMode,
      })),
      monthKeys: Object.keys(saved.months),
    };
  })).toEqual({
    budget: 3100,
    ledger: [
      { id: 'valid-entry', batchId: null, priceMode: 'manual' },
      { id: 'bounded-entry', batchId: null, priceMode: 'saved' },
    ],
    monthKeys: ['2026-08'],
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#journalBody tr')).toHaveCount(2);
  await expect(page.locator('#storageNotice')).toBeHidden();
});

test('DCA Lab rejects oversized persisted state before parsing it', async ({ page }) => {
  await mockDcaQuotes(page);
  await page.addInitScript(() => {
    localStorage.setItem('alphaeus-conviction-dca-lab-v1', JSON.stringify({
      settings: { monthlyBudget: 9999 },
      padding: 'x'.repeat(2_100_000),
    }));
  });
  await page.goto('/pages/dca-calculator.html', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#monthlyBudget')).toHaveValue('3000');
  await expect(page.locator('#storageNotice')).toContainText('exceeded safe browser limits');
  await page.locator('#monthlyBudget').fill('3100');
  await expect(page.locator('#storageNotice')).toBeHidden();
  await expect.poll(() => page.evaluate(() => (
    localStorage.getItem('alphaeus-conviction-dca-lab-v1')?.length || 0
  ))).toBeLessThan(10_000);
});

test('DCA Lab bounds the rendered journal while retaining its full saved history', async ({ page }) => {
  await mockDcaQuotes(page);
  await page.addInitScript(() => {
    const ledger = Array.from({ length: 501 }, (_, index) => ({
      id: `entry-${index}`,
      date: '2026-08-18',
      symbol: index % 2 ? 'TSLA' : 'SPCX',
      amount: 1,
      price: 1,
      shares: 1,
      multiplier: 1,
      priceMode: 'saved',
    }));
    localStorage.setItem('alphaeus-conviction-dca-lab-v1', JSON.stringify({
      settings: {},
      months: { '2026-08': { TSLA: 250, SPCX: 251 } },
      ledger,
    }));
  });
  await page.goto('/pages/dca-calculator.html?d=2026-08-18', {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('#journalScope')).toContainText('This month (501)');
  await expect(page.locator('#journalBody tr')).toHaveCount(500);
  await expect(page.locator('#journalSummary')).toContainText('Showing latest 500 of 501 entries');
  expect(await page.evaluate(() => (
    JSON.parse(localStorage.getItem('alphaeus-conviction-dca-lab-v1')).ledger.length
  ))).toBe(501);
});

test('DCA Lab imports a journal batch once and can undo it together', async ({ page }) => {
  await mockDcaQuotes(page);
  await page.goto('/pages/dca-calculator.html', { waitUntil: 'domcontentloaded' });
  const csv = [
    'date,symbol,dollars_usd,price_usd,shares,signal_multiplier,price_mode',
    '2026-08-18,TSLA,200,400,0.5,1,manual',
    '2026-08-18,SPCX,100,100,1,1,manual',
    '',
  ].join('\n');
  const file = { name: 'journal.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) };

  await page.locator('#importJournal').setInputFiles(file);
  await expect(page.locator('#calculatorStatus')).toContainText('Imported 2 journal rows');
  await expect(page.locator('#journalBody tr')).toHaveCount(2);
  await expect(page.locator('#journalSummary')).toContainText('$300.00');

  await page.locator('#importJournal').setInputFiles(file);
  await expect(page.locator('#calculatorStatus')).toContainText('No new rows were imported');
  await expect(page.locator('#journalBody tr')).toHaveCount(2);

  await page.locator('#undoLast').click();
  await expect(page.locator('#journalBody tr')).toHaveCount(0);
});

test('DCA Lab rejects oversized and impossible-date CSV imports without mutation', async ({ page }) => {
  await mockDcaQuotes(page);
  await page.goto('/pages/dca-calculator.html', { waitUntil: 'domcontentloaded' });
  const header = 'date,symbol,dollars_usd,price_usd,shares\n';
  await page.locator('#importJournal').setInputFiles({
    name: 'oversized.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(header + 'x'.repeat(1_048_577)),
  });
  await expect(page.locator('#calculatorStatus')).toContainText('Import CSV files up to 1 MB');

  await page.evaluate(() => {
    const originalText = File.prototype.text;
    File.prototype.text = function boundedImportFixture() {
      if (this.name === 'decoded-oversized.csv') {
        return Promise.resolve('x'.repeat(1_000_001));
      }
      return originalText.call(this);
    };
  });
  await page.locator('#importJournal').setInputFiles({
    name: 'decoded-oversized.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(header + '2026-08-18,TSLA,100,200,0.5\n'),
  });
  await expect(page.locator('#calculatorStatus')).toContainText(
    'Import decoded CSV text up to 1,000,000 characters',
  );

  await page.locator('#importJournal').setInputFiles({
    name: 'invalid-date.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(header + '2026-02-30,TSLA,100,200,0.5\n'),
  });
  await expect(page.locator('#calculatorStatus')).toContainText('No new rows were imported');
  expect(await page.evaluate(() => {
    const raw = localStorage.getItem('alphaeus-conviction-dca-lab-v1');
    return raw ? JSON.parse(raw).ledger.length : 0;
  })).toBe(0);
  await expect(page.locator('#journalBody tr')).toHaveCount(0);
});

test('DCA Lab logs tapped top-ups and catch-up fills from a phone layout', async ({ page }) => {
  await mockDcaQuotes(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pages/dca-calculator.html?d=2026-08-18', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#logQuickChips [data-topup="20"]')).toHaveText('$20');
  await expect(page.locator('#logQuickChips [data-topup="30"]')).toHaveText('$30');
  await expect(page.locator('#mobileQuickChips [data-topup="20"]')).toBeVisible();
  await expect(page.locator('#cloudSignIn')).toBeVisible();

  await page.locator('#logQuickChips [data-topup="20"]').click();
  await expect(page.locator('#journalBody tr')).toHaveCount(1);
  await expect(page.locator('#calculatorStatus')).toContainText('$20.00 TSLA');
  await expect(page.locator('#tslaInvested')).toHaveValue('20');

  await page.locator('.catchup-row[data-date="2026-08-17"] [data-symbol="SPCX"][data-topup="30"]').click();
  await expect(page.locator('#journalBody tr')).toHaveCount(2);
  await expect(page.locator('#spcxInvested')).toHaveValue('30');
  await expect(page.locator('#calculatorStatus')).toContainText('Aug 17');

  await page.locator('#editQuickAmounts summary').click();
  await page.locator('#quickAmountInput').fill('50');
  await page.locator('#addQuickAmount').click();
  await expect(page.locator('#logQuickChips [data-topup="50"]')).toBeVisible();
  await page.locator('#logAmount').fill('15');
  await page.locator('#logFillSubmit').click();
  await expect(page.locator('#journalBody tr')).toHaveCount(3);
  await expect(page.locator('#tslaInvested')).toHaveValue('35');
});

test('feedback sanitizes its source and handles submission lifecycle', async ({ page }) => {
  await page.route('https://www.gstatic.com/firebasejs/**/firebase-app-compat.js', route =>
    route.fulfill({ contentType: 'application/javascript', body: FIREBASE_APP_STUB })
  );
  await page.route('https://www.gstatic.com/firebasejs/**/firebase-firestore-compat.js', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );

  const unsafeSource = encodeURIComponent(
    'https://alphaeusng.github.io:444/untrusted?token=private#fragment'
  );
  await page.goto(
    `/pages/feedback/?project=VerseKeep&from=${unsafeSource}`,
    { waitUntil: 'domcontentloaded' }
  );

  await expect(page.locator('#project')).toHaveValue('VerseKeep');
  await expect(page.locator('#feedback-title')).toHaveText('Share feedback about VerseKeep');
  await expect(page.locator('#source-link')).toHaveAttribute(
    'href',
    'https://alphaeusng.github.io/VerseKeep/'
  );
  await expect(page.locator('#back-link')).toHaveAttribute(
    'href',
    'https://alphaeusng.github.io/VerseKeep/'
  );

  const submit = page.locator('#submit-button');
  const message = page.locator('#message');
  const status = page.getByRole('status');
  await message.fill('Too short');
  await submit.click();
  await expect(status).toHaveText('Please complete the highlighted field.');
  expect(await page.evaluate(() => window.__feedbackWrites.length)).toBe(0);

  await page.locator('#feedback-type').selectOption('Bug');
  await page.locator('#rating-5').check();
  await page.locator('#contact').fill('reader@example.com');
  await message.fill('The navigation needs a clearer return path.');
  await submit.click();

  await expect(status).toHaveText(
    'Thank you — your feedback has been sent. Reference AB12C3.'
  );
  await expect(submit).toBeEnabled();
  await expect(message).toHaveValue('');
  expect(await page.evaluate(() => window.__feedbackWrites)).toEqual([
    {
      collection: 'feedback',
      payload: {
        schema: 1,
        project: 'VerseKeep',
        type: 'Bug',
        rating: 5,
        message: 'The navigation needs a clearer return path.',
        contact: 'reader@example.com',
        sourceUrl: 'https://alphaeusng.github.io/VerseKeep/',
        submittedAt: '__SERVER_TIMESTAMP__',
      },
    },
  ]);

  await message.fill('A second immediate submission should be throttled.');
  await submit.click();
  await expect(status).toHaveText(/Please wait (?:29|30) seconds before sending again\./);
  expect(await page.evaluate(() => window.__feedbackWrites.length)).toBe(1);

  await page.evaluate(() => {
    localStorage.removeItem('alphaeus-feedback-last-submit-v1');
    window.__feedbackReject = true;
  });
  await page.locator('#contact').fill('private@example.com');
  await message.fill('Use the public issue fallback without my private email.');
  await submit.click();

  await expect(status).toHaveText(
    'The private inbox is unavailable. You can use the prefilled GitHub draft below; your email is not included.'
  );
  const fallback = page.locator('#github-fallback');
  await expect(fallback).toBeVisible();
  const fallbackHref = await fallback.getAttribute('href');
  const fallbackUrl = new URL(fallbackHref);
  expect(fallbackUrl.origin + fallbackUrl.pathname).toBe(
    'https://github.com/AlphaeusNg/alphaeusng.github.io/issues/new'
  );
  expect(fallbackUrl.searchParams.get('title')).toBe('Feedback — VerseKeep: Suggestion');
  expect(fallbackUrl.searchParams.get('body')).toContain(
    'Use the public issue fallback without my private email.'
  );
  expect(fallbackUrl.searchParams.get('body')).toContain(
    '**Source:** https://alphaeusng.github.io/VerseKeep/'
  );
  expect(fallbackUrl.searchParams.get('body')).not.toContain('private@example.com');

  const safeSource = encodeURIComponent(
    'https://alphaeusng.github.io/VerseKeep/guide?mode=private#section'
  );
  await page.goto(
    `/pages/feedback/?project=VerseKeep&from=${safeSource}`,
    { waitUntil: 'domcontentloaded' }
  );
  await expect(page.locator('#source-link')).toHaveAttribute(
    'href',
    'https://alphaeusng.github.io/VerseKeep/guide'
  );
  await expect(page.locator('#back-link')).toHaveAttribute(
    'href',
    'https://alphaeusng.github.io/VerseKeep/guide'
  );
});

test('feedback offers a GitHub draft when Firebase cannot initialize', async ({ page }) => {
  await page.route('https://www.gstatic.com/firebasejs/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );

  await page.goto('/pages/feedback/?project=CardFitSG', { waitUntil: 'domcontentloaded' });

  const submit = page.locator('#submit-button');
  const fallback = page.locator('#github-fallback');
  const status = page.getByRole('status');

  await expect(submit).toBeEnabled();
  await expect(status).toHaveText(
    'The private inbox could not load. You can still use the prefilled GitHub draft below after writing your feedback; your email is not included.'
  );
  await expect(fallback).toBeVisible();
  expect(await page.evaluate(() => window.firebase)).toBeUndefined();

  await page.locator('#contact').fill('secret@example.com');
  await page.locator('#message').fill(
    'The cashback fit needs a clearer fallback when cloud tools fail.'
  );
  await submit.click();

  await expect(status).toHaveText(
    'The private inbox is unavailable. You can use the prefilled GitHub draft below; your email is not included.'
  );
  const fallbackHref = await fallback.getAttribute('href');
  const fallbackUrl = new URL(fallbackHref);
  expect(fallbackUrl.origin + fallbackUrl.pathname).toBe(
    'https://github.com/AlphaeusNg/alphaeusng.github.io/issues/new'
  );
  expect(fallbackUrl.searchParams.get('title')).toBe('Feedback — CardFitSG: Suggestion');
  expect(fallbackUrl.searchParams.get('body')).toContain(
    'The cashback fit needs a clearer fallback when cloud tools fail.'
  );
  expect(fallbackUrl.searchParams.get('body')).toContain(
    '**Source:** https://alphaeusng.github.io/CardFitSG/'
  );
  expect(fallbackUrl.searchParams.get('body')).not.toContain('secret@example.com');
});
