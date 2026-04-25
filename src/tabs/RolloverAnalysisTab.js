import React, { useEffect, useMemo, useState } from "react";
import ProfessionalTable from "../components/ProfessionalTable";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InsightsIcon from "@mui/icons-material/Insights";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import useSheetRange from "../hooks/useSheetRange";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

const theme = {
  bg: "#f8fafc",
  white: "#ffffff",
  text: "#0f172a",
  textSoft: "#334155",
  muted: "#64748b",
  border: "#e2e8f0",
  blue: "#2563eb",
  blueSoft: "#eff6ff",
  green: "#15803d",
  greenSoft: "#dcfce7",
  amber: "#b45309",
  amberSoft: "#fef3c7",
  red: "#dc2626",
  redSoft: "#fee2e2",
  purple: "#7c3aed",
  purpleSoft: "#ede9fe",
  pink: "#e11d48",
  pinkSoft: "#ffe4e6",
  shadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  radius: 14,
};

const cardStyle = {
  background: theme.white,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  padding: 14,
  boxShadow: theme.shadow,
};

const pillStyle = {
  borderRadius: 999,
  padding: "4px 10px",
  fontWeight: 700,
  fontSize: 12,
  display: "inline-block",
};

const sectionTitleStyle = {
  fontSize: 16,
  fontWeight: 800,
  color: theme.text,
  marginBottom: 10,
};

const printCardStyle = {
  background: "#ffffff",
  border: "1px solid #dbe4f0",
  borderRadius: 12,
  padding: 10,
  boxShadow: "none",
  breakInside: "avoid",
  pageBreakInside: "avoid",
};

const getNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(String(value).replace(/,/g, ""));
  return Number.isNaN(num) ? null : num;
};

const isBlank = (value) =>
  value === null || value === undefined || String(value).trim() === "";

const formatValue = (value, digits = 2) => {
  const num = getNumber(value);
  if (num === null) return "N/A";
  return num.toFixed(digits);
};

const formatCurrency = (value, digits = 2) => {
  const num = getNumber(value);
  if (num === null) return "N/A";
  return `₹${num.toFixed(digits)}`;
};

const getScreenerLink = (symbol) => {
  if (!symbol) return "#";
  const cleanSymbol = String(symbol).toUpperCase().replace(/\.NS|\.BO/g, "").trim();
  return `https://www.screener.in/company/${cleanSymbol}/`;
};

const getTradingViewLink = (symbol) => {
  if (!symbol) return "#";
  const cleanSymbol = String(symbol).toUpperCase().replace(/\.NS|\.BO/g, "").trim();
  return `https://www.tradingview.com/chart/?symbol=NSE:${cleanSymbol}`;
};

const getTagStyle = (tag) => {
  if (String(tag).includes("Strong")) {
    return { ...pillStyle, background: theme.greenSoft, color: theme.green };
  }
  if (String(tag).includes("Moderate")) {
    return { ...pillStyle, background: theme.amberSoft, color: theme.amber };
  }
  return { ...pillStyle, background: theme.redSoft, color: theme.red };
};

const getDmaBadgeStyle = (value) => {
  const v = String(value || "").toLowerCase();
  if (v.includes("strong")) {
    return { ...pillStyle, background: theme.greenSoft, color: theme.green };
  }
  if (v.includes("50-200")) {
    return { ...pillStyle, background: theme.amberSoft, color: theme.amber };
  }
  if (v.includes("below 50")) {
    return { ...pillStyle, background: theme.redSoft, color: theme.red };
  }
  return { ...pillStyle, background: "#e2e8f0", color: theme.textSoft };
};

const getDecisionColor = (action) => {
  const v = String(action || "").toLowerCase();
  if (v === "buy") return theme.green;
  if (v === "hold") return theme.amber;
  if (v === "avoid" || v === "sell") return theme.red;
  return theme.textSoft;
};

const getDecisionBg = (action) => {
  const v = String(action || "").toLowerCase();
  if (v === "buy") return theme.greenSoft;
  if (v === "hold") return theme.amberSoft;
  if (v === "avoid" || v === "sell") return theme.redSoft;
  return "#e2e8f0";
};

const metricTone = {
  green: { color: "#15803d", bg: "#dcfce7" },
  red: { color: "#dc2626", bg: "#fee2e2" },
  amber: { color: "#b45309", bg: "#fef3c7" },
  neutral: { color: "#334155", bg: "#f8fafc" },
};

