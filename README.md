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
- `conviction.html`: root-served TSLA conviction page built from the imported IBKR transaction CSV.
- `kobo-forge.html`: root-served client-side EPUB builder.
- `pages/`: secondary public pages.
  - `pages/seeking-biblical-truth/`: graph viewer generated from the separate vault repo.
- `data/`: static data payloads for public pages.
  - `data/tsla_transactions.csv`: imported IBKR TSLA trade history.
  - `data/conviction_tsla_history.json`: split-adjusted monthly ledger used by `conviction.html`.
- `css/`: site CSS used by the portfolio.
- `js/`: site JavaScript used by the portfolio and modals.
- `assets/`: images and share assets referenced by public pages.
- `tools/`: scripts grouped by domain.
  - `tools/koboforge/`: KoboForge companion tooling.
  - `tools/finance/`: local-only financial helpers retained from the upstream reorganization.
- `seeking-biblical-truth/index.html`: compatibility redirect into `pages/seeking-biblical-truth/`.
- `.nojekyll`: required so GitHub Pages serves this as static files.

## Local Development

```bash
cd /home/alph/alphaeusng.github.io
python3 -m http.server 8000
```

Open:

- http://127.0.0.1:8000/
- http://127.0.0.1:8000/kobo-forge.html
- http://127.0.0.1:8000/conviction.html
- http://127.0.0.1:8000/pages/seeking-biblical-truth/

## Seeking Biblical Truth Viewer

The public viewer is served from `pages/seeking-biblical-truth/`. It uses `vault-data.json`, generated from the separate source repo:

`/home/alph/codex/Seeking-Biblical-Truth`

When the vault changes:

```bash
cd /home/alph/codex/Seeking-Biblical-Truth
python3 tools/generate_vault_data.py
cp pages/vault-data.json /home/alph/alphaeusng.github.io/pages/seeking-biblical-truth/vault-data.json
```

The viewer includes `obsidian://open?vault=Seeking-Biblical-Truth` links for users who cloned and opened the vault in Obsidian.
It also defaults to rendered Markdown previews with a raw-source toggle in the note panel.

## Validation

Run before pushing:

```bash
python3 -m compileall tools
node --check js/main.js
node --check js/modals.js
python3 -m http.server 8000
```

Then check:

```bash
curl -I http://127.0.0.1:8000/
curl -I http://127.0.0.1:8000/pages/seeking-biblical-truth/
curl -I http://127.0.0.1:8000/pages/seeking-biblical-truth/vault-data.json
```

## For Future Agents

- Preserve `index.html` at the repo root; GitHub Pages expects it.
- Keep `conviction.html` and `kobo-forge.html` as real root-served pages, not redirect stubs.
- Put secondary user-facing pages under `pages/` when they do not need top-level routes.
- Put static page data under `data/` instead of embedding private workbook logic in the browser.
- Put scripts under `tools/<domain>/`; do not leave one-off scripts in the root.
- Keep `pages/seeking-biblical-truth/` reachable from the portfolio Explore menu and project card.
- Do not add a build system unless there is a clear reason. This repo is intentionally zero-build static HTML/CSS/JS.
- Do not commit private financial spreadsheets, raw private notes, generated caches, or editor state.
- The conviction page intentionally uses the imported `data/tsla_transactions.csv` plus generated `data/conviction_tsla_history.json`, not private spreadsheets or workbook logic.
- Keep old public URLs working when moving pages, but do not regress live root routes into redirects without checking navigation first.
- Before deleting files, prove they are not referenced by served pages using `rg` and local route checks.
