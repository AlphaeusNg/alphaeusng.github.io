"""Canonical sitemap routes and Git-backed modification dates."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

SITEMAP_URL = "https://alphaeusng.github.io/sitemap.xml"


@dataclass(frozen=True)
class SitemapRoute:
    url: str
    local_path: str | None
    changefreq: str
    priority: str
    deploy_inputs: tuple[str, ...] = ()


SITEMAP_ROUTES = (
    SitemapRoute(
        "https://alphaeusng.github.io/",
        "index.html",
        "monthly",
        "1.0",
        (
            "index.html",
            "css/main.css",
            "css/home.css",
            "js/main.js",
            "js/modals.js",
            "js/kofi-support.js",
            "assets/alphaeus-portrait.jpg",
            "assets/alphaeus-portrait-original.jpg",
            "assets/xray-baggage-sample.jpg",
            "assets/resume.pdf",
            "assets/resume.docx",
        ),
    ),
    SitemapRoute(
        "https://alphaeusng.github.io/pages/conviction.html",
        "pages/conviction.html",
        "monthly",
        "0.7",
        (
            "pages/conviction.html",
            "css/conviction.css",
            "js/conviction.js",
            "js/kofi-support.js",
            "data/conviction_tsla_history.json",
        ),
    ),
    SitemapRoute(
        "https://alphaeusng.github.io/pages/seeking-biblical-truth/",
        "pages/seeking-biblical-truth/index.html",
        "weekly",
        "0.8",
        (
            "pages/seeking-biblical-truth/index.html",
            "pages/seeking-biblical-truth/css/main.css",
            "pages/seeking-biblical-truth/js/app.js",
            "pages/seeking-biblical-truth/js/firebase-config.js",
            "pages/seeking-biblical-truth/js/vault-cloud.js",
            "pages/seeking-biblical-truth/vault-data.json",
            "js/kofi-support.js",
        ),
    ),
    SitemapRoute("https://alphaeusng.github.io/AIly/", None, "weekly", "0.7"),
    SitemapRoute(
        "https://alphaeusng.github.io/KoboForge/", None, "monthly", "0.7"
    ),
    SitemapRoute(
        "https://alphaeusng.github.io/AlpArcade/", None, "monthly", "0.5"
    ),
    SitemapRoute(
        "https://alphaeusng.github.io/VerseKeep/", None, "weekly", "0.6"
    ),
    SitemapRoute(
        "https://alphaeusng.github.io/ChristoDay/", None, "daily", "0.6"
    ),
    SitemapRoute(
        "https://alphaeusng.github.io/CardFitSG/", None, "monthly", "0.6"
    ),
)


def _git(root: Path, *arguments: str) -> str:
    try:
        result = subprocess.run(
            ("git", *arguments),
            cwd=root,
            check=True,
            capture_output=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError) as error:
        detail = getattr(error, "stderr", "") or str(error)
        raise RuntimeError(f"git {' '.join(arguments)} failed: {detail.strip()}") from error
    return result.stdout.strip()


def compute_lastmods(
    root: Path,
    routes: tuple[SitemapRoute, ...] = SITEMAP_ROUTES,
    *,
    current_date: date | None = None,
) -> dict[str, str]:
    """Return route dates from the newest committed or dirty deploy input."""
    root = root.resolve()
    dirty_date = (current_date or date.today()).isoformat()
    lastmods: dict[str, str] = {}

    for route in routes:
        if not route.deploy_inputs:
            continue
        _git(root, "ls-files", "--error-unmatch", "--", *route.deploy_inputs)
        dirty = _git(
            root,
            "status",
            "--porcelain=v1",
            "--untracked-files=all",
            "--",
            *route.deploy_inputs,
        )
        if dirty:
            lastmods[route.url] = dirty_date
            continue

        committed_date = _git(
            root, "log", "-1", "--format=%cs", "--", *route.deploy_inputs
        )
        if not committed_date:
            raise RuntimeError(
                f"no Git history found for sitemap deploy inputs: {route.url}"
            )
        try:
            date.fromisoformat(committed_date)
        except ValueError as error:
            raise RuntimeError(
                f"invalid Git commit date for sitemap route {route.url}: "
                f"{committed_date}"
            ) from error
        lastmods[route.url] = committed_date

    return lastmods


def render_sitemap(
    routes: tuple[SitemapRoute, ...], lastmods: dict[str, str]
) -> str:
    """Render the canonical sitemap, dating only repository-owned routes."""
    dated_urls = {route.url for route in routes if route.deploy_inputs}
    if set(lastmods) != dated_urls:
        raise ValueError("lastmod keys must exactly match repository-owned routes")

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for route in routes:
        lines.extend(("  <url>", f"    <loc>{escape(route.url)}</loc>"))
        if route.url in lastmods:
            lines.append(f"    <lastmod>{escape(lastmods[route.url])}</lastmod>")
        lines.extend(
            (
                f"    <changefreq>{route.changefreq}</changefreq>",
                f"    <priority>{route.priority}</priority>",
                "  </url>",
            )
        )
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"
