# Project Memory

## Purpose

Personal portfolio for Alphaeus Ng, presenting applied AI/computer-vision work, Christian truth-seeking projects, writing notes, and contact/resume sharing.

## Structure

- `index.html`: main single-page portfolio and modal templates.
- `css/main.css`: extracted shared styles used by the main page.
- `js/main.js`: navbar, mobile menu, smooth scroll, active section highlighting, accessibility behavior.
- `js/modals.js`: rich project case-study modal data and rendering.
- `pages/`: secondary public pages.
- `pages/conviction.html`: standalone investment philosophy page, intentionally lower-profile.
- `pages/kobo-forge.html`: standalone KoboForge project page.
- `pages/seeking-biblical-truth/index.html`: data-driven interactive viewer for the Biblical Truth knowledge-base project.
- `pages/seeking-biblical-truth/vault-data.json`: generated from `/home/alph/codex/Seeking-Biblical-Truth` Markdown notes and `Big Picture.canvas`.
- `assets/`: images and share assets referenced by public pages.
- `tools/`: maintenance scripts grouped by domain.
- `tools/koboforge/`: KoboForge companion tooling.
- `tools/finance/`: financial data extraction utilities.
- Root `conviction.html`, `kobo-forge.html`, and `seeking-biblical-truth/index.html`: compatibility redirects.

## Deployment

GitHub Pages serves the repository root from `main`. The current site is zero-build static HTML/CSS/JS. `.nojekyll` is present, so GitHub Pages will not run Jekyll processing.

## Known Issues And Risks

- Some prior commits attempted to deploy binary assets but the cloned repo contained text placeholders. Verify with `file assets/alphaeus-portrait.jpg og-image.jpg`.
- GitHub Pages paths are case-sensitive. Use `pages/seeking-biblical-truth/` for the canonical viewer path.
- `kobo-forge.html` is a redirect; the actual page is `pages/kobo-forge.html`.
- The site depends on third-party CDNs. Local rendering requires network access for full styling/scripts.
- The Biblical Truth viewer now defaults to rendered Markdown previews and offers a raw-source toggle. Verify both modes after viewer edits.
- Local resume PDFs/DOCX may become stale. The canonical resume share target is the provided Google Drive link.
- Legacy Jekyll/Minimal Mistakes files were removed after reference checks confirmed the current static entry pages do not use them.

## Validation Steps

Run:

```bash
cd /home/alph/codex/alphaeusng.github.io
python3 -m http.server 8000
```

Then inspect:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/pages/kobo-forge.html`
- `http://127.0.0.1:8000/pages/conviction.html`
- `http://127.0.0.1:8000/pages/seeking-biblical-truth/`
- `http://127.0.0.1:8000/seeking-biblical-truth/` redirect

Also run static checks:

```bash
python3 -m compileall tools
find . -maxdepth 3 -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \) -print
rg -n 'href="#"|Seeking-Biblical-Truth/|src=' index.html js README.md pages
```

For final confidence, use a browser automation pass or manual browser check for console errors, broken images, navigation anchors, modal open/close behavior, and mobile menu behavior.
