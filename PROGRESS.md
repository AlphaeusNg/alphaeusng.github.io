# Portfolio continuous improvement log

Last updated: 2026-08-11 (Cycle 133 across the projects workspace)

## Current state

- Branch: `main`; working tree was clean and aligned with `origin/main` at cycle start.
- Runtime: zero-build static GitHub Pages portfolio plus conviction, feedback, compatibility redirect, and Biblical Truth viewer pages.
- Deployment version: `2026.08.11.4`.
- Local verification: 21 mutation/fixture/freshness tests, non-writing
  conviction and sitemap generator checks, four Chromium interaction tests
  with shared runtime-error and same-origin HTTP-failure monitoring,
  deterministic font delivery, and a local Chart.js test double,
  `tools/check_site.py`, Python
  compilation, and syntax checks for every first-party JavaScript file.
- Automated verification: least-privilege GitHub Actions checks out complete
  route history, runs cheap data/site gates before installing Chromium, then
  runs the browser, Python, and first-party JavaScript gates on Python 3.12 and
  Node 24.

## Latest cycle: fail browser smokes on first-party HTTP errors

### Why this was selected

The shared Chromium harness failed on console errors and uncaught exceptions,
but a same-origin request returning HTTP 4xx/5xx could still be silent in the
page and visible only in the local server log. One shared listener closes that
observability gap for every existing and future browser journey.

### Changes

- Added a per-page response listener that compares each response with the
  configured test origin and records every same-origin status of 400 or higher.
- Included status, request method, and local path/query in the shared failure
  message while intentionally ignoring third-party response status.
- Reused the existing after-test runtime assertion, so every browser journey
  inherits the new contract without duplicated checks.
- Bumped the deployment version to `2026.08.11.4`.

### Verification and scores

- Baseline: the complete existing gate passed with four Chromium journeys and
  no first-party failures, confirming the change targeted an observability gap.
- Mutation evidence: a temporary missing local image made the focused journey
  fail with the exact diagnostic
  `response: 404 GET /response-gate-probe.png`; the probe was then removed.
- All four real journeys passed three consecutive runs (12/12 paths) with no
  runtime, console, or first-party HTTP failures.
- All 21 Python mutation/fixture tests passed; conviction and sitemap
  generators matched their tracked inputs.
- `tools/check_site.py` passed 35 required-file, 21 workflow-policy, nine-route
  crawler, local-link, finance, vault, and asset contracts.
- Python compilation, every first-party JavaScript syntax check,
  `git diff --check`, and `npm audit` (zero vulnerabilities) passed.
- Correctness/reliability: 8/10 → 9/10 (broken local subresources now invalidate browser journeys).
- Observability/verifiability: 8/10 → 10/10 (failures name exact status, method, and route).
- Maintainability: 9/10 → 10/10 (one fixture listener covers every current and future journey).
- Performance: 9/10 → 9/10 (one constant-time origin/status check per response; deployed runtime unchanged).
- Security/robustness: 9/10 → 9/10 (same-origin scoping avoids treating intentionally stubbed third parties as application failures).
- Developer/user experience: 8/10 → 9/10 (local resource defects are actionable from test output alone).

### Lessons and process improvements

- Browser runtime health includes the network graph, not only JavaScript error
  channels. Attach the response gate at the fixture boundary so coverage grows
  automatically with new journeys.
- Scope strict response policy by origin. External services can fail for reasons
  outside the application contract, while every first-party 4xx/5xx is owned by
  this deployment.
- Mutation-test observability with a real missing resource; checking the listener
  implementation alone would not prove that the shared after-test gate reports it.

### Explicit next opportunity

Add a deterministic feedback-page browser journey with local Firebase doubles.
Its query-source sanitization, form validation, successful submission, cooldown,
and private-inbox fallback currently have syntax/static checks but no executed
browser contract.

## Previous portfolio cycle: exercise the conviction page in Chromium

