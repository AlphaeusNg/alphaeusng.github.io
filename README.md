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
  - `pages/conviction.html`: concentration thesis page with a static TSLA accumulation case study backed by generated JSON.
  - `pages/kobo-forge.html`: KoboForge project page.
  - `pages/seeking-biblical-truth/`: graph viewer generated from the separate vault repo.
- `pages/data/`: static JSON payloads for public pages.
  - `pages/data/tsla-accumulation.json`: owner-anonymized monthly TSLA accumulation series used by `pages/conviction.html`.
- `css/`: site CSS used by the portfolio.
- `js/`: site JavaScript used by the portfolio and modals.
- `assets/`: images and share assets referenced by public pages.
- `tools/`: scripts grouped by domain.
  - `tools/koboforge/`: KoboForge companion tooling.
  - `tools/finance/`: local-only financial data helpers, including the TSLA accumulation extractor.
- `conviction.html`, `kobo-forge.html`, `seeking-biblical-truth/index.html`: compatibility redirects for older links.
- `.nojekyll`: required so GitHub Pages serves this as static files.

## Local Development

```bash
cd /home/alph/codex/alphaeusng.github.io
python3 -m http.server 8000
```

Open:

- http://127.0.0.1:8000/
- http://127.0.0.1:8000/pages/kobo-forge.html
- http://127.0.0.1:8000/pages/conviction.html
- http://127.0.0.1:8000/pages/seeking-biblical-truth/

To regenerate the conviction-page data from a local workbook export:

```bash
python3 tools/finance/extract_tsla_accumulation.py /path/to/Networth\\ Tracker.xlsx --output pages/data/tsla-accumulation.json
```

## Seeking Biblical Truth Viewer

The public viewer is served from `pages/seeking-biblical-truth/`. It uses `vault-data.json`, generated from the separate source repo:

`/home/alph/codex/Seeking-Biblical-Truth`

When the vault changes:

```bash
cd /home/alph/codex/Seeking-Biblical-Truth
python3 tools/generate_vault_data.py
cp pages/vault-data.json /home/alph/codex/alphaeusng.github.io/pages/seeking-biblical-truth/vault-data.json
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
- Put secondary user-facing pages under `pages/`.
- Put static page data under `pages/data/` instead of embedding private workbook logic in the browser.
- Put scripts under `tools/<domain>/`; do not leave one-off scripts in the root.
- Keep `pages/seeking-biblical-truth/` reachable from the portfolio Explore menu and project card.
- Do not add a build system unless there is a clear reason. This repo is intentionally zero-build static HTML/CSS/JS.
- Do not commit private financial spreadsheets, raw private notes, generated caches, or editor state.
- The conviction page intentionally uses a public JSON export instead of loading private spreadsheets client-side.
- Keep old public URLs working with redirect stubs if moving pages.
- Before deleting files, prove they are not referenced by served pages using `rg` and local route checks.
