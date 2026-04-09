import React, { useState, useEffect } from "react";
import { Container, Tabs, Tab, Typography, Box, Paper, CircularProgress } from "@mui/material";

const SHEET_ID = "1t_AAtFwWPnqeNoVwDFbV8rtCIEXwQ8e3kLFHoRSlre0";
const API_KEY = "AIzaSyB26mEZ7Lh-eS0npTPiGgT9r9hwdthUJQ0";

// ---------- Google Sheets Data Hook ----------
function useSheetRange(sheetName, range) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`)
      .then(res => res.json())
      .then(res => setData(res.values || []))
      .catch(() => setData([]));
  }, [sheetName, range]);
  return data;
}

// ---------- StockTicker Component ----------
function StockTicker() {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Ticker!A2:C100?key=${API_KEY}`;
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

  const scrollSecs = Math.max(30, prices.length * 7);

  return (
    <div
      className="ticker-outer"
      style={{
        overflow: "hidden",
        whiteSpace: "nowrap",
        background: "#f4f7fa",
        borderTop: "1px solid #d7dde8",
        borderBottom: "1px solid #d7dde8",
        minHeight: "36px",
        cursor: "pointer"
      }}
    >
      <div
        className="ticker-inner"
        style={{
          display: "inline-block",
          animation: `ticker-scroll ${scrollSecs}s linear infinite`,
          animationDelay: "5s"
        }}
      >
        {prices.length > 0 ? prices.map(([symbol, cmp, prevClose], i) => {
          const cmpNum = Number(cmp.replace(/,/g, '').trim());
          const prevNum = Number(prevClose.replace(/,/g, '').trim());
          const cmpColor = cmpNum > prevNum ? "green" : cmpNum < prevNum ? "red" : "black";

          return (
            <span key={symbol + i} style={{ marginRight: 52, fontSize: 17, fontWeight: 600, color: "#225" }}>
              {symbol}: <span style={{ color: cmpColor }}>{cmp}</span>
            </span>
          );
        }) : <span style={{ color: "gray" }}>NO DATA FOUND</span>}
      </div>
      <style>
        {`
          @keyframes ticker-scroll {
            0% { transform: translateX(110%); }
            10% { transform: translateX(110%); }
            90% { transform: translateX(-110%); }
            100% { transform: translateX(-110%); }
          }
          .ticker-outer:hover .ticker-inner {
            animation-play-state: paused !important;
          }
        `}
      </style>
    </div>
  );
}


