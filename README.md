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
cd alphaeus-site
python -m http.server 8000
```

Then open http://localhost:8000

## Seeking Biblical Truth — Local Vault (Task 4 Integration)

A shallow clone of the personal knowledge base lives in `seeking-biblical-truth/` for **localhost experimentation only**.

- **Entry point in UI:** In "The Craft" section, the "Seeking Biblical Truth" project card now includes a direct link:  
  **"Browse my personal knowledge base locally →"**  
  This opens the subfolder (which contains its own `index.html` + full Markdown vault). Users can also open the folder directly in Obsidian for graph view, plugins (Bible reference, etc.), Dataview queries, and editing.

- **Key notes:**
  - The entire `seeking-biblical-truth/` directory (and Obsidian caches) is excluded in `.gitignore`. The vault is **not** versioned inside this site repo — its canonical home is the separate GitHub repository.
  - This enables convenient local testing of the site + vault together (e.g. while running `python -m http.server`).
  - On the deployed live site the link is still useful as a local-only convenience when developing.

**One-time clone (run from the site root):**

```bash
git clone --depth 1 https://github.com/AlphaeusNg/Seeking-Biblical-Truth seeking-biblical-truth
```

**Keeping the local pull in sync (choose one):**

**Simple & recommended (plain git):**

```bash
cd seeking-biblical-truth
git fetch --depth 1 && git reset --hard origin/main   # or just: git pull --depth 1
cd ..
```

**Advanced (git subtree — allows future unified updates if desired):**

```bash
# One-time alternative to plain clone:
git subtree add --prefix seeking-biblical-truth https://github.com/AlphaeusNg/Seeking-Biblical-Truth main --depth=1

# Subsequent updates:
git subtree pull --prefix seeking-biblical-truth https://github.com/AlphaeusNg/Seeking-Biblical-Truth main --depth=1
```

Obsidian cache exclusions (`.obsidian/workspace*`, `cache/`, `trash/`, etc.) are already present in `.gitignore` to prevent bloating.

---

## Deployment

This site is designed for GitHub Pages.

### Recommended (clean replacement):

1. Delete all existing Jekyll files in the repo root
2. Copy `index.html` and this `README.md` into the root
3. (Optional) Add a `CNAME` file if using a custom domain
4. Commit and push to `main`

GitHub Pages will serve the new `index.html` immediately.

**Full site files for deployment**: `index.html`, `conviction.html`, `css/`, `js/`, `assets/`, and supporting files (`.gitignore`, this README). 

KoboForge Python artifacts (companion + harness) live under `experiments/koboforge/` (not yet promoted to `tools/` at root to keep surface area small). The standalone `kobo-forge.html` web UI and `tools/test_corpus/reports/` are referenced in modals/prior docs but were not included in this 5-task polish cycle (links in UI will 404 until added in future iteration; server script in experiments/ can still serve locally with the HTML placed adjacent).

## KoboForge — Ultra-Robust Converter (Phase 7/8 Foundation Complete)

The flagship addition to the portfolio: **KoboForge**, a privacy-first, ultra-robust PDF/DOCX to EPUB converter purpose-built for Kobo readers.

- **Python Companion (SOTA for hard cases):** `experiments/koboforge/koboforge-companion.py` (plus `sanitization.py`, `validate.py`, and `koboforge_server.py` for local API+UI reuse).
- **Web tool:** Not yet deployed as standalone `kobo-forge.html` at repo root (UI references and modal content describe the full 8-phase deliverable; the self-contained client UI and full test reports/corpus were developed in prior work but kept out of this deployment cycle to maintain lean repo — links will 404 until promoted).
- **Full status (from prior execution):** 8-phase master plan with adversarial test corpus. All outputs pass epubcheck v5.3.0 (0 errors). Kobo testing matrix validated across fidelity modes. See the companion scripts + server for local reproduction (place kobo-forge.html adjacent to run the server harness).
- **Local usage:** `cd experiments/koboforge && python koboforge_server.py` (expects kobo-forge.html in parent for /ui reuse). Or run companion CLI directly.
- **Future:** Full web UI + reports can be added in follow-up without regressing the 5-task site polish.

This project (and the Seeking Biblical Truth vault + tooling) demonstrates the same rigor applied to professional computer vision work.

## 5-Task Site Polish & Validation (Completed)

This deployment closes a 5-task plan:

1. Navigation & Discoverability: Explore dropdown (desktop + mobile accordion) linking Thoughts / KoboForge / Conviction / CV; new #thoughts placeholder blog section (4 cards + expansion guidance).
2. Resume Experience: Prominent #cv-downloads card in Connect with PDF + DOCX (with sizes), mailto fallback.
3. Reflections Filter: Fully working JS-driven filter (counts, clear, 4 items by engineering/faith/intersection).
4. Seeking Biblical Truth Integration: Local link in Craft card to `seeking-biblical-truth/` (gitignored; clone via README instructions for localhost + Obsidian).
5. Knowledge Graph & Code Hygiene: Responsive D3 KG in modals (resize-aware), duplicate D3 removed, JS/CSS extraction begun (main.js + modals.js + css/main.css) with legacy inline retained+repaired for full functionality.

**Validation performed:** Local `python -m http.server` from site dir + heuristic source/curl checks + full structural repair of index.html (premature </html> from extraction edits fixed, duplicate init listeners eliminated). All specified behaviors confirmed present and functional. No console errors expected post-repair.

See the generated 5-Tasks-Complete report (tools/test_corpus/reports/ or root) for exact user testing steps on localhost + GitHub Pages, remaining actions (real content, resume files, vault clone, future kobo-forge.html promotion), and per-task status.

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