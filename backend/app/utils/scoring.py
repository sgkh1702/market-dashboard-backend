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


def derive_forensic_score(forensic: dict):
    score = 0

    cfo_pat = forensic.get("cfoPat")
    debt_equity = forensic.get("debtEquity")
    opm_current = forensic.get("opmCurrent")
    recv_days_current = forensic.get("recvDaysCurrent")
    inv_days_current = forensic.get("invDaysCurrent")
    pledge_pct = forensic.get("pledgePct")

    if cfo_pat is not None:
        if cfo_pat >= 1:
            score += 30
        elif cfo_pat >= 0.8:
            score += 20
        elif cfo_pat >= 0.6:
            score += 10

    if debt_equity is not None:
        normalized_dte = debt_equity / 100 if debt_equity > 10 else debt_equity
        if normalized_dte <= 0.5:
            score += 20
        elif normalized_dte <= 1:
            score += 10

    if opm_current is not None:
        if opm_current >= 15:
            score += 15
        elif opm_current >= 8:
            score += 10
        elif opm_current > 0:
            score += 5

    if recv_days_current is not None:
        if recv_days_current <= 45:
            score += 15
        elif recv_days_current <= 75:
            score += 8

    if inv_days_current is not None:
        if inv_days_current <= 90:
            score += 10
        elif inv_days_current <= 140:
            score += 5

    if pledge_pct is not None:
        if pledge_pct == 0:
            score += 10
        elif pledge_pct <= 5:
            score += 5

    return min(score, 100)


def derive_forensic_grade(score: int):
    if score >= 80:
        return "A"
    if score >= 65:
        return "B"
    if score >= 50:
        return "C"
    return "D"


def derive_cashflow_quality(forensic: dict):
    cfo_pat = forensic.get("cfoPat")
    if cfo_pat is None:
        return "Watch"
    if cfo_pat >= 1:
        return "Pass"
    if cfo_pat >= 0.8:
        return "Watch"
    return "Weak"


def derive_earnings_quality(forensic: dict):
    cfo_pat = forensic.get("cfoPat")
    if cfo_pat is None:
        return "Watch"
    if cfo_pat >= 1:
        return "Pass"
    if cfo_pat >= 0.8:
        return "Watch"
    return "Weak"


def derive_margin_stability(forensic: dict):
    opm = forensic.get("opmCurrent")
    if opm is None:
        return "Neutral"
    if opm > 15:
        return "Pass"
    if opm > 8:
        return "Watch"
    return "Weak"


def derive_red_flags(forensic: dict):
    flags = 0

    dte = forensic.get("debtEquity")
    recv_days = forensic.get("recvDaysCurrent")
    inv_days = forensic.get("invDaysCurrent")
    cfo_pat = forensic.get("cfoPat")
    pledge_pct = forensic.get("pledgePct")

    if dte is not None:
        normalized_dte = dte / 100 if dte > 10 else dte
        if normalized_dte > 1.5:
            flags += 1

    if recv_days is not None and recv_days > 90:
        flags += 1

    if inv_days is not None and inv_days > 150:
        flags += 1

    if cfo_pat is not None and cfo_pat < 0.8:
        flags += 1

    if pledge_pct is not None and pledge_pct > 5:
        flags += 1

    return flags