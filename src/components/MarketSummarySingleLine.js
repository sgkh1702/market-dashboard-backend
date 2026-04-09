import { Box, Typography } from "@mui/material";

function MarketSummarySingleLine({ nifty, banknifty, sensex, indiavix, usdinr }) {
  const blocks = [
    { label: "Nifty", data: nifty },
    { label: "Bank Nifty", data: banknifty },
    { label: "Sensex", data: sensex },
    { label: "IndiaVIX", data: indiavix },
    { label: "USDINR", data: usdinr }
  ];

  return (
    <Box sx={{
      display: "flex",
      alignItems: "center",
      gap: 5,
      flexWrap: "wrap",
      justifyContent: "center"
    }}>
      {blocks.map(({ label, data }, idx) => {
        if (!data || data.length < 3) return null;
        const value = Number(data[1]) ? Number(data[1]).toFixed(2) : data[1];
        const change = Number(data[2]) ? Number(data[2]).toFixed(2) : data[2];
        const changeNum = parseFloat(change);
        const changeColor = changeNum > 0 ? "green" : changeNum < 0 ? "red" : "black";
        return (
          <Box
            key={idx}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.7,
              minWidth: 140,
              justifyContent: "center"
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                whiteSpace: "nowrap",
                fontSize: "1.08rem",
                fontWeight: 700,
                color: "#222",
                mr: 0.3
              }}>
              {label}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: changeColor,
                fontSize: "1.18rem",
                mr: 0.3
              }}>
              {value}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: changeColor,
                fontWeight: 700,
                fontSize: "1.03rem",
                letterSpacing: 0.2
              }}>
              {change}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default MarketSummarySingleLine;
