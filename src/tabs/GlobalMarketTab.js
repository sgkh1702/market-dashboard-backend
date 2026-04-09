import React from "react";
import ProfessionalTable from "../components/ProfessionalTable";

const SHEET_ID = "1t_AAtFwWPnqeNoVwDFbV8rtCIEXwQ8e3kLFHoRSlre0";
const API_KEY = "AIzaSyB26mEZ7Lh-eS0npTPiGgT9r9hwdthUJQ0";
const TAB = "Dashboard";

function useSheetRange(sheetName, range) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`
    )
      .then(res => res.json())
      .then(res => setData(res.values || []))
      .catch(() => setData([]));
  }, [sheetName, range]);
  return data;
}

export default function GlobalMarketTab() {
  const broaderData = useSheetRange(TAB, "C6:F10");
  const sectorialData = useSheetRange(TAB, "H6:K18");
  const usMarketData = useSheetRange(TAB, "M6:P10");
  const asianMarketData = useSheetRange(TAB, "M13:P16");

  if (
    !broaderData || !Array.isArray(broaderData) || broaderData.length === 0 ||
    !sectorialData || !Array.isArray(sectorialData) || sectorialData.length === 0 ||
    !usMarketData || !Array.isArray(usMarketData) || usMarketData.length === 0 ||
    !asianMarketData || !Array.isArray(asianMarketData) || asianMarketData.length === 0
  ) {
    return <div>Loading data from Google Sheets...</div>;
  }

  const percentChangeIndex = sectorialData[0].findIndex(
    (header) =>
      header.trim().replace(/\s+/g, '').toLowerCase() === "%change"
  );

  const sortedSectorialRows = [...sectorialData.slice(1)].sort((a, b) => {
    const valA = parseFloat(a[percentChangeIndex]) || 0;
    const valB = parseFloat(b[percentChangeIndex]) || 0;
    return valB - valA;
  });

  return (
    <div style={{
      width: "100%",
      maxWidth: "1600px",
      margin: "32px auto",
      padding: "0 10px"
    }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 30,
          flexWrap: "wrap"
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <ProfessionalTable
            title="Broader Indices"
            headers={broaderData[0]}
            rows={broaderData.slice(1)}
            tableType="global-market"
          />
        </div>

        <div style={{ flex: 1.3, minWidth: 340 }}>
          <ProfessionalTable
            title="Sectorial Indices"
            headers={sectorialData[0]}
            rows={sortedSectorialRows}
            tableType="global-market"
          />
        </div>

        <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 24 }}>
          <ProfessionalTable
            title="US Markets"
            headers={usMarketData[0]}
            rows={usMarketData.slice(1)}
            tableType="global-market"
          />
          <ProfessionalTable
            title="Asian Markets"
            headers={asianMarketData[0]}
            rows={asianMarketData.slice(1)}
            tableType="global-market"
          />
        </div>
      </div>
    </div>
  );
}
