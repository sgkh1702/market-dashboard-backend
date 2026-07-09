import requests
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
resp = requests.get("https://www.nseindia.com/api/quote-equity?symbol=CHOLAFIN", headers=headers)
data = resp.json()