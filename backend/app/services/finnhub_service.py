import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
BASE_URL = "https://finnhub.io/api/v1"

def map_to_finnhub_symbol(symbol: str) -> str:
    return f"{symbol}.NS"

def finnhub_get(path: str, params: dict):
    params["token"] = FINNHUB_API_KEY
    response = requests.get(f"{BASE_URL}{path}", params=params, timeout=20)
    response.raise_for_status()
    return response.json()

def get_quote(symbol: str):
    return finnhub_get("/quote", {"symbol": map_to_finnhub_symbol(symbol)})

def get_profile(symbol: str):
    return finnhub_get("/stock/profile2", {"symbol": map_to_finnhub_symbol(symbol)})

def get_basic_financials(symbol: str):
    all_metrics = finnhub_get("/stock/metric", {
        "symbol": map_to_finnhub_symbol(symbol),
        "metric": "all"
    })
    
    # PRINT THIS TO SEE WHAT FIELDS ARE AVAILABLE (remove after fixing)
    print(f"DEBUG Finnhub metrics for {symbol}:")
    metric_data = all_metrics.get("metric", {})
    print(list(metric_data.keys())[:20])  # First 20 keys
    print("Sample values:", {k: metric_data.get(k) for k in list(metric_data.keys())[:5]})
    
    return all_metrics

def get_candles(symbol: str, resolution="D", days=250):
    to_ts = int(datetime.utcnow().timestamp())
    from_ts = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    return finnhub_get("/stock/candle", {
        "symbol": map_to_finnhub_symbol(symbol),
        "resolution": resolution,
        "from": from_ts,
        "to": to_ts
    })