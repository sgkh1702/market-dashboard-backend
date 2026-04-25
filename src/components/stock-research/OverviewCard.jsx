import React from "react";

export default function OverviewCard({ symbol, company, overview }) {
  return (
    <div className="research-card">
      <h3>{symbol} - {company.name}</h3>
      <p>{company.sector} {company.industry ? `• ${company.industry}` : ""}</p>

      <div className="metric-grid">
        <div><span>CMP</span><strong>{overview.cmp ?? "-"}</strong></div>
        <div><span>Change</span><strong>{overview.change ?? "-"}</strong></div>
        <div><span>Change %</span><strong>{overview.changePercent ?? "-"}</strong></div>
        <div><span>Prev Close</span><strong>{overview.prevClose ?? "-"}</strong></div>
        <div><span>52W High</span><strong>{overview.week52High ?? "-"}</strong></div>
        <div><span>52W Low</span><strong>{overview.week52Low ?? "-"}</strong></div>
      </div>
    </div>
  );
}