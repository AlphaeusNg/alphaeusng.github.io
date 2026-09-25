/**
 * Conviction DCA Lab — journal helpers (no DOM, no I/O).
 *
 * Owns chip amounts, catch-up rows, fill mutation, and local↔cloud merge so
 * the calculator page stays a thin UI layer. Dollar tracking is the source of
 * truth; share counts are derived from the price snapshot available at log time.
 */
(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.DcaJournal = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const DEFAULT_QUICK_AMOUNTS = Object.freeze([20, 30]);
    const MAX_QUICK_AMOUNTS = 6;
    const MIN_QUICK_AMOUNT = 1;
    const MAX_QUICK_AMOUNT = 10_000;
    const MAX_LEDGER_ID_CHARS = 128;
    const MAX_DELETED_IDS = 10_000;
    const SYMBOLS = Object.freeze(['TSLA', 'SPCX']);
    const JOURNAL_MERGE_MESSAGES = Object.freeze({
        unchanged: '',
        adopted: 'Updated from another tab.',
        merged: 'Combined this tab with journal changes from another tab.',
        conflict: 'Kept the newer copy of a fill that differed across tabs and combined the other changes.'
    });

    function roundMoney(value) {
        return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
    }

    /**
     * Keep at most six unique dollar chips in $1–$10,000. Empty or invalid
     * input falls back to the eToro-style $20 / $30 defaults.
     */
    function normalizeQuickAmounts(raw) {
        const seen = new Set();
        const amounts = [];
        const source = Array.isArray(raw) && raw.length ? raw : DEFAULT_QUICK_AMOUNTS;
        source.forEach((value) => {
            const amount = roundMoney(value);
            if (!Number.isFinite(amount) || amount < MIN_QUICK_AMOUNT || amount > MAX_QUICK_AMOUNT) {
                return;
            }
            const key = amount.toFixed(2);
            if (seen.has(key) || amounts.length >= MAX_QUICK_AMOUNTS) return;
            seen.add(key);
            amounts.push(amount);
        });
        amounts.sort((left, right) => left - right);
        return amounts.length ? amounts : DEFAULT_QUICK_AMOUNTS.slice();
    }

    /**
     * Newest-first session cards for the catch-up list.
     * `sessions` should already be U.S. trading days for the visible month.
     */
    function catchUpRows(options = {}) {
        const symbols = Array.isArray(options.symbols) && options.symbols.length
            ? options.symbols
            : SYMBOLS;
        const throughDate = String(options.throughDate || '');
        const ledger = Array.isArray(options.ledger) ? options.ledger : [];
        const sessions = (Array.isArray(options.sessions) ? options.sessions : [])
            .filter((date) => typeof date === 'string' && (!throughDate || date <= throughDate));
        return sessions.slice().reverse().map((date) => {
            const fills = {};
            symbols.forEach((symbol) => {
                fills[symbol] = roundMoney(ledger.reduce((total, entry) => (
                    entry && entry.date === date && entry.symbol === symbol
                        ? total + Number(entry.amount || 0)
                        : total
                ), 0));
            });
            const recorded = roundMoney(symbols.reduce((total, symbol) => total + Number(fills[symbol] || 0), 0));
            return {
                date,
                fills,
                recorded,
                missed: recorded <= 0
            };
        });
    }

    function emptyMonth() {
        return { TSLA: 0, SPCX: 0 };
    }

    /**
     * Sum ledger dollars per calendar month. Used when merging devices so typed
     * month-to-date totals never drop below recorded fills.
     */
    function monthsFromLedger(ledger) {
        const months = {};
        (Array.isArray(ledger) ? ledger : []).forEach((entry) => {
            if (!entry || typeof entry.date !== 'string' || entry.date.length < 7) return;
            const month = entry.date.slice(0, 7);
            const symbol = entry.symbol;
            if (!SYMBOLS.includes(symbol)) return;
            const amount = Number(entry.amount);
            if (!Number.isFinite(amount) || amount <= 0) return;
            months[month] = months[month] || emptyMonth();
            months[month][symbol] = roundMoney(Number(months[month][symbol] || 0) + amount);
        });
        return months;
    }

    /**
     * Append one fill and add its dollars to that month's running total.
     * Returns the stored entry, or null when the fill is not recordable.
     */
    function addFill(state, fill = {}) {
        if (!state || typeof state !== 'object') return null;
        const date = typeof fill.date === 'string' ? fill.date : '';
        const symbol = typeof fill.symbol === 'string' ? fill.symbol : '';
        const amount = roundMoney(fill.amount);
        const id = typeof fill.id === 'string' ? fill.id.trim() : '';
        if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !SYMBOLS.includes(symbol) || !(amount > 0)) {
            return null;
        }
        const price = Math.max(0, Number(fill.price) || 0);
        const parsedShares = Number(fill.shares);
        const shares = Number.isFinite(parsedShares) && parsedShares >= 0
            ? parsedShares
            : (price > 0 ? amount / price : 0);
        const multiplier = Number(fill.multiplier);
        const batchId = typeof fill.batchId === 'string' ? fill.batchId.trim() : '';
        const priceMode = typeof fill.priceMode === 'string' && fill.priceMode.trim()
            ? fill.priceMode.trim()
            : 'manual';
        const entry = {
            id,
            date,
            symbol,
            amount,
            price,
            shares,
            multiplier: Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1,
            priceMode
        };
        if (batchId) entry.batchId = batchId;
        if (!Array.isArray(state.ledger)) state.ledger = [];
        if (!state.months || typeof state.months !== 'object') state.months = {};
        state.ledger.push(entry);
        const month = date.slice(0, 7);
        state.months[month] = state.months[month] || emptyMonth();
        state.months[month][symbol] = roundMoney(Number(state.months[month][symbol] || 0) + amount);
        return entry;
    }

    function isRecord(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeDeletedIds(raw) {
        if (!Array.isArray(raw)) return [];
        const seen = new Set();
        const ids = [];
        raw.forEach((value) => {
            if (typeof value !== 'string') return;
            const id = value.trim();
            if (!id || id.length > MAX_LEDGER_ID_CHARS || seen.has(id)) return;
            seen.add(id);
            ids.push(id);
        });
        return ids.slice(-MAX_DELETED_IDS);
    }

    function mergeMonths(newerMonths, ledgerMonths) {
        const months = {};
        const keys = new Set([
            ...Object.keys(isRecord(newerMonths) ? newerMonths : {}),
            ...Object.keys(ledgerMonths)
        ]);
        keys.forEach((month) => {
            const typed = isRecord(newerMonths) && isRecord(newerMonths[month]) ? newerMonths[month] : emptyMonth();
            const fromLedger = ledgerMonths[month] || emptyMonth();
            months[month] = {
                TSLA: Math.max(Number(typed.TSLA) || 0, Number(fromLedger.TSLA) || 0),
                SPCX: Math.max(Number(typed.SPCX) || 0, Number(fromLedger.SPCX) || 0)
            };
        });
        return months;
    }

    function ledgerById(ledger) {
        const byId = new Map();
        (Array.isArray(ledger) ? ledger : []).forEach((entry) => {
            if (entry && typeof entry.id === 'string' && entry.id) byId.set(entry.id, entry);
        });
        return byId;
    }

    function fillSignature(entry) {
        if (!entry) return '';
        return [
            entry.date,
            entry.symbol,
            entry.amount,
            entry.price,
            entry.shares,
            entry.multiplier,
            entry.priceMode,
            entry.batchId || ''
        ].join('|');
    }

    /**
     * Union ledger rows by id (newer copy wins on conflict) and keep the newer
     * settings blob. Month totals take the higher of typed values vs ledger sums
     * so a fill recorded on another device cannot vanish. Ids listed in either
     * deletedIds stay removed, so one tab's delete is not resurrected.
     */
    function mergeJournalState(local, remote) {
        const left = isRecord(local) ? local : {};
        const right = isRecord(remote) ? remote : {};
        if (!Array.isArray(right.ledger) && !isRecord(right.settings) && !Array.isArray(right.deletedIds)) {
            return {
                ...left,
                deletedIds: normalizeDeletedIds(left.deletedIds)
            };
        }
        const leftUpdated = Number(left.updatedAt) || 0;
        const rightUpdated = Number(right.updatedAt) || 0;
        const older = leftUpdated >= rightUpdated ? right : left;
        const newer = leftUpdated >= rightUpdated ? left : right;
        const deletedIds = normalizeDeletedIds([
            ...normalizeDeletedIds(older.deletedIds),
            ...normalizeDeletedIds(newer.deletedIds)
        ]);
        const deleted = new Set(deletedIds);
        const byId = ledgerById(older.ledger);
        ledgerById(newer.ledger).forEach((entry, id) => byId.set(id, entry));
        const ledger = [...byId.values()].filter((entry) => !deleted.has(entry.id));
        // A newer settings save may still contain a fill deleted by the other
        // copy. Remove its contribution from that copy's typed month totals too.
        const adjustedMonths = Object.fromEntries(Object.entries(isRecord(newer.months) ? newer.months : {})
            .map(([month, totals]) => [month, isRecord(totals) ? { ...totals } : {}]));
        ledgerById(newer.ledger).forEach((entry, id) => {
            if (!deleted.has(id) || typeof entry.date !== 'string' || !SYMBOLS.includes(entry.symbol)) return;
            const totals = adjustedMonths[entry.date.slice(0, 7)];
            if (totals) totals[entry.symbol] = roundMoney(Math.max(0,
                (Number(totals[entry.symbol]) || 0) - (Number(entry.amount) || 0)));
        });
        const olderSettings = isRecord(older.settings) ? older.settings : {};
        const newerSettings = isRecord(newer.settings) ? newer.settings : {};
        return {
            settings: {
                ...olderSettings,
                ...newerSettings,
                quickAmounts: normalizeQuickAmounts(
                    newerSettings.quickAmounts || olderSettings.quickAmounts
                )
            },
            months: mergeMonths(adjustedMonths, monthsFromLedger(ledger)),
            ledger,
            deletedIds,
            updatedAt: Math.max(leftUpdated, rightUpdated)
        };
    }

    /**
     * Classify a two-copy journal merge.
     * `unchanged` — this copy already contained the other copy's surviving fills.
     * `adopted` — the other copy added or removed fills and this copy did not.
     * `merged` — each copy contributed a fill the other did not have.
     * `conflict` — the same id differed, or one copy deleted a fill while the
     * other copy also added a different fill.
     */
    function journalWriteOutcome(local, remote, merged) {
        const localEntries = ledgerById(local && local.ledger);
        const remoteEntries = ledgerById(remote && remote.ledger);
        const mergedIds = new Set(ledgerById(merged && merged.ledger).keys());
        const localDeleted = new Set(normalizeDeletedIds(local && local.deletedIds));
        const remoteDeleted = new Set(normalizeDeletedIds(remote && remote.deletedIds));
        const keptFromLocalOnly = [];
        const keptFromRemoteOnly = [];
        let remoteRemovedLocal = false;
        let payloadConflict = false;
        localEntries.forEach((entry, id) => {
            const survived = mergedIds.has(id);
            const onRemote = remoteEntries.has(id);
            if (survived && !onRemote) keptFromLocalOnly.push(id);
            if (!survived && remoteDeleted.has(id)) remoteRemovedLocal = true;
            if (onRemote && fillSignature(entry) !== fillSignature(remoteEntries.get(id)) && survived) {
                payloadConflict = true;
            }
        });
        remoteEntries.forEach((entry, id) => {
            if (mergedIds.has(id) && !localEntries.has(id)) keptFromRemoteOnly.push(id);
        });
        if (payloadConflict || (remoteRemovedLocal && keptFromLocalOnly.length > 0)) return 'conflict';
        if (keptFromLocalOnly.length > 0 && keptFromRemoteOnly.length > 0) return 'merged';
        if (keptFromRemoteOnly.length > 0 || remoteRemovedLocal) return 'adopted';
        if (localDeleted.size || remoteDeleted.size) {
            const localOnlyDelete = [...localDeleted].some((id) => remoteEntries.has(id) && !remoteDeleted.has(id));
            if (localOnlyDelete && keptFromRemoteOnly.length === 0 && !remoteRemovedLocal) return 'unchanged';
        }
        return 'unchanged';
    }

    function journalMergeMessage(outcome) {
        return JOURNAL_MERGE_MESSAGES[outcome] || '';
    }

    return Object.freeze({
        DEFAULT_QUICK_AMOUNTS,
        MAX_QUICK_AMOUNTS,
        MIN_QUICK_AMOUNT,
        MAX_QUICK_AMOUNT,
        SYMBOLS,
        JOURNAL_MERGE_MESSAGES,
        addFill,
        catchUpRows,
        journalMergeMessage,
        journalWriteOutcome,
        mergeJournalState,
        monthsFromLedger,
        normalizeDeletedIds,
        normalizeQuickAmounts,
        roundMoney
    });
}));
