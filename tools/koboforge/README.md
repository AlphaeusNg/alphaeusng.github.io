# KoboForge Companion Tools

High-fidelity helpers that complement the KoboForge page at
https://alphaeusng.github.io/pages/kobo-forge.html

## Web converter (primary)

The public page is the main product:

1. Drop DOCX / PDF / TXT / Markdown
2. Read **diagnostics** (empty pages, missing headings, table risks)
3. Use **Contents** + **PDF page chips** to spot-check structure
4. **Edit** (contenteditable) or **HTML** mode to fix body before export
5. Toggle **E-ink** for paper-like contrast
6. Download EPUB (NCX + nav TOC for Kobo)

Nothing is uploaded. Preferences (author, language, table/chapter toggles, e-ink) stick in `localStorage`.

## Python companion (offline / dense tables)

`koboforge-companion.py` — batch/offline path when you want pdfplumber’s
`find_tables()` pipeline or CLI automation.

### Installation

```bash
pip install pdfplumber python-docx ebooklib pillow typer
```

### Usage

```bash
# Basic
python tools/koboforge/koboforge-companion.py report.pdf --output report.epub

# With Kobo preset + metadata
python tools/koboforge/koboforge-companion.py financials.pdf \
  --preset libra \
  --title "Q3 2025 Financials" \
  --author "Acme Corp" \
  --output "q3-financials-kobo.epub"
```

Presets adjust CSS font size / margins: `clara` | `libra` | `sage` | `generic`.

### Why companion vs web

| Case | Prefer |
|------|--------|
| Interactive fix of PDF glitches | **Web** (edit + e-ink + outline) |
| DOCX with native headings | Either (web is faster) |
| Dense PDF tables / batch scripts | **Companion** (`find_tables`) |
| Scanned/image PDFs | OCR first, then either tool |

## License

Same as the main site. Use freely, improve, share.

Built because broken tables on Kobo are a personal insult.