### Why this was selected

The conviction payload had strong accounting and freshness contracts, but its
browser runtime was absent from the interaction suite. Metrics, recent rows,
both Chart.js constructors, and the three benchmark views could all regress
while CI remained green. The first baseline run also exposed a real test-harness
dependency on a transient Google Fonts response.

### Changes

- Added a deterministic conviction journey that uses the real tracked finance
  payload and a small local Chart.js double while stubbing the irrelevant
  Tailwind CDN runtime for that route.
- Verifies six ledger metrics, four benchmark metrics, valuation status, the
  six-row recent table and newest entry, both initial chart dataset groups, and
  Value → Delta → Cash Flows dataset/ARIA transitions.
- Made all browser journeys serve empty Google Fonts CSS locally so behavioral
  results cannot fail on font-CDN availability.
- Added console source URLs to shared runtime-error diagnostics, documented the
  local Chart boundary, and bumped the deployment version to `2026.08.11.3`.

### Verification and scores

- Honest baseline: before any new journey, the existing suite passed 2/3; the
  modal path failed because a Google-hosted Playfair Display WOFF2 returned
  HTTP 404. Trace evidence showed no missing first-party resource.
- After font isolation, the original three journeys passed. The new conviction
  journey then passed 1/1 without an application-code change.
- All four journeys / 52 encoded assertion sites passed three consecutive full
  runs (12/12 paths) with no console errors or uncaught exceptions.
- All 21 unit/mutation tests passed in 0.069s; conviction and sitemap freshness
  checks matched tracked inputs.
- `tools/check_site.py` passed 35 required-file, 21 workflow-policy, nine-route
  crawler, local-link, finance, vault, and asset contracts.
- Python compilation, all first-party JavaScript syntax checks,
  `git diff --check`, and `npm audit` (zero vulnerabilities) passed.
- Correctness/reliability: 8/10 → 9/10 (the complete conviction render and view state are browser-locked).
- Observability/verifiability: 7/10 → 10/10 (real DOM outputs and chart transitions now share the runtime-error gate).
- Maintainability: 8/10 → 9/10 (one minimal chart double models only constructor/update/destroy behavior).
- Performance: 9/10 → 9/10 (deployed runtime is unchanged; the fourth path remains sub-second locally).
- Security/robustness: 8/10 → 9/10 (browser tests no longer inherit an irrelevant font-availability failure mode).
- Developer/user experience: 8/10 → 9/10 (finance UI regressions and error sources are now directly diagnosable).

### Lessons and process improvements

- A shared runtime-error gate should isolate third-party resources irrelevant to
  the behavior under test; a font 404 is not a portfolio interaction failure.
- A useful library double must preserve the mutation surfaces the application
  uses (`data`, `options`, `update`, and `destroy`), then expose those effects
  for assertions.
- The new characterization test passed immediately, so this cycle closes a
  verification gap rather than claiming an application defect was repaired.

### Explicit next opportunity

Record failed first-party HTTP responses in the shared browser harness with
status and local URL. Console failures now include their source, but silent
local 4xx/5xx subresources are still visible only in server output.

## Previous portfolio cycle: measure fixed navigation geometry

### Why this was selected

Desktop anchor clearance depended on a hand-maintained `8.25rem` value that
happened to equal the current primary navigation plus project-tab bar. The
browser gate would detect a future height change only after it obscured section
headings; the runtime could already measure the actual chrome safely.

### Changes

- Added one shared navigation-chrome measurement that excludes the expanded
  mobile drawer and supplies smooth scrolling, active-section calculations,
  and the CSS `scroll-margin-top` variable.
- Synchronizes the measured offset at startup, resize, and fixed-nav resize;
  direct initial hashes are realigned after DOM and page-load geometry settles.
- Replaced selector parsing of URL fragments with safe decoded-ID lookup, so a
  malformed percent-encoded fragment cannot throw during initialization.
