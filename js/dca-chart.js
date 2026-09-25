/**
 * Conviction DCA Lab — price-chart geometry.
 *
 * Turns a symbol's daily history plus the plan's current price into the
 * points the sparkline draws. The page still owns DOM events and formatting.
 */
(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.DcaChart = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const CHART_WIDTH = 600;
    const CHART_TOP = 18;
    const CHART_BOTTOM = 145;
    const CHART_LEFT = 12;
    const CHART_PLOT_WIDTH = 576;

    function rowsForRange(history, current, range) {
        const rows = (Array.isArray(history) ? history : []).map((row) => ({
            date: String(row.date),
            close: Number(row.close)
        }));
        if (current && current.date) {
            const point = {
                date: String(current.date),
                close: Number(current.close)
            };
            const final = rows[rows.length - 1];
            if (!final || point.date > final.date) rows.push(point);
            else if (point.date === final.date) rows[rows.length - 1] = point;
        }
        if (range === 'all') return rows;
        const count = Number(range);
        if (!Number.isFinite(count) || count <= 0) return rows;
        return rows.slice(-count);
    }

    function buildPriceChartModel(symbol, rows) {
        const prices = (Array.isArray(rows) ? rows : []).map((row) => Number(row.close));
        if (prices.length < 2 || prices.some((price) => !Number.isFinite(price))) return null;
        const minimum = Math.min(...prices);
        const maximum = Math.max(...prices);
        const spread = maximum - minimum || Math.max(maximum * 0.02, 1);
        const points = prices.map((price, index) => {
            const x = CHART_LEFT + ((index / (prices.length - 1)) * CHART_PLOT_WIDTH);
            const y = CHART_BOTTOM - (((price - minimum) / spread) * (CHART_BOTTOM - CHART_TOP));
            return { x, y, row: rows[index] };
        });
        const pointText = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
        const color = symbol === 'TSLA' ? '#f1d574' : '#49d6c8';
        return {
            symbol,
            rows,
            points,
            width: CHART_WIDTH,
            top: CHART_TOP,
            bottom: CHART_BOTTOM,
            color,
            gradientId: `chart-fill-${String(symbol || '').toLowerCase()}`,
            pointText,
            areaPoints: `${CHART_LEFT},${CHART_BOTTOM} ${pointText} ${CHART_LEFT + CHART_PLOT_WIDTH},${CHART_BOTTOM}`,
            totalReturn: (rows[rows.length - 1].close / rows[0].close) - 1,
            summary: null,
            selectedIndex: null
        };
    }

    function clampIndex(length, requestedIndex) {
        const last = Math.max(0, Number(length) - 1);
        const index = Number.isFinite(Number(requestedIndex)) ? Math.round(Number(requestedIndex)) : 0;
        return Math.min(Math.max(index, 0), last);
    }

    function svgElement(namespace, tag, attributes) {
        const element = document.createElementNS(namespace, tag);
        Object.entries(attributes || {}).forEach(([name, value]) => {
            element.setAttribute(name, String(value));
        });
        return element;
    }

    function renderSvg(model, labelFor) {
        const label = typeof labelFor === 'function' ? labelFor : (dateText) => String(dateText || '');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${CHART_WIDTH} 180`);
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('aria-hidden', 'true');

        const defs = svgElement(svg.namespaceURI, 'defs');
        const gradient = svgElement(svg.namespaceURI, 'linearGradient', {
            id: model.gradientId,
            x1: '0',
            x2: '0',
            y1: '0',
            y2: '1'
        });
        gradient.append(
            svgElement(svg.namespaceURI, 'stop', { offset: '0%', 'stop-color': model.color, 'stop-opacity': '0.22' }),
            svgElement(svg.namespaceURI, 'stop', { offset: '100%', 'stop-color': model.color, 'stop-opacity': '0' })
        );
        defs.appendChild(gradient);
        const grid = svgElement(svg.namespaceURI, 'path', {
            d: 'M0 30H600 M0 81.5H600 M0 133H600',
            stroke: 'rgba(148,163,184,0.12)',
            'stroke-width': '1'
        });
        const area = svgElement(svg.namespaceURI, 'polygon', {
            points: model.areaPoints,
            fill: `url(#${model.gradientId})`
        });
        const line = svgElement(svg.namespaceURI, 'polyline', {
            points: model.pointText,
            fill: 'none',
            stroke: model.color,
            'stroke-width': '2.5',
            'vector-effect': 'non-scaling-stroke'
        });
        const crosshair = svgElement(svg.namespaceURI, 'line', {
            y1: model.top,
            y2: model.bottom,
            stroke: 'rgba(226,232,240,0.55)',
            'stroke-width': '1',
            opacity: '0',
            'data-chart-crosshair': ''
        });
        const focus = svgElement(svg.namespaceURI, 'circle', {
            r: '4.5',
            fill: model.color,
            stroke: '#07111f',
            'stroke-width': '2',
            opacity: '0',
            'data-chart-focus': ''
        });
        const startLabel = svgElement(svg.namespaceURI, 'text', {
            x: '12',
            y: '169',
            fill: 'rgba(158,172,192,0.75)',
            'font-size': '10'
        });
        const endLabel = svgElement(svg.namespaceURI, 'text', {
            x: '588',
            y: '169',
            fill: 'rgba(158,172,192,0.75)',
            'font-size': '10',
            'text-anchor': 'end'
        });
        startLabel.textContent = label(model.rows[0].date);
        endLabel.textContent = label(model.rows[model.rows.length - 1].date);
        svg.append(defs, grid, area, line, crosshair, focus, startLabel, endLabel);
        return svg;
    }

    return Object.freeze({
        buildPriceChartModel,
        clampIndex,
        renderSvg,
        rowsForRange
    });
}));
