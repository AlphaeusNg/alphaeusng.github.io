#!/usr/bin/env python3
"""
Net Worth Tracker Excel Data Extractor (Robust, Zero-Dependency Version)
------------------------------------------------------------------------
Tailored for the specific "Networth Tracker.xlsx" used by the Alphaeus
conviction page (sheets: Main, Data, "Clean usd price from ibkr",
"Minus off Sell shares Transac", "Theoretical Transaction History").

This version uses ONLY Python standard library (zipfile + xml.etree.ElementTree).
No pandas, no openpyxl required. Works on any Python 3.8+ installation.

USAGE (local machine with your copy of the .xlsx):
    python tools/extract_networth_data.py "Networth Tracker.xlsx"
    # or with full path:
    python tools/extract_networth_data.py "/path/to/Networth Tracker.xlsx"

WHAT IT EXTRACTS (auto-detected):
  1. Time-series net worth from the "Data" sheet (Table1):
       - Monthly periods (Date/Cash/Stock/CPF/Networth/Debt)
       - Clean labels (YYYY-MM) + values for Chart.js line chart
  2. High-conviction position tracking (share counts over time):
       - Dominant symbol detection (TSLA in this file)
       - Current adjusted share count (post-split)
       - Sampled history points from the transaction log
  3. IBKR / brokerage transaction summary:
       - Total txns, symbols traded, accounts, date range
       - Actual vs Theoretical distinction noted (sheet4 vs sheet5)
  4. Latest snapshot from "Main" sheet (current Net Worth, allocations)

OUTPUTS:
  - networth_data.json (in same dir as input xlsx) — full structured export
  - Console blocks ready to paste directly into pages/conviction.html:
      * networthData.labels / .values
      * positionData (for future second chart or tooltip enrichment)
      * ibkrSummary (for display / logging)

The data model matches what the browser-based SheetJS loader in
pages/conviction.html also understands, so drag-and-drop produces identical
Chart.js updates.

This script is intentionally verbose in comments so future maintainers
(or the page author) can adapt it when the tracker format evolves.

GitHub Pages note: Run locally, commit only the resulting .json (or
hardcode the arrays). Never commit the .xlsx itself.
"""

import zipfile
import xml.etree.ElementTree as ET
import json
import sys
import re
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from typing import Any, Dict, List, Optional, Tuple

# ============================================================
# LOW-LEVEL XLSX (ZIP + XML) PARSERS — NO PANDAS / OPENPYXL
# ============================================================

def _ns(root: ET.Element) -> str:
    """Return the default namespace string for use in find/findall."""
    if root.tag.startswith("{"):
        return root.tag.split("}")[0] + "}"
    return ""


def load_shared_strings(zf: zipfile.ZipFile) -> List[str]:
    """Load the sharedStrings.xml table into a 0-based list."""
    try:
        with zf.open("xl/sharedStrings.xml") as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = _ns(root)
            strings: List[str] = []
            for si in root.findall(f".//{ns}si"):
                t = si.find(f"{ns}t")
                strings.append(t.text if t is not None and t.text is not None else "")
            return strings
    except KeyError:
        return []


def cell_value(cell: ET.Element, shared: List[str], ns: str) -> Any:
    """Resolve a <c> cell's value, handling shared-string lookups."""
    t_attr = cell.get("t", "n")
    v = cell.find(f"{ns}v")
    if v is None or v.text is None:
        return None
    raw = v.text
    if t_attr == "s":  # shared string
        try:
            idx = int(raw)
            return shared[idx] if 0 <= idx < len(shared) else raw
        except (ValueError, IndexError):
            return raw
    if t_attr in ("n", "d"):
        try:
            return float(raw)
        except ValueError:
            return raw
    return raw


def parse_sheet(zf: zipfile.ZipFile, sheet_path: str, shared: List[str]) -> List[Dict[str, Any]]:
    """
    Return list of rows for a worksheet.
    Each row: {"row": int, "cells": { "A": val, "B": val, ... }}
    """
    try:
        with zf.open(sheet_path) as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = _ns(root)
            sheet_data = root.find(f"{ns}sheetData")
            if sheet_data is None:
                return []

            rows: List[Dict[str, Any]] = []
            for row_el in sheet_data.findall(f"{ns}row"):
                rnum = int(row_el.get("r", 0))
                cells: Dict[str, Any] = {}
                for c in row_el.findall(f"{ns}c"):
                    ref = c.get("r", "")
                    col = "".join(ch for ch in ref if ch.isalpha())
                    if col:
                        cells[col] = cell_value(c, shared, ns)
                rows.append({"row": rnum, "cells": cells})
            return rows
    except KeyError:
        return []


