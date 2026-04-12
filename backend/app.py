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
    print(f"✅ LOADED Nifty500List.json: {len(NIFTY_500)} companies")
except Exception as e:
    print(f"❌ Error loading Nifty500List.json: {e}")
    NIFTY_500 = []


def safe_round(value, digits=2):
    try:
        if value is None:
            return None
        return round(float(value), digits)
    except Exception:
        return None


def pct_to_percent(value):
    try:
        if value is None:
            return None
        return round(float(value) * 100, 2)
    except Exception:
        return None


def get_first_value(df, possible_rows):
    try:
        if df is None or df.empty:
            return None

        for row_name in possible_rows:
            if row_name in df.index:
                row = df.loc[row_name]
                if hasattr(row, "dropna"):
                    row = row.dropna()
                if len(row) > 0:
                    return float(row.iloc[0])

        return None
    except Exception:
        return None


def compute_dividend_yield(info, current_price):
    try:
        if current_price is None or current_price <= 0:
            return None

        annual_dividend = (
            info.get("dividendRate")
            or info.get("trailingAnnualDividendRate")
            or info.get("lastDividendValue")
        )

        if annual_dividend is not None:
            return round((float(annual_dividend) / float(current_price)) * 100, 2)

        raw_dividend_yield = (
            info.get("dividendYield")
            if info.get("dividendYield") is not None
            else info.get("trailingAnnualDividendYield")
        )

        if raw_dividend_yield is None:
            return None

        v = float(raw_dividend_yield)

        if v <= 0.01:
            return round(v * 100, 2)

        if v <= 1:
            return round(v, 2)

        return round(v / 100, 2)
    except Exception:
        return None


def compute_current_ratio(info, balance_sheet):
    try:
        current_ratio = info.get("currentRatio")
        if current_ratio is not None:
            return round(float(current_ratio), 2)

        current_assets = get_first_value(
            balance_sheet,
            ["Current Assets", "Total Current Assets"],
        )
        current_liabilities = get_first_value(
            balance_sheet,
            ["Current Liabilities", "Total Current Liabilities"],
        )

        if current_assets not in (None, 0) and current_liabilities not in (None, 0):
            return round(float(current_assets) / float(current_liabilities), 2)

        return None
    except Exception:
        return None


def get_stock_from_list(symbol: str):
    symbol = symbol.strip().upper()
    for s in NIFTY_500:
        s_symbol = str(s.get("Symbol", s.get("symbol", ""))).strip().upper()
        s_name = str(s.get("Company Name", s.get("name", ""))).strip()

        if symbol == s_symbol:
            return s
        if symbol in s_symbol:
            return s
        if symbol in s_name.upper():
            return s
    return None


@app.get("/")
def home():
    return {"message": "Backend is running", "companies": len(NIFTY_500)}


@app.get("/search-symbols")
def search_symbols(q: str = Query(..., min_length=1)):
    if not NIFTY_500:
        return []

    q_lower = q.strip().lower()
    results = []

    for stock in NIFTY_500:
        symbol = str(stock.get("Symbol", stock.get("symbol", ""))).strip()
        name = str(stock.get("Company Name", stock.get("name", ""))).strip()

        if q_lower in symbol.lower() or q_lower in name.lower():
            results.append({"symbol": symbol, "name": name})

        if len(results) >= 20:
            break

    return results


