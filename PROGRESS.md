# Portfolio continuous improvement log

Last updated: 2026-08-28

## Current state

- Branch: `main` matches `origin/main` at cycle start aside from this cycle.
- Runtime: zero-build static GitHub Pages portfolio plus conviction, feedback,
  compatibility redirect, and Biblical Truth viewer pages.
- Deployment stamp: `2026.08.28.1`. DCA snapshot latest close is 2026-08-26
  (288 TSLA / 52 SPCX sessions).
- Local verification: 33 Python tests, 19 DCA engine/quote/journal tests,
  `tools/check_site.py`, 21 Chromium journeys, Python compilation, and syntax
  checks for first-party JavaScript. Firestore rules for `dcaJournals` are
  published on `alparcade-cb87c`.
- Automated verification: least-privilege GitHub Actions checks out complete
  route history, runs cheap data/site gates before installing Chromium, then
  runs the browser, Python, and first-party JavaScript gates on Python 3.12 and
  Node 24.

## Latest cycle: recover delayed DCA history from valid close timestamps

### Why this was selected

Scheduled run `33036308146` failed before publishing August 26 history because
Nasdaq returned the valid close timestamp `Aug 26, 2026` without a time. The
parser required minute precision, and optional quote enrichment blocked the
otherwise-valid daily history update.

### Changes

- Quote parsing now records either `minute` or `date` precision. Date-only
  closes remain dates throughout the data contract and render as
  `Aug 26 (date only)` instead of receiving an invented time or offset.
- History fetches remain strict, while each optional quote enrichment can fail
  independently and fall back to that symbol's validated latest daily close.
  The fallback is also date-only, removing the prior fixed `-04:00` offset.
- Centralized quote timestamp formatting and quote-value validation instead of
  maintaining duplicate implementations.
- Published the missed August 26 bars: TSLA $345.82 and SPCX $139.63.
- Version `2026.08.28.1` and regenerated sitemap dates.

### Verification and scores

- Test-first evidence: the date-only parser regression failed with
  `invalid quote timestamp 'Aug 26, 2026'` before the implementation.
- 33/33 Python tests, 19/19 DCA tests, site/sitemap/data checks, Python
  compilation, first-party JavaScript syntax, dependency audit, and 21/21
  Chromium journeys pass. The browser regression proves the exact date-only
  label on both symbols.
- Implementation commit `03734cf`: hosted CI run `33096567069` and Pages run
  `33096565024` passed; the live site serves `2026.08.28.1` and both August 26
  closes with the new timestamp-precision field.
- Reliability: 6/10 → 9/10 (one malformed or unavailable optional quote no
  longer starves valid end-of-day history).
- Data honesty: 7/10 → 10/10 (source precision is retained; no time is made up).
- Maintainability: 7/10 → 8/10 (shared formatter and validator).

### Lessons / process improvement

Treat enrichment as optional at the orchestration boundary, and model source
precision explicitly before formatting. The full browser suite then protects
the user-visible wording while unit tests cover upstream failure shapes.

### Next opportunity

Rotate across repository automation health, then prioritize any current failed
gate; otherwise begin the CardFitSG official catalog audit due 2026-08-30.

## Previous cycle: publish Tuesday’s TSLA/SPCX close

### Why this was selected

The committed Nasdaq snapshot still ended Monday 2026-08-24. Tuesday’s session
existed, and the weekday post-close workflow had not landed that bar.

### Changes

- Regenerated `data/dca_market_history.json` from Nasdaq.
- TSLA latest close 2026-08-25 $350.25 (was $348.95). SPCX $137.95 (was $135.00).
- Quote asOf 2026-08-26T13:07:00-04:00 while that U.S. session is still open.
- Version `2026.08.27.1`.

## Previous cycle: edit today’s fill and tighten catch-up

### Why this was selected

Copy/share crowded the record action, the $20/$30 chips lived far from the
suggested dollars, and the 70/30 presets sat flush against month-to-date.

### Changes

- TSLA/SPCX suggestion amounts are editable; chips set the field; Record logs
  the typed dollars. Copy plan / copy link / share are gone.
- Section 02 is a compact missed-session bar plus catch-up list.
- Allocation presets now have space above “TSLA invested this month”.
- Version `2026.08.25.9`.

