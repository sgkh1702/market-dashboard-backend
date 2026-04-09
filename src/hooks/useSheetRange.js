import { useState, useEffect } from "react";

const SHEET_ID = "1t_AAtFwWPnqeNoVwDFbV8rtCIEXwQ8e3kLFHoRSlre0";
const API_KEY = "AIzaSyB26mEZ7Lh-eS0npTPiGgT9r9hwdthUJQ0";

export default function useSheetRange(sheetName, range) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`)
      .then(res => res.json())
      .then(res => setData(res.values || []))
      .catch(() => setData([]));
  }, [sheetName, range]);
  return data;
}
