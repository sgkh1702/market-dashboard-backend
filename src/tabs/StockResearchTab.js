import React, { useRef, useState } from "react";
import StockSearchBox from "../components/stock-research/StockSearchBox";
import TechnicalCard from "../components/stock-research/TechnicalCard";
import FinancialCard from "../components/stock-research/FinancialCard";
import ForensicCard from "../components/stock-research/ForensicCard";
import { fetchStockResearch } from "../services/stockApi";

const theme = {
  bg: "linear-gradient(180deg, #f4f7fb 0%, #eef4ff 100%)",
  cardBg: "#ffffff",
  cardBorder: "#dbe4f0",
  title: "#0f172a",
  text: "#1f2937",
  muted: "#64748b",
  blue: "#2563eb",
  blueSoft: "#eff6ff",
  green: "#059669",
  greenSoft: "#ecfdf5",
  amber: "#d97706",
  amberSoft: "#fffbeb",
  red: "#dc2626",
  redSoft: "#fef2f2",
  purple: "#7c3aed",
  purpleSoft: "#f5f3ff",
  shadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
  radius: "16px",
};

const styles = {
  pageWrap: {
    background: theme.bg,
    paddingBottom: "24px",
    minWidth: 0,
  },
  pageTitle: {
    marginBottom: "14px",
    color: theme.title,
    fontSize: "28px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "10px",
    overflow: "visible",
    paddingBottom: "2px",
    minWidth: 0,
  },
  searchWrap: {
    flex: "0 0 32%",
    minWidth: "360px",
    maxWidth: "420px",
    position: "relative",
    overflow: "visible",
  },
  linkBtn: {
    padding: "10px 14px",
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: "12px",
    textDecoration: "none",
    color: theme.title,
    background: theme.cardBg,
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "44px",
    boxShadow: theme.shadow,
    flexShrink: 0,
    cursor: "pointer",
  },
  metricBox: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: "12px",
    background: theme.cardBg,
    minWidth: "fit-content",
    whiteSpace: "nowrap",
    height: "44px",
    boxShadow: theme.shadow,
    flexShrink: 0,
  },
  metricLabel: {
    fontSize: "12px",
    color: theme.muted,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  metricValue: {
    fontSize: "15px",
    fontWeight: 700,
    color: theme.title,
  },
  selectedText: {
    margin: "4px 0 12px",
    color: theme.muted,
    fontSize: "15px",
    fontWeight: 600,
  },
  identityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginTop: "16px",
    marginBottom: "12px",
    minWidth: 0,
  },
  infoCard: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: theme.radius,
    padding: "14px 16px",
    boxShadow: theme.shadow,
    minHeight: "84px",
    minWidth: 0,
  },
  infoLabel: {
    marginBottom: "6px",
    fontSize: "12px",
    color: theme.muted,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  infoValue: {
    fontSize: "16px",
    color: theme.title,
    fontWeight: 700,
    lineHeight: "1.4",
    minWidth: 0,
    wordBreak: "break-word",
  },
  businessCard: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: theme.radius,
    padding: "16px 18px",
    marginBottom: "14px",
    boxShadow: theme.shadow,
    minWidth: 0,
  },
  businessBody: {
    fontSize: "14px",
    lineHeight: "1.7",
    color: theme.text,
    maxHeight: "140px",
    overflowY: "auto",
    overflowX: "hidden",
    paddingRight: "6px",
    fontWeight: 500,
    minWidth: 0,
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "14px",
    alignItems: "stretch",
    minWidth: 0,
  },
  cardCell: {
    minWidth: 0,
    minHeight: 0,
    display: "block",
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 300px",
    gap: "14px",
    marginBottom: "14px",
    alignItems: "stretch",
    minWidth: 0,
  },
  sectionCard: {
    background: "#ffffff",
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: theme.radius,
    padding: "16px",
    marginBottom: "14px",
    boxShadow: theme.shadow,
    minWidth: 0,
    overflow: "visible",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    minWidth: 0,
  },
  positiveCard: {
    background: theme.greenSoft,
    border: "1px solid #bfe8d8",
    borderRadius: theme.radius,
    padding: "16px",
    boxShadow: theme.shadow,
    minWidth: 0,
  },
  negativeCard: {
    background: theme.amberSoft,
    border: "1px solid #f2dcc5",
    borderRadius: theme.radius,
    padding: "16px",
    boxShadow: theme.shadow,
    minWidth: 0,
  },
  overallCard: {
    background: theme.blueSoft,
    border: "1px solid #cfe0ff",
    borderRadius: theme.radius,
    padding: "16px",
    boxShadow: theme.shadow,
    minWidth: 0,
  },
};

