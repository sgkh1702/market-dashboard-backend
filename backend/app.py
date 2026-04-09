from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from services.data_service import get_stock_analysis
from pathlib import Path
import json

app = FastAPI(title="Stock AI Agent API")

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


@app.get("/")
def home():
    return {"message": "Backend is running"}


@app.get("/analyze/{symbol}")
def analyze_stock(symbol: str):
    symbol = symbol.strip().upper()
    return get_stock_analysis(symbol)


@app.get("/search-symbols")
def search_symbols(q: str = Query(..., min_length=1)):
    if not NIFTY_FILE.exists():
        return []

    try:
        with open(NIFTY_FILE, "r", encoding="utf-8") as f:
            stocks = json.load(f)
    except Exception:
        return []

    q_lower = q.strip().lower()
    results = []

    for item in stocks:
        symbol = str(item.get("Symbol", "")).strip()
        name = str(item.get("Company Name", "")).strip()

        if not symbol:
            continue

        if q_lower in symbol.lower() or q_lower in name.lower():
            results.append({
                "symbol": symbol,
                "name": name
            })

    return results[:20]