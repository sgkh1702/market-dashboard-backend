import "./App.css";
import React, { useMemo, useState } from "react";
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

function HamburgerButton({ open, onClick }) {
  return (
    <button
      type="button"
      className="md-hamburger"
      onClick={onClick}
      aria-label={open ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={open}
    >
      <span />
      <span />
      <span />
    </button>
  );
}

export default function App() {
  const [selectedTab, setSelectedTab] = useState("global_market");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const srPriceBlock = useSheetRange("StockData", "B5:C9");
  const sr52wBlock = useSheetRange("StockData", "F7:H8");
  const selectedSymbol = useSheetRange("StockData", "C2")?.[0]?.[0] || "";
  const stockHistoryRaw = useSheetRange("StockData", "B20:O30");

  const mapStockHistory = (rows) => {
    if (!Array.isArray(rows) || rows.length < 2) return [];
    return rows
      .slice(1)
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

  const TABS = useMemo(
    () => [
      { key: "global_market", title: "Global Market", shortTitle: "Global", component: GlobalMarketTab },
      { key: "market_movers", title: "Market Movers", shortTitle: "Movers", component: MarketMoversTab },
      { key: "scanners", title: "Scanners", shortTitle: "Scanners", component: ScannerTab },
      { key: "fno_pulse", title: "FNO Pulse", shortTitle: "FNO", component: FNOPulseTab },
      {
        key: "sector_stock_analysis",
        title: "Sector/Stock Analysis",
        shortTitle: "Sector/Stock",
        component: SectorStockAnalysisTab,
      },
      { key: "stock_research", title: "Stock Research", shortTitle: "Research", component: StockResearchTab },
      {
        key: "rollover_analysis",
        title: "Future Multibaggers",
        shortTitle: "Multibaggers",
        component: RolloverAnalysisTab,
      },
      { key: "fii_dii", title: "FII / DII", shortTitle: "FII/DII", component: FiiDiiTab },
      { key: "news", title: "News", shortTitle: "News", component: News },
    ],
    []
  );

  const activeTab = TABS.find((tab) => tab.key === selectedTab) || TABS[0];
  const SelectedComponent = activeTab.component;

  const handleTabSelect = (key) => {
    setSelectedTab(key);
    setSidebarOpen(false);
  };

  return (
    <div className="md-app-shell">
      {sidebarOpen && <div className="md-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`md-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="md-sidebar-header">
          <div className="md-sidebar-title">Market Dashboard</div>
          <div className="md-sidebar-subtitle">Primary navigation</div>
        </div>

        <nav className="md-sidebar-nav">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`md-nav-item ${selectedTab === tab.key ? "active" : ""}`}
              onClick={() => handleTabSelect(tab.key)}
            >
              <span className="md-nav-item-text">{tab.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="md-main-shell">
        <header className="md-topbar">
          <div className="md-topbar-left">
            <HamburgerButton open={sidebarOpen} onClick={() => setSidebarOpen((prev) => !prev)} />
            <div className="md-topbar-title-wrap">
              <h1 className="md-page-title">Market Dashboard</h1>
              <div className="md-page-subtitle">{activeTab.title}</div>
            </div>
          </div>

          <div className="md-topbar-ticker">
            <StockTicker />
          </div>
        </header>

        <section className="md-summary-strip">
          <MarketSummarySingleLine
            nifty={summary.nifty}
            banknifty={summary.banknifty}
            sensex={summary.sensex}
            indiavix={summary.indiavix}
            usdinr={summary.usdinr}
          />
        </section>

        <main className="md-content-area">
          <div className="md-mobile-current-tab">{activeTab.title}</div>

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
        </main>
      </div>
    </div>
  );
}