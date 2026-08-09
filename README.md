# alphaeusng.github.io

Personal GitHub Pages site for Alphaeus Ng.

Live site: https://alphaeusng.github.io

## Original Intent

This site exists to communicate two integrated realities clearly:

- Professional work at the frontier of applied AI, computer vision, language models, and real-world systems.
- A serious Christian pursuit of Biblical truth, including the public `Seeking-Biblical-Truth` vault viewer.

The design should remain restrained, professional, and easy to share. It should help recruiters, collaborators, friends, and thoughtful readers quickly find the resume, projects, GitHub, LinkedIn, and faith-related work without wading through implementation clutter.

## Repository Structure

- `index.html`: main portfolio page served from the GitHub Pages root.
- `pages/`: secondary public pages.
  - `pages/conviction.html`: conviction page.
  - `pages/kobo-forge.html`: compatibility redirect to the standalone
    [KoboForge repository](https://github.com/AlphaeusNg/KoboForge).
  - `pages/seeking-biblical-truth/`: graph viewer generated from the separate vault repo.
- `seeking-biblical-truth/index.html`: compatibility redirect for old viewer bookmarks.
- `data/`: root-level public data payloads.
  - `data/conviction_tsla_history.json`: TSLA transaction history plus the benchmark comparison used by `pages/conviction.html`.
- `css/`: grouped site styles (`main.css` shared foundations plus route-specific
  `home.css`, `404.css`, and `conviction.css`).
- `js/`: grouped site applications (`main.js`, `modals.js`, `conviction.js`,
  and the shared `version.js` deployment stamp).
- `pages/seeking-biblical-truth/css/` and `pages/seeking-biblical-truth/js/`:
  feature-local viewer assets, including the documented Firebase runtime files.
- `assets/`: images and share assets referenced by public pages (prefer compressed JPEG web assets; keep originals only when needed).
- `robots.txt` / `sitemap.xml`: basic crawl hints for the public site.
- `tools/`: scripts grouped by domain.
  - `tools/finance/`: local-only financial data helpers, including the TSLA-versus-SPY benchmark generator, the legacy benchmark snapshot, and the anonymized trade ledger.
- `.nojekyll`: required so GitHub Pages serves this as static files.

## Local Development

```bash
cd /home/alph/projects/alphaeusng.github.io   # local workspace path
python3 -m http.server 8000
```

Open:

- http://127.0.0.1:8000/
- http://127.0.0.1:8000/pages/conviction.html
- http://127.0.0.1:8000/pages/kobo-forge.html (redirects to the standalone site)
- http://127.0.0.1:8000/pages/seeking-biblical-truth/

The conviction page reads from `data/conviction_tsla_history.json`, which is
committed directly in this repo. Regenerate it after changing its tracked
transaction or price-history inputs, then verify freshness without rewriting
the informational generation timestamp:

```bash
python3 tools/finance/generate_conviction_history.py
python3 tools/finance/generate_conviction_history.py --check
```

To regenerate the older benchmark-only dataset:

```bash
python3 tools/finance/generate_tsla_vs_spy.py
```

The generator reads `tools/finance/tsla_trades_anonymized.csv` and writes the legacy monthly TSLA/SPY snapshot to `tools/finance/tsla-vs-spy.json`.

## Seeking Biblical Truth Viewer

The public viewer is served from `pages/seeking-biblical-truth/`. It uses `vault-data.json`, generated from the separate source repo:

`/home/alph/projects/Seeking-Biblical-Truth`

When the vault changes:

```bash
cd /home/alph/projects/Seeking-Biblical-Truth
python3 tools/generate_vault_data.py
cp pages/vault-data.json /home/alph/projects/alphaeusng.github.io/pages/seeking-biblical-truth/vault-data.json
```

The viewer includes `obsidian://open?vault=Seeking-Biblical-Truth` links for users who cloned and opened the vault in Obsidian.
It also defaults to rendered Markdown previews with a raw-source toggle in the note panel.

## Validation

Run before pushing:

```bash
python3 -m unittest discover -s tools -p 'test_*.py'
python3 tools/finance/generate_conviction_history.py --check
python3 tools/check_site.py
npm ci
npx playwright install chromium
npm run test:browser
python3 -m compileall tools
while IFS= read -r file; do node --check "$file"; done < <(rg --files -g '*.js' | sort)
python3 -m http.server 8000
```

The checker fixtures, conviction-data accounting contracts, site contracts,
Chromium interaction smokes, Python compilation, and JavaScript syntax checks
run in least-privilege GitHub Actions on every `main` push and pull request. The
workflow policy is validated by `tools/check_site.py` alongside the complete
case-sensitive local HTML reference graph. Playwright is test-only; the deployed
site remains zero-build with no runtime package dependency.

Then check:

```bash
curl -I http://127.0.0.1:8000/
curl -I http://127.0.0.1:8000/pages/seeking-biblical-truth/
curl -I http://127.0.0.1:8000/pages/seeking-biblical-truth/vault-data.json
```

## For Future Agents

- Preserve `index.html` at the repo root; GitHub Pages expects it.
- Keep `index.html` as the only root-level HTML entry point for the portfolio home.
- Put secondary public pages under `pages/` and keep the site links aligned with that structure.
- Keep local CSS and application JavaScript out of HTML entry points. Put
  site-wide/standalone-page assets in root `css/` and `js/`, and colocate
  feature-only assets beneath the feature directory.
- Put public page data in the location actually used by the served page; do not leave duplicate active datasets with divergent outcomes.
- Put scripts under `tools/<domain>/`; do not leave one-off scripts in the root.
- Keep `pages/seeking-biblical-truth/` reachable from the portfolio Explore menu and project card.
- Do not add a build system unless there is a clear reason. This repo is intentionally zero-build static HTML/CSS/JS.
- Do not commit private financial spreadsheets, raw private notes, generated caches, or editor state.
- The conviction page intentionally uses a public JSON export instead of loading private spreadsheets client-side.
- The embedded benchmark comparison on `pages/conviction.html` is monthly-close and uses the same dated trade path against a public SPY proxy series.
- Before deleting files, prove they are not referenced by served pages using `rg` and local route checks.
- Do not keep duplicate root-level and `pages/` copies of the same public page once one canonical route has been chosen.