## Previous cycle: log actual DCA fills from a phone

### Why this was selected

The planner could only record the suggested amount, so missed eToro minimums
($20 / $30) had to be typed by hand with no cross-device journal.

### Changes

- Phone-first **Log what you bought** section: date, ticker, custom dollars,
  one-tap chips that submit immediately, and a missed-session catch-up list.
- Chips default to $20 and $30 and can be customized (up to six amounts).
- Optional Google sign-in syncs a private `dcaJournals/{uid}` document.
  Combined Firestore rules were published to `alparcade-cb87c`.
- Version `2026.08.25.8`.

### Verification

- 31 Python tests, 18 DCA tests, `check_site`, sitemap regeneration,
  `compileall`, JS syntax, and 20/20 Chromium journeys passed.
- One new phone-layout journey covers $20 tap, $30 catch-up on a missed day,
  custom chip add, and typed fill. Existing journal journeys still pass.

## Previous cycle: keep DCA Lab quote freshness honest

### Why this was selected

The market strip still said “Recent last sale” after a Manual override, and
hero prices kept showing Nasdaq while the plan used the typed figure.

### Changes

- Manual symbols show the override in the hero, a Manual move badge, and
  “Manual override · used in today's plan” under the input.
- Freshness becomes `… · TSLA manual` or `Manual prices` when both are
  overridden; live styling drops when the plan is fully manual.
- Recommendation confidence says “Manual price in use”.
- Version `2026.08.25.7`.

## Previous cycle: close hub drift for footer KoboForge and AIly packages

### Why this was selected

Visitors still could not find two already-shipped products from the public hub:
KoboForge was missing from the footer, and AIly’s Windows/Android packages had
no portfolio link even though the GitHub profile advertises them.

### Changes

- Added a footer KoboForge control after AIly, using the standalone
  `https://alphaeusng.github.io/KoboForge/` URL already used by tabs, mobile,
  and Craft.
- Kept Craft “Open AIly →” pointed at the PWA and added a matching
  “Packages →” action to `https://github.com/AlphaeusNg/AIly/releases`.
- Added a compact Packages sibling beside AIly in `#mobile-project-links` so
  phones can reach Releases without scrolling to Craft.
- `check_site` now requires four standalone KoboForge home URLs and the AIly
  Releases URL. The existing Chromium home-discovery journey covers footer
  KoboForge plus Craft and mobile Releases hrefs.
- Bumped coupled cache keys and the deployment stamp to `2026.08.25.6`.
  The owner-provided untracked screenshot was preserved and excluded.

### Verification and scores

- Uncommitted `main` work matches the claim: footer KoboForge and Craft/mobile
  AIly Packages/Releases hrefs are present; `check_site` requires four
  standalone KoboForge URLs plus the Releases URL; `SITE_VERSION` and coupled
  cache keys are `2026.08.25.6`; the owner screenshot stays untracked.
- Gate: 31 Python tests, 14 DCA tests, `check_site`, sitemap/conviction
  `--check`, `compileall`, first-party JavaScript syntax, and 19/19 Chromium
  journeys all passed.
- User experience: 7/10 → 9/10 (shipped products are findable from the hub).

### Next opportunity

Rotate after DCA Lab quote-freshness honesty.

## Previous cycle: put AIly on the public hub

### Why this was selected

AIly is the current local-first product and already lives on the GitHub profile
and in the sitemap, but the portfolio home had no tab, Craft card, mobile
link, footer link, or feedback category. Visitors and recruiters could miss it.

### Changes

- Added AIly to `#project-tabs`, the mobile Projects list, `#craft`, and the footer.
- Added AIly to the feedback project list and mapped `/AIly/` in `kofi-support`.
- `check_site` now requires four standalone AIly home links plus the feedback/support mapping.
- Two Chromium journeys cover desktop/phone discovery and the AIly GitHub-draft fallback.
- Bumped coupled cache keys and the deployment stamp to `2026.08.25.5`.

### Verification and scores

