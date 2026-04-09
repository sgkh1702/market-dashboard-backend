import yfinance as yf


def get_first_available(df, possible_rows):
    try:
        if df is None or df.empty:
            return None
        for row_name in possible_rows:
            if row_name in df.index:
                row = df.loc[row_name].dropna()
                if not row.empty:
                    return float(row.iloc[0])
        return None
    except:
        return None


def safe_growth(df, possible_rows):
    try:
        if df is None or df.empty:
            return None
        for row_name in possible_rows:
            if row_name in df.index:
                row = df.loc[row_name].dropna()
                if len(row) >= 2:
                    latest = float(row.iloc[0])
                    previous = float(row.iloc[1])
                    if previous == 0:
                        return None
                    return ((latest - previous) / abs(previous)) * 100
        return None
    except:
        return None


def fmt_ratio(value):
    try:
        if value is None:
            return "NA"
        return round(float(value), 2)
    except:
        return "NA"


def calc_ratio(numerator, denominator, multiply_by_100=False):
    try:
        if numerator is None or denominator in [None, 0]:
            return None
        value = numerator / denominator
        if multiply_by_100:
            value = value * 100
        return round(value, 2)
    except:
        return None


def normalize_percent_field(value):
    try:
        if value is None:
            return None
        return float(value) * 100
    except:
        return None


def normalize_debt_to_equity(value):
    try:
        if value is None:
            return None
        value = float(value)
        return value / 100
    except:
        return None


