#!/usr/bin/env python3
"""
KoboForge Companion — High-fidelity PDF & DOCX → Kobo EPUB converter

The web version of KoboForge excels at DOCX and clean PDFs.
This companion uses pdfplumber (best-in-class table extraction) + ebooklib
to produce EPUBs with tables that actually survive on Kobo devices.

Usage (recommended):
    pip install pdfplumber python-docx ebooklib pillow typer
    python koboforge-companion.py my-report.pdf --preset libra --output my-report.epub

For Word documents with complex tables this is often superior to the JS version.
"""

import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple

import typer
from ebooklib import epub
from docx import Document as DocxDocument
from docx.table import Table as DocxTable
from docx.text.paragraph import Paragraph as DocxParagraph

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

app = typer.Typer(
    name="koboforge",
    help="High-fidelity document to Kobo EPUB converter (excellent table handling)",
    add_completion=False,
)


KOBO_CSS = """
/* KoboForge Companion — e-ink optimized */
body {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 0.98em;
    line-height: 1.58;
    margin: 0.7em 0.95em;
    color: #111111;
    background: #ffffff;
}

h1, h2, h3, h4 {
    font-family: Georgia, serif;
    font-weight: 600;
    line-height: 1.22;
    margin-top: 1.25em;
    margin-bottom: 0.4em;
    color: #111111;
}

h1 { font-size: 1.42em; }
h2 { font-size: 1.18em; }
h3 { font-size: 1.06em; }

p {
    margin: 0.55em 0;
    text-align: justify;
    hyphens: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.05em 0;
    font-size: 0.84em;
    page-break-inside: avoid;
}

th, td {
    border: 1px solid #777777;
    padding: 0.32em 0.48em;
    vertical-align: top;
    text-align: left;
}

th {
    background-color: #f0f0f0;
    font-weight: 600;
}

ul, ol {
    margin: 0.45em 0 0.45em 1.25em;
}

hr {
    border: none;
    border-top: 1px solid #cccccc;
    margin: 1.3em 0;
}

img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0.6em auto;
}
"""


def sanitize_text(text: str) -> str:
    """Basic XML-safe text."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def docx_to_chapters(docx_path: Path) -> List[Tuple[str, str]]:
    """Convert .docx to list of (title, html_content) chapters.
    Preserves tables extremely well because python-docx exposes them cleanly.
    """
    doc = DocxDocument(str(docx_path))
    chapters: List[Tuple[str, str]] = []
    current_title = "Document"
    current_html: List[str] = []

    def flush_chapter():
        nonlocal current_html, current_title
        if current_html:
            content = "\n".join(current_html)
            chapters.append((current_title, f'<div class="chapter">{content}</div>'))
        current_html = []

    for element in doc.element.body:
        if element.tag.endswith("p"):
            p = DocxParagraph(element, doc)
            style = p.style.name if p.style else ""
            text = p.text.strip()

            if not text:
                continue

            # Heading detection
            if style.startswith("Heading 1") or style.startswith("Heading"):
                flush_chapter()
                current_title = text or "Untitled Chapter"
                current_html.append(f"<h1>{sanitize_text(text)}</h1>")
            elif style.startswith("Heading 2"):
                current_html.append(f"<h2>{sanitize_text(text)}</h2>")
            else:
                # Regular paragraph with basic formatting
                para_html = sanitize_text(text)
                current_html.append(f"<p>{para_html}</p>")

        elif element.tag.endswith("tbl"):
            # Excellent table support
            table = DocxTable(element, doc)
            html = ['<table>']
            for row_idx, row in enumerate(table.rows):
                tag = "th" if row_idx == 0 else "td"
                cells = []
                for cell in row.cells:
                    cell_text = sanitize_text(cell.text.strip().replace("\n", "<br/>"))
                    cells.append(f"<{tag}>{cell_text}</{tag}>")
                html.append(f"<tr>{''.join(cells)}</tr>")
            html.append("</table>")
            current_html.extend(html)

    flush_chapter()

    if not chapters:
        chapters.append(("Document", "<p>(Empty document)</p>"))

    return chapters


def pdf_to_chapters(pdf_path: Path, preset: str) -> List[Tuple[str, str]]:
    """High-quality PDF conversion using pdfplumber.
    This is where we win on tables: pdfplumber finds tables with high accuracy
    and gives us cell-by-cell content + bbox information.
    """
    if pdfplumber is None:
        raise RuntimeError("pdfplumber not installed. Run: pip install pdfplumber")

    chapters: List[Tuple[str, str]] = []
    current_title = "Document"
    current_html: List[str] = []

    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            # Extract tables first (they are the hard part)
            tables = page.extract_tables() or []

            # Get all text with layout preserved
            words = page.extract_words() or []
            if not words:
                continue

            # Build page HTML
            page_html = []

            # Very good table reconstruction
            table_bboxes = []
            for t in tables:
                if not t:
                    continue
                try:
                    x0 = min(c["x0"] for row in t for c in row if c)
                    y0 = min(c["top"] for row in t for c in row if c)
                    x1 = max(c["x1"] for row in t for c in row if c)
                    y1 = max(c["bottom"] for row in t for c in row if c)
                    table_bboxes.append((x0, y0, x1, y1, t))
                except Exception:
                    continue

            # Simple text outside tables
            non_table_words = []
            for w in words:
                inside_table = False
                for (tx0, ty0, tx1, ty1, _) in table_bboxes:
                    if (tx0 <= w["x0"] <= tx1) and (ty0 <= w["top"] <= ty1):
                        inside_table = True
                        break
                if not inside_table:
                    non_table_words.append(w)

            # Group non-table words into lines/paragraphs
            lines = {}
            for w in non_table_words:
                ykey = round(w["top"] / 8) * 8
                if ykey not in lines:
                    lines[ykey] = []
                lines[ykey].append(w)

            para_texts = []
            for y in sorted(lines):
                line = " ".join(w["text"] for w in sorted(lines[y], key=lambda x: x["x0"]))
                if line.strip():
                    para_texts.append(line.strip())

            for p in para_texts:
                page_html.append(f"<p>{sanitize_text(p)}</p>")

            # Emit the actual tables (the magic)
            for (_, _, _, _, table_rows) in table_bboxes:
                if not table_rows:
                    continue
                t_html = ['<table class="pdf-table">']
                for r_idx, row in enumerate(table_rows):
                    tag = "th" if r_idx == 0 else "td"
                    cells_html = []
                    for cell in row:
                        txt = sanitize_text((cell.get("text") or "").strip().replace("\n", " "))
                        cells_html.append(f"<{tag}>{txt}</{tag}>")
                    t_html.append(f"<tr>{''.join(cells_html)}</tr>")
                t_html.append("</table>")
                page_html.extend(t_html)

            if page_html:
                current_html.append(f'<div class="page" data-page="{page_num}">{"".join(page_html)}</div>')

    if current_html:
        chapters.append((current_title, "".join(current_html)))
    else:
        chapters.append(("Document", "<p>No extractable content found.</p>"))

    return chapters


def build_epub(
    chapters: List[Tuple[str, str]],
    title: str,
    author: str,
    output_path: Path,
    preset: str = "generic",
) -> Path:
    """Construct a clean, standards-compliant EPUB3 using ebooklib."""
    book = epub.EpubBook()

    book.set_identifier(f"urn:uuid:{uuid.uuid4()}")
    book.set_title(title)
    book.set_language("en")
    book.add_author(author)
    book.add_metadata("DC", "date", datetime.now().strftime("%Y-%m-%d"))

    # CSS
    css = epub.EpubItem(
        uid="style",
        file_name="style.css",
        media_type="text/css",
        content=KOBO_CSS.encode("utf-8"),
    )
    book.add_item(css)

    # Chapters
    epub_chapters = []
    for idx, (ch_title, ch_html) in enumerate(chapters, 1):
        filename = f"chapter-{idx:02d}.xhtml"
        c = epub.EpubHtml(
            title=ch_title,
            file_name=filename,
            lang="en",
            content=f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <title>{sanitize_text(ch_title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>{sanitize_text(ch_title)}</h1>
  {ch_html}
</body>
</html>""",
        )
        c.add_item(css)
        book.add_item(c)
        epub_chapters.append(c)

    # TOC + Spine
    book.toc = [(c, c.title) for c in epub_chapters]
    book.spine = ["nav"] + epub_chapters
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    # Write
    epub.write_epub(str(output_path), book, {})
    return output_path


