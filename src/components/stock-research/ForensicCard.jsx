import React from "react";

const theme = {
  cardBg: "linear-gradient(180deg, #ffffff 0%, #f7f5ff 100%)",
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

function gradeMeaning(grade) {
  const g = String(grade || "").toUpperCase();
  if (g === "A") return "Excellent";
  if (g === "B") return "Good";
  if (g === "C") return "Average";
  if (g === "D") return "Weak / caution";
  if (g === "E") return "Poor";
  return "-";
}

function getTileTone(kind) {
  if (kind === "good") return { bg: theme.greenSoft, color: theme.green, border: "#bfe8d8" };
  if (kind === "warn") return { bg: theme.amberSoft, color: theme.amber, border: "#f2dcc5" };
  return { bg: theme.redSoft, color: theme.red, border: "#f4c7c7" };
}

function getCashFlowRemark(cfoPat) {
  const n = Number(cfoPat);
  if (Number.isNaN(n)) return { tone: "warn", text: "Cash-flow support is not clearly available." };
  if (n >= 1) return { tone: "good", text: "Profit is well supported by operating cash flow." };
  if (n >= 0.8) return { tone: "warn", text: "Cash conversion is acceptable but needs monitoring." };
  return { tone: "bad", text: "Profit is not strongly backed by operating cash flow." };
}

function getLeverageRemark(debtEquity) {
  const n = Number(debtEquity);
  if (Number.isNaN(n)) return { tone: "warn", text: "Debt position is not fully available." };
  const d = n > 10 ? n / 100 : n;
  if (d <= 0.5) return { tone: "good", text: "Debt levels look comfortable." };
  if (d <= 1) return { tone: "warn", text: "Debt is manageable but should be watched." };
  return { tone: "bad", text: "Debt looks elevated and needs deeper review." };
}

function getMarginRemark(opmCurrent) {
  const n = Number(opmCurrent);
  if (Number.isNaN(n)) return { tone: "warn", text: "Margin trend is not clearly available." };
  if (n >= 15) return { tone: "good", text: "Operating margin looks healthy." };
  if (n >= 8) return { tone: "warn", text: "Margins are moderate and need tracking." };
  return { tone: "bad", text: "Operating margin looks weak." };
}

function getWorkingCapitalRemark(recvDaysCurrent, invDaysCurrent) {
  const recv = Number(recvDaysCurrent);
  const inv = Number(invDaysCurrent);

  if (Number.isNaN(recv) && Number.isNaN(inv)) {
    return { tone: "warn", text: "Working-capital cycle is not fully available." };
  }

  if ((!Number.isNaN(recv) && recv <= 60) && (!Number.isNaN(inv) && inv <= 90)) {
    return { tone: "good", text: "Collections look healthy and inventory is manageable." };
  }

  if ((!Number.isNaN(recv) && recv <= 90) && (!Number.isNaN(inv) && inv <= 140)) {
    return { tone: "warn", text: "Working-capital cycle is acceptable but needs watching." };
  }

  return { tone: "bad", text: "Collections or inventory cycle may be stretched." };
}

function buildOverallSentence(forensic) {
  const cash = getCashFlowRemark(forensic?.cfoPat);
  const lev = getLeverageRemark(forensic?.debtEquity);
  const mar = getMarginRemark(forensic?.opmCurrent);
  const wc = getWorkingCapitalRemark(forensic?.recvDaysCurrent, forensic?.invDaysCurrent);

  const badCount = [cash, lev, mar, wc].filter((x) => x.tone === "bad").length;
  const warnCount = [cash, lev, mar, wc].filter((x) => x.tone === "warn").length;

  if (badCount >= 2) return "This stock shows multiple accounting or operating areas that need caution.";
  if (badCount === 1 || warnCount >= 2) return "The forensic picture is mixed: some parts are fine, but a few areas need monitoring.";
  return "The forensic picture looks fairly comfortable on the main checks.";
}

function infoTile(title, remark) {
  const tone = getTileTone(remark.tone);

  return (
    <div
      style={{
        padding: "11px",
        borderRadius: "10px",
        border: `1px solid ${tone.border}`,
        background: tone.bg,
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: tone.color,
          marginBottom: "5px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "13px",
          lineHeight: "1.55",
          color: theme.text,
          fontWeight: 600,
        }}
      >
        {remark.text}
      </div>
    </div>
  );
}

export default function ForensicCard({ forensic = {} }) {
  const score = forensic?.score ?? "-";
  const grade = forensic?.grade ?? "-";

  const cash = getCashFlowRemark(forensic?.cfoPat);
  const lev = getLeverageRemark(forensic?.debtEquity);
  const mar = getMarginRemark(forensic?.opmCurrent);
  const wc = getWorkingCapitalRemark(forensic?.recvDaysCurrent, forensic?.invDaysCurrent);

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
              fontWeight: 700,
            }}
          >
            Forensic
          </h3>
          <div style={{ fontSize: "12px", color: theme.muted, fontWeight: 600 }}>
            Plain-language quality checks
          </div>
        </div>

        <div
          style={{
            padding: "8px 10px",
            borderRadius: "12px",
            background: theme.purpleSoft,
            border: "1px solid #ddd6fe",
            textAlign: "right",
            minWidth: "110px",
          }}
        >
          <div style={{ fontSize: "12px", color: theme.muted, fontWeight: 700 }}>
            Score
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: theme.title,
              marginTop: "4px",
            }}
          >
            {score}
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: theme.muted,
              fontWeight: 600,
            }}
          >
            Grade {grade} | {gradeMeaning(grade)}
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom: "12px",
          padding: "11px",
          borderRadius: "10px",
          background: "#ffffff",
          border: `1px solid ${theme.cardBorder}`,
          color: theme.text,
          fontSize: "13px",
          lineHeight: "1.6",
          fontWeight: 600,
        }}
      >
        {buildOverallSentence(forensic)}
      </div>

      <div style={{ display: "grid", gap: "9px", marginBottom: "12px" }}>
        {infoTile("Cash Flow", cash)}
        {infoTile("Leverage", lev)}
        {infoTile("Margins", mar)}
        {infoTile("Working Capital", wc)}
      </div>

      <div
        style={{
          padding: "11px",
          borderRadius: "10px",
          background: "#ffffff",
          border: `1px dashed ${theme.cardBorder}`,
          fontSize: "12px",
          lineHeight: "1.65",
          color: theme.muted,
          fontWeight: 600,
        }}
      >
        <div style={{ color: theme.title, fontWeight: 700, marginBottom: "5px" }}>
          Verify on Yahoo Finance
        </div>
        <div>Cash Flow: open the Cash Flow tab and compare operating cash flow with net income.</div>
        <div>Leverage: open Balance Sheet and check total debt against shareholders’ equity.</div>
        <div>Margins: open Financials and compare operating income with revenue.</div>
        <div>Working Capital: open Balance Sheet and review receivables and inventory trends.</div>
      </div>
    </div>
  );
}