- `python3 tools/check_site.py`: `AIly is linked from home, feedback, and support`.
- 31 Python tests, sitemap freshness, syntax, and `git diff --check` passed.
- `npm run test:browser`: 19/19 Chromium journeys, including desktop/phone AIly discovery and the AIly GitHub-draft fallback.
- User experience: 6/10 → 9/10 (AIly is findable from the public hub).

### Next opportunity

Keep DCA Lab quote freshness honest (snapshot vs real-time vs manual override).
Workspace next: continue rotation.

## Previous cycle: tolerate literal percent signs in vault paths

### Why this was selected

The canonical viewer decoded every note lookup key with raw
`decodeURIComponent`. A standards-valid vault note such as `100% Truth.md`
therefore raised `URIError` while indexes were built and replaced the entire
viewer with “Could not load vault-data.json: URI malformed.”

### Changes

- Added one fail-safe URI-component decoder and reused it for dataset lookup
  keys, note-link resolution, and hash paths. Valid percent escapes still
  decode; malformed percent text remains literal and comparable.
- Added the first dedicated Chromium vault-viewer journey. It injects a
  relationship-consistent `100% Truth.md` fixture, loads all 55 notes, searches
  and opens the note, and verifies the encoded `#\/100%25%20Truth.md` deep link.
- Pinned D3 7.9 as a dev-only test dependency and serves that local bundle into
  the production CDN URL during the journey. Tailwind, Markdown, DOMPurify,
  Firebase, and live-note fetches are also controlled, so the regression does
  not depend on third-party availability.
- Bumped all coupled cache keys and the deployment stamp to `2026.08.25.4`.
  The owner-provided untracked screenshot was preserved and excluded.

### Verification and scores

- Test-first: the new production-page journey failed with
  `Could not load vault-data.json: URI malformed`; it passes after the shared
  decoder and opens the exact encoded deep link.
- Complete local gate: 17/17 Chromium journeys (up from 16), 31 Python tests,
  14 DCA engine/quote tests, conviction and sitemap freshness, 42-file site
  contracts, Python compilation, every first-party JavaScript syntax check,
  cache-stamp checks, and whitespace checks passed.
- `npm ci` reproduced the lockfile graph and `npm audit` reported zero known
  vulnerabilities across all 42 installed packages.
- Hosted CI run `32776789402` passed the complete gate in 44 seconds and Pages
  run `32776788473` deployed successfully. Live responses expose version
  `2026.08.25.4`, the safe decoder, and the matching viewer cache stamp.
- Correctness/reliability: 4/10 → 9/10; observability/verifiability: 2/10 →
  10/10; maintainability: 7/10 → 9/10; performance: 9/10 → 9/10;
  security/robustness: 6/10 → 9/10; user experience: 3/10 → 9/10.

### Lessons and process improvements

- URI decoding is an untrusted operation even for repository-authored paths;
  malformed percent text is valid filename content and must not be fatal.
- A browser fixture that mutates a node identity must update its incident link
  endpoints too, or graph-integrity failures obscure the boundary under test.
- Browser coverage for CDN-backed pages should fulfill runtime libraries from
  pinned local test dependencies rather than relying on the network.

### Explicit next opportunity

Rotate to the GitHub profile repository and audit its public claims and link
integrity; no higher-impact unblocked portfolio item is currently recorded.

## Previous cycle: bound DCA import, saved state, and journal rendering

### Why this was selected

CSV import limited row count only after decoding the entire file, persisted
ledger text had no length limits, and the journal created one table row for
every saved entry. An oversized local file or browser value could therefore do
unbounded parsing/rendering work. The import's date check also accepted
regex-shaped impossible dates such as 30 February into live state.

### Changes

- Reject CSV files over 1 MiB before `file.text()`, reject decoded input over
  one million characters, and retain the existing 10,000-row ceiling.
- Reuse real calendar-date validation for imported rows, so impossible dates
  cannot mutate journal or monthly totals.
- Refuse to parse persisted state over two million characters; cap hydrated
  rows at the newest 10,000 and bound IDs plus optional ledger metadata.
- Render at most the newest 500 journal rows while retaining and reporting the
  full saved count, preventing one large table from monopolizing the page.
- Add real Chromium paths for every boundary, including full-history retention
  after render limiting and repair of oversized metadata.
- Bumped the deployment and cache stamp to `2026.08.25.3`.

