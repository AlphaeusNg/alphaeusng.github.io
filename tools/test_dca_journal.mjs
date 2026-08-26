import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const journal = require('../js/dca-journal.js');

test('quick chips keep unique eToro-style amounts and reject junk', () => {
  assert.deepEqual(journal.normalizeQuickAmounts(undefined), [20, 30]);
  assert.deepEqual(journal.normalizeQuickAmounts([30, 20, 20, 0, -5, 50, 50]), [20, 30, 50]);
  assert.equal(journal.normalizeQuickAmounts([1, 2, 3, 4, 5, 6, 7]).length, journal.MAX_QUICK_AMOUNTS);
});

test('catch-up rows flag missed sessions newest first', () => {
  const rows = journal.catchUpRows({
    sessions: ['2026-08-17', '2026-08-18', '2026-08-19'],
    throughDate: '2026-08-18',
    ledger: [{ date: '2026-08-18', symbol: 'TSLA', amount: 20 }]
  });
  assert.deepEqual(rows.map((row) => row.date), ['2026-08-18', '2026-08-17']);
  assert.equal(rows[0].missed, false);
  assert.equal(rows[0].fills.TSLA, 20);
  assert.equal(rows[1].missed, true);
});

test('addFill records dollars against the month total', () => {
  const state = { ledger: [], months: {} };
  const entry = journal.addFill(state, {
    id: 'fill-1',
    date: '2026-08-17',
    symbol: 'SPCX',
    amount: 30,
    price: 100,
    shares: 0.3
  });
  assert.equal(entry.amount, 30);
  assert.equal(state.months['2026-08'].SPCX, 30);
  assert.equal(journal.addFill(state, { id: 'bad', date: 'nope', symbol: 'TSLA', amount: 20 }), null);
});

test('cloud merge unions ledger ids and does not drop fills', () => {
  const local = {
    updatedAt: 20,
    settings: { monthlyBudget: 3000, quickAmounts: [20, 30] },
    months: { '2026-08': { TSLA: 20, SPCX: 0 } },
    ledger: [{ id: 'a', date: '2026-08-18', symbol: 'TSLA', amount: 20 }]
  };
  const remote = {
    updatedAt: 10,
    settings: { monthlyBudget: 2500, quickAmounts: [25] },
    months: { '2026-08': { TSLA: 0, SPCX: 30 } },
    ledger: [{ id: 'b', date: '2026-08-17', symbol: 'SPCX', amount: 30 }]
  };
  const merged = journal.mergeJournalState(local, remote);
  assert.equal(merged.settings.monthlyBudget, 3000);
  assert.deepEqual(merged.settings.quickAmounts, [20, 30]);
  assert.equal(merged.ledger.length, 2);
  assert.equal(merged.months['2026-08'].TSLA, 20);
  assert.equal(merged.months['2026-08'].SPCX, 30);
});
