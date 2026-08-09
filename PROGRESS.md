# Portfolio continuous improvement log

Last updated: 2026-08-10 (Cycle 64 across the projects workspace)

## Current state

- Branch: `main`; working tree was clean and aligned with `origin/main` at cycle start.
- Runtime: zero-build static GitHub Pages portfolio plus conviction, feedback, compatibility redirect, and Biblical Truth viewer pages.
- Deployment version: `2026.08.10.3`.
- Local verification: thirteen mutation/fixture tests, `tools/check_site.py`, Python compilation, and syntax checks for every JavaScript file.
- Automated verification: least-privilege GitHub Actions discovers all Python contract tests and runs the same site/Python/JavaScript checks on Python 3.12 and Node 24.

## Latest cycle: enforce canonical crawler discovery

### Why this was selected

The sitemap listed the original portfolio, conviction, vault, KoboForge, and AlpArcade routes but had drifted behind four shipped sites: AIly, VerseKeep, ChristoDay, and CardFitSG. Neither sitemap contents, robots directives, canonical tags, duplicates, nor target existence had automated coverage.

### Changes

- Defined the exact nine-URL public crawler contract, distinguishing local canonical HTML files from same-origin GitHub Pages project sites.
- Added a reusable XML/robots/canonical validator with an HTML parser that tolerates attribute ordering and normal/self-closing link tags.
- Added four fixture tests covering the valid contract plus missing, duplicate, non-canonical, unexpected, root-blocking, wrong-sitemap, missing-file, and canonical-mismatch failures.
- Integrated crawler validation into `tools/check_site.py` and expanded `sitemap.xml` with AIly, VerseKeep, ChristoDay, and CardFitSG.
- Bumped the deployment version to `2026.08.10.3`.

### Verification and scores

- Test-first evidence: the fixture suite initially failed to import the absent crawler validator.
- Integrated gate evidence: before sitemap repair, the real site checker named exactly the four missing shipped routes.
- `python3 -m unittest discover -s tools -p 'test_*.py'`: all thirteen tests passed.
- `python3 tools/check_site.py`: 27 required files, 15 workflow policies, nine canonical crawler routes, and all existing site/data contracts passed.
- All nine sitemap URLs returned HTTP 200, including the four newly listed project sites.
- Local HTTP smoke: `/sitemap.xml` and `/robots.txt` returned 200, and the served sitemap parsed with exactly nine URLs.
- `python3 -m compileall -q tools`, all JavaScript syntax checks, and `git diff --check`: passed.
- Correctness/reliability: 9/10 (crawler discovery now matches the authoritative shipped-site map).
- Verifiability: 10/10 (XML, robots, canonical HTML, local files, duplicates, and live destinations all have evidence).
- Maintainability: 9/10 (one explicit route map drives sitemap and canonical expectations).
- Performance: 10/10 (thirteen tests and the complete local checker finish in well under a second).
- Security/robustness: 9/10 (root blocking and off-contract crawler URLs fail closed).

### Lessons and process improvements

- A valid XML sitemap can still be product-incomplete; compare it against the authoritative shipped-project inventory.
- Model cross-repository Pages routes explicitly instead of pretending their files exist in the portfolio working tree.
- Test canonical tags through an HTML parser so attribute ordering and self-closing syntax do not create brittle checks.
- Pair structural crawler validation with reachability evidence for every published URL.

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

- Cycle 62 (`e8932bb`): deployed and contract-checked non-blocking vault link diagnostics.
- Cycle 60 (`4587321`): deployed complete metadata-safe vault content to the canonical viewer.
- Cycle 59 (`9ce7ed2`): corrected conviction USD accounting and added complete dataset contracts.

## Prioritized opportunities

| Priority | Opportunity | Category | Impact | Effort / risk | Evidence / dependency |
|---|---|---|---|---|---|
| 1 | Add browser smoke coverage for home navigation/modals | Verification / accessibility | High | Large / medium | Structural checks do not execute mobile menu, modal focus, or anchor behavior in a browser DOM |
| 2 | Add deterministic conviction-generator freshness checks excluding timestamps | Verification / maintainability | Medium | Medium / low | Payload relationships are checked, but source inputs could change without an explicit generated-output freshness gate |
| 3 | Add `<lastmod>` values from deploy inputs | SEO / process | Low-medium | Medium / low | The route inventory is complete, but crawlers receive only coarse change-frequency hints |

## Next cycle

Add a minimal browser-executed smoke suite for the highest-risk home interactions: mobile navigation state, modal opening/closing, and focus restoration.
