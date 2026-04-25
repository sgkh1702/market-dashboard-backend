
import os
import time
import requests
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def safe_float(value):
    try:
        return float(value) if value is not None else None
    except (ValueError, TypeError):
        return None

def calc_yoy_growth(series):
    if series is None or len(series) < 2:
        return None
    try:
        current = series.iloc[0]
        previous = series.iloc[1]
        return ((current - previous) / previous * 100) if previous != 0 else None
    except:
        return None

def safe_yfinance_fetch(symbol: str, max_retries: int = 3) -> Optional[Dict[str, Any]]:
    """Safe yfinance fetch with retry and custom headers"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })

    for attempt in range(max_retries):
        try:
            ticker = yf.Ticker(symbol, session=session)
            info = ticker.info
            if not info:
                time.sleep(2 ** attempt)  # exponential backoff
                continue

            # Get yearly income statement
            income_yearly = ticker.get_income_stmt(freq="yearly")
            revenue_growth_yoy = None
            earnings_growth_yoy = None

            if income_yearly is not None and not income_yearly.empty:
                revenue_series = income_yearly.loc['Total Revenue'] if 'Total Revenue' in income_yearly.index else None
                net_income_series = income_yearly.loc['Net Income'] if 'Net Income' in income_yearly.index else None

                revenue_growth_yoy = calc_yoy_growth(revenue_series)
                earnings_growth_yoy = calc_yoy_growth(net_income_series)

            return {
                'info': info,
                'revenue_growth_yoy': revenue_growth_yoy,
                'earnings_growth_yoy': earnings_growth_yoy,
                'income_yearly': income_yearly.to_dict() if income_yearly is not None else None
            }
        except Exception as e:
            print(f"yfinance attempt {attempt+1} failed: {str(e)}")
            time.sleep(2 ** attempt)  # 1s, 2s, 4s backoff

    return None

@app.get("/")
async def root():
    return {"message": "Market Dashboard Backend - Live on Render!"}

@app.get("/search-symbols")
async def search_symbols(q: str):
    # Your existing search logic
    return {"symbols": []}  # placeholder

@app.get("/analyze/{symbol}")
async def analyze_symbol(symbol: str):
    try:
        data = safe_yfinance_fetch(symbol + ".NS")

        if data is None:
            return {
                "symbol": symbol,
                "error": "yfinance fetch failed after retries",
                "forensic": {"flags": ["yfinance fetch failed: multiple retries exhausted"]}
            }

        info = data['info']
        revenue_growth_yoy = data['revenue_growth_yoy']
        earnings_growth_yoy = data['earnings_growth_yoy']

        return {
            "symbol": symbol,
            "yahoo_symbol": symbol + ".NS",
            "profile": {
                "company_name": info.get("longName", "N/A"),
                "sector": info.get("sector", "N/A"),
                "industry": info.get("industry", "N/A"),
                "business": info.get("longBusinessSummary", "Business description not available.")
            },
            "technical": {
                "price": safe_float(info.get("currentPrice")),
                "previous_close": safe_float(info.get("previousClose")),
                "change": safe_float(info.get("regularMarketChange")),
                "change_percent": safe_float(info.get("regularMarketChangePercent")),
                # Add more technical fields
            },
            "fundamentals": {
                "trailing_pe": safe_float(info.get("trailingPE")),
                "forward_pe": safe_float(info.get("forwardPE")),
                "price_to_book": safe_float(info.get("priceToBook")),
                "roe": safe_float(info.get("returnOnEquity")),
                "roa": safe_float(info.get("returnOnAssets")),
                "debt_to_equity": safe_float(info.get("debtToEquity")),
                "current_ratio": safe_float(info.get("currentRatio")),
                "revenue_growth": safe_float(info.get("revenueGrowth")),  # quarterly fallback
                "revenue_growth_yoy": revenue_growth_yoy,  # yearly
                "earnings_growth": safe_float(info.get("earningsGrowth")),  # quarterly fallback  
                "earnings_growth_yoy": earnings_growth_yoy,  # yearly
                "dividend_yield": safe_float(info.get("dividendYield")),
                "market_cap_cr": safe_float(info.get("marketCap")) / 10000000 if info.get("marketCap") else None
            },
            "forensic": {
                "risk_score": 5,  # placeholder
                "flags": []
            },
            "scores": {
                "technical_score": 0,
                "fundamental_score": 0,
                "forensic_score": 0,
                "total_score": 0
            }
        }
    except Exception as e:
        return {
            "symbol": symbol,
            "error": str(e),
            "forensic": {"flags": [str(e)]}
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