### Verification and scores

- Test-first evidence: the old app accepted all oversized ledger text, parsed
  a 2.1M-character payload, rendered 501 rows, and handled a >1 MiB CSV only
  after decoding it; the impossible-date import also mutated saved state.
- Four focused Chromium regressions and the complete 16-journey suite pass
  after the bounded implementation.
- Thirty-one Python tests, 14 DCA engine/quote tests, 42-file site contracts,
  cache-stamp and sitemap checks, Python compilation, every first-party
  JavaScript syntax check, zero production npm vulnerabilities, and diff
  whitespace all pass.
- Correctness/reliability: 5/10 → 10/10; observability/verifiability: 5/10 →
  10/10; maintainability: 7/10 → 9/10; performance/resources: 4/10 → 9/10;
  security/robustness: 5/10 → 9/10; user experience: 6/10 → 9/10.

### Lessons and process improvements

- Bound files before decoding, decoded text before splitting, hydrated state
  before iterating, and DOM output before rendering; each is a distinct cost.
- Reuse semantic calendar validation at every ingestion boundary instead of
  allowing one path to rely on later reload-time repair.
- A render cap must disclose truncation and preserve the complete stored state.

### Explicit next opportunity

No higher-impact unblocked local item is currently recorded. Rotate repositories
and return when new evidence appears.

## Previous cycle: quarantine malformed DCA browser state

### Why this was selected

The DCA loader merged arbitrary parsed browser data into live settings and
accepted every array item as a ledger row. A single persisted `null` entry
crashed journal rendering before market data or a recommendation could load.

### Changes

- Validate saved settings, manual prices, strategy, month totals, calendar
  months/dates, ledger identities, symbols, and numeric fields at load time.
- Preserve valid month totals and journal rows while ignoring invalid or
  duplicate records; never feed malformed values into rendering or plan math.
- Explain that invalid saved data was ignored and retain the notice until a
  successful user change persists the repaired state.
- Add a real Chromium regression covering a fatal null row, invalid settings,
  impossible dates/months, valid history preservation, sanitized persistence,
  and warning-free reload.

### Verification and scores

- Test-first evidence: the adversarial state raised `Cannot read properties of
  null (reading 'date')` and left the recommendation blank. A follow-up fixture
  also proved regex-shaped `2026-99` / `2026-99-99` values survived until
  calendar validation was added.
- The focused recovery journey and complete 13-journey Chromium suite pass.
  Thirty-one Python tests, 14 DCA engine/quote tests, 42-file site contracts,
  sitemap freshness, Python compilation, every first-party JavaScript syntax
  check, zero production npm vulnerabilities, and diff whitespace also pass.
- Correctness/reliability: 4/10 → 9/10; observability/verifiability: 5/10 →
  10/10; maintainability: 7/10 → 9/10; performance: 9/10 → 9/10;
  security/robustness: 6/10 → 9/10; user experience: 3/10 → 9/10.

### Lessons and process improvements

- JSON parsing proves syntax, not domain shape; persisted state is an untrusted
  boundary even when only this application normally writes it.
- Date validation needs calendar round-tripping, not only a digit pattern.
- Recovery tests should preserve one valid record and reload the saved repair,
  not merely prove that invalid input no longer throws.
- A moving market fixture exposed a chart-test precondition: a manual price is
  the final chart point only when its plan date is current. The journey now
  explicitly jumps to today before asserting End-key behavior rather than
  weakening the price assertion.

### Explicit next opportunity

Bound DCA CSV import and persisted text fields by decoded size/length so a
locally supplied file cannot create an unnecessarily expensive DOM journal.

## Previous cycle: make denied DCA journal writes visibly temporary

### Why this was selected

The DCA Lab caught browser-storage failures, but a later “Recorded” message
replaced the error. A purchase could therefore look durable even though it
would disappear when the tab closed.

### Changes

- Keep storage durability in a dedicated live status that is not overwritten
  by calculation or journal action messages.
- State plainly that blocked writes remain available only until the tab closes.
- Clear the warning after the browser accepts a later write; that recovery
  persists the full in-memory journal, not just the latest control change.
- Add a controlled Chromium regression for denial, in-session continuity,
  recovery, persistence, and reload.
