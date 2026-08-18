const CONVICTION_DATA_PATH = '../data/conviction_tsla_history.json';

let convictionChart;
let benchmarkChart;
let benchmarkPayload;

const benchmarkViewButtons = Array.from(document.querySelectorAll('.benchmark-view-toggle'));

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);
}

function formatSignedCurrency(value) {
    if (value === 0) {
        return formatCurrency(0);
    }
    return `${value > 0 ? '+' : '-'}${formatCurrency(Math.abs(value))}`;
}

function formatShares(value) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatDate(dateText) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(`${dateText}T00:00:00`));
}

function formatMonth(period) {
    const [year, month] = period.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric'
    }).format(new Date(year, month - 1, 1));
}

function monthBefore(period) {
    const [year, month] = period.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function trailingBuyStreak(series) {
    if (!series.length) return null;
    let start = series.length - 1;

    if (series[start].buyShares <= 0 || series[start].sellShares > 0) {
        return null;
    }

    while (start > 0) {
        const current = series[start];
        const previous = series[start - 1];
        const isContinuous = previous.period === monthBefore(current.period);
        const isBuyMonth = previous.buyShares > 0 && previous.sellShares === 0;

        if (!isContinuous || !isBuyMonth) {
            break;
        }

        start -= 1;
    }

    return {
        startIndex: start,
        endIndex: series.length - 1,
        startPeriod: series[start].period,
        endPeriod: series[series.length - 1].period,
        sharesBeforeStart: start > 0 ? series[start - 1].cumulativeShares : 0,
        sharesAtEnd: series[series.length - 1].cumulativeShares
    };
}

function populateMetrics(data) {
    const summary = data.summary;
    const windowText = `${formatDate(summary.firstTransactionDate)} -> ${formatDate(summary.latestTransactionDate)}`;

    document.getElementById('transactionWindow').textContent = windowText;
    document.getElementById('transactionCount').textContent = `${summary.totalTransactions} total`;
    document.getElementById('currentShares').textContent = `${formatShares(summary.currentShares)} shares`;
    document.getElementById('buySellCount').textContent = `${summary.buyTransactions} buys / ${summary.sellTransactions} sells`;
    document.getElementById('capitalDeployed').textContent = formatCurrency(summary.capitalDeployedUsd);
    document.getElementById('saleProceeds').textContent = formatCurrency(summary.saleProceedsUsd);
    document.getElementById('chartSource').textContent =
        `${data.symbol} from ${summary.accounts.join(' + ')} • ${data.sourceSheet}`;
    const asOfEl = document.getElementById('convictionAsOf');
    if (asOfEl && summary.latestTransactionDate) {
        asOfEl.textContent =
            `As of ${formatDate(summary.latestTransactionDate)} · split-adjusted IBKR ledger vs same-dated SPY cash flows · personal record, not a model`;
    }
}

function populateNarrative(data) {
    const summary = data.summary;
    const buys = summary.buyTransactions;
    const sells = summary.sellTransactions;
    const total = summary.totalTransactions;
    const transactions = data.transactions;
    const sellEntries = transactions.filter((entry) => entry.type === 'Sell');
    const firstSell = sellEntries[0];
    const lastSell = sellEntries[sellEntries.length - 1];
    const streak = trailingBuyStreak(data.monthlySeries);

    document.getElementById('buildPatternText').textContent =
        `${buys} buys across ${total} TSLA entries. The position was built in increments, not in one dramatic all-in purchase.`;

    document.getElementById('sellWindowText').textContent =
        `${sells} sells were clustered between ${formatDate(firstSell.date)} and ${formatDate(lastSell.date)}. Those sales happened while I was on margin, near the bottom of the drawdown, and they are the clearest evidence in this record that conviction without holding power can still get forced out.`;

    if (streak) {
        document.getElementById('cadenceText').textContent =
            `From ${formatMonth(streak.startPeriod)} through ${formatMonth(streak.endPeriod)}, there is at least one buy in every month represented, moving the position from ${formatShares(streak.sharesBeforeStart)} to ${formatShares(streak.sharesAtEnd)} shares.`;
    } else {
        document.getElementById('cadenceText').textContent =
            'The later entries remain buy-heavy, but the most recent months do not form a continuous monthly streak.';
    }
}

function populateRecentTransactions(data) {
    const body = document.getElementById('recentTransactionsBody');
    body.innerHTML = '';

    data.transactions
        .slice(-6)
        .reverse()
        .forEach((entry) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-3 pr-4">${formatDate(entry.date)}</td>
                <td class="py-3 pr-4 ${entry.type === 'Buy' ? 'text-emerald-300' : 'text-rose-300'}">${entry.type}</td>
                <td class="py-3 pr-4">${formatShares(entry.shares)}</td>
                <td class="py-3 pr-4">${formatCurrency(entry.priceUsd)}</td>
                <td class="py-3">${formatCurrency(entry.cashFlowUsd)}</td>
            `;
            body.appendChild(row);
        });
}

function renderConvictionChart(data) {
    const series = data.monthlySeries;
    const chartSeries = series.length
        ? [{ period: monthBefore(series[0].period), netShares: 0, cumulativeShares: 0 }, ...series]
        : [];
    const labels = chartSeries.map((entry) => formatMonth(entry.period));
    const netShares = chartSeries.map((entry) => entry.netShares);
    const cumulativeShares = chartSeries.map((entry) => entry.cumulativeShares);
    const barColors = netShares.map((value) => value >= 0 ? 'rgba(201, 162, 39, 0.55)' : 'rgba(248, 113, 113, 0.58)');
    const borderColors = netShares.map((value) => value >= 0 ? '#C9A227' : '#F87171');

    const ctx = document.getElementById('convictionChart');
    if (!ctx) return;

    if (convictionChart) {
        convictionChart.destroy();
    }

    convictionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Monthly net shares',
                    data: netShares,
                    backgroundColor: barColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    borderRadius: 5,
                    yAxisID: 'y'
                },
                {
                    type: 'line',
                    label: 'Cumulative shares',
                    data: cumulativeShares,
                    borderColor: '#F4D26A',
                    backgroundColor: 'rgba(244, 210, 106, 0.16)',
                    borderWidth: 3,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    tension: 0,
                    cubicInterpolationMode: 'monotone',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#CBD5E1',
                        boxWidth: 10,
                        boxHeight: 10
                    }
                },
                tooltip: {
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(201, 162, 39, 0.45)',
                    borderWidth: 1,
                    titleColor: '#F8FAFC',
                    bodyColor: '#CBD5E1',
                    callbacks: {
                        label(context) {
                            if (context.dataset.label === 'Monthly net shares') {
                                const value = context.raw;
                                return `Net shares: ${value > 0 ? '+' : ''}${formatShares(value)}`;
                            }
                            return `Cumulative shares: ${formatShares(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748B',
                        maxRotation: 0,
                        autoSkip: true
                    }
                },
                y: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Net shares / month',
                        color: '#94A3B8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.10)'
                    },
                    ticks: {
                        color: '#94A3B8',
                        callback(value) {
                            return value > 0 ? `+${value}` : `${value}`;
                        }
                    }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cumulative shares',
                        color: '#94A3B8'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: '#94A3B8',
                        callback(value) {
                            return formatShares(value);
                        }
                    }
                }
            }
        }
    });
}

