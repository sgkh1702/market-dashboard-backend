import React, { useState } from "react";
import ProfessionalTable from "../components/ProfessionalTable";
import { Box, Tabs, Tab, CircularProgress } from "@mui/material";
import useSheetRange from "../hooks/useSheetRange";

function ScannerTab() {
  const [scannerSubTab, setScannerSubTab] = useState(0);

  return (
    <Box sx={{ width: "100%", my: 2 }}>
      <Box sx={{ pl: 16 }}>
        <Tabs
          value={scannerSubTab}
          onChange={(e, val) => setScannerSubTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            '& .MuiTab-root': {
              fontSize: 20,
              fontWeight: 700
            }
          }}
        >
          <Tab label="High / Low" />
          <Tab label="BTST / STBT" />
          <Tab label="52 Week High / Low" />
          <Tab label="Crossovers" />
          <Tab label="Candlestick Patterns" />
        </Tabs>
      </Box>

      {scannerSubTab === 0 && <ScannerSubTabHighLow />}
      {scannerSubTab === 1 && <ScannerSubTabBtstStbt />}
      {scannerSubTab === 2 && <ScannerSubTab52WHighLow />}
      {scannerSubTab === 3 && <ScannerSubTabCrossovers />}
      {scannerSubTab === 4 && <ScannerSubTabCandlestick />}
    </Box>
  );
}

function ScannerSubTabHighLow() {
  const openLow = useSheetRange("Copy", "B4:E19");
  const openHigh = useSheetRange("Copy", "G4:J19");
  if (!openLow || !openHigh) return <CircularProgress />;
  return (
    <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
      <Box
        sx={{
          display: "inline-flex",
          gap: 3,
          alignItems: "flex-start"
        }}
      >
        <ProfessionalTable
          title="Open = Low"
          headers={openLow[0]}
          rows={openLow.slice(1)}
          tableType="high-low"
        />
        <ProfessionalTable
          title="Open = High"
          headers={openHigh[0]}
          rows={openHigh.slice(1)}
          tableType="high-low"
        />
      </Box>
    </Box>
  );
}


function ScannerSubTabBtstStbt() {
  const btst = useSheetRange("Copy", "B23:E38");
  const stbt = useSheetRange("Copy", "G23:J38");
  if (!btst || !stbt) return <CircularProgress />;
  return (
    <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
      <Box
        sx={{
          display: "inline-flex",
          gap: 3,
          alignItems: "flex-start"
        }}
      >
        <ProfessionalTable
          title="BTST - Closing Near High"
          headers={btst[0]}
          rows={btst.slice(1)}
          tableType="btst-stbt"
        />
        <ProfessionalTable
          title="STBT - Closing Near Low"
          headers={stbt[0]}
          rows={stbt.slice(1)}
          tableType="btst-stbt"
        />
      </Box>
    </Box>
  );
}

function ScannerSubTab52WHighLow() {
  const high52W = useSheetRange("Copy", "B88:F108");
  const low52W = useSheetRange("Copy", "G88:K108");
  if (!high52W || !low52W) return <CircularProgress />;
  return (
    <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
      <Box
        sx={{
          display: "inline-flex",
          gap: 3,
          alignItems: "flex-start"
        }}
      >
        <ProfessionalTable
          title="Stocks Near 52 Week Low"
          headers={high52W[0]}
          rows={high52W.slice(1)}
          tableType="52week-high-low"
        />
        <ProfessionalTable
          title="Stocks Near 52 Week High"
          headers={low52W[0]}
          rows={low52W.slice(1)}
          tableType="52week-high-low"
        />
      </Box>
    </Box>
  );
}


function ScannerSubTab52WHighLowv2() {
  const high52W = useSheetRange("Copy", "B88:F108");
  const low52W = useSheetRange("Copy", "G88:K108");
  if (!high52W || !low52W) return <CircularProgress />;
  return (
    <Box sx={{ display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap" }}>
      <ProfessionalTable
        title="Stocks Near 52 Week Low"
        headers={high52W[0]}
        rows={high52W.slice(1)}
        tableType="52week-high-low"
      />
      <ProfessionalTable
        title="Stocks Near 52 Week High"
        headers={low52W[0]}
        rows={low52W.slice(1)}
        tableType="52week-high-low"
      />
    </Box>
  );
}

function ScannerSubTabCrossovers() {
  const sma20_50_bullish = useSheetRange("Copy", "B42:F52");
  const sma20_50_bearish = useSheetRange("Copy", "G42:K52");
  const sma50_200_bullish = useSheetRange("Copy", "L42:P52");
  const sma50_200_bearish = useSheetRange("Copy", "Q42:U52");
  if (!sma20_50_bullish || !sma20_50_bearish || !sma50_200_bullish || !sma50_200_bearish) return <CircularProgress />;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 3,
        alignItems: "flex-start",
        justifyItems: "center"
      }}
    >
      <ProfessionalTable
        title="20/50 SMA Crossover Bullish"
        headers={sma20_50_bullish[0]}
        rows={sma20_50_bullish.slice(1)}
        tableType="sma-crossover"
      />
      <ProfessionalTable
        title="50/200 SMA Crossover Bullish"
        headers={sma50_200_bullish[0]}
        rows={sma50_200_bullish.slice(1)}
        tableType="sma-crossover"
      />
      <ProfessionalTable
        title="20/50 SMA Crossover Bearish"
        headers={sma20_50_bearish[0]}
        rows={sma20_50_bearish.slice(1)}
        tableType="sma-crossover"
      />
      <ProfessionalTable
        title="50/200 SMA Crossover Bearish"
        headers={sma50_200_bearish[0]}
        rows={sma50_200_bearish.slice(1)}
        tableType="sma-crossover"
      />
    </Box>
  );
}

function ScannerSubTabCandlestick() {
  const darkCloud = useSheetRange("Copy", "B62:E82");
  const piercing = useSheetRange("Copy", "G62:J82");
  const bullishEngulfing = useSheetRange("Copy", "L62:O82");
  const bearishEngulfing = useSheetRange("Copy", "P62:S82");
  if (!darkCloud || !piercing || !bullishEngulfing || !bearishEngulfing) return <CircularProgress />;
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: "16px",
        justifyContent: "center",
        alignItems: "flex-start",
        overflowX: "auto",
        width: "100%"
      }}
    >
      <ProfessionalTable
        title="Dark Cloud"
        headers={darkCloud[0]}
        rows={darkCloud.slice(1)}
        tableType="dark-cloud"
      />
      <ProfessionalTable
        title="Piercing Pattern"
        headers={piercing[0]}
        rows={piercing.slice(1)}
        tableType="dark-cloud"
      />
      <ProfessionalTable
        title="Bullish Engulfing"
        headers={bullishEngulfing[0]}
        rows={bullishEngulfing.slice(1)}
        tableType="dark-cloud"
      />
      <ProfessionalTable
        title="Bearish Engulfing"
        headers={bearishEngulfing[0]}
        rows={bearishEngulfing.slice(1)}
        tableType="dark-cloud"
      />
    </Box>
  );
}

export default ScannerTab;
