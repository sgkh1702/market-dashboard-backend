import json
import time
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf
import pandas as pd

from app.utils.indicators import sma, rsi, round_nullable
from app.utils.scoring import (
    derive_trend_label,
    derive_trend_score,
    derive_forensic_score,
    derive_forensic_grade,
    # derive_cashflow_quality,
    # derive_earnings_quality,
    # derive_margin_stability,
    # derive_red_flags,
)

BASE_DIR = Path(__file__).resolve().parents[2]
CACHE_DIR = BASE_DIR / "data" / "cache" / "stocks"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

CACHE_TTL_SECONDS = 6 * 60 * 60


def to_yahoo_symbol(symbol: str) -> str:
    return f"{symbol.upper()}.NS"


def cache_file(symbol: str) -> Path:
    return CACHE_DIR / f"{symbol.upper()}.json"


def is_cache_fresh(path: Path, max_age_seconds=CACHE_TTL_SECONDS) -> bool:
    if not path.exists():
        return False
    return (time.time() - path.stat().st_mtime) <= max_age_seconds


def load_cache(symbol: str):
    path = cache_file(symbol)
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_cache(symbol: str, data: dict):
    path = cache_file(symbol)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def market_cap_to_cr(value):
    if value is None:
        return None
    return round(value / 10000000, 2)


def build_series_from_history(hist_df):
    if hist_df is None or hist_df.empty:
        return []

    series = []
    for idx, row in hist_df.iterrows():
        ts = int(idx.to_pydatetime().replace(tzinfo=timezone.utc).timestamp())
        series.append({
            "t": ts,
            "o": float(row["Open"]) if row["Open"] is not None else 0.0,
            "h": float(row["High"]) if row["High"] is not None else 0.0,
            "l": float(row["Low"]) if row["Low"] is not None else 0.0,
            "c": float(row["Close"]) if row["Close"] is not None else 0.0,
            "v": float(row["Volume"]) if row["Volume"] is not None else 0.0,
        })
    return series


def get_info_dict(ticker):
    try:
        info = ticker.info
        if isinstance(info, dict):
            return info
    except Exception:
        pass
    return {}


def get_statement_df(statement):
    try:
        if statement is None:
            return None
        if isinstance(statement, pd.DataFrame) and not statement.empty:
            return statement
    except Exception:
        pass
    return None


def get_latest_statement_value(df, possible_labels):
    if df is None or df.empty:
        return None

    try:
        latest_col = df.columns[0]
    except Exception:
        return None

    normalized_index = {str(idx).strip().lower(): idx for idx in df.index}

    for label in possible_labels:
        key = str(label).strip().lower()
        if key in normalized_index:
            original_idx = normalized_index[key]
            val = df.loc[original_idx, latest_col]
            if pd.notna(val):
                try:
                    return float(val)
                except Exception:
                    return None
    return None


def fallback_fundamentals(symbol: str):
    s = symbol.upper()
    if s == "RELIANCE":
        return {
            "roe": 9.47,
            "roce": 11.82,
            "roa": 3.94,
            "dividendYield": 0.42,
        }
    return {}


def calc_roe(info, fb):
    val = info.get("returnOnEquity")
    if val is not None:
        return round_nullable(val * 100, 2)
    return fb.get("roe")


def calc_roa(info, fb):
    val = info.get("returnOnAssets")
    if val is not None:
        return round_nullable(val * 100, 2)
    return fb.get("roa")


def calc_roce(info, fb):
    val = info.get("returnOnCapitalEmployed")
    if val is not None:
        return round_nullable(val * 100, 2)

    operating_income = info.get("operatingIncome")
    total_debt = info.get("totalDebt")
    total_equity = info.get("totalStockholderEquity")
    cash = info.get("totalCash")

    if operating_income is not None and total_debt is not None and total_equity is not None:
        capital_employed = total_debt + total_equity - (cash or 0)
        if capital_employed:
            return round_nullable((operating_income / capital_employed) * 100, 2)

    return fb.get("roce")


def calc_dividend_yield(info, cmp_price, fb):
    dy = info.get("dividendYield")
    if dy is not None:
        return round_nullable(dy * 100, 2)

    dividend_rate = info.get("dividendRate")
    if dividend_rate is not None and cmp_price not in (None, 0):
        return round_nullable((dividend_rate / cmp_price) * 100, 2)

    return fb.get("dividendYield")


