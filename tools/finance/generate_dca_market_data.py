#!/usr/bin/env python3
"""Generate delayed daily market history for the Conviction DCA Lab.

The browser reads a committed snapshot because Nasdaq's public market endpoint
does not permit cross-origin browser requests. A scheduled GitHub Action runs
this helper after the U.S. close and commits only when the market payload has
actually changed. `--quotes-only` writes a small last-sale file for the
intraday live-quote branch.
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = REPO_ROOT / "data" / "dca_market_history.json"
DEFAULT_QUOTES_OUTPUT = REPO_ROOT / "data" / "dca_live_quotes.json"
NASDAQ_API = "https://api.nasdaq.com/api/quote/{symbol}/historical"
NASDAQ_QUOTE_API = "https://api.nasdaq.com/api/quote/{symbol}/info?assetclass=stocks"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "Chrome/124.0 Safari/537.36"
)
SYMBOLS = {
    "TSLA": {
        "name": "Tesla, Inc.",
        "shortName": "Tesla",
        "exchange": "Nasdaq",
        "ipoDate": "2010-06-29",
    },
    "SPCX": {
        "name": "Space Exploration Technologies Corp.",
        "shortName": "SpaceX",
        "exchange": "Nasdaq / Nasdaq Texas",
        "ipoDate": "2026-06-12",
        "identityNote": (
            "SPCX is SpaceX. The SPAC and New Issue ETF that previously used "
            "SPCX changed its symbol to SPCK on 2026-04-07."
        ),
    },
}


def parse_number(value: object, *, integer: bool = False) -> float | int:
    """Parse Nasdaq currency and volume strings into positive numbers."""

    if isinstance(value, (int, float)):
        number = float(value)
    elif isinstance(value, str):
        cleaned = value.strip().replace("$", "").replace(",", "")
        if not cleaned or cleaned in {"--", "N/A"}:
            raise ValueError(f"missing numeric value: {value!r}")
        number = float(cleaned)
    else:
        raise ValueError(f"unsupported numeric value: {value!r}")
    if number < 0:
        raise ValueError(f"negative market value: {value!r}")
    return int(number) if integer else round(number, 6)


def parse_history_payload(payload: object, symbol: str) -> list[dict[str, object]]:
    """Normalize a Nasdaq history response into ascending OHLCV rows."""

    if not isinstance(payload, dict):
        raise ValueError(f"{symbol}: Nasdaq response is not an object")
    status = payload.get("status")
    if not isinstance(status, dict) or status.get("rCode") != 200:
        raise ValueError(f"{symbol}: Nasdaq returned an unsuccessful status")
    data = payload.get("data")
    if not isinstance(data, dict):
        raise ValueError(f"{symbol}: Nasdaq response has no data object")
    table = data.get("tradesTable")
    rows = table.get("rows") if isinstance(table, dict) else None
    if not isinstance(rows, list) or not rows:
        raise ValueError(f"{symbol}: Nasdaq response has no historical rows")

    normalized: list[dict[str, object]] = []
    seen_dates: set[str] = set()
    for row in rows:
        if not isinstance(row, dict):
            continue
        try:
            session = datetime.strptime(str(row["date"]), "%m/%d/%Y").date()
            session_text = session.isoformat()
            if session_text in seen_dates:
                raise ValueError(f"duplicate session {session_text}")
            seen_dates.add(session_text)
            normalized.append(
                {
                    "date": session_text,
                    "open": parse_number(row["open"]),
                    "high": parse_number(row["high"]),
                    "low": parse_number(row["low"]),
                    "close": parse_number(row["close"]),
                    "volume": parse_number(row["volume"], integer=True),
                }
            )
        except (KeyError, TypeError, ValueError) as error:
            raise ValueError(f"{symbol}: invalid history row {row!r}: {error}") from error

    normalized.sort(key=lambda row: str(row["date"]))
    return normalized


def parse_signed_number(value: object, *, percent: bool = False) -> float:
    if isinstance(value, (int, float)):
        number = float(value)
    elif isinstance(value, str):
        cleaned = value.strip().replace("$", "").replace(",", "").replace("%", "")
        if not cleaned or cleaned in {"--", "N/A"}:
            raise ValueError(f"missing numeric value: {value!r}")
        number = float(cleaned)
    else:
        raise ValueError(f"unsupported numeric value: {value!r}")
    return round(number / 100 if percent else number, 8)


def parse_quote_payload(payload: object, symbol: str) -> dict[str, object]:
    if not isinstance(payload, dict):
        raise ValueError(f"{symbol}: Nasdaq quote response is not an object")
    status = payload.get("status")
    data = payload.get("data")
    if not isinstance(status, dict) or status.get("rCode") != 200 or not isinstance(data, dict):
        raise ValueError(f"{symbol}: Nasdaq quote returned an unsuccessful status")
    primary = data.get("primaryData")
    if not isinstance(primary, dict):
        raise ValueError(f"{symbol}: Nasdaq quote has no primary data")
    timestamp = str(primary.get("lastTradeTimestamp", "")).strip()
    try:
        parsed_timestamp = datetime.strptime(timestamp, "%b %d, %Y %I:%M %p ET")
        as_of = parsed_timestamp.replace(tzinfo=ZoneInfo("America/New_York")).isoformat()
    except ValueError as error:
        raise ValueError(f"{symbol}: invalid quote timestamp {timestamp!r}") from error
    return {
        "price": parse_number(primary.get("lastSalePrice")),
        "asOf": as_of,
        "marketStatus": str(data.get("marketStatus") or "Unknown"),
        "isRealTime": bool(primary.get("isRealTime")),
        "netChange": parse_signed_number(primary.get("netChange")),
        "percentChange": parse_signed_number(primary.get("percentageChange"), percent=True),
    }


def fetch_history(symbol: str, start: date, end: date) -> list[dict[str, object]]:
    query = urlencode(
        {
            "assetclass": "stocks",
            "fromdate": start.isoformat(),
            "todate": end.isoformat(),
            "limit": "5000",
        }
    )
    url = f"{NASDAQ_API.format(symbol=symbol)}?{query}"
    request = Request(
        url,
        headers={
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": USER_AGENT,
        },
    )
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            with urlopen(request, timeout=30) as response:
                return parse_history_payload(json.load(response), symbol)
        except Exception as error:  # urllib exposes several transport exceptions
            last_error = error
            if attempt < 2:
                time.sleep(2**attempt)
    raise RuntimeError(f"{symbol}: unable to fetch Nasdaq history: {last_error}")


def fetch_quote(symbol: str) -> dict[str, object]:
    request = Request(
        NASDAQ_QUOTE_API.format(symbol=symbol),
        headers={
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": USER_AGENT,
        },
    )
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            with urlopen(request, timeout=30) as response:
                return parse_quote_payload(json.load(response), symbol)
        except Exception as error:
            last_error = error
            if attempt < 2:
                time.sleep(2**attempt)
    raise RuntimeError(f"{symbol}: unable to fetch Nasdaq quote: {last_error}")


def build_payload(
    histories: dict[str, list[dict[str, object]]],
    *,
    generated_at: str,
    quotes: dict[str, dict[str, object]] | None = None,
) -> dict[str, object]:
    symbols: dict[str, object] = {}
    for symbol, identity in SYMBOLS.items():
        history = histories.get(symbol)
        if not history:
            raise ValueError(f"{symbol}: history is required")
        fallback_quote = {
            "price": history[-1]["close"],
            "asOf": f"{history[-1]['date']}T16:00:00-04:00",
            "marketStatus": "Closed",
            "isRealTime": False,
            "netChange": 0.0,
            "percentChange": 0.0,
        }
        symbols[symbol] = {
            **identity,
            "symbol": symbol,
            "currency": "USD",
            "priceBasis": "unadjusted daily close",
            "latestClose": {
                "date": history[-1]["date"],
                "price": history[-1]["close"],
            },
            "quote": (quotes or {}).get(symbol, fallback_quote),
            "history": history,
        }
    payload: dict[str, object] = {
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "marketTimezone": "America/New_York",
        "source": {
            "name": "Nasdaq",
            "type": "market quote snapshot and delayed end-of-day history",
            "terms": "Displayed for personal decision support; verify prices with a broker.",
            "quoteUrls": {
                symbol: f"https://www.nasdaq.com/market-activity/stocks/{symbol.lower()}"
                for symbol in SYMBOLS
            },
        },
        "symbols": symbols,
    }
    issues = validate_payload(payload)
    if issues:
        raise ValueError("; ".join(issues))
    return payload


def validate_quotes_payload(payload: object) -> list[str]:
    issues: list[str] = []
    if not isinstance(payload, dict):
        return ["live quote payload must be an object"]
    if payload.get("schemaVersion") != 1:
        issues.append("schemaVersion must be 1")
    if payload.get("marketTimezone") != "America/New_York":
        issues.append("marketTimezone must be America/New_York")
    symbols = payload.get("symbols")
    if not isinstance(symbols, dict) or set(symbols) != set(SYMBOLS):
        return issues + ["symbols must contain exactly TSLA and SPCX"]
    for symbol in SYMBOLS:
        quote = symbols.get(symbol)
        if not isinstance(quote, dict):
            issues.append(f"{symbol} quote must be an object")
            continue
        try:
            if float(quote.get("price", 0)) <= 0:
                raise ValueError
            datetime.fromisoformat(str(quote.get("asOf")))
            float(quote.get("netChange"))
            float(quote.get("percentChange"))
        except (TypeError, ValueError):
            issues.append(f"{symbol} quote has invalid values")
    return issues


def build_quotes_payload(
    quotes: dict[str, dict[str, object]],
    *,
    generated_at: str,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "marketTimezone": "America/New_York",
        "source": {
            "name": "Nasdaq",
            "type": "intraday last-sale snapshot",
            "terms": "Displayed for personal decision support; verify prices with a broker.",
        },
        "symbols": quotes,
    }
    issues = validate_quotes_payload(payload)
    if issues:
        raise ValueError("; ".join(issues))
    return payload


def validate_payload(payload: object) -> list[str]:
    issues: list[str] = []
    if not isinstance(payload, dict):
        return ["DCA market payload must be an object"]
    if payload.get("schemaVersion") != 1:
        issues.append("schemaVersion must be 1")
    if payload.get("marketTimezone") != "America/New_York":
        issues.append("marketTimezone must be America/New_York")
    symbols = payload.get("symbols")
    if not isinstance(symbols, dict) or set(symbols) != set(SYMBOLS):
        return issues + ["symbols must contain exactly TSLA and SPCX"]

    for symbol in SYMBOLS:
        record = symbols.get(symbol)
        if not isinstance(record, dict):
            issues.append(f"{symbol} record must be an object")
            continue
        if record.get("symbol") != symbol:
            issues.append(f"{symbol} record has the wrong symbol")
        history = record.get("history")
        if not isinstance(history, list) or len(history) < 2:
            issues.append(f"{symbol} history must contain at least two rows")
            continue
        dates: list[str] = []
        for index, row in enumerate(history):
            if not isinstance(row, dict):
                issues.append(f"{symbol} history row {index} must be an object")
                continue
            row_date = row.get("date")
            try:
                date.fromisoformat(str(row_date))
            except ValueError:
                issues.append(f"{symbol} history row {index} has an invalid date")
            dates.append(str(row_date))
            try:
                open_price = float(row.get("open", 0))
                high = float(row.get("high", 0))
                low = float(row.get("low", 0))
                close = float(row.get("close", 0))
                volume = int(row.get("volume", -1))
                if min(open_price, high, low, close) <= 0 or volume < 0:
                    raise ValueError
                if high < max(open_price, low, close) or low > min(open_price, high, close):
                    issues.append(f"{symbol} history row {index} has inconsistent OHLC values")
            except (TypeError, ValueError):
                issues.append(f"{symbol} history row {index} has invalid market values")
        if dates != sorted(set(dates)):
            issues.append(f"{symbol} history dates must be unique and ascending")
        latest = record.get("latestClose")
        if not isinstance(latest, dict):
            issues.append(f"{symbol} latestClose must be an object")
        elif latest.get("date") != history[-1].get("date") or latest.get("price") != history[-1].get("close"):
            issues.append(f"{symbol} latestClose must match its last history row")
        quote = record.get("quote")
        if not isinstance(quote, dict):
            issues.append(f"{symbol} quote must be an object")
        else:
            try:
                if float(quote.get("price", 0)) <= 0:
                    raise ValueError
                datetime.fromisoformat(str(quote.get("asOf")))
                float(quote.get("netChange"))
                float(quote.get("percentChange"))
            except (TypeError, ValueError):
                issues.append(f"{symbol} quote has invalid values")
    return issues


def write_if_changed(path: Path, payload: dict[str, object]) -> bool:
    """Write the snapshot unless only its generation timestamp changed."""

    if path.exists():
        try:
            current = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            current = None
        if isinstance(current, dict):
            comparable_current = {key: value for key, value in current.items() if key != "generatedAt"}
            comparable_new = {key: value for key, value in payload.items() if key != "generatedAt"}
            if comparable_current == comparable_new:
                print(f"No new market session; left {path} unchanged")
                return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote DCA market snapshot to {path}")
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument(
        "--quotes-only",
        action="store_true",
        help="Write only the last-sale quote file used by the live browser feed.",
    )
    parser.add_argument(
        "--as-of",
        type=date.fromisoformat,
        default=date.today(),
        help="End date for history requests in YYYY-MM-DD format.",
    )
    parser.add_argument(
        "--lookback-days",
        type=int,
        default=420,
        help="Calendar-day history window; 420 covers at least 200 sessions.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    quotes = {symbol: fetch_quote(symbol) for symbol in SYMBOLS}
    if args.quotes_only:
        payload = build_quotes_payload(quotes, generated_at=generated_at)
        output = args.output or DEFAULT_QUOTES_OUTPUT
        write_if_changed(output, payload)
        return
    if args.lookback_days < 300:
        raise SystemExit("--lookback-days must be at least 300")
    start = args.as_of - timedelta(days=args.lookback_days)
    histories = {
        symbol: fetch_history(symbol, start, args.as_of) for symbol in SYMBOLS
    }
    payload = build_payload(
        histories,
        generated_at=generated_at,
        quotes=quotes,
    )
    write_if_changed(args.output or DEFAULT_OUTPUT, payload)


if __name__ == "__main__":
    main()
