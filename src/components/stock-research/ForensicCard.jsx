import React from "react";

const theme = {
  cardBg: "linear-gradient(180deg, #ffffff 0%, #faf7ff 100%)",
  cardBorder: "#cbd5e1",
  title: "#0f172a",
  text: "#111827",
  muted: "#475569",
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

function gradeMeaning(grade) {
  const g = String(grade || "").toUpperCase();
  if (g === "A") return "Excellent";
  if (g === "B") return "Good";
  if (g === "C") return "Average";
  if (g === "D") return "Weak / caution";
  if (g === "E") return "Poor";
  return "-";
}

function scoreColor(score) {
  const n = Number(score);
  if (Number.isNaN(n)) return theme.muted;
  if (n >= 70) return theme.green;
  if (n >= 40) return theme.amber;
  return theme.red;
}

function calculateForensicScore(forensic) {
  if (!forensic) return null;

  let score = 0;

  const cfoPat = getNum(forensic.cfoPat);
  const debtEquity = normalizeDebtToEquity(forensic.debtEquity);
  const opmCurrent = getNum(forensic.opmCurrent);
  const recvDaysCurrent = getNum(forensic.recvDaysCurrent);
  const invDaysCurrent = getNum(forensic.invDaysCurrent);
  const pledgePct = getNum(forensic.pledgePct);

  if (cfoPat !== null) {
    if (cfoPat >= 1) score += 25;
    else if (cfoPat >= 0.8) score += 15;
    else score += 5;
  }

  if (debtEquity !== null) {
    if (debtEquity <= 0.5) score += 20;
    else if (debtEquity <= 1) score += 12;
    else score += 5;
  }

  if (opmCurrent !== null) {
    if (opmCurrent >= 15) score += 20;
    else if (opmCurrent >= 8) score += 12;
    else score += 5;
  }

  if (recvDaysCurrent !== null) {
    if (recvDaysCurrent <= 60) score += 15;
    else if (recvDaysCurrent <= 90) score += 8;
    else score += 3;
  }

  if (invDaysCurrent !== null) {
    if (invDaysCurrent <= 90) score += 15;
    else if (invDaysCurrent <= 140) score += 8;
    else score += 3;
  }

  if (pledgePct !== null) {
    if (pledgePct === 0) score += 5;
    else if (pledgePct <= 10) score += 3;
    else score += 0;
  }

  return Math.min(100, score);
}

function getTileTone(kind) {
  if (kind === "good") {
    return { bg: theme.greenSoft, color: theme.green, border: "#b7e4d3" };
  }
  if (kind === "warn") {
    return { bg: theme.amberSoft, color: theme.amber, border: "#f1d8b5" };
  }
  return { bg: theme.redSoft, color: theme.red, border: "#f1c3c3" };
}

function getCashFlowRemark(cfoPat) {
  const n = getNum(cfoPat);
  if (n === null) {
    return { tone: "warn", text: "Cash-flow support is not clearly available." };
  }
  if (n >= 1) {
    return { tone: "good", text: "Profit is well supported by operating cash flow." };
  }
  if (n >= 0.8) {
    return { tone: "warn", text: "Cash conversion is acceptable but needs monitoring." };
  }
  return { tone: "bad", text: "Profit is not strongly backed by operating cash flow." };
}

function getLeverageRemark(debtEquity) {
  const d = normalizeDebtToEquity(debtEquity);
  if (d === null) {
    return { tone: "warn", text: "Debt position is not fully available." };
  }
  if (d <= 0.5) {
    return { tone: "good", text: "Debt levels look comfortable." };
  }
  if (d <= 1) {
    return { tone: "warn", text: "Debt is manageable but should be watched." };
  }
  return { tone: "bad", text: "Debt looks elevated and needs deeper review." };
}

function getMarginRemark(opmCurrent) {
  const n = getNum(opmCurrent);
  if (n === null) {
    return { tone: "warn", text: "Margin trend is not clearly available." };
  }
  if (n >= 15) {
    return { tone: "good", text: "Operating margin looks healthy." };
  }
  if (n >= 8) {
    return { tone: "warn", text: "Margins are moderate and need tracking." };
  }
  return { tone: "bad", text: "Operating margin looks weak." };
}

function getWorkingCapitalRemark(recvDaysCurrent, invDaysCurrent) {
  const recv = getNum(recvDaysCurrent);
  const inv = getNum(invDaysCurrent);

  if (recv === null && inv === null) {
    return { tone: "warn", text: "Working-capital cycle is not fully available." };
  }

  if ((recv === null || recv <= 60) && (inv === null || inv <= 90)) {
    return { tone: "good", text: "Collections look healthy and inventory is manageable." };
  }

  if ((recv === null || recv <= 90) && (inv === null || inv <= 140)) {
    return { tone: "warn", text: "Working-capital cycle is acceptable but needs watching." };
  }

  return { tone: "bad", text: "Collections or inventory cycle may be stretched." };
}

function getPledgeRemark(pledgePct) {
  const n = getNum(pledgePct);
  if (n === null) {
    return { tone: "warn", text: "Promoter pledge data is not available." };
  }
  if (n === 0) {
    return { tone: "good", text: "No promoter pledge is visible." };
  }
  if (n <= 10) {
    return { tone: "warn", text: "Promoter pledge is present but not very high." };
  }
  return { tone: "bad", text: "Promoter pledge looks elevated and needs caution." };
}

function buildOverallSentence(forensic) {
  const cash = getCashFlowRemark(forensic?.cfoPat);
  const lev = getLeverageRemark(forensic?.debtEquity);
  const mar = getMarginRemark(forensic?.opmCurrent);
  const wc = getWorkingCapitalRemark(
    forensic?.recvDaysCurrent,
    forensic?.invDaysCurrent
  );
  const pledge = getPledgeRemark(forensic?.pledgePct);

  const checks = [cash, lev, mar, wc, pledge];
  const badCount = checks.filter((x) => x.tone === "bad").length;
  const warnCount = checks.filter((x) => x.tone === "warn").length;

  if (badCount >= 2) {
    return "This stock shows multiple accounting or operating areas that need caution.";
  }
  if (badCount === 1 || warnCount >= 2) {
    return "The forensic picture is mixed: some parts are fine, but a few areas need monitoring.";
  }
  return "The forensic picture looks fairly comfortable on the main checks.";
}

function infoTile(title, remark) {
  const tone = getTileTone(remark.tone);

  return (
    <div
      style={{
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: "14px",
        padding: "12px 12px",
        minHeight: "92px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 800,
          color: theme.muted,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "13px",
          lineHeight: "1.5",
          fontWeight: 700,
          color: tone.color,
        }}
      >
        {remark.text}
      </div>
    </div>
  );
}

function metricRow(label, value, last = false) {
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
      <span style={{ fontSize: "16px", fontWeight: 700, color: theme.title }}>
        {value}
      </span>
    </div>
  );
}

