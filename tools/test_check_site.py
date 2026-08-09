from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.check_site import find_local_reference_issues


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


if __name__ == "__main__":
    unittest.main()