function updateBenchmarkMetrics(data) {
    const summary = data.summary;
    const diffNode = document.getElementById('benchmarkDifference');
    const latestMonth = formatMonth(summary.valuationMonth.slice(0, 7));
    const outperformed = summary.finalDifferenceUsd >= 0;

    document.getElementById('benchmarkTslaValue').textContent = formatCurrency(summary.finalTslaValueUsd);
    document.getElementById('benchmarkSpyValue').textContent = formatCurrency(summary.finalSpyValueUsd);
    document.getElementById('benchmarkNetCapital').textContent = formatCurrency(summary.netInvestedCapitalUsd);
    diffNode.textContent = formatSignedCurrency(summary.finalDifferenceUsd);
    diffNode.className = `mt-2 text-lg font-semibold ${outperformed ? 'text-[#F4D26A]' : 'text-rose-300'}`;
    document.getElementById('benchmarkCoverageText').textContent =
        `The comparison starts with the first recorded TSLA buy on ${formatDate(data.meta.firstTransactionDate)} and values both paths through ${latestMonth}. Positive monthly cash flow buys SPY units at that month's close; negative flow redeems them.`;
    document.getElementById('benchmarkDifferentialText').textContent =
        outperformed
            ? `Measured against the same net invested capital, the actual TSLA path currently sits ${formatSignedCurrency(summary.finalDifferenceUsd)} ahead of SPY. That is the payoff concentration aims for when the thesis survives and the holder survives with it.`
            : `Measured against the same net invested capital, the actual TSLA path currently sits ${formatSignedCurrency(summary.finalDifferenceUsd)} behind SPY. That gap is the cost of selling on margin near the bottom. The hard lesson is that a good thesis still fails financially if the structure cannot hold through volatility.`;
    document.getElementById('benchmarkSource').textContent =
        `${data.meta.tslaSymbol} vs ${data.meta.benchmarkSymbol} • same signed monthly cash flows`;
    document.getElementById('benchmarkChartStatus').textContent =
        `Latest valuation month: ${latestMonth}. Current value differential: ${formatSignedCurrency(summary.finalDifferenceUsd)}.`;
}

