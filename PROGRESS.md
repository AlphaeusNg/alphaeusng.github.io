# Portfolio continuous improvement log

Last updated: 2026-08-09 (Cycle 55 across the projects workspace)

## Current state

- Branch: `main`; working tree was clean and aligned with `origin/main` at cycle start.
- Runtime: zero-build static GitHub Pages portfolio plus conviction, feedback, compatibility redirect, and Biblical Truth viewer pages.
- Deployment version: `2026.08.09.1`.
- Local verification: `tools/check_site.py`, Python compilation, and syntax checks for every JavaScript file.
- Automated verification: least-privilege GitHub Actions runs the same site/Python/JavaScript checks on Python 3.12 and Node 24.

## Latest cycle: protect portfolio validation with hosted CI

### Why this was selected

The repository already had a fast validator covering 24 required assets, heavy-library isolation, deferred scripts, mobile navigation, KoboForge routing, external-asset structure, vault graph shape, and portrait integrity. No hosted workflow ran those checks, Python compilation, or JavaScript parsing before changes reached `main`.

### Changes

- Added CI for `main` pushes and pull requests using Python 3.12 and Node 24.
- Restricted token permissions to read-only contents, bounded the job to ten minutes, and canceled stale same-branch runs.
- Ran the exact local site checker, compiled every Python tool, and syntax-checked every JavaScript file.
- Added the workflow to required deployment structure and enforced fourteen trigger/permission/runtime/action/command policies inside `tools/check_site.py`.
- Documented hosted validation and bumped the deployment version to `2026.08.09.1`.

### Verification and scores

- Test-first workflow requirement: `tools/check_site.py` failed on missing `.github/workflows/ci.yml` before implementation.
- `python3 tools/check_site.py`: 25 required files plus all 14 workflow and existing site contracts passed; vault data reported 64 nodes/101 links and the portrait remained a valid 60 KB JPEG.
- `python3 -m compileall -q tools`: passed.
- `find . -type f -name '*.js' ... node --check`: passed for every JavaScript file.
- `git diff --check`: passed.
- Correctness/reliability: 8/10 (all existing deployment/site contracts now gate hosted changes).
- Verifiability: 9/10 (the workflow runs the same dependency-free commands used locally and self-validates its policy).
- Maintainability: 8/10 (one existing checker remains the central policy surface).
- Performance: 9/10 (the entire matrix completes locally in under one second without a package install).
- Security/robustness: 9/10 (read-only permissions, bounded execution, and supported runtimes/actions are enforced).

### Lessons and process improvements

- Reuse the project's existing checker as the workflow-policy home; this avoids a second test harness and keeps local/hosted evidence identical.
- Structural validation compounds when it gates both static content and the CI definition that runs it.
- The next smallest high-impact gap is exhaustive case-sensitive local-reference validation; the current required-file list cannot detect every broken `href`/`src` introduced on secondary pages.

## Recent project evolution

- `ce14e5e`: separated support/feedback actions and simplified the Arcade link treatment.
- `4dd03b7`: auto-hid project headers on scroll.
- `cdfb6fa`: streamlined faith-project links.

## Prioritized opportunities

| Priority | Opportunity | Category | Impact | Effort / risk | Evidence / dependency |
|---|---|---|---|---|---|
| 1 | Validate every local HTML `href`/`src` case-sensitively | Reliability / verification | High | Small-medium / low | `check_site.py` validates a required subset, not the complete reference graph across six entry points |
| 2 | Validate conviction JSON schema and referenced series | Correctness / verification | Medium-high | Small-medium / low | `js/conviction.js` fetches committed finance JSON whose shape is not checked by the site validator |
| 3 | Add browser smoke coverage for home navigation/modals | Verification / accessibility | High | Large / medium | Structural checks do not execute mobile menu, modal focus, or anchor behavior in a browser DOM |

## Next cycle

Extend `tools/check_site.py` with complete local `href`/`src` resolution for served HTML entries. Normalize query/hash fragments, respect directory indexes and root-relative GitHub Pages paths, reject case mismatches/traversal, and add focused checker fixtures before applying any discovered link repairs.
