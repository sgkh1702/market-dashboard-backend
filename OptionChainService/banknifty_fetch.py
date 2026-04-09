import requests
import pandas as pd
import time
import os
from datetime import datetime

def get_option_chain(symbol, columns, max_retries=3, retry_delay=5):
    session = requests.Session()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': f'https://www.nseindia.com/option-chain?symbol={symbol}',
    }
    session.headers.update(headers)
    for attempt in range(1, max_retries + 1):
        try:
            session.get(f'https://www.nseindia.com/option-chain?symbol={symbol}', timeout=10)
            time.sleep(1)
            url = f'https://www.nseindia.com/api/option-chain-indices?symbol={symbol}'
            response = session.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                records = data.get('records', {})
                option_data = records.get('data', [])
                clean = []
                for row in option_data:
                    one = {}
                    for col in columns:
                        if '.' in col:
                            main, sub = col.split('.')
                            one[col] = row.get(main, {}).get(sub, None)
                        else:
                            one[col] = row.get(col, None)
                    clean.append(one)
                print(f"✓ Fetched option chain for {symbol} (Attempt {attempt})")
                return clean
            else:
                print(f"Attempt {attempt}: Failed to fetch {symbol} - HTTP {response.status_code}")
        except Exception as e:
            print(f"Attempt {attempt}: Error fetching {symbol}: {e}")
        if attempt < max_retries:
            print(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    print(f"✗ Failed to fetch {symbol} after {max_retries} attempts")
    return None

def fetch_and_save_banknifty_chain():
    banknifty_fields = [
        "strikePrice", "expiryDate",
        "CE.expiryDate", "CE.openInterest", "CE.changeinOpenInterest",
        "CE.pchangeinOpenInterest", "CE.totalTradedVolume", "CE.impliedVolatility",
        "CE.lastPrice", "CE.change", "CE.underlyingValue",
        "PE.openInterest", "PE.changeinOpenInterest", "PE.pchangeinOpenInterest",
        "PE.totalTradedVolume", "PE.impliedVolatility", "PE.lastPrice",
        "PE.change", "PE.pChange", "PE.underlyingValue", "Symbol"
    ]
    bn_data = get_option_chain('BANKNIFTY', banknifty_fields[:-1])
    if bn_data:
        df_bn = pd.DataFrame(bn_data)
        df_bn['Symbol'] = 'BANKNIFTY'
        df_bn = df_bn.reindex(columns=banknifty_fields)  # enforce consistent columns
        banknifty_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'banknifty_option_chain_custom.csv')
        df_bn.to_csv(banknifty_csv, index=False)
        print(f"✓ BANKNIFTY: {len(df_bn)} strikes, file saved")
    else:
        print("✗ BANKNIFTY: Failed to fetch")

def main():
    INTERVAL_MINUTES = 3
    update_count = 0
    try:
        while True:
            update_count += 1
            print(f"\n[Update #{update_count}] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("-" * 80)
            fetch_and_save_banknifty_chain()
            print("-" * 80)
            time.sleep(INTERVAL_MINUTES * 60)
    except KeyboardInterrupt:
        print("Script stopped by user.")

if __name__ == "__main__":
    main()
