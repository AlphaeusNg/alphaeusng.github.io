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
  assert.equal(journal.journalWriteOutcome(local, remote, merged), 'merged');
  assert.equal(
    journal.journalMergeMessage('merged'),
    'Combined this tab with journal changes from another tab.'
  );
});

test('two open tabs keep both new fills instead of last-write-wins', () => {
  const base = {
    updatedAt: 10,
    settings: { monthlyBudget: 3000, quickAmounts: [20, 30] },
    months: { '2026-09': { TSLA: 0, SPCX: 0 } },
    ledger: [],
    deletedIds: []
  };
  const tabA = {
    ...base,
    updatedAt: 20,
    months: { '2026-09': { TSLA: 20, SPCX: 0 } },
    ledger: [{ id: 'fill-a', date: '2026-09-10', symbol: 'TSLA', amount: 20 }]
  };
  const tabB = {
    ...base,
    updatedAt: 30,
    months: { '2026-09': { TSLA: 0, SPCX: 30 } },
    ledger: [{ id: 'fill-b', date: '2026-09-11', symbol: 'SPCX', amount: 30 }]
  };
  const merged = journal.mergeJournalState(
    { ...tabB, updatedAt: Number.MAX_SAFE_INTEGER },
    tabA
  );
  assert.deepEqual(merged.ledger.map((entry) => entry.id).sort(), ['fill-a', 'fill-b']);
  assert.equal(journal.journalWriteOutcome(tabB, tabA, merged), 'merged');
  assert.equal(merged.settings.monthlyBudget, 3000);
});

test('a local import keeps a fill saved by another open tab', () => {
  const otherTab = {
    updatedAt: 40,
    settings: { monthlyBudget: 3000 },
    months: { '2026-09': { TSLA: 25, SPCX: 0 } },
    ledger: [{ id: 'live', date: '2026-09-12', symbol: 'TSLA', amount: 25 }],
    deletedIds: []
  };
  const importingTab = {
    updatedAt: 15,
    settings: { monthlyBudget: 3000 },
    months: { '2026-08': { TSLA: 0, SPCX: 30 } },
    ledger: [{ id: 'imported', date: '2026-08-18', symbol: 'SPCX', amount: 30 }],
    deletedIds: []
  };
  const merged = journal.mergeJournalState(
    { ...importingTab, updatedAt: Number.MAX_SAFE_INTEGER },
    otherTab
  );
  assert.deepEqual(merged.ledger.map((entry) => entry.id).sort(), ['imported', 'live']);
  assert.equal(journal.journalWriteOutcome(importingTab, otherTab, merged), 'merged');
});

test('cloud reconnect keeps a local fill and a remote fill', () => {
  const local = {
    updatedAt: 50,
    settings: { monthlyBudget: 2800, quickAmounts: [20] },
    months: { '2026-09': { TSLA: 20, SPCX: 0 } },
    ledger: [{ id: 'phone', date: '2026-09-15', symbol: 'TSLA', amount: 20 }],
    deletedIds: []
  };
  const remote = {
    updatedAt: 45,
    settings: { monthlyBudget: 3000, quickAmounts: [20, 30] },
    months: { '2026-09': { TSLA: 0, SPCX: 30 } },
    ledger: [{ id: 'laptop', date: '2026-09-14', symbol: 'SPCX', amount: 30 }],
    deletedIds: []
  };
  const merged = journal.mergeJournalState(local, remote);
  assert.deepEqual(merged.ledger.map((entry) => entry.id).sort(), ['laptop', 'phone']);
  assert.equal(merged.settings.monthlyBudget, 2800);
  assert.equal(journal.journalWriteOutcome(local, remote, merged), 'merged');
});

test('a tombstone removes a fill without resurrecting it from the other copy', () => {
  const local = {
    updatedAt: 10,
    settings: { monthlyBudget: 3000 },
    months: { '2026-09': { TSLA: 20, SPCX: 0 } },
    ledger: [{ id: 'fill-a', date: '2026-09-10', symbol: 'TSLA', amount: 20 }],
    deletedIds: []
  };
  const remote = {
    updatedAt: 12,
    settings: { monthlyBudget: 3000 },
    months: { '2026-09': { TSLA: 0, SPCX: 0 } },
    ledger: [],
    deletedIds: ['fill-a']
  };
  const merged = journal.mergeJournalState(local, remote);
  assert.deepEqual(merged.ledger, []);
  assert.deepEqual(merged.deletedIds, ['fill-a']);
  assert.equal(journal.journalWriteOutcome(local, remote, merged), 'adopted');
  assert.equal(journal.journalMergeMessage('adopted'), 'Updated from another tab.');
});

test('the same fill id keeps the newer copy and reports a conflict', () => {
  const local = {
    updatedAt: 10,
    settings: { monthlyBudget: 3000 },
    months: {},
    ledger: [{ id: 'fill-a', date: '2026-09-10', symbol: 'TSLA', amount: 20, price: 1, shares: 1 }],
    deletedIds: []
  };
  const remote = {
    updatedAt: 20,
    settings: { monthlyBudget: 3000 },
    months: {},
    ledger: [{ id: 'fill-a', date: '2026-09-10', symbol: 'TSLA', amount: 30, price: 1, shares: 1 }],
    deletedIds: []
  };
  const merged = journal.mergeJournalState(local, remote);
  assert.equal(merged.ledger[0].amount, 30);
  assert.equal(journal.journalWriteOutcome(local, remote, merged), 'conflict');
  assert.match(journal.journalMergeMessage('conflict'), /newer copy/i);
});

test('an older deletion adjusts a newer copy\'s totals without losing manually entered contributions', () => {
  const local = {
    updatedAt: 20,
    months: { '2026-09': { TSLA: 120, SPCX: 0 } },
    ledger: [{ id: 'deleted-fill', date: '2026-09-10', symbol: 'TSLA', amount: 20 }],
  };
  const remote = { updatedAt: 10, ledger: [], deletedIds: ['deleted-fill'] };
  const merged = journal.mergeJournalState(local, remote);
  assert.deepEqual(merged.ledger, []);
  assert.equal(merged.months['2026-09'].TSLA, 100);
  assert.equal(journal.mergeJournalState(merged, remote).months['2026-09'].TSLA, 100);
});
