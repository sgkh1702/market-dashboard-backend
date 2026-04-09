import React from "react";

const indexLinks = {
  "Nifty 50": "https://www.tradingview.com/chart/?symbol=NSE:NIFTY",
  // Add others as needed
};

function getSymbolLink(symbol) {
  if (indexLinks[symbol]) return indexLinks[symbol];
  if (/^[A-Z0-9]+$/i.test(symbol)) {
    return `https://www.tradingview.com/chart/?symbol=NSE:${symbol}`;
  }
  return null;
}

export default function ProfessionalTable({
  title,
  headers = [],
  rows = [],
  tableType,
}) {
  if (!Array.isArray(headers)) headers = [];
  if (!Array.isArray(rows)) rows = [];

  const isWideTable =
    tableType === "stock-performance" || tableType === "sector-performance";

  const [sortConfig, setSortConfig] = React.useState({
    columnIndex: null,
    direction: "asc",
  });

  const handleSort = (colIndex) => {
    setSortConfig((prev) => {
      const direction =
        prev.columnIndex === colIndex && prev.direction === "asc"
          ? "desc"
          : "asc";
      return { columnIndex: colIndex, direction };
    });
  };

  const sortedRows = React.useMemo(() => {
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

  const headersLower = headers.map((h) =>
    String(h || "").toLowerCase().trim()
  );

  const prevCloseIdx = headersLower.findIndex(
    (h) => h?.includes("prev") && h?.includes("close")
  );

  const colorBySign = (val) => (val > 0 ? "green" : val < 0 ? "red" : "#333");

  const colorColumns = ["change", "% change", "cmp", "ltp", "underlying"];
  const colorColumnIndexes = colorColumns
    .map((col) =>
      headersLower.findIndex((h) => h?.includes(col.toLowerCase()) || false)
    )
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
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                    onClick={() => handleSort(j)}
                  >
                    {header || ""}
                    {isActive && (dir === "asc" ? " ▲" : " ▼")}
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
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#999",
                  }}
                >
                  Loading data...
                </td>
              </tr>
            ) : (
              sortedRows.map((row, i) => {
                const safeRow = Array.isArray(row)
                  ? row.map((cell) => cell || "")
                  : [];

                const rowDisplay = hidePrevClose
                  ? safeRow.filter((_, j) => j !== prevCloseIdx)
                  : safeRow;

                return (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 0 ? "#f9fbfe" : "#fff",
                    }}
                  >
                    {rowDisplay.map((cell, j) => {
                      let origJ = j;

                      if (
                        hidePrevClose &&
                        prevCloseIdx !== -1 &&
                        j >= prevCloseIdx
                      ) {
                        origJ = j + 1;
                      }

                      const headerText = headersLower[origJ] || "";
                      let color = "#333";
                      let fontWeight = 600;
                      let textAlign = origJ === 0 ? "left" : "right";
                      let displayCell = cell;

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


if (
  origJ === 0 &&
  (
    headerText.includes("symbol") ||
    headerText.includes("stock") ||
    headerText.includes("tckr") ||
    headerText.includes("underlying")
  )
) {
  const link = getSymbolLink(cell);
  if (link) {
    return (
      <td key={j} style={tdLeftStyle}>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#2376c5",
            fontWeight: 600,
            textDecoration: "underline",
            whiteSpace: "nowrap",
          }}
        >
          {cell}
        </a>
      </td>
    );
  }
}
                      if (
                        colorColumnIndexes.includes(origJ) &&
                        !isNaN(parseFloat(cell))
                      ) {
                        color = colorBySign(parseFloat(cell));
                        fontWeight = 700;
                      }

                      return (
                        <td
                          key={j}
                          style={{
                            ...tdStyle,
                            fontWeight,
                            color,
                            textAlign,
                          }}
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