from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="NSE Backend")

# Enable CORS for localhost + production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.netlify.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# NSE Stock Data
stocks = {
    "RELIANCE": {"price": 2850.15, "rsi": 45.2, "pe": 22.5, "score": 8.0, "action": "BUY"},
    "TCS": {"price": 4125.75, "rsi": 52.1, "pe": 28.1, "score": 8.2, "action": "HOLD"},
    "INFY": {"price": 1850.40, "rsi": 48.7, "pe": 24.3, "score": 7.5, "action": "BUY"},
    "HDFCBANK": {"price": 1625.90, "rsi": 41.3, "pe": 18.2, "score": 8.5, "action": "BUY"},
    "ICICIBANK": {"price": 1225.60, "rsi": 47.9, "pe": 16.8, "score": 7.8, "action": "BUY"}
}

@app.get("/")
async def home():
    return {
        "message": "✅ NSE Backend LIVE", 
        "stocks": list(stocks.keys()),
        "test": "/analyze/RELIANCE"
    }

@app.get("/search-symbols")
async def search_symbols(q: str = Query("")):
    if not q.strip():
        return {"symbols": list(stocks.keys())}
    
    # Case-insensitive search
    matches = [s for s in stocks if q.strip().upper() in s.upper()]
    return {"symbols": matches[:10]}

@app.get("/analyze/{symbol}")
async def analyze(symbol: str):
    symbol = symbol.upper()
    data = stocks.get(symbol)
    
    if not data:
        return {
            "error": f"{symbol} not found",
            "available": list(stocks.keys())[:5]
        }
    
    return {
        "symbol": symbol,
        "price": data["price"],
        "rsi": data["rsi"],
        "pe": data["pe"],
        "total_score": data["score"],
        "action": data["action"],
        "change_percent": 1.25
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)