from __future__ import annotations

import tempfile
import unittest
from collections.abc import Iterable
from pathlib import Path

from tools.check_site import (
    find_crawler_contract_issues,
    find_local_reference_issues,
    validate_vault_payload,
)


class LocalReferenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        (self.root / "assets").mkdir()
        (self.root / "css").mkdir()
        (self.root / "js").mkdir()
        (self.root / "pages" / "nested").mkdir(parents=True)
        (self.root / "assets" / "portrait.jpg").write_bytes(b"jpeg")
        (self.root / "css" / "main.css").write_text("body{}", encoding="utf-8")
        (self.root / "js" / "app.js").write_text("", encoding="utf-8")
        (self.root / "pages" / "nested" / "index.html").write_text(
            '<a href="../../">Home</a>',
            encoding="utf-8",
        )

    def write_index(self, body: str) -> Path:
        path = self.root / "index.html"
        path.write_text(body, encoding="utf-8")
        return path

    def test_resolves_supported_local_reference_forms(self) -> None:
        entry = self.write_index(
            """
            <link href="css/main.css?v=7#theme" rel="stylesheet">
            <img src="/assets/portrait.jpg">
            <script src="js/app.js"></script>
            <iframe src="pages/nested/"></iframe>
            <a href="#story">Story</a>
            <a href="https://example.test/more">External</a>
            <a href="//cdn.example.test/app.js">CDN</a>
            <a href="mailto:hello@example.test">Email</a>
            <a href="obsidian://open?vault=Truth">Obsidian</a>
            <img src="data:image/png;base64,AA==">
            """,
        )

        self.assertEqual(find_local_reference_issues(self.root, [entry]), [])

    def test_reports_missing_case_mismatch_and_directory_without_index(self) -> None:
        (self.root / "assets" / "CaseSensitive.png").write_bytes(b"png")
        (self.root / "empty").mkdir()
        entry = self.write_index(
            """
            <img src="assets/casesensitive.png">
            <a href="missing.html">Missing</a>
            <a href="empty/">Empty directory</a>
            """,
        )

        issues = find_local_reference_issues(self.root, [entry])
        self.assertEqual(len(issues), 3)
        self.assertEqual(
            {issue.reference for issue in issues},
            {"assets/casesensitive.png", "missing.html", "empty/"},
        )
        self.assertTrue(all(issue.reason == "missing target" for issue in issues))

    def test_rejects_references_that_escape_the_site_root(self) -> None:
        entry = self.write_index('<a href="../../outside.html">Outside</a>')

        issues = find_local_reference_issues(self.root, [entry])
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0].reason, "target escapes site root")

    def test_automatic_discovery_ignores_non_deployed_directories(self) -> None:
        self.write_index("<main>Portfolio</main>")
        for directory in ("node_modules", "playwright-report", "test-results"):
            path = self.root / directory
            path.mkdir()
            (path / "internal.html").write_text(
                '<script src="missing-internal.js"></script>',
                encoding="utf-8",
            )

        self.assertEqual(find_local_reference_issues(self.root), [])


class CrawlerContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        (self.root / "pages").mkdir()
        (self.root / "index.html").write_text(
            '<link rel="canonical" href="https://example.test/">',
            encoding="utf-8",
        )
        (self.root / "pages" / "index.html").write_text(
            '<link rel="canonical" href="https://example.test/pages/">',
            encoding="utf-8",
        )
        self.routes = {
            "https://example.test/": "index.html",
            "https://example.test/pages/": "pages/index.html",
            "https://example.test/External/": None,
        }
        self.lastmods = {
            "https://example.test/": "2026-01-02",
            "https://example.test/pages/": "2026-02-03",
        }
        self.write_sitemap(self.routes, self.lastmods)
        (self.root / "robots.txt").write_text(
            "User-agent: *\nAllow: /\n\nSitemap: https://example.test/sitemap.xml\n",
            encoding="utf-8",
        )

    def write_sitemap(
        self, urls: Iterable[str], lastmods: dict[str, str] | None = None
    ) -> None:
        lastmods = lastmods or {}
        locations = "\n".join(
            f"<url><loc>{url}</loc>"
            f"{f'<lastmod>{lastmods[url]}</lastmod>' if url in lastmods else ''}"
            "</url>"
            for url in urls
        )
        (self.root / "sitemap.xml").write_text(
            '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            f"{locations}</urlset>",
            encoding="utf-8",
        )

    def issues(self) -> list[str]:
        return find_crawler_contract_issues(
            self.root,
            self.routes,
            sitemap_url="https://example.test/sitemap.xml",
            expected_lastmods=self.lastmods,
        )

    def test_accepts_exact_canonical_crawler_contract(self) -> None:
        self.assertEqual(self.issues(), [])

    def test_reports_missing_duplicate_and_noncanonical_urls(self) -> None:
        self.write_sitemap(
            [
                "https://example.test/",
                "https://example.test/",
                "http://example.test/index.html",
                "https://example.test/External/",
            ]
        )

        issues = self.issues()
        self.assertTrue(any("duplicate sitemap URL" in issue for issue in issues))
        self.assertTrue(any("missing sitemap URL" in issue for issue in issues))
        self.assertTrue(
            any("non-canonical or unexpected sitemap URL" in issue for issue in issues)
        )

    def test_reports_wrong_robots_sitemap_and_blocked_root(self) -> None:
        (self.root / "robots.txt").write_text(
            "User-agent: *\nDisallow: /\nSitemap: https://wrong.test/map.xml\n",
            encoding="utf-8",
        )

        issues = self.issues()
        self.assertTrue(any("robots.txt sitemap directive" in issue for issue in issues))
        self.assertTrue(any("robots.txt must allow the site root" in issue for issue in issues))

    def test_reports_missing_stale_and_external_lastmods(self) -> None:
        self.write_sitemap(
            self.routes,
            {
                "https://example.test/": "2025-12-31",
                "https://example.test/External/": "2026-03-04",
            },
        )

        issues = self.issues()
        self.assertTrue(any("lastmod mismatch" in issue for issue in issues))
        self.assertTrue(any("missing sitemap lastmod" in issue for issue in issues))
        self.assertTrue(any("unexpected sitemap lastmod" in issue for issue in issues))

    def test_reports_missing_route_file_and_canonical_mismatch(self) -> None:
        (self.root / "pages" / "index.html").unlink()
        (self.root / "index.html").write_text(
            '<link rel="canonical" href="https://example.test/wrong/">',
            encoding="utf-8",
        )

        issues = self.issues()
        self.assertTrue(any("crawler route file missing" in issue for issue in issues))
        self.assertTrue(any("canonical URL mismatch" in issue for issue in issues))


class VaultPayloadTests(unittest.TestCase):
    def valid_payload(self) -> dict:
        return {
            "nodes": [
                {"id": "Index.md"},
                {"id": "A/Grace.md"},
                {"id": "B/Grace.md"},
            ],
            "links": [],
            "counts": {"unresolvedLinks": 2, "ambiguousLinks": 1},
            "linkDiagnostics": {
                "unresolved": [
                    {
                        "source": "Index.md",
                        "reference": "Missing",
                        "type": "wikilink",
                        "lines": [1],
                    },
                    {
                        "source": "Index.md",
                        "reference": "Missing.md",
                        "type": "markdown",
                        "lines": [2, 4],
                    },
                ],
                "ambiguous": [
                    {
                        "source": "Index.md",
                        "reference": "Grace",
                        "type": "wikilink",
                        "lines": [3],
                        "candidates": ["A/Grace.md", "B/Grace.md"],
                    }
                ],
            },
        }

    def test_accepts_source_located_wikilink_and_markdown_diagnostics(self) -> None:
        self.assertEqual(validate_vault_payload(self.valid_payload()), [])

    def test_rejects_missing_or_invalid_source_lines(self) -> None:
        invalid_lines = [None, [], [0], [2, 1], [1, 1], [True]]
        for lines in invalid_lines:
            with self.subTest(lines=lines):
                payload = self.valid_payload()
                diagnostic = payload["linkDiagnostics"]["unresolved"][0]
                if lines is None:
                    diagnostic.pop("lines")
                else:
                    diagnostic["lines"] = lines

                self.assertTrue(
                    any(
                        "source lines" in issue
                        for issue in validate_vault_payload(payload)
                    )
                )

    def test_rejects_unknown_diagnostic_link_type(self) -> None:
        payload = self.valid_payload()
        payload["linkDiagnostics"]["unresolved"][0]["type"] = "external"

        self.assertTrue(
            any("link type" in issue for issue in validate_vault_payload(payload))
        )


if __name__ == "__main__":
    unittest.main()
