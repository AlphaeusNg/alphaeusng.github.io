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
        ROOT / "css" / "404.css",
        ROOT / "css" / "conviction.css",
        ROOT / "css" / "home.css",
        ROOT / "css" / "main.css",
        ROOT / "js" / "main.js",
        ROOT / "js" / "modals.js",
        ROOT / "js" / "conviction.js",
        ROOT / "pages" / "conviction.html",
        ROOT / "pages" / "kobo-forge.html",
        ROOT / "pages" / "feedback" / "index.html",
        ROOT / "pages" / "feedback" / "css" / "main.css",
        ROOT / "pages" / "feedback" / "js" / "app.js",
        ROOT / "pages" / "seeking-biblical-truth" / "index.html",
        ROOT / "pages" / "seeking-biblical-truth" / "css" / "main.css",
        ROOT / "pages" / "seeking-biblical-truth" / "js" / "app.js",
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

    main_css = (ROOT / "css" / "main.css").read_text(encoding="utf-8")
    main_js = (ROOT / "js" / "main.js").read_text(encoding="utf-8")
    if (
        'id="mobile-menu-scrim"' not in home
        or 'aria-controls="mobile-menu"' not in home
        or ".site-nav.mobile-menu-open" not in main_css
        or ".mobile-menu-scrim" not in main_css
        or "body.mobile-menu-open" not in main_css
        or "function setMobileMenuOpen" not in main_js
        or "scrim.hidden = !isOpen" not in main_js
    ):
        fail("mobile navigation must immediately dim and isolate the page behind it")
    ok("mobile navigation uses an immediate page scrim and opaque header state")

    canonical_koboforge = "https://alphaeusng.github.io/KoboForge/"
    if "pages/kobo-forge.html" in home:
        fail("portfolio home still links to the legacy KoboForge page")
    if home.count(canonical_koboforge) < 3:
        fail("portfolio KoboForge entry points do not all use the standalone site")
    legacy_koboforge = (ROOT / "pages" / "kobo-forge.html").read_text(encoding="utf-8")
    if (
        f'http-equiv="refresh" content="0; url={canonical_koboforge}"'
        not in legacy_koboforge
        or f'rel="canonical" href="{canonical_koboforge}"' not in legacy_koboforge
    ):
        fail("legacy KoboForge route is not a canonical compatibility redirect")
    for obsolete in [
        ROOT / "css" / "kobo-forge.css",
        ROOT / "js" / "kobo-forge.js",
        ROOT / "tools" / "koboforge" / "test_logic.mjs",
    ]:
        if obsolete.exists():
            fail(f"obsolete duplicate KoboForge implementation remains: {obsolete.relative_to(ROOT)}")
    ok("KoboForge routes use the standalone repository only")

    html_entries = [
        ROOT / "index.html",
        ROOT / "404.html",
        ROOT / "pages" / "conviction.html",
        ROOT / "pages" / "kobo-forge.html",
        ROOT / "pages" / "feedback" / "index.html",
        ROOT / "pages" / "seeking-biblical-truth" / "index.html",
    ]
    for entry in html_entries:
        source = entry.read_text(encoding="utf-8")
        if re.search(r"(?m)^\s*<style(?:\s[^>]*)?>", source):
            fail(f"{entry.relative_to(ROOT)} contains inline CSS")
        if re.search(
            r"(?ms)^\s*<script(?![^>]*\bsrc=)[^>]*>\s*\S[\s\S]*?</script>",
            source,
        ):
            fail(f"{entry.relative_to(ROOT)} contains inline JavaScript")
    ok("HTML entry points keep local CSS and JavaScript in grouped assets")

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
