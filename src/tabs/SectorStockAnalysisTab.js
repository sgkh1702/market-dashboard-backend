import React, { useState } from "react";
import ProfessionalTable from "../components/ProfessionalTable";
import SectorStockDropdown from "../components/SectorStockDropdown";
import useSheetRange from "../hooks/useSheetRange";
import { Tabs, Tab, Box } from "@mui/material";

// All sectors map to same fixed range as you requested
const sectorRanges = {
  "NIFTY 50": "B385:K434",
  "Nifty Bank": "B148:K160",
  "Nifty Auto": "B130:K144",
  "Nifty FMCG": "B165:K180",
  "Nifty IT": "B185:K195",
  "Nifty Media": "B205:K215",
  "Nifty Metals": "B222:K237",
  "Nifty Pharma": "B240:K260",
  "Nifty Reality": "B265:K275",
  "Nifty Consumption": "B286:K301",
  "Nifty Energy": "B308:K323",
  "Nifty PSU Banks": "B329:K341",
  "Nifty Infra": "B350:K380",
};

const ALL_SECTORS = Object.keys(sectorRanges);

function sortByRank(data) {
  if (!data || data.length < 2) return data;
  const rankIdx = data[0].findIndex((col) => col.toLowerCase().includes("rank"));
  if (rankIdx === -1) return data;
  return [
    data[0],
    ...data.slice(1).sort((a, b) => Number(a[rankIdx]) - Number(b[rankIdx])),
  ];
}

export default function SectorStockAnalysisTab() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSector, setSelectedSector] = useState(ALL_SECTORS[0]);

  // Sector performance data range (update if needed)
  const sectorPerformanceDataRaw = useSheetRange("Copy", "L2:U15");
  const sectorPerformanceData = sortByRank(sectorPerformanceDataRaw);

  // Stock data for selected sector (all mapped to same range as per request)
  const stockDataRaw = useSheetRange("Copy", sectorRanges[selectedSector]);
  const stockData = sortByRank(stockDataRaw);

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ maxWidth: 1150, mx: "auto", textAlign: "center" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          centered
          sx={{ ".MuiTab-root": { fontSize: 20, fontWeight: 700, minWidth: 180 } }}
        >
          <Tab label="Sector Performance" />
          <Tab label="Stock Performance" />
        </Tabs>
        {activeTab === 1 && (
          <Box sx={{ margin: "16px 0" }}>
            <SectorStockDropdown value={selectedSector} onChange={setSelectedSector} />
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <div style={{ width: "100%", maxWidth: 980 }}>
          {activeTab === 0 && (
            <ProfessionalTable
              title="Sector Performance"
              headers={sectorPerformanceData?.[0] || []}
              rows={sectorPerformanceData?.length > 1 ? sectorPerformanceData.slice(1) : []}
              tableType="sector-performance"
            />
          )}
          {activeTab === 1 && (
            <ProfessionalTable
              title={`Stock Performance - ${selectedSector}`}
              headers={stockData?.[0] || []}
              rows={stockData?.length > 1 ? stockData.slice(1) : []}
              tableType="stock-performance"
            />
          )}
        </div>
      </Box>
    </Box>
  );
}
