# Tools

Maintenance scripts and light tooling live here, grouped by domain.

- `finance/`: financial data extraction helpers for `pages/conviction.html`,
  including the reproducible public payload generator. Run
  `python3 tools/finance/generate_conviction_history.py --check` to verify that
  its committed output matches tracked inputs without changing `generatedAt`.

Do not put page HTML, generated site assets, or Obsidian vault content in this folder.
