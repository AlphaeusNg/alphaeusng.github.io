#!/usr/bin/env python3
"""Static sanity checks for the zero-build portfolio.

Run from the repo root:

    python3 tools/check_site.py
"""

from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree

try:
    from tools.sitemap_contract import (
        SITEMAP_ROUTES,
        SITEMAP_URL,
        compute_lastmods,
    )
except ModuleNotFoundError:  # Direct execution from the tools directory on sys.path.
    from sitemap_contract import SITEMAP_ROUTES, SITEMAP_URL, compute_lastmods

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_CRAWLER_ROUTES = {route.url: route.local_path for route in SITEMAP_ROUTES}
NON_DEPLOYED_DIRS = frozenset(
    {".git", "node_modules", "playwright-report", "test-results"}
)


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


class CanonicalParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.urls: list[str] = []

    def handle_starttag(
        self, tag: str, attributes: list[tuple[str, str | None]]
    ) -> None:
        if tag.lower() != "link":
            return
        values = {name.lower(): value for name, value in attributes}
        relationships = (values.get("rel") or "").lower().split()
        href = values.get("href")
        if "canonical" in relationships and href:
            self.urls.append(href.strip())

    def handle_startendtag(
        self, tag: str, attributes: list[tuple[str, str | None]]
    ) -> None:
        self.handle_starttag(tag, attributes)


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
        path
        for path in root.rglob("*.html")
        if NON_DEPLOYED_DIRS.isdisjoint(path.relative_to(root).parts)
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


def find_crawler_contract_issues(
    root: Path,
    expected_routes: dict[str, str | None],
    *,
    sitemap_url: str,
    expected_lastmods: dict[str, str] | None = None,
) -> list[str]:
    issues: list[str] = []
    sitemap_path = root / "sitemap.xml"
    robots_path = root / "robots.txt"

    try:
        sitemap = ElementTree.parse(sitemap_path)
    except (OSError, ElementTree.ParseError) as error:
        return [f"sitemap.xml is unreadable or invalid: {error}"]

    expected_lastmods = expected_lastmods or {}
    locations: list[str] = []
    lastmods_by_url: dict[str, list[str]] = defaultdict(list)
    for url_entry in sitemap.findall(".//{*}url"):
        location_elements = url_entry.findall("{*}loc")
        location = (
            (location_elements[0].text or "").strip() if location_elements else ""
        )
        if not location:
            continue
        locations.append(location)
        lastmods_by_url[location].extend(
            (element.text or "").strip()
            for element in url_entry.findall("{*}lastmod")
        )
    location_counts = Counter(locations)
    for url, count in sorted(location_counts.items()):
        if count > 1:
            issues.append(f"duplicate sitemap URL: {url}")
    expected_urls = set(expected_routes)
    for url in sorted(expected_urls - set(locations)):
        issues.append(f"missing sitemap URL: {url}")
    for url in sorted(set(locations) - expected_urls):
        issues.append(f"non-canonical or unexpected sitemap URL: {url}")
    for url in sorted(expected_urls):
        actual_lastmods = lastmods_by_url.get(url, [])
        expected_lastmod = expected_lastmods.get(url)
        if expected_lastmod is None:
            if actual_lastmods:
                issues.append(f"unexpected sitemap lastmod for external route: {url}")
        elif not actual_lastmods:
            issues.append(f"missing sitemap lastmod: {url}")
        elif actual_lastmods != [expected_lastmod]:
            issues.append(
                f"sitemap lastmod mismatch for {url}: "
                f"expected {expected_lastmod}, found {actual_lastmods}"
            )

    try:
        robots = robots_path.read_text(encoding="utf-8")
    except OSError as error:
        issues.append(f"robots.txt is unreadable: {error}")
    else:
        sitemap_directives = re.findall(r"(?im)^\s*Sitemap:\s*(\S+)\s*$", robots)
        if sitemap_directives != [sitemap_url]:
            issues.append("robots.txt sitemap directive must name the canonical sitemap once")
        allows_root = re.search(r"(?im)^\s*Allow:\s*/\s*$", robots)
        blocks_root = re.search(r"(?im)^\s*Disallow:\s*/\s*$", robots)
        if not allows_root or blocks_root:
            issues.append("robots.txt must allow the site root")
        if not re.search(r"(?im)^\s*User-agent:\s*\*\s*$", robots):
            issues.append("robots.txt must define the wildcard user agent")

    for url, relative_path in expected_routes.items():
        if relative_path is None:
            continue
        route_path = root / relative_path
        if not route_path.is_file():
            issues.append(f"crawler route file missing: {relative_path}")
            continue
        parser = CanonicalParser()
        parser.feed(route_path.read_text(encoding="utf-8"))
        if parser.urls != [url]:
            issues.append(f"canonical URL mismatch for {relative_path}: {parser.urls}")

    return issues


