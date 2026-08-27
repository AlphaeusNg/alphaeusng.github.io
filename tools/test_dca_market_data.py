from __future__ import annotations

import copy
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

from tools.finance.generate_dca_market_data import (
    build_payload,
    build_quotes_payload,
    fetch_optional_quotes,
    parse_history_payload,
    parse_quote_payload,
    validate_payload,
    validate_quotes_payload,
    write_if_changed,
)


def nasdaq_response(rows: list[dict[str, str]]) -> dict[str, object]:
    return {
        "status": {"rCode": 200},
        "data": {"tradesTable": {"rows": rows}},
    }


ROWS = [
    {
        "date": "08/18/2026",
        "open": "$102.00",
        "high": "$105.00",
        "low": "$101.00",
        "close": "$104.00",
        "volume": "1,234,567",
    },
    {
        "date": "08/17/2026",
        "open": "$100.00",
        "high": "$103.00",
        "low": "$99.00",
        "close": "$102.00",
        "volume": "987,654",
    },
]

QUOTE = {
    "status": {"rCode": 200},
    "data": {
        "marketStatus": "Open",
        "primaryData": {
            "lastSalePrice": "$103.25",
            "netChange": "-0.75",
            "percentageChange": "-0.72%",
            "lastTradeTimestamp": "Aug 18, 2026 11:46 AM ET",
            "isRealTime": True,
        },
    },
}


class DcaMarketDataTests(unittest.TestCase):
    def setUp(self) -> None:
        self.history = parse_history_payload(nasdaq_response(ROWS), "TSLA")
        self.payload = build_payload(
            {"TSLA": self.history, "SPCX": self.history},
            generated_at="2026-08-18T22:30:00+00:00",
        )

    def test_history_is_normalized_and_sorted(self) -> None:
        self.assertEqual([row["date"] for row in self.history], ["2026-08-17", "2026-08-18"])
        self.assertEqual(self.history[-1]["close"], 104.0)
        self.assertEqual(self.history[-1]["volume"], 1_234_567)

    def test_payload_contract(self) -> None:
        self.assertEqual(validate_payload(self.payload), [])
        spcx = self.payload["symbols"]["SPCX"]
        self.assertEqual(spcx["shortName"], "SpaceX")
        self.assertEqual(spcx["ipoDate"], "2026-06-12")
        self.assertEqual(spcx["latestClose"], {"date": "2026-08-18", "price": 104.0})

    def test_quote_is_normalized_with_market_timezone(self) -> None:
        quote = parse_quote_payload(QUOTE, "TSLA")
        self.assertEqual(quote["price"], 103.25)
        self.assertEqual(quote["percentChange"], -0.0072)
        self.assertEqual(quote["asOf"], "2026-08-18T11:46:00-04:00")
        self.assertEqual(quote["timestampPrecision"], "minute")

    def test_closed_quote_retains_date_only_timestamp_without_false_precision(self) -> None:
        closed = copy.deepcopy(QUOTE)
        closed["data"]["marketStatus"] = "Closed"
        closed["data"]["primaryData"]["lastTradeTimestamp"] = "Aug 26, 2026"
        closed["data"]["primaryData"]["isRealTime"] = False
        quote = parse_quote_payload(closed, "TSLA")
        self.assertEqual(quote["asOf"], "2026-08-26")
        self.assertEqual(quote["timestampPrecision"], "date")
        self.assertFalse(quote["isRealTime"])

    def test_history_uses_latest_close_when_one_optional_quote_fails(self) -> None:
        quote = parse_quote_payload(QUOTE, "SPCX")

        def fetcher(symbol: str) -> dict[str, object]:
            if symbol == "TSLA":
                raise RuntimeError("temporary upstream error")
            return quote

        warnings = io.StringIO()
        with contextlib.redirect_stderr(warnings):
            quotes = fetch_optional_quotes(fetcher)
        payload = build_payload(
            {"TSLA": self.history, "SPCX": self.history},
            generated_at="2026-08-18T22:30:00+00:00",
            quotes=quotes,
        )

        self.assertEqual(set(quotes), {"SPCX"})
        self.assertIn("TSLA quote unavailable", warnings.getvalue())
        self.assertEqual(payload["symbols"]["TSLA"]["quote"]["asOf"], "2026-08-18")
        self.assertEqual(
            payload["symbols"]["TSLA"]["quote"]["timestampPrecision"], "date"
        )
        self.assertEqual(payload["symbols"]["SPCX"]["quote"], quote)

    def test_live_quote_payload_contains_both_symbols(self) -> None:
        quote = parse_quote_payload(QUOTE, "TSLA")
        payload = build_quotes_payload(
            {"TSLA": quote, "SPCX": quote},
            generated_at="2026-08-18T16:05:00+00:00",
        )
        self.assertEqual(validate_quotes_payload(payload), [])
        self.assertEqual(payload["symbols"]["TSLA"]["price"], 103.25)

    def test_invalid_history_and_latest_are_reported(self) -> None:
        broken = copy.deepcopy(self.payload)
        broken["symbols"]["TSLA"]["history"].reverse()
        broken["symbols"]["SPCX"]["latestClose"]["price"] = 1
        issues = validate_payload(broken)
        self.assertTrue(any("unique and ascending" in issue for issue in issues))
        self.assertTrue(any("latestClose must match" in issue for issue in issues))

    def test_unchanged_snapshot_preserves_generation_time(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "market.json"
            self.assertTrue(write_if_changed(path, self.payload))
            newer = copy.deepcopy(self.payload)
            newer["generatedAt"] = "2026-08-19T22:30:00+00:00"
            self.assertFalse(write_if_changed(path, newer))
            stored = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(stored["generatedAt"], "2026-08-18T22:30:00+00:00")


if __name__ == "__main__":
    unittest.main()
