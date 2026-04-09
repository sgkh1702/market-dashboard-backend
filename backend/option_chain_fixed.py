import requests
import pandas as pd
from datetime import datetime
import time
import os

def get_option_chain(symbol, columns, max_retries=3, retry_delay=5):
    session = requests.Session()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': f'https://www.nseindia.com/option-chain?symbol={symbol}',
        'X-Requested-With': 'XMLHttpRequest'
    }
    session.headers.update(headers)
    
    # Dynamic endpoint: indices vs equity
    endpoint = 'option-chain-indices' if symbol in ['NIFTY', 'BANKNIFTY', 'FINNIFTY'] else 'option-chain-equity'
    
    for attempt in range(1, max_retries + 1):
        try:
            # Pre-fetch cookies with longer timeout during pre-open
            session.get(f'https://www.nseindia.com/option-chain?symbol={symbol}', timeout=15)
            time.sleep(2)  # NSE needs longer pause during high load
            
            url = f'https://www.nseindia.com/api/{endpoint}?symbol={symbol}'
            print(f"Fetching {symbol} from /{endpoint}")
            response = session.get(url, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                records = data.get('records', {})
                option_data = records.get('data', [])
                if not option_data:
                    print(f"⚠️ No data returned for {symbol} (pre-open/empty chain?)")
                    return None
                    
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
                print(f"✓ Fetched {symbol}: {len(clean)} strikes (Attempt {attempt})")
                return clean
            else:
                print(f"Attempt {attempt}: {symbol} HTTP {response.status_code} from /{endpoint}")
        except Exception as e:
            print(f"Attempt {attempt}: {symbol} error: {e}")
        
        if attempt < max_retries:
            print(f"Retrying {symbol} in {retry_delay}s...")
            time.sleep(retry_delay * 2)  # Longer retry during pre-open
    
    print(f"✗ {symbol} failed after {max_retries} attempts")
    return None

def fetch_and_save_option_chains():
    # Field order and list for NIFTY
    nifty_fields = [
        "strikePrice", "expiryDate",
        "CE.strikePrice", "CE.expiryDate", "CE.openInterest", "CE.changeinOpenInterest",
        "CE.pchangeinOpenInterest", "CE.totalTradedVolume", "CE.impliedVolatility",
        "CE.lastPrice", "CE.change", "CE.pChange", "CE.underlyingValue",
        "PE.openInterest", "PE.changeinOpenInterest", "PE.pchangeinOpenInterest",
        "PE.totalTradedVolume", "PE.impliedVolatility", "PE.lastPrice",
        "PE.change", "PE.pChange", "Symbol"
    ]

    # Field order and list for BANKNIFTY
    banknifty_fields = [
        "strikePrice", "expiryDate",
        "CE.expiryDate", "CE.openInterest", "CE.changeinOpenInterest",
        "CE.pchangeinOpenInterest", "CE.totalTradedVolume", "CE.impliedVolatility",
        "CE.lastPrice", "CE.change", "CE.underlyingValue",
        "PE.openInterest", "PE.changeinOpenInterest", "PE.pchangeinOpenInterest",
        "PE.totalTradedVolume", "PE.impliedVolatility", "PE.lastPrice",
        "PE.change", "PE.pChange", "PE.underlyingValue", "Symbol"
    ]

    # BANKNIFTY
    bn_data = get_option_chain('BANKNIFTY', banknifty_fields[:-1])  # leave out Symbol for extraction, add after
    if bn_data:
        df_bn = pd.DataFrame(bn_data)
        df_bn['Symbol'] = 'BANKNIFTY'
        df_bn = df_bn.reindex(columns=banknifty_fields)  # enforce consistent columns
        banknifty_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'banknifty_option_chain_custom.csv')
        df_bn.to_csv(banknifty_csv, index=False)
        print(f"✓ BANKNIFTY: {len(df_bn)} strikes, file saved: {banknifty_csv}")
    else:
        print("✗ BANKNIFTY: Failed to fetch")

    time.sleep(2)
    # NIFTY
    n_data = get_option_chain('NIFTY', nifty_fields[:-1])
    if n_data:
        df_n = pd.DataFrame(n_data)
        df_n['Symbol'] = 'NIFTY'
        df_n = df_n.reindex(columns=nifty_fields)
        nifty_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nifty_option_chain_custom.csv')
        df_n.to_csv(nifty_csv, index=False)
        print(f"✓ NIFTY: {len(df_n)} strikes, file saved: {nifty_csv}")
    else:
        print("✗ NIFTY: Failed to fetch")

def main():
    INTERVAL_MINUTES = 3
    update_count = 0
    try:
        while True:
            update_count += 1
            print(f"\n[Update #{update_count}] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} IST")
            print("-" * 80)
            fetch_and_save_option_chains()
            print("-" * 80)
            print(f"Next update in {INTERVAL_MINUTES} minutes...")
            time.sleep(INTERVAL_MINUTES * 60)
    except KeyboardInterrupt:
        print("\nScript stopped by user.")

if __name__ == "__main__":
    main()