- Reconcile the portfolio state log with the already-shipped DCA Lab and its
  expanded local verification surface.

### Verification and scores

- Test-first evidence: the new browser journey failed because no durable
  storage notice survived the journal success message.
- Focused browser journey passes after the change. The complete gate passed:
  12 Chromium journeys, 31 Python tests, 14 DCA engine/quote tests, 42-file
  site contracts, sitemap freshness, Python compilation, every first-party
  JavaScript syntax check, zero production npm vulnerabilities, and clean diff
  whitespace.
- Correctness/reliability: 7/10 → 9/10 (temporary journal state is no longer
  presented without a durability warning).
- Observability/verifiability: 7/10 → 10/10 (denial and recovery are executed
  against the production page).
- Maintainability: 8/10 → 9/10 (durability has one independent status surface).
- Performance: 9/10 → 9/10; security/robustness: 8/10 → 9/10; user experience:
  7/10 → 9/10.

### Lessons and process improvements

- Operation success and storage durability are separate outcomes and need
  separate status lifetimes.
- A recovery test should prove the entire in-memory journal reaches storage,
  then reload it, rather than checking only that `setItem` stopped throwing.

### Explicit next opportunity

Validate and recover malformed persisted DCA state so structurally invalid
settings or ledger rows cannot poison later calculations and rendering.

## Previous cycle: align Ko-fi card and restore footer Feedback

### Why this was selected

A home screenshot showed the coffee cup and Ko-fi chip on different
vertical axes, and “Have feedback?” in the footer with no form or
button. `data-feedback="false"` on the shared script killed the footer
control that the support card comment promised.

### Changes

- Put the cup, heading, and Ko-fi chip on one row so they share alignment.
- When the page has a dedicated Ko-fi host plus `data-auto-footer`, the
  footer always gets a Feedback link to `/pages/feedback/`.
- `check_site` now rejects a home page that disables that pairing.

## Previous cycle: unify Conviction chrome with home

### Why this was selected

Conviction still used a thinner header than home, exposed a filesystem path in the footer, and had no skip link or as-of line above the charts.

### Changes

- Add a skip link and in-flow header with the home A mark, gold border language, Back to main, and one-line pills (Conviction current, vault, Home).
- Footer is “Personal ledger · not advice”; drop `data/tsla_transactions.csv`.
- Paint an “as of {latest transaction date}” methodology line above the charts from existing payload dates.
- Bump to `2026.08.18.5` and keep feedback / kofi cache keys on the stamp.

### Explicit next opportunity

Vault header still has its own chrome. Workspace next: continue rotation.

## Previous cycle: quieter chrome — one-line nav, thin project tabs, smaller vault header

### Why this was selected

Home nav pills were two-line 9.5rem cards, the project-tab strip read as a second toolbar, and the vault title still dominated the first screen. The ask was cleaner, more pleasant navigation without removing `#nav`, `#project-tabs`, or vault IDs.

### Changes

- Drop `.nav-pill-meta` and restyle `.nav-pill` as a compact single-line chip (Work / Faith / Connect).
- Thin `.project-tabs-bar`: smaller type and padding; hide the “Projects” label visually; keep every project link.
- Vault title `text-3xl md:text-4xl`, tighter header padding, and Fit / Reset / PNG moved beside “Interactive graph” so Notes is search + folders + files.
- Bump to `2026.08.18.4` and keep feedback / kofi cache keys on the stamp.

### Explicit next opportunity

Conviction header still uses a thinner chrome than home. Workspace next: continue rotation; skip Car-Type-Classification-Service and leave KoboForge to the other agent.

## Previous cycle: first-screen hero, Craft cards, and a read-first vault

### Why this was selected

Workspace rotation asked for visitor-visible product value, not another
verification-only gate. The phone hero hid the job line behind a 68px name,
the Connect email button went white-on-white on hover, VerseKeep and
AlpArcade were missing from Selected work, and the public vault greeted
people with editor chrome.

### Changes

- Clamp the hero name, drop the faith paragraph and chips on small screens,
  and stop forcing a full-viewport first paint on phones so CTAs appear.
- Fix the Connect email hover to gold-on-navy and correct the `system-ui`
  fallback typo.
