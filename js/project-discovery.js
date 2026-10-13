/* Project discovery enhances the existing cards; all cards remain usable without JS. */
(function () {
    'use strict';
    const controls = document.getElementById('project-discovery');
    if (!controls) return;
    const search = document.getElementById('project-search');
    const clear = document.getElementById('project-filter-clear');
    const status = document.getElementById('project-result-count');
    const empty = document.getElementById('project-no-results');
    const buttons = Array.from(controls.querySelectorAll('[data-project-filter]'));
    const categories = new Set(buttons.map(button => button.dataset.projectFilter));
    const cards = Array.from(document.querySelectorAll('#project-grid [data-project-slug]')).map(element => ({
        element,
        topics: element.dataset.projectTopics.split(' '),
        text: element.textContent.toLocaleLowerCase().replace(/\s+/g, ' '),
    }));
    let category = 'all';
    let composing = false;
    let startSearchHistory = true;

    function render() {
        const terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
        let count = 0;
        cards.forEach(card => {
            const matches = (category === 'all' || card.topics.includes(category))
                && terms.every(term => card.text.includes(term));
            card.element.hidden = !matches;
            if (matches) count += 1;
        });
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.projectFilter === category)));
        status.textContent = `${count} of ${cards.length} projects`;
        empty.hidden = count !== 0;
        clear.disabled = category === 'all' && !search.value;
    }

    function readLocation() {
        const params = new URL(window.location.href).searchParams;
        const requested = params.get('projects');
        category = categories.has(requested) ? requested : 'all';
        search.value = (params.get('project-search') || '').slice(0, 160);
        render();
    }

    function writeLocation(push) {
        const url = new URL(window.location.href);
        if (category === 'all') url.searchParams.delete('projects');
        else url.searchParams.set('projects', category);
        const query = search.value.trim();
        if (query) url.searchParams.set('project-search', query);
        else url.searchParams.delete('project-search');
        if (url.href !== window.location.href) {
            window.history[push ? 'pushState' : 'replaceState'](window.history.state, '', url);
        }
    }

    function updateSearch() {
        if (composing) return;
        render();
        writeLocation(startSearchHistory);
        startSearchHistory = false;
    }

    buttons.forEach(button => button.addEventListener('click', () => {
        category = button.dataset.projectFilter;
        render();
        writeLocation(true);
        startSearchHistory = true;
    }));
    search.addEventListener('focus', () => { startSearchHistory = true; });
    search.addEventListener('compositionstart', () => { composing = true; });
    search.addEventListener('compositionend', () => { composing = false; updateSearch(); });
    search.addEventListener('input', event => { if (!event.isComposing) updateSearch(); });
    clear.addEventListener('click', () => {
        category = 'all';
        search.value = '';
        render();
        writeLocation(true);
        search.focus({ preventScroll: true });
    });
    window.addEventListener('popstate', () => {
        composing = false;
        startSearchHistory = true;
        readLocation();
    });
    controls.hidden = false;
    readLocation();
})();
