#!/usr/bin/env python3
"""Static sanity checks for the zero-build portfolio.

Run from the repo root:

    python3 tools/check_site.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def fail(msg: str) -> None:
    print(f"FAIL  {msg}")
    raise SystemExit(1)


def ok(msg: str) -> None:
    print(f"OK    {msg}")


def main() -> None:
    required = [
        ROOT / "index.html",
        ROOT / ".nojekyll",
        ROOT / "robots.txt",
        ROOT / "sitemap.xml",
        ROOT / "404.html",
        ROOT / "css" / "main.css",
        ROOT / "js" / "main.js",
        ROOT / "js" / "modals.js",
        ROOT / "js" / "conviction.js",
        ROOT / "pages" / "conviction.html",
        ROOT / "pages" / "kobo-forge.html",
        ROOT / "pages" / "seeking-biblical-truth" / "index.html",
        ROOT / "pages" / "seeking-biblical-truth" / "vault-data.json",
        ROOT / "assets" / "alphaeus-portrait.jpg",
        ROOT / "assets" / "xray-baggage-sample.jpg",
        ROOT / "LICENSE",
    ]
    for path in required:
        if not path.is_file():
            fail(f"missing required file: {path.relative_to(ROOT)}")
    ok(f"{len(required)} required files present")

    home = (ROOT / "index.html").read_text(encoding="utf-8")
    if "d3js.org" in home or "html2canvas" in home:
        # Comments may mention them; flag only real script tags.
        if re.search(r'<script[^>]+src=["\']https://d3js\.org', home):
            fail("index.html still loads d3 from CDN")
        if re.search(r'<script[^>]+src=["\'][^"\']*html2canvas', home):
            fail("index.html still loads html2canvas")
    ok("home page does not load d3/html2canvas")

    if 'src="js/main.js" defer' not in home or 'src="js/modals.js" defer' not in home:
        fail("home page should defer main.js and modals.js")
    ok("home page defers main.js and modals.js")

    vault = json.loads((ROOT / "pages" / "seeking-biblical-truth" / "vault-data.json").read_text(encoding="utf-8"))
    if not isinstance(vault.get("nodes"), list) or not vault["nodes"]:
        fail("vault-data.json has no nodes")
    if not isinstance(vault.get("links"), list):
        fail("vault-data.json missing links array")
    ok(f"vault-data.json: {len(vault['nodes'])} nodes, {len(vault['links'])} links")

    portrait = ROOT / "assets" / "alphaeus-portrait.jpg"
    if portrait.stat().st_size > 120_000:
        fail(f"portrait still large ({portrait.stat().st_size} bytes); re-compress")
    ok(f"portrait size {portrait.stat().st_size // 1024}KB")

    print("All checks passed.")


if __name__ == "__main__":
    main()
