import React, { useState } from "react";
import ProfessionalTable from "../components/ProfessionalTable";
import { Box, Typography, CircularProgress, Tabs, Tab } from "@mui/material";
import useSheetRange from "../hooks/useSheetRange";
import FnoPulseBarChart from "../components/FnoPulseBarChart";

function FNOPulseTab() {
  // default tab renamed
  const [subTab, setSubTab] = useState("futures");

  // ---------- Futures (OI Spurts) timestamp ----------
  const timestampData = useSheetRange("Buildup", "B1");
  const fallbackTimestampData = useSheetRange("Buildup", "B2");
  const timestampValue =
    (timestampData && timestampData[0]?.[0]) ||
    (fallbackTimestampData && fallbackTimestampData[0]?.[0]) ||
    "-";

  // ---------- Futures data (existing FNO Pulse) ----------
  const longBuildup = useSheetRange("Buildup", "A3:D13");
  const shortCovering = useSheetRange("Buildup", "A17:D27");
  const longUnwinding = useSheetRange("Buildup", "E3:H13");
  const shortBuildup = useSheetRange("Buildup", "E17:H27");
  const maxOIChange = useSheetRange("Buildup", "I3:L13");

  function sumColumn(arr, colIdx) {
    if (!Array.isArray(arr) || arr.length < 2) return 0;
    return arr.slice(1).reduce((acc, row) => acc + (parseFloat(row[colIdx]) || 0), 0);
  }

  const fnoPulseBarData = [
    { label: "Long Buildup", oiChange: sumColumn(longBuildup, 1) },
    { label: "Short Covering", oiChange: sumColumn(shortCovering, 1) },
    { label: "Long Unwinding", oiChange: sumColumn(longUnwinding, 1) },
    { label: "Short Buildup", oiChange: sumColumn(shortBuildup, 1) },
  ];

  const futuresLoading =
    !longBuildup || !shortCovering || !longUnwinding || !shortBuildup || !maxOIChange;

  // ---------- Calls timestamp + data (Options!A2 + B1:L21) ----------
  const callsTimestampData = useSheetRange("Options", "A2");
  const callsTimestamp =
    (callsTimestampData && callsTimestampData[0]?.[0]) || "-";

  const callsRaw = useSheetRange("Options", "B1:L21");
  const callsExpiry =
    callsRaw && callsRaw.length > 1 ? callsRaw[1][1] || "-" : "-"; // expiry in C

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
          row[0],  // B underlying
          row[2],  // D optionType
          row[3],  // E strikePrice
          row[4],  // F lastPrice
          row[5],  // G pChange
          row[9],  // K openInterest
          row[10], // L underlyingVal
        ])
      : [];

  const callsLoading = !callsRaw;

  // ---------- Puts timestamp + data (Options!A52 + B50:L70) ----------
  const putsTimestampData = useSheetRange("Options", "A52");
  const putsTimestamp =
    (putsTimestampData && putsTimestampData[0]?.[0]) || "-";

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
          row[0],  // B underlying
          row[2],  // D optionType
          row[3],  // E strikePrice
          row[4],  // F lastPrice
          row[5],  // G pChange
          row[9],  // K openInterest
          row[10], // L underlyingVal
        ])
      : [];

  const putsLoading = !putsRaw;

  // ---------- Helpers: split by +ve / -ve % Chg ----------
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

  // ---------- FNO EOD (from Buildup) ----------
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

        <FnoPulseBarChart data={fnoPulseBarData} />

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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 3,
          }}
        >
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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 3,
          }}
        >
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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 3,
          }}
        >
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

  return (
    <Box sx={{ minWidth: "1000px" }}>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{ mb: 2 }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="OI Spurts (Future)" value="futures" />
        <Tab label="Active Calls" value="calls" />
        <Tab label="Active Puts" value="puts" />
        <Tab label="FNO EOD" value="eod" />
      </Tabs>

      {subTab === "futures" && renderFutures()}
      {subTab === "calls" && renderCalls()}
      {subTab === "puts" && renderPuts()}
      {subTab === "eod" && renderEod()}
    </Box>
  );
}

export default FNOPulseTab;