- Removed the fixed desktop offset and its now-unused body marker while keeping
  an 80px no-JavaScript fallback.
- Strengthened the hash-navigation browser journey by injecting a 178px test
  header, requiring measured offset equality and visible desktop/mobile targets,
  and loading a malformed fragment under the shared runtime-error gate.
- Bumped deployment version to `2026.08.11.2` and regenerated the home route's
  sitemap date to 2026-08-11.

### Verification and scores

- Test-first evidence: the mutated header measured 178px while the committed
  scroll margin remained 132px, causing the new browser assertion to fail.
- Focused Chromium regression passed after implementation with measured desktop
  geometry, mobile menu close/focus behavior, and malformed-hash safety.
- All 21 unit/mutation tests passed in 0.056s; conviction and sitemap freshness
  checks matched their tracked inputs.
- `tools/check_site.py` passed 35 required-file, 21 workflow-policy, nine-route
  crawler, local-link, finance, vault, and asset contracts.
- All three Chromium journeys passed in 3.2s with no console errors or uncaught
  exceptions; Python compilation, all first-party JavaScript syntax checks,
  `git diff --check`, and `npm audit` (zero vulnerabilities) passed.
- Correctness/reliability: 7/10 → 10/10 (anchor clearance derives from rendered
  chrome at every supported viewport).
- Observability/verifiability: 8/10 → 10/10 (a deliberate 46px geometry mutation
  proves the test detects the former coupling).
- Maintainability: 6/10 → 9/10 (one measurement replaces CSS and JavaScript
  offset assumptions).
- Performance: 9/10 → 9/10 (one resize observer and bounded geometry reads;
  no steady animation or polling).
- Security/robustness: 7/10 → 9/10 (untrusted URL fragments no longer enter a
  CSS selector parser).
- Developer/user experience: 8/10 → 10/10 (section headings remain visible
  after legitimate header changes).

### Lessons and process improvements

- Geometry mutation is stronger than reasserting today's pixel values: make
  the chrome deliberately taller and require the page to adapt.
- Measure only fixed chrome. Including the expanded mobile drawer would turn a
  correct responsive offset into a full-screen scroll gap.
- URL hashes are external input; ID lookup avoids selector syntax failures and
  is the right primitive when fragments identify elements.

### Follow-up

The deterministic conviction-page journey was completed in workspace Cycle
124 with a local Chart.js double and the shared runtime-error gate.

## Previous portfolio cycle: derive sitemap dates from deploy inputs

### Why this was selected

The sitemap enumerated all nine canonical routes but supplied only coarse
change-frequency hints. Adding dates manually would immediately create a new
staleness risk, while applying this repository's deploy date to six sibling
project sites would publish false metadata.

### Changes

- Added one typed manifest for the nine canonical routes, including the three
  local route files, their significant tracked deploy inputs, priorities, and
  frequencies.
- Added a deterministic sitemap generator that takes the newest Git date across
  each local route's inputs, uses today's date for dirty inputs, and exposes a
  non-writing `--check` mode.
- Added `<lastmod>` values of 2026-08-10 for home, 2026-08-09 for conviction,
  and 2026-08-10 for the vault viewer; omitted the field from all six sibling
  deployments.
- Made the crawler checker reject missing, stale, duplicate, or fabricated
  external dates and derive its route inventory from the same manifest.
- Added five focused tests, complete-history checkout, a CI freshness step,
  maintainer documentation, and deployment version `2026.08.11.1`.

### Verification and scores

- Test-first evidence: all five crawler fixtures failed on the absent
  `expected_lastmods` contract before implementation.
- Unit suite: 21 tests passed in 0.057s (up from 16), including newest-commit,
  dirty-input, local-only rendering, and missing/stale/external date cases.
- `python3 tools/generate_sitemap.py --check`: the committed XML matches route
  inputs and Git history byte-for-byte.
