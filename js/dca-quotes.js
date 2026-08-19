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
    const ALPACA_STREAMS = Object.freeze({
        iex: 'wss://stream.data.alpaca.markets/v2/iex',
        sip: 'wss://stream.data.alpaca.markets/v2/sip'
    });

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

    function parseAlpacaTimestamp(value) {
        const normalized = String(value || '').replace(
            /\.(\d{3})\d*(Z|[+-]\d{2}:?\d{2})$/,
            '.$1$2'
        );
        const parsed = Date.parse(normalized);
        return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
    }

    function parseAlpacaStreamMessage(raw) {
        let payload;
        try {
            payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (error) {
            return [];
        }
        const messages = Array.isArray(payload) ? payload : [payload];
        return messages.map((message) => {
            if (!message || typeof message !== 'object') return null;
            if (message.T === 't') {
                const symbol = String(message.S || '').toUpperCase();
                const price = Number(message.p);
                const asOf = parseAlpacaTimestamp(message.t);
                if (!SYMBOLS.includes(symbol) || !(price > 0) || !asOf) return null;
                return {
                    type: 'trade',
                    symbol,
                    price,
                    asOf,
                    size: Math.max(0, Number(message.s) || 0),
                    exchange: String(message.x || '')
                };
            }
            if (message.T === 'success') {
                return { type: 'success', message: String(message.msg || '') };
            }
            if (message.T === 'subscription') {
                return { type: 'subscription', trades: message.trades || [] };
            }
            if (message.T === 'error') {
                return {
                    type: 'error',
                    code: Number(message.code) || 0,
                    message: String(message.msg || 'Alpaca stream error')
                };
            }
            return null;
        }).filter(Boolean);
    }

    function createAlpacaStream(options = {}) {
        const keyId = String(options.keyId || '').trim();
        const secret = String(options.secret || '').trim();
        const feed = ALPACA_STREAMS[options.feed] ? options.feed : 'iex';
        const symbols = (options.symbols || SYMBOLS).filter((symbol) => SYMBOLS.includes(symbol));
        const WebSocketImpl = options.WebSocketImpl
            || (typeof WebSocket === 'function' ? WebSocket : null);
        if (!keyId || !secret) throw new Error('Alpaca key ID and secret are required.');
        if (!WebSocketImpl) throw new Error('WebSocket is not available in this browser.');
        if (!symbols.length) throw new Error('At least one supported symbol is required.');

        let socket = null;
        let reconnectTimer = null;
        let reconnectAttempt = 0;
        let stopped = false;
        let authSent = false;
        let subscribed = false;

        const reportStatus = (state, message = '') => {
            if (options.onStatus) options.onStatus({ state, message, feed });
        };
        const reportError = (error) => {
            if (options.onError) options.onError(error);
        };
        const send = (payload) => {
            if (socket && socket.readyState === 1) socket.send(JSON.stringify(payload));
        };
        const authenticate = () => {
            if (authSent) return;
            authSent = true;
            reportStatus('authenticating', 'Authenticating with Alpaca…');
            send({ action: 'auth', key: keyId, secret });
        };
        const subscribe = () => {
            if (subscribed) return;
            subscribed = true;
            send({ action: 'subscribe', trades: symbols });
            reportStatus('subscribing', `Subscribing to ${symbols.join(' and ')}…`);
        };
        const scheduleReconnect = () => {
            if (stopped || reconnectTimer) return;
            const wait = Math.min(30_000, 1_000 * (2 ** reconnectAttempt));
            reconnectAttempt += 1;
            reportStatus('reconnecting', `Connection paused. Retrying in ${Math.ceil(wait / 1000)}s…`);
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                connect();
            }, wait);
        };

        function connect() {
            if (stopped) return;
            authSent = false;
            subscribed = false;
            reportStatus('connecting', 'Opening real-time stream…');
            socket = new WebSocketImpl(ALPACA_STREAMS[feed]);
            socket.onopen = () => reportStatus('connected', 'Connected. Waiting for authentication…');
            socket.onmessage = (event) => {
                parseAlpacaStreamMessage(event.data).forEach((message) => {
                    if (message.type === 'success' && message.message === 'connected') {
                        authenticate();
                    } else if (message.type === 'success' && message.message === 'authenticated') {
                        subscribe();
                    } else if (message.type === 'subscription') {
                        reconnectAttempt = 0;
                        reportStatus('streaming', `${feed.toUpperCase()} stream connected.`);
                    } else if (message.type === 'trade' && options.onTrade) {
                        options.onTrade({ ...message, feed });
                    } else if (message.type === 'error') {
                        const error = new Error(message.message);
                        error.code = message.code;
                        reportStatus('error', message.message);
                        reportError(error);
                        if (message.code >= 400 && message.code < 500) {
                            stopped = true;
                            if (socket && socket.readyState < 2) socket.close(1000, 'Authentication rejected');
                        }
                    }
                });
            };
            socket.onerror = () => reportError(new Error('Alpaca WebSocket connection failed.'));
            socket.onclose = () => {
                socket = null;
                scheduleReconnect();
            };
        }

        connect();
        return Object.freeze({
            close() {
                stopped = true;
                if (reconnectTimer) clearTimeout(reconnectTimer);
                reconnectTimer = null;
                if (socket && socket.readyState < 2) socket.close(1000, 'User disconnected');
                socket = null;
                reportStatus('closed', 'Real-time stream disconnected.');
            },
            get feed() { return feed; }
        });
    }

    return Object.freeze({
        SYMBOLS,
        GITHUB_LIVE_QUOTES,
        ALPACA_STREAMS,
        parseLiveQuotesPayload,
        loadLiveQuotes,
        parseAlpacaStreamMessage,
        createAlpacaStream
    });
}));
