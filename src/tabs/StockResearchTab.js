import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Autocomplete,
} from "@mui/material";

const cardStyle = {
  p: 2,
  borderRadius: 3,
  boxShadow: "0 2px 10px rgba(80,120,200,0.09)",
  border: "1.5px solid #d6deeb",
  background: "#fff",
};

const API_BASE =
  process.env.REACT_APP_API_BASE || "https://market-dashboard-backend-4k6w.onrender.com";

function getNumber(value) {
  if (value === null || value === undefined || value === "N/A") return null;
  const num = parseFloat(String(value).replace(/[,%₹,\s]/g, ""));
  return Number.isNaN(num) ? null : num;
}

function valueColor(label, value) {
  const num = getNumber(value);
  if (num === null) return "#1f2937";

  if (["ROE (%)", "ROA (%)", "Revenue Growth (%)", "Dividend Yield (%)"].includes(label)) {
    return num > 0 ? "#15803d" : "#dc2626";
  }

  if (label === "Earnings Growth (%)") {
    return num >= 0 ? "#15803d" : "#dc2626";
  }

  if (label === "Debt to Equity") {
    if (num <= 0.5) return "#15803d";
    if (num <= 1.5) return "#b45309";
    return "#dc2626";
  }

  if (label === "Risk Score") {
    if (num <= 2) return "#15803d";
    if (num <= 5) return "#b45309";
    return "#dc2626";
  }

  if (
    ["Technical Score", "Fundamental Score", "Forensic Score", "Total Score", "Confidence"].includes(label)
  ) {
    if (num >= 7) return "#15803d";
    if (num >= 4) return "#b45309";
    return "#dc2626";
  }

  return "#1f2937";
}

