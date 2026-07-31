const VAULT_JSON = 'vault-data.json';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/AlphaeusNg/Seeking-Biblical-Truth/main/';
const state = {
  data: null,
  selected: null,
  filter: 'all',
  simulation: null,
  zoom: null,
  graphLayer: null,
  noteView: 'rendered', // rendered | source | edit
  byId: {},
  byLookup: {},
  liveCache: Object.create(null),
  loadingNote: null,
  dirty: false,
  editDraft: ''
};

const color = d3.scaleOrdinal()
  .domain(['Word of God', 'Heritage Christian University', 'Meaning of ideas, words', 'Journal', 'Root', 'Canvas'])
  .range(['#5B9BD5', '#C9A227', '#9F7AEA', '#E07A7A', '#CBD5E1', '#4CAF8A']);
const markdown = window.markdownit
  ? window.markdownit({ html: false, linkify: true, breaks: false })
  : { render: text => `<p>${esc(text).replace(/\n/g, '<br>')}</p>` };

const esc = (s = '') => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function bindAutoHideHeader() {
  const header = document.querySelector('.vault-header');
  if (!header) return;
  let lastY = Math.max(0, window.scrollY);
  let ticking = false;

  function update() {
    const y = Math.max(0, window.scrollY);
    const delta = y - lastY;
    if (y <= 16 || delta < 0 || header.matches(':focus-within')) {
      header.classList.remove('is-scroll-hidden');
    } else if (delta > 0 && y > header.offsetHeight) {
      header.classList.add('is-scroll-hidden');
    }
    lastY = y;
    ticking = false;
  }

  header.addEventListener('focusin', () => header.classList.remove('is-scroll-hidden'));
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
}

function normalizeLookupKey(value = '') {
  return decodeURIComponent(value)
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/\.md$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function addLookup(key, node) {
  const normalized = normalizeLookupKey(key);
  if (!normalized || state.byLookup[normalized]) return;
  state.byLookup[normalized] = node;
}

function fileDir(path = '') {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? '' : path.slice(0, idx);
}

function resolveRelativePath(basePath = '', targetPath = '') {
  const base = fileDir(basePath);
  const stack = (targetPath.startsWith('/') ? [] : base.split('/').filter(Boolean));
  targetPath.split('/').forEach(part => {
    if (!part || part === '.') return;
    if (part === '..') {
      stack.pop();
      return;
    }
    stack.push(part);
  });
  return stack.join('/');
}

function buildIndexes() {
  state.byId = Object.fromEntries(state.data.nodes.map(node => [node.id, node]));
  state.byLookup = {};
  state.data.nodes.forEach(node => {
    if (node.type === 'folder') return;
    [node.id, node.path, node.title].forEach(key => addLookup(key, node));
    if (node.path) {
      const base = node.path.split('/').pop();
      addLookup(base, node);
      if (base && base.toLowerCase().endsWith('.md')) addLookup(base.slice(0, -3), node);
    }
  });
}

function preprocessWikiLinks(text = '') {
  return text.replace(/\[\[([^\]|#]+)(#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_, target, heading = '', alias) => {
    const label = alias || target.trim();
    return `[${label}](note:${encodeURIComponent(`${target.trim()}${heading || ''}`)})`;
  });
}

/** Convert Obsidian callouts `> [!note] Title` into HTML callout blocks before markdown-it. */
function preprocessCallouts(text = '') {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^>\s*\[!([^\]]+)\]\s*(.*)$/i);
    if (!m) {
      out.push(lines[i]);
      i += 1;
      continue;
    }
    const kind = m[1].trim().toLowerCase().split('|')[0].trim();
    const title = (m[2] || kind).trim() || kind;
    const body = [];
    i += 1;
    while (i < lines.length && /^>\s?/.test(lines[i])) {
      body.push(lines[i].replace(/^>\s?/, ''));
      i += 1;
    }
    // Use HTML that markdown-it will pass through when html is false — inject after render instead via markers
    out.push(`:::callout{${kind}}{${title}}`);
    if (body.length) out.push(body.join('\n'));
    out.push(':::');
  }
  return out.join('\n');
}

