import React from "react";

const theme = {
  cardBg: "linear-gradient(180deg, #ffffff 0%, #f7fcfa 100%)",
  cardBorder: "#cbd5e1",
  title: "#0f172a",
  text: "#111827",
  muted: "#475569",
  value: "#064e3b",
  blue: "#1d4ed8",
  blueSoft: "#eff6ff",
  green: "#047857",
  greenSoft: "#ecfdf5",
  amber: "#b45309",
  amberSoft: "#fffbeb",
  red: "#b91c1c",
  redSoft: "#fef2f2",
  shadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
  radius: "16px",
};

function getNum(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(n) ? n : null;
}

function fmt(value, digits = 2, suffix = "") {
  const n = getNum(value);
  return n !== null ? `${n.toFixed(digits)}${suffix}` : "-";
}

function normalizeDebtToEquity(value) {
  const n = getNum(value);
  if (n === null) return null;
  return n > 10 ? n / 100 : n;
}

function scoreColor(score) {
  const n = Number(score);
  if (isNaN(n)) return theme.muted;
  if (n >= 70) return theme.green;
  if (n >= 40) return theme.amber;
  return theme.red;
}

function calculateFinancialScore(financial) {
  if (!financial) return null;

  let score = 0;

  const pe = getNum(financial.pe);
  const roe = getNum(financial.roe);
  const roce = getNum(financial.roce);
  const debtToEquity = normalizeDebtToEquity(financial.debtToEquity);
  const salesGrowthYoY = getNum(financial.salesGrowthYoY);
  const netMargin = getNum(financial.netMargin);
  const operatingMargin = getNum(financial.operatingMargin);

  if (pe !== null) {
    if (pe > 0 && pe <= 25) score += 15;
    else if (pe <= 40) score += 10;
    else score += 5;
  }

  if (roe !== null) {
    if (roe >= 15) score += 15;
    else if (roe >= 10) score += 10;
    else if (roe >= 5) score += 5;
  }

  if (roce !== null) {
    if (roce >= 15) score += 15;
    else if (roce >= 10) score += 10;
    else if (roce >= 5) score += 5;
  }

  if (debtToEquity !== null) {
    if (debtToEquity <= 0.5) score += 15;
    else if (debtToEquity <= 1) score += 10;
    else score += 5;
  }

  if (salesGrowthYoY !== null) {
    if (salesGrowthYoY >= 15) score += 15;
    else if (salesGrowthYoY >= 8) score += 10;
    else if (salesGrowthYoY > 0) score += 5;
  }

  if (netMargin !== null) {
    if (netMargin >= 12) score += 10;
    else if (netMargin >= 8) score += 7;
    else if (netMargin >= 5) score += 4;
  }

  if (operatingMargin !== null) {
    if (operatingMargin >= 15) score += 15;
    else if (operatingMargin >= 10) score += 10;
    else if (operatingMargin >= 5) score += 5;
  }

  return Math.min(100, score);
}

function tone(type, value) {
  const num = getNum(value);

  const green = { color: theme.green, bg: theme.greenSoft };
  const amber = { color: theme.amber, bg: theme.amberSoft };
  const red = { color: theme.red, bg: theme.redSoft };
  const neutral = { color: theme.value, bg: "#f8fafc" };
  const softWarn = { color: "#c2410c", bg: "#ffedd5" };

  if (type === "roeRoce") {
    if (num === null) return neutral;
    if (num >= 15) return green;
    if (num >= 10) return amber;
    return red;
  }

  if (type === "de") {
    const d = normalizeDebtToEquity(value);
    if (d === null) return neutral;
    if (d <= 0.5) return green;
    if (d <= 1.5) return amber;
    return red;
  }

  if (type === "growth") {
    if (num === null) return neutral;
    if (num > 15) return green;
    if (num >= 0) return amber;
    return red;
  }

  if (type === "currentRatio") {
    if (num === null) return neutral;
    if (num >= 1.5 && num <= 3) return green;
    if (num >= 1) return amber;
    return red;
  }

  if (type === "margin") {
    if (num === null) return neutral;
    if (num >= 20) return green;
    if (num >= 10) return amber;
    return red;
  }

  if (type === "cfoPat") {
    if (num === null) return neutral;
    if (num >= 1) return green;
    if (num >= 0.75) return amber;
    return red;
  }

  if (type === "lowerBetter") {
    if (num === null) return neutral;
    if (num <= 45) return green;
    if (num <= 75) return amber;
    return red;
  }

  if (type === "pe") {
    if (num === null) return neutral;
    if (num < 15) return green;
    if (num <= 30) return amber;
    if (num <= 50) return softWarn;
    return red;
  }

  if (type === "pb") {
    if (num === null) return neutral;
    if (num <= 3) return neutral;
    if (num <= 6) return amber;
    return red;
  }

  return neutral;
}

