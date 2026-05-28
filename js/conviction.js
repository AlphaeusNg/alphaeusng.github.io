const CONVICTION_DATA_PATH = 'data/conviction_tsla_history.json';

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);
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
    const windowText = `${formatDate(summary.firstTransactionDate)} → ${formatDate(summary.latestTransactionDate)}`;

    document.getElementById('transactionWindow').textContent = windowText;
    document.getElementById('transactionCount').textContent = `${summary.totalTransactions} total`;
    document.getElementById('currentShares').textContent = `${formatShares(summary.currentShares)} shares`;
    document.getElementById('buySellCount').textContent = `${summary.buyTransactions} buys / ${summary.sellTransactions} sells`;
    document.getElementById('capitalDeployed').textContent = formatCurrency(summary.capitalDeployedUsd);
    document.getElementById('saleProceeds').textContent = formatCurrency(summary.saleProceedsUsd);
    document.getElementById('chartSource').textContent =
        `${data.symbol} from ${summary.accounts.join(' + ')} • ${data.sourceSheet}`;
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
    const postSellEntries = transactions.filter((entry) => entry.date > lastSell.date);
    const allLaterEntriesAreBuys = postSellEntries.every((entry) => entry.type === 'Buy');
    const streak = trailingBuyStreak(data.monthlySeries);

    document.getElementById('buildPatternText').textContent =
        `${buys} buys across ${total} TSLA entries. The position was built in increments, not in one dramatic all-in purchase.`;

    document.getElementById('sellWindowText').textContent =
        `${sells} sells were clustered between ${formatDate(firstSell.date)} and ${formatDate(lastSell.date)}. ` +
        (allLaterEntriesAreBuys
            ? 'Every later TSLA entry in this record is a buy.'
            : 'Later entries include both buying and selling.');

    if (streak) {
        document.getElementById('cadenceText').textContent =
            `From ${formatMonth(streak.startPeriod)} through ${formatMonth(streak.endPeriod)}, there is at least one buy in every month represented, moving the position from ` +
            `${formatShares(streak.sharesBeforeStart)} to ${formatShares(streak.sharesAtEnd)} shares.`;
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

function renderChart(data) {
    const series = data.monthlySeries;
    const labels = series.map((entry) => formatMonth(entry.period));
    const netShares = series.map((entry) => entry.netShares);
    const cumulativeShares = series.map((entry) => entry.cumulativeShares);
    const barColors = netShares.map((value) => value >= 0 ? 'rgba(201, 162, 39, 0.55)' : 'rgba(248, 113, 113, 0.58)');
    const borderColors = netShares.map((value) => value >= 0 ? '#C9A227' : '#F87171');

    const ctx = document.getElementById('convictionChart');
    if (!ctx) return;

    new Chart(ctx, {
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
                    tension: 0.28,
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
                    title: {
                        display: true,
                        text: 'Cumulative shares',
                        color: '#94A3B8'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: '#94A3B8'
                    }
                }
            }
        }
    });
}

async function initConvictionPage() {
    try {
        const response = await fetch(CONVICTION_DATA_PATH);
        if (!response.ok) {
            throw new Error(`Failed to load conviction data (${response.status})`);
        }

        const data = await response.json();
        populateMetrics(data);
        populateNarrative(data);
        populateRecentTransactions(data);
        renderChart(data);
    } catch (error) {
        console.error('[Conviction]', error);
        const source = document.getElementById('chartSource');
        if (source) {
            source.textContent = 'Unable to load transaction history.';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConvictionPage);
} else {
    initConvictionPage();
}
