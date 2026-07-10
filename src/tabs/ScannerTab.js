import React, { useMemo, useState, useEffect } from "react";
import ProfessionalTable from "../components/ProfessionalTable";
import {
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Typography,
  Paper,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useSheetRange from "../hooks/useSheetRange";

function ScannerTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const openLow = useSheetRange("Copy", "B4:E19");
  const openHigh = useSheetRange("Copy", "G4:J19");

  const btst = useSheetRange("Copy", "B23:E38");
  const stbt = useSheetRange("Copy", "G23:J38");

  const sma20_50_bullish = useSheetRange("Copy", "B42:F52");
  const sma20_50_bearish = useSheetRange("Copy", "G42:K52");
  const sma50_200_bullish = useSheetRange("Copy", "L42:P52");
  const sma50_200_bearish = useSheetRange("Copy", "Q42:U52");

  const darkCloud = useSheetRange("Copy", "B62:E82");
  const piercing = useSheetRange("Copy", "G62:J82");
  const bullishEngulfing = useSheetRange("Copy", "L62:O82");
  const bearishEngulfing = useSheetRange("Copy", "P62:S82");

  const high52W = useSheetRange("Copy", "B88:F108");
  const low52W = useSheetRange("Copy", "G88:K108");

  const scannerConfig = useMemo(
    () => ({
      highLow: {
        label: "High/Low",
        children: {
          openLow: { label: "Open Low", data: openLow },
          openHigh: { label: "Open High", data: openHigh },
        },
      },
      btstStbt: {
        label: "BTST/STBT",
        children: {
          btst: { label: "BTST", data: btst },
          stbt: { label: "STBT", data: stbt },
        },
      },
      week52: {
        label: "52W High/Low",
        children: {
          high52W: { label: "52W High", data: high52W },
          low52W: { label: "52W Low", data: low52W },
        },
      },
      crossovers: {
        label: "Crossovers",
        children: {
          sma20_50_bullish: { label: "20/50 Bullish", data: sma20_50_bullish },
          sma20_50_bearish: { label: "20/50 Bearish", data: sma20_50_bearish },
          sma50_200_bullish: { label: "50/200 Bullish", data: sma50_200_bullish },
          sma50_200_bearish: { label: "50/200 Bearish", data: sma50_200_bearish },
        },
      },
      candlesticks: {
        label: "Candlesticks",
        children: {
          darkCloud: { label: "Dark Cloud", data: darkCloud },
          piercing: { label: "Piercing", data: piercing },
          bullishEngulfing: { label: "Bullish Engulfing", data: bullishEngulfing },
          bearishEngulfing: { label: "Bearish Engulfing", data: bearishEngulfing },
        },
      },
    }),
    [
      openLow,
      openHigh,
      btst,
      stbt,
      high52W,
      low52W,
      sma20_50_bullish,
      sma20_50_bearish,
      sma50_200_bullish,
      sma50_200_bearish,
      darkCloud,
      piercing,
      bullishEngulfing,
      bearishEngulfing,
    ]
  );

  const parentKeys = Object.keys(scannerConfig);
  const [parentTab, setParentTab] = useState(parentKeys[0]);
  const [childTabMap, setChildTabMap] = useState({
    highLow: "openLow",
    btstStbt: "btst",
    week52: "high52W",
    crossovers: "sma20_50_bullish",
    candlesticks: "darkCloud",
  });

  const activeParent = scannerConfig[parentTab];
  const childKeys = Object.keys(activeParent.children);

  useEffect(() => {
    if (!childTabMap[parentTab] || !activeParent.children[childTabMap[parentTab]]) {
      setChildTabMap((prev) => ({
        ...prev,
        [parentTab]: childKeys[0],
      }));
    }
  }, [parentTab, activeParent, childKeys, childTabMap]);

  const activeChildKey =
    childTabMap[parentTab] && activeParent.children[childTabMap[parentTab]]
      ? childTabMap[parentTab]
      : childKeys[0];

  const activeChild = activeParent.children[activeChildKey];

  const parentOptions = parentKeys.map((key) => ({
    value: key,
    label: scannerConfig[key].label,
  }));

  const childOptions = childKeys.map((key) => ({
    value: key,
    label: activeParent.children[key].label,
  }));

  const handleParentChange = (_, newParent) => {
    setParentTab(newParent);
  };

  const handleChildChange = (_, newChild) => {
    setChildTabMap((prev) => ({
      ...prev,
      [parentTab]: newChild,
    }));
  };

  const renderLoading = () => (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress />
    </Box>
  );

  const renderTableCard = (title, rawData) => {
    if (!rawData) return renderLoading();

    const headers = rawData[0] || [];
    const rows = rawData.slice(1);

    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 2,
          border: "1px solid #dbe3ee",
          backgroundColor: "#fff",
          overflowX: "auto",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 1.5,
            fontWeight: 700,
            fontSize: { xs: 16, md: 18 },
            color: "#0f172a",
          }}
        >
          {title}
        </Typography>
        <ProfessionalTable headers={headers} rows={rows} />
      </Paper>
    );
  };

  return (
    <Box sx={{ mt: 1, minWidth: 0 }}>
      <Tabs
        value={parentTab}
        onChange={handleParentChange}
        variant="standard"
        textColor="primary"
        indicatorColor="primary"
        sx={{
          mb: 1.5,
          minHeight: 40,
          "& .MuiTabs-flexContainer": {
            flexWrap: isMobile ? "wrap" : "nowrap",
            gap: isMobile ? 1 : 2,
          },
          "& .MuiTab-root": {
            minHeight: isMobile ? 38 : 40,
            minWidth: "auto",
            px: isMobile ? 1.25 : 1.75,
            py: 0.75,
            fontSize: isMobile ? 12.5 : 14,
            fontWeight: 700,
            textTransform: "none",
            color: "#4b5563",
            borderRadius: "10px",
            alignItems: "center",
          },
          "& .Mui-selected": {
            color: "#1f6fb2",
          },
        }}
      >
        {parentOptions.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>

      <Tabs
        value={activeChildKey}
        onChange={handleChildChange}
        variant="standard"
        textColor="primary"
        indicatorColor="primary"
        sx={{
          mb: 2,
          minHeight: 36,
          "& .MuiTabs-flexContainer": {
            flexWrap: isMobile ? "wrap" : "nowrap",
            gap: isMobile ? 1 : 2,
          },
          "& .MuiTab-root": {
            minHeight: isMobile ? 36 : 36,
            minWidth: "auto",
            px: isMobile ? 1.15 : 1.5,
            py: 0.65,
            fontSize: isMobile ? 12 : 13,
            fontWeight: 700,
            textTransform: "none",
            color: "#4b5563",
            borderRadius: "10px",
          },
          "& .Mui-selected": {
            color: "#1f6fb2",
          },
        }}
      >
        {childOptions.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>

      {renderTableCard(activeChild.label, activeChild.data)}
    </Box>
  );
}

export default ScannerTab;