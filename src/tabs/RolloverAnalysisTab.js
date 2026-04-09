import React from "react";
import ProfessionalTable from "../components/ProfessionalTable";
import CircularProgress from "@mui/material/CircularProgress";
import useSheetRange from "../hooks/useSheetRange";

export default function MultibaggerTab() {
  const rawData = useSheetRange("multibagger", "A1:Z1000");

  if (!rawData) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
      </div>
    );
  }

  const headers = Array.isArray(rawData[0]) ? rawData[0].map((h) => h || "") : [];
  const rows = rawData.length > 1 ? rawData.slice(1).filter((row) => Array.isArray(row)) : [];

  const extractionDate = rawData?.[1]?.[24] || "";

  const colIndex = {
    name: headers.findIndex((h) => h?.toLowerCase().includes("name")),
    cmp: headers.findIndex((h) => h?.toLowerCase().includes("cmp")),
    roe: headers.findIndex((h) => h?.toLowerCase().includes("roe")),
    roce: headers.findIndex((h) => h?.toLowerCase().includes("roce")),
    salesGrowth: headers.findIndex((h) => h?.toLowerCase().includes("sales") && h?.toLowerCase().includes("5")),
    profitGrowth: headers.findIndex((h) => h?.toLowerCase().includes("profit") && h?.toLowerCase().includes("5yr")),
    peg: headers.findIndex((h) => h?.toLowerCase().includes("peg")),
    debtEquity: headers.findIndex((h) => h?.toLowerCase().includes("debt") || h?.toLowerCase().includes("d/e")),
    pe: headers.findIndex((h) => h?.toLowerCase().includes("p/e")),
    symbol: headers.findIndex((h) => h?.toLowerCase() === "symbol"),
    dmaCross: headers.findIndex((h) => h?.toLowerCase().includes("dma crossover")),
    dma50: headers.findIndex((h) => h?.toLowerCase().includes("50 dma")),
    dma200: headers.findIndex((h) => h?.toLowerCase().includes("200 dma")),
  };

  const calcScore = (row) => {
    const getNum = (idx) => (idx >= 0 && row[idx] ? parseFloat(row[idx]) || 0 : 0);
    const getText = (idx) => (idx >= 0 && row[idx] ? String(row[idx]).toLowerCase().trim() : "");

    const s = {
      cmp: getNum(colIndex.cmp),
      roe: getNum(colIndex.roe),
      roce: getNum(colIndex.roce),
      salesGrowth: getNum(colIndex.salesGrowth),
      profitGrowth: getNum(colIndex.profitGrowth),
      peg: getNum(colIndex.peg),
      debtEquity: getNum(colIndex.debtEquity),
      pe: getNum(colIndex.pe),
      dma50: getNum(colIndex.dma50),
      dma200: getNum(colIndex.dma200),
      dmaCross: getText(colIndex.dmaCross),
    };

    let score = 0;

    if (s.roce >= 25) score += 16;
    else if (s.roce >= 20) score += 13;
    else if (s.roce >= 15) score += 9;
    else if (s.roce >= 10) score += 4;

    if (s.roe >= 25) score += 14;
    else if (s.roe >= 20) score += 11;
    else if (s.roe >= 15) score += 7;
    else if (s.roe >= 10) score += 3;

    if (s.salesGrowth >= 25) score += 14;
    else if (s.salesGrowth >= 18) score += 10;
    else if (s.salesGrowth >= 10) score += 6;
    else if (s.salesGrowth >= 5) score += 2;

    if (s.profitGrowth >= 25) score += 14;
    else if (s.profitGrowth >= 18) score += 10;
    else if (s.profitGrowth >= 10) score += 6;
    else if (s.profitGrowth >= 5) score += 2;
    else if (s.profitGrowth < 0) score -= 4;

    if (s.debtEquity === 0) score += 10;
    else if (s.debtEquity <= 0.3) score += 8;
    else if (s.debtEquity <= 0.5) score += 5;
    else if (s.debtEquity <= 1) score += 2;
    else score -= 3;

    const peg = s.peg > 0 ? s.peg : 99;
    if (peg < 1) score += 10;
    else if (peg < 1.5) score += 7;
    else if (peg < 2) score += 4;
    else if (peg > 3) score -= 2;

    if (s.pe > 0 && s.pe <= 20) score += 6;
    else if (s.pe <= 35) score += 4;
    else if (s.pe <= 50) score += 2;
    else if (s.pe > 80) score -= 2;

    if (s.cmp > 0 && s.dma50 > 0) {
      if (s.cmp >= s.dma50 * 1.05) score += 5;
      else if (s.cmp >= s.dma50) score += 3;
      else score -= 2;
    }

    if (s.cmp > 0 && s.dma200 > 0) {
      if (s.cmp >= s.dma200 * 1.1) score += 5;
      else if (s.cmp >= s.dma200) score += 3;
      else score -= 3;
    }

    if (s.dmaCross.includes("strong")) score += 6;
    else if (s.dmaCross.includes("50-200")) score += 3;
    else if (s.dmaCross.includes("below 50")) score -= 3;

    return Math.max(0, Math.min(score, 100));
  };

  const scoredRows = rows.map((row, rowIndex) => [...row, calcScore(row), rowIndex]);

  const displayHeaders = [
    "Ticker",
    "Name",
    "CMP ₹",
    "Score",
    "ROE %",
    "ROCE %",
    "Sales 5Yr %",
    "P/E",
    "D/E",
    "Tag",
    "DMA Crossover",
  ];

  const getTradingViewLink = (symbol) => {
    if (!symbol) return "#";
    const cleanSymbol = symbol.toUpperCase().replace(/\.NS|\.BO/g, "").trim();
    return `https://www.tradingview.com/chart/?symbol=NSE%3A${cleanSymbol}`;
  };

  const getScreenerLink = (symbol) => {
    if (!symbol) return "#";
    const cleanSymbol = symbol.toLowerCase().replace(/\.ns|\.bo/g, "").trim();
    return `https://www.screener.in/company/${cleanSymbol}/`;
  };

  const tagStyle = (tag) => {
    if (tag.includes("Strong")) {
      return {
        background: "#dcfce7",
        color: "#166534",
        borderRadius: 6,
        padding: "3px 8px",
        fontWeight: 600,
        fontSize: 12,
        display: "inline-block",
      };
    }
    if (tag.includes("Moderate")) {
      return {
        background: "#fef3c7",
        color: "#92400e",
        borderRadius: 6,
        padding: "3px 8px",
        fontWeight: 600,
        fontSize: 12,
        display: "inline-block",
      };
    }
    return {
      background: "#fee2e2",
      color: "#991b1b",
      borderRadius: 6,
      padding: "3px 8px",
      fontWeight: 600,
      fontSize: 12,
      display: "inline-block",
    };
  };

  const dmaBadgeStyle = (value) => {
    const v = String(value || "").toLowerCase();
    if (v.includes("strong")) {
      return {
        background: "#dcfce7",
        color: "#166534",
        borderRadius: 6,
        padding: "3px 8px",
        fontWeight: 600,
        fontSize: 12,
        display: "inline-block",
      };
    }
    if (v.includes("50-200")) {
      return {
        background: "#fef3c7",
        color: "#92400e",
        borderRadius: 6,
        padding: "3px 8px",
        fontWeight: 600,
        fontSize: 12,
        display: "inline-block",
      };
    }
    if (v.includes("below 50")) {
      return {
        background: "#fee2e2",
        color: "#991b1b",
        borderRadius: 6,
        padding: "3px 8px",
        fontWeight: 600,
        fontSize: 12,
        display: "inline-block",
      };
    }
    return {
      background: "#e2e8f0",
      color: "#334155",
      borderRadius: 6,
      padding: "3px 8px",
      fontWeight: 600,
      fontSize: 12,
      display: "inline-block",
    };
  };

  const displayRows = scoredRows
    .sort((a, b) => parseFloat(b[b.length - 2]) - parseFloat(a[a.length - 2]))
    .slice(0, 50)
    .map((row) => {
      const score = parseFloat(row[row.length - 2]);
      const rowIdx = row[row.length - 1];
      const tag = score >= 70 ? "🔥 Strong" : score >= 45 ? "⚡ Moderate" : "❌ Weak";

      const nameCell = row[colIndex.name] || "";
      const symbolCell = colIndex.symbol >= 0 ? row[colIndex.symbol] || "" : row[0] || "";
      const dmaCross = colIndex.dmaCross >= 0 ? row[colIndex.dmaCross] || "" : "";

      return [
        <a
          key={`tv-${rowIdx}`}
          href={getTradingViewLink(symbolCell)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#0f766e",
            textDecoration: "none",
            fontWeight: 700,
            fontFamily: "monospace",
            textAlign: "left",
            display: "inline-block",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          {symbolCell}
        </a>,
        <a
          key={`scr-${rowIdx}`}
          href={getScreenerLink(symbolCell)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#3b82f6",
            textDecoration: "none",
            fontWeight: 600,
            textAlign: "left",
            display: "inline-block",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          {nameCell}
        </a>,
        row[colIndex.cmp] || "",
        <span key={`score-${rowIdx}`} style={tagStyle(tag)}>{score}</span>,
        row[colIndex.roe] || "",
        row[colIndex.roce] || "",
        row[colIndex.salesGrowth] || "",
        row[colIndex.pe] || "",
        row[colIndex.debtEquity] || "",
        <span key={`tag-${rowIdx}`} style={tagStyle(tag)}>{tag}</span>,
        dmaCross ? <span key={`dma-${rowIdx}`} style={dmaBadgeStyle(dmaCross)}>{dmaCross}</span> : "",
      ];
    });

  return (
    <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "24px 12px", textAlign: "left" }}>
      <div style={{ marginBottom: 32, textAlign: "left" }}>
        <h3 style={{ textAlign: "left", marginBottom: 12, color: "#3f51b5", fontSize: 28, fontWeight: 700 }}>
          🔁 Multibagger Screener ({scoredRows.length} stocks)
        </h3>

        <div
          style={{
            textAlign: "left",
            marginBottom: 24,
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          <div><strong>Source:</strong> Screener</div>
          <div>
            <strong>Query:</strong> PEG Ratio &lt; 1 AND Net Profit last year &gt; 20% AND Debt to equity &lt; 1 AND Return on equity &gt; 20 AND Piotroski score &gt; 7
          </div>
          <div><strong>Data extracted on:</strong> {extractionDate || "—"}</div>
        </div>

        <ProfessionalTable
          title="Top 50 by Score"
          headers={displayHeaders}
          rows={displayRows}
          tableType="multibagger"
        />
      </div>

      <div
        style={{
          background: "#f8fafc",
          borderRadius: 8,
          padding: "16px",
          fontSize: 12,
          color: "#64748b",
          border: "1px solid #e2e8f0",
          textAlign: "left",
        }}
      >
        <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 8, fontSize: 13 }}>
          📋 Scoring Criteria (100 pts max)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
          <div><strong>ROCE:</strong> ≥25%→16 | ≥20%→13 | ≥15%→9 | ≥10%→4</div>
          <div><strong>ROE:</strong> ≥25%→14 | ≥20%→11 | ≥15%→7 | ≥10%→3</div>
          <div><strong>Sales Growth:</strong> ≥25%→14 | ≥18%→10 | ≥10%→6 | ≥5%→2</div>
          <div><strong>Profit Growth:</strong> ≥25%→14 | ≥18%→10 | ≥10%→6 | ≥5%→2</div>
          <div><strong>Debt/Eq:</strong> =0→10 | ≤0.3→8 | ≤0.5→5 | ≤1→2</div>
          <div><strong>PEG:</strong> &lt;1→10 | &lt;1.5→7 | &lt;2→4</div>
          <div><strong>P/E:</strong> ≤20→6 | ≤35→4 | ≤50→2</div>
          <div><strong>Trend:</strong> Above 50 DMA / 200 DMA / Strong crossover adds points</div>
        </div>
      </div>
    </div>
  );
}