export default function ForensicCard({ forensic, research }) {
  const forensicData = forensic || research?.forensic || {};

  const score =
    forensicData?.score ?? calculateForensicScore(forensicData);

  const grade = forensicData?.grade || "-";

  const cashRemark = getCashFlowRemark(forensicData?.cfoPat);
  const leverageRemark = getLeverageRemark(forensicData?.debtEquity);
  const marginRemark = getMarginRemark(forensicData?.opmCurrent);
  const wcRemark = getWorkingCapitalRemark(
    forensicData?.recvDaysCurrent,
    forensicData?.invDaysCurrent
  );
  const pledgeRemark = getPledgeRemark(forensicData?.pledgePct);
  const overallSentence = buildOverallSentence(forensicData);

  const normalizedDE = normalizeDebtToEquity(forensicData?.debtEquity);

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
            Forensic
          </h3>
          <div style={{ fontSize: "12px", color: theme.muted, fontWeight: 600 }}>
            Accounting quality and operating discipline
          </div>
        </div>

        <div
          style={{
            minWidth: "88px",
            textAlign: "center",
            borderRadius: "12px",
            padding: "8px 10px",
            background: theme.purpleSoft,
            border: "1px solid #ddd6fe",
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
              color: scoreColor(score),
            }}
          >
            {score ?? "-"}
          </div>
          <div
            style={{
              marginTop: "2px",
              fontSize: "11px",
              fontWeight: 800,
              color: theme.purple,
              letterSpacing: "0.03em",
            }}
          >
            {grade} · {gradeMeaning(grade)}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#fafafa",
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: "14px",
          padding: "12px 14px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            lineHeight: "1.6",
            color: theme.text,
            fontWeight: 600,
          }}
        >
          {overallSentence}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        {infoTile("Cash Flow", cashRemark)}
        {infoTile("Leverage", leverageRemark)}
        {infoTile("Margins", marginRemark)}
        {infoTile("Working Capital", wcRemark)}
      </div>

      <div
        style={{
          background: "#ffffff",
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: "14px",
          padding: "0 12px",
        }}
      >
        {metricRow("CFO / PAT", fmt(forensicData?.cfoPat))}
        {metricRow(
          "Debt / Equity",
          normalizedDE !== null ? normalizedDE.toFixed(2) : "-"
        )}
        {metricRow("Operating Margin", fmt(forensicData?.opmCurrent, 2, "%"))}
        {metricRow("Receivable Days", fmt(forensicData?.recvDaysCurrent))}
        {metricRow("Inventory Days", fmt(forensicData?.invDaysCurrent))}
        {metricRow("Pledge %", fmt(forensicData?.pledgePct, 2, "%"), true)}
      </div>

      <div style={{ marginTop: "12px" }}>
        {infoTile("Promoter Pledge", pledgeRemark)}
      </div>
    </div>
  );
}