def get_stock_analysis(symbol: str):
    clean_symbol = symbol.upper().replace(".NS", "")
    yahoo_symbol = f"{clean_symbol}.NS"

    ticker = yf.Ticker(yahoo_symbol)
    hist = ticker.history(period="6mo")
    financials = ticker.financials
    balance_sheet = ticker.balance_sheet
    cashflow = ticker.cashflow
    info = ticker.info

    profile = {
        "company_name": info.get("longName") or info.get("shortName") or clean_symbol,
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "business": info.get("longBusinessSummary", "Business description not available.")
    }

    if hist.empty:
        return {
            "symbol": clean_symbol,
            "profile": {
                "company_name": clean_symbol,
                "sector": "N/A",
                "industry": "N/A",
                "business": "Business description not available."
            },
            "technical": {
                "price": "No data",
                "sma20": "No data",
                "sma50": "No data",
                "sma200": "No data",
                "rsi": "No data",
                "volume_trend": "No data"
            },
            "fundamentals": {
                "trailing_pe": "NA",
                "price_to_book": "NA",
                "roe": "NA",
                "roa": "NA",
                "debt_to_equity": "NA",
                "current_ratio": "NA",
                "revenue_growth": "NA",
                "earnings_growth": "NA",
                "dividend_yield": "NA",
                "market_cap_cr": "NA"
            },
            "forensic": {
                "risk_score": "NA",
                "flags": ["No stock data found for this symbol"]
            },
            "scores": {
                "technical_score": 0,
                "fundamental_score": 0,
                "forensic_score": 0,
                "total_score": 0
            },
            "brokerage": {
                "thesis": "No data available.",
                "positives": [],
                "risks": []
            },
            "decision": {
                "action": "NA",
                "confidence": 0,
                "summary": "Could not fetch live stock data."
            }
        }

    close = hist["Close"]
    volume = hist["Volume"]

    latest_price = round(float(close.iloc[-1]), 2)
    sma20_val = round(float(close.tail(20).mean()), 2) if len(close) >= 20 else latest_price
    sma50_val = round(float(close.tail(50).mean()), 2) if len(close) >= 50 else latest_price
    sma200_val = round(float(close.tail(200).mean()), 2) if len(close) >= 200 else latest_price

    def above_below(price, sma):
        return "Above" if price > sma else "Below"

    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    latest_rsi = round(float(rsi.iloc[-1]), 2) if not rsi.dropna().empty else 0

    avg_volume_20 = volume.tail(20).mean() if len(volume) >= 20 else volume.mean()
    latest_volume = volume.iloc[-1]
    volume_trend = "High" if latest_volume > avg_volume_20 else "Normal"

    net_income = get_first_available(financials, ["Net Income", "Net Income Common Stockholders"])
    total_revenue = get_first_available(financials, ["Total Revenue", "Operating Revenue"])
    operating_cash_flow = get_first_available(cashflow, ["Operating Cash Flow", "Cash Flow From Continuing Operating Activities"])
    total_debt = get_first_available(balance_sheet, ["Total Debt"])
    stockholders_equity = get_first_available(balance_sheet, ["Stockholders Equity", "Total Equity Gross Minority Interest", "Common Stock Equity"])
    total_assets = get_first_available(balance_sheet, ["Total Assets"])
    current_assets = get_first_available(balance_sheet, ["Current Assets", "Total Current Assets"])
    current_liabilities = get_first_available(balance_sheet, ["Current Liabilities", "Total Current Liabilities"])

    net_income_growth_stmt = safe_growth(financials, ["Net Income", "Net Income Common Stockholders"])
    revenue_growth_stmt = safe_growth(financials, ["Total Revenue", "Operating Revenue"])

    forensic_flags = []
    risk_score = 0

    if operating_cash_flow is not None and net_income is not None:
        if operating_cash_flow < net_income:
            forensic_flags.append("Operating cash flow is below net income")
            risk_score += 1
        else:
            forensic_flags.append("Operating cash flow supports reported profit")
    else:
        forensic_flags.append("Cash flow vs profit data not available")

    debt_to_equity_stmt = calc_ratio(total_debt, stockholders_equity, multiply_by_100=False)
    if debt_to_equity_stmt is not None:
        if debt_to_equity_stmt > 1:
            forensic_flags.append(f"Debt-to-equity looks elevated at {debt_to_equity_stmt}")
            risk_score += 1
        else:
            forensic_flags.append(f"Debt-to-equity looks manageable at {debt_to_equity_stmt}")
    else:
        forensic_flags.append("Debt/equity data not available")

    if net_income_growth_stmt is not None:
        if net_income_growth_stmt < 0:
            forensic_flags.append(f"Net income growth is negative at {round(net_income_growth_stmt, 2)}%")
            risk_score += 1
        else:
            forensic_flags.append(f"Net income growth is positive at {round(net_income_growth_stmt, 2)}%")
    else:
        forensic_flags.append("Net income trend data not available")

    trailing_pe = fmt_ratio(info.get("trailingPE"))
    price_to_book = fmt_ratio(info.get("priceToBook"))

    roe_info = normalize_percent_field(info.get("returnOnEquity"))
    roa_info = normalize_percent_field(info.get("returnOnAssets"))
    debt_to_equity_info = normalize_debt_to_equity(info.get("debtToEquity"))
    current_ratio_info = info.get("currentRatio")
    revenue_growth_info = normalize_percent_field(info.get("revenueGrowth"))
    earnings_growth_info = normalize_percent_field(info.get("earningsGrowth"))
    dividend_yield_info = info.get("dividendYield")
    market_cap = info.get("marketCap")

    roe_calc = calc_ratio(net_income, stockholders_equity, multiply_by_100=True)
    roa_calc = calc_ratio(net_income, total_assets, multiply_by_100=True)
    current_ratio_calc = calc_ratio(current_assets, current_liabilities, multiply_by_100=False)

    roe = fmt_ratio(roe_info) if roe_info is not None else (roe_calc if roe_calc is not None else "NA")
    roa = fmt_ratio(roa_info) if roa_info is not None else (roa_calc if roa_calc is not None else "NA")
    debt_to_equity = fmt_ratio(debt_to_equity_info) if debt_to_equity_info is not None else (debt_to_equity_stmt if debt_to_equity_stmt is not None else "NA")
    current_ratio = fmt_ratio(current_ratio_info) if current_ratio_info is not None else (current_ratio_calc if current_ratio_calc is not None else "NA")
    revenue_growth = fmt_ratio(revenue_growth_info) if revenue_growth_info is not None else (round(revenue_growth_stmt, 2) if revenue_growth_stmt is not None else "NA")
    earnings_growth = fmt_ratio(earnings_growth_info) if earnings_growth_info is not None else (round(net_income_growth_stmt, 2) if net_income_growth_stmt is not None else "NA")
    dividend_yield = fmt_ratio(dividend_yield_info)

    if market_cap is not None:
        market_cap = round(market_cap / 10000000, 2)
    else:
        market_cap = "NA"

    technical_score = 0
    fundamental_score = 0
    forensic_score = 0

    positives = []
    risks = []

    if latest_price > sma20_val:
        technical_score += 1
        positives.append("Price is above 20 SMA")
    else:
        risks.append("Price is below 20 SMA")

    if latest_price > sma50_val:
        technical_score += 1
        positives.append("Price is above 50 SMA")
    else:
        risks.append("Price is below 50 SMA")

    if latest_price > sma200_val:
        technical_score += 1
        positives.append("Price is above 200 SMA")
    else:
        risks.append("Price is below 200 SMA")

    if 45 <= latest_rsi <= 65:
        technical_score += 1
        positives.append("RSI is in a balanced momentum zone")
    elif latest_rsi < 35:
        positives.append("RSI is in a weak zone and may allow rebound setups")
    elif latest_rsi > 70:
        risks.append("RSI is in overbought territory")
    else:
        risks.append("RSI momentum is not ideal")

    if volume_trend == "High":
        technical_score += 1
        positives.append("Volume is above recent average")

    if roe != "NA":
        if float(roe) >= 15:
            fundamental_score += 2
            positives.append(f"ROE is strong at {roe}%")
        elif float(roe) >= 10:
            fundamental_score += 1
            positives.append(f"ROE is acceptable at {roe}%")
        else:
            risks.append(f"ROE is weak at {roe}%")

    if debt_to_equity != "NA":
        if float(debt_to_equity) <= 0.5:
            fundamental_score += 2
            positives.append(f"Debt to equity is comfortable at {debt_to_equity}")
        elif float(debt_to_equity) <= 1:
            fundamental_score += 1
            positives.append(f"Debt to equity is manageable at {debt_to_equity}")
        else:
            risks.append(f"Debt to equity is high at {debt_to_equity}")

    if revenue_growth != "NA":
        if float(revenue_growth) >= 10:
            fundamental_score += 1
            positives.append(f"Revenue growth is healthy at {revenue_growth}%")
        elif float(revenue_growth) < 0:
            risks.append(f"Revenue growth is negative at {revenue_growth}%")

    if earnings_growth != "NA":
        if float(earnings_growth) >= 10:
            fundamental_score += 2
            positives.append(f"Earnings growth is strong at {earnings_growth}%")
        elif float(earnings_growth) >= 0:
            fundamental_score += 1
            positives.append(f"Earnings growth is positive at {earnings_growth}%")
        else:
            risks.append(f"Earnings growth is negative at {earnings_growth}%")

    if trailing_pe != "NA":
        if float(trailing_pe) <= 20:
            fundamental_score += 1
            positives.append(f"Valuation looks reasonable with P/E at {trailing_pe}")
        elif float(trailing_pe) > 35:
            risks.append(f"Valuation looks expensive with P/E at {trailing_pe}")

    if risk_score == 0:
        forensic_score += 2
        positives.append("Forensic checks show no immediate red flags")
    elif risk_score == 1:
        forensic_score += 1
        risks.append("One forensic concern is present")
    else:
        forensic_score -= 1
        risks.append("Multiple forensic concerns are present")

    total_score = technical_score + fundamental_score + forensic_score

    if total_score >= 8:
        action = "BUY"
        confidence = 80
        summary = "Technical, fundamental, and forensic signals are supportive."
    elif total_score >= 5:
        action = "WATCH"
        confidence = 68
        summary = "The stock has constructive signals but still needs monitoring."
    elif total_score >= 2:
        action = "HOLD / CAUTION"
        confidence = 58
        summary = "Signals are mixed and conviction is moderate."
    else:
        action = "AVOID"
        confidence = 50
        summary = "Weak combined score across technical, fundamental, and forensic checks."

    if len(positives) == 0:
        positives.append("No major positive factors identified from current rules")

    if len(risks) == 0:
        risks.append("No major risks identified from current rules")

    thesis_parts = []
    if technical_score >= 4:
        thesis_parts.append("technical trend is supportive")
    elif technical_score >= 2:
        thesis_parts.append("technical picture is mixed")
    else:
        thesis_parts.append("technical trend is weak")

    if fundamental_score >= 4:
        thesis_parts.append("fundamentals are strong")
    elif fundamental_score >= 2:
        thesis_parts.append("fundamentals are acceptable")
    else:
        thesis_parts.append("fundamentals need caution")

    if risk_score == 0:
        thesis_parts.append("forensic checks are clean")
    else:
        thesis_parts.append("forensic review shows some caution")

    thesis = (
        f"{clean_symbol} operates in the {profile['sector']} sector "
        f"and {profile['industry']} industry, and currently shows that "
        + ", ".join(thesis_parts)
        + "."
    )

    return {
        "symbol": clean_symbol,
        "profile": profile,
        "technical": {
            "price": latest_price,
            "sma20": f"{sma20_val} ({above_below(latest_price, sma20_val)})",
            "sma50": f"{sma50_val} ({above_below(latest_price, sma50_val)})",
            "sma200": f"{sma200_val} ({above_below(latest_price, sma200_val)})",
            "rsi": latest_rsi,
            "volume_trend": volume_trend
        },
        "fundamentals": {
            "trailing_pe": trailing_pe,
            "price_to_book": price_to_book,
            "roe": roe,
            "roa": roa,
            "debt_to_equity": debt_to_equity,
            "current_ratio": current_ratio,
            "revenue_growth": revenue_growth,
            "earnings_growth": earnings_growth,
            "dividend_yield": dividend_yield,
            "market_cap_cr": market_cap
        },
        "forensic": {
            "risk_score": risk_score,
            "flags": forensic_flags
        },
        "scores": {
            "technical_score": technical_score,
            "fundamental_score": fundamental_score,
            "forensic_score": forensic_score,
            "total_score": total_score
        },
        "brokerage": {
            "thesis": thesis,
            "positives": positives,
            "risks": risks
        },
        "decision": {
            "action": action,
            "confidence": confidence,
            "summary": summary
        }
    }