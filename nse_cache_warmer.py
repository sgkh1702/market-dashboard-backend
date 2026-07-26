#!/usr/bin/env python3
"""
nse_cache_warmer.py

Single standalone script to build/update SQLite cache for NSE stocks.

Usage:
    python nse_cache_warmer.py
"""

import os
import csv
import json
import time
import math
import sqlite3
from pathlib import Path
from datetime import datetime, UTC

import requests
import yfinance as yf

BASE_DIR = Path(__file__).resolve().parent
CACHE_DB = str(BASE_DIR / "research_cache.db")
STATE_FILE = str(BASE_DIR / "cache_state.json")
FAILED_LOG = str(BASE_DIR / "failed_symbols.csv")
NSE_LIST_URL = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"


def safe_float(x):
    try:
        if x is None:
            return None
        if isinstance(x, str) and x.strip() == "":
            return None
        v = float(x)
        if math.isnan(v):
            return None
        return v
    except Exception:
        return None


def pct_to_percent(x):
    v = safe_float(x)
    if v is None:
        return None
    return round(v * 100, 2)


def init_cache():
    conn = sqlite3.connect(CACHE_DB)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS research (
            symbol TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            source TEXT,
            timestamp REAL
        )
    """)
    conn.commit()
    conn.close()
    print("Cache DB:", CACHE_DB)


def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"index": 0, "last_symbol": ""}


def save_state(index, symbol):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump({"index": index, "last_symbol": symbol}, f)


def log_failed(symbol, reason):
    new_file = not os.path.exists(FAILED_LOG)
    with open(FAILED_LOG, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if new_file:
            writer.writerow(["symbol", "time", "reason"])
        writer.writerow([symbol, datetime.now().isoformat(), str(reason)])


def save_to_cache(symbol, data, source):
    conn = sqlite3.connect(CACHE_DB)
    cur = conn.cursor()
    cur.execute("""
        INSERT OR REPLACE INTO research(symbol, data, source, timestamp)
        VALUES (?, ?, ?, ?)
    """, (symbol.upper(), json.dumps(data), source, time.time()))
    conn.commit()
    conn.close()


def load_nse_symbols():
    headers = {"User-Agent": "Mozilla/5.0"}
    print("Downloading NSE symbol list...")
    try:
        r = requests.get(NSE_LIST_URL, headers=headers, timeout=20)
        r.raise_for_status()
        rows = csv.DictReader(r.text.splitlines())
        symbols = []
        for row in rows:
            sym = (row.get("SYMBOL") or "").strip().upper()
            if sym:
                symbols.append(sym)
        symbols = list(dict.fromkeys(symbols))
        print(f"Loaded {len(symbols)} symbols from NSE list")
        return symbols
    except Exception as e:
        print("Could not load NSE list, using fallback list:", e)
        return ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN"]


def get_info_value(info, *keys):
    for k in keys:
        v = info.get(k)
        if v is not None:
            return v
    return None


def get_series_value(df, candidates):
    try:
        if df is None or df.empty:
            return None
        first_col = df.columns[0]
        for name in candidates:
            if name in df.index:
                return safe_float(df.loc[name, first_col])
        return None
    except Exception:
        return None


def compute_metrics(info, income_stmt, balance_sheet, cashflow):
    revenue = get_series_value(income_stmt, [
        "Total Revenue", "Operating Revenue", "Revenue"
    ])
    ebit = get_series_value(income_stmt, [
        "EBIT", "Operating Income", "Pretax Income"
    ])
    net_income = get_series_value(income_stmt, [
        "Net Income", "Net Income Common Stockholders", "Net Income From Continuing Operation Net Minority Interest"
    ])
    current_assets = get_series_value(balance_sheet, [
        "Current Assets", "Total Current Assets"
    ])
    current_liabilities = get_series_value(balance_sheet, [
        "Current Liabilities", "Total Current Liabilities"
    ])
    receivables = get_series_value(balance_sheet, [
        "Accounts Receivable", "Receivables", "Net Receivables"
    ])
    inventory = get_series_value(balance_sheet, [
        "Inventory", "Inventories"
    ])
    total_assets = get_series_value(balance_sheet, [
        "Total Assets"
    ])
    stockholder_equity = get_series_value(balance_sheet, [
        "Stockholders Equity", "Total Equity Gross Minority Interest", "Common Stock Equity"
    ])
    total_debt = get_series_value(balance_sheet, [
        "Total Debt", "Long Term Debt", "Current Debt"
    ])
    operating_cf = get_series_value(cashflow, [
        "Operating Cash Flow", "Cash Flow From Continuing Operating Activities", "Net Cash Provided By Operating Activities"
    ])
    cogs = get_series_value(income_stmt, [
        "Cost Of Revenue", "Cost of Revenue"
    ])

    pe = safe_float(get_info_value(info, "trailingPE", "forwardPE"))
    pb = safe_float(get_info_value(info, "priceToBook"))
    roe = get_info_value(info, "returnOnEquity")
    roe = pct_to_percent(roe) if roe is not None else None

    debt_equity = safe_float(get_info_value(info, "debtToEquity"))
    current_ratio = safe_float(get_info_value(info, "currentRatio"))
    net_margin = get_info_value(info, "profitMargins")
    net_margin = pct_to_percent(net_margin) if net_margin is not None else None

    operating_margin = get_info_value(info, "operatingMargins")
    operating_margin = pct_to_percent(operating_margin) if operating_margin is not None else None

    sales_growth = get_info_value(info, "revenueGrowth")
    sales_growth = pct_to_percent(sales_growth) if sales_growth is not None else None

    roce = None
    if ebit is not None and total_assets is not None and current_liabilities is not None:
        capital_employed = total_assets - current_liabilities
        if capital_employed and capital_employed != 0:
            roce = round((ebit / capital_employed) * 100, 2)

    if current_ratio is None and current_assets is not None and current_liabilities not in (None, 0):
        current_ratio = round(current_assets / current_liabilities, 2)

    if net_margin is None and revenue not in (None, 0) and net_income is not None:
        net_margin = round((net_income / revenue) * 100, 2)

    if operating_margin is None and revenue not in (None, 0) and ebit is not None:
        operating_margin = round((ebit / revenue) * 100, 2)

    cfo_pat = None
    if operating_cf is not None and net_income not in (None, 0):
        cfo_pat = round(operating_cf / net_income, 2)

    receivable_days = None
    if receivables is not None and revenue not in (None, 0):
        receivable_days = round((receivables / revenue) * 365, 2)

    inventory_days = None
    if inventory is not None:
        base = cogs if cogs not in (None, 0) else revenue
        if base not in (None, 0):
            inventory_days = round((inventory / base) * 365, 2)

    if debt_equity is None and total_debt is not None and stockholder_equity not in (None, 0):
        debt_equity = round(total_debt / stockholder_equity, 2)

    score = 0
    checks = 0
    rules = [
        pe is not None and pe > 0 and pe < 40,
        pb is not None and pb < 10,
        roe is not None and roe > 12,
        roce is not None and roce > 12,
        debt_equity is not None and debt_equity < 1.5,
        sales_growth is not None and sales_growth > 0,
        current_ratio is not None and current_ratio > 1,
        net_margin is not None and net_margin > 0,
        operating_margin is not None and operating_margin > 0,
        cfo_pat is not None and cfo_pat > 0.8,
        receivable_days is not None and receivable_days < 120,
        inventory_days is not None and inventory_days < 180,
    ]
    for r in rules:
        if r is not None:
            checks += 1
            if r:
                score += 1

    score_pct = round((score / checks) * 100) if checks > 0 else None

    return {
        "pe": pe,
        "pb": pb,
        "roe": roe,
        "roce": roce,
        "debtToEquity": debt_equity,
        "salesGrowthYoY": sales_growth,
        "currentRatio": current_ratio,
        "netMargin": net_margin,
        "operatingMargin": operating_margin,
        "cfoPat": cfo_pat,
        "receivableDays": receivable_days,
        "inventoryDays": inventory_days,
        "score": score_pct
    }


def nse_fallback(symbol):
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        url = f"https://www.nseindia.com/api/quote-equity?symbol={symbol}"
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code != 200:
            return None
        j = r.json()
        metadata = j.get("metadata", {}) or {}
        return {
            "companyName": metadata.get("companyName"),
            "sector": metadata.get("industry"),
            "industry": metadata.get("industry"),
            "pe": safe_float(metadata.get("pdSymbolPe"))
        }
    except Exception:
        return None


def fetch_full_data(symbol):

    ticker = yf.Ticker(f"{symbol}.NS")
    info = ticker.info or {}

    income_stmt = None
    balance_sheet = None
    cashflow = None

    try:
        income_stmt = ticker.income_stmt
    except Exception:
        pass

    try:
        balance_sheet = ticker.balance_sheet
    except Exception:
        pass

    try:
        cashflow = ticker.cashflow
    except Exception:
        pass

    metrics = compute_metrics(info, income_stmt, balance_sheet, cashflow)

    company_name = get_info_value(info, "shortName", "longName")
    sector = get_info_value(info, "sector")
    industry = get_info_value(info, "industry")
    description = get_info_value(info, "longBusinessSummary")
    market_cap = safe_float(get_info_value(info, "marketCap"))

    if not company_name or not sector or not industry:
        nse = nse_fallback(symbol)
        if nse:
            company_name = company_name or nse.get("companyName")
            sector = sector or nse.get("sector")
            industry = industry or nse.get("industry")
            if metrics["pe"] is None:
                metrics["pe"] = nse.get("pe")

    data = {
        "symbol": symbol,
        "company": {
            "name": company_name or symbol,
            "sector": sector,
            "industry": industry,
            "marketCap": market_cap,
            "description": description
        },
        "financial": metrics,
        "meta": {
            "source": "yfinance",
            "updatedAt": datetime.now(UTC).isoformat()
        }
    }

    return data


def process_symbol(symbol):
    try:
        data = fetch_full_data(symbol)
        save_to_cache(symbol, data, "yfinance")
        return "success"
    except Exception as e:
        log_failed(symbol, e)
        return f"failed: {e}"


def main():
    print("=" * 70)
    print("NSE CACHE WARMER - FULL FINANCIAL + FORENSIC CACHE BUILDER")
    print("=" * 70)

    init_cache()
    symbols = load_nse_symbols()
    state = load_state()
    start_idx = state.get("index", 0)

    if start_idx > 0:
        print(f"Resuming from {start_idx} : {state.get('last_symbol', '')}")

    print("Total symbols:", len(symbols))
    print("DB path:", CACHE_DB)
    print()

    success = 0
    failed = 0

    for i in range(start_idx, len(symbols)):
        symbol = symbols[i]
        print(f"[{i+1}/{len(symbols)}] {symbol:20s} ... ", end="", flush=True)

        result = process_symbol(symbol)
        if result == "success":
            print("saved")
            success += 1
        else:
            print(result)
            failed += 1

        save_state(i + 1, symbol)

        if i < len(symbols) - 1:
            time.sleep(2)

        if (i + 1) % 50 == 0:
            print(f"\nPausing 30 seconds after {i+1} symbols...\n")
            time.sleep(30)

    print("\n" + "=" * 70)
    print("DONE")
    print("Success:", success)
    print("Failed :", failed)
    print("DB     :", CACHE_DB)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted. Resume later with same command.")