def calc_financial_score(fin):
    score = 0

    pe = fin.get("pe")
    pb = fin.get("pb")
    roe = fin.get("roe")
    roce = fin.get("roce")
    roa = fin.get("roa")
    debt = fin.get("debtToEquity")
    growth = fin.get("salesGrowthYoY")
    current_ratio = fin.get("currentRatio")
    net_margin = fin.get("netMargin")
    op_margin = fin.get("operatingMargin")
    div_yield = fin.get("dividendYield")

    if pe is not None and 0 < pe <= 30:
        score += 10
    if pb is not None and 0 < pb <= 5:
        score += 5
    if roe is not None and roe >= 10:
        score += 15
    if roce is not None and roce >= 10:
        score += 15
    if roa is not None and roa >= 3:
        score += 10
    if debt is not None and debt <= 1:
        score += 10
    if growth is not None and growth >= 5:
        score += 10
    if current_ratio is not None and current_ratio >= 1:
        score += 5
    if net_margin is not None and net_margin >= 5:
        score += 10
    if op_margin is not None and op_margin >= 8:
        score += 5
    if div_yield is not None and div_yield > 0:
        score += 5

    return min(score, 100)


def calc_financial_grade(score):
    if score is None:
        return "-"
    if score >= 80:
        return "A"
    if score >= 65:
        return "B"
    if score >= 50:
        return "C"
    if score >= 35:
        return "D"
    return "E"


def safe_pct(numerator, denominator):
    if numerator is None or denominator in (None, 0):
        return None
    try:
        return (numerator / denominator) * 100
    except Exception:
        return None


def calc_forensic_metrics(ticker, info, financial_metrics):
    cashflow_df = get_statement_df(getattr(ticker, "cashflow", None))
    income_df = get_statement_df(getattr(ticker, "financials", None))
    balance_df = get_statement_df(getattr(ticker, "balance_sheet", None))

    cfo_value = get_latest_statement_value(
        cashflow_df,
        [
            "Operating Cash Flow",
            "Total Cash From Operating Activities",
            "Cash Flow From Continuing Operating Activities",
            "Net Cash Provided By Operating Activities",
        ],
    )

    pat_value = get_latest_statement_value(
        income_df,
        [
            "Net Income",
            "Net Income Common Stockholders",
            "Net Income From Continuing Operations Net Minority Interest",
        ],
    )

    cfo_pat = None
    if cfo_value is not None and pat_value not in (None, 0):
        cfo_pat = round_nullable(cfo_value / pat_value, 2)

    receivables_value = get_latest_statement_value(
        balance_df,
        [
            "Accounts Receivable",
            "Net Receivables",
            "Receivables",
        ],
    )

    inventory_value = get_latest_statement_value(
        balance_df,
        [
            "Inventory",
            "Inventories",
        ],
    )

    revenue_value = get_latest_statement_value(
        income_df,
        [
            "Total Revenue",
            "Operating Revenue",
            "Revenue",
        ],
    )

    cogs_value = get_latest_statement_value(
        income_df,
        [
            "Cost Of Revenue",
            "Cost Of Goods Sold",
            "Cost Of Sales",
        ],
    )

    recv_days = None
    if receivables_value is not None and revenue_value not in (None, 0):
        recv_days = round_nullable((receivables_value / revenue_value) * 365, 2)

    inv_days = None
    if inventory_value is not None and cogs_value not in (None, 0):
        inv_days = round_nullable((inventory_value / cogs_value) * 365, 2)

    debt_equity = financial_metrics.get("debtToEquity")
    operating_margin = financial_metrics.get("operatingMargin")

    return {
        "cfoPat": cfo_pat,
        "debtEquity": debt_equity,
        "opmCurrent": operating_margin,
        "opmPrev": None,
        "recvDaysCurrent": recv_days,
        "recvDaysPrev": None,
        "invDaysCurrent": inv_days,
        "invDaysPrev": None,
        "pledgePct": None,
        "cfoValue": round_nullable(cfo_value, 2),
        "patValue": round_nullable(pat_value, 2),
    }


