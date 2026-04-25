import React, { useState } from "react";
import StockSearchBox from "../components/stock-research/StockSearchBox";
import OverviewCard from "../components/stock-research/OverviewCard";
import TechnicalCard from "../components/stock-research/TechnicalCard";
import FinancialCard from "../components/stock-research/FinancialCard";
import ForensicCard from "../components/stock-research/ForensicCard";
import { fetchStockResearch } from "../services/stockApi";

export default function StockResearchTab() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (stock) => {
    setSelectedStock(stock);
    setLoading(true);
    setError("");

    try {
      const data = await fetchStockResearch(stock.symbol);
      setResearch(data);
    } catch (err) {
      console.error("Research load error:", err);
      setError(`Failed to load stock research for ${stock.symbol}`);
      setResearch(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-research-tab">
      <h2>Stock Research</h2>

      <StockSearchBox onSelect={handleSelect} />

      {selectedStock && !loading && (
        <p style={{ marginTop: "8px", color: "#555" }}>
          Selected: <strong>{selectedStock.symbol}</strong>
          {selectedStock.name ? ` - ${selectedStock.name}` : ""}
        </p>
      )}

      {loading && <p>Loading research...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {research && (
        <div className="research-grid">
          <OverviewCard
            symbol={research.symbol}
            company={research.company}
            overview={research.overview}
          />
          <TechnicalCard technical={research.technical} />
          <FinancialCard financial={research.financial} />
          <ForensicCard forensic={research.forensic} />
        </div>
      )}
    </div>
  );
}