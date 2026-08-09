#!/usr/bin/env python3
"""Static sanity checks for the zero-build portfolio.

Run from the repo root:

    python3 tools/check_site.py
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class LocalReferenceIssue:
    entry: Path
    reference: str
    reason: str


class ReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.references: list[str] = []

    def _collect(self, attributes: list[tuple[str, str | None]]) -> None:
        for name, value in attributes:
            if name.lower() in {"href", "src"} and value:
                self.references.append(value.strip())

    def handle_starttag(
        self, tag: str, attributes: list[tuple[str, str | None]]
    ) -> None:
        self._collect(attributes)

    def handle_startendtag(
        self, tag: str, attributes: list[tuple[str, str | None]]
    ) -> None:
        self._collect(attributes)


def _has_exact_case(root: Path, target: Path) -> bool:
    current = root
    try:
        parts = target.relative_to(root).parts
    except ValueError:
        return False
    for part in parts:
        if not current.is_dir() or part not in {child.name for child in current.iterdir()}:
            return False
        current = current / part
    return True


def find_local_reference_issues(
    root: Path, html_entries: list[Path] | None = None
) -> list[LocalReferenceIssue]:
    root = root.resolve()
    entries = html_entries or sorted(
        path for path in root.rglob("*.html") if ".git" not in path.relative_to(root).parts
    )
    issues: list[LocalReferenceIssue] = []

    for entry in entries:
        entry = entry.resolve()
        parser = ReferenceParser()
        parser.feed(entry.read_text(encoding="utf-8"))
        for reference in parser.references:
            parsed = urlsplit(reference)
            if parsed.scheme or parsed.netloc:
                continue
            reference_path = unquote(parsed.path)
            if not reference_path:
                continue
            if reference_path.startswith("/"):
                candidate = root / reference_path.lstrip("/")
            else:
                candidate = entry.parent / reference_path
            candidate = candidate.resolve()
            try:
                candidate.relative_to(root)
            except ValueError:
                issues.append(
                    LocalReferenceIssue(entry, reference, "target escapes site root")
                )
                continue
            if candidate.is_dir() or reference_path.endswith("/"):
                candidate = candidate / "index.html"
            if not candidate.is_file() or not _has_exact_case(root, candidate):
                issues.append(LocalReferenceIssue(entry, reference, "missing target"))

    return issues


def fail(msg: str) -> None:
    print(f"FAIL  {msg}")
    raise SystemExit(1)


def ok(msg: str) -> None:
    print(f"OK    {msg}")


def main() -> None:
    required = [
        ROOT / "index.html",
        ROOT / ".github" / "workflows" / "ci.yml",
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
        ROOT / "seeking-biblical-truth" / "index.html",
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

    workflow = (ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
    workflow_contracts = {
        "stable workflow name": re.search(r"(?m)^name:\s*ci\s*$", workflow),
        "main push trigger": re.search(r"push:\s*\n\s+branches:\s*\[main\]", workflow),
        "pull request trigger": re.search(r"(?m)^\s{2}pull_request:\s*$", workflow),
        "read-only contents permission": re.search(
            r"permissions:\s*\n\s+contents:\s*read", workflow
        ),
        "stale run cancellation": re.search(
            r"concurrency:[\s\S]*cancel-in-progress:\s*true", workflow
        ),
        "bounded job timeout": "timeout-minutes: 10" in workflow,
        "supported checkout action": "actions/checkout@v7" in workflow,
        "supported Python action": "actions/setup-python@v6" in workflow,
        "Python 3.12 baseline": re.search(r"python-version:\s*[\"']?3\.12", workflow),
        "supported Node action": "actions/setup-node@v7" in workflow,
        "Node 24 baseline": re.search(r"node-version:\s*[\"']?24", workflow),
        "checker unit tests": "python3 -m unittest tools/test_check_site.py" in workflow,
        "complete site check": "python3 tools/check_site.py" in workflow,
        "Python compilation": "python3 -m compileall -q tools" in workflow,
        "JavaScript syntax check": "node --check" in workflow,
    }
    missing_workflow_contracts = [
        label for label, present in workflow_contracts.items() if not present
    ]
    if missing_workflow_contracts:
        fail("CI workflow policy missing: " + ", ".join(missing_workflow_contracts))
    ok(f"GitHub Actions policy: {len(workflow_contracts)} contracts")

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

    canonical_truth = "https://alphaeusng.github.io/pages/seeking-biblical-truth/"
    legacy_truth = (ROOT / "seeking-biblical-truth" / "index.html").read_text(
        encoding="utf-8"
    )
    if (
        'http-equiv="refresh" content="0; url=../pages/seeking-biblical-truth/"'
        not in legacy_truth
        or f'rel="canonical" href="{canonical_truth}"' not in legacy_truth
        or 'href="../pages/seeking-biblical-truth/"' not in legacy_truth
    ):
        fail("legacy Biblical Truth route is not a canonical compatibility redirect")
    ok("legacy Biblical Truth route redirects to the canonical viewer")

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

    reference_issues = find_local_reference_issues(ROOT)
    if reference_issues:
        details = "; ".join(
            f"{issue.entry.relative_to(ROOT)} -> {issue.reference!r} ({issue.reason})"
            for issue in reference_issues
        )
        fail("invalid local HTML references: " + details)
    ok("all local HTML href/src targets resolve case-sensitively")

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
