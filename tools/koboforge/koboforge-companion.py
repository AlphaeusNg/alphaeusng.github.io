#!/usr/bin/env python3
"""
KoboForge Companion — High-fidelity PDF & DOCX → Kobo EPUB converter

The web version of KoboForge (pages/kobo-forge.html) is ideal for DOCX,
Markdown, and interactive spot-check/edit before export.

This companion uses pdfplumber (table extraction via find_tables) + ebooklib
when you need offline batch conversion or denser PDF tables.

Usage:
    pip install pdfplumber python-docx ebooklib pillow typer
    python koboforge-companion.py my-report.pdf --preset libra --output my-report.epub
"""

from __future__ import annotations

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


# Per-device CSS tweaks (font size / margins). Tables and structure stay shared.
PRESET_CSS = {
    "generic": {"font_size": "0.98em", "margin": "0.7em 0.95em", "table_font": "0.84em"},
    "clara": {"font_size": "1.0em", "margin": "0.55em 0.75em", "table_font": "0.82em"},
    "libra": {"font_size": "0.98em", "margin": "0.75em 1.05em", "table_font": "0.86em"},
    "sage": {"font_size": "1.0em", "margin": "0.8em 1.1em", "table_font": "0.88em"},
}


def kobo_css(preset: str = "generic") -> str:
    p = PRESET_CSS.get(preset.lower(), PRESET_CSS["generic"])
    return f"""
/* KoboForge Companion — e-ink optimized ({preset}) */
body {{
    font-family: Georgia, "Times New Roman", serif;
    font-size: {p["font_size"]};
    line-height: 1.58;
    margin: {p["margin"]};
    color: #111111;
    background: #ffffff;
}}

h1, h2, h3, h4 {{
    font-family: Georgia, serif;
    font-weight: 600;
    line-height: 1.22;
    margin-top: 1.25em;
    margin-bottom: 0.4em;
    color: #111111;
    page-break-after: avoid;
}}

h1 {{ font-size: 1.42em; }}
h2 {{ font-size: 1.18em; }}
h3 {{ font-size: 1.06em; }}

p {{
    margin: 0.55em 0;
    text-align: justify;
    hyphens: auto;
}}

table {{
    width: 100%;
    border-collapse: collapse;
    margin: 1.05em 0;
    font-size: {p["table_font"]};
    page-break-inside: avoid;
}}

th, td {{
    border: 1px solid #777777;
    padding: 0.32em 0.48em;
    vertical-align: top;
    text-align: left;
}}

th {{
    background-color: #f0f0f0;
    font-weight: 600;
}}

ul, ol {{
    margin: 0.45em 0 0.45em 1.25em;
}}

hr {{
    border: none;
    border-top: 1px solid #cccccc;
    margin: 1.3em 0;
}}

img {{
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0.6em auto;
}}
"""


