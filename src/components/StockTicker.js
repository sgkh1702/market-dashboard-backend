import React, { useState, useEffect } from "react";

function StockTicker() {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${"1t_AAtFwWPnqeNoVwDFbV8rtCIEXwQ8e3kLFHoRSlre0"}/values/Ticker!A2:C100?key=${"AIzaSyB26mEZ7Lh-eS0npTPiGgT9r9hwdthUJQ0"}`;

    const fetchPrices = async () => {
      try {
        const res = await fetch(apiUrl);
        const json = await res.json();
        const rows = (json.values || []).filter(r => r[0] && r[1] && r[2]);
        setPrices(rows);
      } catch {
        setPrices([]);
      }
    };

    fetchPrices();
    const timer = setInterval(fetchPrices, 15000);
    return () => clearInterval(timer);
  }, []);

  const scrollSecs = Math.max(50, prices.length * 2); // reduced speed

  const openChart = (symbol) => {
    const url = `https://in.tradingview.com/chart/?symbol=NSE%3A${symbol}`;
    window.open(url, "_blank");
  };

  return (
    <div
      className="ticker-outer"
      style={{
        overflow: "hidden",
        whiteSpace: "nowrap",
        background: "#f4f7fa",
        borderTop: "1px solid #d7dde8",
        borderBottom: "1px solid #d7dde8",
        minHeight: "30px",             // slightly smaller height
        cursor: "pointer",
        fontSize: 16,                 // more moderate font size
        fontWeight: 600,
        color: "#225",
        display: "flex",
        alignItems: "center",
	width: 1200,    // set to any large value or 100%
    	maxWidth: "100vw",
      }}
    >
      <div
        className="ticker-inner"
        style={{
          display: "inline-block",
          animation: `ticker-scroll ${scrollSecs}s linear infinite`,
          animationDelay: "3s",
          paddingLeft: "100%",
        }}
      >
        {prices.length > 0 ? prices.map(([symbol, cmp, prevClose], i) => {
          const cmpNum = Number(cmp.replace(/,/g, '').trim());
          const prevNum = Number(prevClose.replace(/,/g, '').trim());
          const cmpColor = cmpNum > prevNum ? "green" : cmpNum < prevNum ? "red" : "black";

          return (
            <span
              key={symbol + i}
              onClick={() => openChart(symbol)}
              style={{
                marginRight: 40,
                fontSize: "1rem",
                fontWeight: "600",
                color: cmpColor,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 4,
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#e8ecf3")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
              title={`Click to open ${symbol} chart on TradingView`}
            >
              {symbol}: {cmp}
            </span>
          );
        }) : <span style={{ color: "gray" }}>NO DATA FOUND</span>}
      </div>
      <style>
        {`
          @keyframes ticker-scroll {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .ticker-outer:hover .ticker-inner {
            animation-play-state: paused !important;
          }
        `}
      </style>
    </div>
  );
}

export default StockTicker;