function getNum(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(n) ? n : null;
}

function formatNumber(value, digits = 2) {
  const n = getNum(value);
  return n === null ? "-" : n.toFixed(digits);
}

function formatPercent(value, digits = 2) {
  const n = getNum(value);
  return n === null ? "-" : `${n.toFixed(digits)}%`;
}

function calculateFinancialScore(financial) {
  if (!financial) return null;

  let score = 0;
  const pe = Number(financial.pe);
  const roe = Number(financial.roe);
  const roce = Number(financial.roce);
  const debtToEquity = Number(financial.debtToEquity);
  const salesGrowthYoY = Number(financial.salesGrowthYoY);
  const netMargin = Number(financial.netMargin);
  const operatingMargin = Number(financial.operatingMargin);

  if (!isNaN(pe)) {
    if (pe > 0 && pe <= 25) score += 15;
    else if (pe <= 40) score += 10;
    else score += 5;
  }

  if (!isNaN(roe)) {
    if (roe >= 15) score += 15;
    else if (roe >= 10) score += 10;
    else if (roe >= 5) score += 5;
  }

  if (!isNaN(roce)) {
    if (roce >= 15) score += 15;
    else if (roce >= 10) score += 10;
    else if (roce >= 5) score += 5;
  }

  if (!isNaN(debtToEquity)) {
    const normalizedDebtToEquity = debtToEquity > 10 ? debtToEquity / 100 : debtToEquity;
    if (normalizedDebtToEquity <= 0.5) score += 15;
    else if (normalizedDebtToEquity <= 1) score += 10;
    else score += 5;
  }

  if (!isNaN(salesGrowthYoY)) {
    if (salesGrowthYoY >= 15) score += 15;
    else if (salesGrowthYoY >= 8) score += 10;
    else if (salesGrowthYoY > 0) score += 5;
  }

  if (!isNaN(netMargin)) {
    if (netMargin >= 12) score += 10;
    else if (netMargin >= 8) score += 7;
    else if (netMargin >= 5) score += 4;
  }

  if (!isNaN(operatingMargin)) {
    if (operatingMargin >= 15) score += 15;
    else if (operatingMargin >= 10) score += 10;
    else if (operatingMargin >= 5) score += 5;
  }

  return Math.min(100, score);
}

