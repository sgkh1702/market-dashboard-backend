import React from "react";
import ProfessionalTable from "../components/ProfessionalTable";
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

const SHEET_ID = "1t_AAtFwWPnqeNoVwDFbV8rtCIEXwQ8e3kLFHoRSlre0";
const API_KEY = "AIzaSyB26mEZ7Lh-eS0npTPiGgT9r9hwdthUJQ0";
const TAB = "Dashboard";

function useSheetRange(sheetName, range) {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`
    )
      .then((res) => res.json())
      .then((res) => setData(res.values || []))
      .catch(() => setData([]));
  }, [sheetName, range]);

  return data;
}

function MarketCard({ title, headers, rows }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 2,
        border: "1px solid #dbe3ee",
        backgroundColor: "#fff",
        overflowX: "auto",
        minWidth: 0,
        height: "100%",
      }}
    >
      <Typography
        sx={{
          mb: 1.5,
          fontWeight: 700,
          fontSize: { xs: 15, md: 18 },
          color: "#0f172a",
        }}
      >
        {title}
      </Typography>
      <ProfessionalTable headers={headers} rows={rows} tableType="global-market" />
    </Paper>
  );
}

export default function GlobalMarketTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileTab, setMobileTab] = React.useState("broader");

  const broaderData = useSheetRange(TAB, "C6:F10");
  const sectorialData = useSheetRange(TAB, "H6:K18");
  const usMarketData = useSheetRange(TAB, "M6:P10");
  const asianMarketData = useSheetRange(TAB, "M13:P16");

  if (
    !broaderData ||
    !Array.isArray(broaderData) ||
    broaderData.length === 0 ||
    !sectorialData ||
    !Array.isArray(sectorialData) ||
    sectorialData.length === 0 ||
    !usMarketData ||
    !Array.isArray(usMarketData) ||
    usMarketData.length === 0 ||
    !asianMarketData ||
    !Array.isArray(asianMarketData) ||
    asianMarketData.length === 0
  ) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const percentChangeIndex = sectorialData[0].findIndex(
    (header) => header.trim().replace("%", "").toLowerCase() === "change"
  );

  const sortedSectorialRows = [...sectorialData.slice(1)].sort((a, b) => {
    const valA = parseFloat(a[percentChangeIndex]) || 0;
    const valB = parseFloat(b[percentChangeIndex]) || 0;
    return valB - valA;
  });

  const mobileCards = {
    broader: {
      title: "Broader Indices",
      headers: broaderData[0],
      rows: broaderData.slice(1),
    },
    sectorial: {
      title: "Sectorial Indices",
      headers: sectorialData[0],
      rows: sortedSectorialRows,
    },
    us: {
      title: "US Markets",
      headers: usMarketData[0],
      rows: usMarketData.slice(1),
    },
    asian: {
      title: "Asian Markets",
      headers: asianMarketData[0],
      rows: asianMarketData.slice(1),
    },
  };

  return (
    <Box sx={{ width: "100%", mt: 1, minWidth: 0 }}>
      {isMobile ? (
        <>
          <Tabs
            value={mobileTab}
            onChange={(_, value) => setMobileTab(value)}
            variant="standard"
            textColor="primary"
            indicatorColor="primary"
            sx={{
              mb: 2,
              minHeight: 42,
              "& .MuiTabs-flexContainer": {
                flexWrap: "wrap",
                gap: 1,
              },
              "& .MuiTab-root": {
                minHeight: 38,
                minWidth: "auto",
                px: 1.25,
                py: 0.75,
                fontSize: 12.5,
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "10px",
                color: "#4b5563",
              },
              "& .Mui-selected": {
                color: "#1f6fb2",
              },
            }}
          >
            <Tab value="broader" label="Broader Indices" />
            <Tab value="sectorial" label="Sectorial Indices" />
            <Tab value="us" label="US Markets" />
            <Tab value="asian" label="Asian Markets" />
          </Tabs>

          <MarketCard
            title={mobileCards[mobileTab].title}
            headers={mobileCards[mobileTab].headers}
            rows={mobileCards[mobileTab].rows}
          />
        </>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1.25fr 1fr",
            gap: 2.5,
            alignItems: "start",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <MarketCard
              title="Broader Indices"
              headers={broaderData[0]}
              rows={broaderData.slice(1)}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <MarketCard
              title="Sectorial Indices"
              headers={sectorialData[0]}
              rows={sortedSectorialRows}
            />
          </Box>

          <Box
            sx={{
              minWidth: 0,
              display: "grid",
              gap: 2.5,
            }}
          >
            <MarketCard
              title="US Markets"
              headers={usMarketData[0]}
              rows={usMarketData.slice(1)}
            />
            <MarketCard
              title="Asian Markets"
              headers={asianMarketData[0]}
              rows={asianMarketData.slice(1)}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}