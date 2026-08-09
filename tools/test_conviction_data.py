from __future__ import annotations

import copy
import csv
import json
import math
import unittest
from pathlib import Path

from tools.check_site import validate_conviction_payload
from tools.finance.generate_conviction_history import (
    build_payload,
    load_imported_transactions,
    payload_matches_generator_inputs,
    payload_without_generated_at,
)


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "conviction_tsla_history.json"
IMPORT_PATH = ROOT / "data" / "tsla_transactions.csv"


class ConvictionPayloadTests(unittest.TestCase):
    def setUp(self) -> None:
        self.payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    def test_committed_payload_is_internally_consistent(self) -> None:
        self.assertEqual(validate_conviction_payload(self.payload), [])

    def test_committed_payload_matches_tracked_generator_inputs(self) -> None:
        generated = build_payload(generated_at="2000-01-01T00:00:00Z")

        self.assertEqual(
            payload_without_generated_at(self.payload),
            payload_without_generated_at(generated),
        )

    def test_freshness_comparison_ignores_only_generation_time(self) -> None:
        generated = copy.deepcopy(self.payload)
        generated["generatedAt"] = "2000-01-01T00:00:00Z"
        self.assertTrue(payload_matches_generator_inputs(self.payload, generated))

        generated["summary"]["currentShares"] += 1
        self.assertFalse(payload_matches_generator_inputs(self.payload, generated))

    def test_detects_summary_and_transaction_corruption(self) -> None:
        payload = copy.deepcopy(self.payload)
        payload["summary"]["totalTransactions"] += 1
        payload["summary"]["currentShares"] += 1
        payload["transactions"][0]["shares"] = math.nan

        issues = validate_conviction_payload(payload)
        self.assertIn("transactions[0].shares must be finite and positive", issues)
        self.assertIn("summary.totalTransactions does not match transactions", issues)
        self.assertIn("summary.currentShares does not match transactions", issues)

    def test_detects_cash_flow_currency_mismatch(self) -> None:
        payload = copy.deepcopy(self.payload)
        payload["transactions"][0]["cashFlowUsd"] *= 2

        issues = validate_conviction_payload(payload)
        self.assertIn(
            "transactions[0].cashFlowUsd does not match USD trade notional", issues
        )

    def test_imported_cash_flows_convert_statement_base_currency_to_usd(self) -> None:
        with IMPORT_PATH.open(newline="", encoding="utf-8") as handle:
            rows = list(csv.reader(handle))
        latest = next(
            row
            for row in rows
            if row[:2] == ["Transaction History", "Data"] and row[6] == "TSLA"
        )
        _start, _end, imported = load_imported_transactions()

        self.assertAlmostEqual(
            imported[-1]["cashFlowUsd"], float(latest[12]) / float(latest[13]), 6
        )

    def test_detects_monthly_aggregation_and_order_corruption(self) -> None:
        payload = copy.deepcopy(self.payload)
        payload["monthlySeries"][0]["netShares"] += 1
        payload["monthlySeries"][1]["period"] = payload["monthlySeries"][0]["period"]

        issues = validate_conviction_payload(payload)
        self.assertTrue(
            any("monthlySeries periods must be unique and increasing" in issue for issue in issues)
        )
        self.assertTrue(any("monthlySeries[0].netShares" in issue for issue in issues))

    def test_detects_benchmark_point_and_summary_corruption(self) -> None:
        payload = copy.deepcopy(self.payload)
        payload["benchmarkComparison"]["points"][-1]["differenceUsd"] += 1
        payload["benchmarkComparison"]["summary"]["finalSpyValueUsd"] += 1
        payload["benchmarkComparison"]["meta"]["benchmarkSymbol"] = "QQQ"
        payload["benchmarkComparison"]["meta"]["baseCurrency"] = "SGD"
        payload["sourceSheet"] = ""

        issues = validate_conviction_payload(payload)
        self.assertIn("sourceSheet must be non-empty", issues)
        self.assertIn("benchmark meta symbols must be TSLA and SPY", issues)
        self.assertIn("benchmark base currency must be USD", issues)
        self.assertTrue(
            any("differenceUsd does not match transaction benchmark" in issue for issue in issues)
        )
        self.assertIn("benchmark summary.finalSpyValueUsd does not match final point", issues)


if __name__ == "__main__":
    unittest.main()
