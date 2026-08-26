# Conviction DCA Lab

## Product goal

Turn the existing Conviction page into the entry point for a local-first daily
allocation tool focused on Tesla (`TSLA`) and Space Exploration Technologies
(`SPCX`). The tool should answer one narrow question well:

> Given a fixed monthly contribution, what is a disciplined amount to deploy in
> each asset during the next U.S. trading session?

The calculator is decision support, not an order-routing system or a price
prediction model. It must make its inputs, calculations, uncertainty, and data
freshness visible.

## Non-negotiable rules

1. The monthly contribution is a hard cap. A weak market signal can move money
   forward within the month, but it cannot increase the month's budget.
2. A positive session never turns the recommendation off. The good-day floor
   keeps a consistent contribution cadence while budget remains.
3. A negative session can raise the day's amount, subject to the selected
   maximum multiplier and the remaining monthly budget.
4. The last trading session recommends the unspent remainder so the strategy
   does not accidentally become permanent market timing.
5. The engine uses U.S. trading sessions rather than calendar days.
6. Automatic prices are a timestamped Nasdaq snapshot backed by end-of-day
   history. A visible manual price override is the supported path when the
   committed snapshot is no longer current enough for an intraday calculation.
7. Personal inputs and the purchase journal live in browser storage. Optional
   Google sign-in copies the journal to a private Firestore document
   (`dcaJournals/{uid}`) so phone and computer stay in sync. Sync is never
   required to log a fill.
8. A recommendation must include an explanation and a data-confidence label.

## Instrument identity

- `TSLA`: Tesla, Inc., Nasdaq.
- `SPCX`: Space Exploration Technologies Corp. (SpaceX), Nasdaq and Nasdaq
  Texas. SpaceX began public trading on 12 June 2026.
- The SPAC and New Issue ETF previously using `SPCX` changed to `SPCK` on
  7 April 2026. The UI always shows ticker and company name together to avoid
  symbol-history ambiguity.

## Calculation model

### Monthly pacing

For each asset:

```text
target budget     = monthly contribution × target allocation
remaining budget  = max(0, target budget − invested month to date)
daily baseline    = remaining budget ÷ remaining trading sessions
suggested dollars = daily baseline × market multiplier
```

The suggestion is clamped to the configured good-day floor, bad-day ceiling,
and remaining budget. On the final trading session it equals the remainder.

### Market signal

The signal deliberately combines several observable price facts rather than a
single red/green day:

- one-session return;
- five-session return;
- distance from the 20-session moving average;
- drawdown from the trailing 20-session high;
- 14-session RSI; and
- trailing 20-session return volatility.

Each directional move is normalized by the asset's recent volatility. This
prevents an ordinary TSLA or SPCX move from being treated like the same-sized
move in a low-volatility security. Weighted weakness and extension scores are
converted to a multiplier:

```text
multiplier = 1 + (dip sensitivity × weakness score)
               − (0.35 × extension score)
```

The result is clamped by the strategy preset. A security with fewer than 60
sessions of history has its signal pulled toward `1.0×` and its maximum capped
at `1.75×`. This applies to SPCX during its early public history.

### Presets

| Preset | Good-day floor | Dip sensitivity | Maximum weak-day amount |
|---|---:|---:|---:|
| Steady | 0.85× | 0.85 | 1.60× |
| Balanced | 0.70× | 1.35 | 2.25× |
| Aggressive | 0.55× | 1.90 | 3.00× |

Advanced controls may override these values. Fractional-share mode is the
default; whole-share mode can leave unallocated cash when the day's dollar
amount is below one share.

## Data architecture

The public page remains a zero-build GitHub Pages site.

```text
Nasdaq delayed/end-of-day history
              ↓
tools/finance/generate_dca_market_data.py
              ↓
data/dca_market_history.json
              ↓
js/dca-engine.js (pure calculations)
              ↓
js/dca-journal.js (fills, chips, catch-up, merge)
              ↓
js/dca-calculator.js (UI, local storage, optional Google sync)
```

A scheduled GitHub Action refreshes the committed market snapshot after the
U.S. close on weekdays and commits only when a new closing bar is available.
The page reports the quote timestamp, exact latest session, generation time,
and staleness. It
continues to work with its last valid snapshot when upstream data is delayed.

## Shipped interface

1. Monthly budget, TSLA/SPCX allocation, month-to-date investment, plan date,
   preset, fractional-share option, and manual price overrides.
2. Total next-session amount plus dollars and estimated shares per asset.
3. Remaining budget, trading sessions, baseline, applied multiplier, and an
   explanation of the strongest signal contributors.
4. Interactive 1M/3M/all price charts with hover, touch, and keyboard session
   inspection, followed by daily/five-day returns, 20-day trend and drawdown,
   RSI, volatility, history depth, and confidence.
5. Equal-budget replay of the last completed calendar month comparing flat DCA
   with the adaptive schedule. This is descriptive and never presented as a
   return forecast.
6. Purchase journal: one-tap $20/$30 chips (customizable), manual actual-dollar
   fills, a phone-first missed-session catch-up list, record-suggestion, undo,
   CSV import/export, reset, and optional Google journal sync.
7. Explicit data-freshness, privacy, ticker-identity, concentration-risk, and
   no-brokerage-execution notices.

## Guardrails and failure modes

- Reject negative, non-finite, or implausibly large inputs.
- Require allocations to total 100%; editing TSLA automatically updates SPCX.
- Never recommend more than the asset or total remaining budget.
- Flag month-to-date contributions above the configured target.
- Flag stale data and distinguish end-of-day data from a manual live price.
- Fall back to neutral `1.0×` when history is insufficient for a signal.
- Do not fetch or expose the owner's private transaction ledger.
- Do not call a brokerage, place orders, send notifications, or imply a
  guaranteed advantage over ordinary DCA.

## Verification

### Pure engine invariants

- recommendations are non-negative and budget bounded;
- the final session spends the remainder;
- a representative downtrend produces a larger multiplier than an uptrend;
- the good-day floor remains active;
- short-history signals cannot exceed `1.75×`;
- U.S. weekends and exchange holidays are excluded;
- flat and adaptive historical replays deploy the same total dollars.

### Data contracts

- supported symbols are exactly `TSLA` and `SPCX`;
- histories are ascending, unique, positive, and internally consistent;
- the latest metadata matches the last history row;
- SPCX identity and IPO date are explicit;
- unchanged upstream histories do not create no-op commits.

### Browser coverage

- page loads the snapshot and calculates without console errors;
- preset, allocation, date, and manual-price changes recalculate immediately;
- a recorded recommendation survives reload and updates month-to-date totals;
- CSV export and undo controls work;
- core controls and results remain usable at phone and desktop widths.

## Later expansion boundaries

Useful future additions include authenticated cross-device sync, broker CSV
imports, notifications, tax-lot awareness, foreign-exchange budgeting, and
additional assets. Brokerage execution, individualized tax advice, leverage,
options, and forecasts remain outside the default product unless explicitly
designed and reviewed.