function buildBenchmarkValueView(points) {
    return {
        datasets: [
            {
                type: 'line',
                label: 'TSLA position value',
                data: points.map((point) => point.tslaValueUsd),
                borderColor: '#C9A227',
                backgroundColor: 'rgba(201, 162, 39, 0.12)',
                borderWidth: 2.5,
                tension: 0.25,
                pointRadius: 0,
                yAxisID: 'y'
            },
            {
                type: 'line',
                label: 'SPY benchmark value',
                data: points.map((point) => point.spyValueUsd),
                borderColor: '#60A5FA',
                backgroundColor: 'rgba(96, 165, 250, 0.12)',
                borderWidth: 2.5,
                tension: 0.25,
                pointRadius: 0,
                yAxisID: 'y'
            },
            {
                type: 'line',
                label: 'Net invested capital',
                data: points.map((point) => point.netInvestedCapitalUsd),
                borderColor: '#94A3B8',
                borderDash: [6, 6],
                borderWidth: 1.75,
                tension: 0.2,
                pointRadius: 0,
                yAxisID: 'y'
            }
        ]
    };
}

function buildBenchmarkDeltaView(points) {
    const latestDifference = points[points.length - 1].differenceUsd;
    const lineColor = latestDifference >= 0 ? '#C9A227' : '#FCA5A5';
    return {
        datasets: [
            {
                type: 'line',
                label: 'TSLA minus SPY',
                data: points.map((point) => point.differenceUsd),
                borderColor: lineColor,
                backgroundColor: 'rgba(248, 250, 252, 0.06)',
                borderWidth: 2.5,
                tension: 0.25,
                pointRadius: 0,
                yAxisID: 'y'
            }
        ]
    };
}

function buildBenchmarkFlowView(points) {
    return {
        datasets: [
            {
                type: 'bar',
                label: 'Monthly capital flow',
                data: points.map((point) => point.monthlyCapitalFlowUsd),
                backgroundColor: points.map((point) =>
                    point.monthlyCapitalFlowUsd >= 0 ? 'rgba(201, 162, 39, 0.78)' : 'rgba(248, 113, 113, 0.78)'
                ),
                borderRadius: 4,
                yAxisID: 'y'
            },
            {
                type: 'line',
                label: 'Net invested capital',
                data: points.map((point) => point.netInvestedCapitalUsd),
                borderColor: '#E2E8F0',
                borderWidth: 2,
                tension: 0.25,
                pointRadius: 0,
                yAxisID: 'y1'
            }
        ]
    };
}