def excel_date(serial: Any) -> Optional[datetime]:
    """Convert Excel serial date (days since 1899-12-30) to datetime."""
    try:
        s = float(serial)
        # Excel epoch handling (correct for 1900 bug)
        if s < 60:
            s += 1
        return datetime(1899, 12, 30) + timedelta(days=s)
    except (TypeError, ValueError):
        return None


def format_period(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


# ============================================================
# HIGH-LEVEL EXTRACTORS FOR THIS SPECIFIC WORKBOOK
# ============================================================

def find_sheet_by_name(zf: zipfile.ZipFile, target_names: List[str]) -> Optional[str]:
    """Return internal path xl/worksheets/sheetN.xml for a logical sheet name."""
    try:
        with zf.open("xl/workbook.xml") as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = _ns(root)
            for sheet in root.findall(f".//{ns}sheet"):
                name = sheet.get("name", "")
                if any(t.lower() in name.lower() for t in target_names):
                    rid = sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
                    # Map via workbook.xml.rels
                    try:
                        with zf.open("xl/_rels/workbook.xml.rels") as relf:
                            rtree = ET.parse(relf)
                            rroot = rtree.getroot()
                            rns = _ns(rroot)
                            for rel in rroot.findall(f"{rns}Relationship"):
                                if rel.get("Id") == rid:
                                    target = rel.get("Target", "")
                                    if target.startswith("worksheets/"):
                                        return f"xl/{target}"
                    except Exception:
                        pass
    except Exception:
        pass
    return None


def auto_detect_data_sheet(zf: zipfile.ZipFile, shared: List[str]) -> Tuple[Optional[str], List[Dict[str, Any]]]:
    """
    Find the monthly net-worth time series sheet.
    Prefers exact "Data" sheet name (as in this file).
    Returns (sheet_path, rows)
    """
    # Preferred explicit names from this workbook
    candidates = ["Data", "net worth", "networth", "tracker", "summary"]
    sheet_path = find_sheet_by_name(zf, candidates)
    if not sheet_path:
        # Fallback: scan first few sheets for "Date" + "Networth" headers
        for i in range(1, 6):
            p = f"xl/worksheets/sheet{i}.xml"
            rows = parse_sheet(zf, p, shared)
            if rows and rows[0]["cells"].get("A") == "Date" and "Networth" in str(rows[0]["cells"].values()):
                sheet_path = p
                break
    if not sheet_path:
        return None, []
    rows = parse_sheet(zf, sheet_path, shared)
    return sheet_path, rows


def extract_networth_time_series(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    From the Data sheet rows, build clean monthly series.
    Uses the known columns from this file: A=Date, B=Cash, C=Stock, D=CPF, E=Networth, F=Debt
    """
    series: List[Dict[str, Any]] = []
    seen: Dict[str, Dict[str, Any]] = {}

    for r in rows:
        cells = r["cells"]
        if cells.get("A") == "Date" or not cells.get("E"):
            continue
        dt = excel_date(cells.get("A"))
        if not dt:
            continue
        try:
            net = float(cells.get("E"))
        except (TypeError, ValueError):
            continue

        period = format_period(dt)
        entry = {
            "period": period,
            "date": dt.strftime("%Y-%m-%d"),
            "netWorth": round(net, 2),
            "cash": round(float(cells.get("B") or 0), 2),
            "stock": round(float(cells.get("C") or 0), 2),
            "cpf": round(float(cells.get("D") or 0), 2),
            "debt": round(float(cells.get("F") or 0), 2),
        }
        # Keep the last entry per month (handles duplicates / end-of-month snapshots)
        seen[period] = entry

    for p in sorted(seen.keys()):
        series.append(seen[p])
    return series


def auto_detect_transaction_sheets(zf: zipfile.ZipFile, shared: List[str]) -> List[Tuple[str, List[Dict[str, Any]]]]:
    """
    Locate the two transaction history sheets used for position tracking.
    Returns list of (logical_name, rows)
    """
    results = []
    for candidate in ["Transac", "Theoretical", "Minus off", "Transaction"]:
        sp = find_sheet_by_name(zf, [candidate])
        if sp:
            rows = parse_sheet(zf, sp, shared)
            if rows and any("Symbol" in str(c) for c in rows[0]["cells"].values()):
                results.append((candidate, rows))
    return results


def extract_high_conviction_positions(txn_rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Reconstruct approximate current share count + sampled history for the
    dominant high-conviction symbol (heavily TSLA in this file).
    Uses "Qty adjusted" (col I) when present, falls back to raw Qty (F).
    """
    if not txn_rows:
        return {}

    # Find header row
    header_row = txn_rows[0]["cells"] if txn_rows else {}
    # Data rows start after header
    data_rows = [r for r in txn_rows if r["cells"].get("A") != "Date"]

    symbol_counts: Counter = Counter()
    for r in data_rows:
        sym = str(r["cells"].get("E") or "").strip()
        if sym:
            symbol_counts[sym] += 1

    if not symbol_counts:
        return {}

    # Dominant symbol = highest txn count (TSLA wins by far)
    main_symbol = symbol_counts.most_common(1)[0][0]

    positions: Dict[str, float] = defaultdict(float)
    history_samples: List[Dict[str, Any]] = []
    txn_count = 0

    for r in data_rows:
        cells = r["cells"]
        dt = excel_date(cells.get("A"))
        sym = str(cells.get("E") or "").strip()
        ttype = str(cells.get("D") or "").strip()
        if not sym or ttype not in ("Buy", "Sell"):
            continue

        # Prefer adjusted quantity (post-split)
        qty_raw = cells.get("I") or cells.get("F")
        try:
            qty = float(qty_raw) if qty_raw not in (None, "", "-") else 0.0
        except (TypeError, ValueError):
            qty = 0.0

        if ttype == "Sell" and qty > 0:
            qty = -qty

        positions[sym] += qty
        txn_count += 1

        # Sample roughly yearly for the main symbol (for chart / tooltip use)
        if sym == main_symbol and dt and (len(history_samples) == 0 or (dt - excel_date(history_samples[-1].get("_dt_serial"))) > timedelta(days=300)):
            history_samples.append({
                "period": format_period(dt),
                "shares": round(positions[sym], 2),
                "_dt_serial": cells.get("A")  # temp for diff calc
            })

    # Clean temp keys
    for h in history_samples:
        h.pop("_dt_serial", None)

    current = round(positions.get(main_symbol, 0), 2)

    return {
        "symbol": main_symbol,
        "currentShares": current,
        "totalTransactionsAnalyzed": txn_count,
        "historySample": history_samples[:8],  # keep small
        "note": "Adjusted for splits (3:1 on TSLA). Sheet4 subtracts sells for actual holdings; sheet5 is theoretical."
    }


def extract_ibkr_summary(zf: zipfile.ZipFile, txn_sheets: List[Tuple[str, List[Dict[str, Any]]]], shared: List[str]) -> Dict[str, Any]:
    """Lightweight summary of brokerage activity."""
    all_txns = 0
    symbols: Counter = Counter()
    accounts: Counter = Counter()
    date_min = None
    date_max = None

    for _, rows in txn_sheets:
        for r in rows:
            cells = r["cells"]
            if cells.get("A") == "Date":
                continue
            sym = str(cells.get("E") or "").strip()
            ttype = str(cells.get("D") or "").strip()
            if not sym or ttype not in ("Buy", "Sell", "Transfer"):
                continue
            all_txns += 1
            symbols[sym] += 1
            acct = str(cells.get("B") or "").strip()
            if acct:
                accounts[acct] += 1
            dt = excel_date(cells.get("A"))
            if dt:
                if date_min is None or dt < date_min:
                    date_min = dt
                if date_max is None or dt > date_max:
                    date_max = dt

    return {
        "totalTransactions": all_txns,
        "symbols": dict(symbols),
        "accounts": dict(accounts),
        "earliestDate": date_min.strftime("%Y-%m-%d") if date_min else None,
        "latestDate": date_max.strftime("%Y-%m-%d") if date_max else None,
        "sheetsUsed": [name for name, _ in txn_sheets],
        "note": "Primary high-conviction flow is long-term DCA into TSLA via IBKR (and prior SC account). PLTR activity was mostly 2022 options + sales."
    }


def extract_main_snapshot(zf: zipfile.ZipFile, shared: List[str]) -> Dict[str, Any]:
    """Pull the current headline numbers from the Main dashboard sheet."""
    sp = find_sheet_by_name(zf, ["Main"])
    if not sp:
        return {}
    rows = parse_sheet(zf, sp, shared)
    snap: Dict[str, Any] = {}
    for r in rows[:40]:
        for col, val in r["cells"].items():
            if val is not None:
                snap[f"{col}{r['row']}"] = val

    # Known interesting cells from structural analysis (best-effort)
    return {
        "lastUpdated": snap.get("C1"),
        "netWorth": snap.get("F3"),
        "realLiquidCash": snap.get("F4"),
        "stock": snap.get("C5"),
        "cpfOA": snap.get("C6"),
        "cpfMA": snap.get("C7"),
        "cpfSA": snap.get("C8"),
        "rawCellsSample": {k: snap[k] for k in ["F3", "C5", "F23"] if k in snap},
        "note": "Main sheet contains the live dashboard view. Two slightly different net worth snapshots sometimes visible (different update stages)."
    }


# ============================================================
# MAIN ENTRY
# ============================================================

def extract_networth_data(excel_path: str) -> None:
    path = Path(excel_path)
    if not path.exists():
        print(f"ERROR: File not found: {excel_path}")
        return

    print(f"Analyzing (stdlib XML parser): {path}\n")

    try:
        with zipfile.ZipFile(path, "r") as zf:
            shared = load_shared_strings(zf)
            print(f"Shared strings loaded: {len(shared)} entries")

            # 1. Time series from Data sheet
            data_path, data_rows = auto_detect_data_sheet(zf, shared)
            print(f"Data sheet: {data_path or 'NOT FOUND'}")
            networth_series = extract_networth_time_series(data_rows)
            print(f"  → Extracted {len(networth_series)} monthly periods")

            # 2. Transaction sheets → position + IBKR summary
            txn_sheets = auto_detect_transaction_sheets(zf, shared)
            print(f"Transaction sheets found: {[n for n, _ in txn_sheets]}")
            position = extract_high_conviction_positions(
                txn_sheets[0][1] if txn_sheets else []
            )
            ibkr = extract_ibkr_summary(zf, txn_sheets, shared)

            # 3. Main snapshot
            main_snap = extract_main_snapshot(zf, shared)

    except Exception as e:
        print(f"Fatal error opening/parsing xlsx: {e}")
        return

    # ============================================================
    # BUILD OUTPUT ARTIFACTS
    # ============================================================

    full_export = {
        "sourceFile": str(path.name),
        "extractedAt": datetime.now().isoformat(timespec="seconds"),
        "netWorthTimeSeries": networth_series,
        "highConvictionPosition": position,
        "ibkrTransactionSummary": ibkr,
        "mainSheetSnapshot": main_snap,
        "usage": {
            "chartjsNetWorthLabels": [row["period"] for row in networth_series],
            "chartjsNetWorthValues": [row["netWorth"] for row in networth_series],
        }
    }

    # Write JSON beside the source file
    out_json = path.parent / "networth_data.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(full_export, f, indent=2)
    print(f"\n✓ Full structured data written to: {out_json}")

    # ============================================================
    # READY-TO-PASTE CHART.JS BLOCKS (exactly what pages/conviction.html expects)
    # ============================================================

    labels = [row["period"] for row in networth_series]
    values = [row["netWorth"] for row in networth_series]

    print("\n" + "=" * 64)
    print("PASTE THE FOLLOWING INTO pages/conviction.html (replace the networthData const)")
    print("=" * 64)
    print("""
const networthData = {
    labels: %s,
    values: %s
};
""" % (json.dumps(labels), json.dumps(values)))

    print("\n" + "=" * 64)
    print("OPTIONAL: Position / conviction holding data (for second chart or info box)")
    print("=" * 64)
    print(json.dumps({
        "symbol": position.get("symbol"),
        "currentShares": position.get("currentShares"),
        "historySample": position.get("historySample", [])
    }, indent=2))

    print("\n" + "=" * 64)
    print("IBKR / TRANSACTION SUMMARY (for page text or console)")
    print("=" * 64)
    print(json.dumps(ibkr, indent=2))

    print("\n✓ Extraction complete. Update pages/conviction.html with the blocks above,")
    print("  or load networth_data.json from the browser drag-and-drop loader.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        default = "Networth Tracker.xlsx"
        print(f"No path given. Trying: {default} (relative to cwd)")
        extract_networth_data(default)
    else:
        extract_networth_data(sys.argv[1])
