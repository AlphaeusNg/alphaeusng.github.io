# Project Memory

## Purpose

Personal portfolio for Alphaeus Ng, presenting applied AI/computer-vision work, Christian truth-seeking projects, writing notes, and contact/resume sharing.

## Structure

- `index.html`: main single-page portfolio and modal templates.
- `css/main.css`: extracted shared styles used by the main page.
- `js/main.js`: navbar, mobile menu, smooth scroll, active section highlighting, accessibility behavior.
- `js/modals.js`: rich project case-study modal data and rendering.
- `conviction.html`: standalone investment philosophy page, intentionally lower-profile.
- `kobo-forge.html`: standalone KoboForge project page.
- `seeking-biblical-truth/index.html`: static interactive viewer for the Biblical Truth knowledge-base project.
- `assets/`: portrait and resume artifacts. Current user-facing resume links should use the Google Drive document link, not local files.
- `_includes`, `_layouts`, `_sass`, `_data`, `assets/js`: legacy/vendored Minimal Mistakes/Jekyll files. They are not required by the current static homepage, but do not delete without a verified reference/deployment plan.
- `tools/`: KoboForge companion tooling and data extraction utilities.

## Deployment

GitHub Pages serves the repository root from `main`. The current site is zero-build static HTML/CSS/JS. `.nojekyll` is present, so GitHub Pages will not run Jekyll processing.

## Known Issues And Risks

- Some prior commits attempted to deploy binary assets but the cloned repo contained text placeholders for several binary paths. Verify with `file assets/resume.pdf assets/resume.docx assets/alphaeus-portrait.jpg og-image.jpg`.
- GitHub Pages paths are case-sensitive. Use `seeking-biblical-truth/` for the local viewer path.
- `kobo-forge.html` was previously a placeholder string. It should remain a real HTML page if linked from the homepage.
- The site depends on third-party CDNs. Local rendering requires network access for full styling/scripts.
- Local resume PDFs/DOCX may become stale. The canonical resume share target is the provided Google Drive link.

## Validation Steps

Run:

```bash
cd /home/alph/codex/alphaeusng.github.io
python3 -m http.server 8000
```

Then inspect:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/kobo-forge.html`
- `http://127.0.0.1:8000/conviction.html`
- `http://127.0.0.1:8000/seeking-biblical-truth/`

Also run static checks:

```bash
python3 -m compileall tools
find . -maxdepth 3 -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \) -print
rg -n 'href="#"|Seeking-Biblical-Truth/|assets/resume|kobo-forge.html|src=' index.html js README.md
```

For final confidence, use a browser automation pass or manual browser check for console errors, broken images, navigation anchors, modal open/close behavior, and mobile menu behavior.
