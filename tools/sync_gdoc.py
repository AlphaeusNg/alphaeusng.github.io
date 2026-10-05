"""Turn a public Google Doc HTML export into a readable document.

The portfolio cannot depend on the browser following Google's export redirect.
Run this tool, commit the JSON, and the reader renders that copy.

    python3 tools/sync_gdoc.py \\
        --id 1qqXT6QfX_3ep1EMuEpqc021aJ3Vwd1EOTasuRBkqR1I \\
        --title "Alphaeus' thoughts" \\
        --out data/thoughts/alphaeus-thoughts.json
"""

from __future__ import annotations

import argparse
import json
import re
import ssl
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
HEADING_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6"}
SKIP_TEXT = {"footnote bookmark"}


class Node:
    def __init__(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.tag = tag
        self.attrs = {key: value or "" for key, value in attrs}
        self.children: list[Node | str] = []

    @property
    def classes(self) -> set[str]:
        return set(self.attrs.get("class", "").split())


class TreeBuilder(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("root", [])
        self.stack = [self.root]
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in {"style", "script", "head"}:
            self.skip_depth += 1
            return
        if self.skip_depth:
            return
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"style", "script", "head"} and self.skip_depth:
            self.skip_depth -= 1
            return
        if self.skip_depth:
            return
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data: str) -> None:
        if self.skip_depth or not data:
            return
        self.stack[-1].children.append(data)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)


def style_marks(style_text: str) -> tuple[set[str], set[str]]:
    bold: set[str] = set()
    italic: set[str] = set()
    for name, body in re.findall(r"\.([A-Za-z0-9_-]+)\s*\{([^}]*)\}", style_text):
        weight = re.search(r"font-weight:\s*([^;]+)", body)
        font_style = re.search(r"font-style:\s*([^;]+)", body)
        if weight and weight.group(1).strip() in {"700", "bold", "800", "900"}:
            bold.add(name)
        if font_style and font_style.group(1).strip() == "italic":
            italic.add(name)
    return bold, italic


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\xa0", " "))


def unwrap_href(href: str) -> str:
    if not href:
        return ""
    if href.startswith("#"):
        return href
    parsed = urlparse(href)
    if parsed.netloc.endswith("google.com") and parsed.path == "/url":
        target = parse_qs(parsed.query).get("q", [""])[0]
        return unquote(target) if target else href
    return href


def find_body(root: Node) -> Node:
    stack = [root]
    while stack:
        node = stack.pop()
        if node.tag == "body":
            return node
        stack.extend(child for child in node.children if isinstance(child, Node))
    return root


def plain_inlines(inlines: list[dict[str, object]]) -> str:
    return "".join(str(part.get("text", "")) for part in inlines).strip()


class DocumentConverter:
    def __init__(self, bold: set[str], italic: set[str]) -> None:
        self.bold = bold
        self.italic = italic

    def marked(self, node: Node) -> tuple[bool, bool]:
        classes = node.classes
        return bool(classes & self.bold), bool(classes & self.italic)

    def inlines_from(self, node: Node) -> list[dict[str, object]]:
        parts: list[dict[str, object]] = []

        def add(text: str, bold: bool, italic: bool, href: str, footnote: str) -> None:
            text = clean_text(text)
            if not text:
                return
            flags = {"bold": bold, "italic": italic, "href": href, "footnote": footnote}
            if parts and all(parts[-1].get(key) == value for key, value in flags.items()):
                parts[-1]["text"] = str(parts[-1]["text"]) + text
                return
            parts.append({"text": text, **flags})

        def walk(current: Node | str, bold: bool, italic: bool, href: str, footnote: str) -> None:
            if isinstance(current, str):
                add(current, bold, italic, href, footnote)
                return
            if current.tag == "br":
                add(" ", bold, italic, href, footnote)
                return
            next_bold, next_italic = self.marked(current)
            next_href = href
            next_footnote = footnote
            if current.tag == "a":
                raw = current.attrs.get("href", "")
                if raw.startswith("#ftnt") and not raw.startswith("#ftnt_ref"):
                    next_footnote = raw.removeprefix("#ftnt")
                    next_href = ""
                else:
                    next_href = unwrap_href(raw)
            for child in current.children:
                walk(child, bold or next_bold, italic or next_italic, next_href, next_footnote)
                if next_footnote:
                    next_footnote = ""

        for child in node.children:
            walk(child, False, False, "", "")
        result: list[dict[str, object]] = []
        for part in parts:
            if part.get("footnote"):
                result.append({"footnote": str(part["footnote"])})
                continue
            text = str(part.get("text", ""))
            if not text.strip():
                continue
            item: dict[str, object] = {"text": text}
            if part.get("bold"):
                item["bold"] = True
            if part.get("italic"):
                item["italic"] = True
            if part.get("href"):
                item["href"] = part["href"]
            result.append(item)
        return result

    def list_meta(self, node: Node) -> tuple[str, int]:
        match = re.search(r"lst-kix_([A-Za-z0-9]+)-(\d+)", node.attrs.get("class", ""))
        if not match:
            return "", 0
        return match.group(1), int(match.group(2))

    def footnote_id(self, node: Node) -> str:
        if node.tag == "a" and node.attrs.get("id", "").startswith("ftnt") and not node.attrs.get("id", "").startswith("ftnt_ref"):
            return node.attrs["id"].removeprefix("ftnt")
        for child in node.children:
            if isinstance(child, Node):
                found = self.footnote_id(child)
                if found:
                    return found
        return ""

    def convert(self, body: Node) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
        blocks: list[dict[str, object]] = []
        footnotes: list[dict[str, object]] = []
        pending: list[dict[str, object]] = []

        def flush() -> None:
            if pending:
                blocks.extend(nest_list(pending))
                pending.clear()

        for child in body.children:
            if not isinstance(child, Node):
                continue
            footnote = self.footnote_id(child)
            if footnote and child.tag in {"div", "p"}:
                flush()
                footnotes.append({"id": footnote, "inlines": self.without_marker(child)})
                continue
            if child.tag in {"ol", "ul"}:
                list_id, depth = self.list_meta(child)
                if not list_id:
                    list_id = f"loose-{id(child)}"
                for item in child.children:
                    if isinstance(item, Node) and item.tag == "li":
                        pending.append({
                            "list_id": list_id,
                            "depth": depth,
                            "ordered": child.tag == "ol",
                            "inlines": self.inlines_from(item),
                        })
                continue
            flush()
            if child.tag in HEADING_TAGS:
                inlines = self.inlines_from(child)
                if not plain_inlines(inlines):
                    continue
                blocks.append({
                    "type": "heading",
                    "level": int(child.tag[1]),
                    "id": child.attrs.get("id") or slug(plain_inlines(inlines)),
                    "inlines": inlines,
                })
            elif child.tag == "p":
                inlines = self.inlines_from(child)
                text = plain_inlines(inlines).casefold()
                if not text or text in SKIP_TEXT:
                    continue
                blocks.append({"type": "paragraph", "inlines": inlines})
            elif child.tag == "hr":
                blocks.append({"type": "rule"})
            elif child.tag == "div":
                nested_blocks, nested_notes = self.convert(child)
                blocks.extend(nested_blocks)
                footnotes.extend(nested_notes)
        flush()
        return [block for block in blocks if block.get("type") != "rule" or True], footnotes

    def without_marker(self, node: Node) -> list[dict[str, object]]:
        inlines = self.inlines_from(node)
        while inlines and (inlines[0].get("footnote") or str(inlines[0].get("text", "")).strip() in {"[1]", "[2]", "[3]", "[4]", "[5]", "[6]", "[7]", "[8]", "[9]"}):
            inlines.pop(0)
        if inlines:
            inlines[0]["text"] = str(inlines[0]["text"]).lstrip()
        return inlines


