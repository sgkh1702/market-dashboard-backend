import React, { useState, useMemo } from "react";

const indexLinks = {
  "Nifty 50": "https://www.tradingview.com/chart/?symbol=NSE:NIFTY",
  "NIFTY 50": "https://www.tradingview.com/chart/?symbol=NSE:NIFTY",
  "NIFTY": "https://www.tradingview.com/chart/?symbol=NSE:NIFTY",
  "Nifty Bank": "https://www.tradingview.com/chart/?symbol=NSE:BANKNIFTY",
  "BANKNIFTY": "https://www.tradingview.com/chart/?symbol=NSE:BANKNIFTY",
  "Bank Nifty": "https://www.tradingview.com/chart/?symbol=NSE:BANKNIFTY",
  "Nifty Financial Services": "https://www.tradingview.com/chart/?symbol=NSE:CNXFINANCE",
  "FINNIFTY": "https://www.tradingview.com/chart/?symbol=NSE:CNXFINANCE",
  "CNXFINANCE": "https://www.tradingview.com/chart/?symbol=NSE:CNXFINANCE",
  "Nifty Midcap Select": "https://www.tradingview.com/chart/?symbol=NSE:MIDCPNIFTY",
  "Nifty Mid Select": "https://www.tradingview.com/chart/?symbol=NSE:MIDCPNIFTY",
  "MIDCPNIFTY": "https://www.tradingview.com/chart/?symbol=NSE:MIDCPNIFTY",
  Sensex: "https://www.tradingview.com/chart/?symbol=BSE:SENSEX",
  SENSEX: "https://www.tradingview.com/chart/?symbol=BSE:SENSEX",
  IndiaVIX: "https://www.tradingview.com/chart/?symbol=NSE:INDIAVIX",
  INDIAVIX: "https://www.tradingview.com/chart/?symbol=NSE:INDIAVIX",
};

function normalizeSymbol(symbol) {
  return String(symbol || "").trim();
}

function isIndexSymbol(symbol) {
  const clean = normalizeSymbol(symbol);
  return Object.prototype.hasOwnProperty.call(indexLinks, clean);
}

function getSymbolLink(symbol) {
  const clean = normalizeSymbol(symbol);
  if (!clean) return null;

  if (indexLinks[clean]) return indexLinks[clean];

  if (/^[A-Z0-9\\-_&]+$/i.test(clean)) {
    return `https://www.tradingview.com/chart/?symbol=NSE:${clean}`;
  }

  return null;
}

function getSimple5DDataFromRow(headersLower, safeRow) {
  const ltpIdx = headersLower.findIndex(
    (h) => h.includes("ltp") || h.includes("cmp") || h.includes("underlying")
  );
  const changeIdx = headersLower.findIndex(
    (h) => h.includes("% change") || h === "change"
  );

  if (ltpIdx === -1) return null;

  const ltp = parseFloat(safeRow[ltpIdx]);
  const change = changeIdx !== -1 ? parseFloat(safeRow[changeIdx]) : 0;

  if (isNaN(ltp)) return null;

  const step = isNaN(change) ? 0 : (ltp * change) / 100 / 4;

  return [
    { price: ltp - step * 2 },
    { price: ltp - step },
    { price: ltp },
    { price: ltp + step / 2 },
    { price: ltp + step },
  ];
}

function isTickerLikeHeader(headerText) {
  return (
    headerText.includes("symbol") ||
    headerText.includes("ticker") ||
    headerText.includes("tckr") ||
    headerText === "stock" ||
    headerText.includes("underlying") ||
    headerText.includes("index") ||
    headerText.includes("indices")
  );
}

