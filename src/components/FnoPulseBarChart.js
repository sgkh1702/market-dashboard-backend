import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  Cell,
} from "recharts";
import { Paper, Typography, Box } from "@mui/material";

const buildupColors = {
  "Long Buildup": "#2e7d32",
  "Short Buildup": "#c62828",
  "Short Covering": "#f9a825",
  "Long Unwinding": "#1565c0",
};

const legendItems = [
  { label: "Long Buildup", type: "bar", color: "#2e7d32" },
  { label: "Short Buildup", type: "bar", color: "#c62828" },
  { label: "Short Covering", type: "bar", color: "#f9a825" },
  { label: "Long Unwinding", type: "bar", color: "#1565c0" },
  { label: "Max CE Strike", type: "line", color: "#d32f2f" },
  { label: "Max PE Strike", type: "line", color: "#2e7d32" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload || {};

  return (
    <Paper sx={{ p: 1.5, border: "1px solid #ddd" }}>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2">Buildup: {row.buildup || "-"}</Typography>
      <Typography variant="body2">
        Open Interest: {row.oi?.toLocaleString?.("en-IN") || row.oi || 0}
      </Typography>
      <Typography variant="body2">
        Max CE Strike: {row.max_ce_strike ?? "-"}
      </Typography>
      <Typography variant="body2">
        Max PE Strike: {row.max_pe_strike ?? "-"}
      </Typography>
    </Paper>
  );
};

function LegendIcon({ type, color }) {
  if (type === "line") {
    return (
      <Box
        sx={{
          width: 18,
          height: 0,
          borderTop: `3px solid ${color}`,
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: color,
            position: "absolute",
            top: -4,
            left: 6,
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 14,
        height: 14,
        borderRadius: "3px",
        backgroundColor: color,
      }}
    />
  );
}

function CustomLegend() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 3,
        flexWrap: "wrap",
        mb: 1.5,
      }}
    >
      {legendItems.map((item) => (
        <Box
          key={item.label}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <LegendIcon type={item.type} color={item.color} />
          <Typography variant="body2">{item.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function getSharedStrikeDomain(values) {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return [0, 100];

  const min = Math.min(...nums);
  const max = Math.max(...nums);

  if (min === max) {
    const buffer = Math.max(10, Math.round(min * 0.02));
    return [min - buffer, max + buffer];
  }

  const range = max - min;
  const buffer = Math.max(10, Math.round(range * 0.15));
  return [min - buffer, max + buffer];
}

export default function FnoPulseBarChart({ rows = [], symbol = "" }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Paper
        sx={{
          height: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
        }}
      >
        No chart data available
      </Paper>
    );
  }

  const chartData = rows.map((r) => ({
    date: r.date,
    oi: Number(r.oi) || 0,
    buildup: r.buildup || "",
    max_ce_strike: Number(r.max_ce_strike) || 0,
    max_pe_strike: Number(r.max_pe_strike) || 0,
    barColor: buildupColors[r.buildup] || "#9e9e9e",
  }));

  const strikeDomain = getSharedStrikeDomain([
    ...chartData.map((d) => d.max_ce_strike),
    ...chartData.map((d) => d.max_pe_strike),
  ]);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: 700, textAlign: "center" }}
      >
        {symbol
          ? `${symbol} - OI Buildup & Max Strike Chart`
          : "OI Buildup & Max Strike Chart"}
      </Typography>

      <CustomLegend />

      <Box sx={{ width: "100%", height: 420 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" angle={-30} textAnchor="end" height={70} />

            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={(value) => value.toLocaleString("en-IN")}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              domain={strikeDomain}
              tickFormatter={(value) => `${value}`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Bar
              yAxisId="left"
              dataKey="oi"
              name="Open Interest"
              barSize={28}
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.barColor} />
              ))}
            </Bar>

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="max_ce_strike"
              name="Max CE Strike"
              stroke="#d32f2f"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="max_pe_strike"
              name="Max PE Strike"
              stroke="#2e7d32"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}