function InfoCard({ title, children, sx = {} }) {
  return (
    <Paper sx={{ ...cardStyle, ...sx }}>
      <Typography variant="h6" fontWeight={800} mb={1.2} color="#1e293b">
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function LabelValue({ label, value }) {
  return (
    <Typography variant="body2" sx={{ mb: 0.75, color: "#111827" }}>
      <b>{label}:</b>{" "}
      <Box component="span" sx={{ color: valueColor(label, value), fontWeight: 700 }}>
        {value ?? "N/A"}
      </Box>
    </Typography>
  );
}

export default function StockResearchTab() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [searchInput, setSearchInput] = useState("");
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getYahooFinanceLink = (sym) => {
    if (!sym) return "#";
    const clean = sym.toUpperCase().replace(/\.NS|\.BO/g, "").trim();
    return `https://finance.yahoo.com/quote/${clean}.NS/`;
  };

  const getScreenerLink = (sym) => {
    if (!sym) return "#";
    const clean = sym.toUpperCase().replace(/\.NS|\.BO/g, "").trim();
    return `https://www.screener.in/company/${clean}/consolidated/`;
  };

  const getTradingViewLink = (sym) => {
    if (!sym) return "#";
    const clean = sym.toUpperCase().replace(/\.NS|\.BO/g, "").trim();
    return `https://www.tradingview.com/chart/?symbol=NSE:${clean}`;
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadSuggestions = async () => {
      const q = searchInput.trim();

      if (q.length < 3) {
        setSearchOptions([]);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);

      try {
        const res = await fetch(
          `${API_BASE}/search-symbols?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const json = await res.json();
        setSearchOptions(Array.isArray(json) ? json : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Autocomplete error:", err);
          setSearchOptions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    };

    const timer = setTimeout(loadSuggestions, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchInput]);

  const analyzeStock = async (selectedSymbol = symbol) => {
    if (!selectedSymbol?.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/analyze/${selectedSymbol.trim().toUpperCase()}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch stock analysis");
      }

      const json = await res.json();
      setData(json);
      setSymbol(selectedSymbol.trim().toUpperCase());
    } catch (err) {
      setError(err.message || "Error fetching stock analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={1}>
        Stock Research
      </Typography>

      <Typography variant="body2" sx={{ mb: 2, color: "#64748b", fontWeight: 500 }}>
        Data extracted using: YFinance
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: { xs: "stretch", md: "flex-start" },
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Autocomplete
          freeSolo
          options={searchOptions}
          loading={searchLoading}
          value={selectedOption}
          filterOptions={(x) => x}
          sx={{
            width: { xs: "100%", md: 240 },
            flexShrink: 0,
          }}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            return option?.symbol || "";
          }}
          isOptionEqualToValue={(option, value) =>
            option?.symbol === value?.symbol
          }
          onInputChange={(event, newInputValue) => {
            setSearchInput(newInputValue);
            if (/^[A-Za-z]+$/.test(newInputValue.trim())) {
              setSymbol(newInputValue.toUpperCase());
            }
          }}
          onChange={(event, newValue) => {
            setSelectedOption(
              typeof newValue === "object" && newValue ? newValue : null
            );

            if (typeof newValue === "string") {
              setSymbol(newValue.toUpperCase());
              setSearchInput(newValue.toUpperCase());
            } else if (newValue?.symbol) {
              setSymbol(newValue.symbol.toUpperCase());
              setSearchInput(newValue.symbol.toUpperCase());
            }
          }}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  {option.symbol}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.name}
                </Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search company"
              size="small"
              helperText="Type 3 letters"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading ? <CircularProgress size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Paper
          variant="outlined"
          sx={{
            minHeight: 40,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            minWidth: { xs: "100%", md: 500 },
            background: "#e0f2fe",
            border: "1.5px solid #38bdf8",
            display: "flex",
            alignItems: "center",
            gap: 3,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Selected Symbol
            </Typography>
            <Typography variant="body2" fontWeight={800} color="#0369a1">
              {symbol || "N/A"}
            </Typography>
          </Box>

          <Typography
            component="a"
            href={getTradingViewLink(symbol)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "#1565c0",
              textDecoration: "underline",
              fontWeight: 800,
              fontSize: "0.95rem",
            }}
          >
            TradingView
          </Typography>

          <Typography
            component="a"
            href={getYahooFinanceLink(symbol)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "#0f766e",
              textDecoration: "underline",
              fontWeight: 800,
              fontSize: "0.95rem",
            }}
          >
            Yahoo Finance
          </Typography>

          <Typography
            component="a"
            href={getScreenerLink(symbol)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "#7c3aed",
              textDecoration: "underline",
              fontWeight: 800,
              fontSize: "0.95rem",
            }}
          >
            Screener
          </Typography>
        </Paper>

        <Button
          variant="contained"
          onClick={() => analyzeStock(symbol)}
          disabled={loading || !symbol.trim()}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            minWidth: 110,
            height: 40,
          }}
        >
          Analyze
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <CircularProgress size={22} />
          <Typography>Loading analysis...</Typography>
        </Box>
      )}

      {error && (
        <Paper
          sx={{
            ...cardStyle,
            mb: 2,
            borderColor: "#fca5a5",
            background: "#fef2f2",
          }}
        >
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {data && (
        <>
          <InfoCard title="Business Profile" sx={{ mb: 2, background: "#ffffff", border: "1.5px solid #cbd5e1" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, minWidth: 0, background: "#f8fafc", borderColor: "#cbd5e1" }}>
                <Typography variant="caption" color="text.secondary">
                  Company
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                  {data.profile?.company_name || data.symbol}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, minWidth: 0, background: "#f8fafc", borderColor: "#cbd5e1" }}>
                <Typography variant="caption" color="text.secondary">
                  Sector
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {data.profile?.sector || "N/A"}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, minWidth: 0, background: "#f8fafc", borderColor: "#cbd5e1" }}>
                <Typography variant="caption" color="text.secondary">
                  Industry
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                  {data.profile?.industry || "N/A"}
                </Typography>
              </Paper>
            </Box>

            <Box
              sx={{
                border: "1.5px solid #cbd5e1",
                borderRadius: 2,
                p: 1.5,
                maxHeight: 90,
                overflowY: "auto",
                background: "#f8fafc",
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                <b>Business:</b>{" "}
                {data.profile?.business || "Business description not available."}
              </Typography>
            </Box>
          </InfoCard>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2,
              mb: 2,
            }}
          >
            <InfoCard title="Technical" sx={{ background: "#dbeafe", border: "1.5px solid #60a5fa" }}>
              <LabelValue label="Price" value={data.technical?.price} />
              <LabelValue label="20 SMA" value={data.technical?.sma20} />
              <LabelValue label="50 SMA" value={data.technical?.sma50} />
              <LabelValue label="200 SMA" value={data.technical?.sma200} />
              <LabelValue label="RSI" value={data.technical?.rsi} />
              <LabelValue label="Volume Trend" value={data.technical?.volume_trend} />
            </InfoCard>

            <InfoCard title="Fundamentals" sx={{ background: "#fef3c7", border: "1.5px solid #f59e0b" }}>
              <LabelValue label="Trailing P/E" value={data.fundamentals?.trailing_pe} />
              <LabelValue label="Price to Book" value={data.fundamentals?.price_to_book} />
              <LabelValue label="ROE (%)" value={data.fundamentals?.roe} />
              <LabelValue label="ROA (%)" value={data.fundamentals?.roa} />
              <LabelValue label="Debt to Equity" value={data.fundamentals?.debt_to_equity} />
              <LabelValue label="Current Ratio" value={data.fundamentals?.current_ratio} />
              <LabelValue label="Revenue Growth (%)" value={data.fundamentals?.revenue_growth} />
              <LabelValue label="Earnings Growth (%)" value={data.fundamentals?.earnings_growth} />
              <LabelValue label="Dividend Yield (%)" value={data.fundamentals?.dividend_yield} />
              <LabelValue label="Market Cap (Cr)" value={data.fundamentals?.market_cap_cr} />
            </InfoCard>

            <InfoCard title="Forensic" sx={{ background: "#ffe4e6", border: "1.5px solid #fb7185" }}>
              <LabelValue label="Risk Score" value={data.forensic?.risk_score} />
              <Box component="ul" sx={{ pl: 2.2, mt: 1, mb: 0 }}>
                {(data.forensic?.flags || []).map((item, idx) => (
                  <Typography
                    key={idx}
                    component="li"
                    variant="body2"
                    sx={{ mb: 0.7, color: "#9f1239", fontWeight: 500 }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </InfoCard>

            <InfoCard title="Scoring" sx={{ background: "#ede9fe", border: "1.5px solid #a78bfa" }}>
              <LabelValue label="Technical Score" value={data.scores?.technical_score} />
              <LabelValue label="Fundamental Score" value={data.scores?.fundamental_score} />
              <LabelValue label="Forensic Score" value={data.scores?.forensic_score} />
              <Typography variant="body1" sx={{ mt: 1.2, fontWeight: 800, color: "#1e293b" }}>
                Total Score:{" "}
                <Box component="span" sx={{ color: valueColor("Total Score", data.scores?.total_score) }}>
                  {data.scores?.total_score ?? "N/A"}
                </Box>
              </Typography>
            </InfoCard>
          </Box>

          <InfoCard title="Brokerage Style View" sx={{ mb: 2, background: "#f8fafc", border: "1.5px solid #94a3b8" }}>
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.7,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                color: "#334155",
              }}
            >
              {data.brokerage?.thesis || "No thesis available."}
            </Typography>
          </InfoCard>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 2,
              mb: 2,
            }}
          >
            <InfoCard title="Positives" sx={{ background: "#dcfce7", border: "1.5px solid #4ade80" }}>
              <Box component="ul" sx={{ pl: 2.2, mb: 0, mt: 0 }}>
                {(data.brokerage?.positives || []).map((item, idx) => (
                  <Typography
                    key={idx}
                    component="li"
                    variant="body2"
                    sx={{ mb: 0.7, color: "#166534", fontWeight: 500 }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </InfoCard>

            <InfoCard title="Risks" sx={{ background: "#ffedd5", border: "1.5px solid #fb923c" }}>
              <Box component="ul" sx={{ pl: 2.2, mb: 0, mt: 0 }}>
                {(data.brokerage?.risks || []).map((item, idx) => (
                  <Typography
                    key={idx}
                    component="li"
                    variant="body2"
                    sx={{ mb: 0.7, color: "#c2410c", fontWeight: 500 }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </InfoCard>

            <InfoCard
              title="Final Decision"
              sx={{
                background: "#cffafe",
                border: "1.5px solid #22d3ee",
              }}
            >
              <LabelValue label="Action" value={data.decision?.action || "N/A"} />
              <LabelValue label="Confidence" value={data.decision?.confidence ?? "N/A"} />
              <Typography variant="body2" sx={{ lineHeight: 1.7, color: "#0f172a" }}>
                {data.decision?.summary || "No summary available."}
              </Typography>
            </InfoCard>
          </Box>
        </>
      )}
    </Box>
  );
}