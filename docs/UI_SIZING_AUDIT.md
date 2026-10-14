# Portfolio UI sizing audit

Audited 2026-10-14 against fresh `origin/main` (`bdca4df`) in an isolated worktree. Release: `2026.10.14.2`.

## Method and coverage

Measured actual Chromium bounding boxes, document scroll width, control content overflow and focus. Inspected screenshots before and after fixes. The automated matrix covers each route below at 320, 375, 768 and 1280 CSS px, plus a 640 CSS px reflow viewport representing 1280px at 200% zoom and a 375px viewport with root font enlarged to 200% (computed 32px). These are distinct probes: root scaling also enlarges rem spacing; the reduced viewport approximates browser zoom rather than operating browser toolbar zoom.

| Route | Additional states inspected at 320 / 375 / 768 / 1280 |
| --- | --- |
| `/` | Craft filters/search, expanded phone menu, KoboForge case study, keyboard focus |
| `/pages/dca-calculator.html` | Real-time setup dialog, long native feed option, expanded chip editor and input focus, quote actions, fixed quick-log bar |
| `/pages/seeking-biblical-truth/` | Expanded editor/source tools, notes surface, reading surface and Copied link feedback |
| `/pages/conviction.html` | Benchmark mode controls, ledger/table containers, related-page tabs |
| `/pages/alphaeus-thoughts.html` | Contents dialog where available, footnote dialog and restored trigger focus, long lens labels, search controls |
| `/pages/feedback/` | Rating labels, form, GitHub fallback visible when Firebase is unavailable |
| `/pages/sg-transit.html` | Copy-link success, share icons, comment form and navigation |

Scope includes local markup and CSS, including shared chrome. It excludes sibling app implementations, public comment writes, cloud sign-in, device-native share sheets, and classifier UI.

## Findings and fixes

| Finding | Evidence before | Result after |
| --- | --- | --- |
| Long headings and flex/grid minimum widths could force text offscreen | Initial 375px / 200% text screenshots showed clipped home name, conviction heading/navigation, vault reader content, thoughts header, and transit back link. Initial measured document overflow: home 170px, vault 372px, conviction 329px, thoughts 11px, transit 80px. Fallback-font testing separately exposed a 44px thoughts heading overflow. | Allow text wrapping, shrinking grid tracks and flex items, wrapped header/action rows and resume actions. All seven routes fit the final 375px / 200% root-text probe. Text is retained at its enlarged size. |
| Chart toggle and vault reader minimum widths exceeded small phones | Initial 320px document overflow: conviction 75px and vault 50px; conviction also overflowed 20px at 375px. | Benchmark buttons wrap and panels can shrink; the phone heading scales responsively rather than leaving one trailing letter on a line. Vault surface tracks and reader content can shrink. Final document widths equal their viewports. |
| DCA offscreen layout contributions and enlarged panel labels | Initial DCA document overflow: 58px at 320 and 3px at 375. Closed chip-editor descendants had layout boxes outside the viewport. Enlarged table headers revealed an absolutely positioned hidden label escaping its scroller; enlarged signal/range controls also exceeded panel width. | Closed editor descendants do not contribute layout; the journal wrapper contains positioned labels. Panels/tracks can shrink, range/header groups wrap, and mobile quick-log actions reflow. The table retains its own horizontal scroll area. On small phones quote prices have their own row, and the quote cards stack when enlarged text needs more width. |
| Quote actions had a short activation area | Refresh and Go real-time were approximately 16.3px high. | Minimum height 24 CSS px, without increasing toolbar width or adding a separate toolbar. |
| Footnote buttons were smaller than intended compact targets | Approximately 22.4 × 22.4px. | Minimum 24 × 24px. The footnote dialog still closes and returns focus to its trigger. |

The final automated reflow matrix contains 42 passing configurations. The target/editor/footnote regressions add two focused journeys. No across-the-board control shrink was applied; primary actions and existing roomy form controls retain their sizing.

## Classification and intentional scrolling

- The Case study text button has a stretched `::after` hit area covering its card. Its 16px text box does not describe its activation area.
- Inline prose links and footnotes are not equivalent to a dense toolbar. The minimum-target guidance includes inline and spacing exceptions; larger standalone targets were prioritized.
- Feedback rating radios and DCA strategy radios use visible clickable labels. Visually hidden radio/file inputs and offscreen anti-spam fields were excluded from tiny-target/overflow findings.
- Related-page tab strips, the thoughts outline rail, and journal tables intentionally scroll horizontally within their own containers. Content outside the initial scroll position is not a document overflow defect.
- Vault backlinks are short text controls with list spacing; they were not expanded into full-width chrome. Native checkboxes/select options and chart/map-like spatial targets were reviewed separately from standalone buttons.
- Long selected native feed text can be shortened visually by the browser select; its option and adjacent explanation retain the coverage description. No native widget redesign was attempted.

## Evidence and validation

Local artifacts: `/tmp/sizing-portfolio-evidence/`. `before.json`, `after.json` and `states.json` record geometry; per-route screenshots include `home-text200.png` versus `after-home-text200.png`, the analogous conviction/vault/thoughts/transit pairs, final DCA/conviction refinements in `final-dca-320.png`, `final-dca-text200.png`, `final-conviction-320.png`, `final-conviction-text200.png`, and `state-menu-320.png`, `state-case-320.png`, `state-chips-320.png`, `state-realtime-320.png`, `state-footnote-320.png`, and copy/fallback states at all four widths. These are temporary inspection artifacts, not deployed assets.

Committed regression: `tools/browser/sizing.spec.mjs`. Required validation also covers generated CSS, 37 Python contracts, site/sitemap/data freshness, 32 DCA tests, 4 case-route tests, Python compilation and JavaScript syntax. All 59 Chromium journeys passed. The final responsive heading and quote-row refinement was rechecked through all three sizing journeys. Two existing live-price journeys needed fixture clocks/timestamps coordinated with the newest bundled quote date; their synthetic feed is now consistently newer than the snapshot. The production snapshot was not altered.

## Limits

This is a bounded sizing review, not a claim of exhaustive optimality or formal WCAG conformance. Chromium was used; physical Safari/Android browser and OS text-size settings were not exercised. Stable automated geometry uses system fallback fonts and blocked Firebase scripts; initial screenshots also sampled network-loaded fonts. Cloud failures, native popup rendering, every vault note/table and all possible user-entered strings are not exhaustively covered. Existing interactive browser journeys continue to cover modal navigation and application behavior.

Reference criteria: [W3C minimum target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), and [resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html). These distinguish target size from spacing, inline/native exceptions and intentional two-dimensional content.
