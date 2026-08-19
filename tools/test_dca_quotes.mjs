import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const quotes = require('../js/dca-quotes.js');

function livePayload() {
  return {
    schemaVersion: 1,
    generatedAt: '2026-08-19T16:20:30+00:00',
    marketTimezone: 'America/New_York',
    symbols: {
      TSLA: {
        price: 348.92,
        asOf: '2026-08-19T12:20:00-04:00',
        marketStatus: 'Open',
        isRealTime: true,
        netChange: 1.2,
        percentChange: 0.0035,
      },
      SPCX: {
        price: 88.5,
        asOf: '2026-08-19T12:20:00-04:00',
        marketStatus: 'Open',
        isRealTime: true,
        netChange: -0.4,
        percentChange: -0.0045,
      },
    },
  };
}

test('Nasdaq live quote files retain usable prices and source time', () => {
  const parsed = quotes.parseLiveQuotesPayload(livePayload());
  assert.equal(parsed.quotes.TSLA.price, 348.92);
  assert.equal(parsed.quotes.TSLA.source, 'Nasdaq');
  assert.equal(parsed.quotes.SPCX.price, 88.5);
  assert.equal(parsed.generatedAt, '2026-08-19T16:20:30+00:00');
});

test('live loader reads only the CORS-open GitHub quote feed', async () => {
  const requested = [];
  const live = await quotes.loadLiveQuotes({
    githubUrl: 'https://example.test/live.json',
    async fetchImpl(url) {
      requested.push(String(url));
      return { ok: true, json: async () => livePayload() };
    },
  });
  assert.ok(live);
  assert.equal(requested.length, 1);
  assert.match(requested[0], /^https:\/\/example\.test\/live\.json\?t=\d+$/);
  assert.equal(live.quotes.TSLA.price, 348.92);
  assert.equal(live.feed, 'nasdaq-live');
  assert.equal(live.generatedAt, '2026-08-19T16:20:30+00:00');
});

test('live loader returns null without disturbing the daily snapshot', async () => {
  const logged = [];
  const live = await quotes.loadLiveQuotes({
    githubUrl: 'https://example.test/missing.json',
    logger: error => logged.push(error.message),
    fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }),
  });
  assert.equal(live, null);
  assert.equal(logged.length, 1);
});
