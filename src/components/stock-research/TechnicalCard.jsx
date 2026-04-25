import React from "react";

const theme = {
  cardBg: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)",
  cardBorder: "#cbd5e1",
  title: "#0f172a",
  text: "#111827",
  muted: "#475569",
  value: "#1e3a8a",
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

function tone(type, value, extra = {}) {
  const num = getNum(value);
  const cmp = getNum(extra.cmp);

  const green = { color: theme.green, bg: theme.greenSoft, border: "#b7e4d3" };
  const amber = { color: theme.amber, bg: theme.amberSoft, border: "#f1d8b5" };
  const red = { color: theme.red, bg: theme.redSoft, border: "#f3c7c7" };
  const neutral = { color: theme.value, bg: "#f8fafc", border: "#dbe4f0" };

  if (type === "score") {
    if (num === null) return neutral;
    if (num >= 70) return green;
    if (num >= 40) return amber;
    return red;
  }

  if (type === "rsi") {
    if (num === null) return neutral;
    if (num >= 60) return green;
    if (num >= 40) return amber;
    return red;
  }

  if (type === "cmpVsLevel") {
    if (num === null || cmp === null) return neutral;
    return cmp > num ? green : red;
  }

  if (type === "trend") {
    const v = String(value || "").toLowerCase();
    if (v.includes("bull") || v.includes("strong") || v.includes("up")) return green;
    if (v.includes("bear") || v.includes("weak") || v.includes("down")) return red;
    return amber;
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
      <span
        style={{
          fontSize: "13px",
          color: theme.muted,
          fontWeight: 700,
          lineHeight: "1.4",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "15px",
          fontWeight: 800,
          color: theme.value,
          lineHeight: "1.4",
          ...valueStyle,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function TechnicalCard({ technical, overview }) {
  const technicalScore = technical?.trendScore ?? null;
  const trend = technical?.trendLabel || technical?.trend || "-";

  const cmp =
    overview?.cmp ??
    overview?.ltp ??
    overview?.price ??
    technical?.cmp ??
    technical?.ltp;

  const high52 =
    overview?.week52High ??
    overview?.high52Week ??
    overview?.fiftyTwoWeekHigh ??
    technical?.week52High ??
    technical?.high52Week ??
    technical?.fiftyTwoWeekHigh;

  const low52 =
    overview?.week52Low ??
    overview?.low52Week ??
    overview?.fiftyTwoWeekLow ??
    technical?.week52Low ??
    technical?.low52Week ??
    technical?.fiftyTwoWeekLow;

  const scoreTone = tone("score", technicalScore);
  const trendTone = tone("trend", trend);
  const rsiTone = tone("rsi", technical?.rsi14);
  const sma20Tone = tone("cmpVsLevel", technical?.sma20, { cmp });
  const sma50Tone = tone("cmpVsLevel", technical?.sma50, { cmp });
  const sma200Tone = tone("cmpVsLevel", technical?.sma200, { cmp });

  return (
    <div
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: theme.radius,
        padding: "16px",
        boxShadow: theme.shadow,
        minHeight: "360px",
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
              fontSize: "20px",
              fontWeight: 800,
            }}
          >
            Technical
          </h3>
          <div
            style={{
              fontSize: "12px",
              color: theme.muted,
              fontWeight: 600,
              lineHeight: "1.4",
            }}
          >
            Price trend and momentum view
          </div>
        </div>

        <div
          style={{
            minWidth: "78px",
            textAlign: "center",
            borderRadius: "12px",
            padding: "8px 10px",
            background: scoreTone.bg,
            border: `1px solid ${scoreTone.border}`,
          }}
        >
          <div style={{ fontSize: "11px", color: theme.muted, fontWeight: 700 }}>
            Score
          </div>
          <div
            style={{
              marginTop: "3px",
              fontSize: "18px",
              fontWeight: 800,
              color: scoreTone.color,
            }}
          >
            {technicalScore ?? "-"}
          </div>
        </div>
      </div>

      <div>
        {metricRow(
          "Trend",
          trend,
          {
            color: trendTone.color,
            background: trendTone.bg,
            border: `1px solid ${trendTone.border}`,
            padding: "4px 10px",
            borderRadius: "999px",
            display: "inline-block",
            fontSize: "13px",
            fontWeight: 800,
          }
        )}

        {metricRow("RSI 14", fmt(technical?.rsi14), {
          color: rsiTone.color,
          fontWeight: 800,
        })}

        {metricRow("SMA 20", fmt(technical?.sma20), {
          color: sma20Tone.color,
          fontWeight: 800,
        })}

        {metricRow("SMA 50", fmt(technical?.sma50), {
          color: sma50Tone.color,
          fontWeight: 800,
        })}

        {metricRow("SMA 200", fmt(technical?.sma200), {
          color: sma200Tone.color,
          fontWeight: 800,
        })}

        {metricRow("52W High", fmt(high52))}
        {metricRow("52W Low", fmt(low52), {}, true)}
      </div>
    </div>
  );
}