const getMetricTone = (type, value, extra = {}) => {
  const num = getNumber(value);
  const cmp = getNumber(extra.cmp);
  const ref = getNumber(extra.ref);

  if (type === "cmpVsSma") {
    if (num === null || cmp === null) return metricTone.neutral;
    return cmp > num ? metricTone.green : metricTone.red;
  }

  if (type === "rsi") {
    if (num === null) return metricTone.neutral;
    if (num >= 60) return metricTone.green;
    if (num >= 40) return metricTone.amber;
    return metricTone.red;
  }

  if (type === "salesGrowth") {
    if (num === null) return metricTone.neutral;
    if (num > 15) return metricTone.green;
    if (num >= 0) return metricTone.amber;
    return metricTone.red;
  }

  if (type === "pe") {
    if (num === null) return metricTone.neutral;
    if (num <= 25) return metricTone.green;
    if (num <= 40) return metricTone.amber;
    return metricTone.red;
  }

  if (type === "de") {
    if (num === null) return metricTone.neutral;
    if (num <= 0.5) return metricTone.green;
    if (num <= 1.5) return metricTone.amber;
    return metricTone.red;
  }

  if (type === "forensicScore") {
    if (num === null) return metricTone.neutral;
    if (num >= 60) return metricTone.green;
    if (num >= 40) return metricTone.amber;
    return metricTone.red;
  }

  if (type === "cfoPat") {
    if (num === null) return metricTone.neutral;
    if (num >= 1) return metricTone.green;
    if (num >= 0.75) return metricTone.amber;
    return metricTone.red;
  }

  if (type === "opm") {
    if (num === null) return metricTone.neutral;
    if (num >= 20) return metricTone.green;
    if (num >= 10) return metricTone.amber;
    return metricTone.red;
  }

  if (type === "trendScore") {
    if (num === null) return metricTone.neutral;
    if (num >= 70) return metricTone.green;
    if (num >= 50) return metricTone.amber;
    return metricTone.red;
  }

  if (type === "roeRoce") {
    if (num === null) return metricTone.neutral;
    if (num >= 15) return metricTone.green;
    if (num >= 10) return metricTone.amber;
    return metricTone.red;
  }

  if (type === "genericHighGood") {
    if (num === null) return metricTone.neutral;
    if (ref !== null && num >= ref) return metricTone.green;
    return metricTone.red;
  }

  return metricTone.neutral;
};

const valueStyleFor = (type, value, extra = {}) => {
  const tone = getMetricTone(type, value, extra);
  return { color: tone.color, fontWeight: 800 };
};

function deriveDecisionFromScore(score, researchData) {
  const s = getNumber(score) ?? 0;
  const technicalTrendScore = getNumber(researchData?.technical?.trendScore);
  const trendLabel = String(researchData?.technical?.trendLabel || "").toLowerCase();
  const debtEquity = getNumber(researchData?.financial?.debtToEquity);
  const pe = getNumber(researchData?.financial?.pe);
  const forensicScore = getNumber(researchData?.forensic?.score);
  const salesGrowth = getNumber(researchData?.financial?.salesGrowthYoY);

  const reasons = [];
  const vetoReasons = [];

  if (s >= 85) reasons.push("overall multibagger score is very strong");
  else if (s >= 70) reasons.push("overall score is strong");
  else if (s >= 55) reasons.push("overall score is decent but not outstanding");
  else reasons.push("overall score is weak");

  if (technicalTrendScore !== null) {
    if (technicalTrendScore >= 75) reasons.push("trend strength is supportive");
    else if (technicalTrendScore < 40) vetoReasons.push("technical trend is weak");
  } else if (trendLabel.includes("bullish")) {
    reasons.push("trend label is bullish");
  } else if (trendLabel.includes("bearish")) {
    vetoReasons.push("trend label is bearish");
  }

  if (forensicScore !== null) {
    if (forensicScore < 35) vetoReasons.push("forensic score is very weak");
    else if (forensicScore < 50) reasons.push("forensic quality is average");
    else reasons.push("forensic quality is acceptable");
  }

  if (debtEquity !== null) {
    if (debtEquity > 3) vetoReasons.push("debt is very high");
    else if (debtEquity > 1.5) reasons.push("debt is on the higher side");
    else reasons.push("debt is manageable");
  }

  if (pe !== null) {
    if (pe > 100) vetoReasons.push("valuation is extremely expensive");
    else if (pe > 60) reasons.push("valuation is expensive");
    else if (pe < 30) reasons.push("valuation is reasonable");
  }

  if (salesGrowth !== null) {
    if (salesGrowth > 20) reasons.push("sales growth is strong");
    else if (salesGrowth < 0) vetoReasons.push("sales growth is negative");
  }

  let action = "Hold";
  let confidence = 6;

  if (vetoReasons.length >= 2) {
    action = "Avoid";
    confidence = 8;
  } else if (vetoReasons.length === 1) {
    if (s >= 70) {
      action = "Hold";
      confidence = 7;
    } else {
      action = "Avoid";
      confidence = 7;
    }
  } else {
    if (s >= 80) {
      action = "Buy";
      confidence = 8;
    } else if (s >= 60) {
      action = "Hold";
      confidence = 7;
    } else {
      action = "Avoid";
      confidence = 7;
    }
  }

  let summary = "";
  if (action === "Buy") {
    summary = `Buy because ${reasons.slice(0, 3).join(", ")}.`;
  } else if (action === "Hold") {
    if (vetoReasons.length) {
      summary = `Hold because score is supportive, but ${vetoReasons.join(" and ")}.`;
    } else {
      summary = `Hold because ${reasons.slice(0, 2).join(", ")}, but conviction is not yet strong enough for a buy call.`;
    }
  } else {
    summary = `Avoid because ${vetoReasons.join(" and ") || "the overall setup is weak"}.`;
  }

  return { action, confidence, summary, vetoReasons, reasons };
}