@app.get("/analyze/{symbol}")
def analyze_stock(symbol: str):
    symbol = symbol.strip().upper()

    stock = get_stock_from_list(symbol)

    if stock:
        base_symbol = str(stock.get("Symbol", stock.get("symbol", symbol))).strip().upper()
        company_name = str(stock.get("Company Name", stock.get("name", base_symbol))).strip()
        industry_from_file = str(stock.get("Industry", stock.get("industry", "N/A"))).strip()
    else:
        base_symbol = symbol.strip().upper()
        company_name = base_symbol
        industry_from_file = "N/A"

    yahoo_symbol = f"{base_symbol}.NS"

    try:
        ticker = yf.Ticker(yahoo_symbol)
        info = ticker.info or {}
        hist = ticker.history(period="1y")

        if not info and (hist is None or hist.empty):
            return {"error": f"No Yahoo Finance data found for {base_symbol}"}

        financials = None
        balance_sheet = None
        cashflow = None

        try:
            financials = ticker.financials
        except Exception:
            financials = None

        try:
            balance_sheet = ticker.balance_sheet
        except Exception:
            balance_sheet = None

        try:
            cashflow = ticker.cashflow
        except Exception:
            cashflow = None

        current_price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
        previous_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
        open_price = info.get("open") or info.get("regularMarketOpen")
        day_high = info.get("dayHigh") or info.get("regularMarketDayHigh")
        day_low = info.get("dayLow") or info.get("regularMarketDayLow")
        volume = info.get("volume") or info.get("regularMarketVolume")
        market_cap = info.get("marketCap")
        trailing_pe = info.get("trailingPE")
        forward_pe = info.get("forwardPE")
        price_to_book = info.get("priceToBook")

        raw_roe = info.get("returnOnEquity")
        raw_roa = info.get("returnOnAssets")
        roe = pct_to_percent(raw_roe)
        roa = pct_to_percent(raw_roa)

        net_income = get_first_value(financials, ["Net Income", "NetIncome"])
        total_equity = get_first_value(
            balance_sheet,
            ["Total Stockholder Equity", "Stockholders Equity", "Common Stock Equity"],
        )
        total_assets = get_first_value(balance_sheet, ["Total Assets"])

        if roe is None and net_income is not None and total_equity not in (None, 0):
            roe = round((net_income / total_equity) * 100, 2)

        if roa is None and net_income is not None and total_assets not in (None, 0):
            roa = round((net_income / total_assets) * 100, 2)

        raw_debt_to_equity = info.get("debtToEquity")
        debt_to_equity = safe_round(raw_debt_to_equity / 100, 2) if raw_debt_to_equity is not None else None

        current_ratio = compute_current_ratio(info, balance_sheet)

        revenue_growth = pct_to_percent(info.get("revenueGrowth"))
        earnings_growth = pct_to_percent(info.get("earningsGrowth"))

        dividend_yield = compute_dividend_yield(info, current_price)

        week_52_high = info.get("fiftyTwoWeekHigh")
        week_52_low = info.get("fiftyTwoWeekLow")
        sector = info.get("sector") or "N/A"
        industry = info.get("industry") or industry_from_file or "N/A"
        business = info.get("longBusinessSummary") or "Business description not available."

        sma20 = sma50 = sma200 = rsi = None
        volume_trend = "N/A"

        if hist is not None and not hist.empty:
            close = hist["Close"].dropna()
            vol = hist["Volume"].dropna() if "Volume" in hist.columns else None

            if len(close) >= 20:
                sma20 = safe_round(close.tail(20).mean())
            if len(close) >= 50:
                sma50 = safe_round(close.tail(50).mean())
            if len(close) >= 200:
                sma200 = safe_round(close.tail(200).mean())

            if len(close) >= 15:
                delta = close.diff().dropna()
                gain = delta.clip(lower=0).rolling(14).mean()
                loss = (-delta.clip(upper=0)).rolling(14).mean()
                rs = gain / loss.replace(0, 1e-9)
                rsi_series = 100 - (100 / (1 + rs))
                if not rsi_series.dropna().empty:
                    rsi = safe_round(rsi_series.dropna().iloc[-1])

            if vol is not None and len(vol) >= 20:
                avg_vol_20 = vol.tail(20).mean()
                latest_vol = vol.iloc[-1]
                if latest_vol > avg_vol_20 * 1.2:
                    volume_trend = "Above Average"
                elif latest_vol < avg_vol_20 * 0.8:
                    volume_trend = "Below Average"
                else:
                    volume_trend = "Average"

        change = None
        change_percent = None
        if current_price is not None and previous_close is not None:
            change = safe_round(current_price - previous_close)
            if previous_close:
                change_percent = safe_round((change / previous_close) * 100)

        market_cap_cr = safe_round(market_cap / 10000000, 2) if market_cap else None

        operating_cash_flow = get_first_value(
            cashflow,
            [
                "Operating Cash Flow",
                "Cash Flow From Continuing Operating Activities",
                "Total Cash From Operating Activities",
            ],
        )
        capital_expenditure = get_first_value(
            cashflow,
            [
                "Capital Expenditure",
                "Capital Expenditure Reported",
                "Purchase Of PPE",
            ],
        )
        accounts_receivable = get_first_value(
            balance_sheet,
            ["Accounts Receivable", "Trade Receivables", "Receivables"],
        )
        total_revenue = get_first_value(
            financials,
            ["Total Revenue", "Revenue", "Operating Revenue"],
        )

        cash_profit_ratio = None
        if operating_cash_flow is not None and net_income not in (None, 0):
            cash_profit_ratio = safe_round(operating_cash_flow / net_income, 2)

        free_cash_flow_positive = None
        free_cash_flow = None
        if operating_cash_flow is not None:
            if capital_expenditure is not None:
                free_cash_flow = operating_cash_flow + capital_expenditure
                free_cash_flow_positive = free_cash_flow > 0
            else:
                free_cash_flow_positive = operating_cash_flow > 0

        accrual_risk = None
        if net_income is not None and operating_cash_flow is not None and total_assets not in (None, 0):
            accrual_risk = safe_round(abs(net_income - operating_cash_flow) / total_assets, 3)

        debtor_days = None
        if accounts_receivable is not None and total_revenue not in (None, 0):
            debtor_days = safe_round((accounts_receivable / total_revenue) * 365, 2)

        risk_flags = []
        risk_score = 2

        if debt_to_equity is not None and debt_to_equity > 1.5:
            risk_flags.append("High debt-to-equity")
            risk_score += 2

        if earnings_growth is not None and earnings_growth < 0:
            risk_flags.append("Negative earnings growth")
            risk_score += 2

        if revenue_growth is not None and revenue_growth < 0:
            risk_flags.append("Negative revenue growth")
            risk_score += 1

        if current_ratio is not None and current_ratio < 1:
            risk_flags.append("Weak liquidity")
            risk_score += 1

        if cash_profit_ratio is not None and cash_profit_ratio < 0.8:
            risk_flags.append("Profit not strongly backed by operating cash flow")
            risk_score += 1

        if free_cash_flow_positive is False:
            risk_flags.append("Free cash flow is negative")
            risk_score += 1

        if accrual_risk is not None and accrual_risk > 0.1:
            risk_flags.append("Higher accrual risk")
            risk_score += 1

        if debtor_days is not None and debtor_days > 90:
            risk_flags.append("High debtor days")
            risk_score += 1

        risk_score = min(risk_score, 10)

        technical_score = 5
        if current_price and sma20 and current_price > sma20:
            technical_score += 1
        if current_price and sma50 and current_price > sma50:
            technical_score += 1
        if current_price and sma200 and current_price > sma200:
            technical_score += 1
        if rsi is not None and 45 <= rsi <= 70:
            technical_score += 1
        technical_score = min(technical_score, 10)

        fundamental_score = 5
        if trailing_pe is not None and trailing_pe > 0 and trailing_pe < 25:
            fundamental_score += 1
        if roe is not None and roe > 15:
            fundamental_score += 1
        if roa is not None and roa > 5:
            fundamental_score += 1
        if revenue_growth is not None and revenue_growth > 0:
            fundamental_score += 1
        if earnings_growth is not None and earnings_growth > 0:
            fundamental_score += 1
        fundamental_score = min(fundamental_score, 10)

        forensic_score = max(10 - risk_score, 1)
        total_score = safe_round((technical_score + fundamental_score + forensic_score) / 3, 1)

        positives = []
        risks = []

        if revenue_growth is not None and revenue_growth > 0:
            positives.append("Positive revenue growth")
        if earnings_growth is not None and earnings_growth > 0:
            positives.append("Positive earnings growth")
        if roe is not None and roe > 15:
            positives.append("Healthy return on equity")
        if dividend_yield is not None and dividend_yield > 0:
            positives.append("Dividend paying company")
        if cash_profit_ratio is not None and cash_profit_ratio >= 1:
            positives.append("Profit is supported by operating cash flow")
        if free_cash_flow_positive is True:
            positives.append("Positive free cash flow")
        if current_price and week_52_low and week_52_high:
            if current_price > ((week_52_high + week_52_low) / 2):
                positives.append("Trading above 52-week midpoint")

        if trailing_pe is not None and trailing_pe > 35:
            risks.append("Valuation appears elevated")
        if debt_to_equity is not None and debt_to_equity > 1.5:
            risks.append("Leverage is on the higher side")
        if rsi is not None and rsi > 75:
            risks.append("RSI indicates overbought zone")
        if earnings_growth is not None and earnings_growth < 0:
            risks.append("Earnings growth is negative")
        if free_cash_flow_positive is False:
            risks.append("Free cash flow is negative")
        if debtor_days is not None and debtor_days > 90:
            risks.append("Receivable cycle appears stretched")

        if not positives:
            positives = ["Large-cap market presence", "Tracked through Yahoo Finance"]
        if not risks:
            risks = ["Market volatility", "Sector-specific uncertainty"]

        if total_score is not None:
            if total_score >= 7.5:
                action = "Buy"
                confidence = 8
                summary = "Overall setup looks constructive with supportive technical and fundamental signals."
            elif total_score >= 5.5:
                action = "Hold"
                confidence = 6
                summary = "Mixed signals; stock is investable but not strongly compelling at current levels."
            else:
                action = "Avoid"
                confidence = 4
                summary = "Risk-reward is currently weak based on the available metrics."
        else:
            action = "Hold"
            confidence = 5
            summary = "Insufficient clean data for a stronger conviction."

        thesis = (
            f"{company_name} operates in {sector if sector != 'N/A' else industry}. "
            f"Current price is {current_price if current_price is not None else 'N/A'}, "
            f"with trailing P/E at {trailing_pe if trailing_pe is not None else 'N/A'}."
        )

        return {
            "symbol": base_symbol,
            "yahoo_symbol": yahoo_symbol,
            "profile": {
                "company_name": company_name,
                "sector": sector,
                "industry": industry,
                "business": business,
            },
            "technical": {
                "price": current_price,
                "previous_close": previous_close,
                "change": change,
                "change_percent": change_percent,
                "open": open_price,
                "day_high": day_high,
                "day_low": day_low,
                "52_week_high": week_52_high,
                "52_week_low": week_52_low,
                "sma20": sma20,
                "sma50": sma50,
                "sma200": sma200,
                "rsi": rsi,
                "volume_trend": volume_trend,
                "volume": volume,
            },
            "fundamentals": {
                "trailing_pe": safe_round(trailing_pe),
                "forward_pe": safe_round(forward_pe),
                "price_to_book": safe_round(price_to_book),
                "roe": roe,
                "roa": roa,
                "debt_to_equity": debt_to_equity,
                "current_ratio": current_ratio,
                "revenue_growth": revenue_growth,
                "earnings_growth": earnings_growth,
                "dividend_yield": dividend_yield,
                "market_cap_cr": market_cap_cr,
            },
            "forensic": {
                "risk_score": risk_score,
                "cash_profit_ratio": cash_profit_ratio,
                "free_cash_flow_positive": free_cash_flow_positive,
                "accrual_risk": accrual_risk,
                "debtor_days": debtor_days,
                "flags": risk_flags,
            },
            "scores": {
                "technical_score": technical_score,
                "fundamental_score": fundamental_score,
                "forensic_score": forensic_score,
                "total_score": total_score,
            },
            "brokerage": {
                "thesis": thesis,
                "positives": positives,
                "risks": risks,
            },
            "decision": {
                "action": action,
                "confidence": confidence,
                "summary": summary,
            },
        }

    except Exception as e:
        return {
            "symbol": base_symbol,
            "yahoo_symbol": yahoo_symbol,
            "profile": {
                "company_name": company_name,
                "sector": "N/A",
                "industry": industry_from_file,
                "business": "Business description not available.",
            },
            "technical": {
                "price": None,
                "previous_close": None,
                "change": None,
                "change_percent": None,
                "open": None,
                "day_high": None,
                "day_low": None,
                "52_week_high": None,
                "52_week_low": None,
                "sma20": None,
                "sma50": None,
                "sma200": None,
                "rsi": None,
                "volume_trend": "N/A",
                "volume": None,
            },
            "fundamentals": {
                "trailing_pe": None,
                "forward_pe": None,
                "price_to_book": None,
                "roe": None,
                "roa": None,
                "debt_to_equity": None,
                "current_ratio": None,
                "revenue_growth": None,
                "earnings_growth": None,
                "dividend_yield": None,
                "market_cap_cr": None,
            },
            "forensic": {
                "risk_score": 5,
                "cash_profit_ratio": None,
                "free_cash_flow_positive": None,
                "accrual_risk": None,
                "debtor_days": None,
                "flags": [f"yfinance fetch failed: {str(e)}"],
            },
            "scores": {
                "technical_score": 0,
                "fundamental_score": 0,
                "forensic_score": 0,
                "total_score": 0,
            },
            "brokerage": {
                "thesis": "Data could not be fully fetched from Yahoo Finance.",
                "positives": [],
                "risks": [str(e)],
            },
            "decision": {
                "action": "Hold",
                "confidence": 0,
                "summary": "No reliable data available from upstream source.",
            },
        }


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)