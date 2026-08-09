#!/usr/bin/env python3

import argparse
import csv
import json
from collections import defaultdict
from datetime import UTC, date, datetime
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
IMPORT_PATH = REPO_ROOT / "data" / "tsla_transactions.csv"
LEGACY_PATH = REPO_ROOT / "tools" / "finance" / "tsla_trades_anonymized.csv"
PRICE_PATH = REPO_ROOT / "tools" / "finance" / "tsla-vs-spy.json"
OUTPUT_PATH = REPO_ROOT / "data" / "conviction_tsla_history.json"
POST_SPLIT_BASIS_DATE = date(2022, 8, 25)


def parse_period_window(value: str) -> tuple[date, date]:
    start_text, end_text = [part.strip() for part in value.split(" - ", 1)]
    return (
        datetime.strptime(start_text, "%B %d, %Y").date(),
        datetime.strptime(end_text, "%B %d, %Y").date(),
    )


def month_key(day: date) -> str:
    return f"{day.year:04d}-{day.month:02d}"


def month_start(day: date) -> date:
    return date(day.year, day.month, 1)


def iter_months(start_day: date, end_day: date):
    current = month_start(start_day)
    end_month = month_start(end_day)
    while current <= end_month:
        yield current
        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.year, current.month + 1, 1)


def load_imported_transactions():
    with IMPORT_PATH.open(newline="") as handle:
        rows = list(csv.reader(handle))

    period_row = next(row for row in rows if row[:3] == ["Statement", "Data", "Period"])
    report_start, report_end = parse_period_window(period_row[3])
    base_currency_row = next(
        row for row in rows if row[:3] == ["Summary", "Data", "Base Currency"]
    )
    base_currency = base_currency_row[3]

    imported = []
    for row in rows:
        if len(row) < 16 or row[0] != "Transaction History" or row[1] != "Data":
            continue
        if row[5] not in {"Buy", "Sell"} or row[6] != "TSLA":
            continue
        if row[9] != "USD":
            raise ValueError(f"expected USD TSLA price currency, found {row[9]}")

        trade_date = datetime.strptime(row[2], "%Y-%m-%d").date()
        raw_shares = abs(float(row[7]))
        raw_price = float(row[8])
        if trade_date < POST_SPLIT_BASIS_DATE:
            shares = raw_shares * 3
            price = raw_price / 3
        else:
            shares = raw_shares
            price = raw_price

        net_amount = float(row[12])
        cash_flow_usd = (
            net_amount if base_currency == "USD" else net_amount / float(row[13])
        )
        imported.append(
            {
                "date": trade_date,
                "period": month_key(trade_date),
                "account": row[3],
                "type": row[5],
                "shares": round(shares, 4),
                "priceUsd": round(price, 6),
                "cashFlowUsd": round(cash_flow_usd, 6),
                "source": "imported",
            }
        )

    imported.sort(key=lambda entry: (entry["date"], entry["type"] != "Buy", entry["shares"]))
    return report_start, report_end, imported


