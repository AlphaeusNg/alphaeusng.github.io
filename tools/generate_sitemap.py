#!/usr/bin/env python3
"""Generate or verify sitemap.xml from canonical routes and Git history."""

from __future__ import annotations

import argparse
from pathlib import Path

try:
    from tools.sitemap_contract import SITEMAP_ROUTES, compute_lastmods, render_sitemap
except ModuleNotFoundError:  # Direct execution from the tools directory on sys.path.
    from sitemap_contract import SITEMAP_ROUTES, compute_lastmods, render_sitemap

ROOT = Path(__file__).resolve().parents[1]
SITEMAP_PATH = ROOT / "sitemap.xml"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail instead of writing when sitemap.xml is stale",
    )
    arguments = parser.parse_args()

    expected = render_sitemap(SITEMAP_ROUTES, compute_lastmods(ROOT))
    if arguments.check:
        actual = SITEMAP_PATH.read_text(encoding="utf-8")
        if actual != expected:
            raise SystemExit(
                "FAIL: sitemap.xml is stale; run python3 tools/generate_sitemap.py"
            )
        print("OK: sitemap.xml matches tracked deploy-input history")
        return

    SITEMAP_PATH.write_text(expected, encoding="utf-8")
    print(f"Updated {SITEMAP_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