def validate_conviction_payload(payload: object) -> list[str]:
    issues: list[str] = []

    def record(value: object) -> bool:
        return isinstance(value, dict)

    def finite(value: object) -> bool:
        return (
            isinstance(value, (int, float))
            and not isinstance(value, bool)
            and math.isfinite(value)
        )

    def close(actual: object, expected: float, digits: int) -> bool:
        return finite(actual) and abs(float(actual) - expected) <= (0.5 * 10**-digits + 1e-9)

    def expect_close(label: str, actual: object, expected: float, digits: int) -> None:
        if not close(actual, round(expected, digits), digits):
            issues.append(f"{label} does not match transactions")

    def iso_day(value: object) -> date | None:
        if not isinstance(value, str):
            return None
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None

    def next_month(period: str) -> str:
        year, month = map(int, period.split("-"))
        return f"{year + (month == 12):04d}-{1 if month == 12 else month + 1:02d}"

    if not record(payload):
        return ["conviction payload must be an object"]
    if payload.get("symbol") != "TSLA":
        issues.append("conviction symbol must be TSLA")
    for field in ("sourceFile", "sourceSheet"):
        if not isinstance(payload.get(field), str) or not payload[field].strip():
            issues.append(f"{field} must be non-empty")
    generated_at = payload.get("generatedAt")
    if not isinstance(generated_at, str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", generated_at
    ):
        issues.append("generatedAt must be a UTC timestamp")

    summary = payload.get("summary")
    transactions = payload.get("transactions")
    monthly = payload.get("monthlySeries")
    benchmark = payload.get("benchmarkComparison")
    if not record(summary):
        issues.append("summary must be an object")
        summary = {}
    if not isinstance(transactions, list) or not transactions:
        issues.append("transactions must be a non-empty array")
        transactions = []
    if not isinstance(monthly, list) or not monthly:
        issues.append("monthlySeries must be a non-empty array")
        monthly = []
    if not record(benchmark):
        issues.append("benchmarkComparison must be an object")
        benchmark = {}

    valid_transactions: list[dict] = []
    transaction_dates: list[date] = []
    for index, entry in enumerate(transactions):
        label = f"transactions[{index}]"
        if not record(entry):
            issues.append(f"{label} must be an object")
            continue
        parsed_date = iso_day(entry.get("date"))
        if parsed_date is None:
            issues.append(f"{label}.date must be ISO YYYY-MM-DD")
        period = entry.get("period")
        if not isinstance(period, str) or not re.fullmatch(r"\d{4}-\d{2}", period):
            issues.append(f"{label}.period must be YYYY-MM")
        elif parsed_date and period != entry["date"][:7]:
            issues.append(f"{label}.period does not match date")
        if entry.get("type") not in {"Buy", "Sell"}:
            issues.append(f"{label}.type must be Buy or Sell")
        if not isinstance(entry.get("account"), str) or not entry["account"].strip():
            issues.append(f"{label}.account must be non-empty")
        if not finite(entry.get("shares")) or entry["shares"] <= 0:
            issues.append(f"{label}.shares must be finite and positive")
        if not finite(entry.get("priceUsd")) or entry["priceUsd"] <= 0:
            issues.append(f"{label}.priceUsd must be finite and positive")
        cash_flow = entry.get("cashFlowUsd")
        if not finite(cash_flow):
            issues.append(f"{label}.cashFlowUsd must be finite")
        elif entry.get("type") == "Buy" and cash_flow >= 0:
            issues.append(f"{label}.cashFlowUsd must be negative for buys")
        elif entry.get("type") == "Sell" and cash_flow <= 0:
            issues.append(f"{label}.cashFlowUsd must be positive for sells")
        if (
            finite(entry.get("shares"))
            and finite(entry.get("priceUsd"))
            and finite(cash_flow)
        ):
            trade_notional = entry["shares"] * entry["priceUsd"]
            tolerance = max(2.0, trade_notional * 0.005)
            if abs(abs(cash_flow) - trade_notional) > tolerance:
                issues.append(
                    f"{label}.cashFlowUsd does not match USD trade notional"
                )
        if (
            parsed_date
            and isinstance(period, str)
            and entry.get("type") in {"Buy", "Sell"}
            and isinstance(entry.get("account"), str)
            and finite(entry.get("shares"))
            and entry["shares"] > 0
            and finite(entry.get("priceUsd"))
            and entry["priceUsd"] > 0
            and finite(cash_flow)
        ):
            valid_transactions.append(entry)
            transaction_dates.append(parsed_date)

    if transaction_dates != sorted(transaction_dates):
        issues.append("transactions must be ordered by date")

    buys = [entry for entry in valid_transactions if entry["type"] == "Buy"]
    sells = [entry for entry in valid_transactions if entry["type"] == "Sell"]
    expected_counts = {
        "buyTransactions": len(buys),
        "sellTransactions": len(sells),
        "totalTransactions": len(valid_transactions),
    }
    for field, expected in expected_counts.items():
        if summary.get(field) != expected:
            issues.append(f"summary.{field} does not match transactions")
    if transaction_dates:
        if summary.get("firstTransactionDate") != transaction_dates[0].isoformat():
            issues.append("summary.firstTransactionDate does not match transactions")
        if summary.get("latestTransactionDate") != transaction_dates[-1].isoformat():
            issues.append("summary.latestTransactionDate does not match transactions")
    gross_bought = sum(entry["shares"] for entry in buys)
    gross_sold = sum(entry["shares"] for entry in sells)
    expect_close("summary.grossBoughtShares", summary.get("grossBoughtShares"), gross_bought, 4)
    expect_close("summary.grossSoldShares", summary.get("grossSoldShares"), gross_sold, 4)
    expect_close(
        "summary.currentShares", summary.get("currentShares"), gross_bought - gross_sold, 4
    )
    expect_close(
        "summary.capitalDeployedUsd",
        summary.get("capitalDeployedUsd"),
        sum(-entry["cashFlowUsd"] for entry in buys),
        2,
    )
    expect_close(
        "summary.saleProceedsUsd",
        summary.get("saleProceedsUsd"),
        sum(entry["cashFlowUsd"] for entry in sells),
        2,
    )
    expected_accounts = sorted({entry["account"] for entry in valid_transactions})
    if summary.get("accounts") != expected_accounts:
        issues.append("summary.accounts does not match transactions")

    by_period: dict[str, list[dict]] = defaultdict(list)
    for entry in valid_transactions:
        by_period[entry["period"]].append(entry)
    periods = [entry.get("period") for entry in monthly if record(entry)]
    valid_periods = [
        period
        for period in periods
        if isinstance(period, str) and re.fullmatch(r"\d{4}-\d{2}", period)
    ]
    if len(valid_periods) != len(periods):
        issues.append("monthlySeries periods must use YYYY-MM")
    if len(valid_periods) == len(periods) and periods != sorted(set(periods)):
        issues.append("monthlySeries periods must be unique and increasing")
    if valid_periods != sorted(by_period):
        issues.append("monthlySeries periods do not match transaction months")
    cumulative = 0.0
    for index, entry in enumerate(monthly):
        label = f"monthlySeries[{index}]"
        if not record(entry):
            issues.append(f"{label} must be an object")
            continue
        rows = by_period.get(entry.get("period"), [])
        buy_shares = sum(row["shares"] for row in rows if row["type"] == "Buy")
        sell_shares = sum(row["shares"] for row in rows if row["type"] == "Sell")
        net_shares = buy_shares - sell_shares
        cumulative += net_shares
        expect_close(f"{label}.buyShares", entry.get("buyShares"), buy_shares, 4)
        expect_close(f"{label}.sellShares", entry.get("sellShares"), sell_shares, 4)
        expect_close(f"{label}.netShares", entry.get("netShares"), net_shares, 4)
        expect_close(f"{label}.cumulativeShares", entry.get("cumulativeShares"), cumulative, 4)
        if entry.get("transactions") != len(rows):
            issues.append(f"{label}.transactions does not match transactions")
        expect_close(
            f"{label}.capitalDeployedUsd",
            entry.get("capitalDeployedUsd"),
            sum(-row["cashFlowUsd"] for row in rows if row["type"] == "Buy"),
            2,
        )
        expect_close(
            f"{label}.saleProceedsUsd",
            entry.get("saleProceedsUsd"),
            sum(row["cashFlowUsd"] for row in rows if row["type"] == "Sell"),
            2,
        )

    meta = benchmark.get("meta") if record(benchmark.get("meta")) else {}
    benchmark_summary = (
        benchmark.get("summary") if record(benchmark.get("summary")) else {}
    )
    points = benchmark.get("points")
    if not isinstance(points, list) or not points:
        issues.append("benchmark points must be a non-empty array")
        points = []
    if meta.get("tslaSymbol") != "TSLA" or meta.get("benchmarkSymbol") != "SPY":
        issues.append("benchmark meta symbols must be TSLA and SPY")
    if meta.get("baseCurrency") != "USD":
        issues.append("benchmark base currency must be USD")
    if meta.get("firstTransactionDate") != summary.get("firstTransactionDate"):
        issues.append("benchmark meta first transaction date does not match summary")
    if meta.get("lastTransactionDate") != summary.get("latestTransactionDate"):
        issues.append("benchmark meta last transaction date does not match summary")

    point_months = [point.get("month") for point in points if record(point)]
    point_periods = [
        month[:7]
        for month in point_months
        if isinstance(month, str) and iso_day(month) and month.endswith("-01")
    ]
    if point_periods and len(point_periods) == len(point_months):
        expected_periods = [point_periods[0]]
        for _ in point_periods[1:]:
            expected_periods.append(next_month(expected_periods[-1]))
        if point_periods != expected_periods:
            issues.append("benchmark point months must be continuous and increasing")
        if transaction_dates and point_periods[0] != transaction_dates[0].strftime("%Y-%m"):
            issues.append("benchmark points must start in the first transaction month")
    tsla_shares = 0.0
    spy_units = 0.0
    net_invested = 0.0
    for index, point in enumerate(points):
        label = f"benchmark points[{index}]"
        if not record(point):
            issues.append(f"{label} must be an object")
            continue
        month = point.get("month")
        if not isinstance(month, str) or iso_day(month) is None or not month.endswith("-01"):
            issues.append(f"{label}.month must be a month-start date")
            continue
        period = month[:7]
        rows = by_period.get(period, [])
        share_delta = sum(
            row["shares"] if row["type"] == "Buy" else -row["shares"] for row in rows
        )
        capital_flow = sum(-row["cashFlowUsd"] for row in rows)
        tsla_shares += share_delta
        net_invested += capital_flow
        spy_close = point.get("spyCloseUsd")
        tsla_close = point.get("tslaCloseUsd")
        if not finite(spy_close) or spy_close <= 0:
            issues.append(f"{label}.spyCloseUsd must be finite and positive")
            continue
        if not finite(tsla_close) or tsla_close <= 0:
            issues.append(f"{label}.tslaCloseUsd must be finite and positive")
            continue
        spy_units += capital_flow / spy_close
        tsla_value = tsla_shares * tsla_close
        spy_value = spy_units * spy_close
        expected = {
            "tslaShares": (tsla_shares, 4),
            "spyUnits": (spy_units, 6),
            "netInvestedCapitalUsd": (net_invested, 2),
            "monthlyTslaShareDelta": (share_delta, 4),
            "monthlyCapitalFlowUsd": (capital_flow, 2),
            "tslaValueUsd": (tsla_value, 2),
            "spyValueUsd": (spy_value, 2),
            "differenceUsd": (tsla_value - spy_value, 2),
        }
        for field, (value, digits) in expected.items():
            if not close(point.get(field), round(value, digits), digits):
                issues.append(f"{label} {field} does not match transaction benchmark")
        if point.get("tradeCount") != len(rows):
            issues.append(f"{label}.tradeCount does not match transactions")

    if points and record(points[-1]):
        final_point = points[-1]
        summary_fields = {
            "currentHoldingsShares": "tslaShares",
            "netInvestedCapitalUsd": "netInvestedCapitalUsd",
            "finalTslaValueUsd": "tslaValueUsd",
            "finalSpyValueUsd": "spyValueUsd",
            "finalDifferenceUsd": "differenceUsd",
            "valuationMonth": "month",
        }
        for summary_field, point_field in summary_fields.items():
            if benchmark_summary.get(summary_field) != final_point.get(point_field):
                issues.append(
                    f"benchmark summary.{summary_field} does not match final point"
                )
        if summary.get("currentShares") != final_point.get("tslaShares"):
            issues.append("benchmark final holdings do not match conviction summary")

    return issues


