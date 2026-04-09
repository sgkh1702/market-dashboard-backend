import React, { useState } from "react";
import { Container, Tabs, Tab, Typography, Box } from "@mui/material";

function StockResearchInput() {
  const [stock, setStock] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (stock.trim() === "") {
      alert("Please enter a valid stock symbol");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/set-symbol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: stock.trim().toUpperCase() })
      });

      if (response.ok) {
        alert("Stock symbol updated successfully");
        setStock("");
      } else {
        alert("Failed to update stock symbol");
      }
    } catch (error) {
      alert(`Error updating stock symbol: ${error.message}`);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Stock Research Input</Typography>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="Enter Stock Symbol e.g. ABB"
          style={{ padding: 8, fontSize: 16, width: 180 }}
        />
        <button type="submit" style={{ marginLeft: 10, padding: "8px 16px", fontSize: 16 }}>
          Update
        </button>
      </form>
    </Box>
  );
}

export default function App() {
  const [value, setValue] = React.useState(0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Market Dashboard</Typography>
      <Tabs value={value} onChange={(e, val) => setValue(val)} centered variant="fullWidth">
        <Tab label="Global Market" />
        <Tab label="Market Movers" />
        <Tab label="Scanners" />
        <Tab label="FNO Pulse" />
        <Tab label="Stock Research" />
      </Tabs>

      {value === 4 && <StockResearchInput />}
    </Container>
  );
}
