import React from "react";
import ProfessionalTable from "../components/ProfessionalTable";
import CircularProgress from "@mui/material/CircularProgress";
import useSheetRange from "../hooks/useSheetRange";

export default function MarketMoversTab() {
  // Top Gainers ranges from "scanner"
  const largecapGainers = useSheetRange("scanner", "B110:F120");
  const midcapGainers = useSheetRange("scanner", "H110:L120");
  const smallcapGainers = useSheetRange("scanner", "N110:R120");

  // Top Losers ranges from "scanner sheet"
  const largecapLosers = useSheetRange("scanner", "B125:F135");
  const midcapLosers = useSheetRange("scanner", "H125:L135");
  const smallcapLosers = useSheetRange("scanner", "N125:R135");

  // Loading state - wait for all data
  if (!largecapGainers || !midcapGainers || !smallcapGainers ||
      !largecapLosers || !midcapLosers || !smallcapLosers) {
    return <CircularProgress />;
  }

  const containerStyle = {
    width: "100%",
    maxWidth: 1400,
    margin: "0 auto",
    padding: "24px 12px",
  };

  const sectionStyle = {
    marginBottom: 32,
  };

  const processTableData = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { headers: [], rows: [] };
    }
    
    const safeHeaders = Array.isArray(data[0]) ? 
      data[0].map(h => h || '') : 
      [];
    const safeRows = data.length > 1 ? 
      data.slice(1).filter(row => Array.isArray(row)) : 
      [];
      
    return { headers: safeHeaders, rows: safeRows };
  };

  return (
    <div style={containerStyle}>
      {/* Top Gainers Section */}
      <div style={sectionStyle}>
        <h3 style={{ 
          textAlign: "center", 
          marginBottom: 24, 
          color: "#2196F3",
          fontSize: 24,
          fontWeight: 700
        }}>
          📈 Top Gainers
        </h3>
        <div
  	 style={{
    	   display: "flex",
           justifyContent: "space-between",
	   alignItems: "flex-start",
    	   gap: 24,          // more space between tables
    	 }}
	>
          <ProfessionalTable
            title="Large-cap"
            {...processTableData(largecapGainers)}
            tableType="market-mover"
          />
          <ProfessionalTable
            title="Mid-cap"
            {...processTableData(midcapGainers)}
            tableType="market-mover"
          />
          <ProfessionalTable
            title="Small-cap"
            {...processTableData(smallcapGainers)}
            tableType="market-mover"
          />
        </div>
      </div>

      {/* Top Losers Section */}
      <div style={sectionStyle}>
        <h3 style={{ 
          textAlign: "center", 
          marginBottom: 24, 
          color: "#F44336",
          fontSize: 24,
          fontWeight: 700
        }}>
          📉 Top Losers
        </h3>
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
  }}
>

          <ProfessionalTable
            title="Large-cap"
            {...processTableData(largecapLosers)}
            tableType="market-mover"
          />
          <ProfessionalTable
            title="Mid-cap"
            {...processTableData(midcapLosers)}
            tableType="market-mover"
          />
          <ProfessionalTable
            title="Small-cap"
            {...processTableData(smallcapLosers)}
            tableType="market-mover"
          />
        </div>
      </div>
    </div>
  );
}