function ProfessionalTable({ title, headers, rows }) {
  // Clean/fix rows for rendering: Only arrays of expected length with some real value
  const cleanedRows =
    Array.isArray(rows)
      ? rows.filter(
          row =>
            Array.isArray(row) &&
            row.length === headers.length &&
            row.some(
              cell =>
                cell &&
                cell !== "#N/A" &&
                (typeof cell !== "string" || cell.trim() !== "")
            )
        )
      : [];

  if (!headers || !Array.isArray(headers)) return null;

  return (
    <Paper elevation={2} sx={{ mb: 3, p: 2, minWidth: 225, maxWidth: 310, overflowX: "auto" }}>
      <Typography align="center" sx={{ fontWeight: "bold", bgcolor: "#e0e8f8", mb: 1 }}>
        {title}
      </Typography>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i} style={{ background: "#1869c8", color: "white", padding: "5px", fontWeight: 400 }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cleanedRows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "4px",
                    textAlign: j === 0 ? "left" : "right",
                    color:
                      headers[j] &&
                      headers[j].toLowerCase().includes("change") &&
                      !isNaN(Number(cell)) &&
                      Number(cell) > 0
                        ? "green"
                        : headers[j] &&
                          headers[j].toLowerCase().includes("change") &&
                          !isNaN(Number(cell)) &&
                          Number(cell) < 0
                        ? "red"
                        : "#222"
                  }}
                >
                  {j === 0 ? (
                    <a
                      href={`https://in.tradingview.com/chart/OrMYkn6z/?symbol=NSE%3A${cell}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1869c8", textDecoration: "underline" }}
                    >
                      {cell === "#N/A" ? "" : cell}
                    </a>
                  ) : (
                    cell === "#N/A" ? "" : cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Paper>
  );
}




// ----------- Individual Tab Components -----------

// Global Market Tab
function GlobalMarketTab() {
  const broaderData = useSheetRange("Dashboard", "C6:F10");
  const sectorialData = useSheetRange("Dashboard", "H6:K19");
  const usMarketData = useSheetRange("Dashboard", "M6:P9");
  const asianMarketData = useSheetRange("Dashboard", "M13:P16");

  if (!broaderData || !sectorialData || !usMarketData || !asianMarketData) return <CircularProgress />;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      <ProfessionalTable title="Broader Indices" headers={broaderData[0]} rows={broaderData.slice(1)} />
      <ProfessionalTable title="Sectorial Indices" headers={sectorialData[0]} rows={sectorialData.slice(1)} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <ProfessionalTable title="US Markets" headers={usMarketData[0]} rows={usMarketData.slice(1)} />
        <ProfessionalTable title="Asian Markets" headers={asianMarketData[0]} rows={asianMarketData.slice(1)} />
      </Box>
    </Box>
  );
}

// Market Movers Tab
function MarketMoversTab() {
  const gainers = useSheetRange("Dashboard", "C25:F40");
  const losers = useSheetRange("Dashboard", "H25:K40");

  if (!gainers || !losers) return <CircularProgress />;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      <ProfessionalTable title="Top Gainers" headers={gainers[0]} rows={gainers.slice(1)} />
      <ProfessionalTable title="Top Losers" headers={losers[0]} rows={losers.slice(1)} />
    </Box>
  );
}

// Scanner Tab with sub-tabs
function ScannerSubTabHighLow() {
  const openLow = useSheetRange("Dashboard", "C63:F78");
  const openHigh = useSheetRange("Dashboard", "H63:K78");
  if (!openLow || !openHigh) return <CircularProgress />;
  return (
    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
      <ProfessionalTable title="Open = Low" headers={openLow[0]} rows={openLow.slice(1)} />
      <ProfessionalTable title="Open = High" headers={openHigh[0]} rows={openHigh.slice(1)} />
    </Box>
  );
}

function ScannerSubTabBTST_STBT() {
  const btst = useSheetRange("Dashboard", "C82:F97");
  const stbt = useSheetRange("Dashboard", "H82:K97");
  if (!btst || !stbt) return <CircularProgress />;
  return (
    <Box sx={{ display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap" }}>
      <ProfessionalTable title="BTST - Closing Near High" headers={btst[0]} rows={btst.slice(1)} />
      <ProfessionalTable title="STBT - Closing Near Low" headers={stbt[0]} rows={stbt.slice(1)} />
    </Box>
  );
}

function ScannerSubTab52WHighLow() {
  const high52W = useSheetRange("Dashboard", "C200:F220");
  const low52W = useSheetRange("Dashboard", "H200:K220");
  if (!high52W || !low52W) return <CircularProgress />;
  return (
    <Box sx={{ display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap" }}>
      <ProfessionalTable title="Stocks Near 52 Week High" headers={high52W[0]} rows={high52W.slice(1)} />
      <ProfessionalTable title="Stocks Near 52 Week Low" headers={low52W[0]} rows={low52W.slice(1)} />
    </Box>
  );
}

function ScannerSubTabCrossovers() {
  const sma20_50_bullish = useSheetRange("Dashboard", "C101:F106");
  const sma20_50_bearish = useSheetRange("Dashboard", "C110:F115");
  const sma50_200_bullish = useSheetRange("Dashboard", "H101:K106");
  const sma50_200_bearish = useSheetRange("Dashboard", "H110:K115");
  if (!sma20_50_bullish || !sma20_50_bearish || !sma50_200_bullish || !sma50_200_bearish) return <CircularProgress />;
  return (
    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
      <ProfessionalTable title="20/50 SMA Crossover Bullish" headers={sma20_50_bullish[0]} rows={sma20_50_bullish.slice(1)} />
      <ProfessionalTable title="20/50 SMA Crossover Bearish" headers={sma20_50_bearish[0]} rows={sma20_50_bearish.slice(1)} />
      <ProfessionalTable title="50/200 SMA Crossover Bullish" headers={sma50_200_bullish[0]} rows={sma50_200_bullish.slice(1)} />
      <ProfessionalTable title="50/200 SMA Crossover Bearish" headers={sma50_200_bearish[0]} rows={sma50_200_bearish.slice(1)} />
    </Box>
  );
}

function ScannerSubTabCandlestick() {
  const darkCloud = useSheetRange("Dashboard", "C140:E170");
  const piercing = useSheetRange("Dashboard", "H140:J170");
  const bullishEngulfing = useSheetRange("Dashboard", "M140:O170");
  const bearishEngulfing = useSheetRange("Dashboard", "Q140:S170");
// Add this line for debugging:
  console.log('Dark Cloud Data:', darkCloud);
  console.log('Piercing Pattern Data:', piercing);
  console.log('Bullish Engulfing Data:', bullishEngulfing);
  console.log('Bearish Engulfing Data:', bearishEngulfing);
  if (!darkCloud || !piercing || !bullishEngulfing || !bearishEngulfing) return <CircularProgress />;
  return (
    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
      <ProfessionalTable title="Dark Cloud" headers={darkCloud[0]} rows={darkCloud.slice(1)} />
      <ProfessionalTable title="Piercing Pattern" headers={piercing[0]} rows={piercing.slice(1)} />
      <ProfessionalTable title="Bullish Engulfing" headers={bullishEngulfing[0]} rows={bullishEngulfing.slice(1)} />
      <ProfessionalTable title="Bearish Engulfing" headers={bearishEngulfing[0]} rows={bearishEngulfing.slice(1)} />
    </Box>
  );
}

// Consolidated Scanner Tab managing sub-tabs
function ScannerTab() {
  const [scannerSubTab, setScannerSubTab] = useState(0);

  return (
    <Box sx={{ width: "100%", my: 2 }}>
      <Tabs
        value={scannerSubTab}
        onChange={(e, val) => setScannerSubTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab label="High / Low" />
        <Tab label="BTST / STBT" />
        <Tab label="52 Week High / Low" />
        <Tab label="Crossovers" />
        <Tab label="Candlestick Patterns" />
      </Tabs>
      {scannerSubTab === 0 && <ScannerSubTabHighLow />}
      {scannerSubTab === 1 && <ScannerSubTabBTST_STBT />}
      {scannerSubTab === 2 && <ScannerSubTab52WHighLow />}
      {scannerSubTab === 3 && <ScannerSubTabCrossovers />}
      {scannerSubTab === 4 && <ScannerSubTabCandlestick />}
    </Box>
  );
}

// FNO Pulse Tab
function FNOPulseTab() {
  const timestampData = useSheetRange("Buildup", "B1");
  const fallbackTimestampData = useSheetRange("Buildup", "B2");
  const timestampValue =
    (timestampData && timestampData[0]?.[0]) ||
    (fallbackTimestampData && fallbackTimestampData[0]?.[0]) || "-";

  const longBuildup = useSheetRange("Buildup", "A3:D13");
  const shortCovering = useSheetRange("Buildup", "A17:D27");
  const longUnwinding = useSheetRange("Buildup", "E3:H13");
  const shortBuildup = useSheetRange("Buildup", "E17:H27");
  const maxOIChange = useSheetRange("Buildup", "I3:L13");
  if (!longBuildup || !shortCovering || !longUnwinding || !shortBuildup || !maxOIChange) return <CircularProgress />;

  const tb = (data, title) => <ProfessionalTable title={title} headers={data[0]} rows={data.slice(1)} />;

  return (
    <Box sx={{ minWidth: "1000px" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>Timestamp:</Typography>
        <Typography variant="subtitle1">{timestampValue}</Typography>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "nowrap", gap: 3, mb: 3 }}>
        <Box sx={{ minWidth: 320 }}>
          {tb(longBuildup, "Long Buildup")}
          {tb(shortCovering, "Short Covering")}
        </Box>
        <Box sx={{ minWidth: 350 }}>
          {tb(longUnwinding, "Long Unwinding")}
          {tb(shortBuildup, "Short Buildup")}
        </Box>
        <Box sx={{ minWidth: 350 }}>
          {tb(maxOIChange, "Max OI Change (5 min)")}
        </Box>
      </Box>
    </Box>
  );
}

// Sector/Stock Analysis Tab
function SectorStockAnalysisTab() {
  const rsData = useSheetRange("Dashboard", "C40:F60"); // Adjust as per real RS data range
  if (!rsData) return <CircularProgress />;
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Sector/Stock Analysis with Relative Strength (RS)
      </Typography>
      <ProfessionalTable
        title="Relative Strength Analysis"
        headers={rsData[0]}
        rows={rsData.slice(1)}
      />
    </Box>
  );
}

// Stock Research Tab
function StockResearchTab() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Stock Research (Planned Feature)</Typography>
      <Typography>This feature is under development and will be added soon.</Typography>
    </Box>
  );
}

// Market Summary Single Line Component
function MarketSummarySingleLine({ nifty, banknifty, sensex, indiavix, usdinr }) {
  const blocks = [
    { label: "Nifty", data: nifty },
    { label: "Bank Nifty", data: banknifty },
    { label: "Sensex", data: sensex },
    { label: "IndiaVIX", data: indiavix },
    { label: "USDINR", data: usdinr }
  ];

  return (
    <Box sx={{ display: "flex", alignItems: "center", ml: 6, gap: 6, flexWrap: "nowrap" }}>
      {blocks.map(({ label, data }, idx) => {
        if (!data || data.length < 3) return null;
        const value = Number(data[1]) ? Number(data[1]).toFixed(2) : data[1];
        const change = Number(data[2]) ? Number(data[2]).toFixed(2) : data[2];
        const changeNum = parseFloat(change);
        const changeColor = changeNum > 0 ? "green" : changeNum < 0 ? "red" : "black";
        return (
          <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 120 }}>
            <Typography variant="subtitle2" sx={{ whiteSpace: "nowrap", mr: 0.7 }}>{label}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mr: 0.5 }}>{value}</Typography>
            <Typography variant="body2" sx={{ color: changeColor, fontWeight: 700 }}>{change}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// --------------- Main App Component ---------------

export default function App() {
const [value, setValue] = useState(0);
  // Market summary data
  const nifty = useSheetRange("Dashboard", "C2:E2");
  const banknifty = useSheetRange("Dashboard", "H2:J2");
  const sensex = useSheetRange("Dashboard", "M2:O2");
  const indiavix = useSheetRange("Dashboard", "C15:E15");
  const usdinr = useSheetRange("Dashboard", "C14:E14");

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, flexWrap: "nowrap" }}>
        <Typography variant="h4" sx={{ whiteSpace: "nowrap" }}>Market Dashboard</Typography>
        <StockTicker />
      </Box>

      <MarketSummarySingleLine
        nifty={nifty && nifty[0]}
        banknifty={banknifty && banknifty[0]}
        sensex={sensex && sensex[0]}
        indiavix={indiavix && indiavix[0]}
        usdinr={usdinr && usdinr[0]}
      />

      <Box sx={{ bgcolor: "background.paper", borderRadius: 2, mt: 3 }}>
        <Tabs
          value={value}
          onChange={(e, val) => setValue(val)}
          centered
          variant="fullWidth"
        >
          <Tab label="Global Market" />
          <Tab label="Market Movers" />
          <Tab label="Scanners" />
          <Tab label="FNO Pulse" />
          <Tab label="Sector/Stock Analysis" />
          <Tab label="Stock Research" />
        </Tabs>

        <Box role="tabpanel" hidden={value !== 0} sx={{ p: 2, minHeight: 350 }}>
          {value === 0 && <GlobalMarketTab />}
        </Box>
        <Box role="tabpanel" hidden={value !== 1} sx={{ p: 2, minHeight: 350 }}>
          {value === 1 && <MarketMoversTab />}
        </Box>
        <Box role="tabpanel" hidden={value !== 2} sx={{ p: 2, minHeight: 350 }}>
          {value === 2 && <ScannerTab />}
        </Box>
        <Box role="tabpanel" hidden={value !== 3} sx={{ p: 2, minHeight: 350 }}>
          {value === 3 && <FNOPulseTab />}
        </Box>
        <Box role="tabpanel" hidden={value !== 4} sx={{ p: 2, minHeight: 350 }}>
          {value === 4 && <SectorStockAnalysisTab />}
        </Box>
        <Box role="tabpanel" hidden={value !== 5} sx={{ p: 2, minHeight: 350 }}>
          {value === 5 && <StockResearchTab />}
        </Box>
      </Box>
    </Container>
  );
}
