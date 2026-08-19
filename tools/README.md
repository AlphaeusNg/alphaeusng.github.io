# Tools

Maintenance scripts and light tooling live here, grouped by domain.

- `finance/`: financial data extraction helpers for `pages/conviction.html`,
  including the reproducible public payload generator. Run
  `python3 tools/finance/generate_conviction_history.py --check` to verify that
  its committed output matches tracked inputs without changing `generatedAt`.
  The Conviction DCA Lab snapshot is generated from Nasdaq daily market data
  with `python3 tools/finance/generate_dca_market_data.py`. A weekday workflow
  refreshes `data/dca_market_history.json` after the U.S. close and publishes a
  small `data/dca_live_quotes.json` file to the CORS-open `dca-live` branch
  during the U.S. session. Use `--quotes-only` to test that live payload.

Do not put page HTML, generated site assets, or Obsidian vault content in this folder.
