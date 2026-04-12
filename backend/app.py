import json
from pathlib import Path

import uvicorn
import yfinance as yf
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Market Dashboard API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://mymarketdashboard.netlify.app",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
NIFTY_FILE = BASE_DIR / "Nifty500List.json"


def load_nifty_data():
    try:
        with open(NIFTY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            if "data" in data and isinstance(data["data"], list):
                return data["data"]
            for v in data.values():
                if isinstance(v, list):
                    return v
            return []
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []


NIFTY_500 = load_nifty_data()


def safe_round(value, digits=2):
    try:
        if value is None:
            return None
        return round(float(value), digits)
    except Exception:
        return None


def extract_symbol(row):
    if isinstance(row, str):
        return row.strip().upper()
    if not isinstance(row, dict):
        return None
    return (
        row.get("Symbol")
        or row.get("symbol")
        or row.get("SYMBOL")
        or row.get("ticker")
        or row.get("Ticker")
        or row.get("Security Id")
        or row.get("security_id")
    )


def extract_name(row):
    if isinstance(row, str):
        return row.strip().upper()
    if not isinstance(row, dict):
        return ""
    return (
        row.get("Company Name")
        or row.get("companyName")
        or row.get("company_name")
        or row.get("NAME OF COMPANY")
        or row.get("name")
        or row.get("Industry")
        or row.get("security")
        or ""
    )


@app.get("/")
async def home():
    sample = []
    for row in NIFTY_500[:10]:
        sym = extract_symbol(row)
        if sym:
            sample.append(sym)
    return {
        "message": "Market Dashboard API Live",
        "companies_loaded": len(NIFTY_500),
        "sample_symbols": sample,
        "file_found": NIFTY_FILE.exists(),
        "file_name": "Nifty500List.json"
    }


@app.get("/search-symbols")
async def search_symbols(q: str = Query("")):
    query = q.strip().lower()
    results = []

    for row in NIFTY_500:
        symbol = extract_symbol(row)
        company = extract_name(row)
        if not symbol:
            continue

        symbol_u = str(symbol).strip().upper()
        company_s = str(company).strip()

        if not query or query in symbol_u.lower() or query in company_s.lower():
            results.append({
                "symbol": symbol_u,
                "name": company_s or symbol_u
            })

    if not results and not query:
        results = [{"symbol": extract_symbol(r), "name": extract_name(r) or extract_symbol(r)} for r in NIFTY_500[:20] if extract_symbol(r)]

    return {"symbols": results[:20]}


@app.get("/analyze/{symbol}")
async def analyze(symbol: str):
    s = symbol.strip().upper()
    ticker = yf.Ticker(f"{s}.NS")

    try:
        info = ticker.info or {}
        hist = ticker.history(period="6mo")

        if hist.empty:
            return {"symbol": s, "error": "No market data found"}

        close = hist["Close"]
        latest_price = safe_round(close.iloc[-1])
        prev_close = safe_round(close.iloc[-2]) if len(close) > 1 else latest_price

        delta = close.diff()
        gain = delta.clip(lower=0).rolling(14).mean()
        loss = (-delta.clip(upper=0)).rolling(14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        latest_rsi = safe_round(rsi.iloc[-1])

        sma20 = safe_round(close.rolling(20).mean().iloc[-1]) if len(close) >= 20 else None
        sma50 = safe_round(close.rolling(50).mean().iloc[-1]) if len(close) >= 50 else None

        return {
            "symbol": s,
            "company_name": info.get("longName") or s,
            "price": latest_price,
            "previous_close": prev_close,
            "change": safe_round(latest_price - prev_close) if latest_price is not None and prev_close is not None else None,
            "change_percent": safe_round(((latest_price - prev_close) / prev_close) * 100) if latest_price is not None and prev_close not in (None, 0) else None,
            "volume": int(hist["Volume"].iloc[-1]) if "Volume" in hist.columns else None,
            "sma20": sma20,
            "sma50": sma50,
            "rsi": latest_rsi,
            "pe": safe_round(info.get("trailingPE")),
            "market_cap": info.get("marketCap"),
            "sector": info.get("sector"),
            "action": "BUY" if latest_rsi is not None and latest_rsi < 50 else "HOLD"
        }
    except Exception as e:
        return {"symbol": s, "error": str(e)}


@app.get("/debug-symbols")
async def debug_symbols():
    preview = []
    for row in NIFTY_500[:20]:
        preview.append({
            "raw": row,
            "symbol": extract_symbol(row),
            "name": extract_name(row)
        })
    return {
        "file_found": NIFTY_FILE.exists(),
        "count": len(NIFTY_500),
        "preview": preview
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
