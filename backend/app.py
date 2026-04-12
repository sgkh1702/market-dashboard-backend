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
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
NIFTY_FILE = BASE_DIR / "Nifty500List.json"

try:
    with open(NIFTY_FILE, "r", encoding="utf-8") as f:
        NIFTY_500 = json.load(f)
    print(f"Loaded Nifty500List.json: {len(NIFTY_500)} companies")
except Exception as e:
    print(f"Error loading Nifty500List.json: {e}")
    NIFTY_500 = []


def safe_round(value, digits=2):
    try:
        if value is None:
            return None
        return round(float(value), digits)
    except Exception:
        return None


def extract_symbol(row):
    if not isinstance(row, dict):
        return None
    return (
        row.get("Symbol")
        or row.get("symbol")
        or row.get("SYMBOL")
        or row.get("ticker")
        or row.get("Ticker")
    )


def extract_name(row):
    if not isinstance(row, dict):
        return ""
    return (
        row.get("Company Name")
        or row.get("companyName")
        or row.get("company_name")
        or row.get("NAME OF COMPANY")
        or row.get("name")
        or ""
    )


@app.get("/")
async def home():
    return {
        "message": "Market Dashboard API Live",
        "companies_loaded": len(NIFTY_500),
        "endpoints": ["/search-symbols?q=RELI", "/analyze/RELIANCE"]
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

        symbol_u = str(symbol).upper()
        company_s = str(company)

        if not query or query in symbol_u.lower() or query in company_s.lower():
            results.append({
                "symbol": symbol_u,
                "name": company_s or symbol_u
            })

    results = sorted(results, key=lambda x: x["symbol"])
    return {"symbols": results[:20]}


@app.get("/analyze/{symbol}")
async def analyze(symbol: str):
    s = symbol.strip().upper()
    ticker = yf.Ticker(f"{s}.NS")

    try:
        info = ticker.info or {}
        hist = ticker.history(period="6mo")

        if hist.empty:
            return {
                "symbol": s,
                "error": "No market data found"
            }

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
            "change": safe_round(latest_price - prev_close) if latest_price and prev_close else None,
            "change_percent": safe_round(((latest_price - prev_close) / prev_close) * 100) if latest_price and prev_close else None,
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
        return {
            "symbol": s,
            "error": str(e)
        }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)