function applyCalloutMarkup(html = '') {
  // Turn :::callout{type}{title} ... ::: into callout divs
  return html.replace(
    /<p>:::callout\{([^}]+)\}\{([^}]*)\}<\/p>([\s\S]*?)<p>:::<\/p>/gi,
    (_, type, title, inner) => {
      const t = esc(type || 'note');
      const label = esc(title || type || 'Note');
      return `<div class="callout" data-callout="${t}"><div class="callout-title">${label}</div>${inner}</div>`;
    }
  ).replace(
    /<p>:::callout\{([^}]+)\}\{([^}]*)\}\s*([\s\S]*?):::<\/p>/gi,
    (_, type, title, inner) => {
      const t = esc(type || 'note');
      const label = esc(title || type || 'Note');
      return `<div class="callout" data-callout="${t}"><div class="callout-title">${label}</div><p>${inner}</p></div>`;
    }
  );
}

function resolveNoteReference(reference, currentNode) {
  const cleaned = decodeURIComponent((reference || '').replace(/^note:/, '')).split('#')[0].trim();
  if (!cleaned) return null;

  const candidates = new Set([cleaned]);
  if (!cleaned.toLowerCase().endsWith('.md')) candidates.add(`${cleaned}.md`);
  if (currentNode && currentNode.path) {
    candidates.add(resolveRelativePath(currentNode.path, cleaned));
    if (!cleaned.toLowerCase().endsWith('.md')) candidates.add(resolveRelativePath(currentNode.path, `${cleaned}.md`));
  }

  for (const candidate of candidates) {
    const match = state.byLookup[normalizeLookupKey(candidate)];
    if (match) return match;
  }
  return null;
}

function renderMarkdown(note) {
  const raw = note.content || note.excerpt || '';
  const prepared = preprocessCallouts(preprocessWikiLinks(raw));
  let html = markdown.render(prepared);
  html = applyCalloutMarkup(html);
  return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
}

function liveNotesEnabled() {
  const el = document.getElementById('live-notes');
  return !el || el.checked;
}

