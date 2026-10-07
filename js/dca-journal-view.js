/** DOM-only journal presentation. Domain totals and merge rules stay in DcaJournal. */
(function (global) {
    'use strict';
    const document = global.document;
    const MAX_RENDERED_JOURNAL_ROWS = 500;
    const CATCH_UP_PREVIEW = 8;

    function renderLog({ elements, ledger, journalThisMonthOnly, currentMonth, sessionDate,
        formatMonth, formatDate, formatCurrency, formatShares, deleteEntry }) {
        elements.journalBody.replaceChildren();
        const monthRows = ledger.filter((entry) => String(entry.date || '').startsWith(currentMonth));
        const sourceRows = (journalThisMonthOnly ? monthRows : ledger)
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
                : `All entries (${ledger.length})`;
        }
        elements.journalEmpty.hidden = rows.length > 0;
        elements.journalEmpty.textContent = ledger.length
            ? 'No purchases recorded in this month. Switch to all entries to see older sessions.'
            : 'No purchases recorded yet. Use a one-tap chip or Log fill above.';
        if (elements.journalSummary) {
            const summaryRows = journalThisMonthOnly ? monthRows : ledger;
            const spent = summaryRows.reduce((total, entry) => total + Number(entry.amount || 0), 0);
            const sessions = new Set(summaryRows.map((entry) => entry.date)).size;
            const scopeLabel = journalThisMonthOnly ? formatMonth(currentMonth) : 'All entries';
            const summary = summaryRows.length
                ? `${scopeLabel}: ${formatCurrency(spent, 2)} recorded across ${sessions} session${sessions === 1 ? '' : 's'} (${summaryRows.length} fill${summaryRows.length === 1 ? '' : 's'}).`
                : `${scopeLabel}: no fills recorded yet.`;
            elements.journalSummary.textContent = sourceRows.length > rows.length
                ? `${summary} Showing latest ${rows.length} of ${sourceRows.length} entries.`
                : summary;
        }
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

    function renderCatchUp({ elements, rows, throughDate, catchUpShowAll, symbols,
        formatDate, formatCurrency, renderChipButtons }) {
        const missedRows = rows.filter((row) => row.missed);
        const filledRows = rows.filter((row) => !row.missed);
        const visible = catchUpShowAll
            ? rows
            : (missedRows.length ? missedRows : filledRows.slice(0, CATCH_UP_PREVIEW));
        if (elements.catchUpSummary) {
            elements.catchUpSummary.textContent = rows.length
                ? (missedRows.length
                    ? `${missedRows.length} missed session${missedRows.length === 1 ? '' : 's'} through ${formatDate(throughDate, { short: true })}.`
                    : `Caught up through ${formatDate(throughDate, { short: true })}.`)
                : 'No U.S. sessions in this month yet.';
        }
        if (elements.catchUpShowAll) {
            const hiddenFills = !catchUpShowAll && filledRows.length
                && (missedRows.length || filledRows.length > CATCH_UP_PREVIEW);
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
            symbols.forEach((symbol) => {
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

    function createTopUpChip(amount, { date, symbol, compact = false, formatChipAmount, formatDate }) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'log-chip';
        button.dataset.topup = String(amount);
        if (date) button.dataset.date = date;
        if (symbol) button.dataset.symbol = symbol;
        button.textContent = formatChipAmount(amount);
        const when = date ? formatDate(date, { short: true }) : 'the selected session';
        const ticker = symbol;
        button.setAttribute(
            'aria-label',
            compact
                ? `Record ${formatChipAmount(amount)} ${ticker}`
                : `Record ${formatChipAmount(amount)} ${ticker} on ${when}`
        );
        return button;
    }

    function renderChipButtons({ container, amounts, date, symbol, compact = false,
        formatChipAmount, formatDate }) {
        if (!container) return;
        container.replaceChildren();
        amounts.forEach((amount) => {
            container.appendChild(createTopUpChip(amount, { date, symbol, compact, formatChipAmount, formatDate }));
        });
    }


    function renderQuickAmountEditor({ container, amounts, formatChipAmount }) {
        if (!container) return;
        container.replaceChildren();
        amounts.forEach((amount) => {
            const item = document.createElement('span');
            item.className = 'log-chip-editor__item';
            item.append(document.createTextNode(formatChipAmount(amount)));
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.dataset.removeChip = String(amount);
            remove.setAttribute('aria-label', `Remove ${formatChipAmount(amount)} chip`);
            remove.textContent = '×';
            item.appendChild(remove);
            container.appendChild(item);
        });
    }


    global.DcaJournalView = Object.freeze({ renderLog, renderCatchUp, renderChipButtons, renderQuickAmountEditor });
})(window);
