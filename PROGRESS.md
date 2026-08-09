# Portfolio continuous improvement log

Last updated: 2026-08-10 (Cycle 65 across the projects workspace)

## Current state

- Branch: `main`; working tree was clean and aligned with `origin/main` at cycle start.
- Runtime: zero-build static GitHub Pages portfolio plus conviction, feedback, compatibility redirect, and Biblical Truth viewer pages.
- Deployment version: `2026.08.10.5`.
- Local verification: fourteen mutation/fixture tests, two Chromium interaction tests, `tools/check_site.py`, Python compilation, and syntax checks for every first-party JavaScript file.
- Automated verification: least-privilege GitHub Actions installs locked test dependencies and Chromium, then runs the browser, site, Python, and first-party JavaScript gates on Python 3.12 and Node 24.

## Latest cycle: execute high-risk home interactions in Chromium

### Why this was selected

Structural source checks could prove that mobile-menu and project-modal hooks existed, but could not prove that state, keyboard control, and focus behaved correctly in a browser. The first modal test exposed a real accessibility defect: the dialog opened without updating `aria-hidden`, did not move or trap focus, and did not restore focus to its trigger.

### Changes

- Added a pinned, test-only Playwright harness with a locally managed static server and no deployed runtime dependencies.
- Added phone-width mobile-menu coverage for expanded state, scrim/body isolation, Escape closure, and trigger-focus restoration.
- Added desktop project-modal coverage for ARIA visibility, initial focus, forward/reverse Tab containment, Escape closure, and trigger-focus restoration.
- Made the modal own keyboard handling, expose accurate `aria-hidden` state, move focus on open, trap focus while open, and restore its opening control on close.
- Integrated locked dependency and Chromium installation plus browser tests into CI, with npm caching and first-party-only JavaScript syntax scanning.
- Taught the local HTML reference graph to exclude non-deployed dependency and browser-artifact directories, protected by a fixture test.
- Documented local browser validation and bumped the deployment version to `2026.08.10.5`.

### Verification and scores

- Test-first evidence: after correcting an overly broad test regex that matched Tailwind's `md:hidden` token, the mobile interaction passed while the modal test failed at its absent `aria-hidden` transition; both passed after the modal repair.
- Integration evidence: installing test dependencies made the complete site checker fail on Playwright's internal HTML. Explicit deploy-boundary exclusions repaired the gate, and the new fixture prevents recurrence.
- `npm run test:browser`: both Chromium interactions passed in 2.1–2.5 seconds.
- `python3 -m unittest discover -s tools -p 'test_*.py'`: all fourteen tests passed.
- `python3 tools/check_site.py`: 31 required files, 18 workflow policies, nine canonical crawler routes, and all existing site/data contracts passed.
- `npm audit`: zero known vulnerabilities.
- `python3 -m compileall -q tools`, every first-party JavaScript syntax check, and `git diff --check`: passed.
- Correctness/reliability: 9/10 (modal state and focus now follow the behavior exposed to assistive technology and keyboard users).
- Verifiability: 10/10 (the riskiest home interactions now execute in a real browser locally and on every push/PR).
- Accessibility: 10/10 (initial focus, containment, Escape, ARIA state, and restoration are asserted end to end).
- Maintainability: 9/10 (a small shared focus helper and one serial browser suite define the interaction contract).
- Performance: 9/10 (deployed runtime is unchanged; the complete browser suite adds roughly 2.5 seconds after browser installation).
- Security/robustness: 9/10 (dependencies are exact-locked, audited, test-only, and CI remains read-only).

### Lessons and process improvements

- Match utility classes as whitespace-delimited tokens; a word-boundary regex incorrectly treats `md:hidden` as the standalone `hidden` class.
- Add browser tooling through an explicit deployed/non-deployed boundary. Repository scanners and syntax checks must not silently ingest dependency internals.
- A real-browser assertion should first demonstrate a meaningful failure; the modal test did, while the menu test preserved known-good behavior.
- Local `playwright install --with-deps` requires privileged package installation; install the browser alone on this machine and reserve dependency installation for the prepared CI runner.
- Keep the suite narrow and serial until a new interaction has evidence of risk, preserving cheap feedback and avoiding a brittle end-to-end test pyramid.

## Previous cross-repository update: deploy vault link diagnostics

Cycle 62 adds non-blocking link observability to the source exporter and synced public payload. The canonical viewer data now records 26 unique unresolved wiki-links and zero ambiguous links, deduplicated from 27 occurrences, while preserving the existing 55-note/1-canvas/62-node/99-link graph. Source/copy equality, portfolio contracts, syntax checks, and served-route diagnostics passed before commit; deployment version is `2026.08.10.2`.

The source-side schema, test-first evidence, scores, and remediation backlog are recorded in `/home/alph/projects/Seeking-Biblical-Truth/PROGRESS.md`.

## Previous cross-repository update: deploy the lossless vault export

The Cycle 60 source-vault exporter now preserves complete note bodies, fails on malformed canvases, excludes repository metadata, and is protected by five tests plus CI. Its regenerated dataset was copied byte-for-byte into the canonical public viewer: 55 notes, one canvas, 62 nodes, and 99 links. The deployment version was bumped to `2026.08.10.1`; full portfolio contracts, syntax checks, served-route checks, and source/copy equality passed before commit.