function buildBenchmarkOptions(view) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                labels: {
                    color: '#CBD5E1'
                }
            },
            tooltip: {
                backgroundColor: '#0F172A',
                borderColor: 'rgba(201, 162, 39, 0.45)',
                borderWidth: 1,
                titleColor: '#F8FAFC',
                bodyColor: '#CBD5E1',
                callbacks: {
                    label(context) {
                        return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#94A3B8',
                    maxRotation: 0,
                    autoSkip: true
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.08)'
                }
            },
            y: {
                ticks: {
                    color: '#CBD5E1',
                    callback(value) {
                        return formatCurrency(value);
                    }
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.08)'
                }
            },
            y1: {
                position: 'right',
                ticks: {
                    color: '#94A3B8',
                    callback(value) {
                        return formatCurrency(value);
                    }
                },
                grid: {
                    display: false
                }
            }
        }
    };

    if (view === 'delta') {
        delete options.scales.y1;
    }

    return options;
}

function renderBenchmarkChart(view = 'value') {
    if (!benchmarkPayload) return;

    const points = benchmarkPayload.points;
    const labels = points.map((point) => formatMonth(point.month.slice(0, 7)));
    const canvas = document.getElementById('benchmarkChart');
    if (!canvas) return;

    let config;
    if (view === 'delta') {
        config = buildBenchmarkDeltaView(points);
    } else if (view === 'flows') {
        config = buildBenchmarkFlowView(points);
    } else {
        config = buildBenchmarkValueView(points);
    }

    if (!benchmarkChart) {
        benchmarkChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: config.datasets
            },
            options: buildBenchmarkOptions(view)
        });
        return;
    }

    benchmarkChart.data.labels = labels;
    benchmarkChart.data.datasets = config.datasets;
    benchmarkChart.options = buildBenchmarkOptions(view);
    benchmarkChart.update();
}

function setBenchmarkView(view) {
    benchmarkViewButtons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.view === view));
    });
    renderBenchmarkChart(view);
}

function populateBenchmark(data) {
    if (!data.benchmarkComparison) {
        return;
    }

    benchmarkPayload = data.benchmarkComparison;
    updateBenchmarkMetrics(benchmarkPayload);
    setBenchmarkView('value');
}

function waitForChart(timeoutMs = 8000) {
    if (typeof Chart !== 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const tick = () => {
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }
            if (Date.now() - start > timeoutMs) {
                reject(new Error('Chart.js failed to load'));
                return;
            }
            requestAnimationFrame(tick);
        };
        tick();
    });
}

async function initConvictionPage() {
    try {
        await waitForChart();
        const response = await fetch(CONVICTION_DATA_PATH, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load conviction data (${response.status})`);
        }

        const data = await response.json();
        populateMetrics(data);
        populateNarrative(data);
        populateRecentTransactions(data);
        renderConvictionChart(data);
        populateBenchmark(data);
    } catch (error) {
        console.error('[Conviction]', error);
        const source = document.getElementById('chartSource');
        if (source) {
            source.textContent = 'Unable to load transaction history.';
        }
        const benchmarkSource = document.getElementById('benchmarkSource');
        if (benchmarkSource) {
            benchmarkSource.textContent = 'Unable to load benchmark comparison.';
        }
    }
}

benchmarkViewButtons.forEach((button) => {
    button.addEventListener('click', () => {
        if (!benchmarkPayload) return;
        setBenchmarkView(button.dataset.view);
    });
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConvictionPage);
} else {
    initConvictionPage();
}