def slug(value: str) -> str:
    lowered = re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")
    return lowered[:80] or "section"


def nest_list(items: list[dict[str, object]]) -> list[dict[str, object]]:
    grouped: dict[str, list[dict[str, object]]] = {}
    order: list[str] = []
    for item in items:
        list_id = str(item["list_id"])
        if list_id not in grouped:
            grouped[list_id] = []
            order.append(list_id)
        grouped[list_id].append(item)
    blocks: list[dict[str, object]] = []
    for list_id in order:
        blocks.extend(lists_from(grouped[list_id]))
    return blocks


def lists_from(items: list[dict[str, object]]) -> list[dict[str, object]]:
    root: list[dict[str, object]] = []
    stack: list[tuple[int, list[dict[str, object]]]] = [(-1, root)]
    for item in items:
        node = {
            "inlines": item["inlines"],
            "children": [],
            "ordered": item["ordered"],
            "depth": item["depth"],
        }
        while stack[-1][0] >= int(item["depth"]):
            stack.pop()
        stack[-1][1].append(node)
        stack.append((int(item["depth"]), node["children"]))
    return pack_items(root)


def pack_items(items: list[dict[str, object]]) -> list[dict[str, object]]:
    packed: list[dict[str, object]] = []
    current: dict[str, object] | None = None
    for item in items:
        ordered = bool(item["ordered"])
        if current is None or current["ordered"] is not ordered:
            current = {"type": "list", "ordered": ordered, "items": []}
            packed.append(current)
        current["items"].append({
            "inlines": item["inlines"],
            "lists": pack_items(item["children"]),
        })
    return packed


def parse_html(html: str) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    style = "\n".join(re.findall(r"<style[^>]*>([\s\S]*?)</style>", html, flags=re.I))
    bold, italic = style_marks(style)
    builder = TreeBuilder()
    builder.feed(html)
    builder.close()
    return DocumentConverter(bold, italic).convert(find_body(builder.root))


def fetch_html(document_id: str) -> str:
    url = f"https://docs.google.com/document/d/{document_id}/export?format=html"
    request = urllib.request.Request(url, headers={"User-Agent": "alphaeusng-gdoc-sync"})
    context = ssl.create_default_context()
    with urllib.request.urlopen(request, context=context, timeout=60) as response:
        return response.read().decode("utf-8", errors="replace")


def build_document(html: str, *, title: str, source_url: str) -> dict[str, object]:
    blocks, footnotes = parse_html(html)
    return {
        "title": title,
        "sourceUrl": source_url,
        "exportedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "blocks": blocks,
        "footnotes": footnotes,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync a public Google Doc into reader JSON.")
    parser.add_argument("--id", required=True, help="Google Doc id")
    parser.add_argument("--title", required=True)
    parser.add_argument("--html", type=Path, help="Use an already downloaded HTML export")
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    html = args.html.read_text(encoding="utf-8") if args.html else fetch_html(args.id)
    source = f"https://docs.google.com/document/d/{args.id}/edit"
    document = build_document(html, title=args.title, source_url=source)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(document, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    headings = [plain_inlines(block["inlines"]) for block in document["blocks"] if block["type"] == "heading" and block["level"] == 1]
    print(f"wrote {args.out} ({len(document['blocks'])} blocks, {len(document['footnotes'])} notes, {len(headings)} parts)")


if __name__ == "__main__":
    main()
