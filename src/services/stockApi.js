const API_BASE =
  process.env.REACT_APP_API_BASE || "https://market-dashboard-backend-3.onrender.com";

export async function searchStocks(query) {
  const url = `${API_BASE}/api/stocks/search?q=${encodeURIComponent(query)}`;
  console.log("Fetching search URL:", url);

  const res = await fetch(url);
  console.log("Search status:", res.status);

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  const data = await res.json();
  console.log("Search JSON:", data);
  return data;
}

export async function fetchStockResearch(symbol) {
  const url = `${API_BASE}/api/stocks/${symbol}/research`;
  console.log("Fetching research URL:", url);

  const res = await fetch(url);
  console.log("Research status:", res.status);

  if (!res.ok) {
    throw new Error(`Research failed: ${res.status}`);
  }

  return res.json();
}