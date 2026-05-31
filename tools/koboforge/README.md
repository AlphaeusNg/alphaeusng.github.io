# KoboForge Companion Tools

High-fidelity helpers that complement the KoboForge page at https://alphaeusng.github.io/kobo-forge.html

## Python Companion

`koboforge-companion.py` — the best option when table fidelity is critical (dense reports, financial tables, scientific PDFs).

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

### Why this is better for tables

- `pdfplumber` extracts tables with cell-level accuracy and bounding boxes
- Tables are emitted as real `<table>` elements (not text blobs)
- Clean reflowable XHTML + Kobo-tuned CSS
- No middleman conversion layers that destroy structure

The web converter (JS) is excellent for most DOCX files and simple PDFs. Use this when the web version warns you or when you see broken tables after transfer.

## License

Same as the main site (MIT-like). Use freely, improve, share.

Built because I got tired of broken tables on my Kobo.
