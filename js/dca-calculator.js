(function () {
    'use strict';

    const DATA_PATH = '../data/dca_market_history.json';
    const STORAGE_KEY = 'alphaeus-conviction-dca-lab-v1';
    const SYMBOLS = ['TSLA', 'SPCX'];
    const engine = window.DcaEngine;

    const elements = {};
    let marketData = null;
    let currentPlan = null;
    let state = loadState();

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
            'calculatorStatus', 'nextSessionLabel', 'dataConfidence',
            'totalRecommendation', 'recommendationSummary', 'budgetInvested',
            'budgetRemaining', 'budgetProgressFill', 'tslaRecommendation',
            'spcxRecommendation', 'tslaShares', 'spcxShares', 'tslaBaseline',
            'spcxBaseline', 'tslaMultiplier', 'spcxMultiplier', 'tslaRemaining',
            'spcxRemaining', 'tslaSignalBadge', 'spcxSignalBadge',
            'recommendationReasons', 'recordPurchase', 'copyPlan', 'heroTslaPrice',
            'heroSpcxPrice', 'heroTslaMove', 'heroSpcxMove', 'marketFreshness',
            'marketTimestamp', 'tslaConfidenceBadge', 'spcxConfidenceBadge',
            'tslaIndicators', 'spcxIndicators', 'tslaSparkline', 'spcxSparkline',
            'tslaReplayMonth', 'spcxReplayMonth', 'tslaAdaptiveAverage',
            'spcxAdaptiveAverage', 'tslaFlatAverage', 'spcxFlatAverage',
            'tslaAdaptiveShares', 'spcxAdaptiveShares', 'tslaFlatShares',
            'spcxFlatShares', 'tslaReplayDelta', 'spcxReplayDelta', 'journalBody',
            'journalEmpty', 'exportJournal', 'resetMonth'
        ].forEach((id) => { elements[id] = byId(id); });
        elements.strategyRadios = Array.from(document.querySelectorAll('input[name="strategy"]'));
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
                manualPrices: {
                    TSLA: { enabled: false, value: null },
                    SPCX: { enabled: false, value: null }
                }
            },
            months: {},
            ledger: []
        };
    }

    function loadState() {
        const fallback = defaultState();
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!saved || typeof saved !== 'object') return fallback;
            return {
                settings: {
                    ...fallback.settings,
                    ...(saved.settings || {}),
                    manualPrices: {
                        ...fallback.settings.manualPrices,
                        ...((saved.settings || {}).manualPrices || {})
                    }
                },
                months: saved.months && typeof saved.months === 'object' ? saved.months : {},
                ledger: Array.isArray(saved.ledger) ? saved.ledger : []
            };
        } catch (error) {
            console.warn('[DCA Lab] Browser state could not be loaded.', error);
            return fallback;
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('[DCA Lab] Browser state could not be saved.', error);
            showStatus('Your browser blocked local saving. The current calculation still works.', 'error');
        }
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
        return {
            id: selectedStrategyId(),
            label: selectedStrategyId() === 'balanced' ? 'Balanced' : selectedStrategyId(),
            floorMultiplier: numberValue(elements.floorMultiplier, 0.7),
            dipSensitivity: numberValue(elements.dipSensitivity, 1.35),
            maxMultiplier: numberValue(elements.maxMultiplier, 2.25)
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

    function applySavedSettings() {
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
        elements.planDate.value = newYorkDate();
        updateRangeOutputs();
        updateAllocationOutput();
        updatePriceControls();
        loadMonthInputs();
    }

    function updateAllocationOutput() {
        const tsla = clamp(numberValue(elements.tslaAllocation, 70), 0, 100);
        elements.allocationOutput.textContent = `TSLA ${tsla}% · SPCX ${100 - tsla}%`;
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

    function renderMarketHeader() {
        SYMBOLS.forEach((symbol) => {
            const lower = symbol.toLowerCase();
            const quote = marketData.symbols[symbol].quote;
            elements[`hero${symbol === 'TSLA' ? 'Tsla' : 'Spcx'}Price`].textContent = formatCurrency(quote.price, 2);
            const move = elements[`hero${symbol === 'TSLA' ? 'Tsla' : 'Spcx'}Move`];
            move.textContent = formatPercent(quote.percentChange, 2);
            move.className = `market-move ${quote.percentChange >= 0 ? 'is-up' : 'is-down'}`;
            elements[`${lower}PriceMeta`].textContent = `Nasdaq snapshot · ${formatQuoteTimestamp(quote)} · ${quote.marketStatus}`;
            if (!elements[`${lower}ManualToggle`].checked) {
                elements[`${lower}Price`].value = String(quote.price);
            }
        });
        const age = quoteAgeHours();
        let freshness = 'Fresh snapshot';
        if (age > 96) freshness = 'Stale · use manual price';
        else if (age > 26) freshness = 'Prior market snapshot';
        elements.marketFreshness.textContent = freshness;
        elements.marketTimestamp.textContent = `Generated ${new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
        }).format(new Date(marketData.generatedAt))}`;
        updatePriceControls();
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

    function buildPlan() {
        if (!marketData) return null;
        const errors = validateInputs();
        if (errors.length) {
            showStatus(errors.join(' '));
            return null;
        }
        clearStatus();
        const monthlyBudget = numberValue(elements.monthlyBudget);
        const tslaAllocation = clamp(numberValue(elements.tslaAllocation), 0, 100) / 100;
        const allocations = { TSLA: tslaAllocation, SPCX: 1 - tslaAllocation };
        const invested = {
            TSLA: Math.max(0, numberValue(elements.tslaInvested)),
            SPCX: Math.max(0, numberValue(elements.spcxInvested))
        };
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
            const recommendation = engine.recommendAsset({
                monthlyBudget: targetBudget,
                invested: invested[symbol],
                daysRemaining: sessions.length,
                price: price.value,
                signalMultiplier: signal.multiplier,
                floorMultiplier: strategy.floorMultiplier,
                maxMultiplier: strategy.maxMultiplier,
                fractional: elements.fractionalShares.checked
            });
            assets[symbol] = { record, price, indicators, signal, targetBudget, recommendation };
        });
        return {
            monthlyBudget,
            allocations,
            invested,
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
        const totalRemaining = SYMBOLS.reduce((sum, symbol) => sum + plan.assets[symbol].recommendation.remaining, 0);
        elements.totalRecommendation.textContent = formatCurrency(total, 2);
        elements.nextSessionLabel.textContent = plan.sessions.length
            ? `${formatDate(plan.sessions[0], { short: true })} · next session`
            : 'Month has no sessions left';
        const age = quoteAgeHours();
        elements.dataConfidence.textContent = age > 96 ? 'Stale market snapshot' : 'Budget checked';
        elements.recommendationSummary.textContent = plan.sessions.length
            ? `${formatCurrency(totalRemaining, 2)} remains across ${plan.sessions.length} U.S. trading sessions before today’s recorded purchase.`
            : 'Move the plan date into a month with an eligible U.S. trading session.';
        elements.budgetInvested.textContent = formatCurrency(totalInvested, 2);
        elements.budgetRemaining.textContent = formatCurrency(totalRemaining, 2);
        elements.budgetProgressFill.style.width = `${clamp((totalInvested / plan.monthlyBudget) * 100, 0, 100)}%`;

        SYMBOLS.forEach((symbol) => {
            const lower = symbol.toLowerCase();
            const asset = plan.assets[symbol];
            const recommendation = asset.recommendation;
            elements[`${lower}Recommendation`].textContent = formatCurrency(recommendation.amount, 2);
            elements[`${lower}Shares`].textContent = `${formatShares(recommendation.shares)} shares @ ${formatCurrency(asset.price.value, 2)}`;
            elements[`${lower}Baseline`].textContent = formatCurrency(recommendation.baseline, 2);
            elements[`${lower}Multiplier`].textContent = `${recommendation.appliedMultiplier.toFixed(2)}×`;
            elements[`${lower}Remaining`].textContent = formatCurrency(recommendation.remaining, 2);
            setSignalBadge(elements[`${lower}SignalBadge`], asset.signal);
        });
        renderReasons(plan);
        elements.recordPurchase.disabled = total <= 0 || !plan.sessions.length;
        elements.copyPlan.disabled = total <= 0 || !plan.sessions.length;
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

    function renderSparkline(symbol, record) {
        const lower = symbol.toLowerCase();
        const rows = record.history.slice(-90);
        const prices = rows.map((row) => Number(row.close));
        if (prices.length < 2) return;
        const minimum = Math.min(...prices);
        const maximum = Math.max(...prices);
        const spread = maximum - minimum || 1;
        const points = prices.map((price, index) => {
            const x = 8 + ((index / (prices.length - 1)) * 584);
            const y = 135 - (((price - minimum) / spread) * 120);
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 600 150');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('aria-hidden', 'true');
        const grid = document.createElementNS(svg.namespaceURI, 'path');
        grid.setAttribute('d', 'M0 30H600 M0 75H600 M0 120H600');
        grid.setAttribute('stroke', 'rgba(148,163,184,0.12)');
        grid.setAttribute('stroke-width', '1');
        const line = document.createElementNS(svg.namespaceURI, 'polyline');
        line.setAttribute('points', points);
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', symbol === 'TSLA' ? '#f1d574' : '#49d6c8');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        const finalPoint = document.createElementNS(svg.namespaceURI, 'circle');
        const [finalX, finalY] = points.split(' ').pop().split(',');
        finalPoint.setAttribute('cx', finalX);
        finalPoint.setAttribute('cy', finalY);
        finalPoint.setAttribute('r', '4');
        finalPoint.setAttribute('fill', symbol === 'TSLA' ? '#f1d574' : '#49d6c8');
        svg.append(grid, line, finalPoint);
        elements[`${lower}Sparkline`].replaceChildren(svg);
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
        elements[`${lower}ReplayDelta`].textContent = `${shareDifference >= 0 ? '+' : ''}${formatShares(shareDifference)} shares versus flat DCA; adaptive average was ${averageDifference <= 0 ? formatCurrency(Math.abs(averageDifference), 2) + ' lower' : formatCurrency(averageDifference, 2) + ' higher'}. Both deployed ${formatCurrency(replay.budget, 2)}.`;
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

    function recalculate({ persist = true } = {}) {
        updateAllocationOutput();
        updateRangeOutputs(elements.strategyMode.textContent === 'Custom settings');
        if (persist) persistControls();
        currentPlan = buildPlan();
        if (!currentPlan) return;
        renderRecommendation(currentPlan);
        SYMBOLS.forEach((symbol) => {
            renderIndicators(symbol, currentPlan.assets[symbol]);
            renderSparkline(symbol, marketData.symbols[symbol]);
        });
        renderReplay(currentPlan);
    }

    function ledgerId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function recordPurchase() {
        if (!currentPlan || !currentPlan.sessions.length) return;
        const date = currentPlan.sessions[0];
        const recorded = [];
        SYMBOLS.forEach((symbol) => {
            const asset = currentPlan.assets[symbol];
            if (asset.recommendation.amount <= 0) return;
            const entry = {
                id: ledgerId(),
                date,
                symbol,
                amount: asset.recommendation.amount,
                price: asset.price.value,
                shares: asset.recommendation.shares,
                multiplier: asset.recommendation.appliedMultiplier,
                priceMode: asset.price.manual ? 'manual' : 'Nasdaq snapshot'
            };
            state.ledger.push(entry);
            const entryMonth = date.slice(0, 7);
            state.months[entryMonth] = state.months[entryMonth] || { TSLA: 0, SPCX: 0 };
            state.months[entryMonth][symbol] = Number(state.months[entryMonth][symbol] || 0) + entry.amount;
            recorded.push(symbol);
        });
        saveState();
        loadMonthInputs();
        renderJournal();
        recalculate();
        showStatus(`Recorded ${recorded.join(' and ')} in this browser journal. No brokerage order was placed.`, 'info');
    }

    function deleteEntry(id) {
        const entry = state.ledger.find((candidate) => candidate.id === id);
        if (!entry) return;
        const entryMonth = entry.date.slice(0, 7);
        if (state.months[entryMonth]) {
            state.months[entryMonth][entry.symbol] = Math.max(
                0,
                Number(state.months[entryMonth][entry.symbol] || 0) - Number(entry.amount || 0)
            );
        }
        state.ledger = state.ledger.filter((candidate) => candidate.id !== id);
        saveState();
        if (entryMonth === monthKey()) loadMonthInputs();
        renderJournal();
        recalculate();
        showStatus('Journal entry removed and the month-to-date total was adjusted.', 'info');
    }

    function renderJournal() {
        elements.journalBody.replaceChildren();
        const rows = [...state.ledger].sort((left, right) => right.date.localeCompare(left.date));
        elements.journalEmpty.hidden = rows.length > 0;
        rows.forEach((entry) => {
            const row = document.createElement('tr');
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

    async function copyPlan() {
        if (!currentPlan || !currentPlan.sessions.length) return;
        const lines = [
            `Conviction DCA plan · ${currentPlan.sessions[0]}`,
            `Total: ${formatCurrency(SYMBOLS.reduce((sum, symbol) => sum + currentPlan.assets[symbol].recommendation.amount, 0), 2)}`,
            ...SYMBOLS.map((symbol) => {
                const asset = currentPlan.assets[symbol];
                return `${symbol}: ${formatCurrency(asset.recommendation.amount, 2)} · ${formatShares(asset.recommendation.shares)} shares @ ${formatCurrency(asset.price.value, 2)} · ${asset.recommendation.appliedMultiplier.toFixed(2)}×`;
            }),
            `Monthly cap: ${formatCurrency(currentPlan.monthlyBudget, 2)} · ${currentPlan.sessions.length} sessions remain`,
            'Decision support only; verify the price and order with a broker.'
        ];
        try {
            await navigator.clipboard.writeText(lines.join('\n'));
            showStatus('Plan copied to the clipboard.', 'info');
        } catch (error) {
            console.warn('[DCA Lab] Clipboard write failed.', error);
            showStatus('Clipboard access was blocked by the browser.', 'error');
        }
    }

    function bindEvents() {
        const recalcInputs = [
            elements.monthlyBudget, elements.tslaAllocation, elements.tslaInvested,
            elements.spcxInvested, elements.fractionalShares, elements.tslaPrice,
            elements.spcxPrice
        ];
        recalcInputs.forEach((element) => element.addEventListener('input', () => recalculate()));
        elements.planDate.addEventListener('change', () => {
            loadMonthInputs();
            recalculate();
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
                recalculate();
            });
        });
        [elements.tslaManualToggle, elements.spcxManualToggle].forEach((toggle) => {
            toggle.addEventListener('change', () => {
                updatePriceControls();
                recalculate();
            });
        });
        elements.recordPurchase.addEventListener('click', recordPurchase);
        elements.copyPlan.addEventListener('click', copyPlan);
        elements.exportJournal.addEventListener('click', exportJournal);
        elements.resetMonth.addEventListener('click', resetMonth);
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
        bindEvents();
        renderJournal();
        try {
            marketData = await loadMarketData();
            renderMarketHeader();
            recalculate({ persist: false });
            if (quoteAgeHours() > 96) {
                showStatus('The automatic market snapshot is more than four days old. Turn on Manual price before acting on the share estimate.', 'info');
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
