# alphaeusng.github.io

Personal site of Alphaeus Ng — AI Research Engineer and truth-seeker.

**Live site:** [https://alphaeusng.github.io](https://alphaeusng.github.io)

## Design

A modern, elegant, single-page static site built with:

- Tailwind CSS (via CDN)
- Playfair Display + Inter typography
- Subtle gold accents on deep midnight backgrounds
- Thoughtful integration of professional work and Christian faith
- Zero build step — pure HTML + vanilla JS

## Philosophy

This site exists to clearly communicate two integrated realities:
- My work at the frontier of applied AI (computer vision, language models, real-world systems)
- My deep commitment to the rigorous pursuit of Biblical truth

The design is intentionally restrained, reverent, and professional. Gold accents reference light, wisdom, and value without overt religious iconography.

## Local Development

```bash
cd /home/alph/codex/alphaeusng.github.io
python3 -m http.server 8000
```

Then open http://localhost:8000

## Seeking Biblical Truth

The public viewer lives in `seeking-biblical-truth/` and links to the canonical GitHub repository:
`https://github.com/AlphaeusNg/Seeking-Biblical-Truth`.

- **Entry point in UI:** In "The Craft" section, the "Seeking Biblical Truth" project card links to the lowercase GitHub Pages path:
  `seeking-biblical-truth/`.

- **Key notes:**
  - GitHub Pages paths are case-sensitive; use `/seeking-biblical-truth/`, not `/Seeking-Biblical-Truth/`.
  - The viewer is committed as static HTML plus `vault-data.json`; do not clone the full vault into this path.
  - Regenerate `vault-data.json` from `/home/alph/codex/Seeking-Biblical-Truth` when the source notes change.
  - The viewer includes `obsidian://open?vault=Seeking-Biblical-Truth` links for users who have cloned the vault and opened it in Obsidian.

---

## Deployment

This site is designed for GitHub Pages.

### Recommended:

1. Keep `.nojekyll` in the repo root so GitHub Pages serves the site as static files.
2. Commit changes to `main`.
3. Verify the live routes after Pages finishes deployment.

GitHub Pages will serve the new `index.html` immediately.

**Full site files for deployment**: `index.html`, `conviction.html`, `kobo-forge.html`, `seeking-biblical-truth/`, `css/`, `js/`, `assets/`, `tools/`, and supporting files (`.gitignore`, this README).

KoboForge's static overview page is `kobo-forge.html`; the active companion script lives at `tools/koboforge-companion.py`.

## KoboForge

The flagship addition to the portfolio: **KoboForge**, a privacy-first, ultra-robust PDF/DOCX to EPUB converter purpose-built for Kobo readers.

- **Python Companion:** `tools/koboforge-companion.py`.
- **Web page:** `kobo-forge.html` is a static overview page linked from the portfolio.
- **Local usage:** run the companion CLI directly:
  `python3 tools/koboforge-companion.py input.pdf --output output.epub`.
- **Future:** Full web UI + reports can be added in follow-up without regressing the 5-task site polish.

This project (and the Seeking Biblical Truth vault + tooling) demonstrates the same rigor applied to professional computer vision work.

## Prior Site Polish Notes

This deployment closes a 5-task plan:

1. Navigation & Discoverability: Explore dropdown (desktop + mobile accordion) linking Thoughts / KoboForge / Conviction / CV.
2. Resume Experience: Prominent `#cv-downloads` card in Connect pointing at the canonical Google Drive resume link.
3. Reflections Filter: JS-driven filter with counts and reset.
4. Seeking Biblical Truth Integration: bundled static viewer at `seeking-biblical-truth/` plus external GitHub repository links.
5. Knowledge Graph & Code Hygiene: responsive D3 knowledge graph in modals, extracted `js/main.js`, `js/modals.js`, and `css/main.css`.

Use the validation commands in `MEMORY.md` before publishing new changes.

## Customization

- Update email, LinkedIn URL, and project links in `index.html`
- Add a high-quality professional headshot (recommended)
- Tweak colors in the `<style>` block (current accent: `#C9A227`)
- Expand the Reflections section with your actual writing

## Personal Pages (Intentionally Low-Profile)

The main site is intentionally focused on professional work and faith integration for resume / networking purposes.

- **conviction.html** — Personal high-conviction investment philosophy (modeled after Steven Mark Ryan's concentrated approach). This page is deliberately not linked in the main navigation. It is only discoverable via:
  - The very subtle link in the site footer
  - This README
  - Direct URL: https://alphaeusng.github.io/conviction.html

This separation keeps the primary experience clean and professional while still giving the full picture to those who know where to look.

## Credits

Designed and built for Alphaeus Ng. All content and voice are his.

---

*"The created creating, pursuing the Uncaused Cause."*