def load_legacy_supplement(report_start: date, first_import_date: date, default_account: str):
    supplement = []
    if not LEGACY_PATH.exists():
        return supplement

    with LEGACY_PATH.open(newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            trade_date = datetime.strptime(row["trade_date"], "%Y-%m-%d").date()
            if not (report_start <= trade_date < first_import_date):
                continue

            shares = round(abs(float(row["qty_adjusted"])), 4)
            price = round(float(row["price_adjusted_usd"]), 6)
            trade_type = "Buy" if row["side"].upper() == "BUY" else "Sell"
            gross_notional = round(shares * price, 6)
            cash_flow = -gross_notional if trade_type == "Buy" else gross_notional

            supplement.append(
                {
                    "date": trade_date,
                    "period": month_key(trade_date),
                    "account": default_account,
                    "type": trade_type,
                    "shares": shares,
                    "priceUsd": price,
                    "cashFlowUsd": cash_flow,
                    "source": "legacy_supplement",
                }
            )

    supplement.sort(key=lambda entry: (entry["date"], entry["type"] != "Buy", entry["shares"]))
    return supplement


def build_monthly_series(transactions):
    buckets = defaultdict(
        lambda: {
            "buyShares": 0.0,
            "sellShares": 0.0,
            "netShares": 0.0,
            "transactions": 0,
            "capitalDeployedUsd": 0.0,
            "saleProceedsUsd": 0.0,
        }
    )

    for entry in transactions:
        bucket = buckets[entry["period"]]
        bucket["transactions"] += 1
        if entry["type"] == "Buy":
            bucket["buyShares"] += entry["shares"]
            bucket["netShares"] += entry["shares"]
            bucket["capitalDeployedUsd"] += -entry["cashFlowUsd"]
        else:
            bucket["sellShares"] += entry["shares"]
            bucket["netShares"] -= entry["shares"]
            bucket["saleProceedsUsd"] += entry["cashFlowUsd"]

    cumulative = 0.0
    series = []
    for period in sorted(buckets):
        bucket = buckets[period]
        cumulative += bucket["netShares"]
        series.append(
            {
                "period": period,
                "buyShares": round(bucket["buyShares"], 4),
                "sellShares": round(bucket["sellShares"], 4),
                "netShares": round(bucket["netShares"], 4),
                "cumulativeShares": round(cumulative, 4),
                "transactions": bucket["transactions"],
                "capitalDeployedUsd": round(bucket["capitalDeployedUsd"], 2),
                "saleProceedsUsd": round(bucket["saleProceedsUsd"], 2),
            }
        )
    return series


def load_price_history():
    payload = json.loads(PRICE_PATH.read_text())
    lookup = {}
    for point in payload["points"]:
        lookup[point["month"][:7]] = {
            "tsla": point["tsla_close_usd"],
            "spy": point["spy_close_usd"],
        }
    return payload, lookup


def build_benchmark(transactions, summary):
    history_payload, price_lookup = load_price_history()
    monthly_flows = defaultdict(float)
    monthly_trade_counts = defaultdict(int)
    monthly_share_deltas = defaultdict(float)

    for entry in transactions:
        period = entry["period"]
        monthly_trade_counts[period] += 1
        flow = -entry["cashFlowUsd"]
        monthly_flows[period] += flow
        monthly_share_deltas[period] += entry["shares"] if entry["type"] == "Buy" else -entry["shares"]

    first_trade = transactions[0]["date"]
    last_valuation_period = max(price_lookup)
    last_valuation_day = datetime.strptime(f"{last_valuation_period}-01", "%Y-%m-%d").date()

    tsla_shares = 0.0
    spy_units = 0.0
    net_invested = 0.0
    points = []

    for current_month in iter_months(first_trade, last_valuation_day):
        period = month_key(current_month)
        if period not in price_lookup:
            continue

        flow = monthly_flows.get(period, 0.0)
        share_delta = monthly_share_deltas.get(period, 0.0)
        prices = price_lookup[period]

        tsla_shares += share_delta
        net_invested += flow
        if flow:
            spy_units += flow / prices["spy"]

        tsla_value = tsla_shares * prices["tsla"]
        spy_value = spy_units * prices["spy"]

        points.append(
            {
                "month": f"{period}-01",
                "tslaShares": round(tsla_shares, 4),
                "spyUnits": round(spy_units, 6),
                "netInvestedCapitalUsd": round(net_invested, 2),
                "monthlyTslaShareDelta": round(share_delta, 4),
                "monthlyCapitalFlowUsd": round(flow, 2),
                "tradeCount": monthly_trade_counts.get(period, 0),
                "tslaCloseUsd": round(prices["tsla"], 2),
                "spyCloseUsd": round(prices["spy"], 2),
                "tslaValueUsd": round(tsla_value, 2),
                "spyValueUsd": round(spy_value, 2),
                "differenceUsd": round(tsla_value - spy_value, 2),
            }
        )

    final_point = points[-1]
    return {
        "meta": {
            "seriesType": "tsla_vs_spy_benchmark_monthly",
            "baseCurrency": "USD",
            "valuationFrequency": "monthly_close",
            "firstTransactionDate": summary["firstTransactionDate"],
            "lastTransactionDate": summary["latestTransactionDate"],
            "tslaSymbol": "TSLA",
            "benchmarkSymbol": "SPY",
            "benchmarkLabel": "S&P 500 via SPY",
            "benchmarkMethod": "signed_cash_flows_monthly_close",
            "benchmarkUnitRule": "positive monthly cash flow buys SPY units at that month's close and negative flow redeems them",
            "priceBasis": "split_adjusted_monthly_close",
            "cashFlowBasis": "monthly net trade flow derived from the reconciled TSLA ledger",
            "supportsFractionalBenchmarkUnits": True,
            "sourceHistory": history_payload["meta"]["source_history"],
        },
        "summary": {
            "currentHoldingsShares": summary["currentShares"],
            "netInvestedCapitalUsd": round(final_point["netInvestedCapitalUsd"], 2),
            "finalTslaValueUsd": final_point["tslaValueUsd"],
            "finalSpyValueUsd": final_point["spyValueUsd"],
            "finalDifferenceUsd": final_point["differenceUsd"],
            "valuationMonth": final_point["month"],
        },
        "points": points,
    }


def payload_without_generated_at(payload):
    return {key: value for key, value in payload.items() if key != "generatedAt"}


def payload_matches_generator_inputs(committed, generated):
    return payload_without_generated_at(committed) == payload_without_generated_at(
        generated
    )


def build_payload(*, generated_at=None):
    report_start, _report_end, imported = load_imported_transactions()
    first_import_date = min(entry["date"] for entry in imported)
    default_account = imported[0]["account"]
    supplement = load_legacy_supplement(report_start, first_import_date, default_account)

    transactions = sorted(
        supplement + imported,
        key=lambda entry: (entry["date"], entry["type"] != "Buy", entry["shares"], entry.get("source", "imported")),
    )

    monthly_series = build_monthly_series(transactions)
    buys = [entry for entry in transactions if entry["type"] == "Buy"]
    sells = [entry for entry in transactions if entry["type"] == "Sell"]

    summary = {
        "firstTransactionDate": transactions[0]["date"].isoformat(),
        "latestTransactionDate": transactions[-1]["date"].isoformat(),
        "buyTransactions": len(buys),
        "sellTransactions": len(sells),
        "totalTransactions": len(transactions),
        "currentShares": monthly_series[-1]["cumulativeShares"],
        "grossBoughtShares": round(sum(entry["shares"] for entry in buys), 4),
        "grossSoldShares": round(sum(entry["shares"] for entry in sells), 4),
        "capitalDeployedUsd": round(sum(-entry["cashFlowUsd"] for entry in buys), 2),
        "saleProceedsUsd": round(sum(entry["cashFlowUsd"] for entry in sells), 2),
        "accounts": sorted({entry["account"] for entry in transactions}),
    }

    payload = {
        "symbol": "TSLA",
        "sourceFile": "data/tsla_transactions.csv + tools/finance/tsla_trades_anonymized.csv",
        "sourceSheet": "IBKR transaction export reconciled with recovered in-period Nov 2020 to Feb 2021 TSLA buys",
        "generatedAt": generated_at
        or datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "summary": summary,
        "monthlySeries": monthly_series,
        "transactions": [
            {
                "date": entry["date"].isoformat(),
                "period": entry["period"],
                "account": entry["account"],
                "type": entry["type"],
                "shares": entry["shares"],
                "priceUsd": entry["priceUsd"],
                "cashFlowUsd": round(entry["cashFlowUsd"], 6),
            }
            for entry in transactions
        ],
        "benchmarkComparison": build_benchmark(transactions, summary),
    }
    return payload


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate the public conviction transaction and benchmark payload."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail without writing if tracked inputs do not match the committed payload.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    payload = build_payload()

    if args.check:
        committed = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
        if not payload_matches_generator_inputs(committed, payload):
            raise SystemExit(
                "Conviction payload is stale; run "
                "python3 tools/finance/generate_conviction_history.py and review the diff."
            )
        print(f"OK: {OUTPUT_PATH} matches tracked generator inputs")
        return

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")
    summary = payload["summary"]
    print(
        json.dumps(
            {
                "currentShares": summary["currentShares"],
                "capitalDeployedUsd": summary["capitalDeployedUsd"],
                "saleProceedsUsd": summary["saleProceedsUsd"],
                "finalTslaValueUsd": payload["benchmarkComparison"]["summary"]["finalTslaValueUsd"],
                "finalSpyValueUsd": payload["benchmarkComparison"]["summary"]["finalSpyValueUsd"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
