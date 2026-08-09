# Portfolio continuous improvement log

Last updated: 2026-08-09 (Cycle 56 across the projects workspace)

## Current state

- Branch: `main`; working tree was clean and aligned with `origin/main` at cycle start.
- Runtime: zero-build static GitHub Pages portfolio plus conviction, feedback, compatibility redirect, and Biblical Truth viewer pages.
- Deployment version: `2026.08.09.2`.
- Local verification: `tools/check_site.py`, Python compilation, and syntax checks for every JavaScript file.
- Automated verification: least-privilege GitHub Actions runs the same site/Python/JavaScript checks on Python 3.12 and Node 24.

## Latest cycle: remove the hosted action-runtime warning

### Why this was selected

The first hosted portfolio run passed every check but warned that `actions/setup-python@v5` still targeted deprecated Node 20 internally and was only being forced onto Node 24. This new hosted evidence outranked the planned link-check expansion because the warning obscured future signal and had a tiny, reversible fix.

### Changes

- Upgraded `actions/setup-python` from v5 to v6 while preserving the Python 3.12 runtime and every workflow behavior.
- Updated the self-enforced site-check policy so v5 now fails locally and v6 is required.
- Bumped the deployment version to `2026.08.09.2`.

### Verification and scores

- Hosted baseline run `31296409204`: passed all jobs but emitted the setup-python v5/Node-20 deprecation annotation.
- Test-first policy: `tools/check_site.py` failed `supported Python action` after the required version moved to v6, then passed after the workflow upgrade.
- `python3 tools/check_site.py`: all 25 required-file, 14 workflow-policy, and existing site contracts passed.
- `python3 -m compileall -q tools`: passed.
- `find . -type f -name '*.js' ... node --check`: passed for every JavaScript file.
- `git diff --check`: passed.
- Correctness/reliability: 8/10 (site behavior is unchanged and the hosted matrix remains intact).
- Verifiability: 9/10 (the precise warning source is now an executable local policy).
- Maintainability: 9/10 (the action runtime is current and hosted output is reserved for actionable findings).
- Performance: 9/10 (no step or dependency was added).
- Security/robustness: 9/10 (the action no longer relies on the deprecated Node 20 action runtime).

### Lessons and process improvements

- Hosted annotations are verification evidence even when the job is green; address actionable platform warnings before they become failures.
- Encode the upgraded action version locally first so the workflow change proves the policy catches the old state.
- Resume exhaustive local-reference validation next; its impact/effort ranking is unchanged.

## Recent project evolution

- Cycle 55 (`69a9cab`): added least-privilege Python/Node CI with fourteen locally enforced policies.
- `ce14e5e`: separated support/feedback actions and simplified the Arcade link treatment.
- `4dd03b7`: auto-hid project headers on scroll.

## Prioritized opportunities

| Priority | Opportunity | Category | Impact | Effort / risk | Evidence / dependency |
|---|---|---|---|---|---|
| 1 | Validate every local HTML `href`/`src` case-sensitively | Reliability / verification | High | Small-medium / low | `check_site.py` validates a required subset, not the complete reference graph across six entry points |
| 2 | Validate conviction JSON schema and referenced series | Correctness / verification | Medium-high | Small-medium / low | `js/conviction.js` fetches committed finance JSON whose shape is not checked by the site validator |
| 3 | Add browser smoke coverage for home navigation/modals | Verification / accessibility | High | Large / medium | Structural checks do not execute mobile menu, modal focus, or anchor behavior in a browser DOM |

## Next cycle

Extend `tools/check_site.py` with complete local `href`/`src` resolution for served HTML entries. Normalize query/hash fragments, respect directory indexes and root-relative GitHub Pages paths, reject case mismatches/traversal, and add focused checker fixtures before applying any discovered link repairs.
