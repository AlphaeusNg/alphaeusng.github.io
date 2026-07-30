# AGENTS.md — alphaeusng.github.io (portfolio)

**Live:** https://alphaeusng.github.io/  
**Repo:** https://github.com/AlphaeusNg/alphaeusng.github.io  
**Local:** `/home/alph/projects/alphaeusng.github.io`  
**Hub:** `/home/alph/projects/AGENTS.md`  
**Extra memory:** `.agentic/MEMORY.md`, `.agentic/SKILLS.md`

## Purpose

Personal portfolio for Alphaeus Ng: applied AI / CV / NLP work, contact & resume, conviction writing, KoboForge, and the public Seeking Biblical Truth *viewer*. Design stays restrained and recruiter-friendly.

## Structure

```text
index.html                 # Main SPA-like portfolio entry point
404.html                   # GitHub Pages fallback entry point
css/
  main.css                 # Shared portfolio foundations
  home.css
  404.css
  conviction.css
js/main.js                 # Nav, mobile menu, scroll, a11y
js/modals.js               # Project case-study modal content
js/conviction.js
js/version.js              # SITE_VERSION — bump every deploy
firebase/                  # Shared Firebase infra (rules + indexes + docs)
  README.md
  firestore.rules          # Combined: arcade scores/players/progress + vaultNotes
  firestore.indexes.json
firebase.json  .firebaserc # CLI entry (repo root — standard)
pages/
  conviction.html
  kobo-forge.html          # compatibility redirect to /KoboForge/
  seeking-biblical-truth/  # Public vault viewer (vault-data.json)
    css/main.css
    js/app.js
    js/firebase-config.js  # Runtime vault editor keys only
    js/vault-cloud.js
  README.md
data/                      # Public JSON/CSV (conviction history, etc.)
assets/                    # Images, resume files
tools/
  check_site.py
  finance/                 # TSLA/SPY generators (local data helpers)
  extract_networth_data.py
robots.txt  sitemap.xml  .nojekyll
```

## Sibling projects (linked, separate repos)

| Project | Local path | URL |
|---|---|---|
| KoboForge | `/home/alph/projects/KoboForge` | https://alphaeusng.github.io/KoboForge/ |
| AlpArcade | `/home/alph/projects/AlpArcade` | https://alphaeusng.github.io/AlpArcade/ |
| VerseKeep | `/home/alph/projects/VerseKeep` | https://alphaeusng.github.io/VerseKeep/ |
| ChristoDay | `/home/alph/projects/ChristoDay` | https://alphaeusng.github.io/ChristoDay/ |
| CardFitSG | `/home/alph/projects/CardFitSG` | https://alphaeusng.github.io/CardFitSG/ |
| Vault source | `/home/alph/projects/Seeking-Biblical-Truth` | (content repo; viewer is under `pages/seeking-biblical-truth/`) |

Do **not** implement KoboForge, arcade, VerseKeep, ChristoDay, or CardFitSG
features in this repo — only links, compatibility redirects, and portfolio
cards.

## Commands

```bash
cd /home/alph/projects/alphaeusng.github.io
python3 -m http.server 8000
# http://127.0.0.1:8000/
# http://127.0.0.1:8000/pages/conviction.html
# http://127.0.0.1:8000/pages/kobo-forge.html  # redirect
# http://127.0.0.1:8000/pages/seeking-biblical-truth/

python3 tools/check_site.py
python3 -m compileall tools
while IFS= read -r file; do node --check "$file"; done < <(rg --files -g '*.js' | sort)
```

### Vault data refresh (from sibling repo)

```bash
cd /home/alph/projects/Seeking-Biblical-Truth
python3 tools/generate_vault_data.py
cp pages/vault-data.json /home/alph/projects/alphaeusng.github.io/pages/seeking-biblical-truth/vault-data.json
```

### Finance data

- Conviction page reads `data/conviction_tsla_history.json` (committed).
- Regenerate helpers live under `tools/finance/` — do not load private spreadsheets in the browser.

## Conventions

- Zero-build static site; keep `.nojekyll`.
- Bump `js/version.js` → `SITE_VERSION.id` (`YYYY.MM.DD.N`) on every deploy.
- Prefer compressed web images under `assets/`.
- GitHub Pages paths are **case-sensitive**.
- Home page should stay light — heavy graph libs belong only in the vault viewer page.
- Fonts: load once via `<link>` per HTML entry; avoid duplicate `@import`.
- Keep local CSS and application JavaScript in grouped external assets. Root-level
  page assets belong in `css/` and `js/`; vault-only assets stay with the viewer.

## Deploy

GitHub Pages from **`main` / repository root**.

User requests to add, change, fix, or remove portfolio functionality authorize
the complete standard deployment flow: validate, bump the site version, commit,
and push to `main` without waiting for a separate green signal. Only keep work
local or stop before pushing when the user explicitly asks for that. This does
not authorize force-pushes, history rewrites, unrelated changes, or bypassing
failed validation.

```bash
# after validation
git add -A && git status
git commit -m "Describe the user-facing change"
git push origin main
```

## Agent checklist

1. Confirm the change belongs in the portfolio (not AA/VK/vault content).
2. Edit the smallest set of files; match existing CSS tokens.
3. Run `tools/check_site.py` and syntax checks when structure changes.
4. Bump version; commit only this repo.
5. If vault content changed, sync `vault-data.json` as above (separate commit in this repo and/or the vault repo).