export default function ProfessionalTable({
  title,
  headers = [],
  rows = [],
  tableType,
  nameColumnAlign = "left",
}) {
  if (!Array.isArray(headers)) headers = [];
  if (!Array.isArray(rows)) rows = [];

  const isWideTable =
    tableType === "stock-performance" ||
    tableType === "sector-performance" ||
    tableType === "multibagger";

  const [sortConfig, setSortConfig] = useState({
    columnIndex: null,
    direction: "asc",
  });

  const [hoverSymbol, setHoverSymbol] = useState(null);

  const handleSort = (colIndex) => {
    setSortConfig((prev) => {
      const direction =
        prev.columnIndex === colIndex && prev.direction === "asc"
          ? "desc"
          : "asc";
      return { columnIndex: colIndex, direction };
    });
  };

  const sortedRows = useMemo(() => {
    if (sortConfig.columnIndex == null) return rows;

    const idx = sortConfig.columnIndex;
    const dir = sortConfig.direction === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
      const av = a?.[idx];
      const bv = b?.[idx];

      const an = parseFloat(av);
      const bn = parseFloat(bv);

      if (!isNaN(an) && !isNaN(bn)) {
        if (an > bn) return dir;
        if (an < bn) return -dir;
        return 0;
      }

      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }, [rows, sortConfig]);

  const headersLower = headers.map((h) => String(h || "").toLowerCase().trim());

  const prevCloseIdx = headersLower.findIndex(
    (h) => h.includes("prev") && h.includes("close")
  );

  const colorBySign = (val) => (val > 0 ? "green" : val < 0 ? "red" : "#333");

  const colorColumns = ["change", "% change", "cmp", "ltp", "underlying"];
  const colorColumnIndexes = colorColumns
    .map((col) => headersLower.findIndex((h) => h.includes(col.toLowerCase())))
    .filter((idx) => idx !== -1);

  const allowedTableTypes = [
    "global-market",
    "market-mover",
    "sector-performance",
    "stock-performance",
    "high-low",
    "btst-stbt",
    "52week-high-low",
    "sma-crossover",
    "dark-cloud",
    "fno-pulse",
    "multibagger",
  ];

  const hidePrevClose =
    allowedTableTypes.includes(tableType) &&
    ["52week-high-low", "sma-crossover", "dark-cloud", "fno-pulse"].includes(
      tableType
    ) &&
    prevCloseIdx !== -1;

  const headerDisplay = hidePrevClose
    ? headers.filter((_, j) => j !== prevCloseIdx)
    : headers;

  const containerStyle = {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 10px rgba(80,120,200,0.09)",
    border: "1.5px solid #e2e8f0",
    width: isWideTable ? 920 : 360,
    minWidth: isWideTable ? 920 : 320,
    margin: "0 0 24px 0",
    overflow: "visible",
    position: "relative",
  };

  const headerStyle = {
    background: "#f6f8fa",
    color: "#222",
    fontWeight: 700,
    fontSize: 16,
    textAlign: "left",
    padding: "10px 16px",
    borderRadius: "14px 14px 0 0",
    borderBottom: "2px solid #dde6ed",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  };

  const thStyle = {
    background: "#2376c5",
    color: "#fff",
    fontWeight: 650,
    fontSize: 14,
    padding: "6px 10px",
    whiteSpace: "nowrap",
    textAlign: "left",
    cursor: "pointer",
    userSelect: "none",
  };

  const tdStyle = {
    borderBottom: "1px solid #f0f4f9",
    padding: "6px 10px",
    fontWeight: 600,
    fontSize: 14,
    color: "#333",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  };

  const tdLeftStyle = {
    ...tdStyle,
    textAlign: "left",
    color: "#2376c5",
    fontWeight: 600,
  };

  const tooltipStyle = {
    position: "absolute",
    top: "-10px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(255, 255, 255, 0.98)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    borderRadius: 8,
    padding: "10px 12px",
    zIndex: 1000,
    minWidth: 180,
    border: "1px solid #e2e8f0",
    pointerEvents: "none",
  };

  const tooltipHeader = {
    fontSize: 13,
    fontWeight: 700,
    color: "#222",
    margin: 0,
    marginBottom: 6,
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>{title}</div>

      {headers.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
          No data available
        </div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              {headerDisplay.map((header, j) => {
                const isActive = sortConfig.columnIndex === j;
                const dir = sortConfig.direction;

                return (
                  <th
                    key={j}
                    style={{
                      ...thStyle,
                      background: isActive ? "#1a5eb6" : "#2376c5",
                    }}
                    onClick={() => handleSort(j)}
                    title="Click to sort"
                  >
                    {header || ""}
                    <span style={{ fontSize: 12, marginLeft: 4 }}>
                      {isActive ? (
                        <span style={{ color: "#fff" }}>
                          {dir === "asc" ? " ▲" : " ▼"}
                        </span>
                      ) : (
                        <span style={{ color: "#b8d4f5" }}> ▲▼</span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headerDisplay.length}
                  style={{ padding: "20px", textAlign: "center", color: "#999" }}
                >
                  Loading data...
                </td>
              </tr>
            ) : (
              sortedRows.map((row, i) => {
                const safeRow = Array.isArray(row)
                  ? row.map((cell) =>
                      cell === null || cell === undefined ? "" : cell
                    )
                  : [];

                const rowDisplay = hidePrevClose
                  ? safeRow.filter((_, j) => j !== prevCloseIdx)
                  : safeRow;

                return (
                  <tr
                    key={i}
                    style={{ background: i % 2 === 0 ? "#f9fbfe" : "#fff" }}
                  >
                    {rowDisplay.map((cell, j) => {
                      let origJ = j;

                      if (hidePrevClose && prevCloseIdx !== -1 && j >= prevCloseIdx) {
                        origJ = j + 1;
                      }

                      const headerText = headersLower[origJ] || "";
                      const isTickerCell = isTickerLikeHeader(headerText);

                      let color = "#333";
                      let fontWeight = 600;
                      let textAlign = "right";
                      let displayCell = cell;

                      if (
                        tableType === "multibagger" &&
                        headerText.includes("name")
                      ) {
                        textAlign = nameColumnAlign;
                      } else if (origJ === 0 || isTickerCell || headerText.includes("name")) {
                        textAlign = "left";
                      }

                      if (
                        headerText.includes("weighted rs") &&
                        cell !== "" &&
                        !isNaN(Number(cell))
                      ) {
                        displayCell = Number(cell).toFixed(2);
                      }

                      if (
                        (headerText.includes("cmp") ||
                          headerText.includes("open") ||
                          headerText.includes("underlying") ||
                          headerText.includes("ltp") ||
                          headerText.includes("turnover")) &&
                        cell !== "" &&
                        !isNaN(Number(cell))
                      ) {
                        displayCell = Number(cell).toFixed(1);
                      }

                      if (isTickerCell) {
                        const symbolText = String(cell).trim();
                        const link = getSymbolLink(symbolText);
                        const previewData = getSimple5DDataFromRow(headersLower, safeRow);
                        const isIndex = isIndexSymbol(symbolText);

                        return (
                          <td
                            key={j}
                            style={{
                              ...tdLeftStyle,
                              position: "relative",
                              color: link ? "#2376c5" : "#333",
                            }}
                            onMouseEnter={() => setHoverSymbol(`${symbolText}-${i}-${origJ}`)}
                            onMouseLeave={() => setHoverSymbol(null)}
                          >
                            {link ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#2376c5",
                                  fontWeight: 600,
                                  textDecoration: "underline",
                                  whiteSpace: "nowrap",
                                  cursor: "pointer",
                                }}
                                title={
                                  isIndex
                                    ? "Open TradingView index chart"
                                    : "Open TradingView stock chart"
                                }
                              >
                                {symbolText}
                              </a>
                            ) : (
                              <span style={{ color: "#333", fontWeight: 600 }}>
                                {symbolText}
                              </span>
                            )}

                            {hoverSymbol === `${symbolText}-${i}-${origJ}` && previewData && (
                              <div style={tooltipStyle}>
                                <p style={tooltipHeader}>{symbolText} • 5D Preview</p>
                                <div
                                  style={{
                                    height: 28,
                                    width: 150,
                                    position: "relative",
                                    marginTop: 2,
                                  }}
                                >
                                  {previewData.map((p, idx) => {
                                    const maxP = Math.max(
                                      ...previewData.map((pt) => pt.price)
                                    );
                                    const minP = Math.min(
                                      ...previewData.map((pt) => pt.price)
                                    );
                                    const range = maxP - minP || 1;
                                    const chartHeight = 22;
                                    const normalizedHeight =
                                      ((p.price - minP) / range) * chartHeight;

                                    return (
                                      <div
                                        key={idx}
                                        style={{
                                          position: "absolute",
                                          width: "14px",
                                          height: `${Math.max(4, normalizedHeight)}px`,
                                          background: "#2376c5",
                                          bottom: 0,
                                          left: `${idx * 28}px`,
                                          borderRadius: "2px 2px 0 0",
                                        }}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      }

                      if (colorColumnIndexes.includes(origJ) && !isNaN(parseFloat(cell))) {
                        color = colorBySign(parseFloat(cell));
                        fontWeight = 700;
                      }

                      return (
                        <td
                          key={j}
                          style={{ ...tdStyle, fontWeight, color, textAlign }}
                        >
                          {displayCell}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}