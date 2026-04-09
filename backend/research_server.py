from flask import Flask, request, jsonify
from flask_cors import CORS
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials

SERVICE_ACCOUNT_FILE = 'webpage-interface-59467c78ec92.json'
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SPREADSHEET_ID = '1t_AAtFwWPnqeNoVwDFbV8rtCIEXwQ8e3kLFHoRSlre0'

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

def get_sheets_service():
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build('sheets', 'v4', credentials=creds)

@app.route("/api/setSymbol")
def set_symbol():
    symbol = request.args.get("symbol", "").upper().strip()
    if not symbol:
        return jsonify({"status": "error", "message": "symbol missing"}), 400

    try:
        service = get_sheets_service()
        body = {"values": [[symbol]]}

        # write to StockData!C2
        service.spreadsheets().values().update(
            spreadsheetId=SPREADSHEET_ID,
            range="StockData!C2",
            valueInputOption="USER_ENTERED",
            body=body
        ).execute()

        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
