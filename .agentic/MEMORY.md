# Project Memory

## Purpose

Personal portfolio for Alphaeus Ng, presenting applied AI/computer-vision work, Christian truth-seeking projects, writing notes, and contact/resume sharing.

## Structure

- `index.html`: main single-page portfolio and modal templates.
- `css/main.css`: shared portfolio foundations.
- `css/home.css`, `css/404.css`, and `css/conviction.css`: route-specific
  styles kept out of HTML entry points.
- `js/main.js`: navbar, mobile menu, smooth scroll, active section highlighting, accessibility behavior.
- `js/modals.js`: rich project case-study modal data and rendering.
- `js/conviction.js`: conviction chart and benchmark application.
- `pages/`: secondary public pages.
- `pages/conviction.html`: standalone TSLA conviction entry point.
- `pages/kobo-forge.html`: compatibility redirect to the separate
  `AlphaeusNg/KoboForge` project site.
- `pages/seeking-biblical-truth/index.html`: data-driven interactive viewer for the Biblical Truth knowledge-base project.
- `pages/seeking-biblical-truth/css/main.css`: viewer-only styles.
- `pages/seeking-biblical-truth/js/app.js`: graph and note-browser application.
- `pages/seeking-biblical-truth/vault-data.json`: generated from `/home/alph/projects/Seeking-Biblical-Truth` Markdown notes and `Big Picture.canvas`.
- `pages/seeking-biblical-truth/js/firebase-config.js`: runtime Firebase keys for the vault editor only.
- `firebase/`: shared Firebase infra (combined Firestore rules + indexes + deploy docs). CLI: root `firebase.json` / `.firebaserc`.
- `assets/`: images and share assets referenced by public pages.
- `tools/`: maintenance scripts grouped by domain.
- `tools/finance/`: financial data extraction utilities.
- `data/tsla_transactions.csv`: imported IBKR TSLA transaction history.
- `data/conviction_tsla_history.json`: split-adjusted monthly dataset consumed by `js/conviction.js`.
- `pages/data/tsla-vs-spy.json`: upstream benchmark series retained for reference.
- `seeking-biblical-truth/index.html`: compatibility redirect.

## Deployment

GitHub Pages serves the repository root from `main`. The current site is zero-build static HTML/CSS/JS. `.nojekyll` must be present so GitHub Pages will not run Jekyll processing (restored if missing).

KoboForge is implemented and deployed only from `/home/alph/projects/KoboForge`.
Portfolio entry points link to `/KoboForge/`; `pages/kobo-forge.html` exists only
as a compatibility redirect for old bookmarks.

## Known Issues And Risks

- Some prior commits attempted to deploy binary assets but the cloned repo contained text placeholders. Verify with `file assets/alphaeus-portrait.jpg`.
- GitHub Pages paths are case-sensitive. Use `pages/seeking-biblical-truth/` for the canonical viewer path.
- The site depends on third-party CDNs. Local rendering requires network access for full styling/scripts.
- Main `index.html` does **not** need D3 or html2canvas — the knowledge-graph case study uses an iframe to `pages/seeking-biblical-truth/`. Keep those heavy libs off the home page.
- Fonts should be loaded once via `<link>` in each HTML entry; avoid duplicate `@import` in CSS/inline styles.
- Local CSS and application JavaScript belong in grouped external assets, not
  inline in HTML. Keep vault-only assets beneath `pages/seeking-biblical-truth/`.
- The Biblical Truth viewer now defaults to rendered Markdown previews and offers a raw-source toggle. Verify both modes after viewer edits.
- Local resume PDFs/DOCX may become stale. The canonical resume share target is the provided Google Drive link.
- The conviction page is intentionally static and should not load private spreadsheets in the browser. Regenerate `data/conviction_tsla_history.json` from `data/tsla_transactions.csv` when the source ledger changes.
- Legacy Jekyll/Minimal Mistakes files were removed after reference checks confirmed the current static entry pages do not use them.

## Validation Steps

Run:

```bash
cd /home/alph/projects/alphaeusng.github.io
python3 -m http.server 8000
```

Then inspect:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/pages/kobo-forge.html` (compatibility redirect)
- `http://127.0.0.1:8000/pages/conviction.html`
- `http://127.0.0.1:8000/pages/seeking-biblical-truth/`
- `http://127.0.0.1:8000/seeking-biblical-truth/` redirect

Also run static checks:

```bash
python3 -m compileall tools
python3 tools/check_site.py
while IFS= read -r file; do node --check "$file"; done < <(rg --files -g '*.js' | sort)
find . -maxdepth 3 -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \) -print
rg -n 'href="#"|Seeking-Biblical-Truth/|src=' index.html js README.md pages
```

For final confidence, use a browser automation pass or manual browser check for console errors, broken images, navigation anchors, modal open/close behavior, and mobile menu behavior.