- Add VerseKeep and AlpArcade cards to `#craft`.
- Replace the light Google Maps embed with an address plus “Open in Maps”.
- Vault viewer: load Inter/Playfair, hide Refresh/Obsidian/sign-in behind
  Editor & source, add Notes/Graph/Read surfaces on phones, filter the
  file tree from search, honor `#/path` links, and offer Copy link.
- Couple remaining kofi-support cache keys to `SITE_VERSION` and bump to
  `2026.08.18.3`.

### Explicit next opportunity

Conviction header still uses a thinner chrome than home. Workspace next:
continue rotation; skip Car-Type-Classification-Service and leave KoboForge
to the other agent.

## Previous cycle: couple feedback CSS and JS cache keys

### Why this was selected

The feedback script already used the deploy stamp, but `css/main.css` still
carried `2026.07.24.1`. A stylesheet change could stay stale after deploy, and
the mismatch was the documented return item.

### Changes

- Pointed the feedback stylesheet and script at `SITE_VERSION.id`.
- Added a `check_site.py` contract so both cache keys must match the stamp.
- Bumped the deployment version to `2026.08.18.2`.

### Verification and scores

- `python3 tools/check_site.py` reports `feedback asset cache keys match 2026.08.18.2`.
- 24 unit tests and `compileall` passed.
- Correctness/reliability: 7/10 → 9/10 (feedback CSS cannot silently remain on an old query).
- Verifiability: 5/10 → 10/10 (the pairing is mechanically checked).
- Maintainability: 7/10 → 9/10 (one stamp owns both assets).
- Performance: 9/10 → 9/10.
- Security/robustness: 8/10 → 8/10.
- Developer/user experience: 7/10 → 8/10 (deploys bust both caches together).

### Lessons and process improvements

- When a page has two versioned assets, check them against the same stamp
  rather than bumping only the file that changed.

### Explicit next opportunity

Inspect remaining kofi-support cache keys on home/conviction/viewer pages.
Workspace next: continue rotation; skip Car-Type-Classification-Service.

## Previous cycle: keep feedback usable when Firebase never loads

### Why this was selected

Workspace rotation returned to the oldest non-profile backlog. The documented
next local item was the initialization boundary: a missing Firebase SDK
disabled the submit button and left the GitHub draft hidden, so a blocked CDN
made the form a dead end.

### Changes

- Treat a missing or throwing Firebase SDK as an offline-fallback mode instead
  of disabling submission.
- Reveal the privacy-safe GitHub draft at startup and refresh it as the form
  changes, still omitting the optional email.
- Submit without a database now uses the same fallback helper as a failed
  private-inbox write.
- Added a Chromium journey that loads empty Firebase scripts, keeps the form
  enabled, and proves the draft contains the message but not the contact email.
- Bumped the deployment and feedback-script cache key to `2026.08.18.1`.

### Verification and scores

- Test-first evidence: the old page showed only a refresh error and a disabled
  submit control when the SDK scripts defined nothing.
- The focused initialization journey passed after the fallback landed.
- Complete browser suite: 6 passed, including the existing write-failure
  fallback. Site contracts, 24 unit tests, sitemap freshness, compilation, and
  JavaScript syntax checks passed.
- Correctness/reliability: 6/10 → 9/10 (CDN or init failure no longer dead-ends the form).
- Observability/verifiability: 7/10 → 10/10 (init and write fallbacks are both browser-locked).
- Maintainability: 8/10 → 9/10 (one helper owns every GitHub-draft reveal).
- Performance: 9/10 → 9/10 (no extra network work).
- Security/robustness: 8/10 → 9/10 (email remains absent from the public draft).
- Developer/user experience: 5/10 → 9/10 (users can still send feedback offline).

### Lessons and process improvements

- An initialization failure needs the same recovery path as a later write
  failure; hiding the fallback until submit is too late if submit is disabled.
- Empty SDK doubles are enough to prove the missing-global branch without
  aborting scripts and tripping first-party console-error monitors.

### Explicit next opportunity

Rotate to KoboForge, still the next least-recently improved repository after
this portfolio cycle.

## Previous cycle: exercise and harden the feedback journey

### Why this was selected

