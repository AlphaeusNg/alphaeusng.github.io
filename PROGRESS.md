# Portfolio continuous improvement log

Last updated: 2026-08-09 (Cycle 58 across the projects workspace)

## Current state

- Branch: `main`; working tree was clean and aligned with `origin/main` at cycle start.
- Runtime: zero-build static GitHub Pages portfolio plus conviction, feedback, compatibility redirect, and Biblical Truth viewer pages.
- Deployment version: `2026.08.09.4`.
- Local verification: `tools/check_site.py`, Python compilation, and syntax checks for every JavaScript file.
- Automated verification: least-privilege GitHub Actions runs checker fixtures plus the same site/Python/JavaScript checks on Python 3.12 and Node 24.

## Latest cycle: restore the Biblical Truth compatibility route

### Why this was selected

Project memory and validation instructions promised `/seeking-biblical-truth/` as an old-bookmark redirect to the canonical viewer. Git history showed `d68898e` deleted its `index.html` during the move under `pages/`, leaving the documented compatibility URL to fall through to the 404 page.

### Changes

- Restored `seeking-biblical-truth/index.html` from its final historical redirect form.
- Redirected immediately to `../pages/seeking-biblical-truth/`, declared the absolute canonical viewer URL, and retained a normal anchor fallback.
- Added the legacy entry point to required deployment structure and enforced exact refresh/canonical/fallback semantics in `tools/check_site.py`.
- Documented the compatibility route and bumped the deployment version to `2026.08.09.4`.

### Verification and scores

- Test-first route requirement: `tools/check_site.py` failed on missing `seeking-biblical-truth/index.html` before restoration.
- `python3 tools/check_site.py`: 26 required files plus exact legacy redirect, 15 workflow-policy, full local-reference, and existing site contracts passed.
- Local HTTP verification: `/seeking-biblical-truth/` returned the required refresh/canonical/fallback markup and `/pages/seeking-biblical-truth/` returned HTTP 200.
- `python3 -m unittest tools/test_check_site.py`: all three resolver fixtures passed.
- `python3 -m compileall -q tools`: passed.
- `find . -type f -name '*.js' ... node --check`: passed for every JavaScript file.
- `git diff --check`: passed.
- Correctness/reliability: 9/10 (the promised old-bookmark URL resolves to the live canonical viewer again).
- Verifiability: 9/10 (both file semantics and served route behavior are checked).
- Maintainability: 9/10 (the compatibility contract is explicit and cannot disappear silently).
- Performance: 9/10 (one 13-line static redirect adds negligible serving cost).
- Security/robustness: 9/10 (canonical destination and local fallback target are fixed and reference-validated).

### Lessons and process improvements

- Treat project memory/validation URLs as product contracts and compare them against the actual served filesystem, not just current navigation links.
- Recover minimal compatibility behavior from the last known historical file rather than recreating a new redirect style.
- Validate the browser fallback anchor alongside meta refresh so the route remains usable when automatic refresh is disabled.

## Recent project evolution

- Cycle 57 (`f8df394`): added fixture-backed exhaustive case-sensitive local reference validation.
- Cycle 56 (`ce57e80`): upgraded setup-python to v6 and removed the hosted Node-20 annotation.
- Cycle 55 (`69a9cab`): added least-privilege Python/Node CI with fourteen locally enforced policies.

## Prioritized opportunities

| Priority | Opportunity | Category | Impact | Effort / risk | Evidence / dependency |
|---|---|---|---|---|---|
| 1 | Validate conviction JSON schema and referenced series | Correctness / verification | Medium-high | Small-medium / low | `js/conviction.js` fetches committed finance JSON whose shape is not checked by the site validator |
| 2 | Add browser smoke coverage for home navigation/modals | Verification / accessibility | High | Large / medium | Structural checks do not execute mobile menu, modal focus, or anchor behavior in a browser DOM |
| 3 | Validate sitemap/robots canonical routes | Reliability / SEO | Medium | Small / low | Local links are checked, but crawler files are not cross-checked against existing canonical entry points |

## Next cycle

Define and test the committed conviction dataset contract used by `js/conviction.js`: metadata, aligned monthly series, finite values, monotonic dates, benchmark coverage, and summary consistency. Integrate it into `tools/check_site.py` before changing any discovered invalid data.