function getLaymanBrokerageView(data, score) {
  const tech = data?.technical || {};
  const fund = data?.financial || {};
  const forensic = data?.forensic || {};
  const decision = deriveDecisionFromScore(score, data);

  const price = getNumber(data?.overview?.cmp);
  const sma20 = getNumber(tech?.sma20);
  const sma50 = getNumber(tech?.sma50);
  const sma200 = getNumber(tech?.sma200);
  const salesGrowth = getNumber(fund?.salesGrowthYoY);
  const pe = getNumber(fund?.pe);
  const debtEquity = getNumber(fund?.debtToEquity);
  const forensicScore = getNumber(forensic?.score);

  let priceLine = "Price trend looks mixed right now.";
  if (price !== null && sma20 !== null && sma50 !== null && sma200 !== null) {
    if (price > sma20 && price > sma50 && price > sma200) {
      priceLine = "Price is above key moving averages, so the trend currently looks strong.";
    } else if (price < sma20 && price < sma50 && price < sma200) {
      priceLine = "Price is below key moving averages, so the current trend looks weak.";
    } else {
      priceLine = "Price is giving mixed signals because it is not clearly above or below all key averages.";
    }
  }

  const businessBits = [];
  if (pe !== null) {
    if (pe < 25) businessBits.push("valuation looks reasonable");
    else if (pe < 40) businessBits.push("valuation looks somewhat expensive");
    else businessBits.push("valuation looks expensive");
  }
  if (salesGrowth !== null) {
    businessBits.push(salesGrowth > 0 ? "sales are growing" : "sales growth is weak");
  }

  const businessLine = businessBits.length
    ? `Business view: ${businessBits.join(", ")}.`
    : "Business view: available numbers look average.";

  const safetyBits = [];
  if (debtEquity !== null) {
    safetyBits.push(
      debtEquity <= 0.5
        ? "debt is under control"
        : debtEquity <= 1.5
        ? "debt is manageable"
        : "debt is on the higher side"
    );
  }
  if (forensicScore !== null) {
    safetyBits.push(
      forensicScore >= 60
        ? "forensic quality looks comfortable"
        : forensicScore >= 40
        ? "forensic quality is average"
        : "forensic quality needs caution"
    );
  }

  const safetyLine = safetyBits.length
    ? `Safety view: ${safetyBits.join(", ")}.`
    : "Safety view: no major warning signal is visible.";

  const overallLine =
    decision.summary +
    ` Confidence is ${decision.confidence >= 8 ? "high" : "moderate"}.`;

  return { ...decision, priceLine, businessLine, safetyLine, overallLine };
}

