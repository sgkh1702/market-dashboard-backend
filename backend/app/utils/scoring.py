def derive_trend_label(cmp_price, sma20, sma50, sma200, rsi14):
    if None in (cmp_price, sma20, sma50):
        return "Neutral"
    if cmp_price > sma20 and cmp_price > sma50 and (rsi14 is None or rsi14 < 70):
        return "Bullish"
    if cmp_price < sma20 and cmp_price < sma50:
        return "Bearish"
    return "Neutral"

def derive_trend_score(cmp_price, sma20, sma50, sma200, rsi14):
    score = 0
    if cmp_price is not None and sma20 is not None and cmp_price > sma20:
        score += 25
    if cmp_price is not None and sma50 is not None and cmp_price > sma50:
        score += 25
    if cmp_price is not None and sma200 is not None and cmp_price > sma200:
        score += 20
    if sma20 is not None and sma50 is not None and sma20 > sma50:
        score += 15
    if rsi14 is not None and 45 <= rsi14 <= 70:
        score += 15
    return min(score, 100)

def derive_forensic_score(financial: dict):
    score = 0

    dte = financial.get("debtToEquity")
    roe = financial.get("roe")
    sales_growth = financial.get("salesGrowthYoY")
    current_ratio = financial.get("currentRatio")
    net_margin = financial.get("netMargin")

    if dte is not None and dte < 1:
        score += 25
    if net_margin is not None and net_margin > 0:
        score += 20
    if current_ratio is not None and current_ratio > 1:
        score += 15
    if roe is not None and roe > 10:
        score += 20
    if sales_growth is not None and sales_growth > 0:
        score += 20

    return min(score, 100)

def derive_forensic_grade(score: int):
    if score >= 80:
        return "A"
    if score >= 65:
        return "B"
    if score >= 50:
        return "C"
    return "D"

def derive_cashflow_quality(financial: dict):
    c = financial.get("currentRatio")
    return "Pass" if c is not None and c > 1 else "Watch"

def derive_earnings_quality(financial: dict):
    m = financial.get("netMargin")
    return "Pass" if m is not None and m > 0 else "Watch"

def derive_margin_stability(financial: dict):
    opm = financial.get("operatingMargin")
    if opm is None:
        return "Neutral"
    if opm > 15:
        return "Pass"
    if opm > 8:
        return "Watch"
    return "Weak"

def derive_red_flags(financial: dict):
    flags = 0
    dte = financial.get("debtToEquity")
    current_ratio = financial.get("currentRatio")
    net_margin = financial.get("netMargin")

    if dte is not None and dte > 1.5:
        flags += 1
    if current_ratio is not None and current_ratio < 1:
        flags += 1
    if net_margin is not None and net_margin < 0:
        flags += 1

    return flags