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

test('Alpaca trade messages become normalized real-time ticks', () => {
  const messages = quotes.parseAlpacaStreamMessage(JSON.stringify([
    {
      T: 't',
      S: 'TSLA',
      p: 351.42,
      s: 25,
      t: '2026-08-19T16:25:10.123456789Z',
      x: 'V',
    },
    { T: 't', S: 'OTHER', p: 10, t: '2026-08-19T16:25:10Z' },
  ]));
  assert.deepEqual(messages, [{
    type: 'trade',
    symbol: 'TSLA',
    price: 351.42,
    asOf: '2026-08-19T16:25:10.123Z',
    size: 25,
    exchange: 'V',
  }]);
});

test('Alpaca stream authenticates, subscribes, and emits trades', () => {
  const sockets = [];
  class FakeWebSocket {
    static OPEN = 1;

    constructor(url) {
      this.url = url;
      this.readyState = FakeWebSocket.OPEN;
      this.sent = [];
      sockets.push(this);
    }

    send(payload) {
      this.sent.push(JSON.parse(payload));
    }

    close() {
      this.readyState = 3;
    }

    emit(payload) {
      this.onmessage({ data: JSON.stringify(payload) });
    }
  }

  const states = [];
  const trades = [];
  const stream = quotes.createAlpacaStream({
    keyId: 'key-id',
    secret: 'secret-value',
    feed: 'iex',
    WebSocketImpl: FakeWebSocket,
    onStatus: status => states.push(status.state),
    onTrade: trade => trades.push(trade),
  });

  assert.equal(sockets[0].url, 'wss://stream.data.alpaca.markets/v2/iex');
  sockets[0].onopen();
  sockets[0].emit([{ T: 'success', msg: 'connected' }]);
  sockets[0].emit([{ T: 'success', msg: 'authenticated' }]);
  sockets[0].emit([{ T: 'subscription', trades: ['TSLA', 'SPCX'] }]);
  sockets[0].emit([{
    T: 't', S: 'SPCX', p: 141.25, s: 2, t: '2026-08-19T16:26:00Z', x: 'V',
  }]);

  assert.deepEqual(sockets[0].sent, [
    { action: 'auth', key: 'key-id', secret: 'secret-value' },
    { action: 'subscribe', trades: ['TSLA', 'SPCX'] },
  ]);
  assert.deepEqual(trades, [{
    type: 'trade', symbol: 'SPCX', price: 141.25,
    asOf: '2026-08-19T16:26:00.000Z', size: 2, exchange: 'V', feed: 'iex',
  }]);
  assert.ok(states.includes('streaming'));
  stream.close();
  assert.equal(states.at(-1), 'closed');
});
