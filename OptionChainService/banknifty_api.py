import pandas as pd
from flask import Flask, jsonify
import os

app = Flask(__name__)

CSV_PATH = 'banknifty_option_chain_custom.csv'  # adjust as needed


def determine_atm_strike(df):
    """
    Get ATM strike by rounding spot price ('CE.underlyingValue' or 'PE.underlyingValue') to nearest strike increment.
    """
    spot = None
    if 'CE.underlyingValue' in df.columns:
        spot = df['CE.underlyingValue'].dropna().iloc[0]
    elif 'PE.underlyingValue' in df.columns:
        spot = df['PE.underlyingValue'].dropna().iloc[0]
    else:
        spot = df['strikePrice'].mean()  # fallback if spot missing
    # Bank Nifty strikes are spaced by 100
    atm = round(spot / 100) * 100
    return atm


def get_strikes_of_interest(atm, window=7):
    """
    Returns list of strikes ATM ±window for Bank Nifty in increments of 100.
    """
    return [atm + 100 * i for i in range(-window, window + 1)]


def aggregate_metrics(df, strikes):
    section = df[df['strikePrice'].isin(strikes)].copy()

    ce_oi_change = section['CE.changeinOpenInterest'].fillna(0).sum()
    pe_oi_change = section['PE.changeinOpenInterest'].fillna(0).sum()
    pcr = (pe_oi_change / ce_oi_change) if ce_oi_change else 0

    return {
        "CE_OI_Change_Sum": int(ce_oi_change),
        "PE_OI_Change_Sum": int(pe_oi_change),
        "PCR": round(pcr, 2),
        "ATM_Spot": strikes[window := (len(strikes) // 2)],
        "Timestamp": pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
    }


@app.route("/api/banknifty/oi_pcr")
def banknifty_oi_pcr():
    # Find most recent CSV (adapt path or name if needed)
    if not os.path.exists(CSV_PATH):
        return jsonify({"error": "CSV file not found"}), 404
    df = pd.read_csv(CSV_PATH)
    atm = determine_atm_strike(df)
    strikes = get_strikes_of_interest(atm, window=7)
    metrics = aggregate_metrics(df, strikes)
    return jsonify(metrics)


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)
