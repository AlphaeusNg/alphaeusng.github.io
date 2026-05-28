#!/usr/bin/env python3
"""Generate a static TSLA-versus-SPY benchmark dataset for conviction.html.

The trade ledger is anonymized and normalized in CSV form. Market history is
fetched from Pocket Portfolio's public JSON endpoint, which returns split-
adjusted monthly candles. The resulting payload is designed for static hosting
on GitHub Pages.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Iterable
from urllib.request import urlopen


TSLA_HISTORY_URL = "https://www.pocketportfolio.app/api/tickers/TSLA/json?range=max"
SPY_HISTORY_URL = "https://www.pocketportfolio.app/api/tickers/SPY/json?range=max"


@dataclass
class Trade:
    trade_date: date
    side: str
    qty_adjusted: float
    price_adjusted_usd: float
    net_amount_usd: float

    @property
    def gross_trade_value_usd(self) -> float:
        return abs(self.qty_adjusted) * self.price_adjusted_usd

    @property
    def capital_flow_usd(self) -> float:
        """Positive means capital deployed into TSLA, negative means withdrawn."""
        if self.side == "SELL":
            return -self.gross_trade_value_usd
        return self.gross_trade_value_usd


def parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def month_key(value: date) -> str:
    return f"{value.year:04d}-{value.month:02d}"


def next_month(value: date) -> date:
    if value.month == 12:
        return date(value.year + 1, 1, 1)
    return date(value.year, value.month + 1, 1)


def read_trades(path: Path) -> list[Trade]:
    rows: list[Trade] = []
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows.append(
                Trade(
                    trade_date=parse_date(row["trade_date"]),
                    side=row["side"].upper(),
                    qty_adjusted=float(row["qty_adjusted"]),
                    price_adjusted_usd=float(row["price_adjusted_usd"]),
                    net_amount_usd=float(row["net_amount_usd"]),
                )
            )
    rows.sort(key=lambda trade: trade.trade_date)
    if not rows:
        raise SystemExit(f"No trades found in {path}")
    return rows


def load_history(source: str) -> dict[str, float]:
    if source.startswith("http://") or source.startswith("https://"):
        with urlopen(source) as response:
            payload = json.load(response)
    else:
        payload = json.loads(Path(source).read_text(encoding="utf-8"))

    data = payload.get("data")
    if not isinstance(data, list):
        raise SystemExit(f"Unexpected history payload from {source}")

    prices: dict[str, float] = {}
    for row in data:
        try:
            key = month_key(parse_date(row["date"]))
            prices[key] = float(row["close"])
        except (KeyError, TypeError, ValueError):
            continue
    if not prices:
        raise SystemExit(f"No monthly prices parsed from {source}")
    return prices


def aggregate_monthly(trades: Iterable[Trade]) -> dict[str, dict[str, float]]:
    monthly: dict[str, dict[str, float]] = defaultdict(
        lambda: {
            "tsla_shares_delta": 0.0,
            "capital_flow_usd": 0.0,
            "trade_count": 0.0,
            "buy_count": 0.0,
            "sell_count": 0.0,
        }
    )
    for trade in trades:
        bucket = monthly[month_key(trade.trade_date)]
        bucket["tsla_shares_delta"] += trade.qty_adjusted
        bucket["capital_flow_usd"] += trade.capital_flow_usd
        bucket["trade_count"] += 1
        if trade.side == "BUY":
            bucket["buy_count"] += 1
        elif trade.side == "SELL":
            bucket["sell_count"] += 1
    return monthly


def build_payload(
    trades: list[Trade],
    tsla_history: dict[str, float],
    spy_history: dict[str, float],
) -> dict[str, object]:
    monthly_trades = aggregate_monthly(trades)
    start_month = date(trades[0].trade_date.year, trades[0].trade_date.month, 1)
    shared_months = sorted(set(tsla_history) & set(spy_history))
    if not shared_months:
        raise SystemExit("TSLA and SPY history do not overlap")
    final_month_key = shared_months[-1]
    final_month = parse_date(f"{final_month_key}-01")

    tsla_shares = 0.0
    spy_units = 0.0
    net_invested_capital = 0.0
    points: list[dict[str, object]] = []

    cursor = start_month
    while month_key(cursor) <= final_month_key:
        key = month_key(cursor)
        if key not in tsla_history or key not in spy_history:
            cursor = next_month(cursor)
            continue

        trade_bucket = monthly_trades.get(key, {})
        tsla_shares += float(trade_bucket.get("tsla_shares_delta", 0.0))
        monthly_capital_flow = float(trade_bucket.get("capital_flow_usd", 0.0))
        net_invested_capital += monthly_capital_flow

        spy_close = spy_history[key]
        if spy_close == 0:
            raise SystemExit(f"Invalid SPY close for {key}")
        spy_units += monthly_capital_flow / spy_close

        tsla_close = tsla_history[key]
        tsla_value = tsla_shares * tsla_close
        spy_value = spy_units * spy_close
        difference = tsla_value - spy_value

        points.append(
            {
                "month": f"{key}-01",
                "tsla_shares": round(tsla_shares, 6),
                "spy_units": round(spy_units, 6),
                "net_invested_capital_usd": round(net_invested_capital, 2),
                "monthly_tsla_share_delta": round(float(trade_bucket.get("tsla_shares_delta", 0.0)), 6),
                "monthly_capital_flow_usd": round(monthly_capital_flow, 2),
                "trade_count": int(trade_bucket.get("trade_count", 0.0)),
                "tsla_close_usd": round(tsla_close, 2),
                "spy_close_usd": round(spy_close, 2),
                "tsla_value_usd": round(tsla_value, 2),
                "spy_value_usd": round(spy_value, 2),
                "difference_usd": round(difference, 2),
            }
        )
        cursor = next_month(cursor)

    final_point = points[-1]
    return {
        "schema_version": 1,
        "meta": {
            "series_type": "tsla_vs_spy_benchmark_monthly",
            "base_currency": "USD",
            "valuation_frequency": "monthly_close",
            "first_trade_date": trades[0].trade_date.isoformat(),
            "last_trade_date": trades[-1].trade_date.isoformat(),
            "tsla_symbol": "TSLA",
            "benchmark_symbol": "SPY",
            "benchmark_label": "S&P 500 via SPY",
            "benchmark_method": "signed_cash_flows_monthly_close",
            "benchmark_unit_rule": "positive monthly flow creates SPY units and negative monthly flow redeems SPY units at that month's close",
            "price_basis": "split_adjusted_monthly_close",
            "cash_flow_basis": "gross_trade_notional_excluding_fees",
                "supports_fractional_benchmark_units": True,
            "trade_count": len(trades),
            "source_trade_file": "tools/finance/tsla_trades_anonymized.csv",
            "source_history": {
                "tsla": TSLA_HISTORY_URL,
                "spy": SPY_HISTORY_URL,
            },
        },
        "summary": {
            "current_holdings_shares": round(final_point["tsla_shares"], 6),
            "net_invested_capital_usd": final_point["net_invested_capital_usd"],
            "final_tsla_value_usd": final_point["tsla_value_usd"],
            "final_spy_value_usd": final_point["spy_value_usd"],
            "final_difference_usd": final_point["difference_usd"],
            "valuation_month": final_point["month"],
        },
        "points": points,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--trades",
        type=Path,
        default=Path("tools/finance/tsla_trades_anonymized.csv"),
        help="Path to the normalized TSLA trade CSV.",
    )
    parser.add_argument(
        "--tsla-history",
        default=TSLA_HISTORY_URL,
        help="TSLA monthly history JSON URL or local path.",
    )
    parser.add_argument(
        "--spy-history",
        default=SPY_HISTORY_URL,
        help="SPY monthly history JSON URL or local path.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("pages/data/tsla-vs-spy.json"),
        help="Output JSON path.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    trades = read_trades(args.trades)
    tsla_history = load_history(args.tsla_history)
    spy_history = load_history(args.spy_history)
    payload = build_payload(trades, tsla_history, spy_history)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(
        f"Wrote {len(payload['points'])} monthly points "
        f"through {payload['summary']['valuation_month']} to {args.output}"
    )


if __name__ == "__main__":
    main()
