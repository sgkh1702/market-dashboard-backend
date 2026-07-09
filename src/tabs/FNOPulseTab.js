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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
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
  { value: "futures", label: "Futures" },
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
  const [bullishInputValue, setBullishInputValue] = useState("");
  const [bearishInputValue, setBearishInputValue] = useState("");

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
    !longBuildup ||
    !shortCovering ||
    !longUnwinding ||
    !shortBuildup ||
    !maxOIChange;

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

  const bullishSymbolsRaw = useSheetRange("Momentum", "B5:B14");
  const bearishSymbolsRaw = useSheetRange("Momentum", "H5:H14");

  const bullishSymbols =
    bullishSymbolsRaw?.flat().map((x) => String(x || "").trim()).filter(Boolean) || [];
  const bearishSymbols =
    bearishSymbolsRaw?.flat().map((x) => String(x || "").trim()).filter(Boolean) || [];

  const bullishLoading = !bullishSymbolsRaw;
  const bearishLoading = !bearishSymbolsRaw;

  const stockDataRaw = useSheetRange("StockData", "V1:AL7000");
  const stockHeaders = stockDataRaw && stockDataRaw.length > 0 ? stockDataRaw[0] : [];
  const stockRows = stockDataRaw && stockDataRaw.length > 1 ? stockDataRaw.slice(1) : [];
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
        ltp:
          stockIdx.ltp >= 0
            ? Number(String(r[stockIdx.ltp] || "").replace(/,/g, "")) || 0
            : 0,
      }));

    return rows.slice(-10);
  };

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

  const SectionHeader = ({ title, meta }) => (
    <Box
      sx={{
        mb: 2,
        p: isMobile ? 1.5 : 2,
        borderRadius: 2,
        background: "#f7fafd",
        border: "1px solid #dce6f2",
      }}
    >
      <Typography sx={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#164a7b" }}>
        {title}
      </Typography>
      {meta ? (
        <Typography sx={{ mt: 0.5, fontSize: isMobile ? 13 : 14, color: "#64748b", fontWeight: 600 }}>
          {meta}
        </Typography>
      ) : null}
    </Box>
  );

  const TableBlock = ({ title, headers, rows }) => (
    <Paper
      elevation={0}
      sx={{
        p: isMobile ? 1.25 : 1.75,
        mb: 2,
        borderRadius: 2,
        border: "1px solid #dde6f0",
        overflow: "hidden",
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: isMobile ? 15 : 17, mb: 1.25, color: "#1e3a5f" }}>
        {title}
      </Typography>
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: isMobile ? 640 : "100%" }}>
          <ProfessionalTable title="" headers={headers} rows={rows} />
        </Box>
      </Box>
    </Paper>
  );

  const renderLoading = () => (
    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
      <CircularProgress />
    </Box>
  );

  const renderFutures = () => {
    if (futuresLoading) return renderLoading();

    return (
      <Box>
        <SectionHeader title="Futures Buildup" meta={`Timestamp: ${timestampValue}`} />
        <TableBlock title="Long Buildup" headers={longBuildup[0] || []} rows={longBuildup.slice(1)} />
        <TableBlock title="Long Unwinding" headers={longUnwinding[0] || []} rows={longUnwinding.slice(1)} />
        <TableBlock title="Max OI Change (5 min)" headers={maxOIChange[0] || []} rows={maxOIChange.slice(1)} />
        <TableBlock title="Short Covering" headers={shortCovering[0] || []} rows={shortCovering.slice(1)} />
        <TableBlock title="Short Buildup" headers={shortBuildup[0] || []} rows={shortBuildup.slice(1)} />
      </Box>
    );
  };

  const renderCalls = () => {
    if (callsLoading) return renderLoading();

    return (
      <Box>
        <SectionHeader title="Calls" meta={`Timestamp: ${callsTimestamp} | Expiry: ${callsExpiry}`} />
        <TableBlock title="Positive Change Calls" headers={callsHeaders} rows={callsRowsPos} />
        <TableBlock title="Negative Change Calls" headers={callsHeaders} rows={callsRowsNeg} />
      </Box>
    );
  };

  const renderPuts = () => {
    if (putsLoading) return renderLoading();

    return (
      <Box>
        <SectionHeader title="Puts" meta={`Timestamp: ${putsTimestamp} | Expiry: ${putsExpiry}`} />
        <TableBlock title="Positive Change Puts" headers={putsHeaders} rows={putsRowsPos} />
        <TableBlock title="Negative Change Puts" headers={putsHeaders} rows={putsRowsNeg} />
      </Box>
    );
  };

  const renderEod = () => {
    if (eodLoading) return renderLoading();

    return (
      <Box>
        <SectionHeader title="EOD Buildup" meta={`Date: ${eodDate}`} />
        <TableBlock title="Long Buildup" headers={eodLongBuildup.headers} rows={eodLongBuildup.rows} />
        <TableBlock title="Short Buildup" headers={eodShortBuildup.headers} rows={eodShortBuildup.rows} />
        <TableBlock title="Short Covering" headers={eodShortCovering.headers} rows={eodShortCovering.rows} />
        <TableBlock title="Long Unwinding" headers={eodLongUnwinding.headers} rows={eodLongUnwinding.rows} />
      </Box>
    );
  };

  const renderHotBullish = () => {
    if (bullishLoading || stockDataLoading) return renderLoading();

    return (
      <Box>
        <SectionHeader title="Hot Stocks Bullish" meta={`Selected symbol: ${bullishSymbol || "-"}`} />

        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 1.25 : 1.5,
            borderRadius: 2,
            border: "1px solid #dde6f0",
            mb: 2,
          }}
        >
          <Autocomplete
            options={bullishSymbols}
            value={selectedBullish || bullishSymbols[0] || null}
            inputValue={bullishInputValue}
            onChange={(_, newValue) => {
              setSelectedBullish(newValue || "");
            }}
            onInputChange={(_, newInputValue) => {
              setBullishInputValue(newInputValue);
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
                label="Select bullish stock"
                placeholder="Type symbol..."
                fullWidth
              />
            )}
          />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 1.25 : 1.5,
            borderRadius: 2,
            border: "1px solid #dde6f0",
            minWidth: 0,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: isMobile ? 15 : 16, mb: 1 }}>
            OI / Buildup Chart
          </Typography>
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Box sx={{ minWidth: isMobile ? 560 : "100%" }}>
              <FnoPulseBarChart rows={bullishChartRows} symbol={bullishSymbol} />
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderHotBearish = () => {
    if (bearishLoading || stockDataLoading) return renderLoading();

    return (
      <Box>
        <SectionHeader title="Hot Stocks Bearish" meta={`Selected symbol: ${bearishSymbol || "-"}`} />

        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 1.25 : 1.5,
            borderRadius: 2,
            border: "1px solid #dde6f0",
            mb: 2,
          }}
        >
          <Autocomplete
            options={bearishSymbols}
            value={selectedBearish || bearishSymbols[0] || null}
            inputValue={bearishInputValue}
            onChange={(_, newValue) => {
              setSelectedBearish(newValue || "");
            }}
            onInputChange={(_, newInputValue) => {
              setBearishInputValue(newInputValue);
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
                label="Select bearish stock"
                placeholder="Type symbol..."
                fullWidth
              />
            )}
          />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 1.25 : 1.5,
            borderRadius: 2,
            border: "1px solid #dde6f0",
            minWidth: 0,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: isMobile ? 15 : 16, mb: 1 }}>
            OI / Buildup Chart
          </Typography>
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Box sx={{ minWidth: isMobile ? 560 : "100%" }}>
              <FnoPulseBarChart rows={bearishChartRows} symbol={bearishSymbol} />
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderFutureBuildup = () => {
    if (stockDataLoading) return renderLoading();

    return (
      <Box>
        <SectionHeader title="Future Buildup" meta={`Selected symbol: ${futureSymbol || "-"}`} />

        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 1.25 : 1.5,
            borderRadius: 2,
            border: "1px solid #dde6f0",
            mb: 2,
          }}
        >
          <Autocomplete
            options={allSymbols}
            value={selectedFutureSymbol}
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
                label="Select stock symbol"
                placeholder="Type symbol..."
                fullWidth
              />
            )}
          />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 1.25 : 1.5,
            borderRadius: 2,
            border: "1px solid #dde6f0",
            minWidth: 0,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: isMobile ? 15 : 16, mb: 1 }}>
            OI / Buildup Chart
          </Typography>
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Box sx={{ minWidth: isMobile ? 560 : "100%" }}>
              <FnoPulseBarChart rows={futureChartRows} symbol={futureSymbol} />
            </Box>
          </Box>
        </Paper>
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
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Box sx={{ mb: 2 }}>
        {isMobile ? (
          <FormControl fullWidth size="small">
            <InputLabel id="fno-pulse-subtab-label">Choose view</InputLabel>
            <Select
              labelId="fno-pulse-subtab-label"
              value={subTab}
              label="Choose view"
              onChange={(e) => setSubTab(e.target.value)}
            >
              {SUB_TABS.map((tab) => (
                <MenuItem key={tab.value} value={tab.value}>
                  {tab.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Tabs
            value={subTab}
            onChange={(_, v) => setSubTab(v)}
            sx={{
              mb: 2,
              "& .MuiTabs-flexContainer": {
                flexWrap: "wrap",
                gap: 1,
              },
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
        )}
      </Box>

      {renderActiveTab()}
    </Box>
  );
}

export default FNOPulseTab;