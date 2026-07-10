import React, { useMemo, useState } from "react";
import ProfessionalTable from "../components/ProfessionalTable";
import {
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Typography,
  Paper,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useSheetRange from "../hooks/useSheetRange";

export default function MarketMoversTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const largecapGainers = useSheetRange("scanner", "B110:F120");
  const midcapGainers = useSheetRange("scanner", "H110:L120");
  const smallcapGainers = useSheetRange("scanner", "N110:R120");

  const largecapLosers = useSheetRange("scanner", "B125:F135");
  const midcapLosers = useSheetRange("scanner", "H125:L135");
  const smallcapLosers = useSheetRange("scanner", "N125:R135");

  const moverConfig = useMemo(
    () => ({
      topGainers: {
        label: "Top Gainers",
        children: {
          largecap: { label: "Largecap", data: largecapGainers },
          midcap: { label: "Midcap", data: midcapGainers },
          smallcap: { label: "Smallcap", data: smallcapGainers },
        },
      },
      topLosers: {
        label: "Top Losers",
        children: {
          largecap: { label: "Largecap", data: largecapLosers },
          midcap: { label: "Midcap", data: midcapLosers },
          smallcap: { label: "Smallcap", data: smallcapLosers },
        },
      },
    }),
    [largecapGainers, midcapGainers, smallcapGainers, largecapLosers, midcapLosers, smallcapLosers]
  );

  const parentKeys = Object.keys(moverConfig);
  const [parentTab, setParentTab] = useState(parentKeys[0]);
  const [childTabMap, setChildTabMap] = useState({
    topGainers: "largecap",
    topLosers: "largecap",
  });

  const activeParent = moverConfig[parentTab];
  const childKeys = Object.keys(activeParent.children);
  const activeChildKey =
    childTabMap[parentTab] && activeParent.children[childTabMap[parentTab]]
      ? childTabMap[parentTab]
      : childKeys[0];
  const activeChild = activeParent.children[activeChildKey];

  const parentOptions = parentKeys.map((key) => ({
    value: key,
    label: moverConfig[key].label,
  }));

  const renderLoading = () => (
    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
      <CircularProgress size={22} />
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
          p: { xs: 1, md: 1.25 },
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
            mb: 1,
            fontWeight: 700,
            fontSize: { xs: 14, md: 15 },
            color: "#0f172a",
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        <ProfessionalTable headers={headers} rows={rows} />
      </Paper>
    );
  };

  const renderMobileSelectors = () => (
    <Box sx={{ display: "grid", gap: 1.25, mb: 2 }}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={parentTab}
        onChange={(_, value) => value && setParentTab(value)}
        size="small"
        sx={{
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontWeight: 700,
            borderColor: "#dbe3ee",
            color: "#4b5563",
            py: 0.8,
          },
          "& .Mui-selected": {
            backgroundColor: "#e8f1fb",
            color: "#1f6fb2 !important",
          },
        }}
      >
        {parentOptions.map((opt) => (
          <ToggleButton key={opt.value} value={opt.value}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <ToggleButtonGroup
        exclusive
        fullWidth
        value={activeChildKey}
        onChange={(_, value) =>
          value && setChildTabMap((prev) => ({ ...prev, [parentTab]: value }))
        }
        size="small"
        sx={{
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontWeight: 700,
            borderColor: "#dbe3ee",
            color: "#4b5563",
            py: 0.8,
          },
          "& .Mui-selected": {
            backgroundColor: "#e8f1fb",
            color: "#1f6fb2 !important",
          },
        }}
      >
        {childKeys.map((key) => (
          <ToggleButton key={key} value={key}>
            {activeParent.children[key].label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );

  return (
    <Box sx={{ mt: 1, minWidth: 0 }}>
      {isMobile ? (
        renderMobileSelectors()
      ) : (
        <Tabs
          value={parentTab}
          onChange={(_, value) => setParentTab(value)}
          variant="standard"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            mb: 1.5,
            minHeight: 40,
            "& .MuiTabs-flexContainer": { flexWrap: "nowrap", gap: 1 },
            "& .MuiTab-root": {
              minHeight: 40,
              minWidth: "auto",
              px: 1.25,
              fontSize: 13,
              fontWeight: 700,
              textTransform: "none",
              color: "#4b5563",
            },
            "& .Mui-selected": { color: "#1f6fb2" },
          }}
        >
          {parentOptions.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>
      )}

      <Box
        sx={{
          display: { xs: "block", md: "grid" },
          gridTemplateColumns: {
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(3, minmax(0, 1fr))",
          },
          gap: 1.25,
          alignItems: "start",
        }}
      >
        {isMobile ? (
          <Box sx={{ minWidth: 0 }}>{renderTableCard(activeChild.label, activeChild.data)}</Box>
        ) : (
          Object.entries(activeParent.children).map(([key, child]) => (
            <Box key={key} sx={{ minWidth: 0 }}>
              {renderTableCard(child.label, child.data)}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}