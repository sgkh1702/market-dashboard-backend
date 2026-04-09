import "./App.css";
import React, { useState } from "react";
import GlobalMarketTab from "./tabs/GlobalMarketTab";
import MarketMoversTab from "./tabs/MarketMoversTab";
import ScannerTab from "./tabs/ScannerTab";
import FNOPulseTab from "./tabs/FNOPulseTab";
import SectorStockAnalysisTab from "./tabs/SectorStockAnalysisTab";
import StockResearchTab from "./tabs/StockResearchTab";
import RolloverAnalysisTab from "./tabs/RolloverAnalysisTab";
import FiiDiiTab from "./tabs/FiiDiiTab";
import News from "./tabs/News";
import StockTicker from "./components/StockTicker";
import MarketSummarySingleLine from "./components/MarketSummarySingleLine";

const SHEET_ID = "1t_AAtFwWPnqeNoVwDFbV8rtCIEXwQ8e3kLFHoRSlre0";
const API_KEY = "AIzaSyB26mEZ7Lh-eS0npTPiGgT9r9hwdthUJQ0";
const TAB = "Dashboard";

function useSheetRange(sheetName, range) {
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`
    )
      .then((res) => res.json())
      .then((res) => setData(res.values || []))
      .catch(() => setData([]));
  }, [sheetName, range]);

  return data;
}

function rowsToObjects(rows, keys) {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  return rows.slice(1).map((row) => {
    const obj = {};
    keys.forEach((key, i) => {
      obj[key] = row[i];
    });
    return obj;
  });
}

export default function App() {
  const [selectedTab, setSelectedTab] = useState("global_market");

  const summary = {
    nifty: useSheetRange(TAB, "C2:E2")?.[0] || [],
    banknifty: useSheetRange(TAB, "H2:J2")?.[0] || [],
    sensex: useSheetRange(TAB, "M2:O2")?.[0] || [],
    indiavix: useSheetRange(TAB, "C15:E15")?.[0] || [],
    usdinr: useSheetRange(TAB, "C14:E14")?.[0] || [],
  };

  const indexFuturesRaw = useSheetRange("FIIData", "B2:D6");
  const indexFutures = rowsToObjects(indexFuturesRaw, ["Client Type", "Long", "Short"]);

  const indexFuturesPositionRaw = useSheetRange("FIIData", "B21:D23");
  const indexFuturesPosition = rowsToObjects(indexFuturesPositionRaw, [
    "Position",
    "Long",
    "Short",
  ]);

  const stockFuturesRaw = useSheetRange("FIIData", "G2:I6");
  const stockFutures = rowsToObjects(stockFuturesRaw, ["Client Type", "Long", "Short"]);

  const stockFuturesPositionRaw = useSheetRange("FIIData", "G21:I23");
  const stockFuturesPosition = rowsToObjects(stockFuturesPositionRaw, [
    "Position",
    "Long",
    "Short",
  ]);

  const historicalNetRaw = useSheetRange("FIIData", "L1:O8");
  const historicalNet = rowsToObjects(historicalNetRaw, [
    "Date",
    "Future Index Lor",
    "Future Index Shr",
    "difference(Future Index Lor - Future Index Shr)",
  ]);

  const niftyBniftyNetRaw = useSheetRange("FIIStat", "S1:U8");
  const niftyBniftyNet = rowsToObjects(niftyBniftyNetRaw, [
    "Date",
    "NIFTY FUTURES",
    "BANKNIFTY FUTURES",
  ]);

  const fiiStatisticsRaw = useSheetRange("FIIStat", "W2:X6");
  const fiiStatistics = rowsToObjects(fiiStatisticsRaw, ["FII Statistics", "Rs in Cr"]);

  const fiiProps = {
    indexFutures,
    indexFuturesPosition,
    stockFutures,
    stockFuturesPosition,
    historicalNet,
    niftyBniftyNet,
    fiiStatistics,
  };

  // ----- Stock Research data from StockData sheet -----
  const srPriceBlock = useSheetRange("StockData", "B5:C9");
  const sr52wBlock = useSheetRange("StockData", "F7:H8");

  // Selected stock written by Apps Script to StockData!C2
  const selectedSymbol = useSheetRange("StockData", "C2")?.[0]?.[0] || "";

  // Query/formula output block already filtered for selected stock
  const stockHistoryRaw = useSheetRange("StockData", "B20:O30");

  const mapStockHistory = (rows) => {
    if (!Array.isArray(rows) || rows.length < 2) return [];

    const [header, ...data] = rows;

    return data
      .filter((r) => r[0] && r[1])
      .map((r) => ({
        date: r[0] || "",
        close: Number(r[1]) || 0,
        sma5: Number(r[2]) || 0,
        sma20: Number(r[3]) || 0,
        sma50: Number(r[4]) || 0,
        sma200: Number(r[5]) || 0,
        oi: Number(r[7]) || 0,
        chgInOi: Number(r[8]) || 0,
        buildup: r[9] || "",
        maxCeStrike: Number(r[10]) || 0,
        maxCeOi: Number(r[11]) || 0,
        maxPeStrike: Number(r[12]) || 0,
        maxPeOi: Number(r[13]) || 0,
      }))
      .slice(-10);
  };

  const stockHistory = mapStockHistory(stockHistoryRaw);

  const TABS = [
    { key: "global_market", title: "GLOBAL MARKET", component: GlobalMarketTab },
    { key: "market_movers", title: "MARKET MOVERS", component: MarketMoversTab },
    { key: "scanners", title: "SCANNERS", component: ScannerTab },
    { key: "fno_pulse", title: "FNO PULSE", component: FNOPulseTab },
    {
      key: "sector_stock_analysis",
      title: "SECTOR/STOCK ANALYSIS",
      component: SectorStockAnalysisTab,
    },
    { key: "stock_research", title: "STOCK RESEARCH", component: StockResearchTab },
    { key: "rollover_analysis", title: "FUTURE MULTIBAGGERS", component: RolloverAnalysisTab },
    { key: "fii_dii", title: "FII/DII", component: FiiDiiTab },
    { key: "news", title: "NEWS", component: News },
  ];

  const SelectedComponent = TABS.find((tab) => tab.key === selectedTab)?.component;

  return (
    <div
      style={{
        fontFamily: "Segoe UI, Roboto, Arial, sans-serif",
        maxWidth: 1720,
        width: "95vw",
        margin: "0 auto",
        padding: "0 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "92%",
          margin: "22px auto 0",
          justifyContent: "flex-start",
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            textAlign: "left",
            marginRight: 32,
            minWidth: 350,
          }}
        >
          Market Dashboard
        </div>
        <div style={{ flex: 1, minWidth: 320, maxWidth: 950 }}>
          <StockTicker />
        </div>
      </div>

      <div
        style={{
          width: "92%",
          margin: "12px auto 8px",
          borderTop: "2px solid #f0f4fb",
          borderBottom: "2px solid #f0f4fb",
          padding: "14px 0",
          fontSize: 18,
        }}
      >
        <MarketSummarySingleLine
          nifty={summary.nifty}
          banknifty={summary.banknifty}
          sensex={summary.sensex}
          indiavix={summary.indiavix}
          usdinr={summary.usdinr}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "16px 0 36px",
          flexWrap: "wrap",
        }}
      >
        {TABS.map((tab) => (
          <div
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            style={{
              marginRight: 35,
              cursor: "pointer",
              fontWeight: selectedTab === tab.key ? 700 : 400,
              color: selectedTab === tab.key ? "#2367b2" : "#757575",
              fontSize: 20,
              borderBottom: selectedTab === tab.key ? "3px solid #2367b2" : "none",
              paddingBottom: 9,
              transition: "border 0.2s",
            }}
          >
            {tab.title}
          </div>
        ))}
      </div>

      <div style={{ width: "100%" }}>
        {SelectedComponent &&
          (selectedTab === "fii_dii" ? (
            <SelectedComponent {...fiiProps} />
          ) : selectedTab === "stock_research" ? (
            <SelectedComponent
              srPriceBlock={srPriceBlock}
              sr52wBlock={sr52wBlock}
              stockHistory={stockHistory}
              selectedSymbol={selectedSymbol}
            />
          ) : (
            <SelectedComponent />
          ))}
      </div>
    </div>
  );
}