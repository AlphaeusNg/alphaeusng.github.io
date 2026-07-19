/**
 * Lightweight regression tests for KoboForge pure logic (no browser).
 * Run: node tools/koboforge/test_logic.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, '../../pages/kobo-forge.html');
const page = readFileSync(htmlPath, 'utf8');

function assertIncludes(label, needle) {
    assert.ok(page.includes(needle), `missing ${label}: ${needle}`);
}

// —— Page feature contract ——
const features = [
    ['edit mode', 'data-mode="edit"'],
    ['html mode', 'data-mode="html"'],
    ['canonicalize export', 'forExport'],
    ['page break round-trip', 'kf-page-break'],
    ['page label data-page', "setAttribute('data-page'"],
    ['ncx', 'toc.ncx'],
    ['diagnostics', 'function renderDiagnostics'],
    ['outline', 'chapterOutline'],
    ['prefs', 'koboforge.prefs.v2'],
    ['heading heuristic', 'lineLooksLikeHeading'],
    ['list markdown', 'listBlockToHtml'],
    ['confirm discard', 'Re-extracting will discard'],
];
for (const [label, needle] of features) assertIncludes(label, needle);

// —— Pure helpers mirrored from page (keep in sync if algorithms change) ——
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function isMarkdownTableBlock(block) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return false;
    if (!lines.every((l) => l.includes('|'))) return false;
    const sep = lines[1].replace(/\s/g, '');
    return /^\|?[:\-]+(\|[:\-]+)+\|?$/.test(sep);
}

function markdownTableToHtml(block) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    const parseRow = (line) => {
        let s = line.trim();
        if (s.startsWith('|')) s = s.slice(1);
        if (s.endsWith('|')) s = s.slice(0, -1);
        return s.split('|').map((c) => c.trim());
    };
    const header = parseRow(lines[0]);
    const body = lines.slice(2).map(parseRow);
    let out = '<table class="kobo-table"><tr>';
    header.forEach((cell) => { out += `<th>${escapeHtml(cell)}</th>`; });
    out += '</tr>';
    body.forEach((row) => {
        out += '<tr>';
        for (let i = 0; i < header.length; i += 1) {
            out += `<td>${escapeHtml(row[i] || '')}</td>`;
        }
        out += '</tr>';
    });
    out += '</table>';
    return out;
}

function isListBlock(block) {
    const lines = block.trim().split('\n').filter((l) => l.trim());
    if (!lines.length) return false;
    return lines.every((l) => /^\s*([-*+]|\d+\.)\s+/.test(l));
}

function clusterColumnXs(xs, tolerance) {
    if (!xs.length) return [];
    const sorted = [...xs].sort((a, b) => a - b);
    const clusters = [[sorted[0]]];
    for (let i = 1; i < sorted.length; i += 1) {
        const last = clusters[clusters.length - 1];
        const center = last.reduce((s, v) => s + v, 0) / last.length;
        if (Math.abs(sorted[i] - center) <= tolerance) last.push(sorted[i]);
        else clusters.push([sorted[i]]);
    }
    return clusters.map((c) => c.reduce((s, v) => s + v, 0) / c.length);
}

// Table detection sample
const mdTable = `| Feature | Benefit |
| --- | --- |
| Edit | Fix PDF |
| TOC | Navigate |`;
assert.equal(isMarkdownTableBlock(mdTable), true);
const tableHtml = markdownTableToHtml(mdTable);
assert.match(tableHtml, /<table class="kobo-table">/);
assert.match(tableHtml, /<th>Feature<\/th>/);
assert.match(tableHtml, /<td>Fix PDF<\/td>/);

// List
const list = `1. Open Edit
2. Fix heading
3. Export`;
assert.equal(isListBlock(list), true);
assert.equal(isListBlock('not a list'), false);

// Column clustering
const cols = clusterColumnXs([10, 12, 100, 102, 200], 5);
assert.equal(cols.length, 3);
assert.ok(Math.abs(cols[0] - 11) < 1);

// Soft hyphen join simulation
function joinHyphen(prev, next) {
    if (/[A-Za-z]-$/.test(prev) && /^[a-z]/.test(next)) {
        return prev.replace(/-$/, '') + next;
    }
    return null;
}
assert.equal(joinHyphen('reconstruc-', 'tion'), 'reconstruction');
assert.equal(joinHyphen('hello', 'world'), null);

// Escape
assert.equal(escapeHtml('a < b & c'), 'a &lt; b &amp; c');

// ensureChapterTitle behavior (mirror)
function ensureChapterTitle(html, title) {
    const trimmed = (html || '').trim();
    if (/^<h[12][\s>]/i.test(trimmed)) return trimmed;
    return `<h1>${escapeHtml(title)}</h1>${trimmed}`;
}
assert.equal(
    ensureChapterTitle('<h2>Intro</h2><p>Hi</p>', 'Intro'),
    '<h2>Intro</h2><p>Hi</p>',
    'must not double-title H2 chapters'
);
assert.match(
    ensureChapterTitle('<p>only prose</p>', 'Doc'),
    /^<h1>Doc<\/h1>/
);

// Page label must not be deleted before canonicalize (contract)
assert.ok(
    page.includes("clone.querySelectorAll('.kf-chapter-marker')"),
    'commit must only strip chapter markers, not page labels'
);
assert.ok(
    !page.match(/clone\.querySelectorAll\('\.kf-page-label, \.kf-chapter-marker'\)/),
    'old label-delete path must stay gone'
);
assert.ok(page.includes('bookUrn'), 'NCX/OPF shared urn');
assert.ok(page.includes('ensureChapterTitle'), 'export title helper');
assert.ok(page.includes('formatBlockTag') || page.includes('block-fmt-btn'), 'edit toolbar');
assert.ok(page.includes('stripInvalidXmlChars'), 'XML control-char strip for Kobo');
assert.ok(page.includes('arrayBuffer.slice(0)'), 'PDF buffer copy before getDocument');
assert.ok(page.includes('Failed to extract page'), 'per-page PDF isolation');
assert.ok(page.includes('MAX_INLINE_IMAGE_B64') || page.includes('too large for e-ink'), 'DOCX large-image guard');
assert.ok(page.includes('dropzoneReady') && page.includes('File received'), 'dropzone received state');
assert.ok(page.includes('cancelFileBtn') && page.includes('setDropzoneIdle'), 'cancel upload restores idle dropzone');
assert.ok(page.includes('prepareHtmlForEpub'), 'EPUB body prep for Kobo pagination');
assert.ok(page.includes('page-break-inside:auto'), 'tables/paragraphs must allow page breaks on Kobo');
assert.ok(page.includes("let editMode = 'edit'"), 'spot-check defaults to Edit');
assert.ok(page.includes("setEditMode('edit')"), 'import opens Edit');
assert.ok(page.includes('mode-view'), 'View mode class for device preview');
assert.ok(page.includes('#f4f1e8') || page.includes('f4f1e8'), 'Kobo e-ink paper background on preview');
assert.ok(!page.includes('id="einkToggle"'), 'standalone e-ink toggle removed (View is the device sim)');
assert.ok(page.includes("id=\"splitChapters\"") && !page.match(/id="splitChapters"[^>]*checked/),
    'chapter split off by default for continuous Kobo reading');
assert.ok(page.includes('tag === \'h1\'') || page.includes('tag === "h1"'), 'spine splits H1 only');
assert.ok(page.includes('ratio >= 1.55'), 'conservative PDF heading size threshold');
// EPUB styles.css string must not set pre-wrap (preview CSS may still use it)
const epubCssMatch = page.match(/oebps\.file\('styles\.css',\s*\[([\s\S]*?)\]\.join/);
assert.ok(epubCssMatch, 'EPUB CSS built as array join');
assert.ok(
    !epubCssMatch[1].includes('pre-wrap'),
    'EPUB styles.css must not use white-space:pre-wrap (Kobo page-turn freeze)'
);

console.log('All KoboForge logic tests passed.');
