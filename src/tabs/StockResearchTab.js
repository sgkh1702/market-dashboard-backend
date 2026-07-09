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
  const values = [... technicalScore, financialScore, forensicScore]
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
    const rawDescription =
      research?.company?.description || "No business description available.";
    const shortDescription =
      rawDescription.length > 420
        ? `${rawDescription.slice(0, 420)}...`
        : rawDescription;

    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const win = window.open("", "_blank", "width=1400,height=900");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Stock Research Report - ${symbol}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 landscape; margin: 5mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body { margin: 0; padding: 0; background: #ffffff; color: #111827; font-family: Arial, Helvetica, sans-serif; }
            body { overflow: hidden; }
            .print-scale-wrap { width: 100%; transform: scale(0.74); transform-origin: top left; }
            .print-page { width: 135%; padding: 0; }
            .report-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 2px; line-height: 1.1; }
            .report-subtitle { font-size: 13px; color: #475569; margin-bottom: 4px; line-height: 1.2; }
            .report-meta { font-size: 10px; color: #64748b; margin-bottom: 6px; }
            .top-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px; }
            .info-card, .business-card { border: 1px solid #dbe4f0; border-radius: 10px; background: #ffffff; break-inside: avoid; page-break-inside: avoid; }
            .info-card { padding: 8px 10px; min-height: 48px; }
            .label { font-size: 8px; color: #64748b; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 3px; text-transform: uppercase; }
            .value { font-size: 12px; color: #0f172a; font-weight: 700; line-height: 1.15; }
            .business-card { padding: 8px 10px; margin-bottom: 6px; }
            .business-text { font-size: 10px; line-height: 1.25; color: #1f2937; max-height: 38px; overflow: hidden; }
            .cards-grid, .summary-row, .summary-grid { gap: 6px !important; margin-bottom: 6px !important; }
            .cards-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; }
            .summary-row { display: grid; grid-template-columns: 1fr 220px; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; }
            .cards-grid > div, .summary-row > div, .summary-grid > div { break-inside: avoid; page-break-inside: avoid; }
            .print-root * { page-break-inside: avoid; }
            .print-root .forensic-extra, .print-root .verify-block, .print-root .yahoo-verify { display: none !important; }
          </style>
        </head>
        <body>
          <div class="print-scale-wrap">
            <div class="print-page print-root">
              <div class="report-title">Stock Research Report</div>
              <div class="report-subtitle">${symbol} - ${companyName}</div>
              <div class="report-meta">Generated from Market Dashboard</div>

              <div class="top-mini-grid">
                <div class="info-card">
                  <div class="label">Sector</div>
                  <div class="value">${sector}</div>
                </div>
                <div class="info-card">
                  <div class="label">Industry</div>
                  <div class="value">${industry}</div>
                </div>
              </div>

              <div class="business-card">
                <div class="label">Business Profile</div>
                <div class="business-text">${shortDescription}</div>
              </div>

              ${printContents}
            </div>
          </div>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
      win.close();
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