The project-aware feedback form had Firestore rules and static checks but no
executed browser contract for query handling, HTML validation, successful
submission, cooldown, or fallback privacy. While defining that journey,
inspection found that source validation compared protocol and hostname
separately, admitting nonstandard ports as trusted portfolio return links.

### Changes

- Replaced the split source check with exact normalized-origin equality, so an
  alternate port falls back to the selected project's canonical URL while real
  same-origin paths remain supported.
- Added a local Firebase SDK double at the external-script boundary and kept the
  real feedback page and application code under test.
- Added one end-to-end Chromium journey covering project personalization,
  source sanitization, short-message validation, exact Firestore payload,
  successful reset/reference, 30-second cooldown, rejected private-inbox write,
  and a prefilled GitHub draft that excludes the contact email.
- Bumped the deployment and feedback-script cache key to `2026.08.11.6` and
  documented the deterministic browser boundary.

### Verification and scores

- Test-first evidence: the new journey failed because the old page preserved
  `https://alphaeusng.github.io:444/untrusted` as its trusted return link.
- The focused full-lifecycle journey passed 3/3 consecutive runs after the
  origin fix; its successful and rejected writes never touch Firebase.
- Three complete suite repetitions passed 15/15 journeys; the browser suite now
  has five paths / 73 encoded interaction, data, accessibility-state, privacy,
  network, and runtime assertion sites.
- All 24 Python tests, conviction and sitemap freshness checks, 35-file site
  contracts, compilation, recursive JavaScript syntax, `git diff --check`, and
  the zero-vulnerability npm audit passed.
- Correctness/reliability: 6/10 → 9/10 (return links and all form states now have executed contracts).
- Observability/verifiability: 4/10 → 10/10 (payloads, cooldown, and fallback are visible without an external service).
- Maintainability: 7/10 → 9/10 (one SDK-boundary double exercises production orchestration).
- Performance: 9/10 → 9/10 (deployed work is one exact string comparison).
- Security/robustness: 6/10 → 9/10 (alternate-port trust is closed and fallback email omission is enforced).
- Developer/user experience: 6/10 → 9/10 (success, retry, and fallback outcomes are regression-protected).

### Lessons and process improvements

- URL trust decisions must compare normalized origins, not protocol and hostname
  separately; the port is part of the security boundary.
- Stub an external SDK at its script/API surface, then execute the real page
  rather than replacing application orchestration with a test implementation.
- Privacy claims need negative assertions: decode the fallback draft and prove
  the private contact value is absent.

### Explicit next opportunity

When Firebase SDK loading fails entirely, the page disables submission without
offering its GitHub fallback. Preserve a useful, privacy-safe alternate path at
that initialization boundary. At workspace scope, rotate to KoboForge.

## Previous cross-repository cycle: validate source-located vault diagnostics

### Why this was selected

The source vault now preserves exact occurrence lines for unresolved and
ambiguous note links. The portfolio checker needed to enforce that richer
producer contract; review also found that it accepted only `wikilink` entries
even though the exporter supports unresolved internal Markdown links.

### Changes

- Extracted generated-vault validation into a reusable pure function rather
  than keeping the contract embedded in the CLI path.
- Accepts the producer's two internal link syntaxes (`wikilink` and `markdown`)
  and requires every diagnostic to carry non-empty, sorted, unique positive
  source lines.
- Added three unit tests with valid mixed-syntax metadata and mutations for
  missing, empty, non-positive, unsorted, duplicate, boolean, and unknown-type
  values.
- Synchronized the source-located 26-diagnostic payload and bumped the public
  deployment version to `2026.08.11.5`.

### Verification and scores

- Test-first evidence: the new consumer contracts failed to import the absent
  validator; the prior inline check also explicitly rejected `markdown`.
- Focused downstream coverage passed all three tests and their seven line-shape
  mutations after implementation.
- The canonical source and public payloads are byte-identical and retain 55
  notes, one canvas, 62 nodes, 99 resolved links, 26 unresolved diagnostics,
  zero ambiguous diagnostics, and 27 recorded occurrence lines.
- All 24 Python tests, conviction and sitemap freshness checks, 35-file site
  contracts, four Chromium journeys, compilation, JavaScript syntax, and the
  zero-vulnerability npm audit passed; the vault viewer sitemap date advanced
  from 2026-08-10 to 2026-08-11 from its tracked payload input.
