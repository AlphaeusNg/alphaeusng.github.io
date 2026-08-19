import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const engine = require('../js/dca-engine.js');

function history(direction, sessions = 220) {
  const rows = [];
  const start = new Date(Date.UTC(2025, 0, 2));
  let price = 100;
  let cursor = new Date(start);
  while (rows.length < sessions) {
    const iso = cursor.toISOString().slice(0, 10);
    if (engine.isTradingDay(iso)) {
      price *= direction === 'down' ? 0.994 : 1.004;
      rows.push({ date: iso, close: Number(price.toFixed(4)) });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return rows;
}

test('remaining sessions exclude weekends and U.S. exchange holidays', () => {
  assert.equal(engine.isTradingDay('2026-09-07'), false); // Labor Day
  assert.equal(engine.isTradingDay('2026-09-08'), true);
  assert.deepEqual(
    engine.tradingSessionsRemaining('2026-08-28'),
    ['2026-08-28', '2026-08-31']
  );
});

test('next trading day snaps weekends and holidays and can skip the current session', () => {
  assert.equal(engine.nextTradingDay('2026-08-15'), '2026-08-17');
  assert.equal(engine.nextTradingDay('2026-09-07'), '2026-09-08');
  assert.equal(engine.nextTradingDay('2026-08-18'), '2026-08-18');
  assert.equal(engine.nextTradingDay('2026-08-18', { inclusive: false }), '2026-08-19');
});

test('portfolio pacing preserves the hard cap when prior contributions drift from targets', () => {
  const normal = engine.allocateRemainingBudget(3000, { TSLA: 0.7, SPCX: 0.3 }, { TSLA: 700, SPCX: 300 });
  assert.deepEqual(normal.effectiveRemaining, { TSLA: 1400, SPCX: 600 });
  assert.equal(normal.allocationAdjusted, false);

  const drifted = engine.allocateRemainingBudget(3000, { TSLA: 0.7, SPCX: 0.3 }, { TSLA: 2500, SPCX: 0 });
  assert.equal(drifted.portfolioRemaining, 500);
  assert.deepEqual(drifted.effectiveRemaining, { TSLA: 0, SPCX: 500 });
  assert.equal(drifted.allocationAdjusted, true);
  assert.equal(Object.values(drifted.effectiveRemaining).reduce((total, value) => total + value, 0), 500);

  const overCap = engine.allocateRemainingBudget(3000, { TSLA: 0.7, SPCX: 0.3 }, { TSLA: 2500, SPCX: 800 });
  assert.equal(overCap.portfolioRemaining, 0);
  assert.deepEqual(overCap.effectiveRemaining, { TSLA: 0, SPCX: 0 });
});

test('weak trends receive more weight while strong trends retain a floor buy', () => {
  const strategy = engine.STRATEGIES.balanced;
  const weak = engine.calculateSignal(engine.calculateIndicators(history('down')), strategy);
  const strong = engine.calculateSignal(engine.calculateIndicators(history('up')), strategy);
  assert.ok(weak.multiplier > 1, `expected weak multiplier > 1, got ${weak.multiplier}`);
  assert.ok(strong.multiplier < 1, `expected strong multiplier < 1, got ${strong.multiplier}`);
  assert.ok(strong.multiplier >= strategy.floorMultiplier);
  assert.ok(weak.multiplier <= strategy.maxMultiplier);
});

test('short public history pulls signals toward neutral and caps them', () => {
  const shortHistory = history('down', 45);
  const signal = engine.calculateSignal(
    engine.calculateIndicators(shortHistory),
    engine.STRATEGIES.aggressive
  );
  assert.equal(signal.historyCapApplied, true);
  assert.ok(signal.multiplier <= 1.75);
});

test('recommendations obey the monthly budget and final-session catch-up', () => {
  const normal = engine.recommendAsset({
    monthlyBudget: 3000,
    invested: 2500,
    daysRemaining: 4,
    price: 100,
    signalMultiplier: 3,
    floorMultiplier: 0.7,
    maxMultiplier: 2.25,
    fractional: true,
  });
  assert.ok(normal.amount <= 500);
  assert.equal(normal.remaining, 500);

  const final = engine.recommendAsset({
    monthlyBudget: 3000,
    invested: 2500,
    daysRemaining: 1,
    price: 100,
    signalMultiplier: 0.7,
    floorMultiplier: 0.7,
    maxMultiplier: 2.25,
    fractional: true,
  });
  assert.equal(final.amount, 500);
  assert.equal(final.appliedMultiplier, 1);
});

test('whole-share mode reports cash that could not be deployed today', () => {
  const result = engine.recommendAsset({
    monthlyBudget: 100,
    invested: 0,
    daysRemaining: 1,
    price: 70,
    signalMultiplier: 1,
    floorMultiplier: 1,
    maxMultiplier: 1,
    fractional: false,
  });
  assert.equal(result.shares, 1);
  assert.equal(result.amount, 70);
  assert.equal(result.unallocatedToday, 30);
});

test('pace versus even DCA counts elapsed month sessions', () => {
  const start = engine.paceVsEven({
    monthlyBudget: 3100,
    invested: 0,
    planDate: '2026-08-03',
  });
  assert.equal(start.elapsed, 0);
  assert.equal(start.evenInvested, 0);
  assert.ok(start.monthSessions >= 20);
  assert.equal(start.elapsed + start.remaining, start.monthSessions);

  const mid = engine.paceVsEven({
    monthlyBudget: 3100,
    invested: 1550,
    planDate: '2026-08-17',
  });
  assert.equal(mid.elapsed + mid.remaining, mid.monthSessions);
  assert.ok(mid.elapsed > 0);
  assert.ok(mid.evenInvested > 0);
  assert.equal(engine.tradingSessionsInMonth('2026-08-17').length, mid.monthSessions);
});

test('historical replay deploys equal budgets for a fair comparison', () => {
  const replay = engine.replayCompletedMonth(history('down'), 1200, engine.STRATEGIES.balanced);
  assert.ok(replay);
  assert.equal(replay.adaptive.spent, 1200);
  assert.equal(replay.flat.spent, 1200);
});
