import React, { useState, useEffect } from "react";
import { Container, Tabs, Tab, Typography, Box, Paper, CircularProgress } from "@mui/material";

const SHEET_ID = "1t_AAtFwWPnqeNoVwDFbV8rtCIEXwQ8e3kLFHoRSlre0";
const API_KEY = "AIzaSyB26mEZ7Lh-eS0npTPiGgT9r9hwdthUJQ0";

// ------------- Shared Google Sheets Hook -------------
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

// ------------- StockTicker: Always Shows Latest Sheet Data -------------
function StockTicker() {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Ticker!A2:C100?key=${API_KEY}`;
    const fetchPrices = async () => {
      try {
        const res = await fetch(apiUrl);
        const json = await res.json();
        // Need all 3 columns (Symbol, CMP, Prev Close)
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

  // Dynamic ticker scroll speed: 7s per item minimum 30s
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
        {prices.length > 0
  ? prices.map(([symbol, cmp, prevClose], i) => {
      const cmpNum = Number(cmp.replace(/,/g, '').trim());
      const prevNum = Number(prevClose.replace(/,/g, '').trim());
      const cmpColor = cmpNum > prevNum ? "green" : cmpNum < prevNum ? "red" : "black";

      return (
        <span key={symbol + i} style={{ marginRight: 52, fontSize: 17, fontWeight: 600, color: "#225" }}>
          {symbol}: <span style={{ color: cmpColor }}>{cmp}</span>
        </span>
      );
    })
  : <span style={{ color: "gray" }}>NO DATA FOUND</span>
}

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

// ------------- UI Components for Tabular Data -------------
function ProfessionalTable({ title, headers, rows }) {
  if (!headers || !Array.isArray(headers) || !Array.isArray(rows)) return null;
  return (
    <Paper elevation={2} sx={{ mb: 3, p: 2, minWidth: 225, maxWidth: 310, overflowX: "auto" }}>
      <Typography align="center" sx={{ fontWeight: "bold", bgcolor: "#e0e8f8", mb: 1 }}>{title}</Typography>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i} style={{ background: "#1869c8", color: "white", padding: "5px", fontWeight: 400 }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "4px",
                    textAlign: j === 0 ? "left" : "right",
                    color:
                      (headers[j] && headers[j].toLowerCase().includes("change") && !isNaN(Number(cell)) && Number(cell) > 0)
                        ? "green"
                        : (headers[j] && headers[j].toLowerCase().includes("change") && !isNaN(Number(cell)) && Number(cell) < 0)
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
                      {cell}
                    </a>
                  ) : (
                    cell
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

function GlobalMarketTab() {
  const broaderData = useSheetRange("Dashboard", "C6:F10");
  const sectorialData = useSheetRange("Dashboard", "H6:K19");
  const usMarketData = useSheetRange("Dashboard", "M6:P9");
  const asianMarketData = useSheetRange("Dashboard", "M13:P16");
  if (!broaderData || !sectorialData || !usMarketData || !asianMarketData) return <CircularProgress />;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      <ProfessionalTable title="Broader Indices" headers={broaderData[0] || []} rows={broaderData.slice(1) || []} />
      <ProfessionalTable title="Sectorial Indices" headers={sectorialData[0] || []} rows={sectorialData.slice(1) || []} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <ProfessionalTable title="US Markets" headers={usMarketData[0] || []} rows={usMarketData.slice(1) || []} />
        <ProfessionalTable title="Asian Markets" headers={asianMarketData[0] || []} rows={asianMarketData.slice(1) || []} />
      </Box>
    </Box>
  );
}

function MarketMoversTab() {
  const gainers = useSheetRange("Dashboard", "C25:F40");
  const losers = useSheetRange("Dashboard", "H25:K40");
  if (!gainers || !losers) return <CircularProgress />;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      <ProfessionalTable title="Top Gainers" headers={gainers[0] || []} rows={gainers.slice(1) || []} />
      <ProfessionalTable title="Top Losers" headers={losers[0] || []} rows={losers.slice(1) || []} />
    </Box>
  );
}

function ScannerTab() {
  const range1 = useSheetRange("Dashboard", "C63:F78");
  const range2 = useSheetRange("Dashboard", "H63:K78");
  const range3 = useSheetRange("Dashboard", "C82:F97");
  const range4 = useSheetRange("Dashboard", "H82:K97");

  if (!range1 || !range2 || !range3 || !range4) return <CircularProgress />;

  const getHeaders = (data) => (data.length > 0 ? data[0] : []);
  const getBody = (data) => (data.length > 1 ? data.slice(1) : []);

  return (
    <Box sx={{ width: "100%", my: 2, display: "flex", justifyContent: "center" }}>
      <Box sx={{
        display: "flex",
        flexDirection: "row",
        gap: 3,
        maxWidth: 1600,
        width: "100%",
        justifyContent: "center"
      }}>
        <ProfessionalTable title="Open = Low" headers={getHeaders(range1)} rows={getBody(range1)} />
        <ProfessionalTable title="Open = High" headers={getHeaders(range2)} rows={getBody(range2)} />
        <ProfessionalTable title="BTST - Closing Near High" headers={getHeaders(range3)} rows={getBody(range3)} />
        <ProfessionalTable title="STBT - Closing Near Low" headers={getHeaders(range4)} rows={getBody(range4)} />
      </Box>
    </Box>
  );
}

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

  const tb = (data, title) => <ProfessionalTable title={title} headers={data[0] || []} rows={data.slice(1) || []} />;

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
          {tb(maxOIChange, "Max OI Change (2 min)")}
        </Box>
      </Box>
    </Box>
  );
}

function TabPanel(props) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index} style={{ minHeight: "350px" }}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function MarketSummarySingleLine({ nifty, banknifty, sensex, indiavix, usdinr }) {
  const blocks = [
    { label: "Nifty", data: nifty }, { label: "Bank Nifty", data: banknifty },
    { label: "Sensex", data: sensex }, { label: "IndiaVIX", data: indiavix }, { label: "USDINR", data: usdinr }
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

// ------------- Main App With All Tabs and Features -------------
export default function App() {
  const [value, setValue] = useState(0);
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
        <Tabs value={value} onChange={(e, val) => setValue(val)} centered variant="fullWidth">
          <Tab label="Global Market" />
          <Tab label="Market Movers" />
          <Tab label="Scanners" />
          <Tab label="FNO Pulse" />
        </Tabs>
        <TabPanel value={value} index={0}><GlobalMarketTab /></TabPanel>
        <TabPanel value={value} index={1}><MarketMoversTab /></TabPanel>
        <TabPanel value={value} index={2}><ScannerTab /></TabPanel>
        <TabPanel value={value} index={3}><FNOPulseTab /></TabPanel>
      </Box>
    </Container>
  );
}
