import json
import time
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf

from app.utils.indicators import sma, rsi, round_nullable
from app.utils.scoring import (
    derive_trend_label,
    derive_trend_score,
    derive_forensic_score,
    derive_forensic_grade,
    derive_cashflow_quality,
    derive_earnings_quality,
    derive_margin_stability,
    derive_red_flags,
)

BASE_DIR = Path(__file__).resolve().parents[2]
CACHE_DIR = BASE_DIR / "data" / "cache" / "stocks"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

CACHE_TTL_SECONDS = 6 * 60 * 60  # 6 hours

def to_yahoo_symbol(symbol: str) -> str:
    return f"{symbol.upper()}.NS"

def cache_file(symbol: str) -> Path:
    return CACHE_DIR / f"{symbol.upper()}.json"

def is_cache_fresh(path: Path, max_age_seconds=CACHE_TTL_SECONDS) -> bool:
    if not path.exists():
        return False
    age = time.time() - path.stat().st_mtime
    return age <= max_age_seconds

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

def safe_div(a, b):
    if a is None or b in (None, 0):
        return None
    return a / b

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
    prev_close = info.get("previousClose") or previous.get("c")
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

    pe = info.get("trailingPE")
    pb = info.get("priceToBook")

    roe = info.get("returnOnEquity")
    if roe is not None:
        roe = roe * 100

    operating_margin = info.get("operatingMargins")
    if operating_margin is not None:
        operating_margin = operating_margin * 100

    net_margin = info.get("profitMargins")
    if net_margin is not None:
        net_margin = net_margin * 100

    revenue_growth = info.get("revenueGrowth")
    if revenue_growth is not None:
        revenue_growth = revenue_growth * 100

    debt_to_equity = info.get("debtToEquity")
    current_ratio = info.get("currentRatio")

    financial_metrics = {
        "pe": pe,
        "pb": pb,
        "roe": roe,
        "roce": info.get("returnOnAssets"),
        "debtToEquity": debt_to_equity,
        "salesGrowthYoY": revenue_growth,
        "currentRatio": current_ratio,
        "netMargin": net_margin,
        "operatingMargin": operating_margin,
    }

    forensic_score = derive_forensic_score(financial_metrics)

    result = {
        "symbol": symbol.upper(),
        "exchange": "NSE",
        "asOf": datetime.now(timezone.utc).isoformat(),
        "company": {
            "name": stock_meta.get("name") or info.get("longName") or symbol.upper(),
            "sector": stock_meta.get("sector") or info.get("sector"),
            "industry": info.get("industry"),
            "marketCapCr": market_cap_to_cr(info.get("marketCap"))
        },
        "overview": {
            "cmp": round_nullable(cmp_price, 2),
            "change": round_nullable(change, 2),
            "changePercent": round_nullable(change_percent, 2),
            "high": round_nullable(day_high, 2),
            "low": round_nullable(day_low, 2),
            "prevClose": round_nullable(prev_close, 2),
            "week52High": round_nullable(info.get("fiftyTwoWeekHigh"), 2),
            "week52Low": round_nullable(info.get("fiftyTwoWeekLow"), 2)
        },
        "technical": {
            "cmpVs20Sma": cmp_price > sma20 if cmp_price is not None and sma20 is not None else None,
            "cmpVs50Sma": cmp_price > sma50 if cmp_price is not None and sma50 is not None else None,
            "cmpVs200Sma": cmp_price > sma200 if cmp_price is not None and sma200 is not None else None,
            "rsi14": round_nullable(rsi14, 2),
            "trendLabel": derive_trend_label(cmp_price, sma20, sma50, sma200, rsi14),
            "trendScore": derive_trend_score(cmp_price, sma20, sma50, sma200, rsi14)
        },
        "financial": {
            "pe": round_nullable(pe, 2),
            "pb": round_nullable(pb, 2),
            "roe": round_nullable(roe, 2),
            "roce": round_nullable(info.get("returnOnAssets") * 100, 2) if info.get("returnOnAssets") is not None else None,
            "debtToEquity": round_nullable(debt_to_equity, 2),
            "salesGrowthYoY": round_nullable(revenue_growth, 2)
        },
        "forensic": {
            "score": forensic_score,
            "grade": derive_forensic_grade(forensic_score),
            "cashFlowQuality": derive_cashflow_quality(financial_metrics),
            "earningsQuality": derive_earnings_quality(financial_metrics),
            "leverageCheck": "Pass" if debt_to_equity is not None and debt_to_equity < 1 else "Watch",
            "marginStability": derive_margin_stability(financial_metrics),
            "redFlags": derive_red_flags(financial_metrics)
        },
        "chart": {
            "resolution": "D",
            "range": "1Y",
            "series": series[-180:]
        },
        "source": "cache+yfinance",
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