import React, { useMemo, useState } from "react";
import ProfessionalTable from "../components/ProfessionalTable";
import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Autocomplete,
  TextField,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import useSheetRange from "../hooks/useSheetRange";
import FnoPulseBarChart from "../components/FnoPulseBarChart";

const symbolFilterOptions = createFilterOptions({
  matchFrom: "start",
  stringify: (option) => option || "",
});

function FNOPulseTab() {
  const [subTab, setSubTab] = useState("futures");
  const [selectedBullish, setSelectedBullish] = useState("");
  const [selectedBearish, setSelectedBearish] = useState("");
  const [selectedFutureSymbol, setSelectedFutureSymbol] = useState(null);
  const [futureInputValue, setFutureInputValue] = useState("");

  // ---------- Futures ----------
  const timestampData = useSheetRange("Buildup", "B1");
  const fallbackTimestampData = useSheetRange("Buildup", "B2");
  const timestampValue =
    (timestampData && timestampData[0]?.[0]) ||
    (fallbackTimestampData && fallbackTimestampData[0]?.[0]) ||
    "-";

  const longBuildup = useSheetRange("Buildup", "A3:D13");
  const shortCovering = useSheetRange("Buildup", "A17:D27");
  const longUnwinding = useSheetRange("Buildup", "E3:H13");
  const shortBuildup = useSheetRange("Buildup", "E17:H27");
  const maxOIChange = useSheetRange("Buildup", "I3:L13");

  const futuresLoading =
    !longBuildup || !shortCovering || !longUnwinding || !shortBuildup || !maxOIChange;

  // ---------- Calls ----------
  const callsTimestampData = useSheetRange("Options", "A2");
  const callsTimestamp = (callsTimestampData && callsTimestampData[0]?.[0]) || "-";
  const callsRaw = useSheetRange("Options", "B1:L21");
  const callsExpiry =
    callsRaw && callsRaw.length > 1 ? callsRaw[1][1] || "-" : "-";

  const callsHeaders = [
    "Underlying",
    "Type",
    "Strike",
    "Last Price",
    "% Chg",
    "OI",
    "Underlying Value",
  ];

  const callsRows =
    callsRaw && callsRaw.length > 1
      ? callsRaw.slice(1).map((row) => [
          row[0],
          row[2],
          row[3],
          row[4],
          row[5],
          row[9],
          row[10],
        ])
      : [];

  const callsLoading = !callsRaw;

  // ---------- Puts ----------
  const putsTimestampData = useSheetRange("Options", "A52");
  const putsTimestamp = (putsTimestampData && putsTimestampData[0]?.[0]) || "-";
  const putsRaw = useSheetRange("Options", "B50:L70");
  const putsExpiry =
    putsRaw && putsRaw.length > 1 ? putsRaw[1][1] || "-" : "-";

  const putsHeaders = [
    "Underlying",
    "Type",
    "Strike",
    "Last Price",
    "% Chg",
    "OI",
    "Underlying Value",
  ];

  const putsRows =
    putsRaw && putsRaw.length > 1
      ? putsRaw.slice(1).map((row) => [
          row[0],
          row[2],
          row[3],
          row[4],
          row[5],
          row[9],
          row[10],
        ])
      : [];

  const putsLoading = !putsRaw;

  const filterByChangeSign = (rows, colIdx, positive = true) =>
    rows.filter((r) => {
      const v = parseFloat(r[colIdx]);
      if (Number.isNaN(v)) return false;
      return positive ? v > 0 : v < 0;
    });

  const callsRowsPos = filterByChangeSign(callsRows, 4, true);
  const callsRowsNeg = filterByChangeSign(callsRows, 4, false);
  const putsRowsPos = filterByChangeSign(putsRows, 4, true);
  const putsRowsNeg = filterByChangeSign(putsRows, 4, false);

  // ---------- EOD ----------
  const eodDateData = useSheetRange("Buildup", "A50");
  const eodDate = (eodDateData && eodDateData[0]?.[0]) || "-";

  const eodLongBuildupRaw = useSheetRange("Buildup", "A53:D63");
  const eodShortBuildupRaw = useSheetRange("Buildup", "F53:I63");
  const eodShortCoveringRaw = useSheetRange("Buildup", "K53:N63");
  const eodLongUnwindingRaw = useSheetRange("Buildup", "P53:S63");

  const eodLoading =
    !eodLongBuildupRaw ||
    !eodShortBuildupRaw ||
    !eodShortCoveringRaw ||
    !eodLongUnwindingRaw;

  const toTable = (raw) =>
    raw && raw.length > 0
      ? { headers: raw[0], rows: raw.slice(1) }
      : { headers: [], rows: [] };

  const eodLongBuildup = toTable(eodLongBuildupRaw);
  const eodShortBuildup = toTable(eodShortBuildupRaw);
  const eodShortCovering = toTable(eodShortCoveringRaw);
  const eodLongUnwinding = toTable(eodLongUnwindingRaw);

  const tb = (data, title) =>
    data && data.length > 1 ? (
      <ProfessionalTable title={title} headers={data[0] || []} rows={data.slice(1) || []} />
    ) : null;

  // ---------- Momentum symbols ----------
  const bullishSymbolsRaw = useSheetRange("Momentum", "B5:B14");
  const bearishSymbolsRaw = useSheetRange("Momentum", "H5:H14");

  const bullishSymbols =
    bullishSymbolsRaw?.flat().map((x) => String(x || "").trim()).filter(Boolean) || [];
  const bearishSymbols =
    bearishSymbolsRaw?.flat().map((x) => String(x || "").trim()).filter(Boolean) || [];

  const bullishLoading = !bullishSymbolsRaw;
  const bearishLoading = !bearishSymbolsRaw;

  // ---------- StockData ----------
  const stockDataRaw = useSheetRange("StockData", "V1:AL7000");

  const stockHeaders =
    stockDataRaw && stockDataRaw.length > 0 ? stockDataRaw[0] : [];

  const stockRows =
    stockDataRaw && stockDataRaw.length > 1 ? stockDataRaw.slice(1) : [];

  const stockDataLoading = !stockDataRaw;

  const stockIdx = {
    date: stockHeaders.indexOf("TradDt"),
    symbol: stockHeaders.indexOf("TckrSymb"),
    oi: stockHeaders.indexOf("OpnIntrst"),
    buildup: stockHeaders.indexOf("Buildup"),
    maxCeStrike: stockHeaders.indexOf("Max CE Strike"),
    maxPeStrike: stockHeaders.indexOf("Max PE Strike"),
  };

  const mapChartRowsForSymbol = (symbol) => {
    if (!symbol || !stockRows.length) return [];
    if (
      stockIdx.date < 0 ||
      stockIdx.symbol < 0 ||
      stockIdx.oi < 0 ||
      stockIdx.buildup < 0 ||
      stockIdx.maxCeStrike < 0 ||
      stockIdx.maxPeStrike < 0
    ) {
      return [];
    }

    const rows = stockRows
      .filter(
        (r) =>
          String(r[stockIdx.symbol] || "").trim().toUpperCase() ===
          symbol.trim().toUpperCase()
      )
      .map((r) => ({
        date: String(r[stockIdx.date] || "").trim(),
        oi: Number(String(r[stockIdx.oi] || "").replace(/,/g, "")) || 0,
        buildup: String(r[stockIdx.buildup] || "").trim(),
        max_ce_strike:
          Number(String(r[stockIdx.maxCeStrike] || "").replace(/,/g, "")) || 0,
        max_pe_strike:
          Number(String(r[stockIdx.maxPeStrike] || "").replace(/,/g, "")) || 0,
      }));

    return rows.slice(-10);
  };

  const allSymbols = useMemo(() => {
    if (!stockRows.length || stockIdx.symbol < 0) return [];
    return [...new Set(
      stockRows
        .map((r) => String(r[stockIdx.symbol] || "").trim().toUpperCase())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }, [stockRows, stockIdx.symbol]);

  const bullishSymbol = selectedBullish || bullishSymbols[0] || "";
  const bearishSymbol = selectedBearish || bearishSymbols[0] || "";
  const futureSymbol = selectedFutureSymbol || allSymbols[0] || "";

  const bullishChartRows = useMemo(
    () => mapChartRowsForSymbol(bullishSymbol),
    [bullishSymbol, stockDataRaw]
  );

  const bearishChartRows = useMemo(
    () => mapChartRowsForSymbol(bearishSymbol),
    [bearishSymbol, stockDataRaw]
  );

  const futureChartRows = useMemo(
    () => mapChartRowsForSymbol(futureSymbol),
    [futureSymbol, stockDataRaw]
  );

  const renderSymbolList = (title, symbols, selectedSymbol, setSelectedSymbol) => (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        {title}
      </Typography>

      <List dense>
        {symbols.map((symbol, idx) => (
          <React.Fragment key={`${symbol}-${idx}`}>
            <ListItemButton
              selected={selectedSymbol === symbol}
              onClick={() => setSelectedSymbol(symbol)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                "&.Mui-selected": {
                  backgroundColor: "#e8f5e9",
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "#dcedc8",
                },
              }}
            >
              <ListItemText primary={symbol} />
            </ListItemButton>
            {idx < symbols.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );

  const renderFutures = () => {
    if (futuresLoading) return <CircularProgress />;
    return (
      <>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
            Timestamp:
          </Typography>
          <Typography variant="subtitle1">{timestampValue}</Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            mb: 3,
            mt: 2,
          }}
        >
          {tb(longBuildup, "Long Buildup")}
          {tb(longUnwinding, "Long Unwinding")}
          {tb(maxOIChange, "Max OI Change (5 min)")}
          {tb(shortCovering, "Short Covering")}
          {tb(shortBuildup, "Short Buildup")}
        </Box>
      </>
    );
  };

  const renderCalls = () => {
    if (callsLoading) return <CircularProgress />;
    return (
      <>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Timestamp:{" "}
            <Typography component="span" variant="subtitle1">
              {callsTimestamp}
            </Typography>
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Expiry:{" "}
            <Typography component="span" variant="subtitle1">
              {callsExpiry}
            </Typography>
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
          <ProfessionalTable
            title="Top CE (Calls) – +ve % Chg"
            headers={callsHeaders}
            rows={callsRowsPos}
          />
          <ProfessionalTable
            title="Top CE (Calls) – -ve % Chg"
            headers={callsHeaders}
            rows={callsRowsNeg}
          />
        </Box>
      </>
    );
  };

  const renderPuts = () => {
    if (putsLoading) return <CircularProgress />;
    return (
      <>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Timestamp:{" "}
            <Typography component="span" variant="subtitle1">
              {putsTimestamp}
            </Typography>
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Expiry:{" "}
            <Typography component="span" variant="subtitle1">
              {putsExpiry}
            </Typography>
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
          <ProfessionalTable
            title="Top PE (Puts) – +ve % Chg"
            headers={putsHeaders}
            rows={putsRowsPos}
          />
          <ProfessionalTable
            title="Top PE (Puts) – -ve % Chg"
            headers={putsHeaders}
            rows={putsRowsNeg}
          />
        </Box>
      </>
    );
  };

  const renderEod = () => {
    if (eodLoading) return <CircularProgress />;
    return (
      <>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
            Date:
          </Typography>
          <Typography variant="subtitle1">{eodDate}</Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 3 }}>
          <ProfessionalTable
            title="Long Buildup"
            headers={eodLongBuildup.headers}
            rows={eodLongBuildup.rows}
          />
          <ProfessionalTable
            title="Short Buildup"
            headers={eodShortBuildup.headers}
            rows={eodShortBuildup.rows}
          />
          <ProfessionalTable
            title="Short Covering"
            headers={eodShortCovering.headers}
            rows={eodShortCovering.rows}
          />
          <ProfessionalTable
            title="Long Unwinding"
            headers={eodLongUnwinding.headers}
            rows={eodLongUnwinding.rows}
          />
        </Box>
      </>
    );
  };

  const renderHotBullish = () => {
    if (bullishLoading || stockDataLoading) return <CircularProgress />;

    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 3 }}>
        {renderSymbolList(
          "Hot Stocks Bullish",
          bullishSymbols,
          bullishSymbol,
          setSelectedBullish
        )}

        <Paper sx={{ p: 2 }}>
          <FnoPulseBarChart
            rows={bullishChartRows}
            symbol={bullishSymbol}
          />
        </Paper>
      </Box>
    );
  };

  const renderHotBearish = () => {
    if (bearishLoading || stockDataLoading) return <CircularProgress />;

    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 3 }}>
        {renderSymbolList(
          "Hot Stocks Bearish",
          bearishSymbols,
          bearishSymbol,
          setSelectedBearish
        )}

        <Paper sx={{ p: 2 }}>
          <FnoPulseBarChart
            rows={bearishChartRows}
            symbol={bearishSymbol}
          />
        </Paper>
      </Box>
    );
  };

  const renderFutureBuildup = () => {
    if (stockDataLoading) return <CircularProgress />;

    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "420px" },
              gap: 2,
              alignItems: "center",
              mb: 1,
            }}
          >
            <Autocomplete
              options={allSymbols}
              value={futureSymbol || null}
              inputValue={futureInputValue}
              onChange={(_, newValue) => {
                setSelectedFutureSymbol(newValue || "");
              }}
              onInputChange={(_, newInputValue) => {
                setFutureInputValue(newInputValue);
              }}
              filterOptions={symbolFilterOptions}
              freeSolo={false}
              autoHighlight
              selectOnFocus
              clearOnEscape
              forcePopupIcon
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Stock Symbol"
                  placeholder="Type first 2 or 3 letters"
                  size="small"
                />
              )}
            />
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <FnoPulseBarChart
            rows={futureChartRows}
            symbol={futureSymbol}
          />
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ minWidth: "1000px" }}>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{ mb: 2 }}
        textColor="primary"
        indicatorColor="primary"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="OI Spurts (Future)" value="futures" />
        <Tab label="Active Calls" value="calls" />
        <Tab label="Active Puts" value="puts" />
        <Tab label="FNO EOD" value="eod" />
        <Tab label="Hot Stocks Bullish" value="hotBullish" />
        <Tab label="Hot Stocks Bearish" value="hotBearish" />
        <Tab label="Future Buildup" value="futureBuildup" />
      </Tabs>

      {subTab === "futures" && renderFutures()}
      {subTab === "calls" && renderCalls()}
      {subTab === "puts" && renderPuts()}
      {subTab === "eod" && renderEod()}
      {subTab === "hotBullish" && renderHotBullish()}
      {subTab === "hotBearish" && renderHotBearish()}
      {subTab === "futureBuildup" && renderFutureBuildup()}
    </Box>
  );
}

export default FNOPulseTab;