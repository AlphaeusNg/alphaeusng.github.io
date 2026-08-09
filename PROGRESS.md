# Portfolio continuous improvement log

Last updated: 2026-08-09 (Cycle 57 across the projects workspace)

## Current state

- Branch: `main`; working tree was clean and aligned with `origin/main` at cycle start.
- Runtime: zero-build static GitHub Pages portfolio plus conviction, feedback, compatibility redirect, and Biblical Truth viewer pages.
- Deployment version: `2026.08.09.3`.
- Local verification: `tools/check_site.py`, Python compilation, and syntax checks for every JavaScript file.
- Automated verification: least-privilege GitHub Actions runs checker fixtures plus the same site/Python/JavaScript checks on Python 3.12 and Node 24.

## Latest cycle: validate the complete local HTML reference graph

### Why this was selected

The site checker validated a required subset of assets but not every local `href` and `src` across six served HTML entry points. A missing file, case mismatch, broken directory index, encoded query/fragment path, or root escape could deploy despite a green check.

### Changes

- Added a reusable HTML parser and traversal-safe local reference resolver to `tools/check_site.py`.
- Resolved relative and root-relative targets, URL-decoded paths, stripped query/fragment components, accepted directory `index.html` targets, skipped external/non-HTTP schemes, and checked exact filesystem case.
- Added three temporary-filesystem unit fixtures for valid root/relative/directory/query/fragment/non-HTTP forms, missing and case-mismatched targets, empty directories, and root traversal.
- Enabled the resolver across every repository HTML entry; the production audit found no broken local references, so no content repair was fabricated.
- Added checker fixtures as a required CI step and increased workflow policy coverage from 14 to 15 contracts.
- Documented the expanded validation and bumped the deployment version to `2026.08.09.3`.

### Verification and scores

- Test-first checker fixture: failed to import missing `find_local_reference_issues` before implementation.
- `python3 -m unittest tools/test_check_site.py`: three focused resolver tests passed.
- CI-policy test-first step: `tools/check_site.py` failed `checker unit tests` before the workflow gained the fixture step.
- `python3 tools/check_site.py`: all 25 required-file, 15 workflow-policy, complete local-reference, and existing site contracts passed.
- `python3 -m compileall -q tools`: passed.
- `find . -type f -name '*.js' ... node --check`: passed for every JavaScript file.
- `git diff --check`: passed.
- Correctness/reliability: 9/10 (every local HTML asset/page target is now deployment-gated).
- Verifiability: 9/10 (resolver edge cases and the real production graph both execute locally and in CI).
- Maintainability: 9/10 (one reusable parser replaces future ad-hoc required-link additions).
- Performance: 9/10 (the full resolver fixture and production audit complete in milliseconds).
- Security/robustness: 9/10 (decoded traversal outside the served root is rejected explicitly).

### Lessons and process improvements

- Validate the resolver independently before enabling it on production content; this distinguishes checker bugs from real broken links.
- A clean exhaustive audit is still measured improvement: future case/path regressions now fail even though no current content repair was needed.
- Project memory claims `/seeking-biblical-truth/` is a compatibility redirect, but Git history shows its entry point was deleted during the pages move; restore and enforce that documented old-bookmark route next.

## Recent project evolution

- Cycle 56 (`ce57e80`): upgraded setup-python to v6 and removed the hosted Node-20 annotation.
- Cycle 55 (`69a9cab`): added least-privilege Python/Node CI with fourteen locally enforced policies.
- `ce14e5e`: separated support/feedback actions and simplified the Arcade link treatment.

## Prioritized opportunities

| Priority | Opportunity | Category | Impact | Effort / risk | Evidence / dependency |
|---|---|---|---|---|---|
| 1 | Restore the documented Biblical Truth compatibility redirect | Correctness / routing | Medium-high | Small / low | Memory and validation docs promise `/seeking-biblical-truth/`, but `d68898e` deleted its `index.html` during the pages move |
| 2 | Validate conviction JSON schema and referenced series | Correctness / verification | Medium-high | Small-medium / low | `js/conviction.js` fetches committed finance JSON whose shape is not checked by the site validator |
| 3 | Add browser smoke coverage for home navigation/modals | Verification / accessibility | High | Large / medium | Structural checks do not execute mobile menu, modal focus, or anchor behavior in a browser DOM |

## Next cycle

Restore `/seeking-biblical-truth/` as a minimal canonical/meta-refresh compatibility redirect to `/pages/seeking-biblical-truth/`. Require both the legacy entry point and exact redirect/canonical semantics in the site checker, then verify both routes locally.