async function fetchLiveNoteBody(note) {
  if (!note?.path || note.type === 'folder' || note.type === 'canvas') return null;
  if (!liveNotesEnabled()) return null;
  const cacheKey = note.path;
  if (state.liveCache[cacheKey]) return state.liveCache[cacheKey];
  try {
    const url = `${GITHUB_RAW_BASE}${note.path.split('/').map(encodeURIComponent).join('/')}?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    state.liveCache[cacheKey] = text;
    return text;
  } catch (err) {
    console.warn('[vault] live note fetch failed', note.path, err);
    return null;
  }
}

function renderNoteContent(note) {
  const raw = note.content || note.excerpt || '';
  if (state.noteView === 'source') return `<pre><code>${esc(raw)}</code></pre>`;
  return renderMarkdown(note);
}

function authState() {
  return window.VaultCloud?.getAuthState?.() || { canEdit: false, configured: false, status: 'off' };
}

function paintAuthBar() {
  const a = authState();
  const statusEl = document.getElementById('auth-status');
  const signIn = document.getElementById('btn-google-signin');
  const signOut = document.getElementById('btn-google-signout');
  if (!statusEl) return;

  if (!a.configured) {
    statusEl.textContent = 'Cloud editor off — set enabled:true in js/firebase-config.js';
    signIn?.classList.add('hidden');
    signOut?.classList.add('hidden');
    return;
  }
  if (a.status === 'connecting') {
    statusEl.textContent = 'Connecting cloud…';
    return;
  }
  if (a.status === 'error') {
    statusEl.textContent = 'Cloud error — check Firebase config / authorized domains';
    signIn?.classList.remove('hidden');
    signOut?.classList.add('hidden');
    return;
  }
  if (a.email) {
    const role = a.canEdit ? 'editor' : 'signed in (read-only)';
    statusEl.innerHTML = `<span class="auth-chip">${a.photoURL ? `<img src="${esc(a.photoURL)}" alt="">` : ''}<span>${esc(a.email)} · ${role}</span></span>`;
    signIn?.classList.add('hidden');
    signOut?.classList.remove('hidden');
  } else {
    statusEl.textContent = 'Sign in with Google to edit & save from any device';
    signIn?.classList.remove('hidden');
    signOut?.classList.add('hidden');
  }
}

function bindPanelLinks(note) {
  const panel = document.getElementById('note-panel');
  panel.querySelectorAll('[data-note-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.noteView === 'edit' && state.dirty) {
        if (!confirm('Discard unsaved edits?')) return;
        state.dirty = false;
      }
      state.noteView = btn.dataset.noteView;
      if (state.noteView === 'edit') {
        state.editDraft = note.content || note.excerpt || '';
      }
      paintNotePanel(note, { liveStatus: note._sourceLabel || '' });
    });
  });

  panel.querySelectorAll('[data-node]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = state.byId[btn.dataset.node];
      if (target) selectNode(target);
    });
  });

  const editor = panel.querySelector('#note-editor');
  if (editor) {
    editor.addEventListener('input', () => {
      state.editDraft = editor.value;
      state.dirty = true;
      const saveBtn = panel.querySelector('#btn-save-note');
      if (saveBtn) saveBtn.disabled = false;
    });
  }

  panel.querySelector('#btn-save-note')?.addEventListener('click', () => saveCurrentNote(note));
  panel.querySelector('#btn-push-github')?.addEventListener('click', () => pushCurrentNote(note));
  panel.querySelector('#btn-cancel-edit')?.addEventListener('click', () => {
    if (state.dirty && !confirm('Discard unsaved edits?')) return;
    state.dirty = false;
    state.noteView = 'rendered';
    paintNotePanel(note, { liveStatus: note._sourceLabel || '' });
  });

  if (state.noteView !== 'rendered') return;

  panel.querySelectorAll('.note-body a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const internal = href.startsWith('note:') ? resolveNoteReference(href, note) : resolveNoteReference(href, note);
    if (internal) {
      link.dataset.node = internal.id;
      link.setAttribute('href', '#');
      link.classList.add('text-[#C9A227]');
      return;
    }
    if (/^(https?:)?\/\//i.test(href)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  panel.querySelectorAll('.note-body [data-node]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = state.byId[link.dataset.node];
      if (target) selectNode(target);
    });
  });
}

async function saveCurrentNote(note) {
  const panel = document.getElementById('note-panel');
  const editor = panel.querySelector('#note-editor');
  const statusLine = panel.querySelector('#edit-status');
  const content = editor ? editor.value : state.editDraft;
  if (!note?.path) return;
  try {
    if (statusLine) statusLine.textContent = 'Saving to cloud…';
    await window.VaultCloud.saveNote(note.path, content, { title: note.title });
    note.content = content;
    const node = state.byId[note.id];
    if (node) node.content = content;
    state.liveCache[note.path] = content;
    state.dirty = false;
    note._sourceLabel = 'cloud (just saved)';
    if (statusLine) statusLine.textContent = 'Saved to cloud — available on any device after you sign in.';
    const saveBtn = panel.querySelector('#btn-save-note');
    if (saveBtn) saveBtn.disabled = true;
  } catch (err) {
    console.error(err);
    if (statusLine) statusLine.textContent = err.message || 'Save failed';
    alert(err.message || 'Save failed');
  }
}

async function pushCurrentNote(note) {
  const panel = document.getElementById('note-panel');
  const editor = panel.querySelector('#note-editor');
  const statusLine = panel.querySelector('#edit-status');
  const content = editor ? editor.value : (note.content || '');
  if (!note?.path) return;
  try {
    if (statusLine) statusLine.textContent = 'Pushing to GitHub…';
    // Save cloud first so web stays in sync
    if (window.VaultCloud?.canEdit?.()) {
      await window.VaultCloud.saveNote(note.path, content, { title: note.title }).catch(() => {});
    }
    await window.VaultCloud.pushNoteToGitHub(note.path, content, {
      message: `web: update ${note.path}`
    });
    note.content = content;
    state.liveCache[note.path] = content;
    note._sourceLabel = 'pushed to GitHub';
    if (statusLine) statusLine.textContent = 'Pushed to GitHub — pull in Obsidian to see it locally.';
  } catch (err) {
    console.error(err);
    if (statusLine) statusLine.textContent = err.message || 'Push failed';
    alert(err.message || 'Push failed');
  }
}

function radius(d) {
  if (d.type === 'folder') return 16;
  if (d.type === 'canvas') return 13;
  return Math.max(7, Math.min(14, 6 + Math.sqrt(d.wordCount || 1) / 8));
}

function visibleNode(d) {
  const term = document.getElementById('search').value.trim().toLowerCase();
  const matchesText = !term || [d.title, d.path, d.excerpt, d.content].join(' ').toLowerCase().includes(term);
  const matchesFolder = state.filter === 'all' || d.group === state.filter || d.id === `folder::${state.filter}`;
  return matchesText && matchesFolder;
}

function renderFolders() {
  const host = document.getElementById('folder-list');
  host.innerHTML = '';
  ['all', ...state.data.folders].forEach(folder => {
    const btn = document.createElement('button');
    btn.className = `block w-full rounded-lg px-3 py-2 text-left text-sm ${state.filter === folder ? 'bg-[#C9A227] text-[#0A0F1C]' : 'text-[#CBD5E1] hover:bg-white/5'}`;
    btn.textContent = folder === 'all' ? 'All notes' : folder;
    btn.addEventListener('click', () => {
      state.filter = folder;
      renderFolders();
      renderFileTree();
      applyVisibility();
    });
    host.appendChild(btn);
  });
}

function renderFileTree() {
  const host = document.getElementById('file-tree');
  if (!host || !state.data) return;
  host.innerHTML = '';
  const notes = state.data.nodes
    .filter(n => n.type === 'note' || n.type === 'canvas')
    .filter(n => state.filter === 'all' || n.group === state.filter)
    .sort((a, b) => (a.path || a.title).localeCompare(b.path || b.title));

  const byFolder = new Map();
  notes.forEach(n => {
    const folder = n.group || 'Root';
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder).push(n);
  });

  for (const [folder, list] of byFolder) {
    const head = document.createElement('div');
    head.className = 'file-tree-folder';
    head.textContent = folder;
    host.appendChild(head);
    list.forEach(n => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `file-tree-item${state.selected?.id === n.id ? ' active' : ''}`;
      btn.textContent = n.title;
      btn.title = n.path || n.id;
      btn.addEventListener('click', () => selectNode(n));
      host.appendChild(btn);
    });
  }
  if (!notes.length) {
    host.innerHTML = '<p class="text-xs text-[#64748B]">No notes in this folder.</p>';
  }
}

function syncGraphHeight() {
  const container = document.getElementById('graph');
  if (!container) return;

  const width = container.clientWidth || container.parentElement?.clientWidth || 0;
  const desktop = window.innerWidth >= 1280;
  const minHeight = desktop ? 500 : 420;
  const maxHeight = desktop ? 620 : 560;
  const viewportCap = Math.round(window.innerHeight * (desktop ? 0.66 : 0.58));
  const aspectHeight = Math.round(width * (desktop ? 0.74 : 0.88));
  const cappedMax = Math.max(minHeight, Math.min(maxHeight, viewportCap));
  const targetHeight = Math.max(minHeight, Math.min(cappedMax, aspectHeight));

  container.style.height = `${targetHeight}px`;
  container.style.minHeight = `${minHeight}px`;
}

function renderGraph() {
  const container = document.getElementById('graph');
  syncGraphHeight();
  const width = container.clientWidth;
  const height = container.clientHeight;
  container.innerHTML = '';

  const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
  const layer = svg.append('g');
  state.graphLayer = layer;
  state.zoom = d3.zoom().scaleExtent([0.18, 5]).on('zoom', e => layer.attr('transform', e.transform));
  svg.call(state.zoom);

  const links = state.data.links.map(d => ({ ...d }));
  const nodes = state.data.nodes.map(d => ({ ...d }));
  const link = layer.append('g').attr('stroke', '#4B5563').attr('stroke-opacity', .45).selectAll('line').data(links).join('line')
    .attr('stroke-width', d => d.type === 'contains' ? .7 : 1.6);
  const node = layer.append('g').selectAll('g').data(nodes).join('g').attr('class', 'node').on('click', (_, d) => selectNode(d))
    .call(d3.drag().on('start', dragStart).on('drag', dragged).on('end', dragEnd));
  node.append('circle').attr('r', radius).attr('fill', d => d.type === 'folder' ? '#0A0F1C' : color(d.group)).attr('stroke', d => d.type === 'folder' ? color(d.group) : '#0A0F1C').attr('stroke-width', 2);
  node.append('text').attr('class', 'graph-label').attr('x', d => radius(d) + 5).attr('y', 4).text(d => d.title.length > 34 ? `${d.title.slice(0, 32)}...` : d.title);

  state.simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.type === 'contains' ? 90 : 135).strength(d => d.type === 'contains' ? .18 : .45))
    .force('charge', d3.forceManyBody().strength(d => d.type === 'folder' ? -560 : -220))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => radius(d) + 20))
    .on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  state.link = link;
  state.node = node;
  applyVisibility();
  setTimeout(fitGraph, 450);
}

function applyVisibility() {
  if (!state.node) return;
  const visible = new Set();
  state.node.each(d => { if (visibleNode(d)) visible.add(d.id); });
  state.node.style('opacity', d => visible.has(d.id) ? 1 : .08);
  state.link.style('opacity', d => visible.has(d.source.id || d.source) && visible.has(d.target.id || d.target) ? .5 : .04);
  document.getElementById('graph-count').textContent = `${visible.size} visible / ${state.data.counts.nodes} nodes`;
}

function paintNotePanel(d, { liveStatus = '' } = {}) {
  if (liveStatus) d._sourceLabel = liveStatus;
  const a = authState();
  const canEdit = !!(a.canEdit && d.path && d.type === 'note');
  const outgoing = state.data.links.filter(l => l.source === d.id || (l.source.id === d.id)).map(l => l.target.id || l.target);
  const incoming = state.data.links.filter(l => l.target === d.id || (l.target.id === d.id)).map(l => l.source.id || l.source);
  const relatedList = ids => ids.filter(id => state.byId[id] && state.byId[id].type !== 'folder').slice(0, 12).map(id => `<button class="block text-left text-[#C9A227] hover:text-[#E8C547]" data-node="${esc(id)}">${esc(state.byId[id].title)}</button>`).join('') || '<span class="text-[#64748B]">None</span>';

  const viewToggle = `
      <div class="inline-flex overflow-hidden rounded-full border border-white/10">
        <button type="button" data-note-view="rendered" class="px-3 py-1.5 ${state.noteView === 'rendered' ? 'bg-[#C9A227] text-[#0A0F1C]' : 'text-[#CBD5E1] hover:bg-white/5'}">Rendered</button>
        <button type="button" data-note-view="source" class="px-3 py-1.5 ${state.noteView === 'source' ? 'bg-[#C9A227] text-[#0A0F1C]' : 'text-[#CBD5E1] hover:bg-white/5'}">Raw</button>
        ${canEdit ? `<button type="button" data-note-view="edit" class="px-3 py-1.5 ${state.noteView === 'edit' ? 'bg-[#C9A227] text-[#0A0F1C]' : 'text-[#CBD5E1] hover:bg-white/5'}">Edit</button>` : ''}
      </div>`;

  const isEdit = state.noteView === 'edit' && canEdit;
  const draft = isEdit
    ? (state.editDraft != null && state.selected?.id === d.id ? state.editDraft : (d.content || d.excerpt || ''))
    : '';

  let bodyHtml;
  if (isEdit) {
    bodyHtml = `
      <div class="mt-4 flex flex-wrap gap-2 text-xs">
        <button type="button" id="btn-save-note" class="rounded-full bg-[#C9A227] px-4 py-2 font-semibold text-[#0A0F1C] hover:bg-[#E8C547]">Save to cloud</button>
        <button type="button" id="btn-push-github" class="rounded-full border border-[#C9A227]/50 px-4 py-2 text-[#C9A227] hover:bg-[#C9A227] hover:text-[#0A0F1C]">Push to GitHub</button>
        <button type="button" id="btn-cancel-edit" class="rounded-full border border-white/10 px-4 py-2 text-[#CBD5E1] hover:border-white/30">Cancel</button>
      </div>
      <p id="edit-status" class="mt-2 text-xs text-[#94A3B8]">Edits save to Firebase (any device after Google login). Push to GitHub if you want Obsidian to pull the file.</p>
      <textarea id="note-editor" class="mt-3" spellcheck="true"></textarea>`;
  } else {
    bodyHtml = `<div class="note-body mt-5 max-h-[64vh] overflow-auto rounded-xl border border-white/10 bg-[#0A0F1C] p-4 text-sm leading-6 text-[#CBD5E1] xl:max-h-[70vh]">${renderNoteContent(d)}</div>`;
  }

  document.getElementById('note-panel').innerHTML = `
    <div class="text-[10px] font-semibold uppercase tracking-[2px] text-[#64748B]">${esc(d.group)} / ${esc(d.type)}${liveStatus ? ` · ${esc(liveStatus)}` : ''}</div>
    <h2 class="mt-2 text-2xl font-semibold tracking-tight">${esc(d.title)}</h2>
    <p class="mt-2 text-xs text-[#64748B]">${esc(d.path || d.id)}</p>
    <div class="mt-4 flex flex-wrap items-center gap-2 text-xs">
      ${d.obsidianUri ? `<a href="${d.obsidianUri}" class="rounded-full border border-[#C9A227]/50 px-3 py-1.5 text-[#C9A227] hover:bg-[#C9A227] hover:text-[#0A0F1C]">Open this note in Obsidian</a>` : ''}
      ${d.path ? `<a href="https://github.com/AlphaeusNg/Seeking-Biblical-Truth/blob/main/${encodeURI(d.path)}" target="_blank" rel="noopener noreferrer" class="rounded-full border border-white/10 px-3 py-1.5 text-[#CBD5E1] hover:text-white">View source</a>` : ''}
      ${viewToggle}
    </div>
    ${bodyHtml}
    <div class="mt-5 grid grid-cols-2 gap-4 text-sm">
      <div><div class="mb-2 text-[10px] uppercase tracking-[2px] text-[#64748B]">Outgoing</div>${relatedList(outgoing)}</div>
      <div><div class="mb-2 text-[10px] uppercase tracking-[2px] text-[#64748B]">Backlinks</div>${relatedList(incoming)}</div>
    </div>`;

  // Set textarea value via DOM API (safe for raw Markdown; avoids entity-escaping issues)
  if (isEdit) {
    const ta = document.getElementById('note-editor');
    if (ta) {
      ta.value = draft;
      state.editDraft = draft;
    }
  }

  bindPanelLinks(d);
  renderFileTree();
}

async function selectNode(d) {
  if (state.noteView === 'edit' && state.dirty && state.selected && state.selected.id !== d.id) {
    if (!confirm('Discard unsaved edits and switch notes?')) return;
    state.dirty = false;
    state.noteView = 'rendered';
  }
  state.selected = d;
  if (state.noteView === 'edit' && !authState().canEdit) state.noteView = 'rendered';

  paintNotePanel(d, { liveStatus: d.path ? 'loading…' : '' });

  if (!d.path || d.type === 'folder' || d.type === 'canvas') {
    paintNotePanel(d, { liveStatus: d.type || '' });
    return;
  }

  const token = `${d.id}:${Date.now()}`;
  state.loadingNote = token;

  // 1) Prefer Firestore cloud save (works from any device after login)
  let sourceLabel = 'snapshot';
  if (window.VaultCloud?.getAuthState?.()?.online) {
    const cloud = await window.VaultCloud.loadNote(d.path);
    if (state.loadingNote !== token || state.selected?.id !== d.id) return;
    if (cloud && typeof cloud.content === 'string') {
      d.content = cloud.content;
      const node = state.byId[d.id];
      if (node) node.content = cloud.content;
      state.liveCache[d.path] = cloud.content;
      sourceLabel = cloud.updatedBy
        ? `cloud · ${cloud.updatedBy}`
        : 'cloud';
      paintNotePanel(d, { liveStatus: sourceLabel });
      if (state.noteView === 'edit') state.editDraft = d.content;
      return;
    }
  }

  // 2) GitHub raw
  if (liveNotesEnabled()) {
    const live = await fetchLiveNoteBody(d);
    if (state.loadingNote !== token || state.selected?.id !== d.id) return;
    if (live != null) {
      d.content = live;
      const node = state.byId[d.id];
      if (node) node.content = live;
      sourceLabel = 'live from GitHub';
      paintNotePanel(d, { liveStatus: sourceLabel });
      if (state.noteView === 'edit') state.editDraft = d.content;
      return;
    }
    sourceLabel = 'snapshot (live fetch failed)';
  }

  paintNotePanel(d, { liveStatus: sourceLabel });
  if (state.noteView === 'edit') state.editDraft = d.content || d.excerpt || '';
}

function fitGraph() {
  if (!state.node || !state.zoom) return;
  const graph = document.getElementById('graph');
  const bounds = state.graphLayer.node().getBBox();
  const scale = Math.max(.18, Math.min(2.2, .9 / Math.max(bounds.width / graph.clientWidth, bounds.height / graph.clientHeight)));
  const tx = graph.clientWidth / 2 - scale * (bounds.x + bounds.width / 2);
  const ty = graph.clientHeight / 2 - scale * (bounds.y + bounds.height / 2);
  d3.select('#graph svg').transition().duration(450).call(state.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}
function resetGraph() { d3.select('#graph svg').transition().duration(300).call(state.zoom.transform, d3.zoomIdentity); state.simulation.alpha(.7).restart(); }
function dragStart(e, d) { if (!e.active) state.simulation.alphaTarget(.25).restart(); d.fx = d.x; d.fy = d.y; }
function dragged(e, d) { d.fx = e.x; d.fy = e.y; }
function dragEnd(e, d) { if (!e.active) state.simulation.alphaTarget(0); d.fx = null; d.fy = null; }

document.getElementById('search').addEventListener('input', applyVisibility);
document.getElementById('fit').addEventListener('click', fitGraph);
document.getElementById('reset').addEventListener('click', resetGraph);
function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
    s.async = true;
    s.onload = () => (window.html2canvas ? resolve(window.html2canvas) : reject(new Error('html2canvas missing')));
    s.onerror = () => reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(s);
  });
}

document.getElementById('export-png').addEventListener('click', async () => {
  const btn = document.getElementById('export-png');
  const prev = btn.textContent;
  try {
    btn.disabled = true;
    btn.textContent = '…';
    const html2canvas = await loadHtml2Canvas();
    const canvas = await html2canvas(document.getElementById('graph'), { backgroundColor: '#0A0F1C', scale: 2 });
    const a = document.createElement('a');
    a.download = 'seeking-biblical-truth-graph.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  } catch (err) {
    console.error(err);
    btn.textContent = 'PNG failed';
    setTimeout(() => { btn.textContent = prev; }, 1600);
    return;
  } finally {
    btn.disabled = false;
    btn.textContent = prev;
  }
});
function scheduleGraphRender() {
  clearTimeout(window.__graphResize);
  window.__graphResize = setTimeout(renderGraph, 180);
}

window.addEventListener('resize', scheduleGraphRender);

let graphResizeObserver = null;

async function loadVault({ bustCache = false, keepSelection = false } = {}) {
  const summary = document.getElementById('vault-summary');
  const refreshBtn = document.getElementById('refresh-vault');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing…';
  }
  try {
    const url = bustCache ? `${VAULT_JSON}?t=${Date.now()}` : VAULT_JSON;
    const res = await fetch(url, { cache: bustCache ? 'no-store' : 'default' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.data = data;
    state.liveCache = Object.create(null);
    buildIndexes();
    const when = new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    summary.textContent = `${data.counts.notes} Markdown notes, ${data.counts.canvas} canvas, and ${data.counts.links} links · loaded ${when}. Sign in with Google to edit online; Save to cloud works from any device.`;
    renderFolders();
    renderFileTree();
    renderGraph();
    if ('ResizeObserver' in window && !graphResizeObserver) {
      const graphPanel = document.getElementById('graph')?.parentElement;
      if (graphPanel) {
        graphResizeObserver = new ResizeObserver(scheduleGraphRender);
        graphResizeObserver.observe(graphPanel);
      }
    }
    const prevId = keepSelection ? state.selected?.id : null;
    const first =
      (prevId && state.byId[prevId]) ||
      data.nodes.find(n => n.path === 'My Search for Truth.md') ||
      data.nodes.find(n => n.type === 'note');
    if (first) selectNode(first);
  } catch (err) {
    summary.textContent = `Could not load vault-data.json: ${err.message}`;
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = 'Refresh vault';
    }
  }
}

document.getElementById('refresh-vault')?.addEventListener('click', () => {
  loadVault({ bustCache: true, keepSelection: true });
});

document.getElementById('btn-google-signin')?.addEventListener('click', async () => {
  try {
    await window.VaultCloud.signInWithGoogle();
    paintAuthBar();
    if (state.selected) selectNode(state.selected);
  } catch (err) {
    console.error(err);
    alert(err.message || 'Google sign-in failed. Check Firebase Google provider + authorized domain alphaeusng.github.io');
  }
});

document.getElementById('btn-google-signout')?.addEventListener('click', async () => {
  try {
    if (state.noteView === 'edit' && state.dirty && !confirm('Discard unsaved edits and sign out?')) return;
    state.noteView = 'rendered';
    state.dirty = false;
    await window.VaultCloud.signOut();
    paintAuthBar();
    if (state.selected) paintNotePanel(state.selected, { liveStatus: state.selected._sourceLabel || '' });
  } catch (err) {
    console.error(err);
  }
});

// Boot cloud + vault
bindAutoHideHeader();
paintAuthBar();
if (window.VaultCloud) {
  window.VaultCloud.onChange(() => {
    paintAuthBar();
    if (state.selected && state.noteView !== 'edit') {
      paintNotePanel(state.selected, { liveStatus: state.selected._sourceLabel || '' });
    }
  });
  window.VaultCloud.init().then(() => paintAuthBar());
}

loadVault();
