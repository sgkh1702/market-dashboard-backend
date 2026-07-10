import React, { useMemo, useState } from "react";
import ProfessionalTable from "../components/ProfessionalTable";
import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Autocomplete,
  TextField,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { useTheme } from "@mui/material/styles";
import useSheetRange from "../hooks/useSheetRange";
import FnoPulseBarChart from "../components/FnoPulseBarChart";

const symbolFilterOptions = createFilterOptions({
  matchFrom: "start",
  stringify: (option) => option || "",
});

const SUB_TABS = [
  { value: "futures", label: "OI Spurts" },
  { value: "calls", label: "Calls" },
  { value: "puts", label: "Puts" },
  { value: "eod", label: "EOD" },
  { value: "hotBullish", label: "Hot Bullish" },
  { value: "hotBearish", label: "Hot Bearish" },
  { value: "futureBuildup", label: "Future Buildup" },
];

function FNOPulseTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [subTab, setSubTab] = useState("futures");
  const [selectedBullish, setSelectedBullish] = useState("");
  const [selectedBearish, setSelectedBearish] = useState("");
  const [selectedFutureSymbol, setSelectedFutureSymbol] = useState(null);
  const [futureInputValue, setFutureInputValue] = useState("");

  const [mobileFuturesCard, setMobileFuturesCard] = useState("longBuildup");
  const [mobileCallsCard, setMobileCallsCard] = useState("positiveCalls");
  const [mobilePutsCard, setMobilePutsCard] = useState("positivePuts");
  const [mobileEodCard, setMobileEodCard] = useState("longBuildup");

  const longBuildup = useSheetRange("Buildup", "A3:D13");
  const shortCovering = useSheetRange("Buildup", "A17:D27");
  const longUnwinding = useSheetRange("Buildup", "E3:H13");
  const shortBuildup = useSheetRange("Buildup", "E17:H27");

  const futuresLoading =
    !longBuildup || !shortCovering || !longUnwinding || !shortBuildup;

  const callsRaw = useSheetRange("Options", "B1:L21");
  const callsHeaders = ["Underlying", "Strike", "Last Price", "% Chg", "OI", "Underlying"];
  const callsRows =
    callsRaw && callsRaw.length > 1
      ? callsRaw.slice(1).map((row) => [row[0], row[3], row[4], row[5], row[9], row[10]])
      : [];
  const callsLoading = !callsRaw;

  const putsRaw = useSheetRange("Options", "B50:L70");
  const putsHeaders = ["Underlying", "Strike", "Last Price", "% Chg", "OI", "Underlying"];
  const putsRows =
    putsRaw && putsRaw.length > 1
      ? putsRaw.slice(1).map((row) => [row[0], row[3], row[4], row[5], row[9], row[10]])
      : [];
  const putsLoading = !putsRaw;

  const filterByChangeSign = (rows, colIdx, positive = true) =>
    rows.filter((r) => {
      const v = parseFloat(r[colIdx]);
      if (Number.isNaN(v)) return false;
      return positive ? v > 0 : v < 0;
    });

  const callsRowsPos = filterByChangeSign(callsRows, 3, true);
  const callsRowsNeg = filterByChangeSign(callsRows, 3, false);
  const putsRowsPos = filterByChangeSign(putsRows, 3, true);
  const putsRowsNeg = filterByChangeSign(putsRows, 3, false);

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
    raw && raw.length > 0 ? { headers: raw[0], rows: raw.slice(1) } : { headers: [], rows: [] };

  const eodLongBuildup = toTable(eodLongBuildupRaw);
  const eodShortBuildup = toTable(eodShortBuildupRaw);
  const eodShortCovering = toTable(eodShortCoveringRaw);
  const eodLongUnwinding = toTable(eodLongUnwindingRaw);

  const bullishSymbolsRaw = useSheetRange("Momentum", "B5:B14");
  const bearishSymbolsRaw = useSheetRange("Momentum", "H5:H14");

  const bullishSymbols =
    bullishSymbolsRaw?.flat().map((x) => String(x || "").trim()).filter(Boolean) || [];
  const bearishSymbols =
    bearishSymbolsRaw?.flat().map((x) => String(x || "").trim()).filter(Boolean) || [];

  const bullishLoading = !bullishSymbolsRaw;
  const bearishLoading = !bearishSymbolsRaw;

  const stockDataRaw = useSheetRange("StockData", "V1:AL7000");
  const stockHeaders = useMemo(
    () => (stockDataRaw && stockDataRaw.length > 0 ? stockDataRaw[0] : []),
    [stockDataRaw]
  );
  const stockRows = useMemo(
    () => (stockDataRaw && stockDataRaw.length > 1 ? stockDataRaw.slice(1) : []),
    [stockDataRaw]
  );
  const stockDataLoading = !stockDataRaw;

  const stockIdx = {
    date: stockHeaders.indexOf("TradDt"),
    symbol: stockHeaders.indexOf("TckrSymb"),
    oi: stockHeaders.indexOf("OpnIntrst"),
    buildup: stockHeaders.indexOf("Buildup"),
    maxCeStrike: stockHeaders.indexOf("Max CE Strike"),
    maxPeStrike: stockHeaders.indexOf("Max PE Strike"),
    ltp: stockHeaders.indexOf("LTP") >= 0 ? stockHeaders.indexOf("LTP") : stockHeaders.indexOf("Ltp"),
  };

  const mapChartRowsForSymbol = useMemo(
    () => (symbol) => {
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

      const parseTradeDate = (value) => {
        if (!value) return null;
        const str = String(value).trim();

        const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (ddmmyyyy) {
          const [, dd, mm, yyyy] = ddmmyyyy;
          const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
          return Number.isNaN(d.getTime()) ? null : d;
        }

        const yyyymmdd = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (yyyymmdd) {
          const [, yyyy, mm, dd] = yyyymmdd;
          const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
          return Number.isNaN(d.getTime()) ? null : d;
        }

        const parsed = new Date(str);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const rows = stockRows
        .filter(
          (r) =>
            String(r[stockIdx.symbol] || "").trim().toUpperCase() ===
            symbol.trim().toUpperCase()
        )
        .map((r) => {
          const rawDate = String(r[stockIdx.date] || "").trim();
          const parsedDate = parseTradeDate(rawDate);

          return {
            date: rawDate,
            parsedDate,
            oi: Number(String(r[stockIdx.oi] || "").replace(/,/g, "")) || 0,
            buildup: String(r[stockIdx.buildup] || "").trim(),
            max_ce_strike:
              Number(String(r[stockIdx.maxCeStrike] || "").replace(/,/g, "")) || 0,
            max_pe_strike:
              Number(String(r[stockIdx.maxPeStrike] || "").replace(/,/g, "")) || 0,
            ltp:
              stockIdx.ltp >= 0
                ? Number(String(r[stockIdx.ltp] || "").replace(/,/g, "")) || 0
                : 0,
          };
        })
        .filter((r) => r.parsedDate)
        .sort((a, b) => a.parsedDate - b.parsedDate);

      return rows.slice(-10).map(({ parsedDate, ...rest }) => rest);
    },
    [
      stockRows,
      stockIdx.date,
      stockIdx.symbol,
      stockIdx.oi,
      stockIdx.buildup,
      stockIdx.maxCeStrike,
      stockIdx.maxPeStrike,
      stockIdx.ltp,
    ]
  );

  const allSymbols = useMemo(() => {
    if (!stockRows.length || stockIdx.symbol < 0) return [];
    return [
      ...new Set(
        stockRows
          .map((r) => String(r[stockIdx.symbol] || "").trim().toUpperCase())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [stockRows, stockIdx.symbol]);

  const bullishSymbol = selectedBullish || bullishSymbols[0] || "";
  const bearishSymbol = selectedBearish || bearishSymbols[0] || "";
  const futureSymbol = selectedFutureSymbol || allSymbols[0] || "";

  const bullishChartRows = useMemo(
    () => mapChartRowsForSymbol(bullishSymbol),
    [bullishSymbol, mapChartRowsForSymbol]
  );

  const bearishChartRows = useMemo(
    () => mapChartRowsForSymbol(bearishSymbol),
    [bearishSymbol, mapChartRowsForSymbol]
  );

  const futureChartRows = useMemo(
    () => mapChartRowsForSymbol(futureSymbol),
    [futureSymbol, mapChartRowsForSymbol]
  );

  const TableBlock = ({ title, headers, rows }) => (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #dbe3ee",
        borderRadius: 2,
        p: 1.25,
        backgroundColor: "#fff",
        overflowX: "auto",
        minWidth: 0,
      }}
    >
      <Typography sx={{ mb: 1, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
        {title}
      </Typography>
      <ProfessionalTable headers={headers} rows={rows} />
    </Paper>
  );

  const renderLoading = () => (
    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
      <CircularProgress size={22} />
    </Box>
  );

  const segmentedGroupStyles = {
    "& .MuiToggleButton-root": {
      textTransform: "none",
      fontWeight: 700,
      borderColor: "#dbe3ee",
      color: "#4b5563",
      py: 0.8,
      minWidth: 0,
      flex: 1,
      whiteSpace: "nowrap",
    },
    "& .Mui-selected": {
      backgroundColor: "#e8f1fb",
      color: "#1f6fb2 !important",
    },
  };

  const renderMobileSelector = (label, value, onChange, options) => (
    <Box sx={{ display: "grid", gap: 0.75, mb: 2 }}>
      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
        {label}
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={value}
        onChange={(_, v) => v && onChange(v)}
        size="small"
        sx={{
          display: "flex",
          width: "100%",
          gap: 0.75,
          flexWrap: "nowrap",
          ...segmentedGroupStyles,
        }}
      >
        {options.map((opt) => (
          <ToggleButton key={opt.value} value={opt.value}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );

  const renderFutures = () => {
    if (futuresLoading) return renderLoading();

    const futuresCards = {
      longBuildup: {
        title: "Long Buildup",
        headers: longBuildup[0] || [],
        rows: longBuildup.slice(1),
      },
      longUnwinding: {
        title: "Long Unwinding",
        headers: longUnwinding[0] || [],
        rows: longUnwinding.slice(1),
      },
      shortCovering: {
        title: "Short Covering",
        headers: shortCovering[0] || [],
        rows: shortCovering.slice(1),
      },
      shortBuildup: {
        title: "Short Buildup",
        headers: shortBuildup[0] || [],
        rows: shortBuildup.slice(1),
      },
    };

    const active = futuresCards[mobileFuturesCard];

    return isMobile ? (
      <Box>
        {renderMobileSelector("Choose card", mobileFuturesCard, setMobileFuturesCard, [
          { value: "longBuildup", label: "Long Buildup" },
          { value: "longUnwinding", label: "Long Unwinding" },
          { value: "shortCovering", label: "Short Covering" },
          { value: "shortBuildup", label: "Short Buildup" },
        ])}
        <TableBlock title={active.title} headers={active.headers} rows={active.rows} />
      </Box>
    ) : (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
          gap: 1.25,
        }}
      >
        {Object.entries(futuresCards).map(([key, card]) => (
          <TableBlock key={key} title={card.title} headers={card.headers} rows={card.rows} />
        ))}
      </Box>
    );
  };

  const renderCalls = () => {
    if (callsLoading) return renderLoading();

    const callsCards = {
      positiveCalls: { title: "Positive Calls", headers: callsHeaders, rows: callsRowsPos },
      negativeCalls: { title: "Negative Calls", headers: callsHeaders, rows: callsRowsNeg },
    };

    const active = callsCards[mobileCallsCard];

    return isMobile ? (
      <Box>
        {renderMobileSelector("Choose view", mobileCallsCard, setMobileCallsCard, [
          { value: "positiveCalls", label: "Positive Calls" },
          { value: "negativeCalls", label: "Negative Calls" },
        ])}
        <TableBlock title={active.title} headers={active.headers} rows={active.rows} />
      </Box>
    ) : (
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25 }}>
        <TableBlock title="Positive Calls" headers={callsHeaders} rows={callsRowsPos} />
        <TableBlock title="Negative Calls" headers={callsHeaders} rows={callsRowsNeg} />
      </Box>
    );
  };

  const renderPuts = () => {
    if (putsLoading) return renderLoading();

    const putsCards = {
      positivePuts: { title: "Positive Puts", headers: putsHeaders, rows: putsRowsPos },
      negativePuts: { title: "Negative Puts", headers: putsHeaders, rows: putsRowsNeg },
    };

    const active = putsCards[mobilePutsCard];

    return isMobile ? (
      <Box>
        {renderMobileSelector("Choose view", mobilePutsCard, setMobilePutsCard, [
          { value: "positivePuts", label: "Positive Puts" },
          { value: "negativePuts", label: "Negative Puts" },
        ])}
        <TableBlock title={active.title} headers={active.headers} rows={active.rows} />
      </Box>
    ) : (
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25 }}>
        <TableBlock title="Positive Puts" headers={putsHeaders} rows={putsRowsPos} />
        <TableBlock title="Negative Puts" headers={putsHeaders} rows={putsRowsNeg} />
      </Box>
    );
  };

  const renderEod = () => {
    if (eodLoading) return renderLoading();

    const eodCards = {
      longBuildup: { title: "Long Buildup", headers: eodLongBuildup.headers, rows: eodLongBuildup.rows },
      shortBuildup: { title: "Short Buildup", headers: eodShortBuildup.headers, rows: eodShortBuildup.rows },
      shortCovering: { title: "Short Covering", headers: eodShortCovering.headers, rows: eodShortCovering.rows },
      longUnwinding: { title: "Long Unwinding", headers: eodLongUnwinding.headers, rows: eodLongUnwinding.rows },
    };

    const active = eodCards[mobileEodCard];

    return isMobile ? (
      <Box>
        {renderMobileSelector("Choose card", mobileEodCard, setMobileEodCard, [
          { value: "longBuildup", label: "Long Buildup" },
          { value: "shortBuildup", label: "Short Buildup" },
          { value: "shortCovering", label: "Short Covering" },
          { value: "longUnwinding", label: "Long Unwinding" },
        ])}
        <TableBlock title={active.title} headers={active.headers} rows={active.rows} />
      </Box>
    ) : (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
          gap: 1.25,
        }}
      >
        {Object.entries(eodCards).map(([key, card]) => (
          <TableBlock key={key} title={card.title} headers={card.headers} rows={card.rows} />
        ))}
      </Box>
    );
  };

  const renderHotBullish = () => {
    if (bullishLoading || stockDataLoading) return renderLoading();

    return (
      <Box sx={{ display: "grid", gap: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {bullishSymbols.map((symbol) => (
            <Box
              key={symbol}
              onClick={() => setSelectedBullish(symbol)}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                border: "1px solid #cfd8e3",
                backgroundColor: bullishSymbol === symbol ? "#dbeafe" : "#fff",
                color: bullishSymbol === symbol ? "#0f4c81" : "#334155",
                "&:hover": {
                  backgroundColor: bullishSymbol === symbol ? "#dbeafe" : "#f8fafc",
                },
              }}
            >
              {symbol}
            </Box>
          ))}
        </Box>
        <Typography variant="subtitle2" sx={{ color: "#0f172a", fontWeight: 700 }}>
          OI / Buildup Chart
        </Typography>
        <FnoPulseBarChart rows={bullishChartRows} />
      </Box>
    );
  };

  const renderHotBearish = () => {
    if (bearishLoading || stockDataLoading) return renderLoading();

    return (
      <Box sx={{ display: "grid", gap: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {bearishSymbols.map((symbol) => (
            <Box
              key={symbol}
              onClick={() => setSelectedBearish(symbol)}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                border: "1px solid #cfd8e3",
                backgroundColor: bearishSymbol === symbol ? "#fee2e2" : "#fff",
                color: bearishSymbol === symbol ? "#991b1b" : "#334155",
                "&:hover": {
                  backgroundColor: bearishSymbol === symbol ? "#fee2e2" : "#f8fafc",
                },
              }}
            >
              {symbol}
            </Box>
          ))}
        </Box>
        <Typography variant="subtitle2" sx={{ color: "#0f172a", fontWeight: 700 }}>
          OI / Buildup Chart
        </Typography>
        <FnoPulseBarChart rows={bearishChartRows} />
      </Box>
    );
  };

  const renderFutureBuildup = () => {
    if (stockDataLoading) return renderLoading();

    return (
      <Box sx={{ display: "grid", gap: 2 }}>
        <Autocomplete
          value={selectedFutureSymbol}
          onChange={(_, newValue) => {
            setSelectedFutureSymbol(newValue || "");
          }}
          inputValue={futureInputValue}
          onInputChange={(_, newInputValue) => {
            setFutureInputValue(newInputValue);
          }}
          options={allSymbols}
          filterOptions={symbolFilterOptions}
          renderInput={(params) => <TextField {...params} label="Select Stock" size="small" />}
          fullWidth
        />
        <Typography variant="subtitle2" sx={{ color: "#0f172a", fontWeight: 700 }}>
          OI / Buildup Chart
        </Typography>
        <FnoPulseBarChart rows={futureChartRows} />
      </Box>
    );
  };

  const renderActiveTab = () => {
    if (subTab === "futures") return renderFutures();
    if (subTab === "calls") return renderCalls();
    if (subTab === "puts") return renderPuts();
    if (subTab === "eod") return renderEod();
    if (subTab === "hotBullish") return renderHotBullish();
    if (subTab === "hotBearish") return renderHotBearish();
    if (subTab === "futureBuildup") return renderFutureBuildup();
    return null;
  };

  return (
    <Box sx={{ mt: 1, minWidth: 0 }}>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{
          mb: 2,
          minHeight: 44,
          "& .MuiTabs-flexContainer": { flexWrap: "wrap", gap: 1 },
          "& .MuiTab-root": {
            minHeight: 42,
            fontSize: 15,
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "10px",
            paddingInline: "14px",
            alignItems: "center",
          },
        }}
        textColor="primary"
        indicatorColor="primary"
        variant="scrollable"
        scrollButtons="auto"
      >
        {SUB_TABS.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>

      {renderActiveTab()}
    </Box>
  );
}

export default FNOPulseTab;