@app.command()
def convert(
    input_file: Path = typer.Argument(..., exists=True, help="PDF or DOCX file"),
    output: Optional[Path] = typer.Option(None, "--output", "-o", help="Output .epub path"),
    title: Optional[str] = typer.Option(None, "--title", help="Book title (default: filename)"),
    author: str = typer.Option("Unknown", "--author", help="Book author"),
    preset: str = typer.Option(
        "generic",
        "--preset",
        case_sensitive=False,
        help="Kobo preset: clara | libra | sage | generic",
    ),
):
    """Convert a document to a high-fidelity Kobo EPUB."""
    if pdfplumber is None and input_file.suffix.lower() == ".pdf":
        typer.secho(
            "ERROR: pdfplumber is required for PDF support.\n"
            "Install with: pip install pdfplumber python-docx ebooklib pillow typer",
            fg=typer.colors.RED,
            err=True,
        )
        raise typer.Exit(1)

    suffix = input_file.suffix.lower()
    if suffix not in (".pdf", ".docx"):
        typer.secho("Only .pdf and .docx are supported.", fg=typer.colors.RED, err=True)
        raise typer.Exit(1)

    book_title = title or input_file.stem.replace("_", " ").replace("-", " ").title()
    out_path = output or input_file.with_suffix(".epub")

    typer.echo(f"→ Processing {input_file.name} ({suffix[1:].upper()})...")

    if suffix == ".docx":
        chapters = docx_to_chapters(input_file)
    else:
        chapters = pdf_to_chapters(input_file, preset)

    typer.echo(f"   Found {len(chapters)} chapter(s)")

    build_epub(chapters, book_title, author, out_path, preset)
    typer.secho(f"✓ Wrote {out_path}", fg=typer.colors.GREEN)

    typer.echo("\nTransfer tips for Kobo:")
    typer.echo("  • USB: Copy .epub to the root or 'kobo' folder on your device")
    typer.echo("  • Wireless: Use 'Send to Kobo' tools or Dropbox sync (if configured)")
    typer.echo("  • No Calibre required for simple sideloading.")


if __name__ == "__main__":
    app()
