(function () {
    'use strict';

    const DATA_PATH = '../data/dca_market_history.json';
    const STORAGE_KEY = 'alphaeus-conviction-dca-lab-v1';
    const REALTIME_SESSION_KEY = 'alphaeus-dca-realtime-session-v1';
    const SYMBOLS = ['TSLA', 'SPCX'];
    const MAX_CSV_FILE_BYTES = 1_048_576;
    const MAX_CSV_TEXT_CHARS = 1_000_000;
    const MAX_PERSISTED_STATE_CHARS = 2_000_000;
    const MAX_PERSISTED_LEDGER_ROWS = 10_000;
    const MAX_RENDERED_JOURNAL_ROWS = 500;
    const MAX_LEDGER_ID_CHARS = 128;
    const MAX_LEDGER_META_CHARS = 64;
    const engine = window.DcaEngine;
    const quotesApi = window.DcaQuotes;
    const journal = window.DcaJournal;
    const cloud = window.DcaCloud;
    const CATCH_UP_PREVIEW = 8;

    const elements = {};
    const PAGE_TITLE = 'Conviction DCA Lab • Alphaeus Ng';
    let marketData = null;
    let currentPlan = null;
    let storageRecoveryMessage = '';
    let storageWriteBlocked = false;
    let state = loadState();
    let persistTimer = null;
    let clockTimer = null;
    let quoteTimer = null;
    let quoteRequest = null;
    let realtimeStream = null;
    let realtimeRecalcTimer = null;
    let realtimeFeed = 'iex';
    let quoteFeed = { source: 'snapshot', generatedAt: null, fetchedAt: null };
    let journalThisMonthOnly = true;
    let catchUpShowAll = false;
    let applyingCloud = false;
    const fillDirty = { TSLA: false, SPCX: false };
    const chartRanges = { TSLA: '66', SPCX: '66' };
    const chartModels = {};

    function byId(id) {
        return document.getElementById(id);
    }

    function cacheElements() {
        [
            'monthlyBudget', 'planDate', 'tslaAllocation', 'allocationOutput',
            'tslaInvested', 'spcxInvested', 'floorMultiplier', 'dipSensitivity',
            'maxMultiplier', 'floorOutput', 'sensitivityOutput', 'maxOutput',
            'strategyMode', 'fractionalShares', 'tslaManualToggle', 'spcxManualToggle',
            'tslaPrice', 'spcxPrice', 'tslaPriceMeta', 'spcxPriceMeta',
            'calculatorStatus', 'storageNotice', 'nextSessionLabel', 'dataConfidence',
            'totalRecommendation', 'recordTotalNote', 'recommendationSummary', 'budgetInvested',
            'budgetRemaining', 'budgetProgressFill', 'tslaFillAmount',
            'spcxFillAmount', 'tslaFillChips', 'spcxFillChips', 'tslaFillReset', 'spcxFillReset',
            'tslaShares', 'spcxShares', 'tslaBaseline',
            'spcxBaseline', 'tslaMultiplier', 'spcxMultiplier', 'tslaRemaining',
            'spcxRemaining', 'tslaSignalBadge', 'spcxSignalBadge',
            'recommendationReasons', 'recordPurchase', 'heroTslaPrice',
            'heroSpcxPrice', 'heroTslaMove', 'heroSpcxMove', 'marketFreshness',
            'marketTimestamp', 'tslaConfidenceBadge', 'spcxConfidenceBadge',
            'tslaIndicators', 'spcxIndicators', 'tslaSparkline', 'spcxSparkline',
            'tslaChartSummary', 'spcxChartSummary', 'tslaChartTooltip',
            'spcxChartTooltip',
            'tslaReplayMonth', 'spcxReplayMonth', 'tslaAdaptiveAverage',
            'spcxAdaptiveAverage', 'tslaFlatAverage', 'spcxFlatAverage',
            'tslaAdaptiveShares', 'spcxAdaptiveShares', 'tslaFlatShares',
            'spcxFlatShares', 'tslaReplayDelta', 'spcxReplayDelta', 'journalBody',
            'journalEmpty', 'exportJournal', 'resetMonth', 'jumpToday',
            'journalScope', 'catchUpBadge', 'unallocatedNote', 'budgetPercent',
            'budgetProgress', 'paceStatus', 'dcaNav', 'dcaForm', 'resetPrices',
            'undoLast', 'mobileActionBar', 'mobileActionTotal',
            'mobileRecord', 'mobileCopy', 'journalSummary', 'importJournal',
            'importJournalButton', 'marketSession', 'marketClock',
            'tslaSignalLabel', 'spcxSignalLabel', 'refreshQuotes', 'enableRealtime',
            'realtimeDialog', 'realtimeForm', 'closeRealtime', 'alpacaKeyId',
            'alpacaSecret', 'alpacaFeed', 'rememberRealtime', 'realtimeStatus',
            'connectRealtime', 'disconnectRealtime',
            'logDate', 'logAmount', 'logFillForm', 'logFillSubmit', 'logQuickChips',
            'mobileQuickChips', 'editQuickAmounts', 'quickAmountList', 'quickAmountInput',
            'addQuickAmount', 'resetQuickAmounts', 'catchUpList', 'catchUpSummary',
            'catchUpShowAll', 'cloudStatus', 'cloudSignIn', 'cloudSignOut',
            'mobileActionKicker', 'mobileMoreLog'
        ].forEach((id) => { elements[id] = byId(id); });
        elements.strategyRadios = Array.from(document.querySelectorAll('input[name="strategy"]'));
        elements.logSymbolRadios = Array.from(document.querySelectorAll('input[name="logSymbol"]'));
        elements.chartRangeButtons = Array.from(document.querySelectorAll('[data-chart-range]'));
        elements.allocationPresets = Array.from(document.querySelectorAll('[data-alloc]'));
        renderStorageNotice();
    }

    function defaultState() {
        return {
            settings: {
                monthlyBudget: 3000,
                tslaAllocation: 70,
                strategyId: 'balanced',
                floorMultiplier: 0.7,
                dipSensitivity: 1.35,
                maxMultiplier: 2.25,
                fractional: true,
                quickAmounts: journal ? journal.DEFAULT_QUICK_AMOUNTS.slice() : [20, 30],
                manualPrices: {
                    TSLA: { enabled: false, value: null },
                    SPCX: { enabled: false, value: null }
                }
            },
            months: {},
            ledger: [],
            updatedAt: 0
        };
    }

    function isCalendarMonth(value) {
        return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
    }

    function isCalendarDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const parsed = new Date(`${value}T00:00:00Z`);
        return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    }

    function loadState() {
        const fallback = defaultState();
        try {
            const rawState = localStorage.getItem(STORAGE_KEY);
            if (rawState && rawState.length > MAX_PERSISTED_STATE_CHARS) {
                console.warn('[DCA Lab] Saved browser state exceeded the safe decoded-size limit.');
                storageRecoveryMessage = 'Saved DCA data exceeded safe browser limits, so safe defaults are in use. Your next change will replace the oversized browser data.';
                return fallback;
            }
            const saved = JSON.parse(rawState);
            if (!saved || typeof saved !== 'object') return fallback;
            let repaired = false;
            const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
            const savedSettings = isRecord(saved.settings) ? saved.settings : {};
            if (saved.settings !== undefined && !isRecord(saved.settings)) repaired = true;
            const savedNumber = (source, key, minimum, maximum, fallbackValue) => {
                if (!(key in source)) return fallbackValue;
                const value = Number(source[key]);
                if (!Number.isFinite(value) || value < minimum || value > maximum) {
                    repaired = true;
                    return fallbackValue;
                }
                return value;
            };
            const savedBoolean = (source, key, fallbackValue) => {
                if (!(key in source)) return fallbackValue;
                if (typeof source[key] !== 'boolean') {
                    repaired = true;
                    return fallbackValue;
                }
                return source[key];
            };
            const manualPrices = {};
            const savedManual = isRecord(savedSettings.manualPrices)
                ? savedSettings.manualPrices
                : {};
            if (savedSettings.manualPrices !== undefined && !isRecord(savedSettings.manualPrices)) repaired = true;
            SYMBOLS.forEach((symbol) => {
                const source = isRecord(savedManual[symbol]) ? savedManual[symbol] : {};
                if (savedManual[symbol] !== undefined && !isRecord(savedManual[symbol])) repaired = true;
                const enabled = savedBoolean(source, 'enabled', false);
                let value = null;
                if (source.value !== undefined && source.value !== null && source.value !== '') {
                    const parsed = Number(source.value);
                    if (Number.isFinite(parsed) && parsed > 0) value = parsed;
                    else if (enabled) repaired = true;
                }
                if (enabled && value === null) repaired = true;
                manualPrices[symbol] = {
                    enabled: enabled && value !== null,
                    value
                };
            });
            const settings = {
                monthlyBudget: savedNumber(savedSettings, 'monthlyBudget', 0, 10_000_000, fallback.settings.monthlyBudget),
                tslaAllocation: savedNumber(savedSettings, 'tslaAllocation', 0, 100, fallback.settings.tslaAllocation),
                strategyId: fallback.settings.strategyId,
                floorMultiplier: savedNumber(savedSettings, 'floorMultiplier', 0.25, 1, fallback.settings.floorMultiplier),
                dipSensitivity: savedNumber(savedSettings, 'dipSensitivity', 0, 3, fallback.settings.dipSensitivity),
                maxMultiplier: savedNumber(savedSettings, 'maxMultiplier', 1, 4, fallback.settings.maxMultiplier),
                fractional: savedBoolean(savedSettings, 'fractional', fallback.settings.fractional),
                quickAmounts: journal
                    ? journal.normalizeQuickAmounts(savedSettings.quickAmounts)
                    : fallback.settings.quickAmounts,
                manualPrices
            };
            if ('strategyId' in savedSettings) {
                if (typeof savedSettings.strategyId === 'string' && engine.STRATEGIES[savedSettings.strategyId]) {
                    settings.strategyId = savedSettings.strategyId;
                } else {
                    repaired = true;
                }
            }
            const months = {};
            if (saved.months !== undefined && !isRecord(saved.months)) repaired = true;
            if (isRecord(saved.months)) {
                Object.entries(saved.months).forEach(([month, totals]) => {
                    if (!isCalendarMonth(month) || !isRecord(totals)) {
                        repaired = true;
                        return;
                    }
                    months[month] = {
                        TSLA: savedNumber(totals, 'TSLA', 0, Number.MAX_SAFE_INTEGER, 0),
                        SPCX: savedNumber(totals, 'SPCX', 0, Number.MAX_SAFE_INTEGER, 0)
                    };
                });
            }
            const ledger = [];
            const ids = new Set();
            if (saved.ledger !== undefined && !Array.isArray(saved.ledger)) repaired = true;
            const savedLedger = Array.isArray(saved.ledger) ? saved.ledger : [];
            if (savedLedger.length > MAX_PERSISTED_LEDGER_ROWS) repaired = true;
            savedLedger.slice(-MAX_PERSISTED_LEDGER_ROWS).forEach((entry) => {
                const id = typeof entry?.id === 'string' ? entry.id.trim() : '';
                const date = typeof entry?.date === 'string' ? entry.date : '';
                const symbol = typeof entry?.symbol === 'string' ? entry.symbol : '';
                const amount = Number(entry?.amount);
                const price = Number(entry?.price);
                const shares = Number(entry?.shares);
                if (!isRecord(entry)
                    || !id
                    || id.length > MAX_LEDGER_ID_CHARS
                    || ids.has(id)
                    || !isCalendarDate(date)
                    || !SYMBOLS.includes(symbol)
                    || !Number.isFinite(amount)
                    || amount <= 0
                    || !Number.isFinite(price)
                    || price < 0
                    || !Number.isFinite(shares)
                    || shares < 0) {
                    repaired = true;
                    return;
                }
                ids.add(id);
                const multiplier = Number(entry.multiplier);
                const batchId = typeof entry.batchId === 'string' ? entry.batchId.trim() : '';
                const priceMode = typeof entry.priceMode === 'string' ? entry.priceMode.trim() : '';
                if (batchId.length > MAX_LEDGER_META_CHARS || priceMode.length > MAX_LEDGER_META_CHARS) {
                    repaired = true;
                }
                ledger.push({
                    id,
                    ...(batchId && batchId.length <= MAX_LEDGER_META_CHARS
                        ? { batchId }
                        : {}),
                    date,
                    symbol,
                    amount,
                    price,
                    shares,
                    multiplier: Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1,
                    priceMode: priceMode && priceMode.length <= MAX_LEDGER_META_CHARS
                        ? priceMode
                        : 'saved'
                });
            });
            if (repaired) {
                storageRecoveryMessage = 'Some invalid saved data was ignored. Your valid plan and journal entries are still available; the repair will be saved with your next change.';
            }
            const updatedAt = Number(saved.updatedAt);
            return {
                settings,
                months,
                ledger,
                updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : 0
            };
        } catch (error) {
            console.warn('[DCA Lab] Browser state could not be loaded.', error);
            storageRecoveryMessage = 'Saved DCA data could not be read, so safe defaults are in use. Your next change will replace the unreadable browser data.';
            return fallback;
        }
    }

    function renderStorageNotice() {
        if (!elements.storageNotice) return;
        const message = storageWriteBlocked
            ? 'Browser storage is blocked. Your plan and journal changes remain available only until this tab closes.'
            : storageRecoveryMessage;
        elements.storageNotice.textContent = message;
        elements.storageNotice.hidden = !message;
    }

    function saveState() {
        state.updatedAt = Date.now();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            storageWriteBlocked = false;
            storageRecoveryMessage = '';
            renderStorageNotice();
            if (!applyingCloud && cloud && typeof cloud.pushSoon === 'function') {
                cloud.pushSoon(state);
            }
            return true;
        } catch (error) {
            console.warn('[DCA Lab] Browser state could not be saved.', error);
            storageWriteBlocked = true;
            renderStorageNotice();
            return false;
        }
    }

    function schedulePersist() {
        window.clearTimeout(persistTimer);
        persistTimer = window.setTimeout(() => {
            persistControls();
            persistTimer = null;
        }, 280);
    }

    function flushPersist() {
        if (!persistTimer) return;
        window.clearTimeout(persistTimer);
        persistTimer = null;
        persistControls();
    }

    function numberValue(element, fallback = 0) {
        const value = Number(element.value);
        return Number.isFinite(value) ? value : fallback;
    }

    function clamp(value, minimum, maximum) {
        return Math.min(Math.max(value, minimum), maximum);
    }

    function formatCurrency(value, digits = 0) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        }).format(Number(value) || 0);
    }

    function formatShares(value) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 6
        }).format(Number(value) || 0);
    }

    function formatPercent(value, digits = 1) {
        if (!Number.isFinite(value)) return 'Not enough data';
        const sign = value > 0 ? '+' : '';
        return `${sign}${(value * 100).toFixed(digits)}%`;
    }

    function formatDate(dateText, options = {}) {
        if (!dateText) return '—';
        return new Intl.DateTimeFormat('en-US', {
            month: options.short ? 'short' : 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC'
        }).format(new Date(`${dateText}T12:00:00Z`));
    }

    function formatMonth(monthText) {
        if (!monthText) return '—';
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
        }).format(new Date(`${monthText}-01T12:00:00Z`));
    }

    function newYorkDate() {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(new Date());
        const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
        return `${values.year}-${values.month}-${values.day}`;
    }

    function monthKey() {
        return elements.planDate.value.slice(0, 7);
    }

    function showStatus(message, type = 'error') {
        elements.calculatorStatus.textContent = message;
        elements.calculatorStatus.classList.toggle('is-info', type === 'info');
        elements.calculatorStatus.hidden = !message;
    }

    function clearStatus() {
        elements.calculatorStatus.hidden = true;
        elements.calculatorStatus.textContent = '';
        elements.calculatorStatus.classList.remove('is-info');
    }

    function selectedStrategyId() {
        return elements.strategyRadios.find((radio) => radio.checked)?.value || 'balanced';
    }

    function strategySettings() {
        const id = selectedStrategyId();
        const preset = engine.STRATEGIES[id] || engine.STRATEGIES.balanced;
        const floorMultiplier = numberValue(elements.floorMultiplier, preset.floorMultiplier);
        const dipSensitivity = numberValue(elements.dipSensitivity, preset.dipSensitivity);
        const maxMultiplier = numberValue(elements.maxMultiplier, preset.maxMultiplier);
        const isCustom = floorMultiplier !== preset.floorMultiplier
            || dipSensitivity !== preset.dipSensitivity
            || maxMultiplier !== preset.maxMultiplier;
        return {
            id: isCustom ? 'custom' : id,
            label: isCustom ? 'Custom' : preset.label,
            floorMultiplier,
            dipSensitivity,
            maxMultiplier
        };
    }

    function applyStrategyPreset(id) {
        const preset = engine.STRATEGIES[id] || engine.STRATEGIES.balanced;
        elements.floorMultiplier.value = String(preset.floorMultiplier);
        elements.dipSensitivity.value = String(preset.dipSensitivity);
        elements.maxMultiplier.value = String(preset.maxMultiplier);
        elements.strategyMode.textContent = `${preset.label} preset`;
        updateRangeOutputs();
    }

    function updateRangeOutputs(custom = false) {
        elements.floorOutput.textContent = `${numberValue(elements.floorMultiplier).toFixed(2)}×`;
        elements.sensitivityOutput.textContent = numberValue(elements.dipSensitivity).toFixed(2);
        elements.maxOutput.textContent = `${numberValue(elements.maxMultiplier).toFixed(2)}×`;
        if (custom) elements.strategyMode.textContent = 'Custom settings';
    }

    function applySavedSettings({ keepPlanDate = false } = {}) {
        const settings = state.settings;
        elements.monthlyBudget.value = String(settings.monthlyBudget);
        elements.tslaAllocation.value = String(settings.tslaAllocation);
        elements.fractionalShares.checked = settings.fractional !== false;
        const strategyRadio = elements.strategyRadios.find((radio) => radio.value === settings.strategyId);
        (strategyRadio || elements.strategyRadios[1]).checked = true;
        elements.floorMultiplier.value = String(settings.floorMultiplier);
        elements.dipSensitivity.value = String(settings.dipSensitivity);
        elements.maxMultiplier.value = String(settings.maxMultiplier);
        elements.tslaManualToggle.checked = Boolean(settings.manualPrices.TSLA?.enabled);
        elements.spcxManualToggle.checked = Boolean(settings.manualPrices.SPCX?.enabled);
        if (Number.isFinite(Number(settings.manualPrices.TSLA?.value))) {
            elements.tslaPrice.value = String(settings.manualPrices.TSLA.value);
        }
        if (Number.isFinite(Number(settings.manualPrices.SPCX?.value))) {
            elements.spcxPrice.value = String(settings.manualPrices.SPCX.value);
        }
        if (!keepPlanDate) elements.planDate.value = newYorkDate();
        if (elements.logDate && (!keepPlanDate || !elements.logDate.value)) {
            elements.logDate.value = elements.planDate.value || newYorkDate();
        }
        updateRangeOutputs();
        updateAllocationOutput();
        updatePriceControls();
        loadMonthInputs();
        renderQuickChips();
    }

    function applyQueryOverrides() {
        const params = new URLSearchParams(window.location.search);
        let applied = false;
        const date = params.get('d') || params.get('date');
        const budget = Number(params.get('budget'));
        const strategy = params.get('strategy');
        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            elements.planDate.value = date;
            applied = true;
        }
        if (Number.isFinite(budget) && budget > 0) {
            elements.monthlyBudget.value = String(clamp(budget, 1, 10_000_000));
            applied = true;
        }
        if (strategy && engine.STRATEGIES[strategy]) {
            const radio = elements.strategyRadios.find((item) => item.value === strategy);
            if (radio) {
                radio.checked = true;
                applyStrategyPreset(strategy);
                applied = true;
            }
        }
        const allocationParam = params.get('tsla') ?? params.get('alloc');
        const tsla = Number(allocationParam);
        if (allocationParam !== null && Number.isFinite(tsla) && tsla >= 0 && tsla <= 100) {
            elements.tslaAllocation.value = String(Math.round(tsla / 5) * 5);
            applied = true;
        }
        const tuning = [
            ['floor', elements.floorMultiplier, 0.25, 1],
            ['dip', elements.dipSensitivity, 0, 3],
            ['max', elements.maxMultiplier, 1, 4]
        ];
        tuning.forEach(([name, element, minimum, maximum]) => {
            const raw = params.get(name);
            const value = Number(raw);
            if (raw !== null && Number.isFinite(value) && value >= minimum && value <= maximum) {
                element.value = String(value);
                applied = true;
            }
        });
        if (params.get('fractional') === '0') {
            elements.fractionalShares.checked = false;
            applied = true;
        }
        return applied;
    }

    function snapPlanDate() {
        if (!engine || !/^\d{4}-\d{2}-\d{2}$/.test(elements.planDate.value)) return null;
        const snapped = engine.nextTradingDay(elements.planDate.value);
        if (snapped === elements.planDate.value) return null;
        elements.planDate.value = snapped;
        return snapped;
    }

    function jumpToToday() {
        elements.planDate.value = newYorkDate();
        const snapped = snapPlanDate();
        if (elements.logDate) elements.logDate.value = elements.planDate.value;
        clearFillEdits();
        loadMonthInputs();
        recalculate();
        showStatus(
            `Plan date set to ${formatDate(elements.planDate.value, { short: true })}${snapped ? ', the next U.S. trading session' : ''}.`,
            'info'
        );
    }

    function updateAllocationOutput() {
        const tsla = clamp(numberValue(elements.tslaAllocation, 70), 0, 100);
        elements.allocationOutput.textContent = `TSLA ${tsla}% · SPCX ${100 - tsla}%`;
        (elements.allocationPresets || []).forEach((button) => {
            button.setAttribute('aria-pressed', String(Number(button.dataset.alloc) === tsla));
        });
    }

    function loadMonthInputs() {
        const saved = state.months[monthKey()] || {};
        elements.tslaInvested.value = String(Number(saved.TSLA) || 0);
        elements.spcxInvested.value = String(Number(saved.SPCX) || 0);
    }

    function persistControls() {
        const currentMonth = monthKey();
        state.settings = {
            ...state.settings,
            monthlyBudget: clamp(numberValue(elements.monthlyBudget), 0, 10_000_000),
            tslaAllocation: clamp(numberValue(elements.tslaAllocation), 0, 100),
            strategyId: selectedStrategyId(),
            floorMultiplier: numberValue(elements.floorMultiplier, 0.7),
            dipSensitivity: numberValue(elements.dipSensitivity, 1.35),
            maxMultiplier: numberValue(elements.maxMultiplier, 2.25),
            fractional: elements.fractionalShares.checked,
            quickAmounts: journal
                ? journal.normalizeQuickAmounts(state.settings.quickAmounts)
                : state.settings.quickAmounts,
            manualPrices: {
                TSLA: {
                    enabled: elements.tslaManualToggle.checked,
                    value: numberValue(elements.tslaPrice, null)
                },
                SPCX: {
                    enabled: elements.spcxManualToggle.checked,
                    value: numberValue(elements.spcxPrice, null)
                }
            }
        };
        state.months[currentMonth] = {
            TSLA: Math.max(0, numberValue(elements.tslaInvested)),
            SPCX: Math.max(0, numberValue(elements.spcxInvested))
        };
        saveState();
    }

    function updatePriceControls() {
        SYMBOLS.forEach((symbol) => {
            const lower = symbol.toLowerCase();
            const toggle = elements[`${lower}ManualToggle`];
            const input = elements[`${lower}Price`];
            input.disabled = !toggle.checked;
            if (!toggle.checked && marketData) {
                input.value = String(marketData.symbols[symbol].quote.price);
            }
        });
        if (elements.resetPrices) {
            elements.resetPrices.hidden = !(elements.tslaManualToggle.checked || elements.spcxManualToggle.checked);
        }
    }

    function resetSnapshotPrices() {
        elements.tslaManualToggle.checked = false;
        elements.spcxManualToggle.checked = false;
        updatePriceControls();
        recalculate();
        showStatus('Prices restored from the latest market quote.', 'info');
        refreshLiveQuotes({ force: true });
    }

    function applyLiveQuotes(live) {
        if (!marketData || !live || !live.quotes || realtimeStream) return false;
        let changed = false;
        let accepted = false;
        SYMBOLS.forEach((symbol) => {
            const incoming = live.quotes[symbol];
            if (!incoming || !(incoming.price > 0)) return;
            const incomingTime = Date.parse(incoming.asOf);
            const incomingAge = Date.now() - incomingTime;
            if (!Number.isFinite(incomingTime)
                || incomingAge < -15 * 60_000
                || incomingAge > 36 * 3_600_000) {
                return;
            }
            accepted = true;
            const current = marketData.symbols[symbol].quote || {};
            if (current.price !== incoming.price || current.asOf !== incoming.asOf) {
                changed = true;
            }
            marketData.symbols[symbol].quote = {
                ...current,
                ...incoming
            };
        });
        if (!accepted) return false;
        quoteFeed = {
            source: live.feed || 'live',
            generatedAt: live.generatedAt || null,
            fetchedAt: live.fetchedAt || new Date().toISOString()
        };
        return changed;
    }

    function quotePollMs() {
        if (realtimeStream || (typeof document !== 'undefined' && document.hidden)) return null;
        const status = elements.marketSession ? elements.marketSession.textContent : '';
        if (status === 'Open') return 60_000;
        if (status === 'Pre-market' || status === 'After hours') return 120_000;
        return 300_000;
    }

    function scheduleQuotePoll() {
        if (quoteTimer) window.clearTimeout(quoteTimer);
        const wait = quotePollMs();
        if (!wait) return;
        quoteTimer = window.setTimeout(() => {
            refreshLiveQuotes().finally(scheduleQuotePoll);
        }, wait);
    }

    async function refreshLiveQuotes({ force = false } = {}) {
        if (!quotesApi || !marketData) return;
        if (realtimeStream) return;
        if (typeof document !== 'undefined' && document.hidden && !force) return;
        if (quoteRequest) return quoteRequest;
        if (elements.refreshQuotes) {
            elements.refreshQuotes.disabled = true;
            elements.refreshQuotes.setAttribute('aria-busy', 'true');
        }
        quoteRequest = quotesApi.loadLiveQuotes({
            symbols: SYMBOLS,
            logger: (error) => console.warn('[DCA Lab] Recent quote feed skipped.', error)
        });
        try {
            const live = await quoteRequest;
            if (!live) return;
            const changed = applyLiveQuotes(live);
            renderMarketHeader();
            if (changed || force) recalculate({ persist: false, preserveStatus: true });
        } catch (error) {
            console.warn('[DCA Lab] Recent quotes unavailable.', error);
        } finally {
            quoteRequest = null;
            if (elements.refreshQuotes) {
                elements.refreshQuotes.disabled = false;
                elements.refreshQuotes.removeAttribute('aria-busy');
            }
        }
    }

    function readRealtimeSession() {
        try {
            const saved = JSON.parse(sessionStorage.getItem(REALTIME_SESSION_KEY));
            if (!saved || !saved.keyId || !saved.secret) return null;
            return {
                keyId: String(saved.keyId),
                secret: String(saved.secret),
                feed: saved.feed === 'sip' ? 'sip' : 'iex'
            };
        } catch (error) {
            return null;
        }
    }

    function setRealtimeUi(state, message = '') {
        const active = ['connecting', 'connected', 'authenticating', 'subscribing', 'streaming', 'reconnecting'].includes(state);
        if (elements.enableRealtime) {
            elements.enableRealtime.textContent = state === 'streaming'
                ? 'Live'
                : active ? 'Connecting…' : 'Go real-time';
            elements.enableRealtime.classList.toggle('is-connected', state === 'streaming');
            elements.enableRealtime.setAttribute('aria-pressed', String(state === 'streaming'));
        }
        if (elements.realtimeStatus) {
            elements.realtimeStatus.textContent = message;
            elements.realtimeStatus.classList.toggle('is-error', state === 'error');
        }
        if (elements.connectRealtime) elements.connectRealtime.disabled = active;
        if (elements.disconnectRealtime) elements.disconnectRealtime.hidden = !realtimeStream;
    }

    function openRealtimeDialog() {
        if (!elements.realtimeDialog) return;
        const saved = readRealtimeSession();
        if (saved) {
            elements.alpacaKeyId.value = saved.keyId;
            elements.alpacaSecret.value = saved.secret;
            elements.alpacaFeed.value = saved.feed;
            elements.rememberRealtime.checked = true;
        }
        if (!elements.realtimeDialog.open) elements.realtimeDialog.showModal();
    }

    function scheduleRealtimeRecalculation() {
        if (realtimeRecalcTimer) return;
        realtimeRecalcTimer = window.setTimeout(() => {
            realtimeRecalcTimer = null;
            recalculate({ persist: false, preserveStatus: true });
        }, 750);
    }

    function applyRealtimeTrade(trade) {
        if (!marketData || !trade || !SYMBOLS.includes(trade.symbol)) return;
        const timestamp = Date.parse(trade.asOf);
        const age = Date.now() - timestamp;
        if (!Number.isFinite(timestamp) || age < -15 * 60_000 || age > 36 * 3_600_000) return;
        const current = marketData.symbols[trade.symbol].quote || {};
        const previousClose = Number(current.previousClose)
            || (Number(current.price) - Number(current.netChange))
            || Number(current.price);
        const netChange = trade.price - previousClose;
        realtimeFeed = trade.feed === 'sip' ? 'sip' : 'iex';
        marketData.symbols[trade.symbol].quote = {
            ...current,
            price: trade.price,
            asOf: trade.asOf,
            previousClose,
            netChange,
            percentChange: previousClose > 0 ? netChange / previousClose : 0,
            marketStatus: elements.marketSession?.textContent || current.marketStatus || 'Open',
            isRealTime: true,
            source: `Alpaca ${realtimeFeed.toUpperCase()}`
        };
        quoteFeed = {
            source: `alpaca-${realtimeFeed}`,
            generatedAt: trade.asOf,
            fetchedAt: new Date().toISOString()
        };
        renderMarketHeader();
        scheduleRealtimeRecalculation();
    }

    function stopRealtime({ forget = true, restoreFallback = true } = {}) {
        const stream = realtimeStream;
        realtimeStream = null;
        if (stream) stream.close();
        if (realtimeRecalcTimer) window.clearTimeout(realtimeRecalcTimer);
        realtimeRecalcTimer = null;
        if (forget) {
            try { sessionStorage.removeItem(REALTIME_SESSION_KEY); } catch (error) { /* no-op */ }
            if (elements.rememberRealtime) elements.rememberRealtime.checked = false;
        }
        setRealtimeUi('closed', 'Real-time stream disconnected. Recent Nasdaq quotes remain available.');
        if (restoreFallback) {
            quoteFeed.source = 'alpaca-paused';
            renderMarketHeader();
            refreshLiveQuotes({ force: true }).finally(scheduleQuotePoll);
        }
    }

    function startRealtime(credentials) {
        if (!quotesApi || typeof quotesApi.createAlpacaStream !== 'function') {
            setRealtimeUi('error', 'Real-time streaming is unavailable in this browser.');
            return;
        }
        if (realtimeStream) stopRealtime({ forget: false, restoreFallback: false });
        if (quoteTimer) window.clearTimeout(quoteTimer);
        quoteTimer = null;
        realtimeFeed = credentials.feed === 'sip' ? 'sip' : 'iex';
        try {
            realtimeStream = quotesApi.createAlpacaStream({
                ...credentials,
                feed: realtimeFeed,
                symbols: SYMBOLS,
                onTrade: applyRealtimeTrade,
                onStatus: ({ state: streamState, message }) => {
                    setRealtimeUi(streamState, message);
                    if (streamState === 'streaming' && elements.realtimeDialog?.open) {
                        elements.alpacaSecret.value = '';
                        if (!elements.rememberRealtime.checked) elements.alpacaKeyId.value = '';
                        elements.realtimeDialog.close();
                    }
                },
                onError: (error) => console.warn('[DCA Lab] Real-time stream issue.', error)
            });
            setRealtimeUi('connecting', 'Opening real-time stream…');
        } catch (error) {
            realtimeStream = null;
            setRealtimeUi('error', error.message || 'Could not start the real-time stream.');
        }
    }

    function quoteAgeHours() {
        if (!marketData) return Infinity;
        const timestamps = SYMBOLS.map((symbol) => Date.parse(marketData.symbols[symbol].quote.asOf));
        return (Date.now() - Math.min(...timestamps)) / 3_600_000;
    }

    function formatQuoteTimestamp(quote) {
        const parsed = new Date(quote.asOf);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/New_York',
            timeZoneName: 'short'
        }).format(parsed);
    }

    function manualEnabled(symbol) {
        return Boolean(elements[`${String(symbol).toLowerCase()}ManualToggle`]?.checked);
    }

    function renderMarketHeader() {
        if (!marketData) return;
        SYMBOLS.forEach((symbol) => {
            const lower = symbol.toLowerCase();
            const quote = marketData.symbols[symbol].quote;
            const move = elements[`hero${symbol === 'TSLA' ? 'Tsla' : 'Spcx'}Move`];
            if (manualEnabled(symbol)) {
                const price = numberValue(elements[`${lower}Price`], quote.price);
                elements[`hero${symbol === 'TSLA' ? 'Tsla' : 'Spcx'}Price`].textContent = formatCurrency(price, 2);
                move.textContent = 'Manual';
                move.className = 'market-move is-manual';
                elements[`${lower}PriceMeta`].textContent = "Manual override · used in today's plan";
                return;
            }
            elements[`hero${symbol === 'TSLA' ? 'Tsla' : 'Spcx'}Price`].textContent = formatCurrency(quote.price, 2);
            move.textContent = formatPercent(quote.percentChange, 2);
            move.className = `market-move ${quote.percentChange >= 0 ? 'is-up' : 'is-down'}`;
            const feed = String(quote.source || '').startsWith('Alpaca ')
                ? `${quote.source} trade`
                : quote.source === 'Nasdaq' && quoteFeed.source !== 'snapshot'
                    ? 'Nasdaq last sale'
                    : 'Nasdaq snapshot';
            elements[`${lower}PriceMeta`].textContent = `${feed} · ${formatQuoteTimestamp(quote)} · ${quote.marketStatus}`;
            elements[`${lower}Price`].value = String(quote.price);
        });
        const ageHours = quoteAgeHours();
        const ageMs = ageHours * 3_600_000;
        const paused = quoteFeed.source === 'alpaca-paused';
        const streaming = String(quoteFeed.source || '').startsWith('alpaca-')
            && !paused;
        const recent = !streaming && !paused && quoteFeed.source !== 'snapshot' && ageMs < 15 * 60_000;
        let freshness = 'Fresh snapshot';
        if (streaming && ageMs < 30_000) freshness = 'Live · streaming';
        else if (streaming) freshness = 'Live · waiting for trade';
        else if (paused) freshness = 'Stream paused';
        else if (recent && ageMs < 90_000) freshness = 'Recent last sale';
        else if (recent) freshness = 'Recent · short delay';
        else if (quoteFeed.source !== 'snapshot' && ageHours <= 26) freshness = 'Latest market close';
        else if (ageHours > 96) freshness = 'Stale · use manual price';
        else if (ageHours > 26) freshness = 'Prior market snapshot';
        const manuals = SYMBOLS.filter(manualEnabled);
        if (manuals.length === 2) freshness = 'Manual prices';
        else if (manuals.length === 1) freshness = `${freshness} · ${manuals[0]} manual`;
        elements.marketFreshness.textContent = freshness;
        elements.marketFreshness.classList.toggle('is-live', Boolean((recent || streaming) && manuals.length !== 2));
        const stampSource = streaming || paused
            ? 'Last tick'
            : quoteFeed.source !== 'snapshot' ? 'Feed updated' : 'Snapshot generated';
        const stamp = quoteFeed.source !== 'snapshot'
            ? (quoteFeed.generatedAt || quoteFeed.fetchedAt || Date.now())
            : marketData.generatedAt;
        elements.marketTimestamp.textContent = `${stampSource} ${new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
        }).format(new Date(stamp))}`;
        renderMarketClock();
        updatePriceControls();
    }

    function renderMarketClock() {
        if (!elements.marketSession || !engine) return;
        const today = newYorkDate();
        const hour = Number(new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            hourCycle: 'h23'
        }).format(new Date()));
        const minute = Number(new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            minute: '2-digit'
        }).format(new Date()));
        const minutes = (hour * 60) + minute;
        const trading = engine.isTradingDay(today);
        let label = 'Closed';
        if (trading && minutes >= (9 * 60) + 30 && minutes < (16 * 60)) label = 'Open';
        else if (trading && minutes >= (4 * 60) && minutes < (9 * 60) + 30) label = 'Pre-market';
        else if (trading && minutes >= (16 * 60) && minutes < (20 * 60)) label = 'After hours';
        elements.marketSession.textContent = label;
        if (elements.marketClock) {
            elements.marketClock.textContent = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/New_York',
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short'
            }).format(new Date());
        }
    }

    function marketPrice(symbol) {
        const lower = symbol.toLowerCase();
        const manual = elements[`${lower}ManualToggle`].checked;
        return {
            value: numberValue(elements[`${lower}Price`], 0),
            currentDate: manual ? elements.planDate.value : marketData.symbols[symbol].quote.asOf.slice(0, 10),
            manual
        };
    }

    function validateInputs() {
        const errors = [];
        const budget = numberValue(elements.monthlyBudget, NaN);
        if (!Number.isFinite(budget) || budget <= 0 || budget > 10_000_000) {
            errors.push('Enter a monthly cap between $1 and $10,000,000.');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(elements.planDate.value)) {
            errors.push('Choose a valid plan date.');
        }
        SYMBOLS.forEach((symbol) => {
            const price = marketPrice(symbol).value;
            if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) {
                errors.push(`Enter a valid ${symbol} price.`);
            }
        });
        return errors;
    }

    function buildPlan({ preserveStatus = false } = {}) {
        if (!marketData) return null;
        const errors = validateInputs();
        if (errors.length) {
            showStatus(errors.join(' '));
            return null;
        }
        if (!preserveStatus) clearStatus();
        const monthlyBudget = numberValue(elements.monthlyBudget);
        const tslaAllocation = clamp(numberValue(elements.tslaAllocation), 0, 100) / 100;
        const allocations = { TSLA: tslaAllocation, SPCX: 1 - tslaAllocation };
        const invested = {
            TSLA: Math.max(0, numberValue(elements.tslaInvested)),
            SPCX: Math.max(0, numberValue(elements.spcxInvested))
        };
        const pacing = engine.allocateRemainingBudget(monthlyBudget, allocations, invested);
        const sessions = engine.tradingSessionsRemaining(elements.planDate.value);
        if (!sessions.length) {
            showStatus('There are no remaining U.S. trading sessions in this month. Choose a date in the next month.', 'info');
        }
        const strategy = strategySettings();
        const assets = {};
        SYMBOLS.forEach((symbol) => {
            const price = marketPrice(symbol);
            const record = marketData.symbols[symbol];
            const indicators = engine.calculateIndicators(record.history, {
                currentPrice: price.value,
                currentDate: price.currentDate
            });
            const signal = engine.calculateSignal(indicators, strategy);
            const targetBudget = monthlyBudget * allocations[symbol];
            const effectiveBudget = invested[symbol] + pacing.effectiveRemaining[symbol];
            const recommendation = engine.recommendAsset({
                monthlyBudget: effectiveBudget,
                invested: invested[symbol],
                daysRemaining: sessions.length,
                price: price.value,
                signalMultiplier: signal.multiplier,
                floorMultiplier: strategy.floorMultiplier,
                maxMultiplier: strategy.maxMultiplier,
                fractional: elements.fractionalShares.checked
            });
            assets[symbol] = {
                record,
                price,
                indicators,
                signal,
                targetBudget,
                effectiveBudget,
                recommendation
            };
        });
        return {
            monthlyBudget,
            allocations,
            invested,
            pacing,
            sessions,
            strategy,
            assets,
            planDate: elements.planDate.value
        };
    }

    function setSignalBadge(element, signal) {
        element.textContent = `${signal.multiplier.toFixed(2)}×`;
        element.className = 'signal-badge';
        if (signal.multiplier > 1.05) element.classList.add('is-weak');
        if (signal.multiplier < 0.95) element.classList.add('is-strong');
        element.title = signal.label;
    }

    function signalReason(symbol, asset) {
        const indicator = asset.indicators;
        if (asset.signal.multiplier > 1.05) {
            const candidates = [
                { value: asset.signal.components.dailyDip, text: `${symbol} is ${formatPercent(indicator.dailyReturn)} over one session` },
                { value: asset.signal.components.weeklyDip, text: `${symbol} is ${formatPercent(indicator.fiveDayReturn)} over five sessions` },
                { value: asset.signal.components.belowAverage, text: `${symbol} is ${formatPercent(indicator.distanceFromMa20)} versus its 20-session average` },
                { value: asset.signal.components.drawdown, text: `${symbol} is ${formatPercent(indicator.drawdown20)} from its 20-session high` }
            ].sort((left, right) => right.value - left.value);
            return `${candidates[0].text}; normalized weakness raises its weight to ${asset.signal.multiplier.toFixed(2)}×.`;
        }
        if (asset.signal.multiplier < 0.95) {
            return `${symbol} has a stronger tape (${formatPercent(indicator.fiveDayReturn)} over five sessions), so it keeps the ${asset.signal.multiplier.toFixed(2)}× floor-weighted buy.`;
        }
        return `${symbol} is near a neutral signal, so its ${asset.signal.multiplier.toFixed(2)}× weight stays close to baseline.`;
    }

    function renderReasons(plan) {
        elements.recommendationReasons.replaceChildren();
        const baseline = SYMBOLS.reduce((total, symbol) => total + plan.assets[symbol].recommendation.baseline, 0);
        const reasons = [
            `${plan.sessions.length} trading session${plan.sessions.length === 1 ? '' : 's'} remain; the combined adaptive baseline is ${formatCurrency(baseline, 2)}.`,
            signalReason('TSLA', plan.assets.TSLA),
            signalReason('SPCX', plan.assets.SPCX)
        ];
        if (plan.assets.SPCX.signal.historyCapApplied) {
            reasons.push(`SPCX has ${plan.assets.SPCX.indicators.sessions} observed sessions, so its signal is pulled toward neutral and capped at 1.75×.`);
        }
        if (plan.pacing.allocationAdjusted) {
            reasons.push('Earlier contributions moved the portfolio away from its target mix, so remaining dollars are directed toward the underweight holding without exceeding the monthly cap.');
        }
        const unallocated = SYMBOLS.reduce((total, symbol) => total + plan.assets[symbol].recommendation.unallocatedToday, 0);
        if (unallocated > 0) {
            reasons.push(`Whole-share rounding leaves ${formatCurrency(unallocated, 2)} undeployed today; it remains in the monthly balance.`);
        }
        reasons.forEach((reason) => {
            const item = document.createElement('li');
            item.textContent = reason;
            elements.recommendationReasons.appendChild(item);
        });
    }

    function renderRecommendation(plan) {
        const total = SYMBOLS.reduce((sum, symbol) => sum + plan.assets[symbol].recommendation.amount, 0);
        const totalInvested = plan.invested.TSLA + plan.invested.SPCX;
        const totalRemaining = plan.pacing.portfolioRemaining;
        const overBudget = totalInvested - plan.monthlyBudget;
        const investedPercent = plan.monthlyBudget ? (totalInvested / plan.monthlyBudget) * 100 : 0;
        const sessionCount = plan.sessions.length;
        const lastSession = sessionCount === 1;
        elements.totalRecommendation.textContent = formatCurrency(total, 2);
        elements.nextSessionLabel.textContent = sessionCount
            ? `${formatDate(plan.sessions[0], { short: true })} · ${lastSession ? 'last session' : `${sessionCount} sessions left`}`
            : 'Month has no sessions left';
        elements.catchUpBadge.hidden = !lastSession;
        const age = quoteAgeHours();
        const alreadyRecorded = sessionCount ? sessionAlreadyRecorded(plan.sessions[0]) : false;
        const usingManual = SYMBOLS.some(manualEnabled);
        elements.dataConfidence.textContent = overBudget > 0.005
            ? 'Over monthly cap'
            : alreadyRecorded ? 'Already recorded'
            : usingManual ? 'Manual price in use'
            : age > 96 ? 'Stale market snapshot' : 'Budget checked';
        if (overBudget > 0.005) {
            showStatus(
                `Month-to-date contributions are ${formatCurrency(overBudget, 2)} over the ${formatCurrency(plan.monthlyBudget, 2)} cap. Raise the cap or reduce recorded totals before today’s suggestion can deploy.`,
                'error'
            );
        }
        elements.recommendationSummary.textContent = sessionCount
            ? `${formatCurrency(totalRemaining, 2)} remains across ${sessionCount} U.S. trading session${sessionCount === 1 ? '' : 's'}, including today.`
            : 'Move the plan date into a month with an eligible U.S. trading session.';
        elements.budgetInvested.textContent = formatCurrency(totalInvested, 2);
        elements.budgetRemaining.textContent = formatCurrency(Math.max(0, totalRemaining), 2);
        elements.budgetPercent.textContent = `${Math.round(investedPercent)}% of cap`;
        elements.budgetProgressFill.style.width = `${clamp(investedPercent, 0, 100)}%`;
        elements.budgetProgressFill.classList.toggle('is-over', investedPercent > 100);
        if (elements.budgetProgress) {
            elements.budgetProgress.classList.toggle('is-over', investedPercent > 100);
            elements.budgetProgress.setAttribute('aria-valuenow', String(Math.round(clamp(investedPercent, 0, 100))));
            elements.budgetProgress.setAttribute(
                'aria-valuetext',
                `${Math.round(investedPercent)}% of the monthly cap invested`
            );
        }
        const pace = engine.paceVsEven({
            monthlyBudget: plan.monthlyBudget,
            invested: totalInvested,
            planDate: plan.planDate
        });
        const paceTolerance = Math.max(1, plan.monthlyBudget * 0.005);
        elements.paceStatus.className = 'budget-progress__pace';
        if (pace.delta > paceTolerance) {
            elements.paceStatus.textContent = `${formatCurrency(pace.delta, 0)} ahead of an even daily pace`;
            elements.paceStatus.classList.add('is-ahead');
        } else if (pace.delta < -paceTolerance) {
            elements.paceStatus.textContent = `${formatCurrency(Math.abs(pace.delta), 0)} behind an even daily pace`;
            elements.paceStatus.classList.add('is-behind');
        } else {
            elements.paceStatus.textContent = 'On an even daily pace';
        }

        SYMBOLS.forEach((symbol) => {
            const lower = symbol.toLowerCase();
            const asset = plan.assets[symbol];
            const recommendation = asset.recommendation;
            elements[`${lower}Baseline`].textContent = formatCurrency(recommendation.baseline, 2);
            elements[`${lower}Multiplier`].textContent = `${recommendation.appliedMultiplier.toFixed(2)}×`;
            elements[`${lower}Remaining`].textContent = formatCurrency(recommendation.remaining, 2);
            setSignalBadge(elements[`${lower}SignalBadge`], asset.signal);
            if (elements[`${lower}SignalLabel`]) {
                elements[`${lower}SignalLabel`].textContent = asset.signal.label;
            }
        });
        syncFillInputs(plan);
        const leftover = SYMBOLS.reduce((sum, symbol) => sum + plan.assets[symbol].recommendation.unallocatedToday, 0);
        if (leftover > 0) {
            elements.unallocatedNote.hidden = false;
            elements.unallocatedNote.textContent = `Whole-share rounding leaves ${formatCurrency(leftover, 2)} undeployed today. It stays in the monthly remainder.`;
        } else {
            elements.unallocatedNote.hidden = true;
            elements.unallocatedNote.textContent = '';
        }
        renderReasons(plan);
        const recording = recordedFillTotal();
        const canAct = recording > 0 && sessionCount > 0;
        elements.recordPurchase.disabled = !canAct;
        if (elements.undoLast) elements.undoLast.disabled = !state.ledger.length;
        renderMobileLogBar();
        document.title = canAct ? `${formatCurrency(total, 0)} today · Conviction DCA Lab` : PAGE_TITLE;
    }

    function indicatorClass(value) {
        if (!Number.isFinite(value) || Math.abs(value) < 0.0005) return '';
        return value > 0 ? 'is-positive' : 'is-negative';
    }

    function renderIndicators(symbol, asset) {
        const lower = symbol.toLowerCase();
        const indicator = asset.indicators;
        const values = [
            ['1 session', formatPercent(indicator.dailyReturn), indicator.dailyReturn],
            ['5 sessions', formatPercent(indicator.fiveDayReturn), indicator.fiveDayReturn],
            ['vs 20-day avg', formatPercent(indicator.distanceFromMa20), indicator.distanceFromMa20],
            ['20-day drawdown', formatPercent(indicator.drawdown20), indicator.drawdown20],
            ['RSI (14)', Number.isFinite(indicator.rsi14) ? indicator.rsi14.toFixed(1) : 'Not enough data', null],
            ['20-day volatility', formatPercent(indicator.volatility20), null]
        ];
        const container = elements[`${lower}Indicators`];
        container.replaceChildren();
        values.forEach(([label, display, directional]) => {
            const wrapper = document.createElement('div');
            const term = document.createElement('dt');
            const detail = document.createElement('dd');
            term.textContent = label;
            detail.textContent = display;
            const className = indicatorClass(directional);
            if (className) detail.classList.add(className);
            wrapper.append(term, detail);
            container.appendChild(wrapper);
        });
        const confidence = elements[`${lower}ConfidenceBadge`];
        confidence.textContent = `${indicator.sessions} sessions · ${indicator.confidence}`;
        confidence.className = `confidence-badge is-${indicator.confidence}`;
    }

    function chartRows(symbol, record, asset) {
        const rows = record.history.map((row) => ({
            date: String(row.date),
            close: Number(row.close)
        }));
        const current = {
            date: asset.price.currentDate,
            close: Number(asset.price.value)
        };
        const final = rows[rows.length - 1];
        if (current.date > final.date) rows.push(current);
        else if (current.date === final.date) rows[rows.length - 1] = current;
        const range = chartRanges[symbol];
        return range === 'all' ? rows : rows.slice(-Number(range));
    }

    function svgElement(namespace, tag, attributes = {}) {
        const element = document.createElementNS(namespace, tag);
        Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
        return element;
    }

    function shortChartDate(dateText) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
        }).format(new Date(`${dateText}T12:00:00Z`));
    }

    function hideChartPoint(symbol) {
        const model = chartModels[symbol];
        if (!model) return;
        const lower = symbol.toLowerCase();
        const chart = elements[`${lower}Sparkline`];
        chart.querySelector('[data-chart-crosshair]')?.setAttribute('opacity', '0');
        chart.querySelector('[data-chart-focus]')?.setAttribute('opacity', '0');
        elements[`${lower}ChartTooltip`].hidden = true;
        elements[`${lower}ChartSummary`].textContent = model.summary;
        model.selectedIndex = null;
    }

    function showChartPoint(symbol, requestedIndex) {
        const model = chartModels[symbol];
        if (!model || !model.points.length) return;
        const lower = symbol.toLowerCase();
        const index = clamp(Math.round(requestedIndex), 0, model.points.length - 1);
        const point = model.points[index];
        const previous = index > 0 ? model.rows[index - 1].close : null;
        const sessionMove = previous ? (point.row.close / previous) - 1 : null;
        const chart = elements[`${lower}Sparkline`];
        const crosshair = chart.querySelector('[data-chart-crosshair]');
        const focus = chart.querySelector('[data-chart-focus]');
        crosshair.setAttribute('x1', point.x);
        crosshair.setAttribute('x2', point.x);
        crosshair.setAttribute('opacity', '1');
        focus.setAttribute('cx', point.x);
        focus.setAttribute('cy', point.y);
        focus.setAttribute('opacity', '1');

        const tooltip = elements[`${lower}ChartTooltip`];
        const price = document.createElement('strong');
        const detail = document.createElement('span');
        price.textContent = formatCurrency(point.row.close, 2);
        detail.textContent = `${formatDate(point.row.date, { short: true })}${Number.isFinite(sessionMove) ? ` · ${formatPercent(sessionMove)}` : ''}`;
        tooltip.replaceChildren(price, detail);
        tooltip.style.left = `${clamp((point.x / model.width) * 100, 18, 82)}%`;
        tooltip.hidden = false;
        const valueText = `${formatDate(point.row.date, { short: true })}, ${formatCurrency(point.row.close, 2)}${Number.isFinite(sessionMove) ? `, ${formatPercent(sessionMove)}` : ''}`;
        elements[`${lower}ChartSummary`].textContent = `${shortChartDate(point.row.date)} · ${formatCurrency(point.row.close, 2)}${Number.isFinite(sessionMove) ? ` · ${formatPercent(sessionMove)}` : ''}`;
        chart.setAttribute('aria-valuenow', String(index));
        chart.setAttribute('aria-valuetext', valueText);
        model.selectedIndex = index;
    }

    function renderPriceChart(symbol, record, asset) {
        const lower = symbol.toLowerCase();
        const rows = chartRows(symbol, record, asset);
        const prices = rows.map((row) => Number(row.close));
        if (prices.length < 2) return;
        const minimum = Math.min(...prices);
        const maximum = Math.max(...prices);
        const spread = maximum - minimum || Math.max(maximum * 0.02, 1);
        const width = 600;
        const top = 18;
        const bottom = 145;
        const points = prices.map((price, index) => {
            const x = 12 + ((index / (prices.length - 1)) * 576);
            const y = bottom - (((price - minimum) / spread) * (bottom - top));
            return { x, y, row: rows[index] };
        });
        const pointText = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
        const color = symbol === 'TSLA' ? '#f1d574' : '#49d6c8';
        const gradientId = `chart-fill-${symbol.toLowerCase()}`;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 600 180');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('aria-hidden', 'true');

        const defs = svgElement(svg.namespaceURI, 'defs');
        const gradient = svgElement(svg.namespaceURI, 'linearGradient', { id: gradientId, x1: '0', x2: '0', y1: '0', y2: '1' });
        gradient.append(
            svgElement(svg.namespaceURI, 'stop', { offset: '0%', 'stop-color': color, 'stop-opacity': '0.22' }),
            svgElement(svg.namespaceURI, 'stop', { offset: '100%', 'stop-color': color, 'stop-opacity': '0' })
        );
        defs.appendChild(gradient);
        const grid = svgElement(svg.namespaceURI, 'path', {
            d: 'M0 30H600 M0 81.5H600 M0 133H600',
            stroke: 'rgba(148,163,184,0.12)',
            'stroke-width': '1'
        });
        const area = svgElement(svg.namespaceURI, 'polygon', {
            points: `12,${bottom} ${pointText} 588,${bottom}`,
            fill: `url(#${gradientId})`
        });
        const line = svgElement(svg.namespaceURI, 'polyline', {
            points: pointText,
            fill: 'none',
            stroke: color,
            'stroke-width': '2.5',
            'vector-effect': 'non-scaling-stroke'
        });
        const crosshair = svgElement(svg.namespaceURI, 'line', {
            y1: top,
            y2: bottom,
            stroke: 'rgba(226,232,240,0.55)',
            'stroke-width': '1',
            opacity: '0',
            'data-chart-crosshair': ''
        });
        const focus = svgElement(svg.namespaceURI, 'circle', {
            r: '4.5',
            fill: color,
            stroke: '#07111f',
            'stroke-width': '2',
            opacity: '0',
            'data-chart-focus': ''
        });
        const startLabel = svgElement(svg.namespaceURI, 'text', {
            x: '12', y: '169', fill: 'rgba(158,172,192,0.75)', 'font-size': '10'
        });
        const endLabel = svgElement(svg.namespaceURI, 'text', {
            x: '588', y: '169', fill: 'rgba(158,172,192,0.75)', 'font-size': '10', 'text-anchor': 'end'
        });
        startLabel.textContent = shortChartDate(rows[0].date);
        endLabel.textContent = shortChartDate(rows[rows.length - 1].date);
        svg.append(defs, grid, area, line, crosshair, focus, startLabel, endLabel);
        const chart = elements[`${lower}Sparkline`];
        chart.replaceChildren(svg);
        const totalReturn = (rows[rows.length - 1].close / rows[0].close) - 1;
        const summary = `${shortChartDate(rows[0].date)}–${shortChartDate(rows[rows.length - 1].date)} · ${formatPercent(totalReturn)}`;
        chartModels[symbol] = { rows, points, width, summary, selectedIndex: null };
        chart.setAttribute('aria-valuemin', '0');
        chart.setAttribute('aria-valuemax', String(points.length - 1));
        chart.setAttribute('aria-valuenow', String(points.length - 1));
        chart.setAttribute('aria-valuetext', `${formatDate(rows[rows.length - 1].date, { short: true })}, ${formatCurrency(rows[rows.length - 1].close, 2)}`);
        elements[`${lower}ChartSummary`].textContent = summary;
        elements[`${lower}ChartTooltip`].hidden = true;
        elements.chartRangeButtons
            .filter((button) => button.dataset.chartSymbol === symbol)
            .forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.chartRange === chartRanges[symbol])));
    }

    function renderReplayAsset(symbol, replay) {
        const lower = symbol.toLowerCase();
        if (!replay) {
            elements[`${lower}ReplayMonth`].textContent = 'Insufficient history';
            return;
        }
        elements[`${lower}ReplayMonth`].textContent = `${formatMonth(replay.month)} · ${replay.sessions} sessions`;
        elements[`${lower}AdaptiveAverage`].textContent = formatCurrency(replay.adaptive.averagePrice, 2);
        elements[`${lower}FlatAverage`].textContent = formatCurrency(replay.flat.averagePrice, 2);
        elements[`${lower}AdaptiveShares`].textContent = `${formatShares(replay.adaptive.shares)} shares`;
        elements[`${lower}FlatShares`].textContent = `${formatShares(replay.flat.shares)} shares`;
        const shareDifference = replay.adaptive.shares - replay.flat.shares;
        const averageDifference = replay.adaptive.averagePrice - replay.flat.averagePrice;
        const extraNotional = shareDifference * (replay.adaptive.averagePrice || 0);
        elements[`${lower}ReplayDelta`].textContent = `${shareDifference >= 0 ? '+' : ''}${formatShares(shareDifference)} shares versus flat DCA; adaptive average was ${averageDifference <= 0 ? formatCurrency(Math.abs(averageDifference), 2) + ' lower' : formatCurrency(averageDifference, 2) + ' higher'}. ${shareDifference !== 0 ? `That is about ${formatCurrency(Math.abs(extraNotional), 0)} ${shareDifference > 0 ? 'more' : 'less'} ${symbol} at the adaptive average. ` : ''}Both deployed ${formatCurrency(replay.budget, 2)}.`;
    }

    function renderReplay(plan) {
        SYMBOLS.forEach((symbol) => {
            const replay = engine.replayCompletedMonth(
                marketData.symbols[symbol].history,
                plan.monthlyBudget * plan.allocations[symbol],
                plan.strategy
            );
            renderReplayAsset(symbol, replay);
        });
    }

    function recalculate({ persist = true, preserveStatus = false } = {}) {
        if (marketData) renderMarketHeader();
        updateAllocationOutput();
        updateRangeOutputs(strategySettings().id === 'custom');
        if (persist === true) persistControls();
        else if (persist === 'debounce') schedulePersist();
        currentPlan = buildPlan({ preserveStatus });
        if (!currentPlan) return;
        renderRecommendation(currentPlan);
        SYMBOLS.forEach((symbol) => {
            renderIndicators(symbol, currentPlan.assets[symbol]);
            renderPriceChart(symbol, marketData.symbols[symbol], currentPlan.assets[symbol]);
        });
        renderReplay(currentPlan);
        renderCatchUp();
        renderMobileLogBar();
    }

    function ledgerId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function selectedLogSymbol() {
        return elements.logSymbolRadios.find((radio) => radio.checked)?.value || 'TSLA';
    }

    function setLogSymbol(symbol) {
        (elements.logSymbolRadios || []).forEach((radio) => {
            radio.checked = radio.value === symbol;
        });
    }

    function formatChipAmount(amount) {
        return Number.isInteger(amount) ? `$${amount}` : formatCurrency(amount, 2);
    }

    function fillInput(symbol) {
        return elements[`${symbol.toLowerCase()}FillAmount`];
    }

    function suggestedFill(symbol) {
        return Number(currentPlan?.assets?.[symbol]?.recommendation?.amount) || 0;
    }

    function recordedFillAmount(symbol) {
        const input = fillInput(symbol);
        const amount = input ? numberValue(input) : suggestedFill(symbol);
        const rounded = journal ? journal.roundMoney(amount) : amount;
        return Number.isFinite(rounded) && rounded > 0 ? rounded : 0;
    }

    function recordedFillTotal() {
        return SYMBOLS.reduce((sum, symbol) => sum + recordedFillAmount(symbol), 0);
    }

    function updateFillShares(symbol) {
        const lower = symbol.toLowerCase();
        if (!elements[`${lower}Shares`]) return;
        const amount = recordedFillAmount(symbol);
        const price = Number(currentPlan?.assets?.[symbol]?.price?.value) || 0;
        const fractional = !elements.fractionalShares || elements.fractionalShares.checked;
        const shares = price > 0 ? (fractional ? amount / price : Math.floor(amount / price)) : 0;
        elements[`${lower}Shares`].textContent = `${formatShares(shares)} shares @ ${formatCurrency(price, 2)}`;
    }

    function toggleFillReset(symbol) {
        const reset = elements[`${symbol.toLowerCase()}FillReset`];
        if (reset) reset.hidden = !fillDirty[symbol];
    }

    function updateRecordTotalNote() {
        if (!elements.recordTotalNote) return;
        const suggested = SYMBOLS.reduce((sum, symbol) => sum + suggestedFill(symbol), 0);
        const recording = recordedFillTotal();
        const dirty = SYMBOLS.some((symbol) => fillDirty[symbol]);
        if (!dirty || Math.abs(recording - suggested) < 0.005) {
            elements.recordTotalNote.hidden = true;
            elements.recordTotalNote.textContent = '';
            return;
        }
        elements.recordTotalNote.hidden = false;
        elements.recordTotalNote.textContent = `Recording ${formatCurrency(recording, 2)}`;
    }

    function updateRecordButton() {
        const canAct = recordedFillTotal() > 0 && Boolean(currentPlan?.sessions?.length);
        if (elements.recordPurchase) elements.recordPurchase.disabled = !canAct;
        updateRecordTotalNote();
    }

    /** Prefill the editable amounts from the suggestion unless the user already typed. */
    function syncFillInputs(plan) {
        if (!plan) return;
        SYMBOLS.forEach((symbol) => {
            const input = fillInput(symbol);
            if (!input) return;
            if (document.activeElement !== input && !fillDirty[symbol]) {
                const amount = plan.assets[symbol].recommendation.amount;
                input.value = amount > 0
                    ? String(journal ? journal.roundMoney(amount) : amount)
                    : '0';
            }
            updateFillShares(symbol);
            toggleFillReset(symbol);
        });
        renderAssetFillChips();
        updateRecordButton();
    }

    function applyFillAmount(symbol, amount) {
        const input = fillInput(symbol);
        const dollars = journal ? journal.roundMoney(amount) : Number(amount);
        if (!input || !Number.isFinite(dollars) || dollars < 0) return;
        fillDirty[symbol] = true;
        input.value = String(dollars);
        updateFillShares(symbol);
        toggleFillReset(symbol);
        updateRecordButton();
    }

    function resetFillAmount(symbol) {
        fillDirty[symbol] = false;
        if (currentPlan) syncFillInputs(currentPlan);
    }

    function markFillDirty(symbol) {
        fillDirty[symbol] = true;
        updateFillShares(symbol);
        toggleFillReset(symbol);
        updateRecordButton();
    }

    function clearFillEdits() {
        fillDirty.TSLA = false;
        fillDirty.SPCX = false;
    }

    function renderAssetFillChips() {
        const amounts = journal
            ? journal.normalizeQuickAmounts(state.settings.quickAmounts)
            : [20, 30];
        SYMBOLS.forEach((symbol) => {
            const chips = elements[`${symbol.toLowerCase()}FillChips`];
            if (!chips) return;
            chips.replaceChildren();
            amounts.forEach((amount) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'log-chip';
                button.dataset.applyFill = String(amount);
                button.dataset.symbol = symbol;
                button.textContent = formatChipAmount(amount);
                button.setAttribute('aria-label', `Set ${symbol} to ${formatChipAmount(amount)}`);
                chips.appendChild(button);
            });
        });
    }

    /** Close used when logging a past session; otherwise the live plan price. */
    function fillPrice(symbol, date) {
        const history = marketData?.symbols?.[symbol]?.history;
        if (Array.isArray(history)) {
            const row = history.find((item) => item.date === date);
            if (row && Number(row.close) > 0) {
                return { value: Number(row.close), mode: 'session close' };
            }
        }
        const asset = currentPlan?.assets?.[symbol];
        if (asset?.price?.value > 0) {
            return {
                value: Number(asset.price.value),
                mode: asset.price.manual ? 'manual' : 'Nasdaq snapshot'
            };
        }
        return { value: 0, mode: 'unknown' };
    }

    function createTopUpChip(amount, { date, symbol, compact = false } = {}) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'log-chip';
        button.dataset.topup = String(amount);
        if (date) button.dataset.date = date;
        if (symbol) button.dataset.symbol = symbol;
        button.textContent = formatChipAmount(amount);
        const when = date ? formatDate(date, { short: true }) : 'the selected session';
        const ticker = symbol || selectedLogSymbol();
        button.setAttribute(
            'aria-label',
            compact
                ? `Record ${formatChipAmount(amount)} ${ticker}`
                : `Record ${formatChipAmount(amount)} ${ticker} on ${when}`
        );
        return button;
    }

    function renderChipButtons(container, { date, symbol, compact = false } = {}) {
        if (!container) return;
        const amounts = journal
            ? journal.normalizeQuickAmounts(state.settings.quickAmounts)
            : [20, 30];
        container.replaceChildren();
        amounts.forEach((amount) => {
            container.appendChild(createTopUpChip(amount, { date, symbol, compact }));
        });
    }

    function renderQuickChips() {
        if (!journal) return;
        state.settings.quickAmounts = journal.normalizeQuickAmounts(state.settings.quickAmounts);
        const symbol = selectedLogSymbol();
        const date = elements.logDate?.value || elements.planDate?.value;
        renderChipButtons(elements.logQuickChips, { date, symbol });
        renderChipButtons(elements.mobileQuickChips, { date, symbol, compact: true });
        renderAssetFillChips();
        if (!elements.quickAmountList) return;
        elements.quickAmountList.replaceChildren();
        state.settings.quickAmounts.forEach((amount) => {
            const item = document.createElement('span');
            item.className = 'log-chip-editor__item';
            item.append(document.createTextNode(formatChipAmount(amount)));
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.dataset.removeChip = String(amount);
            remove.setAttribute('aria-label', `Remove ${formatChipAmount(amount)} chip`);
            remove.textContent = '×';
            item.appendChild(remove);
            elements.quickAmountList.appendChild(item);
        });
    }

    function renderMobileLogBar() {
        if (!elements.mobileActionBar) return;
        const symbol = selectedLogSymbol();
        const date = elements.logDate?.value || elements.planDate?.value || newYorkDate();
        if (elements.mobileActionKicker) elements.mobileActionKicker.textContent = 'Quick log';
        if (elements.mobileActionTotal) {
            elements.mobileActionTotal.textContent = `${symbol} · ${formatDate(date, { short: true })}`;
        }
        renderChipButtons(elements.mobileQuickChips, { date, symbol, compact: true });
        elements.mobileActionBar.hidden = false;
    }

    function catchUpThroughDate(month) {
        const today = newYorkDate();
        return today.slice(0, 7) === month ? today : `${month}-31`;
    }

    function renderCatchUp() {
        if (!elements.catchUpList || !engine || !journal) return;
        const month = monthKey();
        const sessions = engine.tradingSessionsInMonth(`${month}-01`);
        const rows = journal.catchUpRows({
            sessions,
            throughDate: catchUpThroughDate(month),
            ledger: state.ledger,
            symbols: SYMBOLS
        });
        const missedRows = rows.filter((row) => row.missed);
        const filledRows = rows.filter((row) => !row.missed);
        const visible = catchUpShowAll
            ? rows
            : (missedRows.length ? missedRows : filledRows.slice(0, CATCH_UP_PREVIEW));
        if (elements.catchUpSummary) {
            elements.catchUpSummary.textContent = rows.length
                ? (missedRows.length
                    ? `${missedRows.length} missed session${missedRows.length === 1 ? '' : 's'} through ${formatDate(catchUpThroughDate(month), { short: true })}.`
                    : `Caught up through ${formatDate(catchUpThroughDate(month), { short: true })}.`)
                : 'No U.S. sessions in this month yet.';
        }
        if (elements.catchUpShowAll) {
            const hiddenFills = !catchUpShowAll && filledRows.length && missedRows.length;
            elements.catchUpShowAll.hidden = catchUpShowAll || !hiddenFills;
            elements.catchUpShowAll.textContent = `Show ${filledRows.length} filled session${filledRows.length === 1 ? '' : 's'} too`;
        }
        elements.catchUpList.replaceChildren();
        visible.forEach((row) => {
            const card = document.createElement('article');
            card.className = `catchup-row${row.missed ? ' is-missed' : ''}`;
            card.dataset.date = row.date;
            const select = document.createElement('button');
            select.type = 'button';
            select.className = 'catchup-row__date';
            select.dataset.catchupSelect = row.date;
            const title = document.createElement('strong');
            title.textContent = formatDate(row.date, { short: true });
            const status = document.createElement('span');
            status.textContent = row.missed ? 'Missed' : `${formatCurrency(row.recorded, 0)} recorded`;
            select.append(title, status);
            const assets = document.createElement('div');
            assets.className = 'catchup-row__assets';
            SYMBOLS.forEach((symbol) => {
                const block = document.createElement('div');
                block.className = 'catchup-asset';
                const label = document.createElement('div');
                label.className = 'catchup-asset__label';
                const name = document.createElement('span');
                name.textContent = symbol;
                const spent = document.createElement('small');
                spent.textContent = formatCurrency(row.fills[symbol] || 0, 2);
                label.append(name, spent);
                const chips = document.createElement('div');
                chips.className = 'log-chips';
                renderChipButtons(chips, { date: row.date, symbol });
                block.append(label, chips);
                assets.appendChild(block);
            });
            card.append(select, assets);
            elements.catchUpList.appendChild(card);
        });
        if (!rows.length) {
            const empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'Change the plan date to a month that already has U.S. sessions.';
            elements.catchUpList.appendChild(empty);
        }
    }

    function selectCatchUpDate(date, symbol) {
        if (elements.logDate) elements.logDate.value = date;
        if (symbol) setLogSymbol(symbol);
        renderQuickChips();
        renderMobileLogBar();
        elements.logAmount?.focus();
    }

    /**
     * Record dollars actually sent. Chip taps call this immediately; it never
     * places a brokerage order and does not confirm first.
     */
    function recordFill(amount, { date, symbol } = {}) {
        if (!journal) return;
        let fillDate = date || elements.logDate?.value || elements.planDate.value;
        if (!isCalendarDate(fillDate)) {
            showStatus('Choose a valid session date before logging a fill.', 'error');
            return;
        }
        if (engine && !engine.isTradingDay(fillDate)) {
            const snapped = engine.nextTradingDay(fillDate);
            fillDate = snapped;
            if (elements.logDate) elements.logDate.value = snapped;
        }
        const fillSymbol = symbol || selectedLogSymbol();
        const dollars = journal.roundMoney(amount);
        if (!(dollars > 0)) {
            showStatus('Enter the dollar amount you actually invested.', 'error');
            return;
        }
        const quote = fillPrice(fillSymbol, fillDate);
        const fractional = elements.fractionalShares ? elements.fractionalShares.checked : true;
        const shares = quote.value > 0
            ? (fractional ? dollars / quote.value : Math.floor(dollars / quote.value))
            : 0;
        const entry = journal.addFill(state, {
            id: ledgerId(),
            date: fillDate,
            symbol: fillSymbol,
            amount: dollars,
            price: quote.value,
            shares,
            priceMode: quote.mode
        });
        if (!entry) {
            showStatus('That fill could not be recorded.', 'error');
            return;
        }
        saveState();
        loadMonthInputs();
        renderJournal();
        renderCatchUp();
        renderQuickChips();
        recalculate();
        const row = elements.catchUpList?.querySelector(`[data-date="${fillDate}"]`);
        if (row) {
            row.classList.add('is-just-logged');
            window.setTimeout(() => row.classList.remove('is-just-logged'), 900);
        }
        showStatus(
            `Logged ${formatCurrency(dollars, 2)} ${fillSymbol} on ${formatDate(fillDate, { short: true })}. No brokerage order was placed.`,
            'info'
        );
    }

    function handleLogChipClick(event) {
        const chip = event.target.closest('[data-topup]');
        if (!chip) return;
        event.preventDefault();
        recordFill(Number(chip.dataset.topup), {
            date: chip.dataset.date,
            symbol: chip.dataset.symbol
        });
    }

    function addQuickAmount(raw) {
        if (!journal) return;
        const next = journal.normalizeQuickAmounts([
            ...state.settings.quickAmounts,
            raw
        ]);
        if (next.length === state.settings.quickAmounts.length
            && next.every((amount, index) => amount === state.settings.quickAmounts[index])) {
            showStatus('Use a unique amount between $1 and $10,000. At most six chips.', 'error');
            return;
        }
        state.settings.quickAmounts = next;
        saveState();
        renderQuickChips();
        renderCatchUp();
        renderMobileLogBar();
        if (elements.quickAmountInput) elements.quickAmountInput.value = '';
        showStatus(`Quick chips are now ${next.map(formatChipAmount).join(', ')}.`, 'info');
    }

    function removeQuickAmount(raw) {
        if (!journal) return;
        const amount = journal.roundMoney(raw);
        state.settings.quickAmounts = journal.normalizeQuickAmounts(
            state.settings.quickAmounts.filter((value) => value !== amount)
        );
        saveState();
        renderQuickChips();
        renderCatchUp();
        renderMobileLogBar();
    }

    function resetQuickAmounts() {
        if (!journal) return;
        state.settings.quickAmounts = journal.DEFAULT_QUICK_AMOUNTS.slice();
        saveState();
        renderQuickChips();
        renderCatchUp();
        renderMobileLogBar();
        showStatus('Restored the $20 and $30 eToro-style chips.', 'info');
    }

    function applyCloudJournal(remote) {
        if (!journal || !remote) return;
        const merged = journal.mergeJournalState(state, remote);
        applyingCloud = true;
        state.settings = merged.settings;
        state.months = merged.months;
        state.ledger = merged.ledger;
        state.updatedAt = merged.updatedAt;
        applySavedSettings({ keepPlanDate: true });
        renderJournal();
        renderCatchUp();
        recalculate({ persist: true, preserveStatus: true });
        applyingCloud = false;
        saveState();
    }

    function renderCloudStatus(kind, message) {
        if (elements.cloudStatus) elements.cloudStatus.textContent = message;
        const signedIn = Boolean(cloud && cloud.user && cloud.user());
        if (elements.cloudSignIn) elements.cloudSignIn.hidden = signedIn;
        if (elements.cloudSignOut) elements.cloudSignOut.hidden = !signedIn;
        if (kind === 'error') {
            showStatus(message, 'error');
        }
    }

    function sessionAlreadyRecorded(date) {
        return state.ledger.some((entry) => entry.date === date);
    }

    function advancePlanDate(fromDate) {
        try {
            const next = engine.nextTradingDay(fromDate, { inclusive: false });
            if (next.slice(0, 7) === fromDate.slice(0, 7)) {
                elements.planDate.value = next;
            }
        } catch (error) {
            console.warn('[DCA Lab] Could not advance the plan date.', error);
        }
    }

    function recordPurchase() {
        if (!currentPlan || !currentPlan.sessions.length) return;
        const date = currentPlan.sessions[0];
        if (sessionAlreadyRecorded(date)) {
            const confirmed = window.confirm(
                `A purchase is already recorded for ${formatDate(date, { short: true })}. Record another for the same session?`
            );
            if (!confirmed) return;
        }
        const recorded = [];
        const batchId = ledgerId();
        const fractional = !elements.fractionalShares || elements.fractionalShares.checked;
        SYMBOLS.forEach((symbol) => {
            const asset = currentPlan.assets[symbol];
            const amount = recordedFillAmount(symbol);
            if (!(amount > 0)) return;
            const price = Number(asset.price.value) || 0;
            const shares = price > 0 ? (fractional ? amount / price : Math.floor(amount / price)) : 0;
            const entry = journal
                ? journal.addFill(state, {
                    id: ledgerId(),
                    batchId,
                    date,
                    symbol,
                    amount,
                    price,
                    shares,
                    multiplier: asset.recommendation.appliedMultiplier,
                    priceMode: asset.price.manual ? 'manual' : 'Nasdaq snapshot'
                })
                : null;
            if (entry) recorded.push(symbol);
        });
        if (!recorded.length) return;
        clearFillEdits();
        saveState();
        advancePlanDate(date);
        loadMonthInputs();
        renderJournal();
        recalculate();
        showStatus(`Recorded ${recorded.join(' and ')} in this browser journal. No brokerage order was placed.`, 'info');
    }

    function applyLedgerRemoval(entry) {
        const entryMonth = entry.date.slice(0, 7);
        if (state.months[entryMonth]) {
            state.months[entryMonth][entry.symbol] = Math.max(
                0,
                Number(state.months[entryMonth][entry.symbol] || 0) - Number(entry.amount || 0)
            );
        }
        state.ledger = state.ledger.filter((candidate) => candidate.id !== entry.id);
        return entryMonth;
    }

    function deleteEntry(id) {
        const entry = state.ledger.find((candidate) => candidate.id === id);
        if (!entry) return;
        const entryMonth = applyLedgerRemoval(entry);
        saveState();
        if (entryMonth === monthKey()) loadMonthInputs();
        renderJournal();
        recalculate();
        showStatus('Journal entry removed and the month-to-date total was adjusted.', 'info');
    }

    function undoLastRecording() {
        if (!state.ledger.length) return;
        const last = state.ledger[state.ledger.length - 1];
        const batch = last.batchId
            ? state.ledger.filter((entry) => entry.batchId === last.batchId)
            : [last];
        let touchedCurrentMonth = false;
        batch.forEach((entry) => {
            const entryMonth = applyLedgerRemoval(entry);
            if (entryMonth === monthKey()) touchedCurrentMonth = true;
        });
        saveState();
        if (touchedCurrentMonth) loadMonthInputs();
        renderJournal();
        recalculate();
        showStatus('Last recorded session was removed from this browser journal.', 'info');
    }

    function renderJournal() {
        elements.journalBody.replaceChildren();
        const currentMonth = monthKey();
        const monthRows = state.ledger.filter((entry) => String(entry.date || '').startsWith(currentMonth));
        const sourceRows = (journalThisMonthOnly ? monthRows : state.ledger)
            .map((entry, index) => ({ entry, index }))
            .sort((left, right) => (
                right.entry.date.localeCompare(left.entry.date) || right.index - left.index
            ))
            .map(({ entry }) => entry);
        const rows = sourceRows.slice(0, MAX_RENDERED_JOURNAL_ROWS);
        if (elements.journalScope) {
            elements.journalScope.setAttribute('aria-pressed', String(journalThisMonthOnly));
            elements.journalScope.textContent = journalThisMonthOnly
                ? `This month (${monthRows.length})`
                : `All entries (${state.ledger.length})`;
        }
        elements.journalEmpty.hidden = rows.length > 0;
        elements.journalEmpty.textContent = state.ledger.length
            ? 'No purchases recorded in this month. Switch to all entries to see older sessions.'
            : 'No purchases recorded yet. Use a one-tap chip or Log fill above.';
        renderCatchUp();
        renderQuickChips();
        if (elements.journalSummary) {
            const spent = monthRows.reduce((total, entry) => total + Number(entry.amount || 0), 0);
            const sessions = new Set(monthRows.map((entry) => entry.date)).size;
            const summary = monthRows.length
                ? `${formatMonth(currentMonth)}: ${formatCurrency(spent, 2)} recorded across ${sessions} session${sessions === 1 ? '' : 's'} (${monthRows.length} fill${monthRows.length === 1 ? '' : 's'}).`
                : `${formatMonth(currentMonth)}: no fills recorded yet.`;
            elements.journalSummary.textContent = sourceRows.length > rows.length
                ? `${summary} Showing latest ${rows.length} of ${sourceRows.length} entries.`
                : summary;
        }
        const sessionDate = currentPlan?.sessions?.[0] || elements.planDate.value;
        rows.forEach((entry) => {
            const row = document.createElement('tr');
            if (entry.date === sessionDate) row.classList.add('is-session');
            [
                formatDate(entry.date, { short: true }),
                entry.symbol,
                formatCurrency(entry.amount, 2),
                formatCurrency(entry.price, 2),
                formatShares(entry.shares)
            ].forEach((value) => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });
            const actionCell = document.createElement('td');
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = 'Undo';
            button.setAttribute('aria-label', `Remove ${entry.symbol} journal entry from ${entry.date}`);
            button.addEventListener('click', () => deleteEntry(entry.id));
            actionCell.appendChild(button);
            row.appendChild(actionCell);
            elements.journalBody.appendChild(row);
        });
    }

    function csvCell(value) {
        const text = String(value ?? '');
        return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    }

    function exportJournal() {
        if (!state.ledger.length) {
            showStatus('There are no journal entries to export.', 'info');
            return;
        }
        const rows = [
            ['date', 'symbol', 'dollars_usd', 'price_usd', 'shares', 'signal_multiplier', 'price_mode'],
            ...state.ledger.map((entry) => [
                entry.date, entry.symbol, entry.amount, entry.price, entry.shares,
                entry.multiplier, entry.priceMode
            ])
        ];
        const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n'], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `conviction-dca-journal-${newYorkDate()}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function resetMonth() {
        const currentMonth = monthKey();
        if (!window.confirm(`Reset contribution totals and recorded entries for ${formatMonth(currentMonth)}?`)) return;
        delete state.months[currentMonth];
        state.ledger = state.ledger.filter((entry) => !entry.date.startsWith(currentMonth));
        saveState();
        loadMonthInputs();
        renderJournal();
        recalculate();
        showStatus(`${formatMonth(currentMonth)} was reset in this browser.`, 'info');
    }

    function splitCsvLine(line) {
        const out = [];
        let current = '';
        let quoted = false;
        for (let index = 0; index < line.length; index += 1) {
            const character = line[index];
            if (quoted) {
                if (character === '"' && line[index + 1] === '"') {
                    current += '"';
                    index += 1;
                } else if (character === '"') {
                    quoted = false;
                } else {
                    current += character;
                }
            } else if (character === '"') {
                quoted = true;
            } else if (character === ',') {
                out.push(current);
                current = '';
            } else {
                current += character;
            }
        }
        out.push(current);
        return out;
    }

    function importJournalText(text) {
        const source = String(text || '');
        if (source.length > MAX_CSV_TEXT_CHARS) {
            throw new Error('Import decoded CSV text up to 1,000,000 characters.');
        }
        const lines = source.replace(/^\uFEFF/, '').trim().split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) throw new Error('The CSV file did not contain any rows.');
        if (lines.length > 10_001) throw new Error('Import at most 10,000 journal rows at a time.');
        const header = splitCsvLine(lines[0]).map((cell) => cell.trim());
        const indexOf = (name) => header.indexOf(name);
        const dateIndex = indexOf('date');
        const symbolIndex = indexOf('symbol');
        const amountIndex = indexOf('dollars_usd');
        const priceIndex = indexOf('price_usd');
        const sharesIndex = indexOf('shares');
        if (dateIndex < 0 || symbolIndex < 0 || amountIndex < 0) {
            throw new Error('CSV must include date, symbol, and dollars_usd columns.');
        }
        let imported = 0;
        const importBatchId = `import-${ledgerId()}`;
        lines.slice(1).forEach((line) => {
            const cells = splitCsvLine(line);
            const date = String(cells[dateIndex] || '').slice(0, 10);
            const symbol = String(cells[symbolIndex] || '').toUpperCase();
            const amount = Number(cells[amountIndex]);
            if (!isCalendarDate(date) || !SYMBOLS.includes(symbol) || !Number.isFinite(amount) || amount <= 0) {
                return;
            }
            const parsedShares = Number(cells[sharesIndex]);
            const shares = Number.isFinite(parsedShares) && parsedShares >= 0 ? parsedShares : 0;
            const duplicate = state.ledger.some((entry) => (
                entry.date === date
                && entry.symbol === symbol
                && Number(entry.amount) === amount
                && Number(entry.shares || 0) === shares
            ));
            if (duplicate) return;
            const month = date.slice(0, 7);
            state.ledger.push({
                id: ledgerId(),
                batchId: importBatchId,
                date,
                symbol,
                amount,
                price: Math.max(0, Number(cells[priceIndex]) || 0),
                shares,
                multiplier: 1,
                priceMode: 'imported'
            });
            state.months[month] = state.months[month] || { TSLA: 0, SPCX: 0 };
            state.months[month][symbol] = Number(state.months[month][symbol] || 0) + amount;
            imported += 1;
        });
        if (!imported) throw new Error('No new rows were imported.');
        saveState();
        loadMonthInputs();
        renderJournal();
        recalculate();
        showStatus(`Imported ${imported} journal row${imported === 1 ? '' : 's'} into this browser.`, 'info');
    }

    function isTypingTarget(target) {
        if (!target || !target.tagName) return false;
        const tag = target.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
    }

    function bindAutoHideNav() {
        const nav = elements.dcaNav;
        if (!nav) return;
        let lastScrollY = Math.max(0, window.scrollY);
        let ticking = false;
        function handleScroll() {
            const scrollY = Math.max(0, window.scrollY);
            const delta = scrollY - lastScrollY;
            if (scrollY <= 16 || delta < 0 || nav.matches(':focus-within')) {
                nav.classList.remove('is-scroll-hidden');
            } else if (delta > 0 && scrollY > nav.offsetHeight) {
                nav.classList.add('is-scroll-hidden');
            }
            lastScrollY = scrollY;
            ticking = false;
        }
        function queueUpdate() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(handleScroll);
        }
        nav.addEventListener('focusin', () => nav.classList.remove('is-scroll-hidden'));
        window.addEventListener('scroll', queueUpdate, { passive: true });
        handleScroll();
    }

    function bindEvents() {
        const immediateInputs = [
            elements.monthlyBudget, elements.tslaInvested, elements.spcxInvested,
            elements.fractionalShares, elements.tslaPrice, elements.spcxPrice
        ];
        immediateInputs.forEach((element) => element.addEventListener('input', () => recalculate()));
        elements.tslaAllocation.addEventListener('input', () => recalculate({ persist: 'debounce' }));
        elements.planDate.addEventListener('change', () => {
            const snapped = snapPlanDate();
            if (elements.logDate) elements.logDate.value = elements.planDate.value;
            clearFillEdits();
            loadMonthInputs();
            recalculate();
            if (snapped) {
                showStatus(`Weekend and holiday dates snap to the next U.S. session (${formatDate(snapped, { short: true })}).`, 'info');
            }
        });
        elements.strategyRadios.forEach((radio) => {
            radio.addEventListener('change', () => {
                applyStrategyPreset(radio.value);
                recalculate();
            });
        });
        [elements.floorMultiplier, elements.dipSensitivity, elements.maxMultiplier].forEach((element) => {
            element.addEventListener('input', () => {
                updateRangeOutputs(true);
                recalculate({ persist: 'debounce' });
            });
        });
        [elements.tslaManualToggle, elements.spcxManualToggle].forEach((toggle) => {
            toggle.addEventListener('change', () => {
                updatePriceControls();
                recalculate();
            });
        });
        elements.chartRangeButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const symbol = button.dataset.chartSymbol;
                chartRanges[symbol] = button.dataset.chartRange;
                if (currentPlan) renderPriceChart(symbol, marketData.symbols[symbol], currentPlan.assets[symbol]);
            });
        });
        SYMBOLS.forEach((symbol) => {
            const lower = symbol.toLowerCase();
            const chart = elements[`${lower}Sparkline`];
            const inspectPointer = (event) => {
                const model = chartModels[symbol];
                if (!model) return;
                const bounds = chart.getBoundingClientRect();
                const ratio = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
                showChartPoint(symbol, ratio * (model.points.length - 1));
            };
            chart.addEventListener('pointerdown', inspectPointer);
            chart.addEventListener('pointermove', inspectPointer);
            chart.addEventListener('pointerleave', (event) => {
                if (event.pointerType !== 'touch') hideChartPoint(symbol);
            });
            chart.addEventListener('focus', () => {
                const model = chartModels[symbol];
                if (model) showChartPoint(symbol, model.selectedIndex ?? model.points.length - 1);
            });
            chart.addEventListener('blur', () => hideChartPoint(symbol));
            chart.addEventListener('keydown', (event) => {
                const model = chartModels[symbol];
                if (!model) return;
                const current = model.selectedIndex ?? model.points.length - 1;
                let next = current;
                if (event.key === 'ArrowLeft') next = current - 1;
                else if (event.key === 'ArrowRight') next = current + 1;
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = model.points.length - 1;
                else if (event.key === 'Escape') {
                    hideChartPoint(symbol);
                    return;
                } else return;
                event.preventDefault();
                showChartPoint(symbol, next);
            });
        });
        if (elements.dcaForm) {
            elements.dcaForm.addEventListener('submit', (event) => event.preventDefault());
        }
        (elements.allocationPresets || []).forEach((button) => {
            button.addEventListener('click', () => {
                elements.tslaAllocation.value = button.dataset.alloc;
                recalculate();
            });
        });
        if (elements.resetPrices) elements.resetPrices.addEventListener('click', resetSnapshotPrices);
        elements.recordPurchase.addEventListener('click', recordPurchase);
        if (elements.undoLast) elements.undoLast.addEventListener('click', undoLastRecording);
        if (elements.jumpToday) elements.jumpToday.addEventListener('click', jumpToToday);
        SYMBOLS.forEach((symbol) => {
            const lower = symbol.toLowerCase();
            const input = elements[`${lower}FillAmount`];
            if (input) {
                input.addEventListener('input', () => markFillDirty(symbol));
            }
            const reset = elements[`${lower}FillReset`];
            if (reset) {
                reset.addEventListener('click', () => resetFillAmount(symbol));
            }
            const chips = elements[`${lower}FillChips`];
            if (chips) {
                chips.addEventListener('click', (event) => {
                    const chip = event.target.closest('[data-apply-fill]');
                    if (!chip) return;
                    applyFillAmount(chip.dataset.symbol, Number(chip.dataset.applyFill));
                });
            }
        });
        if (elements.logFillForm) {
            elements.logFillForm.addEventListener('submit', (event) => {
                event.preventDefault();
                recordFill(numberValue(elements.logAmount));
            });
        }
        (elements.logSymbolRadios || []).forEach((radio) => {
            radio.addEventListener('change', () => {
                renderQuickChips();
                renderMobileLogBar();
            });
        });
        if (elements.logDate) {
            elements.logDate.addEventListener('change', () => {
                if (engine && isCalendarDate(elements.logDate.value) && !engine.isTradingDay(elements.logDate.value)) {
                    elements.logDate.value = engine.nextTradingDay(elements.logDate.value);
                }
                renderQuickChips();
                renderMobileLogBar();
            });
        }
        if (elements.logQuickChips) elements.logQuickChips.addEventListener('click', handleLogChipClick);
        if (elements.mobileQuickChips) elements.mobileQuickChips.addEventListener('click', handleLogChipClick);
        if (elements.catchUpList) {
            elements.catchUpList.addEventListener('click', (event) => {
                const select = event.target.closest('[data-catchup-select]');
                if (select) {
                    selectCatchUpDate(select.dataset.catchupSelect);
                    return;
                }
                handleLogChipClick(event);
            });
        }
        if (elements.catchUpShowAll) {
            elements.catchUpShowAll.addEventListener('click', () => {
                catchUpShowAll = true;
                renderCatchUp();
            });
        }
        if (elements.addQuickAmount) {
            elements.addQuickAmount.addEventListener('click', () => addQuickAmount(numberValue(elements.quickAmountInput)));
        }
        if (elements.resetQuickAmounts) {
            elements.resetQuickAmounts.addEventListener('click', resetQuickAmounts);
        }
        if (elements.quickAmountList) {
            elements.quickAmountList.addEventListener('click', (event) => {
                const remove = event.target.closest('[data-remove-chip]');
                if (remove) removeQuickAmount(Number(remove.dataset.removeChip));
            });
        }
        if (elements.cloudSignIn) {
            elements.cloudSignIn.addEventListener('click', async () => {
                if (!cloud || typeof cloud.signIn !== 'function') {
                    showStatus('Google sync is unavailable in this browser. Fills still save here.', 'error');
                    return;
                }
                try {
                    await cloud.signIn();
                } catch (error) {
                    if (error && error.code === 'auth/popup-closed-by-user') return;
                    console.warn('[DCA Lab] Google sign-in failed.', error);
                    showStatus('Google sign-in was blocked or cancelled. The journal still works on this device.', 'error');
                }
            });
        }
        if (elements.cloudSignOut) {
            elements.cloudSignOut.addEventListener('click', () => {
                cloud.signOut().catch((error) => {
                    console.warn('[DCA Lab] Sign-out failed.', error);
                });
            });
        }
        if (elements.journalScope) {
            elements.journalScope.addEventListener('click', () => {
                journalThisMonthOnly = !journalThisMonthOnly;
                renderJournal();
            });
        }
        if (elements.importJournalButton && elements.importJournal) {
            elements.importJournalButton.addEventListener('click', () => elements.importJournal.click());
            elements.importJournal.addEventListener('change', async (event) => {
                const file = event.target.files && event.target.files[0];
                event.target.value = '';
                if (!file) return;
                try {
                    if (file.size > MAX_CSV_FILE_BYTES) {
                        throw new Error('Import CSV files up to 1 MB.');
                    }
                    importJournalText(await file.text());
                } catch (error) {
                    showStatus(error.message || 'The CSV file could not be imported.', 'error');
                }
            });
        }
        elements.exportJournal.addEventListener('click', exportJournal);
        elements.resetMonth.addEventListener('click', resetMonth);
        window.addEventListener('keydown', (event) => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
            if (isTypingTarget(event.target)) return;
            const key = event.key.toLowerCase();
            if (key === 't') {
                event.preventDefault();
                jumpToToday();
            } else if (key === 'r') {
                event.preventDefault();
                recordPurchase();
            }
        });
        if (elements.refreshQuotes) {
            elements.refreshQuotes.addEventListener('click', () => refreshLiveQuotes({ force: true }));
        }
        if (elements.enableRealtime) {
            elements.enableRealtime.addEventListener('click', openRealtimeDialog);
        }
        if (elements.closeRealtime) {
            elements.closeRealtime.addEventListener('click', () => elements.realtimeDialog.close());
        }
        if (elements.realtimeDialog) {
            elements.realtimeDialog.addEventListener('click', (event) => {
                if (event.target === elements.realtimeDialog) elements.realtimeDialog.close();
            });
        }
        if (elements.realtimeForm) {
            elements.realtimeForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const credentials = {
                    keyId: elements.alpacaKeyId.value.trim(),
                    secret: elements.alpacaSecret.value.trim(),
                    feed: elements.alpacaFeed.value === 'sip' ? 'sip' : 'iex'
                };
                if (!credentials.keyId || !credentials.secret) {
                    setRealtimeUi('error', 'Enter both your Alpaca key ID and secret key.');
                    return;
                }
                try {
                    if (elements.rememberRealtime.checked) {
                        sessionStorage.setItem(REALTIME_SESSION_KEY, JSON.stringify(credentials));
                    } else {
                        sessionStorage.removeItem(REALTIME_SESSION_KEY);
                    }
                } catch (error) {
                    setRealtimeUi('error', 'This browser could not save a tab-only session. You can still connect.');
                }
                startRealtime(credentials);
            });
        }
        if (elements.disconnectRealtime) {
            elements.disconnectRealtime.addEventListener('click', () => stopRealtime());
        }
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (quoteTimer) window.clearTimeout(quoteTimer);
                return;
            }
            refreshLiveQuotes().finally(scheduleQuotePoll);
        });
        window.addEventListener('pagehide', () => {
            flushPersist();
            if (clockTimer) window.clearInterval(clockTimer);
            if (quoteTimer) window.clearTimeout(quoteTimer);
            if (realtimeStream) stopRealtime({ forget: false, restoreFallback: false });
        });
    }

    async function loadMarketData() {
        const response = await fetch(DATA_PATH, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Market snapshot returned ${response.status}`);
        const payload = await response.json();
        if (payload.schemaVersion !== 1 || !payload.symbols?.TSLA || !payload.symbols?.SPCX) {
            throw new Error('Market snapshot has an unsupported format');
        }
        return payload;
    }

    async function init() {
        if (!engine) {
            console.error('[DCA Lab] Calculation engine did not load.');
            return;
        }
        cacheElements();
        applySavedSettings();
        applyQueryOverrides();
        const snappedOnLoad = snapPlanDate();
        if (elements.logDate) elements.logDate.value = elements.planDate.value;
        loadMonthInputs();
        bindEvents();
        bindAutoHideNav();
        if (window.location.hash === '#planner' && elements.monthlyBudget) {
            elements.monthlyBudget.focus();
        }
        renderJournal();
        renderCatchUp();
        renderQuickChips();
        renderMobileLogBar();
        if (cloud && typeof cloud.init === 'function') {
            cloud.init({
                onUser() {
                    const signedIn = Boolean(cloud.user && cloud.user());
                    if (elements.cloudSignIn) elements.cloudSignIn.hidden = signedIn;
                    if (elements.cloudSignOut) elements.cloudSignOut.hidden = !signedIn;
                },
                onRemote: applyCloudJournal,
                onStatus: renderCloudStatus
            });
        }
        try {
            marketData = await loadMarketData();
            renderMarketHeader();
            clockTimer = window.setInterval(renderMarketClock, 30_000);
            recalculate({ persist: false });
            const savedRealtime = readRealtimeSession();
            refreshLiveQuotes().finally(() => {
                if (savedRealtime) startRealtime(savedRealtime);
                else scheduleQuotePoll();
            });
            const investedOverCap = currentPlan
                && (currentPlan.invested.TSLA + currentPlan.invested.SPCX) - currentPlan.monthlyBudget > 0.005;
            if (investedOverCap) {
                // Over-cap status is already shown by renderRecommendation.
            } else if (snappedOnLoad) {
                showStatus(`Plan date snapped to ${formatDate(snappedOnLoad, { short: true })}, the next U.S. trading session.`, 'info');
            } else if (quoteAgeHours() > 96 && quoteFeed.source === 'snapshot') {
                showStatus('The automatic market snapshot is more than four days old. Live quotes will replace it if this network can reach a last-sale feed; otherwise turn on Manual price.', 'info');
            }
        } catch (error) {
            console.error('[DCA Lab]', error);
            showStatus('Market data could not be loaded. Refresh the page or try again later. No recommendation was calculated.');
            elements.marketFreshness.textContent = 'Unavailable';
            elements.marketTimestamp.textContent = 'No recommendation calculated';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
}());