function InfoRow({
  label,
  value,
  valueStyle = {},
  noBorder = false,
  tone = null,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        padding: "7px 8px",
        borderBottom: noBorder ? "none" : "1px solid #edf2f7",
        borderRadius: 8,
        background: tone?.bg || "transparent",
      }}
    >
      <span style={{ fontSize: 13, color: theme.muted, fontWeight: 700 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13.5,
          color: theme.text,
          fontWeight: 700,
          textAlign: "right",
          ...valueStyle,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SmallMetricCard({ title, icon, bg, borderColor, children }) {
  return (
    <div
      style={{
        ...cardStyle,
        background: bg,
        borderColor,
        minHeight: 210,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {icon}
        <div style={sectionTitleStyle}>{title}</div>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

export default function RolloverAnalysisTab() {
  const rawData = useSheetRange("multibagger", "A1:Z1000");
  const [selectedStock, setSelectedStock] = useState("");
  const [selectedCmpUnavailable, setSelectedCmpUnavailable] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [researchData, setResearchData] = useState(null);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [selectedRowMeta, setSelectedRowMeta] = useState(null);

  const derivedDecision = useMemo(
    () => deriveDecisionFromScore(selectedRowMeta?.score, researchData),
    [selectedRowMeta?.score, researchData]
  );

  const brokerageView = useMemo(
    () => getLaymanBrokerageView(researchData, selectedRowMeta?.score),
    [researchData, selectedRowMeta?.score]
  );

  const handlePrint = () => {
    const wasOpen = drawerOpen;
    if (wasOpen) {
      setDrawerOpen(false);
      setTimeout(() => {
        window.print();
        setTimeout(() => setDrawerOpen(true), 300);
      }, 250);
    } else {
      window.print();
    }
  };

  useEffect(() => {
    const fetchResearch = async () => {
      if (!selectedStock || selectedCmpUnavailable) return;

      setLoadingResearch(true);
      setResearchData(null);

      try {
        const res = await fetch(
          `${API_BASE}/api/stocks/${selectedStock.toLowerCase()}/research`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setResearchData(json);
      } catch (err) {
        console.error("Research fetch failed", err);
        setResearchData(null);
      } finally {
        setLoadingResearch(false);
      }
    };

    if (drawerOpen && selectedStock && !selectedCmpUnavailable) {
      fetchResearch();
    } else if (drawerOpen && selectedStock && selectedCmpUnavailable) {
      setResearchData(null);
      setLoadingResearch(false);
    }
  }, [selectedStock, drawerOpen, selectedCmpUnavailable]);

  if (!rawData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
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
    salesGrowth: headers.findIndex(
      (h) => h?.toLowerCase().includes("sales") && h?.toLowerCase().includes("5")
    ),
    profitGrowth: headers.findIndex(
      (h) => h?.toLowerCase().includes("profit") && h?.toLowerCase().includes("5yr")
    ),
    peg: headers.findIndex((h) => h?.toLowerCase().includes("peg")),
    debtEquity: headers.findIndex(
      (h) => h?.toLowerCase().includes("debt") || h?.toLowerCase().includes("d/e")
    ),
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
    "Research",
  ];

  const openResearchDrawer = (symbol, cmpUnavailable, meta) => {
    setSelectedStock(symbol);
    setSelectedCmpUnavailable(cmpUnavailable);
    setSelectedRowMeta(meta);
    setDrawerOpen(true);
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
      const cmpCell = colIndex.cmp >= 0 ? row[colIndex.cmp] || "" : "";
      const cmpUnavailable = isBlank(cmpCell);
      const dmaCross = colIndex.dmaCross >= 0 ? row[colIndex.dmaCross] || "" : "";

      const meta = {
        score,
        tag,
        name: nameCell,
        symbol: symbolCell,
        cmp: cmpCell,
        roe: row[colIndex.roe] || "",
        roce: row[colIndex.roce] || "",
        salesGrowth: row[colIndex.salesGrowth] || "",
        pe: row[colIndex.pe] || "",
        debtEquity: row[colIndex.debtEquity] || "",
        dmaCross,
      };

      return [
        symbolCell,
        <Tooltip key={`name-tip-${rowIdx}`} title="Click to open company page on Screener" arrow>
          <a
            href={getScreenerLink(symbolCell)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: theme.blue,
              textDecoration: "none",
              fontWeight: 600,
              display: "inline-block",
              textAlign: "left",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {nameCell}
          </a>
        </Tooltip>,
        cmpUnavailable ? (
          <span
            key={`cmp-na-${rowIdx}`}
            style={{ ...pillStyle, background: theme.amberSoft, color: theme.amber }}
          >
            Price unavailable
          </span>
        ) : (
          cmpCell
        ),
        <span
          key={`score-${rowIdx}`}
          style={{ ...pillStyle, background: theme.greenSoft, color: theme.green }}
        >
          {score}
        </span>,
        row[colIndex.roe] || "",
        row[colIndex.roce] || "",
        row[colIndex.salesGrowth] || "",
        row[colIndex.pe] || "",
        row[colIndex.debtEquity] || "",
        <span key={`tag-${rowIdx}`} style={getTagStyle(tag)}>
          {tag}
        </span>,
        dmaCross ? (
          <span key={`dma-${rowIdx}`} style={getDmaBadgeStyle(dmaCross)}>
            {dmaCross}
          </span>
        ) : (
          ""
        ),
        <Tooltip
          key={`research-tip-${rowIdx}`}
          title={cmpUnavailable ? "Open profile-only drawer" : "Open research drawer"}
          arrow
        >
          <IconButton
            size="small"
            onClick={() => openResearchDrawer(symbolCell, cmpUnavailable, meta)}
            sx={{ color: cmpUnavailable ? "#f59e0b" : "#4f46e5" }}
          >
            <InsightsIcon fontSize="small" />
          </IconButton>
        </Tooltip>,
      ];
    });

  const drawerSummaryCompany =
    researchData?.company?.name || selectedRowMeta?.name || selectedStock;
  const drawerSummarySector = researchData?.company?.sector || "N/A";
  const drawerSummaryIndustry = researchData?.company?.industry || "N/A";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1500,
        margin: "0 auto",
        padding: "24px 12px",
        textAlign: "left",
      }}
    >
      <style>{`
        .print-sheet-portal {
          display: none;
        }

        @page {
          size: A4 portrait;
          margin: 8mm;
        }

        @media print {
          html,
          body,
          #root {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #root {
            visibility: hidden !important;
          }

          .print-sheet-portal,
          .print-sheet-portal * {
            visibility: visible !important;
          }

          .print-sheet-portal {
            display: block !important;
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            z-index: 999999 !important;
          }

          .print-sheet {
            width: 194mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .print-grid-2 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }

          .print-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 8px !important;
            box-shadow: none !important;
          }

          .MuiDrawer-root,
          .MuiModal-root,
          .MuiBackdrop-root,
          .screen-only {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      <div style={{ marginBottom: 32, textAlign: "left" }}>
        <h3
          style={{
            textAlign: "left",
            marginBottom: 12,
            color: "#3f51b5",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          🔁 Multibagger Screener ({scoredRows.length} stocks)
        </h3>

        <div
          style={{
            textAlign: "left",
            marginBottom: 24,
            fontSize: 13,
            color: theme.muted,
            lineHeight: 1.6,
          }}
        >
          <div>
            <strong>Source:</strong> Screener monthly query
          </div>
          <div>
            <strong>Query:</strong> PEG Ratio &lt; 1 AND Net Profit last year &gt; 20% AND
            Debt to equity &lt; 1 AND Return on equity &gt; 20 AND Piotroski score &gt; 7
          </div>
          <div>
            <strong>Data extracted on:</strong> {extractionDate || "—"}
          </div>
        </div>

        <ProfessionalTable
          title="Top 50 by Score"
          headers={displayHeaders}
          rows={displayRows}
          tableType="multibagger"
          nameColumnAlign="left"
        />
      </div>

      <div
        style={{
          background: "#f8fafc",
          borderRadius: 8,
          padding: 16,
          fontSize: 12,
          color: theme.muted,
          border: `1px solid ${theme.border}`,
          textAlign: "left",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: theme.textSoft,
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          📋 Scoring Criteria (100 pts max)
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 8,
          }}
        >
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

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 560, md: 640 },
            boxSizing: "border-box",
            background: theme.bg,
            p: 2,
          },
        }}
      >
        <div className="screen-only">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: theme.text,
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}
              >
                {drawerSummaryCompany}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: theme.muted,
                  fontWeight: 700,
                  fontFamily: "monospace",
                }}
              >
                {selectedStock || "Research"}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Tooltip title="Print / Save PDF" arrow>
                <IconButton onClick={handlePrint}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <Chip label={`Sector: ${drawerSummarySector}`} size="small" variant="outlined" />
            <Chip label={`Industry: ${drawerSummaryIndustry}`} size="small" variant="outlined" />
          </div>

          {selectedCmpUnavailable ? (
            <>
              <div
                style={{
                  ...cardStyle,
                  background: "linear-gradient(135deg, #fff7ed 0%, #f8fafc 100%)",
                  borderColor: "#fdba74",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#9a3412",
                    marginBottom: 10,
                  }}
                >
                  Price unavailable from current source
                </div>
                <div style={{ fontSize: 14, color: "#7c2d12", lineHeight: 1.8 }}>
                  This stock does not have CMP from the current Google Finance based workflow,
                  so detailed live research is unavailable in this drawer.
                </div>
              </div>

              <div style={{ ...cardStyle, marginBottom: 14 }}>
                <div style={sectionTitleStyle}>Quick Snapshot</div>
                <InfoRow label="Ticker" value={selectedRowMeta?.symbol || selectedStock || "N/A"} />
                <InfoRow label="Name" value={selectedRowMeta?.name || "N/A"} />
                <InfoRow label="Score" value={selectedRowMeta?.score ?? "N/A"} />
                <InfoRow label="Tag" value={selectedRowMeta?.tag || "N/A"} />
                <InfoRow label="ROE" value={selectedRowMeta?.roe || "N/A"} />
                <InfoRow label="ROCE" value={selectedRowMeta?.roce || "N/A"} />
                <InfoRow label="Sales 5Yr" value={selectedRowMeta?.salesGrowth || "N/A"} />
                <InfoRow label="P/E" value={selectedRowMeta?.pe || "N/A"} />
                <InfoRow label="D/E" value={selectedRowMeta?.debtEquity || "N/A"} noBorder />
              </div>

              <div style={cardStyle}>
                <div style={sectionTitleStyle}>Open Links</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <a
                    href={getScreenerLink(selectedStock)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: theme.blue, textDecoration: "none", fontWeight: 700 }}
                  >
                    Screener <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: "middle" }} />
                  </a>
                </div>
              </div>
            </>
          ) : loadingResearch ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 220,
              }}
            >
              <CircularProgress />
            </div>
          ) : !researchData ? (
            <div style={{ color: theme.muted, fontSize: 14 }}>
              Click a research icon in the table to load stock details.
            </div>
          ) : (
            <>
              <div
                style={{
                  ...cardStyle,
                  background: "linear-gradient(135deg, #eef6ff 0%, #f8fafc 100%)",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      background: theme.white,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 12, color: theme.muted, fontWeight: 700, marginBottom: 4 }}>
                      CMP
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: theme.text }}>
                      {formatCurrency(researchData?.overview?.cmp, 2)}
                    </div>
                  </div>

                  <div
                    style={{
                      background: theme.white,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 12, color: theme.muted, fontWeight: 700, marginBottom: 4 }}>
                      Score
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: theme.text }}>
                      {selectedRowMeta?.score ?? "N/A"}
                    </div>
                  </div>

                  <div
                    style={{
                      background: getDecisionBg(derivedDecision.action),
                      border: `1px solid ${theme.border}`,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 12, color: theme.muted, fontWeight: 700, marginBottom: 4 }}>
                      Action
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: getDecisionColor(derivedDecision.action),
                      }}
                    >
                      {derivedDecision.action}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, fontSize: 14, color: theme.textSoft, lineHeight: 1.8 }}>
                  <strong>Business:</strong>{" "}
                  {researchData?.company?.description || "Business description not available."}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <SmallMetricCard
                  title="Technical"
                  bg={theme.blueSoft}
                  borderColor="#93c5fd"
                  icon={<TrendingUpIcon sx={{ color: theme.blue, fontSize: 20 }} />}
                >
                  <InfoRow label="CMP" value={formatCurrency(researchData?.overview?.cmp, 2)} />
                  <InfoRow
                    label="20 SMA"
                    value={formatCurrency(researchData?.technical?.sma20, 2)}
                    valueStyle={valueStyleFor("cmpVsSma", researchData?.technical?.sma20, {
                      cmp: researchData?.overview?.cmp,
                    })}
                    tone={getMetricTone("cmpVsSma", researchData?.technical?.sma20, {
                      cmp: researchData?.overview?.cmp,
                    })}
                  />
                  <InfoRow
                    label="50 SMA"
                    value={formatCurrency(researchData?.technical?.sma50, 2)}
                    valueStyle={valueStyleFor("cmpVsSma", researchData?.technical?.sma50, {
                      cmp: researchData?.overview?.cmp,
                    })}
                    tone={getMetricTone("cmpVsSma", researchData?.technical?.sma50, {
                      cmp: researchData?.overview?.cmp,
                    })}
                  />
                  <InfoRow
                    label="200 SMA"
                    value={formatCurrency(researchData?.technical?.sma200, 2)}
                    valueStyle={valueStyleFor("cmpVsSma", researchData?.technical?.sma200, {
                      cmp: researchData?.overview?.cmp,
                    })}
                    tone={getMetricTone("cmpVsSma", researchData?.technical?.sma200, {
                      cmp: researchData?.overview?.cmp,
                    })}
                  />
                  <InfoRow
                    label="RSI 14"
                    value={formatValue(researchData?.technical?.rsi14, 2)}
                    valueStyle={valueStyleFor("rsi", researchData?.technical?.rsi14)}
                    tone={getMetricTone("rsi", researchData?.technical?.rsi14)}
                  />
                  <InfoRow
                    label="Trend"
                    value={researchData?.technical?.trendLabel || "N/A"}
                    valueStyle={valueStyleFor("trendScore", researchData?.technical?.trendScore)}
                    tone={getMetricTone("trendScore", researchData?.technical?.trendScore)}
                    noBorder
                  />
                </SmallMetricCard>

                <SmallMetricCard
                  title="Financial"
                  bg={theme.amberSoft}
                  borderColor="#f59e0b"
                  icon={<AccountBalanceIcon sx={{ color: theme.amber, fontSize: 20 }} />}
                >
                  <InfoRow
                    label="PE"
                    value={formatValue(researchData?.financial?.pe, 2)}
                    valueStyle={valueStyleFor("pe", researchData?.financial?.pe)}
                    tone={getMetricTone("pe", researchData?.financial?.pe)}
                  />
                  <InfoRow label="PB" value={formatValue(researchData?.financial?.pb, 2)} />
                  <InfoRow
                    label="ROE"
                    value={formatValue(researchData?.financial?.roe, 2)}
                    valueStyle={valueStyleFor("roeRoce", researchData?.financial?.roe)}
                    tone={getMetricTone("roeRoce", researchData?.financial?.roe)}
                  />
                  <InfoRow
                    label="ROCE"
                    value={formatValue(researchData?.financial?.roce, 2)}
                    valueStyle={valueStyleFor("roeRoce", researchData?.financial?.roce)}
                    tone={getMetricTone("roeRoce", researchData?.financial?.roce)}
                  />
                  <InfoRow
                    label="Sales Growth YoY"
                    value={formatValue(researchData?.financial?.salesGrowthYoY, 2)}
                    valueStyle={valueStyleFor("salesGrowth", researchData?.financial?.salesGrowthYoY)}
                    tone={getMetricTone("salesGrowth", researchData?.financial?.salesGrowthYoY)}
                  />
                  <InfoRow
                    label="D/E"
                    value={formatValue(researchData?.financial?.debtToEquity, 2)}
                    valueStyle={valueStyleFor("de", researchData?.financial?.debtToEquity)}
                    tone={getMetricTone("de", researchData?.financial?.debtToEquity)}
                    noBorder
                  />
                </SmallMetricCard>

                <SmallMetricCard
                  title="Forensic"
                  bg={theme.pinkSoft}
                  borderColor="#fb7185"
                  icon={<ShieldOutlinedIcon sx={{ color: theme.pink, fontSize: 20 }} />}
                >
                  <InfoRow
                    label="Forensic Score"
                    value={formatValue(researchData?.forensic?.score, 0)}
                    valueStyle={valueStyleFor("forensicScore", researchData?.forensic?.score)}
                    tone={getMetricTone("forensicScore", researchData?.forensic?.score)}
                  />
                  <InfoRow label="Grade" value={researchData?.forensic?.grade || "N/A"} />
                  <InfoRow
                    label="CFO / PAT"
                    value={formatValue(researchData?.forensic?.cfoPat, 2)}
                    valueStyle={valueStyleFor("cfoPat", researchData?.forensic?.cfoPat)}
                    tone={getMetricTone("cfoPat", researchData?.forensic?.cfoPat)}
                  />
                  <InfoRow
                    label="OPM"
                    value={formatValue(researchData?.forensic?.opmCurrent, 2)}
                    valueStyle={valueStyleFor("opm", researchData?.forensic?.opmCurrent)}
                    tone={getMetricTone("opm", researchData?.forensic?.opmCurrent)}
                  />
                  <InfoRow label="Receivable Days" value={formatValue(researchData?.forensic?.recvDaysCurrent, 2)} />
                  <InfoRow label="Inventory Days" value={formatValue(researchData?.forensic?.invDaysCurrent, 2)} noBorder />
                </SmallMetricCard>

                <SmallMetricCard
                  title="Snapshot"
                  bg={theme.purpleSoft}
                  borderColor="#a78bfa"
                  icon={<InsightsIcon sx={{ color: theme.purple, fontSize: 20 }} />}
                >
                  <InfoRow label="52W High" value={formatCurrency(researchData?.overview?.week52High, 2)} />
                  <InfoRow label="52W Low" value={formatCurrency(researchData?.overview?.week52Low, 2)} />
                  <InfoRow
                    label="Change"
                    value={`${formatValue(researchData?.overview?.change, 2)} (${formatValue(
                      researchData?.overview?.changePercent,
                      2
                    )}%)`}
                    valueStyle={valueStyleFor("genericHighGood", researchData?.overview?.change, { ref: 0 })}
                    tone={getMetricTone("genericHighGood", researchData?.overview?.change, { ref: 0 })}
                  />
                  <InfoRow
                    label="Trend Score"
                    value={formatValue(researchData?.technical?.trendScore, 0)}
                    valueStyle={valueStyleFor("trendScore", researchData?.technical?.trendScore)}
                    tone={getMetricTone("trendScore", researchData?.technical?.trendScore)}
                  />
                  <InfoRow
                    label="Action"
                    value={derivedDecision.action}
                    valueStyle={{ color: getDecisionColor(derivedDecision.action), fontWeight: 800 }}
                  />
                  <InfoRow label="Confidence" value={`${derivedDecision.confidence}/10`} noBorder />
                </SmallMetricCard>
              </div>

              <div
                style={{
                  ...cardStyle,
                  border: "1.5px solid #93c5fd",
                  background: "linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%)",
                  marginBottom: 14,
                }}
              >
                <div style={sectionTitleStyle}>Brokerage Style View</div>
                <div style={{ fontSize: 14, lineHeight: 1.85, color: theme.textSoft }}>
                  <div style={{ marginBottom: 8 }}>{brokerageView.priceLine}</div>
                  <div style={{ marginBottom: 8 }}>{brokerageView.businessLine}</div>
                  <div style={{ marginBottom: 8 }}>{brokerageView.safetyLine}</div>
                  <div style={{ fontWeight: 800, color: theme.text }}>{brokerageView.overallLine}</div>
                </div>
              </div>

              <div
                style={{
                  ...cardStyle,
                  border: `1px solid ${theme.border}`,
                  background: "linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%)",
                  marginBottom: 14,
                }}
              >
                <div style={sectionTitleStyle}>Action Logic</div>
                <div style={{ fontSize: 14, color: theme.textSoft, lineHeight: 1.85 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Summary:</strong> {derivedDecision.summary}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Supportive factors:</strong>{" "}
                    {derivedDecision.reasons?.length ? derivedDecision.reasons.join(", ") : "N/A"}
                  </div>
                  <div>
                    <strong>Veto factors:</strong>{" "}
                    {derivedDecision.vetoReasons?.length ? derivedDecision.vetoReasons.join(", ") : "None"}
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={sectionTitleStyle}>Open Links</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <a
                    href={getTradingViewLink(selectedStock)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0f766e", textDecoration: "none", fontWeight: 700 }}
                  >
                    TradingView <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: "middle" }} />
                  </a>
                  <a
                    href={getScreenerLink(selectedStock)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: theme.blue, textDecoration: "none", fontWeight: 700 }}
                  >
                    Screener <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: "middle" }} />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </Drawer>

      <div className="print-sheet-portal">
        <div className="print-sheet">
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.2,
                textAlign: "left",
              }}
            >
              {drawerSummaryCompany || "Stock Research"}
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: "#475569",
                fontWeight: 700,
                fontFamily: "monospace",
                textAlign: "left",
              }}
            >
              {selectedStock || "N/A"}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: "#64748b",
                textAlign: "left",
              }}
            >
              Sector: {drawerSummarySector} | Industry: {drawerSummaryIndustry}
            </div>
          </div>

          {selectedCmpUnavailable ? (
            <div className="print-card" style={{ ...printCardStyle, marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#9a3412",
                  marginBottom: 6,
                }}
              >
                Price unavailable from current source
              </div>
              <div style={{ fontSize: 12.5, color: "#7c2d12", lineHeight: 1.6 }}>
                This stock does not have CMP from the current workflow, so detailed research is
                not available in the printed report.
              </div>
            </div>
          ) : !researchData ? (
            <div className="print-card" style={printCardStyle}>
              <div style={{ fontSize: 13, color: "#64748b" }}>Load stock details before printing.</div>
            </div>
          ) : (
            <>
              <div className="print-card" style={{ ...printCardStyle, marginBottom: 8 }}>
                <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Business</div>
                <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.65 }}>
                  {researchData?.company?.description || "Business description not available."}
                </div>
              </div>

              <div className="print-grid-2" style={{ marginBottom: 8 }}>
                <div className="print-card" style={printCardStyle}>
                  <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Technical</div>
                  <InfoRow label="CMP" value={formatCurrency(researchData?.overview?.cmp, 2)} />
                  <InfoRow
                    label="20 SMA"
                    value={formatCurrency(researchData?.technical?.sma20, 2)}
                    valueStyle={valueStyleFor("cmpVsSma", researchData?.technical?.sma20, {
                      cmp: researchData?.overview?.cmp,
                    })}
                    tone={getMetricTone("cmpVsSma", researchData?.technical?.sma20, {
                      cmp: researchData?.overview?.cmp,
                    })}
                  />
                  <InfoRow
                    label="50 SMA"
                    value={formatCurrency(researchData?.technical?.sma50, 2)}
                    valueStyle={valueStyleFor("cmpVsSma", researchData?.technical?.sma50, {
                      cmp: researchData?.overview?.cmp,
                    })}
                    tone={getMetricTone("cmpVsSma", researchData?.technical?.sma50, {
                      cmp: researchData?.overview?.cmp,
                    })}
                  />
                  <InfoRow
                    label="200 SMA"
                    value={formatCurrency(researchData?.technical?.sma200, 2)}
                    valueStyle={valueStyleFor("cmpVsSma", researchData?.technical?.sma200, {
                      cmp: researchData?.overview?.cmp,
                    })}
                    tone={getMetricTone("cmpVsSma", researchData?.technical?.sma200, {
                      cmp: researchData?.overview?.cmp,
                    })}
                  />
                  <InfoRow
                    label="RSI 14"
                    value={formatValue(researchData?.technical?.rsi14, 2)}
                    valueStyle={valueStyleFor("rsi", researchData?.technical?.rsi14)}
                    tone={getMetricTone("rsi", researchData?.technical?.rsi14)}
                  />
                  <InfoRow
                    label="Trend"
                    value={researchData?.technical?.trendLabel || "N/A"}
                    valueStyle={valueStyleFor("trendScore", researchData?.technical?.trendScore)}
                    tone={getMetricTone("trendScore", researchData?.technical?.trendScore)}
                    noBorder
                  />
                </div>

                <div className="print-card" style={printCardStyle}>
                  <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Financial</div>
                  <InfoRow
                    label="PE"
                    value={formatValue(researchData?.financial?.pe, 2)}
                    valueStyle={valueStyleFor("pe", researchData?.financial?.pe)}
                    tone={getMetricTone("pe", researchData?.financial?.pe)}
                  />
                  <InfoRow label="PB" value={formatValue(researchData?.financial?.pb, 2)} />
                  <InfoRow
                    label="ROE"
                    value={formatValue(researchData?.financial?.roe, 2)}
                    valueStyle={valueStyleFor("roeRoce", researchData?.financial?.roe)}
                    tone={getMetricTone("roeRoce", researchData?.financial?.roe)}
                  />
                  <InfoRow
                    label="ROCE"
                    value={formatValue(researchData?.financial?.roce, 2)}
                    valueStyle={valueStyleFor("roeRoce", researchData?.financial?.roce)}
                    tone={getMetricTone("roeRoce", researchData?.financial?.roce)}
                  />
                  <InfoRow
                    label="Sales Growth YoY"
                    value={formatValue(researchData?.financial?.salesGrowthYoY, 2)}
                    valueStyle={valueStyleFor("salesGrowth", researchData?.financial?.salesGrowthYoY)}
                    tone={getMetricTone("salesGrowth", researchData?.financial?.salesGrowthYoY)}
                  />
                  <InfoRow
                    label="D/E"
                    value={formatValue(researchData?.financial?.debtToEquity, 2)}
                    valueStyle={valueStyleFor("de", researchData?.financial?.debtToEquity)}
                    tone={getMetricTone("de", researchData?.financial?.debtToEquity)}
                    noBorder
                  />
                </div>

                <div className="print-card" style={printCardStyle}>
                  <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Forensic</div>
                  <InfoRow
                    label="Forensic Score"
                    value={formatValue(researchData?.forensic?.score, 0)}
                    valueStyle={valueStyleFor("forensicScore", researchData?.forensic?.score)}
                    tone={getMetricTone("forensicScore", researchData?.forensic?.score)}
                  />
                  <InfoRow label="Grade" value={researchData?.forensic?.grade || "N/A"} />
                  <InfoRow
                    label="CFO / PAT"
                    value={formatValue(researchData?.forensic?.cfoPat, 2)}
                    valueStyle={valueStyleFor("cfoPat", researchData?.forensic?.cfoPat)}
                    tone={getMetricTone("cfoPat", researchData?.forensic?.cfoPat)}
                  />
                  <InfoRow
                    label="OPM"
                    value={formatValue(researchData?.forensic?.opmCurrent, 2)}
                    valueStyle={valueStyleFor("opm", researchData?.forensic?.opmCurrent)}
                    tone={getMetricTone("opm", researchData?.forensic?.opmCurrent)}
                  />
                  <InfoRow label="Receivable Days" value={formatValue(researchData?.forensic?.recvDaysCurrent, 2)} />
                  <InfoRow label="Inventory Days" value={formatValue(researchData?.forensic?.invDaysCurrent, 2)} noBorder />
                </div>

                <div className="print-card" style={printCardStyle}>
                  <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Snapshot</div>
                  <InfoRow label="52W High" value={formatCurrency(researchData?.overview?.week52High, 2)} />
                  <InfoRow label="52W Low" value={formatCurrency(researchData?.overview?.week52Low, 2)} />
                  <InfoRow
                    label="Change"
                    value={`${formatValue(researchData?.overview?.change, 2)} (${formatValue(
                      researchData?.overview?.changePercent,
                      2
                    )}%)`}
                    valueStyle={valueStyleFor("genericHighGood", researchData?.overview?.change, { ref: 0 })}
                    tone={getMetricTone("genericHighGood", researchData?.overview?.change, { ref: 0 })}
                  />
                  <InfoRow
                    label="Trend Score"
                    value={formatValue(researchData?.technical?.trendScore, 0)}
                    valueStyle={valueStyleFor("trendScore", researchData?.technical?.trendScore)}
                    tone={getMetricTone("trendScore", researchData?.technical?.trendScore)}
                  />
                  <InfoRow
                    label="Action"
                    value={derivedDecision.action}
                    valueStyle={{ color: getDecisionColor(derivedDecision.action), fontWeight: 800 }}
                  />
                  <InfoRow label="Confidence" value={`${derivedDecision.confidence}/10`} noBorder />
                </div>
              </div>

              <div className="print-card" style={{ ...printCardStyle, marginBottom: 8 }}>
                <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Brokerage Style View</div>
                <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.65 }}>
                  <div style={{ marginBottom: 5 }}>{brokerageView.priceLine}</div>
                  <div style={{ marginBottom: 5 }}>{brokerageView.businessLine}</div>
                  <div style={{ marginBottom: 5 }}>{brokerageView.safetyLine}</div>
                  <div style={{ fontWeight: 800, color: "#111827" }}>{brokerageView.overallLine}</div>
                </div>
              </div>

              <div className="print-card" style={{ ...printCardStyle, marginBottom: 8 }}>
                <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Action Logic</div>
                <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.65 }}>
                  <div style={{ marginBottom: 5 }}>
                    <strong>Summary:</strong> {derivedDecision.summary}
                  </div>
                  <div style={{ marginBottom: 5 }}>
                    <strong>Supportive factors:</strong>{" "}
                    {derivedDecision.reasons?.length ? derivedDecision.reasons.join(", ") : "N/A"}
                  </div>
                  <div>
                    <strong>Veto factors:</strong>{" "}
                    {derivedDecision.vetoReasons?.length ? derivedDecision.vetoReasons.join(", ") : "None"}
                  </div>
                </div>
              </div>

              <div className="print-card" style={printCardStyle}>
                <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Links</div>
                <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.7 }}>
                  TradingView: {getTradingViewLink(selectedStock)}
                  <br />
                  Screener: {getScreenerLink(selectedStock)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}