The source-side rationale, test-first failures, restored-content measurements, scores, lessons, and next exporter opportunity are recorded in `/home/alph/projects/Seeking-Biblical-Truth/PROGRESS.md`.

## Previous portfolio cycle: validate and repair the conviction finance dataset

### Why this was selected

`js/conviction.js` directly consumes a large committed JSON file whose metadata, transaction ledger, monthly aggregates, and benchmark series were not validated. Independent recomputation then exposed a unit error: the IBKR statement is based in SGD, but its net amounts were labeled and processed as USD, materially overstating deployed capital and the hypothetical SPY position.

### Changes

- Added a complete conviction payload validator covering provenance, finite/sign-correct transactions, USD trade notionals, ordered dates, summary accounting, active-month aggregation, continuous benchmark coverage, unrounded benchmark recomputation, and final-summary consistency.
- Added nine total unit tests, including conviction mutation cases for transaction, currency, summary, monthly-series, benchmark, and provenance corruption.
- Corrected imported `cashFlowUsd` generation by converting the statement's base-currency net amount through each trade's exchange rate; USD-priced trades in a USD statement remain unchanged.
- Regenerated the 64-transaction dataset and all 43 monthly aggregates plus 67 benchmark months from the corrected USD ledger.
- Made the site checker require and validate the dataset, changed CI to discover every `test_*.py` contract, documented the unified test command, and bumped the deployment version to `2026.08.09.5`.

### Verification and scores

- Test-first contract: the new tests initially failed to import the absent validator; after adding the validator, the committed payload failed with 61 USD-notional mismatches.
- Source reconciliation: the newest raw trade's SGD `-1777.082616` net amount at `1.269` now becomes USD `-1400.380312`, consistent with 3.4193 shares at USD 409.439878 plus fees.
- Corrected metrics: deployed capital fell from USD 77,255.22 to 60,958.51; sale proceeds from USD 22,690.48 to 16,570.11; net invested capital from USD 54,564.73 to 44,388.40.
- Corrected benchmark: final TSLA value remains USD 70,136.48, while the like-for-like SPY value changes from USD 85,553.54 to 70,954.86 and the differential from USD -15,417.06 to -818.38.
- `python3 -m unittest discover -s tools -p 'test_*.py'`: all nine fixtures and mutation tests passed.
- `python3 tools/check_site.py`: 27 required files, 15 workflow policies, the 64-transaction/43-active-month/67-benchmark-month finance contract, and all existing site contracts passed.
- Local HTTP smoke: `/`, `/pages/conviction.html`, and `/data/conviction_tsla_history.json` each returned HTTP 200.
- `python3 -m compileall -q tools`: passed.
- `find . -type f -name '*.js' ... node --check`: passed for every JavaScript file.
- `git diff --check`: passed.
- Correctness/reliability: 10/10 (a material cross-currency calculation error was fixed at its source and all derived values regenerated).
- Verifiability: 10/10 (independent relationships and targeted corruption cases now gate every push).
- Maintainability: 9/10 (one reusable validator defines the browser-facing data contract; CI automatically discovers future tests).
- Performance: 9/10 (validation completes with nine tests and the full site check in under a quarter second locally).
- Security/robustness: 9/10 (non-finite values, wrong signs, bad ordering, missing coverage, and inconsistent derived values fail closed).

### Lessons and process improvements

- Internal consistency is insufficient when every derived figure shares the same wrong unit; reconcile one independent physical invariant such as shares × USD price before trusting aggregates.
- Preserve unrounded cumulative state while validating rounded time-series outputs, matching the generator's accounting rather than accumulating display-rounding drift.
- Mutation tests make data contracts credible: each major corruption class must demonstrably trip the deployment gate.
- CI test discovery compounds better than naming individual files because new contract suites become mandatory without another workflow edit.
- Start local HTTP smoke tests with a bounded readiness probe; the first immediate request raced server startup, while the readiness-gated rerun passed all three routes.

## Recent project evolution

- Cycle 65: added CI-gated Chromium interaction coverage and repaired project-modal focus/ARIA behavior.
- Cycle 64 (`03f0c27`, state follow-up `e46cf7c`): enforced the complete nine-route crawler discovery contract.
- Cycle 62 (`e8932bb`): deployed and contract-checked non-blocking vault link diagnostics.
- Cycle 60 (`4587321`): deployed complete metadata-safe vault content to the canonical viewer.
- Cycle 59 (`9ce7ed2`): corrected conviction USD accounting and added complete dataset contracts.

## Prioritized opportunities

| Priority | Opportunity | Category | Impact | Effort / risk | Evidence / dependency |
|---|---|---|---|---|---|
| 1 | Add deterministic conviction-generator freshness checks excluding timestamps | Verification / maintainability | Medium-high | Medium / low | Payload relationships are checked, but source inputs could change without an explicit generated-output freshness gate |
| 2 | Add one direct-link/anchor browser smoke | Verification / UX | Medium | Small / low | Menu and modal flows execute in Chromium; section navigation and sticky-header landing position remain structural only |
| 3 | Add `<lastmod>` values from deploy inputs | SEO / process | Low-medium | Medium / low | The route inventory is complete, but crawlers receive only coarse change-frequency hints |

## Next cycle

Make conviction data generation reproducible and add a freshness check that fails when deterministic source inputs and the committed browser payload diverge.
