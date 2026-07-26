import csv
import json
from functools import lru_cache
from io import StringIO
from pathlib import Path

import requests

BASE_DIR = Path(__file__).resolve().parents[2]
NIFTY500_JSON = BASE_DIR / "data" / "Nifty500List.json"
NSE_SECURITIES_CSV = "https://nsearchives.nseindia.com/content/equities/sec_list.csv"

ALLOWED_SERIES = {"EQ"}   # later add BE, BZ, SM, ST if needed

def normalize_nifty500_record(row: dict):
    return {
        "symbol": str(row.get("Symbol", "")).strip().upper(),
        "name": str(row.get("Company Name", "")).strip(),
        "sector": str(row.get("Industry", "")).strip(),
        "series": "EQ",
        "source": "nifty500",
    }

def normalize_nse_record(row: dict):
    return {
        "symbol": str(row.get("Symbol", "")).strip().upper(),
        "name": str(row.get("Security Name", "")).strip(),
        "sector": "",
        "series": str(row.get("Series", "")).strip().upper(),
        "source": "nse",
    }

@lru_cache(maxsize=1)
def load_nifty500():
    if not NIFTY500_JSON.exists():
        raise FileNotFoundError(f"File not found: {NIFTY500_JSON}")

    with open(NIFTY500_JSON, "r", encoding="utf-8") as f:
        rows = json.load(f)

    items = []
    for row in rows:
        item = normalize_nifty500_record(row)
        if item["symbol"] and item["name"]:
            items.append(item)
    return items

def fetch_nse_csv_text():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "text/csv,application/csv,text/plain,*/*",
        "Referer": "https://www.nseindia.com/",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
    }

    session = requests.Session()
    session.headers.update(headers)

    try:
        session.get("https://www.nseindia.com/", timeout=10)
    except Exception:
        pass

    response = session.get(NSE_SECURITIES_CSV, timeout=20)
    response.raise_for_status()
    return response.content.decode("utf-8", errors="ignore")

@lru_cache(maxsize=1)
def load_nse_universe():
    text = fetch_nse_csv_text()
    reader = csv.DictReader(StringIO(text))

    items = []
    for row in reader:
        item = normalize_nse_record(row)

        if not item["symbol"] or not item["name"]:
            continue

        if item["series"] not in ALLOWED_SERIES:
            continue

        items.append(item)

    return items

def load_search_universe():
    try:
        rows = load_nse_universe()
        if rows:
            return rows
    except Exception as e:
        print("NSE universe load failed, falling back to Nifty500:", e)

    return load_nifty500()

def rank_match(item, q: str):
    symbol = item["symbol"].lower()
    name = item["name"].lower()

    if symbol == q:
        return (0, len(symbol), symbol)
    if symbol.startswith(q):
        return (1, len(symbol), symbol)
    if name.startswith(q):
        return (2, len(name), name)
    if q in symbol:
        return (3, len(symbol), symbol)
    if q in name:
        return (4, len(name), name)

    return (9, 9999, symbol)

def search_nifty500(query: str, limit: int = 20):
    q = query.strip().lower()
    if not q:
        return []

    rows = load_search_universe()
    matches = []

    for item in rows:
        symbol = item["symbol"].lower()
        name = item["name"].lower()

        if (
            q == symbol
            or symbol.startswith(q)
            or name.startswith(q)
            or q in symbol
            or q in name
        ):
            matches.append(item)

    matches.sort(key=lambda item: rank_match(item, q))

    results = []
    for item in matches[:limit]:
        results.append({
            "symbol": item["symbol"],
            "displaySymbol": item["symbol"],
            "description": item["name"],
            "name": item["name"],
            "sector": item.get("sector", ""),
            "series": item.get("series", ""),
            "source": item.get("source", ""),
        })

    return results

def get_stock_meta(symbol: str):
    symbol = symbol.strip().upper()
    rows = load_search_universe()

    for item in rows:
        if item["symbol"] == symbol:
            return item

    return None

def clear_search_cache():
    load_nse_universe.cache_clear()
    load_nifty500.cache_clear()