from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

stocks = {
    "RELIANCE": {"price": 2850, "rsi": 45, "score": 8},
    "TCS": {"price": 4125, "rsi": 52, "score": 8},
    "INFY": {"price": 1850, "rsi": 49, "score": 7},
    "HDFCBANK": {"price": 1625, "rsi": 41, "score": 9}
}

@app.get("/")
async def home():
    return {"message": "✅ NSE Backend LIVE"}

@app.get("/search-symbols")
async def search_symbols(q: str):
    matches = [s for s in stocks.keys() if q.upper() in s]
    return {"symbols": matches}

@app.get("/analyze/{symbol}")
async def analyze(symbol: str):
    data = stocks.get(symbol.upper())
    if data:
        return {
            "symbol": symbol,
            "price": data["price"],
            "rsi": data["rsi"],
            "total_score": data["score"],
            "action": "BUY" if data["rsi"] < 50 else "HOLD"
        }
    return {"error": "Try: RELIANCE, TCS, INFY, HDFCBANK"}

if __name__ == "__main__":
    uvicorn.run(app)