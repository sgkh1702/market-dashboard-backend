import requests

symbol = "SIEMENS"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.nseindia.com/",
}

session = requests.Session()
session.get("https://www.nseindia.com", headers=headers, timeout=15)

resp = session.get(
    f"https://www.nseindia.com/api/quote-equity?symbol={symbol}",
    headers=headers,
    timeout=15,
)

print(resp.status_code)
print(resp.text[:1000])