function calculateOverallScore(technicalScore, financialScore, forensicScore) {
  const values = [technicalScore, financialScore, forensicScore]
    .map((x) => Number(x))
    .filter((x) => !isNaN(x));

  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function buildPositivePoints(research, technicalScore, financialScore) {
  const points = [];

  if ((financialScore ?? 0) >= 70) {
    points.push("Financial profile looks reasonably strong.");
  }
  if (Number(research?.forensic?.cfoPat) >= 1) {
    points.push("Operating cash flow is supporting reported profit well.");
  }

  const forensicDebt =
    research?.forensic?.debtEquity != null
      ? Number(research.forensic.debtEquity) > 10
        ? Number(research.forensic.debtEquity) / 100
        : Number(research.forensic.debtEquity)
      : null;

  if (forensicDebt !== null && forensicDebt <= 0.5) {
    points.push("Debt levels look comfortable.");
  }
  if ((technicalScore ?? 0) >= 60) {
    points.push("Price trend is not weak and shows some support.");
  }

  return points.length
    ? points
    : ["No major positive strength is clearly standing out right now."];
}

function buildNegativePoints(research, technicalScore, forensicScore) {
  const points = [];

  if ((technicalScore ?? 0) < 40) {
    points.push("Price momentum is weak right now.");
  }
  if (Number(research?.forensic?.opmCurrent) < 12) {
    points.push("Margins are not very strong and need monitoring.");
  }
  if (Number(research?.forensic?.invDaysCurrent) > 60) {
    points.push("Inventory holding period looks a little stretched.");
  }
  if ((forensicScore ?? 0) < 50) {
    points.push("Forensic quality is not strong enough for full comfort.");
  }

  return points.length
    ? points
    : ["No major negative factor is clearly standing out right now."];
}

export default function StockResearchTab() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const printRef = useRef(null);

  const handleSelect = async (stock) => {
    setSelectedStock(stock);
    setLoading(true);
    setError("");

    try {
      const data = await fetchStockResearch(stock.symbol);
      setResearch(data);
    } catch (err) {
      console.error("Research load error:", err);
      setError(`Failed to load stock research for ${stock.symbol}`);
      setResearch(null);
    } finally {
      setLoading(false);
    }
  };

const handlePrint = () => {
  if (!research) return;

  const companyName = research?.company?.name || selectedStock?.name || "-";
  const symbol = research?.symbol || selectedStock?.symbol || "-";
  const sector = research?.company?.sector || "-";
  const industry = research?.company?.industry || "-";
  const fullDescription =
    research?.company?.description || "No business description available.";

  const technicalScore = research?.technical?.trendScore ?? null;
  const financialScore = calculateFinancialScore(research?.financial);
  const forensicScore = research?.forensic?.score ?? null;
  const overallScore =
    research?.overallScore ??
    calculateOverallScore(technicalScore, financialScore, forensicScore);

  const positivePoints = buildPositivePoints(
    research,
    technicalScore,
    financialScore
  );
  const negativePoints = buildNegativePoints(
    research,
    technicalScore,
    forensicScore
  );

  const overallView =
    (overallScore ?? 0) >= 70
      ? "The stock looks fairly strong across key areas and may deserve deeper research or gradual accumulation."
      : (overallScore ?? 0) >= 40
      ? "The stock has some strengths, but overall conviction is still moderate. It looks better suited for watchlist tracking or selective holding than a strong buy right now."
      : "The stock does not look strong enough right now for a high-conviction view. It may be better to wait for improvement in trend or business quality.";

  const forensicGrade = research?.forensic?.grade || "-";
  const forensicGradeText =
    forensicGrade === "A"
      ? "Strong"
      : forensicGrade === "B"
      ? "Above Average"
      : forensicGrade === "C"
      ? "Average"
      : "Weak";

  const cashFlowComment =
    Number(research?.forensic?.cfoPat) >= 1
      ? "Profit is well supported by operating cash flow."
      : Number(research?.forensic?.cfoPat) >= 0.8
      ? "Cash flow broadly supports profit, but should be monitored."
      : "Cash flow support for profit is not strong enough.";

  const leverageComment = (() => {
    const d = getNum(research?.forensic?.debtEquity);
    if (d === null) return "Debt position data is not available.";
    const normalized = d > 10 ? d / 100 : d;
    if (normalized <= 0.5) return "Debt levels look comfortable.";
    if (normalized <= 1) return "Debt levels are manageable, but should be monitored.";
    return "Leverage looks elevated and needs caution.";
  })();

  const marginsComment =
    Number(research?.forensic?.opmCurrent) >= 15
      ? "Margins are healthy and supportive."
      : Number(research?.forensic?.opmCurrent) >= 8
      ? "Margins are moderate and need tracking."
      : "Margins are weak and need close monitoring.";

  const workingCapitalComment = (() => {
    const recv = getNum(research?.forensic?.recvDaysCurrent);
    const inv = getNum(research?.forensic?.invDaysCurrent);

    if (recv !== null && inv !== null) {
      if (recv <= 45 && inv <= 90) {
        return "Collections look healthy and inventory is manageable.";
      }
      if (recv <= 75 && inv <= 140) {
        return "Working capital is acceptable, but should be watched.";
      }
      return "Working capital looks stretched and needs monitoring.";
    }

    if (recv !== null && recv <= 45) {
      return "Collections look healthy; inventory data is limited.";
    }

    return "Working-capital data is mixed or incomplete.";
  })();

  const compactRows = [
    ["Technical Score", technicalScore ?? "-"],
    ["Trend", research?.technical?.trendLabel || "-"],
    ["RSI 14", formatNumber(research?.technical?.rsi14)],
    ["SMA 20", formatNumber(research?.technical?.sma20)],
    ["SMA 50", formatNumber(research?.technical?.sma50)],
    ["SMA 200", formatNumber(research?.technical?.sma200)],
    ["52W High", formatNumber(research?.overview?.week52High)],
    ["52W Low", formatNumber(research?.overview?.week52Low)],

    ["Financial Score", financialScore ?? "-"],
    ["P/E", formatNumber(research?.financial?.pe)],
    ["P/B", formatNumber(research?.financial?.pb)],
    ["ROE", formatPercent(research?.financial?.roe)],
    ["ROCE", formatPercent(research?.financial?.roce)],
    [
      "Debt / Equity",
      (() => {
        const d = getNum(research?.financial?.debtToEquity);
        if (d === null) return "-";
        return d > 10 ? formatNumber(d / 100) : formatNumber(d);
      })(),
    ],
    ["Sales Growth YoY", formatPercent(research?.financial?.salesGrowthYoY)],
    ["Current Ratio", formatNumber(research?.financial?.currentRatio)],
    ["Net Margin", formatPercent(research?.financial?.netMargin)],
    ["Operating Margin", formatPercent(research?.financial?.operatingMargin)],

    ["Forensic Score", forensicScore ?? "-"],
    ["Grade", `${forensicGrade} · ${forensicGradeText}`],
    ["CFO / PAT", formatNumber(research?.forensic?.cfoPat)],
    [
      "Debt / Equity",
      (() => {
        const d = getNum(research?.forensic?.debtEquity);
        if (d === null) return "-";
        return d > 10 ? formatNumber(d / 100) : formatNumber(d);
      })(),
    ],
    ["Operating Margin", formatPercent(research?.forensic?.opmCurrent)],
    ["Receivable Days", formatNumber(research?.forensic?.recvDaysCurrent)],
    ["Inventory Days", formatNumber(research?.forensic?.invDaysCurrent)],
    ["Pledge %", formatPercent(research?.forensic?.pledgePct)],
  ];

  const rowsHtml = compactRows
    .map(
      ([label, value]) => `
        <tr>
          <td>${label}</td>
          <td>${value}</td>
        </tr>
      `
    )
    .join("");

  const positivesHtml = positivePoints
    .slice(0, 3)
    .map((p) => `<li>${p}</li>`)
    .join("");

  const negativesHtml = negativePoints
    .slice(0, 3)
    .map((p) => `<li>${p}</li>`)
    .join("");

  const win = window.open("", "_blank", "width=1100,height=850");
  if (!win) return;

  win.document.open();
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Stock Research Report - ${symbol}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            font-size: 10px;
            line-height: 1.28;
          }

          .report {
            width: 100%;
            max-width: 190mm;
            margin: 0 auto;
          }

          .header {
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 5px;
            margin-bottom: 7px;
          }

          .title {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 2px;
          }

          .subTitle {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 2px;
          }

          .smallMuted {
            font-size: 9px;
            color: #64748b;
          }

          .metaGrid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            margin-bottom: 7px;
          }

          .metaBox {
            border: 1px solid #dbe4f0;
            border-radius: 6px;
            padding: 5px 7px;
            background: #f8fbff;
            min-height: 40px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .metaLabel {
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #64748b;
            font-weight: 700;
            margin-bottom: 2px;
          }

          .metaValue {
            font-size: 10.5px;
            font-weight: 700;
            color: #0f172a;
          }

          .section {
            margin-bottom: 7px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .sectionTitle {
            font-size: 10px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 4px;
            border-bottom: 1px solid #dbe4f0;
            padding-bottom: 2px;
          }

          .description {
            border: 1px solid #dbe4f0;
            border-radius: 6px;
            padding: 6px 7px;
            background: #fcfdff;
            font-size: 9.3px;
            line-height: 1.28;
            text-align: justify;
          }

          .contentGrid {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 7px;
            align-items: start;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          th, td {
            border: 1px solid #dbe4f0;
            padding: 3px 5px;
            vertical-align: top;
            word-wrap: break-word;
          }

          th {
            background: #eef4ff;
            color: #0f172a;
            font-size: 9.3px;
            text-align: left;
          }

          td {
            font-size: 9px;
          }

          .scoreBox {
            border: 1px solid #cfe0ff;
            background: #eff6ff;
            border-radius: 8px;
            padding: 7px;
            margin-bottom: 7px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .scoreLabel {
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #64748b;
            font-weight: 700;
          }

          .scoreValue {
            font-size: 22px;
            line-height: 1;
            font-weight: 800;
            color: #0f172a;
            margin: 4px 0 3px;
          }

          .scoreText {
            font-size: 9px;
            color: #1f2937;
            line-height: 1.28;
          }

          .forensicGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-bottom: 7px;
          }

          .forensicMiniCard {
            border: 1px solid #dbe4f0;
            border-radius: 6px;
            padding: 6px 7px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .forensicMiniCard h4 {
            margin: 0 0 3px;
            font-size: 8.8px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #475569;
          }

          .forensicMiniCard p {
            margin: 0;
            font-size: 8.9px;
            line-height: 1.25;
          }

          .forensicMiniCard.green {
            background: #ecfdf5;
            border-color: #bfe8d8;
          }

          .forensicMiniCard.amber {
            background: #fffbeb;
            border-color: #f2dcc5;
          }

          .miniGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 7px;
          }

          .listCard {
            border: 1px solid #dbe4f0;
            border-radius: 6px;
            padding: 6px 7px;
            background: #ffffff;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .listCard.positive {
            background: #ecfdf5;
            border-color: #bfe8d8;
          }

          .listCard.negative {
            background: #fffbeb;
            border-color: #f2dcc5;
          }

          .listTitle {
            font-size: 9px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          ul {
            margin: 0;
            padding-left: 14px;
          }

          li {
            margin: 0 0 3px 0;
            font-size: 8.8px;
            line-height: 1.25;
          }

          .footerNote {
            margin-top: 5px;
            font-size: 8px;
            color: #64748b;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <div class="title">Stock Research Report</div>
            <div class="subTitle">${symbol} - ${companyName}</div>
            <div class="smallMuted">Generated from Market Dashboard</div>
          </div>

          <div class="metaGrid">
            <div class="metaBox">
              <div class="metaLabel">Sector</div>
              <div class="metaValue">${sector}</div>
            </div>
            <div class="metaBox">
              <div class="metaLabel">Industry</div>
              <div class="metaValue">${industry}</div>
            </div>
            <div class="metaBox">
              <div class="metaLabel">CMP</div>
              <div class="metaValue">${formatNumber(research?.overview?.cmp)}</div>
            </div>
            <div class="metaBox">
              <div class="metaLabel">Overall Score</div>
              <div class="metaValue">${overallScore ?? "-"}/100</div>
            </div>
          </div>

          <div class="section">
            <div class="sectionTitle">Business Profile</div>
            <div class="description">${fullDescription}</div>
          </div>

          <div class="contentGrid">
            <div class="section">
              <div class="sectionTitle">Compact Metrics</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 62%;">Metric</th>
                    <th style="width: 38%;">Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>

            <div>
              <div class="section">
                <div class="sectionTitle">Forensic Highlights</div>
                <div class="forensicGrid">
                  <div class="forensicMiniCard green">
                    <h4>Cash Flow</h4>
                    <p>${cashFlowComment}</p>
                  </div>
                  <div class="forensicMiniCard green">
                    <h4>Leverage</h4>
                    <p>${leverageComment}</p>
                  </div>
                  <div class="forensicMiniCard amber">
                    <h4>Margins</h4>
                    <p>${marginsComment}</p>
                  </div>
                  <div class="forensicMiniCard green">
                    <h4>Working Capital</h4>
                    <p>${workingCapitalComment}</p>
                  </div>
                </div>
              </div>

              <div class="scoreBox">
                <div class="scoreLabel">Brokerage View</div>
                <div class="scoreValue">${overallScore ?? "-"}</div>
                <div class="scoreText">${overallView}</div>
              </div>

              <div class="miniGrid">
                <div class="listCard positive">
                  <div class="listTitle">Positive</div>
                  <ul>${positivesHtml}</ul>
                </div>

                <div class="listCard negative">
                  <div class="listTitle">Negative</div>
                  <ul>${negativesHtml}</ul>
                </div>
              </div>
            </div>
          </div>

          <div class="footerNote">
            ${symbol} • Generated on ${new Date().toLocaleString()}
          </div>
        </div>
      </body>
    </html>
  `);

  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
};

  const change = research?.overview?.change;
  const changePercent = research?.overview?.changePercent;
  const changeColor = change > 0 ? theme.green : change < 0 ? theme.red : theme.muted;

  const technicalScore = research?.technical?.trendScore ?? null;
  const financialScore = calculateFinancialScore(research?.financial);
  const forensicScore = research?.forensic?.score ?? null;
  const overallScore =
    research?.overallScore ??
    calculateOverallScore(technicalScore, financialScore, forensicScore);

  const positivePoints = buildPositivePoints(research, technicalScore, financialScore);
  const negativePoints = buildNegativePoints(research, technicalScore, forensicScore);

  const renderMetricBox = (label, value, color = theme.title) => (
    <div style={styles.metricBox}>
      <span style={styles.metricLabel}>{label}</span>
      <span style={{ ...styles.metricValue, color }}>{value}</span>
    </div>
  );

  return (
    <div style={styles.pageWrap}>
      <div style={styles.pageTitle}>Stock Research</div>

      <div style={styles.topRow}>
        <div style={styles.searchWrap}>
          <StockSearchBox onSelect={handleSelect} />
        </div>

        {research?.overview?.cmp != null &&
          renderMetricBox("CMP", formatNumber(research.overview.cmp), theme.green)}

        {change != null &&
          renderMetricBox("Change", formatNumber(change), changeColor)}

        {changePercent != null &&
          renderMetricBox("Change %", formatPercent(changePercent), changeColor)}

        {research?.symbol && (
          <>
            <a
              href={`https://www.tradingview.com/symbols/NSE-${research.symbol}/`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkBtn}
            >
              TradingView
            </a>

            <a
              href={`https://finance.yahoo.com/quote/${research.symbol}.NS`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkBtn}
            >
              Yahoo Finance
            </a>

            <button onClick={handlePrint} style={styles.linkBtn}>
              Print / Save PDF
            </button>
          </>
        )}
      </div>

      {selectedStock && (
        <div style={styles.selectedText}>
          Selected: <strong>{selectedStock.symbol}</strong>
          {selectedStock.name ? ` - ${selectedStock.name}` : ""}
        </div>
      )}

      {loading && (
        <div style={styles.sectionCard}>
          <div style={{ color: theme.muted, fontWeight: 600 }}>
            Loading research...
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            ...styles.sectionCard,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {research && (
        <>
          <div style={styles.identityGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Company Name</div>
              <div style={styles.infoValue}>{research?.company?.name ?? "-"}</div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Sector</div>
              <div style={styles.infoValue}>{research?.company?.sector ?? "-"}</div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Industry</div>
              <div style={styles.infoValue}>{research?.company?.industry ?? "-"}</div>
            </div>
          </div>

          <div style={styles.businessCard}>
            <div style={styles.infoLabel}>Business Profile</div>
            <div style={styles.businessBody}>
              {research?.company?.description ?? "No business description available."}
            </div>
          </div>

          <div ref={printRef}>
            <div className="cards-grid" style={styles.cardsGrid}>
              <div style={styles.cardCell}>
                <TechnicalCard
                  technical={research?.technical}
                  overview={research?.overview}
                  research={research}
                />
              </div>

              <div style={styles.cardCell}>
                <FinancialCard
                  financial={research?.financial}
                  forensic={research?.forensic}
                  research={research}
                />
              </div>

              <div style={styles.cardCell}>
                <ForensicCard
                  forensic={research?.forensic}
                  financial={research?.financial}
                  research={research}
                />
              </div>
            </div>

            <div className="summary-row" style={styles.summaryRow}>
              <div style={styles.sectionCard}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: theme.title, marginBottom: "10px" }}>
                  Brokerage View
                </div>

                <div style={{ color: theme.text, lineHeight: 1.7, fontSize: "14px" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Price trend:</strong>{" "}
                    {(technicalScore ?? 0) >= 60
                      ? "The stock is showing reasonably supportive price action."
                      : (technicalScore ?? 0) >= 40
                      ? "The stock is mixed on trend and momentum."
                      : "The stock is not showing strong momentum right now."}
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <strong>Financial health:</strong>{" "}
                    {(financialScore ?? 0) >= 70
                      ? "The financial profile appears fairly solid."
                      : (financialScore ?? 0) >= 40
                      ? "The financial profile is average and needs selective review."
                      : "The financial profile looks weak and needs caution."}
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <strong>Forensic checks:</strong>{" "}
                    {(forensicScore ?? 0) >= 70
                      ? "Cash flow and balance-sheet quality look comfortable."
                      : (forensicScore ?? 0) >= 40
                      ? "Cash flow and balance-sheet quality look acceptable, but a few areas need monitoring."
                      : "This stock shows multiple accounting or operating areas that need caution."}
                  </div>

                  <div>
                    <strong>Overall view:</strong>{" "}
                    {(overallScore ?? 0) >= 70
                      ? "The stock looks fairly strong across key areas and may deserve deeper research or gradual accumulation."
                      : (overallScore ?? 0) >= 40
                      ? "The stock has some strengths, but overall conviction is still moderate. It looks better suited for watchlist tracking or selective holding than a strong buy right now."
                      : "The stock does not look strong enough right now for a high-conviction view. It may be better to wait for improvement in trend or business quality."}
                  </div>
                </div>
              </div>

              <div style={styles.sectionCard}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: theme.title, marginBottom: "10px" }}>
                  Scoring
                </div>

                <div style={{ color: theme.text, fontSize: "14px", lineHeight: 1.8 }}>
                  <div>Technical: {technicalScore ?? "-"}/100</div>
                  <div>Financial: {financialScore ?? "-"}/100</div>
                  <div>Forensic: {forensicScore ?? "-"}/100</div>
                  <div>
                    <strong>Overall: {overallScore ?? "-"}/100</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="summary-grid" style={styles.summaryGrid}>
              <div style={styles.positiveCard}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: theme.green, marginBottom: "10px" }}>
                  Positive
                </div>
                <ul style={{ color: theme.text, margin: 0, paddingLeft: "18px" }}>
                  {positivePoints.map((point, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={styles.negativeCard}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: theme.amber, marginBottom: "10px" }}>
                  Negative
                </div>
                <ul style={{ color: theme.text, margin: 0, paddingLeft: "18px" }}>
                  {negativePoints.map((point, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={styles.overallCard}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: theme.blue, marginBottom: "10px" }}>
                  Overall
                </div>
                <div style={{ color: theme.text, lineHeight: 1.7 }}>
                  {(overallScore ?? 0) >= 70
                    ? "The stock looks fairly balanced across price trend, financial quality, and forensic checks."
                    : (overallScore ?? 0) >= 40
                    ? "The stock has mixed signals. Some areas look acceptable, but overall strength is still moderate."
                    : "The stock does not look strong enough right now for a high-conviction view. It may be better to wait for improvement in trend or business quality."}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}