// Conviction page specific logic: Net Worth Chart + Live SheetJS Data Loader
// Extracted from monolithic conviction.html

let networthChartInstance = null;

// Default / fallback data (used when no file is loaded)
const defaultNetworthData = {
    labels: ["2024-08", "2024-09", "2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"],
    values: [51000, 53200, 55800, 58900, 61200, 64500, 67800, 71200, 74500, 78200, 81900, 85600, 89400, 93200, 97100, 101200, 105400, 109700, 114100, 118600, 123200, 127900, 132700, 122430]
};

function initNetworthChart(initialData = defaultNetworthData) {
    const ctx = document.getElementById('networthChart');
    if (!ctx) return;

    if (networthChartInstance) {
        networthChartInstance.destroy();
    }

    networthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: initialData.labels,
            datasets: [{
                label: 'Net Worth (USD)',
                data: initialData.values,
                borderColor: '#C9A227',
                backgroundColor: 'rgba(201, 162, 39, 0.12)',
                borderWidth: 3,
                tension: 0.35,
                fill: true,
                pointBackgroundColor: '#C9A227',
                pointBorderColor: '#0A0F1C',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111827',
                    titleColor: '#C9A227',
                    bodyColor: '#E5E7EB',
                    borderColor: '#C9A227',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => '$' + context.raw.toLocaleString()
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#64748B', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#64748B',
                        callback: (value) => '$' + (value / 1000) + 'k'
                    }
                }
            }
        }
    });

    // Expose for external control (used by the SheetJS loader)
    window.networthChartInstance = networthChartInstance;
}

function updateNetworthChart(labels, values, sourceLabel = 'Live upload') {
    if (!window.networthChartInstance) {
        console.warn('Chart not initialized yet');
        return;
    }

    window.networthChartInstance.data.labels = labels;
    window.networthChartInstance.data.datasets[0].data = values;
    window.networthChartInstance.update();

    // Update the small source indicator if it exists
    const sourceEl = document.getElementById('chartSource');
    if (sourceEl) sourceEl.textContent = sourceLabel;
}

// Initialize conviction-specific features
function initConvictionFeatures() {
    // Initialize chart with default data
    initNetworthChart();

    // The heavy SheetJS loader logic lives in conviction.html for now
    // (it is already well-isolated in an IIFE). Future iteration can move it here.

    console.log('%c[Conviction] Chart and loader features initialized.', 'color:#475569;font-size:9px');
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConvictionFeatures);
} else {
    initConvictionFeatures();
}