def validate_vault_payload(payload: object) -> list[str]:
    """Validate the generated vault graph and source-located link diagnostics."""
    issues: list[str] = []
    if not isinstance(payload, dict):
        return ["vault-data.json must contain an object"]

    nodes = payload.get("nodes")
    links = payload.get("links")
    counts = payload.get("counts")
    diagnostics = payload.get("linkDiagnostics")
    if not isinstance(nodes, list) or not nodes:
        issues.append("vault-data.json has no nodes")
        nodes = []
    if not isinstance(links, list):
        issues.append("vault-data.json missing links array")
    if not isinstance(counts, dict) or not isinstance(diagnostics, dict):
        issues.append("vault-data.json missing diagnostic metadata")
        return issues

    node_ids = {
        node.get("id")
        for node in nodes
        if isinstance(node, dict) and isinstance(node.get("id"), str)
    }
    for kind, count_field in (
        ("unresolved", "unresolvedLinks"),
        ("ambiguous", "ambiguousLinks"),
    ):
        entries = diagnostics.get(kind)
        if not isinstance(entries, list):
            issues.append(f"vault-data.json missing {kind} link diagnostics")
            continue
        if (
            type(counts.get(count_field)) is not int
            or counts[count_field] != len(entries)
        ):
            issues.append(f"vault-data.json {kind} diagnostic count mismatch")

        for index, entry in enumerate(entries):
            label = f"vault-data.json {kind} diagnostic {index}"
            if not isinstance(entry, dict):
                issues.append(f"{label} must be an object")
                continue
            if entry.get("source") not in node_ids:
                issues.append(f"{label} has an unknown source")
            reference = entry.get("reference")
            if not isinstance(reference, str) or not reference.strip():
                issues.append(f"{label} has an invalid reference")
            if entry.get("type") not in {"wikilink", "markdown"}:
                issues.append(f"{label} has an unsupported link type")
            source_lines = entry.get("lines")
            if (
                not isinstance(source_lines, list)
                or not source_lines
                or any(type(line) is not int or line <= 0 for line in source_lines)
                or source_lines != sorted(set(source_lines))
            ):
                issues.append(f"{label} has invalid source lines")

            if kind == "ambiguous":
                candidates = entry.get("candidates")
                if (
                    not isinstance(candidates, list)
                    or len(candidates) < 2
                    or any(candidate not in node_ids for candidate in candidates)
                ):
                    issues.append(f"{label} needs candidate paths")

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
        ROOT / "package.json",
        ROOT / "package-lock.json",
        ROOT / "playwright.config.mjs",
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
        ROOT / "data" / "conviction_tsla_history.json",
        ROOT / "data" / "tsla_transactions.csv",
        ROOT / "tools" / "finance" / "generate_conviction_history.py",
        ROOT / "tools" / "finance" / "tsla-vs-spy.json",
        ROOT / "tools" / "finance" / "tsla_trades_anonymized.csv",
        ROOT / "tools" / "browser" / "portfolio.spec.mjs",
        ROOT / "assets" / "alphaeus-portrait.jpg",
        ROOT / "assets" / "xray-baggage-sample.jpg",
        ROOT / "LICENSE",
    ]
    for path in required:
        if not path.is_file():
            fail(f"missing required file: {path.relative_to(ROOT)}")
    ok(f"{len(required)} required files present")

    version_source = (ROOT / "js" / "version.js").read_text(encoding="utf-8")
    version_match = re.search(r'id:\s*"(\d{4}\.\d{2}\.\d{2}\.\d+)"', version_source)
    if not version_match:
        fail("js/version.js must declare a deploy-stamp SITE_VERSION.id")
    site_version = version_match.group(1)
    feedback_html = (ROOT / "pages" / "feedback" / "index.html").read_text(encoding="utf-8")
    for asset, pattern in (
        ("css", rf'href="css/main\.css\?v={re.escape(site_version)}"'),
        ("js", rf'src="js/app\.js\?v={re.escape(site_version)}"'),
    ):
        if not re.search(pattern, feedback_html):
            fail(f"feedback {asset} cache key must match SITE_VERSION.id {site_version}")
    ok(f"feedback asset cache keys match {site_version}")

    kofi_pages = (
        (ROOT / "index.html", rf'src="js/kofi-support\.js\?v={re.escape(site_version)}"'),
        (
            ROOT / "pages" / "conviction.html",
            rf'src="\.\./js/kofi-support\.js\?v={re.escape(site_version)}"',
        ),
        (
            ROOT / "pages" / "seeking-biblical-truth" / "index.html",
            rf'src="\.\./\.\./js/kofi-support\.js\?v={re.escape(site_version)}"',
        ),
    )
    for path, pattern in kofi_pages:
        if not re.search(pattern, path.read_text(encoding="utf-8")):
            fail(
                f"{path.relative_to(ROOT)} kofi-support cache key must match "
                f"SITE_VERSION.id {site_version}"
            )
    ok(f"kofi-support cache keys match {site_version}")

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
        "deterministic Node install": "npm ci" in workflow,
        "Chromium browser install": (
            "npx playwright install --with-deps chromium" in workflow
        ),
        "contract unit tests": (
            "python3 -m unittest discover -s tools -p 'test_*.py'" in workflow
        ),
        "complete site check": "python3 tools/check_site.py" in workflow,
        "conviction freshness check": (
            "python3 tools/finance/generate_conviction_history.py --check" in workflow
        ),
        "sitemap freshness check": (
            "python3 tools/generate_sitemap.py --check" in workflow
        ),
        "complete checkout history": "fetch-depth: 0" in workflow,
        "browser interaction tests": "npm run test:browser" in workflow,
        "Python compilation": "python3 -m compileall -q tools" in workflow,
        "JavaScript syntax check": "node --check" in workflow,
    }
    missing_workflow_contracts = [
        label for label, present in workflow_contracts.items() if not present
    ]
    if missing_workflow_contracts:
        fail("CI workflow policy missing: " + ", ".join(missing_workflow_contracts))
    ok(f"GitHub Actions policy: {len(workflow_contracts)} contracts")

    try:
        expected_lastmods = compute_lastmods(ROOT)
    except RuntimeError as error:
        fail(f"cannot derive sitemap lastmod metadata: {error}")
    crawler_issues = find_crawler_contract_issues(
        ROOT,
        PUBLIC_CRAWLER_ROUTES,
        sitemap_url=SITEMAP_URL,
        expected_lastmods=expected_lastmods,
    )
    if crawler_issues:
        fail("invalid crawler discovery contract: " + "; ".join(crawler_issues))
    ok(f"crawler discovery: {len(PUBLIC_CRAWLER_ROUTES)} canonical public routes")

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

    conviction = json.loads(
        (ROOT / "data" / "conviction_tsla_history.json").read_text(encoding="utf-8")
    )
    conviction_issues = validate_conviction_payload(conviction)
    if conviction_issues:
        fail("invalid conviction dataset: " + "; ".join(conviction_issues))
    ok(
        "conviction dataset: "
        f"{len(conviction['transactions'])} transactions, "
        f"{len(conviction['monthlySeries'])} active months, "
        f"{len(conviction['benchmarkComparison']['points'])} benchmark months"
    )

    vault = json.loads(
        (ROOT / "pages" / "seeking-biblical-truth" / "vault-data.json").read_text(
            encoding="utf-8"
        )
    )
    vault_issues = validate_vault_payload(vault)
    if vault_issues:
        fail("invalid vault-data.json: " + "; ".join(vault_issues))
    diagnostics = vault["linkDiagnostics"]
    ok(
        f"vault-data.json: {len(vault['nodes'])} nodes, {len(vault['links'])} links, "
        f"{len(diagnostics['unresolved'])} unresolved, "
        f"{len(diagnostics['ambiguous'])} ambiguous"
    )

    portrait = ROOT / "assets" / "alphaeus-portrait.jpg"
    if portrait.stat().st_size > 120_000:
        fail(f"portrait still large ({portrait.stat().st_size} bytes); re-compress")
    ok(f"portrait size {portrait.stat().st_size // 1024}KB")

    print("All checks passed.")


if __name__ == "__main__":
    main()
