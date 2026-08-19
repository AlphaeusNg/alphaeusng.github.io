/**
 * Recent Nasdaq last-sale quotes for the Conviction DCA Lab.
 *
 * Nasdaq's API does not allow direct browser requests. A scheduled GitHub
 * Action publishes a tiny CORS-open file instead; the committed daily snapshot
 * remains in place whenever this optional feed is unavailable.
 */
(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.DcaQuotes = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const SYMBOLS = ['TSLA', 'SPCX'];
    const GITHUB_LIVE_QUOTES =
        'https://raw.githubusercontent.com/AlphaeusNg/alphaeusng.github.io/dca-live/data/dca_live_quotes.json';

    function fetchImpl(options) {
        return options.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    }

    function abortSignal(timeoutMs) {
        if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
            return AbortSignal.timeout(timeoutMs);
        }
        return undefined;
    }

    async function fetchJson(url, options = {}) {
        const fetchFn = fetchImpl(options);
        if (!fetchFn) throw new Error('fetch is not available');
        const response = await fetchFn(url, {
            cache: 'no-store',
            credentials: 'omit',
            signal: options.signal || abortSignal(options.timeoutMs || 4500)
        });
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
        return response.json();
    }

    function parseLiveQuotesPayload(payload) {
        if (!payload || payload.schemaVersion !== 1 || !payload.symbols) {
            throw new Error('Live quote payload has an unsupported format');
        }
        const generatedAt = String(payload.generatedAt || '');
        if (!generatedAt || Number.isNaN(Date.parse(generatedAt))) {
            throw new Error('Live quote payload has no valid generation time');
        }
        const quotes = {};
        SYMBOLS.forEach((symbol) => {
            const quote = payload.symbols[symbol];
            const price = Number(quote && quote.price);
            const asOf = String((quote && quote.asOf) || '');
            if (!(price > 0) || !asOf || Number.isNaN(Date.parse(asOf))) return;
            quotes[symbol] = {
                price,
                asOf,
                marketStatus: String(quote.marketStatus || 'Unknown'),
                isRealTime: Boolean(quote.isRealTime),
                netChange: Number(quote.netChange) || 0,
                percentChange: Number(quote.percentChange) || 0,
                source: 'Nasdaq'
            };
        });
        if (!Object.keys(quotes).length) throw new Error('Live quote payload had no usable symbols');
        return { quotes, generatedAt };
    }

    async function loadLiveQuotes(options = {}) {
        const symbols = options.symbols || SYMBOLS;
        const baseUrl = options.githubUrl || GITHUB_LIVE_QUOTES;
        const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        try {
            const parsed = parseLiveQuotesPayload(await fetchJson(url, options));
            const selected = {};
            symbols.forEach((symbol) => {
                if (parsed.quotes[symbol]) selected[symbol] = parsed.quotes[symbol];
            });
            if (!Object.keys(selected).length) return null;
            return {
                quotes: selected,
                feed: 'nasdaq-live',
                generatedAt: parsed.generatedAt,
                fetchedAt: new Date().toISOString()
            };
        } catch (error) {
            if (options.logger) options.logger(error);
            return null;
        }
    }

    return Object.freeze({
        SYMBOLS,
        GITHUB_LIVE_QUOTES,
        parseLiveQuotesPayload,
        loadLiveQuotes
    });
}));