function metricRow(label, value, valueStyle = {}, last = false) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        padding: "10px 0",
        borderBottom: last ? "none" : `1px solid ${theme.cardBorder}`,
      }}
    >
      <span style={{ fontSize: "13px", color: theme.muted, fontWeight: 700 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: theme.value,
          ...valueStyle,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function FinancialCard({ financial, forensic }) {
  const financialScore = calculateFinancialScore(financial);

  const peTone = tone("pe", financial?.pe);
  const pbTone = tone("pb", financial?.pb);
  const roeTone = tone("roeRoce", financial?.roe);
  const roceTone = tone("roeRoce", financial?.roce);
  const deTone = tone("de", financial?.debtToEquity);
  const salesTone = tone("growth", financial?.salesGrowthYoY);
  const crTone = tone("currentRatio", financial?.currentRatio);
  const netMarginTone = tone("margin", financial?.netMargin);
  const opmTone = tone("margin", financial?.operatingMargin);
  const cfoPatTone = tone("cfoPat", forensic?.cfoPat);
  const recvTone = tone("lowerBetter", forensic?.recvDaysCurrent);
  const invTone = tone("lowerBetter", forensic?.invDaysCurrent);

  const normalizedDE = normalizeDebtToEquity(financial?.debtToEquity);

  return (
    <div
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: theme.radius,
        padding: "16px",
        boxShadow: theme.shadow,
        minHeight: "380px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              marginBottom: "4px",
              color: theme.title,
              fontSize: "22px",
              fontWeight: 800,
            }}
          >
            Financial
          </h3>
          <div style={{ fontSize: "12px", color: theme.muted, fontWeight: 600 }}>
            Quality and valuation snapshot
          </div>
        </div>

        <div
          style={{
            minWidth: "82px",
            textAlign: "center",
            borderRadius: "12px",
            padding: "8px 10px",
            background: theme.blueSoft,
            border: "1px solid #c7dbff",
          }}
        >
          <div style={{ fontSize: "12px", color: theme.muted, fontWeight: 700 }}>
            Score
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "20px",
              fontWeight: 800,
              color: scoreColor(financialScore),
            }}
          >
            {financialScore ?? "-"}
          </div>
        </div>
      </div>

      <div>
        {metricRow("P/E", fmt(financial?.pe), { color: peTone.color })}
        {metricRow("P/B", fmt(financial?.pb), { color: pbTone.color })}
        {metricRow("ROE", fmt(financial?.roe, 2, "%"), { color: roeTone.color })}
        {metricRow("ROCE", fmt(financial?.roce, 2, "%"), { color: roceTone.color })}
        {metricRow(
          "Debt / Equity",
          normalizedDE !== null ? normalizedDE.toFixed(2) : "-",
          { color: deTone.color }
        )}
        {metricRow("Sales Growth YoY", fmt(financial?.salesGrowthYoY, 2, "%"), {
          color: salesTone.color,
        })}
        {metricRow("Current Ratio", fmt(financial?.currentRatio), {
          color: crTone.color,
        })}
        {metricRow("Net Margin", fmt(financial?.netMargin, 2, "%"), {
          color: netMarginTone.color,
        })}
        {metricRow("Operating Margin", fmt(financial?.operatingMargin, 2, "%"), {
          color: opmTone.color,
        })}
        {metricRow("CFO / PAT", fmt(forensic?.cfoPat), {
          color: cfoPatTone.color,
        })}
        {metricRow("Receivable Days", fmt(forensic?.recvDaysCurrent), {
          color: recvTone.color,
        })}
        {metricRow(
          "Inventory Days",
          fmt(forensic?.invDaysCurrent),
          { color: invTone.color },
          true
        )}
      </div>
    </div>
  );
}