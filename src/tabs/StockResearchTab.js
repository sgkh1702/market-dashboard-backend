import React, { useState } from "react";
import StockSearchBox from "../components/stock-research/StockSearchBox";
import TechnicalCard from "../components/stock-research/TechnicalCard";
import FinancialCard from "../components/stock-research/FinancialCard";
import ForensicCard from "../components/stock-research/ForensicCard";
import { fetchStockResearch } from "../services/stockApi";

const theme = {
  bg: "linear-gradient(180deg, #f8fafc 0%, #eef4fb 100%)",
  cardBg: "#ffffff",
  cardBorder: "#cbd5e1",
  title: "#0f172a",
  text: "#111827",
  muted: "#4b5563",

  blue: "#1d4ed8",
  blueSoft: "#eff6ff",

  green: "#047857",
  greenSoft: "#ecfdf5",

  amber: "#b45309",
  amberSoft: "#fffbeb",

  red: "#b91c1c",
  redSoft: "#fef2f2",

  purple: "#6d28d9",
  purpleSoft: "#f5f3ff",

  shadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
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
    fontWeight: 800,
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
    height: "44px",
    boxShadow: theme.shadow,
    flexShrink: 0,
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
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  metricValue: {
    fontSize: "15px",
    fontWeight: 800,
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
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  infoValue: {
    fontSize: "16px",
    color: theme.title,
    fontWeight: 700,
    lineHeight: "1.45",
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
    fontSize: "15px",
    lineHeight: "1.8",
    color: theme.text,
    maxHeight: "110px",
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
    border: "1px solid #bbebd8",
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
    border: "1px solid #c7dbff",
    borderRadius: theme.radius,
    padding: "16px",
    boxShadow: theme.shadow,
    minWidth: 0,
  },
};

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
    const normalizedDebtToEquity =
      debtToEquity > 10 ? debtToEquity / 100 : debtToEquity;
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

  const change = research?.overview?.change;
  const changePercent = research?.overview?.changePercent;

  const changeColor =
    change > 0 ? theme.green : change < 0 ? theme.red : theme.muted;

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

  const renderMetricBox = (label, value, color = theme.title) => (
    <div style={styles.metricBox}>
      <span style={styles.metricLabel}>{label}</span>
      <span style={{ ...styles.metricValue, color }}>{value}</span>
    </div>
  );

  return (
    <div className="stock-research-tab" style={styles.pageWrap}>
      <h2 style={styles.pageTitle}>Stock Research</h2>

      <div style={styles.topRow}>
        <div style={styles.searchWrap}>
          <StockSearchBox onSelect={handleSelect} />
        </div>

        {research && (
          <>
            {renderMetricBox(
              "CMP",
              research?.overview?.cmp != null ? research.overview.cmp.toFixed(2) : "-",
              changeColor
            )}

            {renderMetricBox(
              "Change",
              change != null ? change.toFixed(2) : "-",
              changeColor
            )}

            {renderMetricBox(
              "Change %",
              changePercent != null ? `${changePercent.toFixed(2)}%` : "-",
              changeColor
            )}

            <a
              href={`https://in.tradingview.com/symbols/NSE-${research.symbol}/`}
              target="_blank"
              rel="noreferrer"
              style={styles.linkBtn}
            >
              TradingView
            </a>

            <a
              href={`https://finance.yahoo.com/quote/${research.symbol}.NS/`}
              target="_blank"
              rel="noreferrer"
              style={styles.linkBtn}
            >
              Yahoo Finance
            </a>

            <a
              href={`https://www.screener.in/company/${research.symbol}/`}
              target="_blank"
              rel="noreferrer"
              style={styles.linkBtn}
            >
              Screener
            </a>
          </>
        )}
      </div>

      {selectedStock && !loading && (
        <p style={styles.selectedText}>
          Selected: <strong>{selectedStock.symbol}</strong>
          {selectedStock.name ? ` - ${selectedStock.name}` : ""}
        </p>
      )}

      {loading && <p style={{ fontSize: "15px", fontWeight: 600, color: theme.text }}>Loading research...</p>}
      {error && (
        <p style={{ color: theme.red, fontSize: "15px", fontWeight: 600 }}>
          {error}
        </p>
      )}

      {research && (
        <div className="stock-research-layout" style={{ minWidth: 0 }}>
          <div style={styles.identityGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Company Name</div>
              <div style={styles.infoValue}>{research.company?.name || "-"}</div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Sector</div>
              <div style={styles.infoValue}>{research.company?.sector || "-"}</div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Industry</div>
              <div style={styles.infoValue}>{research.company?.industry || "-"}</div>
            </div>
          </div>

          <div style={styles.businessCard}>
            <h3 style={{ marginTop: 0, marginBottom: "10px", color: theme.title, fontSize: "20px", fontWeight: 800 }}>
              Business Profile
            </h3>
            <div style={styles.businessBody}>
              {research.company?.businessProfile ||
                research.company?.description ||
                "Business profile not available."}
            </div>
          </div>

          <div style={styles.cardsGrid}>
            <div style={styles.cardCell}>
              <TechnicalCard technical={research.technical} overview={research.overview} />
            </div>

            <div style={styles.cardCell}>
              <FinancialCard financial={research.financial} forensic={research.forensic} />
            </div>

            <div style={styles.cardCell}>
              <ForensicCard forensic={research.forensic} />
            </div>
          </div>

          <div style={styles.summaryRow}>
            <div style={styles.sectionCard}>
              <h3 style={{ marginTop: 0, marginBottom: "10px", color: theme.title, fontSize: "20px", fontWeight: 800 }}>
                Brokerage View
              </h3>

              <div style={{ fontSize: "15px", lineHeight: "1.8", color: theme.text, fontWeight: 500 }}>
                <div style={{ marginBottom: "8px" }}>
                  <strong style={{ fontWeight: 800, color: theme.title }}>Price trend:</strong>{" "}
                  {(technicalScore ?? 0) >= 70
                    ? "The stock is showing strong upward momentum."
                    : (technicalScore ?? 0) >= 40
                    ? "The stock is moving in a mixed range and momentum is moderate."
                    : "The stock is not showing strong momentum right now."}
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <strong style={{ fontWeight: 800, color: theme.title }}>Financial health:</strong>{" "}
                  {(financialScore ?? 0) >= 70
                    ? "The business looks financially strong with decent quality and reasonable valuation."
                    : (financialScore ?? 0) >= 40
                    ? "The business looks reasonably healthy, though not outstanding."
                    : "The financial profile looks weak and needs caution."}
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <strong style={{ fontWeight: 800, color: theme.title }}>Forensic checks:</strong>{" "}
                  {(forensicScore ?? 0) >= 70
                    ? "Cash flow, balance sheet, and operating quality look comfortable."
                    : (forensicScore ?? 0) >= 40
                    ? "Cash flow and balance-sheet quality look acceptable, but a few areas need monitoring."
                    : "Some accounting or operating-quality signals need caution."}
                </div>

                <div>
                  <strong style={{ fontWeight: 800, color: theme.title }}>Overall view:</strong>{" "}
                  {(overallScore ?? 0) >= 70
                    ? "This looks like a stronger candidate for deeper research or gradual accumulation."
                    : (overallScore ?? 0) >= 40
                    ? "This looks more like a hold or watchlist stock for now than a strong buy."
                    : "This does not look strong enough right now for a high-conviction view."}
                </div>
              </div>
            </div>

            <div style={styles.sectionCard}>
              <h3 style={{ marginTop: 0, marginBottom: "10px", color: theme.title, fontSize: "20px", fontWeight: 800 }}>
                Scoring
              </h3>

              <div
                style={{
                  fontSize: "14px",
                  lineHeight: "1.9",
                  color: theme.text,
                  fontWeight: 700,
                  background: theme.blueSoft,
                  border: "1px solid #c7dbff",
                  borderRadius: "12px",
                  padding: "13px 15px",
                }}
              >
                <div>Technical: {technicalScore ?? "-"}/100</div>
                <div>Financial: {financialScore ?? "-"}/100</div>
                <div>Forensic: {forensicScore ?? "-"}/100</div>
                <div>Overall: {overallScore ?? "-"}/100</div>
              </div>
            </div>
          </div>

          <div style={styles.summaryGrid}>
            <div style={styles.positiveCard}>
              <h3 style={{ marginTop: 0, marginBottom: "8px", color: theme.green, fontSize: "20px", fontWeight: 800 }}>
                Positive
              </h3>
              <ul style={{ paddingLeft: "18px", marginBottom: 0, fontSize: "14px", lineHeight: "1.8", color: theme.text, fontWeight: 500 }}>
                {positivePoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>

            <div style={styles.negativeCard}>
              <h3 style={{ marginTop: 0, marginBottom: "8px", color: theme.amber, fontSize: "20px", fontWeight: 800 }}>
                Negative
              </h3>
              <ul style={{ paddingLeft: "18px", marginBottom: 0, fontSize: "14px", lineHeight: "1.8", color: theme.text, fontWeight: 500 }}>
                {negativePoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>

            <div style={styles.overallCard}>
              <h3 style={{ marginTop: 0, marginBottom: "8px", color: theme.blue, fontSize: "20px", fontWeight: 800 }}>
                Overall
              </h3>
              <p style={{ marginBottom: 0, fontSize: "14px", lineHeight: "1.8", color: theme.text, fontWeight: 500 }}>
                {(overallScore ?? 0) >= 70
                  ? "The stock looks fairly strong across key areas and may deserve deeper research or gradual accumulation."
                  : (overallScore ?? 0) >= 40
                  ? "The stock has some strengths, but overall conviction is still moderate. It looks better suited for watchlist tracking or selective holding than a strong buy right now."
                  : "The stock does not look strong enough right now for a high-conviction view. It may be better to wait for improvement in trend or business quality."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
