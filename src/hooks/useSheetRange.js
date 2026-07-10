import { useEffect, useState } from "react";

const SHEET_ID = "1t_AAtFwWPnqeNoVwDFbV8rtCIEXwQ8e3kLFHoRSlre0";
const API_KEY = "AIzaSyB26mEZ7Lh-eS0npTPiGgT9r9hwdthUJQ0";
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

const cache = new Map();
const pendingRequests = new Map();
const CACHE_TTL = 60 * 1000;

function getKey(sheetName, range) {
  return `${sheetName}!${range}`;
}

async function fetchSheetRange(sheetName, range) {
  const key = getKey(sheetName, range);
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const url = `${BASE_URL}/${sheetName}!${range}?key=${API_KEY}`;

  const request = fetch(url)
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(`Rate limited for ${key}`);
        }
        throw new Error(`Request failed: ${res.status}`);
      }

      const json = await res.json();
      const values = json.values || [];

      cache.set(key, {
        data: values,
        timestamp: Date.now(),
      });

      return values;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);
  return request;
}

export default function useSheetRange(sheetName, range) {
  const [data, setData] = useState(() => {
    const cached = cache.get(getKey(sheetName, range));
    return cached ? cached.data : null;
  });

  useEffect(() => {
    let active = true;

    fetchSheetRange(sheetName, range)
      .then((values) => {
        if (active) setData(values);
      })
      .catch((err) => {
        console.error("useSheetRange error:", err.message);
        if (active) setData([]);
      });

    return () => {
      active = false;
    };
  }, [sheetName, range]);

  return data;
}