from __future__ import annotations

import os
import subprocess
import tempfile
import unittest
from datetime import date
from pathlib import Path

from tools.sitemap_contract import (
    SITEMAP_ROUTES,
    SitemapRoute,
    compute_lastmods,
    render_sitemap,
)


class SitemapContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.git("init", "-q")
        self.git("config", "user.name", "Sitemap Test")
        self.git("config", "user.email", "sitemap@example.test")
        self.route = SitemapRoute(
            "https://example.test/",
            "index.html",
            "monthly",
            "1.0",
            ("index.html", "app.js"),
        )
        self.external = SitemapRoute(
            "https://example.test/External/", None, "weekly", "0.5"
        )

    def git(self, *arguments: str, commit_date: str | None = None) -> None:
        environment = os.environ.copy()
        if commit_date:
            timestamp = (
                commit_date
                if "T" in commit_date
                else f"{commit_date}T12:00:00+00:00"
            )
            environment["GIT_AUTHOR_DATE"] = timestamp
            environment["GIT_COMMITTER_DATE"] = timestamp
        subprocess.run(
            ("git", *arguments),
            cwd=self.root,
            env=environment,
            check=True,
            capture_output=True,
        )

    def commit_inputs(self, commit_date: str) -> None:
        (self.root / "index.html").write_text("Portfolio", encoding="utf-8")
        (self.root / "app.js").write_text("initial", encoding="utf-8")
        self.git("add", "index.html", "app.js")
        self.git("commit", "-q", "-m", "Add route", commit_date=commit_date)

    def test_uses_newest_tracked_input_and_omits_external_route(self) -> None:
        self.commit_inputs("2026-01-02")
        (self.root / "app.js").write_text("updated", encoding="utf-8")
        self.git("add", "app.js")
        self.git("commit", "-q", "-m", "Update app", commit_date="2026-02-03")

        self.assertEqual(
            compute_lastmods(self.root, (self.route, self.external)),
            {"https://example.test/": "2026-02-03"},
        )

    def test_dirty_deploy_input_uses_current_date(self) -> None:
        self.commit_inputs("2026-01-02")
        (self.root / "index.html").write_text("Changed", encoding="utf-8")

        self.assertEqual(
            compute_lastmods(
                self.root,
                (self.route, self.external),
                current_date=date(2026, 3, 4),
            ),
            {"https://example.test/": "2026-03-04"},
        )

    def test_commit_timestamp_uses_the_site_timezone(self) -> None:
        self.commit_inputs("2026-08-19T16:52:00+00:00")

        self.assertEqual(
            compute_lastmods(self.root, (self.route,)),
            {"https://example.test/": "2026-08-20"},
        )

    def test_render_dates_only_repository_owned_routes(self) -> None:
        rendered = render_sitemap(
            (self.route, self.external),
            {"https://example.test/": "2026-02-03"},
        )

        self.assertEqual(rendered.count("<lastmod>"), 1)
        self.assertIn("<lastmod>2026-02-03</lastmod>", rendered)
        external_entry = rendered.split("https://example.test/External/", 1)[1]
        self.assertNotIn("<lastmod>", external_entry)

    def test_production_manifest_dates_only_local_routes(self) -> None:
        dated = [route for route in SITEMAP_ROUTES if route.deploy_inputs]
        external = [route for route in SITEMAP_ROUTES if not route.deploy_inputs]

        self.assertEqual(len(SITEMAP_ROUTES), 10)
        self.assertEqual(len(dated), 4)
        self.assertEqual(len(external), 6)
        self.assertTrue(all(route.local_path for route in dated))
        self.assertTrue(all(route.local_path is None for route in external))


if __name__ == "__main__":
    unittest.main()
