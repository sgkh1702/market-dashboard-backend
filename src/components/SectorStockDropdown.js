import React from "react";

const sectors = [
  "NIFTY 50", "Nifty Auto", "Nifty Bank", "Nifty FMCG", "Nifty IT",
  "Nifty Media", "Nifty Metals", "Nifty Pharma", "Nifty Reality",
  "Nifty Consumption", "Nifty Energy", "Nifty PSU Banks", "Nifty Infra"
];

export default function SectorStockDropdown({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        fontSize: 16,
        minWidth: 190,
        height: 38,
        padding: "6px 12px",
        borderRadius: 6,
        boxShadow: "0 2px 8px #cccccc25",
        outline: "none",
        textAlign: "center"
      }}
    >
      <option value="">Select Sector</option>
      {sectors.map(sector => (
        <option key={sector} value={sector}>
          {sector}
        </option>
      ))}
    </select>
  );
}