def sanitize_text(text: str) -> str:
    """Basic XML-safe text."""
    return (
        (text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _heading_level(style_name: str) -> Optional[int]:
    """Return 1–3 for Heading styles, else None."""
    if not style_name:
        return None
    m = re.match(r"Heading\s*(\d+)", style_name, re.I)
    if m:
        return max(1, min(3, int(m.group(1))))
    if style_name.lower() in ("title", "heading"):
        return 1
    return None


def docx_to_chapters(docx_path: Path) -> List[Tuple[str, str]]:
    """Convert .docx to list of (title, html_content) chapters.
    Preserves tables well because python-docx exposes them cleanly.
    Only Heading 1 starts a new chapter; H2/H3 stay inline.
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

            level = _heading_level(style)
            if level == 1:
                flush_chapter()
                current_title = text or "Untitled Chapter"
                current_html.append(f"<h1>{sanitize_text(text)}</h1>")
            elif level == 2:
                current_html.append(f"<h2>{sanitize_text(text)}</h2>")
            elif level == 3:
                current_html.append(f"<h3>{sanitize_text(text)}</h3>")
            else:
                current_html.append(f"<p>{sanitize_text(text)}</p>")

        elif element.tag.endswith("tbl"):
            table = DocxTable(element, doc)
            html = ["<table>"]
            for row_idx, row in enumerate(table.rows):
                tag = "th" if row_idx == 0 else "td"
                cells = []
                for cell in row.cells:
                    cell_text = sanitize_text(cell.text.strip().replace("\n", "<br/>"))
                    # Note: sanitize after replace would escape br — rebuild carefully
                    raw = cell.text.strip().replace("\n", "\n")
                    cell_text = "<br/>".join(sanitize_text(part) for part in raw.split("\n"))
                    cells.append(f"<{tag}>{cell_text}</{tag}>")
                html.append(f"<tr>{''.join(cells)}</tr>")
            html.append("</table>")
            current_html.extend(html)

    flush_chapter()

    if not chapters:
        chapters.append(("Document", "<p>(Empty document)</p>"))

    return chapters


def _word_in_bbox(word: dict, bbox: Tuple[float, float, float, float], pad: float = 1.0) -> bool:
    x0, top, x1, bottom = bbox
    wx0, wtop, wx1, wbottom = word["x0"], word["top"], word["x1"], word["bottom"]
    cx = (wx0 + wx1) / 2
    cy = (wtop + wbottom) / 2
    return (x0 - pad) <= cx <= (x1 + pad) and (top - pad) <= cy <= (bottom + pad)


def _rows_to_html(table_rows: List[List[Optional[str]]]) -> str:
    if not table_rows:
        return ""
    # Drop fully empty rows
    cleaned = []
    for row in table_rows:
        cells = [(c or "").strip() for c in row]
        if any(cells):
            cleaned.append(cells)
    if len(cleaned) < 1:
        return ""

    parts = ['<table class="pdf-table">']
    for r_idx, row in enumerate(cleaned):
        tag = "th" if r_idx == 0 else "td"
        cells_html = []
        for cell in row:
            txt = sanitize_text((cell or "").replace("\n", " ").strip())
            cells_html.append(f"<{tag}>{txt or '&#160;'}</{tag}>")
        parts.append(f"<tr>{''.join(cells_html)}</tr>")
    parts.append("</table>")
    return "".join(parts)


def pdf_to_chapters(pdf_path: Path, preset: str) -> List[Tuple[str, str]]:
    """High-quality PDF conversion using pdfplumber.find_tables().

    extract_tables() only returns cell strings — no bboxes. We use find_tables()
    so table regions can be excluded from prose and emitted as real <table> HTML.
    """
    if pdfplumber is None:
        raise RuntimeError("pdfplumber not installed. Run: pip install pdfplumber")

    # preset reserved for future page-size hints; CSS applied in build_epub
    _ = preset

    chapters: List[Tuple[str, str]] = []
    current_title = "Document"
    current_html: List[str] = []

    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            page_html: List[str] = []
            words = page.extract_words() or []

            table_regions: List[Tuple[Tuple[float, float, float, float], List[List[Optional[str]]]]] = []
            try:
                found = page.find_tables() or []
            except Exception:
                found = []

            for ft in found:
                try:
                    bbox = tuple(ft.bbox)  # type: ignore[attr-defined]
                    data = ft.extract()
                    if data:
                        table_regions.append((bbox, data))  # type: ignore[arg-type]
                except Exception:
                    continue

            # Fallback: extract_tables without geometry (append after prose)
            orphan_tables: List[List[List[Optional[str]]]] = []
            if not table_regions:
                try:
                    raw_tables = page.extract_tables() or []
                    for t in raw_tables:
                        if t:
                            orphan_tables.append(t)
                except Exception:
                    pass

            non_table_words = []
            for w in words:
                inside = any(_word_in_bbox(w, bbox) for bbox, _ in table_regions)
                if not inside:
                    non_table_words.append(w)

            # Group words into lines by rounded top
            lines: dict = {}
            for w in non_table_words:
                ykey = round(w["top"] / 8) * 8
                lines.setdefault(ykey, []).append(w)

            # Interleave prose lines and tables by vertical position (reading order)
            events: List[Tuple[float, int, str]] = []
            for y in sorted(lines):
                line = " ".join(w["text"] for w in sorted(lines[y], key=lambda x: x["x0"]))
                if line.strip():
                    events.append((float(y), 0, f"<p>{sanitize_text(line.strip())}</p>"))

            for bbox, data in table_regions:
                th = _rows_to_html(data)
                if th:
                    # bbox = (x0, top, x1, bottom); sort key = top
                    events.append((float(bbox[1]), 1, th))

            events.sort(key=lambda e: (e[0], e[1]))
            for _, _, fragment in events:
                page_html.append(fragment)

            # Orphan tables (no geometry) go at end of page
            for t in orphan_tables:
                th = _rows_to_html(t)
                if th:
                    page_html.append(th)

            if page_html:
                current_html.append(
                    f'<div class="page" data-page="{page_num}">{"".join(page_html)}</div>'
                )

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

    css = epub.EpubItem(
        uid="style",
        file_name="style.css",
        media_type="text/css",
        content=kobo_css(preset).encode("utf-8"),
    )
    book.add_item(css)

    epub_chapters = []
    for idx, (ch_title, ch_html) in enumerate(chapters, 1):
        filename = f"chapter-{idx:02d}.xhtml"
        # Avoid double H1 if chapter already starts with h1
        body_inner = ch_html
        if not re.search(r"<h1[\s>]", ch_html, re.I):
            body_inner = f"<h1>{sanitize_text(ch_title)}</h1>\n{ch_html}"

        c = epub.EpubHtml(
            title=ch_title,
            file_name=filename,
            lang="en",
        )
        c.content = f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <title>{sanitize_text(ch_title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  {body_inner}
</body>
</html>"""
        c.add_item(css)
        book.add_item(c)
        epub_chapters.append(c)

    book.toc = tuple(epub_chapters)
    book.spine = ["nav"] + epub_chapters
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

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

    preset_key = preset.lower()
    if preset_key not in PRESET_CSS:
        typer.secho(
            f"Unknown preset {preset!r}; using generic. Choose: {', '.join(PRESET_CSS)}",
            fg=typer.colors.YELLOW,
        )
        preset_key = "generic"

    book_title = title or input_file.stem.replace("_", " ").replace("-", " ").title()
    out_path = output or input_file.with_suffix(".epub")

    typer.echo(f"→ Processing {input_file.name} ({suffix[1:].upper()}) [preset={preset_key}]...")

    if suffix == ".docx":
        chapters = docx_to_chapters(input_file)
    else:
        chapters = pdf_to_chapters(input_file, preset_key)

    typer.echo(f"   Found {len(chapters)} chapter(s)")

    build_epub(chapters, book_title, author, out_path, preset_key)
    typer.secho(f"✓ Wrote {out_path}", fg=typer.colors.GREEN)

    typer.echo("\nTransfer tips for Kobo:")
    typer.echo("  • USB: Copy .epub to the root or Books folder on your device")
    typer.echo("  • Prefer the web KoboForge page to spot-check/edit before sideload")
    typer.echo("  • No Calibre required for simple sideloading")


if __name__ == "__main__":
    app()
