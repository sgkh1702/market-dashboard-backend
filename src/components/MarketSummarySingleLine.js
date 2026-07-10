import React from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(String(value).replace(/,/g, ""));
  return Number.isNaN(num) ? String(value) : num.toFixed(2);
}

function getChangeColor(change) {
  const num = parseFloat(String(change).replace(/,/g, ""));
  if (Number.isNaN(num)) return "#111827";
  if (num > 0) return "#0b8f2f";
  if (num < 0) return "#e11d1d";
  return "#111827";
}

function MarketSummarySingleLine({
  nifty,
  banknifty,
  sensex,
  indiavix,
  usdinr,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const blocks = [
    { label: "Nifty", data: nifty },
    { label: "BankNifty", data: banknifty },
    { label: "Sensex", data: sensex },
    { label: "IndiaVIX", data: indiavix },
    { label: "USDINR", data: usdinr },
  ].filter((item) => item.data && item.data.length >= 3);

  return (
    <Box
      sx={{
        width: "100%",
        overflowX: isMobile ? "auto" : "visible",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        border: "1px solid #dbe3ee",
        borderRadius: 2,
        backgroundColor: "#fff",
        px: isMobile ? 1 : 1.5,
        py: isMobile ? 1 : 1.25,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "center",
          gap: isMobile ? 1.5 : 2,
          minWidth: isMobile ? "max-content" : "100%",
          justifyContent: isMobile ? "flex-start" : "space-between",
        }}
      >
        {blocks.map(({ label, data }) => {
          const value = formatValue(data[1]);
          const change = formatValue(data[2]);
          const changeColor = getChangeColor(change);

          return (
            <Box
              key={label}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                flex: isMobile ? "0 0 auto" : "1 1 0",
                minWidth: isMobile ? "max-content" : 0,
                pr: isMobile ? 0.5 : 1,
                borderRight: "1px solid #e5e7eb",
                "&:last-of-type": {
                  borderRight: "none",
                  pr: 0,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 800,
                  color: "#111827",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Typography>

              <Typography
                sx={{
                  fontSize: isMobile ? 17 : 18,
                  fontWeight: 800,
                  color: changeColor,
                  whiteSpace: "nowrap",
                }}
              >
                {value}
              </Typography>

              <Typography
                sx={{
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 700,
                  color: changeColor,
                  whiteSpace: "nowrap",
                }}
              >
                {change}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default MarketSummarySingleLine;