- `python3 tools/finance/generate_conviction_history.py --check`: passed.
- `python3 tools/check_site.py`: 35 files, 21 workflow policies, nine crawler
  routes, and all existing site/data contracts passed.
- All three Chromium flows passed in 3.1s with no console errors or uncaught
  exceptions; Python compilation, every JavaScript syntax check, and
  `git diff --check` passed.
- Served XML smoke returned nine URLs and exactly the three expected dated
  local routes; the document parsed successfully through `ElementTree`.
- Correctness/reliability: 6/10 → 10/10 (dates derive from explicit inputs;
  separate deployments are never guessed).
- Observability/verifiability: 7/10 → 10/10 (dirty and committed drift both
  fail locally and in CI).
- Maintainability: 6/10 → 9/10 (one manifest owns routes and sitemap metadata).
- Performance: 9/10 → 9/10 (runtime is unchanged; full Git history is a small
  CI-only cost).
- Security/robustness: 8/10 → 9/10 (argument-vector Git calls and exact route
  ownership fail closed).

### Lessons and process improvements

- Metadata shared with crawlers deserves the same generated-artifact freshness
  contract as application data.
- Cross-repository URLs should remain intentionally undated unless their own
  deployment history is an explicit input; a plausible date is still false.
- A Git-derived pre-commit generator must account for dirty inputs, while CI
  must fetch enough history to reproduce unchanged routes' prior dates.

## Previous portfolio cycle: fail browser smokes on runtime errors

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

## Current cross-repository update: verify vault-data synchronization

Cycle 78 replaces the manual generate-and-copy publication path with a source-side `tools/sync_public_viewer.py` command. It generates one canonical payload, updates both tracked copies without rewriting identical files, validates both source and viewer destinations before either write, and provides a read-only `--check` mode that distinguishes source drift from public-copy drift. Seven isolated sync/CLI contracts cover idempotence, both drift classes, malformed bytes, immutable checking, and missing/empty source or target refusal. The current source and public datasets remain byte-identical; deployment version is `2026.08.10.9` for the updated maintainer workflow.

The implementation, test-first evidence, scores, and remaining non-transactional Git boundary are recorded in `/home/alph/projects/Seeking-Biblical-Truth/PROGRESS.md`.

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

- Cycle 124: browser-verified conviction metrics, recent rows, and all benchmark views with deterministic external resources.
- Cycle 114 (`1223d29`): derived anchor offsets from measured fixed navigation geometry and rejected malformed URL fragments safely.
- Cycle 104: generated accurate local sitemap dates from explicit deploy inputs
  and prohibited fabricated sibling-project dates.
- Cycle 78: replaced manual vault-data copying with one-command synchronization and precise drift checks.
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
| 1 | Add a deterministic feedback-page browser journey | Test / reliability | Medium-high | Medium / low | Feedback query sanitization, validation, submission, cooldown, and fallback are not executed in Chromium |
| — | Add first-party failed-response diagnostics to browser smokes | Observability / reliability | Low-medium | Small / low | A mutation-proven shared listener now reports status, method, and local URL | Completed in Cycle 133 |
| — | Add a deterministic conviction-page browser journey | Test / reliability | Medium-high | Medium / low | Four browser paths now cover exact finance DOM output and all benchmark dataset/ARIA transitions | Completed in Cycle 124 |
| — | Replace the fixed desktop header offset with measured chrome geometry | Robustness / maintainability | Low | Medium / low | A 178px mutation now proves the runtime adapts beyond the former 132px constant | Completed in Cycle 114 |
| — | Add `<lastmod>` values from deploy inputs | SEO / process | Low-medium | Medium / low | Three local routes now derive dates from tracked inputs; six sibling deployments remain intentionally undated | Completed in Cycle 104 |

## Next cycle

Rotate to KoboForge, the next least-recently improved repository. When returning
here, add a deterministic feedback-page browser journey with local Firebase
doubles.
