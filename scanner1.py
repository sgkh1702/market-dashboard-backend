from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import csv
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import time
import io

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent

# ---------- LOAD SYMBOL LISTS ----------

def load_symbols_from_csv(filename):
    path = BASE_DIR / filename
    symbols = []
    try:
        with open(path, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                sym = (row.get('Symbol') or '').strip()
                if sym:
                    symbols.append(sym + ".NS")
    except Exception as e:
        print(f"Error loading {filename}: {e}")
    return symbols

LARGECAP_TEST = [
    "RELIANCE.NS",
    "HDFCBANK.NS",
    "INFY.NS",
    "TCS.NS",
    "ICICIBANK.NS",
    "SBIN.NS",
    "KOTAKBANK.NS",
    "LT.NS",
    "AXISBANK.NS",
    "ITC.NS",
]

MIDCAP = load_symbols_from_csv("nifty_midcap_150.csv")
SMALLCAP = load_symbols_from_csv("nifty_smallcap_250.csv")

UNIVERSES = {
    "largecap": LARGECAP_TEST,
    "midcap": MIDCAP,
    "smallcap": SMALLCAP,
}

# ---------- FUNDAMENTALS (simple) ----------

def compute_fundamentals(symbol):
    try:
        t = yf.Ticker(symbol)
        info = t.info

        price = info.get("currentPrice") or 0
        pe = info.get("trailingPE") or info.get("forwardPE")
        pb = info.get("priceToBook") or 0
        roe = info.get("returnOnEquity") or 0
        sector = info.get("sector") or "N/A"
        industry = info.get("industry") or "N/A"
        mcap = info.get("marketCap") or 0

        if price == 0 and mcap == 0:
            return None

        score = 0
        if roe and roe > 0.15:
            score += 1
        if pb and pb < 3:
            score += 1
        if pe and pe < 25:
            score += 1

        match = score >= 2

        return {
            "symbol": symbol.replace(".NS", ""),
            "price": round(price, 2),
            "pe": round(pe, 2) if pe else None,
            "pb": round(pb, 2) if pb else None,
            "roe_pct": round(roe * 100, 1) if roe else None,
            "market_cap": mcap,
            "sector": sector,
            "industry": industry,
            "score": score,
            "match": match,
        }
    except Exception as e:
        print("Fundamental error:", symbol, e)
        return None

# ---------- TECHNICALS (pandas only, safe) ----------

def compute_technicals(symbol):
    try:
        data = yf.download(
            symbol,
            period="6mo",
            interval="1d",
            progress=False,
            auto_adjust=True,
            group_by="column",
        )
        if data is None or len(data) < 40:
            return None

        close = data["Close"]
        volume = data["Volume"]

        # last values as scalars
        price = close.iloc[-1].item()
        sma20 = close.rolling(20).mean().iloc[-1]
        sma50 = close.rolling(50).mean().iloc[-1]
        high_6m = close.rolling(120).max().iloc[-1]
        vol_ma20 = volume.rolling(20).mean().iloc[-1]
        vol_last = volume.iloc[-1].item()

        sma20 = sma20.item() if not pd.isna(sma20) else price
        sma50 = sma50.item() if not pd.isna(sma50) else price
        high_6m = high_6m.item() if not pd.isna(high_6m) else price
        vol_ma20 = (
            vol_ma20.item() if not pd.isna(vol_ma20) and vol_ma20 != 0 else 0.0
        )

        vol_ratio = (vol_last / vol_ma20) if vol_ma20 != 0 else 0.0
        near_high = (
            abs(price - high_6m) / high_6m < 0.02 if high_6m != 0 else False
        )

        score = 0
        if near_high:
            score += 1
        if price > sma20:
            score += 1
        if price > sma50:
            score += 1
        if vol_ratio > 1.2:
            score += 1

        return {
            "symbol": symbol.replace(".NS", ""),
            "price": round(price, 2),
            "sma20": round(sma20, 2),
            "sma50": round(sma50, 2),
            "near_high": bool(near_high),
            "vol_ratio": round(vol_ratio, 2),
            "breakout_score": int(score),
        }
    except Exception as e:
        print("Technical error simple:", symbol, e)
        return None

# ---------- ROUTES ----------

@app.route("/")
def home():
    return jsonify(
        {
            "message": "Scanner1 Ready",
            "universes": list(UNIVERSES.keys()),
            "examples": [
                "/scan?type=technical&universe=largecap",
                "/scan?type=fundamental&universe=largecap",
                "/scan/csv?type=both&universe=largecap",
            ],
        }
    )

@app.route("/scan")
def scan():
    scanner_type = request.args.get("type", "both")
    universe = request.args.get("universe", "largecap")
    symbols = UNIVERSES.get(universe, LARGECAP_TEST)

    symbols_to_scan = symbols[:10]

    start = time.time()
    results = []

    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = []
        if scanner_type in ["fundamental", "both"]:
            futures += [
                ex.submit(compute_fundamentals, s) for s in symbols_to_scan
            ]
        if scanner_type in ["technical", "both"]:
            futures += [
                ex.submit(compute_technicals, s) for s in symbols_to_scan
            ]

        for f in futures:
            r = f.result()
            if r:
                results.append(r)

    fund_results = [r for r in results if "pe" in r]
    tech_results = [r for r in results if "breakout_score" in r]

    fund_hits = [r for r in fund_results if r["match"]]
    tech_hits = sorted(
        tech_results, key=lambda x: x["breakout_score"], reverse=True
    )

    return jsonify(
        {
            "universe": universe,
            "symbols_scanned": len(symbols_to_scan),
            "fundamental": fund_results,
            "fundamental_hits": fund_hits,
            "technical": tech_results,
            "technical_hits": tech_hits[:10],
            "scan_time": round(time.time() - start, 1),
            "timestamp": pd.Timestamp.now().isoformat(),
        }
    )

@app.route("/scan/csv")
def scan_csv():
    scanner_type = request.args.get("type", "both")
    universe = request.args.get("universe", "largecap")
    symbols = UNIVERSES.get(universe, LARGECAP_TEST)
    symbols_to_scan = symbols[:10]

    results = []

    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = []
        if scanner_type in ["fundamental", "both"]:
            futures += [
                ex.submit(compute_fundamentals, s) for s in symbols_to_scan
            ]
        if scanner_type in ["technical", "both"]:
            futures += [
                ex.submit(compute_technicals, s) for s in symbols_to_scan
            ]
        for f in futures:
            r = f.result()
            if r:
                results.append(r)

    df = pd.DataFrame(results)
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)

    filename = f"scan_{universe}_{scanner_type}_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

if __name__ == "__main__":
    print("Scanner1 running on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=True)
