# Portfolio feature roadmap

Researched 2026-10-14. Scope: the portfolio and its viewer UI; sibling apps retain their own repositories.

## Evidence and priorities

The Craft section contains ten cards spanning AI, general tools, and faith. Visitors currently scan the entire grid to find a technology or purpose. Existing case-study routes already support shareable details, but there is no shareable shortlist. This is observed repository behavior, not user analytics.

Primary references consulted:

- [W3C APG button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/): native button activation and a stable label with `aria-pressed` express a selected filter. Focus remains on the control when the action updates the current context.
- [W3C WCAG 2.2 status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): result counts and no-results outcomes should be available to assistive technology without moving focus.
- [MDN URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams): query parameters provide encoded, bookmarkable state while retaining unrelated parameters.

These references inform implementation, rather than establish demand. Selection is based on the visible catalog size and breadth, low deployment risk, and a useful recruiter/visitor capability without additional content claims.

## Selected: searchable project catalog — shipped

Add All projects, AI & ML, Tools & apps, and Faith filters; combine the selected category with case-insensitive text search across existing card copy. Every search word must match. VotaFun appears in AI and tools. Categorization describes the existing work; it does not rewrite project claims.

Use native buttons, a labeled search input, a polite count, concise empty guidance, and Clear filters. Keep all original cards/actions usable without JavaScript. Commit category/search state to `projects` and `project-search` parameters, preserving unrelated parameters, case-study state, and the current fragment. Search edits share one history entry per focus session; categories and clearing add entries. Restore filters on browser back/forward. Compose text before filtering it.

Acceptance:

- All ten projects appear by default; category plus multiword search gives the correct subset and count.
- Empty results explain how to recover; clearing restores all cards and focuses the search without scrolling.
- A copied URL and reload restore the same results; browser back/forward restores state.
- Opening/closing a case study preserves the shortlist and existing query parameters. A direct case link outside the shortlist still opens, and closing focuses a visible search control.
- Native keyboard activation, IME composition, 320px layout, no-JavaScript card access, and existing portfolio/browser gates pass.
- Existing essays, financial snapshots, vault data, and sibling app functionality stay unchanged.

## Next priorities

1. Project comparison: select two or three existing case studies and compare problem, contribution, outcome, and demo/source actions. Reuse existing evidence; do not invent performance metrics. Validate a compact phone layout before adding this surface.
2. Vault reading trail: an optional local list of recently opened notes, removable without cloud sign-in. Research privacy/storage failure paths and confirm no changes to the canonical note dataset.
3. DCA journal review: month summaries from recorded fills, explicitly separating manually entered totals from recorded rows. Reconcile against the production journal rules before exposing charts or return claims.

Dependencies and limits: no analytics are present to rank these by measured demand. Owner decisions are still required for unfinished vault content. Market updates remain in the existing trusted automated pipeline.
