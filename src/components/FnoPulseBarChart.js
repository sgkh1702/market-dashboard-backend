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
  { label: "LTP", type: "line", color: "#424242" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload || {};

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: "1px solid #dbe5f0",
        minWidth: 180,
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 0.75 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13, mb: 0.25 }}>
        Buildup: <strong>{row.buildup || "-"}</strong>
      </Typography>
      <Typography sx={{ fontSize: 13, mb: 0.25 }}>
        Open Interest:{" "}
        <strong>{row.oi?.toLocaleString?.("en-IN") || row.oi || 0}</strong>
      </Typography>
      <Typography sx={{ fontSize: 13, mb: 0.25 }}>
        Max CE Strike: <strong>{row.max_ce_strike ?? "-"}</strong>
      </Typography>
      <Typography sx={{ fontSize: 13, mb: 0.25 }}>
        Max PE Strike: <strong>{row.max_pe_strike ?? "-"}</strong>
      </Typography>
      <Typography sx={{ fontSize: 13 }}>
        LTP: <strong>{row.ltp ?? "-"}</strong>
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
          height: 2,
          backgroundColor: color,
          borderRadius: 999,
          mr: 0.75,
          mt: "8px",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: 14,
        height: 14,
        backgroundColor: color,
        borderRadius: 0.75,
        mr: 0.75,
        flexShrink: 0,
      }}
    />
  );
}

function CustomLegend() {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.25,
        mt: 1.25,
        mb: 0.25,
      }}
    >
      {legendItems.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: "flex",
            alignItems: "center",
            fontSize: 12,
            color: "#475569",
            fontWeight: 600,
          }}
        >
          <LegendIcon type={item.type} color={item.color} />
          <span>{item.label}</span>
        </Box>
      ))}
    </Box>
  );
}

function getSharedPriceDomain(values) {
  const nums = values.filter((v) => Number.isFinite(v) && v > 0);
  if (!nums.length) return [0, 100];

  const min = Math.min(...nums);
  const max = Math.max(...nums);

  if (min === max) {
    const buffer = Math.max(10, Math.round(min * 0.02));
    return [Math.max(0, min - buffer), max + buffer];
  }

  const range = max - min;
  const buffer = Math.max(10, Math.round(range * 0.15));
  return [Math.max(0, min - buffer), max + buffer];
}

export default function FnoPulseBarChart({
  rows = [],
  data = [],
  symbol = "",
}) {
  const sourceRows =
    Array.isArray(rows) && rows.length > 0
      ? rows
      : Array.isArray(data)
      ? data
      : [];

  if (!Array.isArray(sourceRows) || sourceRows.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px solid #dde6f0",
          background: "#fafcff",
        }}
      >
        <Typography sx={{ fontWeight: 700, color: "#64748b" }}>
          No chart data available
        </Typography>
      </Paper>
    );
  }

  const chartData = sourceRows.map((r) => ({
    date: r.date,
    oi: Number(r.oi) || 0,
    buildup: r.buildup || "",
    max_ce_strike: Number(r.max_ce_strike) || 0,
    max_pe_strike: Number(r.max_pe_strike) || 0,
    ltp: Number(r.ltp) || 0,
    barColor: buildupColors[r.buildup] || "#9e9e9e",
  }));

  const priceDomain = getSharedPriceDomain([
    ...chartData.map((d) => d.max_ce_strike),
    ...chartData.map((d) => d.max_pe_strike),
    ...chartData.map((d) => d.ltp),
  ]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: "1px solid #dde6f0",
        background: "#ffffff",
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: { xs: 13, sm: 15, md: 16 },
          color: "#1e3a5f",
          mb: 1,
        }}
      >
        {symbol
          ? `${symbol} - OI Buildup, Max Strike & LTP Chart`
          : "OI Buildup, Max Strike & LTP Chart"}
      </Typography>

      <Box
        sx={{
          width: "100%",
          height: { xs: 250, sm: 280, md: 340 },
          minWidth: { xs: 320, sm: 420, md: 520 },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 6 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              angle={-20}
              textAnchor="end"
              height={50}
            />

            <YAxis
              yAxisId="oi"
              orientation="left"
              tick={{ fontSize: 11 }}
              width={55}
              tickFormatter={(value) => value.toLocaleString("en-IN")}
            />

            <YAxis
              yAxisId="price"
              orientation="right"
              domain={priceDomain}
              tick={{ fontSize: 11 }}
              width={42}
              tickFormatter={(value) => `${value}`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Bar yAxisId="oi" dataKey="oi" radius={[5, 5, 0, 0]} maxBarSize={26}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.barColor} />
              ))}
            </Bar>

            <Line
              yAxisId="price"
              type="monotone"
              dataKey="max_ce_strike"
              stroke="#d32f2f"
              strokeWidth={2}
              dot={{ r: 1.8 }}
              activeDot={{ r: 4 }}
            />

            <Line
              yAxisId="price"
              type="monotone"
              dataKey="max_pe_strike"
              stroke="#2e7d32"
              strokeWidth={2}
              dot={{ r: 1.8 }}
              activeDot={{ r: 4 }}
            />

            <Line
              yAxisId="price"
              type="monotone"
              dataKey="ltp"
              stroke="#424242"
              strokeWidth={2}
              dot={{ r: 1.8 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      <CustomLegend />
    </Paper>
  );
}