- Correctness/reliability: 7/10 → 9/10 (consumer and exporter no longer disagree on valid link types).
- Observability/verifiability: 7/10 → 10/10 (diagnostic source locations are schema-validated, not display-only text).
- Maintainability: 7/10 → 9/10 (one pure validator supports direct mutation tests and the CLI gate).
- Performance: 9/10 → 9/10 (linear validation over 26 small records is deployment-only).
- Security/robustness: 8/10 → 9/10 (weak booleans and malformed location arrays fail closed).
- Developer/content-owner experience: 6/10 → 9/10 (public metadata retains exact review locations).

### Lessons and process improvements

- A generated-data consumer needs executable fixtures for every producer branch,
  including branches absent from the current corpus.
- Extract validation from command orchestration when mutation tests need to
  prove schema behavior directly.

### Explicit next opportunity

The portfolio's next local item remains deterministic feedback-page browser
coverage. At workspace scope, rotate to CardFitSG after completing this paired
source/public deployment.

## Previous portfolio cycle: fail browser smokes on first-party HTTP errors

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
| — | Close hub drift: footer KoboForge and AIly packages | Discoverability / UX | Medium | Small / low | Footer KoboForge plus Craft/mobile Releases hrefs, gated by check_site and 19 journeys | Completed in the 2026.08.25.6 cycle (uncommitted) |
| — | Tolerate literal percent signs in public vault paths | Correctness / test | Medium-high | Small / low | A deterministic production-page Chromium fixture proves load, search, selection, and encoded deep linking | Completed in the 2026.08.25.4 cycle |
| — | Bound DCA CSV/state ingestion and journal DOM work | Reliability / performance | Medium-high | Small-medium / low | Four browser paths cover file, decoded text, raw state, metadata, dates, and 500-row rendering | Completed in the 2026.08.25.3 cycle |
| — | Align remaining kofi-support cache keys with the deploy stamp | Maintainability / UX | Low | Small / low | Home, conviction, and viewer cache keys are coupled to the deployment stamp | Completed in the 2026.08.18.3 cycle |
| — | Couple feedback CSS and JS cache keys to SITE_VERSION | Maintainability / reliability | Low-medium | Small / low | check_site now requires both feedback assets to match the deploy stamp | Completed in Cycle 161 |
| — | Offer a privacy-safe fallback when Firebase cannot initialize | Reliability / UX | Medium | Small-medium / low | Init and write failures both reveal a GitHub draft that omits email | Completed in Cycle 152 |
| — | Add a deterministic feedback-page browser journey | Test / reliability | Medium-high | Medium / low | Five Chromium paths now cover source trust, validation, success payload, cooldown, and private fallback | Completed in Cycle 142 |
| — | Validate source-located vault diagnostics | Correctness / observability | Medium | Small-medium / low | Three consumer tests cover both internal link syntaxes and seven invalid source-line shapes | Completed in Cycle 135 |
| — | Add first-party failed-response diagnostics to browser smokes | Observability / reliability | Low-medium | Small / low | A mutation-proven shared listener now reports status, method, and local URL | Completed in Cycle 133 |
| — | Add a deterministic conviction-page browser journey | Test / reliability | Medium-high | Medium / low | Four browser paths now cover exact finance DOM output and all benchmark dataset/ARIA transitions | Completed in Cycle 124 |
| — | Replace the fixed desktop header offset with measured chrome geometry | Robustness / maintainability | Low | Medium / low | A 178px mutation now proves the runtime adapts beyond the former 132px constant | Completed in Cycle 114 |
| — | Add `<lastmod>` values from deploy inputs | SEO / process | Low-medium | Medium / low | Three local routes now derive dates from tracked inputs; six sibling deployments remain intentionally undated | Completed in Cycle 104 |

## Next cycle

Keep DCA Lab quote freshness honest (snapshot vs real-time vs manual override).
Workspace next: continue rotation around externally blocked model,
physical-device, and content-owner decisions. Skip
Car-Type-Classification-Service unless named. Commit this hub-drift cycle
before mixing other portfolio work.