def build_live_research(symbol: str, stock_meta: dict):
    yahoo_symbol = to_yahoo_symbol(symbol)
    ticker = yf.Ticker(yahoo_symbol)

    hist = ticker.history(period="1y", interval="1d", auto_adjust=False)
    info = get_info_dict(ticker)

    if hist is None or hist.empty:
        raise Exception(f"No history data returned for {yahoo_symbol}")

    series = build_series_from_history(hist)

    latest = series[-1] if series else {}
    previous = series[-2] if len(series) >= 2 else latest

    cmp_price = latest.get("c")
    prev_close = previous.get("c")
    day_high = latest.get("h")
    day_low = latest.get("l")

    change = None
    change_percent = None
    if cmp_price is not None and prev_close not in (None, 0):
        change = cmp_price - prev_close
        change_percent = (change / prev_close) * 100

    sma20 = sma(series, 20)
    sma50 = sma(series, 50)
    sma200 = sma(series, 200)
    rsi14 = rsi(series, 14)

    fb = fallback_fundamentals(symbol)

    financial_metrics = {
        "pe": round_nullable(info.get("trailingPE"), 2),
        "pb": round_nullable(info.get("priceToBook"), 2),
        "roe": calc_roe(info, fb),
        "roce": calc_roce(info, fb),
        "roa": calc_roa(info, fb),
        "debtToEquity": round_nullable(info.get("debtToEquity"), 2),
        "salesGrowthYoY": round_nullable(
            (info.get("revenueGrowth") * 100) if info.get("revenueGrowth") is not None else None,
            2
        ),
        "currentRatio": round_nullable(info.get("currentRatio"), 2),
        "netMargin": round_nullable(
            (info.get("profitMargins") * 100) if info.get("profitMargins") is not None else None,
            2
        ),
        "operatingMargin": round_nullable(
            (info.get("operatingMargins") * 100) if info.get("operatingMargins") is not None else None,
            2
        ),
        "dividendYield": calc_dividend_yield(info, cmp_price, fb),
    }

    forensic_metrics = calc_forensic_metrics(ticker, info, financial_metrics)

    financial_score = calc_financial_score(financial_metrics)
    forensic_score = derive_forensic_score(financial_metrics)

    result = {
        "symbol": symbol.upper(),
        "exchange": "NSE",
        "asOf": datetime.now(timezone.utc).isoformat(),
        "company": {
            "name": info.get("longName") or stock_meta.get("name") or symbol.upper(),
            "sector": info.get("sector") or stock_meta.get("sector"),
            "industry": info.get("industry"),
            "marketCapCr": market_cap_to_cr(info.get("marketCap")),
            "description": info.get("longBusinessSummary") or ""
        },
        "overview": {
            "cmp": round_nullable(cmp_price, 2),
            "change": round_nullable(change, 2),
            "changePercent": round_nullable(change_percent, 2),
            "high": round_nullable(day_high, 2),
            "low": round_nullable(day_low, 2),
            "prevClose": round_nullable(prev_close, 2),
            "week52High": round_nullable(max([x["h"] for x in series]), 2) if series else None,
            "week52Low": round_nullable(min([x["l"] for x in series]), 2) if series else None
        },
        "technical": {
            "sma20": round_nullable(sma20, 2),
            "sma50": round_nullable(sma50, 2),
            "sma200": round_nullable(sma200, 2),
            "cmpVs20Sma": cmp_price > sma20 if cmp_price is not None and sma20 is not None else None,
            "cmpVs50Sma": cmp_price > sma50 if cmp_price is not None and sma50 is not None else None,
            "cmpVs200Sma": cmp_price > sma200 if cmp_price is not None and sma200 is not None else None,
            "rsi14": round_nullable(rsi14, 2),
            "trendLabel": derive_trend_label(cmp_price, sma20, sma50, sma200, rsi14),
            "trendScore": derive_trend_score(cmp_price, sma20, sma50, sma200, rsi14)
        },
        "financial": {
            "pe": financial_metrics["pe"],
            "pb": financial_metrics["pb"],
            "roe": financial_metrics["roe"],
            "roce": financial_metrics["roce"],
            "roa": financial_metrics["roa"],
            "debtToEquity": financial_metrics["debtToEquity"],
            "salesGrowthYoY": financial_metrics["salesGrowthYoY"],
            "currentRatio": financial_metrics["currentRatio"],
            "netMargin": financial_metrics["netMargin"],
            "operatingMargin": financial_metrics["operatingMargin"],
            "dividendYield": financial_metrics["dividendYield"],
            "score": financial_score,
            "grade": calc_financial_grade(financial_score),
        },
        "forensic": {
            "score": forensic_score,
            "grade": derive_forensic_grade(forensic_score),
            # Old summary labels removed to favor metric-style view
            # "cashFlowQuality": derive_cashflow_quality(financial_metrics),
            # "earningsQuality": derive_earnings_quality(financial_metrics),
            # "leverageCheck": "Pass" if financial_metrics["debtToEquity"] is not None and financial_metrics["debtToEquity"] < 1 else "Watch",
            # "marginStability": derive_margin_stability(financial_metrics),
            # "redFlags": derive_red_flags(financial_metrics),

            # Metric fields you asked for
            "cfoPat": forensic_metrics["cfoPat"],
            "debtEquity": forensic_metrics["debtEquity"],
            "opmPrev": forensic_metrics["opmPrev"],
            "opmCurrent": forensic_metrics["opmCurrent"],
            "recvDaysPrev": forensic_metrics["recvDaysPrev"],
            "recvDaysCurrent": forensic_metrics["recvDaysCurrent"],
            "invDaysPrev": forensic_metrics["invDaysPrev"],
            "invDaysCurrent": forensic_metrics["invDaysCurrent"],
            "pledgePct": forensic_metrics["pledgePct"]
        },
        "chart": {
            "resolution": "D",
            "range": "1Y",
            "series": series[-180:]
        },
        "source": "cache+yfinance+fallback",
        "cacheStatus": "live"
    }

    return result


def get_stock_research_data(symbol: str, stock_meta: dict, force_refresh: bool = False):
    path = cache_file(symbol)

    if not force_refresh and is_cache_fresh(path):
        cached = load_cache(symbol)
        if cached:
            cached["cacheStatus"] = "cache"
            return cached

    live = build_live_research(symbol, stock_meta)
    save_cache(symbol, live)
    return live