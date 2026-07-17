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
index.html                 # Main SPA-like portfolio
css/main.css
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
  kobo-forge.html
  seeking-biblical-truth/  # Public vault viewer (vault-data.json)
    js/firebase-config.js  # Runtime vault editor keys only
  README.md
data/                      # Public JSON/CSV (conviction history, etc.)
assets/                    # Images, resume files
tools/
  check_site.py
  finance/                 # TSLA/SPY generators (local data helpers)
  koboforge/
  extract_networth_data.py
robots.txt  sitemap.xml  .nojekyll
```

## Sibling projects (linked, separate repos)

| Project | Local path | URL |
|---|---|---|
| AlpArcade | `/home/alph/projects/AlpArcade` | https://alphaeusng.github.io/AlpArcade/ |
| VerseKeep | `/home/alph/projects/VerseKeep` | https://alphaeusng.github.io/VerseKeep/ |
| Vault source | `/home/alph/projects/Seeking-Biblical-Truth` | (content repo; viewer is under `pages/seeking-biblical-truth/`) |

Do **not** implement arcade or VerseKeep features in this repo — only links and portfolio cards.

## Commands

```bash
cd /home/alph/projects/alphaeusng.github.io
python3 -m http.server 8000
# http://127.0.0.1:8000/
# http://127.0.0.1:8000/pages/conviction.html
# http://127.0.0.1:8000/pages/kobo-forge.html
# http://127.0.0.1:8000/pages/seeking-biblical-truth/

python3 tools/check_site.py
python3 -m compileall tools
node --check js/main.js && node --check js/modals.js && node --check js/conviction.js
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

## Deploy

GitHub Pages from **`main` / repository root**.

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
