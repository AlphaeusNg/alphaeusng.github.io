(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.DcaEngine = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const STRATEGIES = Object.freeze({
        steady: Object.freeze({
            id: 'steady',
            label: 'Steady',
            floorMultiplier: 0.85,
            dipSensitivity: 0.85,
            maxMultiplier: 1.6
        }),
        balanced: Object.freeze({
            id: 'balanced',
            label: 'Balanced',
            floorMultiplier: 0.7,
            dipSensitivity: 1.35,
            maxMultiplier: 2.25
        }),
        aggressive: Object.freeze({
            id: 'aggressive',
            label: 'Aggressive',
            floorMultiplier: 0.55,
            dipSensitivity: 1.9,
            maxMultiplier: 3
        })
    });

    function clamp(value, minimum, maximum) {
        return Math.min(Math.max(value, minimum), maximum);
    }

    function roundMoney(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }

    function mean(values) {
        if (!values.length) return null;
        return values.reduce((total, value) => total + value, 0) / values.length;
    }

    function standardDeviation(values) {
        if (values.length < 2) return null;
        const average = mean(values);
        const variance = values.reduce((total, value) => total + ((value - average) ** 2), 0)
            / (values.length - 1);
        return Math.sqrt(variance);
    }

    function parseDate(dateText) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText));
        if (!match) throw new Error(`Invalid ISO date: ${dateText}`);
        return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    }

    function isoDate(date) {
        return date.toISOString().slice(0, 10);
    }

    function addDays(date, days) {
        const result = new Date(date.getTime());
        result.setUTCDate(result.getUTCDate() + days);
        return result;
    }

    function observedDate(date) {
        const day = date.getUTCDay();
        if (day === 6) return addDays(date, -1);
        if (day === 0) return addDays(date, 1);
        return date;
    }

    function nthWeekday(year, month, weekday, occurrence) {
        const first = new Date(Date.UTC(year, month, 1));
        const offset = (weekday - first.getUTCDay() + 7) % 7;
        return new Date(Date.UTC(year, month, 1 + offset + ((occurrence - 1) * 7)));
    }

    function lastWeekday(year, month, weekday) {
        const last = new Date(Date.UTC(year, month + 1, 0));
        const offset = (last.getUTCDay() - weekday + 7) % 7;
        return addDays(last, -offset);
    }

    function easterSunday(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = ((19 * a) + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + (2 * e) + (2 * i) - h - k) % 7;
        const m = Math.floor((a + (11 * h) + (22 * l)) / 451);
        const month = Math.floor((h + l - (7 * m) + 114) / 31);
        const day = ((h + l - (7 * m) + 114) % 31) + 1;
        return new Date(Date.UTC(year, month - 1, day));
    }

    function marketHolidaySet(year) {
        const holidays = [
            observedDate(new Date(Date.UTC(year, 0, 1))),
            nthWeekday(year, 0, 1, 3),
            nthWeekday(year, 1, 1, 3),
            addDays(easterSunday(year), -2),
            lastWeekday(year, 4, 1),
            observedDate(new Date(Date.UTC(year, 5, 19))),
            observedDate(new Date(Date.UTC(year, 6, 4))),
            nthWeekday(year, 8, 1, 1),
            nthWeekday(year, 10, 4, 4),
            observedDate(new Date(Date.UTC(year, 11, 25))),
            observedDate(new Date(Date.UTC(year + 1, 0, 1)))
        ];
        return new Set(holidays.map(isoDate));
    }

    function isTradingDay(dateText) {
        const date = typeof dateText === 'string' ? parseDate(dateText) : dateText;
        const weekday = date.getUTCDay();
        if (weekday === 0 || weekday === 6) return false;
        return !marketHolidaySet(date.getUTCFullYear()).has(isoDate(date));
    }

    function tradingSessionsRemaining(planDateText) {
        const planDate = parseDate(planDateText);
        const finalDate = new Date(Date.UTC(planDate.getUTCFullYear(), planDate.getUTCMonth() + 1, 0));
        const sessions = [];
        for (let cursor = planDate; cursor <= finalDate; cursor = addDays(cursor, 1)) {
            if (isTradingDay(cursor)) sessions.push(isoDate(cursor));
        }
        return sessions;
    }

    function normalizeHistory(history, currentPrice, currentDate) {
        const normalized = (Array.isArray(history) ? history : [])
            .map((row) => ({ date: String(row.date), close: Number(row.close) }))
            .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && Number.isFinite(row.close) && row.close > 0)
            .sort((left, right) => left.date.localeCompare(right.date));
        if (!Number.isFinite(currentPrice) || currentPrice <= 0 || !currentDate) return normalized;
        const virtual = { date: String(currentDate), close: Number(currentPrice) };
        const final = normalized[normalized.length - 1];
        if (!final || virtual.date > final.date) {
            normalized.push(virtual);
        } else if (virtual.date === final.date) {
            normalized[normalized.length - 1] = virtual;
        }
        return normalized;
    }

    function simpleRsi(closes, periods = 14) {
        if (closes.length <= periods) return null;
        let gains = 0;
        let losses = 0;
        for (let index = closes.length - periods; index < closes.length; index += 1) {
            const change = closes[index] - closes[index - 1];
            if (change > 0) gains += change;
            if (change < 0) losses += Math.abs(change);
        }
        if (losses === 0) return gains === 0 ? 50 : 100;
        const relativeStrength = (gains / periods) / (losses / periods);
        return 100 - (100 / (1 + relativeStrength));
    }

    function calculateIndicators(history, options = {}) {
        const rows = normalizeHistory(history, Number(options.currentPrice), options.currentDate);
        const closes = rows.map((row) => row.close);
        if (closes.length < 2) {
            return {
                sessions: closes.length,
                price: closes[closes.length - 1] || null,
                confidence: 'insufficient',
                dailyReturn: null,
                fiveDayReturn: null,
                ma20: null,
                distanceFromMa20: null,
                drawdown20: null,
                rsi14: null,
                volatility20: null
            };
        }
        const price = closes[closes.length - 1];
        const returns = closes.slice(1).map((close, index) => (close / closes[index]) - 1);
        const trailing20 = closes.slice(-20);
        const average20 = trailing20.length >= 10 ? mean(trailing20) : null;
        const high20 = trailing20.length >= 2 ? Math.max(...trailing20) : null;
        let confidence = 'limited';
        if (closes.length >= 200) confidence = 'high';
        else if (closes.length >= 60) confidence = 'medium';
        else if (closes.length < 20) confidence = 'insufficient';
        return {
            sessions: closes.length,
            price,
            confidence,
            dailyReturn: (price / closes[closes.length - 2]) - 1,
            fiveDayReturn: closes.length > 5 ? (price / closes[closes.length - 6]) - 1 : null,
            ma20: average20,
            distanceFromMa20: average20 ? (price / average20) - 1 : null,
            drawdown20: high20 ? (price / high20) - 1 : null,
            rsi14: simpleRsi(closes, 14),
            volatility20: standardDeviation(returns.slice(-20))
        };
    }

    function normalizedMove(value, denominator, direction) {
        if (!Number.isFinite(value)) return 0;
        const directed = direction === 'down' ? -value : value;
        return clamp(directed / denominator, 0, 1);
    }

    function calculateSignal(indicators, strategyInput = STRATEGIES.balanced) {
        const strategy = {
            ...STRATEGIES.balanced,
            ...(strategyInput || {})
        };
        if (!indicators || indicators.confidence === 'insufficient') {
            return {
                multiplier: 1,
                rawMultiplier: 1,
                weaknessScore: 0,
                extensionScore: 0,
                trendScore: 0,
                label: 'Neutral · limited data',
                historyCapApplied: true,
                components: {}
            };
        }
        const volatility = Math.max(Number(indicators.volatility20) || 0, 0.0125);
        const components = {
            dailyDip: normalizedMove(indicators.dailyReturn, 2 * volatility, 'down'),
            weeklyDip: normalizedMove(indicators.fiveDayReturn, 2 * volatility * Math.sqrt(5), 'down'),
            belowAverage: normalizedMove(indicators.distanceFromMa20, 3 * volatility, 'down'),
            drawdown: normalizedMove(indicators.drawdown20, 4 * volatility, 'down'),
            oversold: Number.isFinite(indicators.rsi14) ? clamp((50 - indicators.rsi14) / 25, 0, 1) : 0,
            dailyHeat: normalizedMove(indicators.dailyReturn, 2 * volatility, 'up'),
            weeklyHeat: normalizedMove(indicators.fiveDayReturn, 2 * volatility * Math.sqrt(5), 'up'),
            aboveAverage: normalizedMove(indicators.distanceFromMa20, 3 * volatility, 'up'),
            overbought: Number.isFinite(indicators.rsi14) ? clamp((indicators.rsi14 - 60) / 25, 0, 1) : 0
        };
        const weaknessScore = (components.dailyDip * 0.3)
            + (components.weeklyDip * 0.2)
            + (components.belowAverage * 0.2)
            + (components.drawdown * 0.2)
            + (components.oversold * 0.1);
        const extensionScore = (components.dailyHeat * 0.35)
            + (components.weeklyHeat * 0.25)
            + (components.aboveAverage * 0.25)
            + (components.overbought * 0.15);
        const rawMultiplier = 1 + (Number(strategy.dipSensitivity) * weaknessScore)
            - (0.35 * extensionScore);
        const historyCapApplied = indicators.sessions < 60;
        const confidenceFactor = historyCapApplied ? 0.6 : 1;
        const confidenceAdjusted = 1 + ((rawMultiplier - 1) * confidenceFactor);
        const maximum = historyCapApplied
            ? Math.min(Number(strategy.maxMultiplier), 1.75)
            : Number(strategy.maxMultiplier);
        const multiplier = clamp(confidenceAdjusted, Number(strategy.floorMultiplier), maximum);
        let label = 'Steady cadence';
        if (multiplier >= 1.75) label = 'Deep weakness · buy more';
        else if (multiplier >= 1.2) label = 'Weakness · buy more';
        else if (multiplier <= 0.8) label = 'Extended · floor buy';
        else if (multiplier < 0.95) label = 'Strong tape · lighter buy';
        return {
            multiplier,
            rawMultiplier,
            weaknessScore,
            extensionScore,
            trendScore: clamp((extensionScore - weaknessScore) * 100, -100, 100),
            label,
            historyCapApplied,
            components
        };
    }

    function recommendAsset(options) {
        const monthlyBudget = Math.max(0, Number(options.monthlyBudget) || 0);
        const invested = Math.max(0, Number(options.invested) || 0);
        const remaining = roundMoney(Math.max(0, monthlyBudget - invested));
        const daysRemaining = Math.max(0, Math.floor(Number(options.daysRemaining) || 0));
        const price = Number(options.price);
        const floorMultiplier = clamp(Number(options.floorMultiplier) || 0, 0, 1);
        const maxMultiplier = Math.max(1, Number(options.maxMultiplier) || 1);
        const requestedMultiplier = clamp(Number(options.signalMultiplier) || 1, floorMultiplier, maxMultiplier);
        if (!remaining || !daysRemaining || !Number.isFinite(price) || price <= 0) {
            return {
                monthlyBudget,
                invested,
                remaining,
                baseline: daysRemaining ? roundMoney(remaining / daysRemaining) : 0,
                amount: 0,
                shares: 0,
                unallocatedToday: 0,
                appliedMultiplier: 0
            };
        }
        const baseline = remaining / daysRemaining;
        const appliedMultiplier = daysRemaining === 1 ? 1 : requestedMultiplier;
        const minimum = daysRemaining === 1 ? remaining : baseline * floorMultiplier;
        const maximum = Math.min(remaining, baseline * maxMultiplier);
        let amount = roundMoney(clamp(baseline * appliedMultiplier, minimum, maximum));
        let shares;
        let unallocatedToday = 0;
        if (options.fractional === false) {
            shares = Math.floor((amount + Number.EPSILON) / price);
            const wholeShareAmount = roundMoney(shares * price);
            unallocatedToday = roundMoney(amount - wholeShareAmount);
            amount = wholeShareAmount;
        } else {
            shares = Math.round((amount / price) * 1_000_000) / 1_000_000;
        }
        return {
            monthlyBudget,
            invested,
            remaining,
            baseline: roundMoney(baseline),
            amount,
            shares,
            unallocatedToday,
            appliedMultiplier: daysRemaining === 1 ? 1 : requestedMultiplier
        };
    }

    function previousMonthKey(dateText) {
        const date = parseDate(dateText);
        const previous = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
        return isoDate(previous).slice(0, 7);
    }

    function replayCompletedMonth(history, monthlyBudget, strategyInput = STRATEGIES.balanced) {
        const rows = normalizeHistory(history);
        if (rows.length < 3) return null;
        const replayMonth = previousMonthKey(rows[rows.length - 1].date);
        const monthRows = rows.filter((row) => row.date.startsWith(replayMonth));
        if (monthRows.length < 2) return null;
        const strategy = { ...STRATEGIES.balanced, ...(strategyInput || {}) };
        let adaptiveSpent = 0;
        let adaptiveShares = 0;
        let flatSpent = 0;
        let flatShares = 0;
        monthRows.forEach((row, index) => {
            const prefix = rows.filter((candidate) => candidate.date <= row.date);
            const indicators = calculateIndicators(prefix);
            const signal = calculateSignal(indicators, strategy);
            const daysRemaining = monthRows.length - index;
            const adaptive = recommendAsset({
                monthlyBudget,
                invested: adaptiveSpent,
                daysRemaining,
                price: row.close,
                signalMultiplier: signal.multiplier,
                floorMultiplier: strategy.floorMultiplier,
                maxMultiplier: strategy.maxMultiplier,
                fractional: true
            });
            const flat = recommendAsset({
                monthlyBudget,
                invested: flatSpent,
                daysRemaining,
                price: row.close,
                signalMultiplier: 1,
                floorMultiplier: 1,
                maxMultiplier: 1,
                fractional: true
            });
            adaptiveSpent = roundMoney(adaptiveSpent + adaptive.amount);
            adaptiveShares += adaptive.amount / row.close;
            flatSpent = roundMoney(flatSpent + flat.amount);
            flatShares += flat.amount / row.close;
        });
        return {
            month: replayMonth,
            sessions: monthRows.length,
            budget: roundMoney(Number(monthlyBudget) || 0),
            adaptive: {
                spent: adaptiveSpent,
                shares: adaptiveShares,
                averagePrice: adaptiveShares ? adaptiveSpent / adaptiveShares : null
            },
            flat: {
                spent: flatSpent,
                shares: flatShares,
                averagePrice: flatShares ? flatSpent / flatShares : null
            }
        };
    }

    return Object.freeze({
        STRATEGIES,
        calculateIndicators,
        calculateSignal,
        isTradingDay,
        marketHolidaySet,
        recommendAsset,
        replayCompletedMonth,
        tradingSessionsRemaining
    });
}));
