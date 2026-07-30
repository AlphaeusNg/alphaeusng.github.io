# Pages

This folder contains secondary deployable pages for the portfolio.

- `conviction.html`: public conviction page.
- `kobo-forge.html`: compatibility redirect to the standalone `/KoboForge/`
  project site; no converter implementation lives in this repository.
- `feedback/`: shared, project-aware feedback form used by all public projects.
- `seeking-biblical-truth/`: public graph viewer generated from the separate `Seeking-Biblical-Truth` vault repository.

This folder is the home for public subpages. Keep the portfolio homepage at the repo root as `index.html`, and keep secondary user-facing HTML here.

Standalone page styles and scripts live in the root `css/` and `js/` groups.
Feature-local assets may stay beneath a feature directory, as the vault
viewer’s `css/` and `js/` folders do.
