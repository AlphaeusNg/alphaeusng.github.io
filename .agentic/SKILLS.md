# Codex Project Skills

This repo is a static GitHub Pages portfolio for Alphaeus Ng. Future agents should treat it as a zero-build site unless a later commit adds a package manager or Jekyll config.

## Primary Workflow

1. Work from `/home/alph/projects/alphaeusng.github.io`. The older `/home/alph/alphaeusng.github.io` checkout is not the primary tree.
2. Check `git status --short --branch` before edits.
3. Use `rg --files` and `rg -n "href=|src=|resume|Seeking-Biblical-Truth|kobo"` before changing links.
4. Serve locally with `python3 -m http.server 8000`.
5. Validate key routes:
   - `/`
   - `/pages/conviction.html`
   - `/pages/dca-calculator.html`
   - `/data/conviction_tsla_history.json`
   - `/data/dca_market_history.json`
   - `/pages/kobo-forge.html` (compatibility redirect to the KoboForge project site)
   - `/pages/seeking-biblical-truth/`
   - compatibility redirect: `/seeking-biblical-truth/`
6. Check browser console and responsive layout at mobile and desktop widths when possible.

## Link And Asset Checks

- Resume CTAs should point to the shared Google Drive resume link:
  `https://docs.google.com/document/d/13kFCvREXmmXATNZhuG3DNd3wkhK-uHIq/edit?usp=drive_link&ouid=117813149167461262984&rtpof=true&sd=true`
- The Biblical Truth repository is:
  `https://github.com/AlphaeusNg/Seeking-Biblical-Truth`
- The canonical viewer path in this repo is:
  `/pages/seeking-biblical-truth/`
- `/seeking-biblical-truth/` is a compatibility redirect.
- The viewer defaults to rendered Markdown and exposes a raw-source toggle in the selected-note panel.
- The conviction page reads `data/conviction_tsla_history.json`, generated from `data/tsla_transactions.csv`.
- GitHub Pages is case-sensitive. Avoid `/Seeking-Biblical-Truth/` unless that exact folder exists.
- Before deleting files, prove they are not referenced by served pages with `rg`.

## Deployment Notes

- GitHub Pages serves from the root of `main`.
- `.nojekyll` is present so GitHub Pages serves this as static files.
- Home and page Tailwind CSS are committed files (`css/tailwind-home.css`, `css/tailwind-pages.css`), rebuilt with `npm run build:styles` when their sources change.
- Checks that exist now: `python3 tools/check_site.py`, `npm run test:dca`, `npm run test:project-routes`, and `npm run test:browser` (Playwright).
- Some pages still load D3, Google Fonts, or Chart.js from a CDN. Do not assume every stylesheet is local.

## Sub-Agent Use

For broad changes, split independent checks into sub-agents:

- Link validation: internal href/src paths, external repo/social/resume links, case-sensitive route issues.
- UI/content review: concision, CTA wording, placeholder content, accessibility, mobile risks.
- Deployment validation: GitHub Pages compatibility, local server routes, asset availability, console errors.

Validate sub-agent results before applying changes.
