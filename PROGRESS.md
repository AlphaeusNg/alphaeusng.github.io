# Portfolio continuous improvement log

Last updated: 2026-08-10 (Cycle 68 across the projects workspace)

## Current state

- Branch: `main`; working tree was clean and aligned with `origin/main` at cycle start.
- Runtime: zero-build static GitHub Pages portfolio plus conviction, feedback, compatibility redirect, and Biblical Truth viewer pages.
- Deployment version: `2026.08.10.8`.
- Local verification: sixteen mutation/fixture/freshness tests, a non-writing conviction generator check, three Chromium interaction tests with shared runtime-error monitoring, `tools/check_site.py`, Python compilation, and syntax checks for every first-party JavaScript file.
- Automated verification: least-privilege GitHub Actions runs cheap data/site gates before installing Chromium, then runs the browser, Python, and first-party JavaScript gates on Python 3.12 and Node 24.

## Latest cycle: fail browser smokes on runtime errors

### Why this was selected

The three browser flows asserted their intended outputs but could still pass while unrelated JavaScript threw an uncaught exception or emitted a console error. That left a gap between known interaction contracts and broad runtime health.

### Changes

- Added per-page Playwright monitoring for uncaught `pageerror` events and console messages at error severity.
- Added a shared post-test assertion so every current and future browser flow inherits the runtime gate automatically.
- Allowed a short post-interaction drain window for asynchronous errors without slowing the suite materially.
- Kept the gate fail-closed with no third-party suppression because all current flows have a clean error stream.
- Bumped the deployment version to `2026.08.10.8`.

### Verification and scores

- Baseline evidence: all three real interaction flows completed with zero console errors and zero uncaught page exceptions, so no noise filter was introduced.
- Mutation evidence: a temporary asynchronous `throw new Error('runtime gate probe')` failed the shared assertion with `pageerror: runtime gate probe`.
- Mutation evidence: a temporary `console.error('console gate probe')` independently failed it with `console: console gate probe`; both probes were removed after verification.
- `python3 -m unittest discover -s tools -p 'test_*.py'`: all sixteen tests passed.
- `python3 tools/finance/generate_conviction_history.py --check`: passed.
- `python3 tools/check_site.py`: 35 required files, 19 workflow policies, nine canonical crawler routes, and all existing site/data contracts passed.
- All three Chromium interactions passed in about three seconds; Python compilation, every first-party JavaScript syntax check, and `git diff --check` passed.
- Correctness/reliability: 9/10 (silent runtime failures now invalidate the same deployment gate as behavioral failures).
- Observability/verifiability: 10/10 (both browser error channels are captured, mutation-proven, and reported with their messages).
- Maintainability: 10/10 (two shared hooks cover every test without duplicated listeners/assertions).
- Performance: 9/10 (deployed runtime is unchanged; the error drain adds 50ms per browser flow).
- Security/robustness: 9/10 (the gate fails closed and currently contains no broad exception patterns).

### Lessons and process improvements

- Attach broad runtime health checks at the test-fixture boundary so adding a new interaction automatically adds observability.
- Do not preemptively suppress third-party messages; observe the real baseline first and add only exact, evidenced exceptions.
- Mutation-test observability itself. A green baseline proves current health, while deliberate page and console failures prove the detector.

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

- Cycle 68: promoted console errors and uncaught browser exceptions to shared interaction-test failures.
- Cycle 67 (`1cc038e`): repaired and browser-verified sticky-header hash geometry, URL history, and mobile destination focus.
- Cycle 66 (`beeb86d`): added deterministic conviction payload freshness checks and CI fail-fast ordering.
- Cycle 65 (`8046cdf`): added CI-gated Chromium interaction coverage and repaired project-modal focus/ARIA behavior.
- Cycle 64 (`03f0c27`, state follow-up `e46cf7c`): enforced the complete nine-route crawler discovery contract.
- Cycle 62 (`e8932bb`): deployed and contract-checked non-blocking vault link diagnostics.
- Cycle 60 (`4587321`): deployed complete metadata-safe vault content to the canonical viewer.
- Cycle 59 (`9ce7ed2`): corrected conviction USD accounting and added complete dataset contracts.

## Prioritized opportunities

| Priority | Opportunity | Category | Impact | Effort / risk | Evidence / dependency |
|---|---|---|---|---|---|
| 1 | Add `<lastmod>` values from deploy inputs | SEO / process | Low-medium | Medium / low | The route inventory is complete, but crawlers receive only coarse change-frequency hints |
| 2 | Replace the fixed desktop header offset with measured chrome geometry | Robustness / maintainability | Low | Medium / low | The browser gate proves the current 132px design; future header-height changes would fail before deployment but still need a CSS edit |
| 3 | Add request-failure diagnostics to browser smokes | Observability / reliability | Low | Small / medium | Runtime errors fail closed, while failed local subresource requests are visible only in server output; third-party blocking needs careful filtering |

## Next cycle

Add accurate sitemap `<lastmod>` metadata from tracked deploy inputs without inventing dates for cross-repository project routes.
