import React, { useEffect, useRef, useState } from "react";
import { searchStocks } from "../../services/stockApi";

export default function StockSearchBox({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const selectingRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectingRef.current) return;
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchStocks(trimmed);
        const items = Array.isArray(data) ? data : [];
        setResults(items);
        setOpen(true);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectItem = (item) => {
    selectingRef.current = true;
    onSelect(item);
    setQuery(`${item.symbol} - ${item.name || item.description || ""}`);
    setResults([]);
    setOpen(false);
    setTimeout(() => {
      selectingRef.current = false;
    }, 0);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div
      className="stock-search-box"
      ref={boxRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "visible",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          minHeight: "58px",
          padding: "0 12px 0 14px",
          border: "1px solid #bfdbfe",
          borderRadius: "16px",
          background: "#ffffff",
          boxShadow: "0 4px 14px rgba(37, 99, 235, 0.08)",
          gap: "10px",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: "18px",
            color: "#2563eb",
            flexShrink: 0,
          }}
        >
          ⌕
        </span>

        <input
          ref={inputRef}
          type="text"
          placeholder="Search by company or symbol..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setOpen(true);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            height: "54px",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: "16px",
            fontWeight: 500,
            color: "#111827",
            lineHeight: "1.4",
          }}
        />

        {loading && (
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Searching...
          </div>
        )}

        {query.trim().length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            title="Clear"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "999px",
              border: "1px solid #dbe3ea",
              background: "#f8fafc",
              color: "#475569",
              fontSize: "18px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              padding: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      {!loading && open && results.length > 0 && (
        <div
          className="search-results"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #dbeafe",
            borderRadius: "14px",
            boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
            zIndex: 9999,
            overflow: "hidden",
            maxHeight: "320px",
            overflowY: "auto",
          }}
        >
          {results.map((item, index) => (
            <button
              key={`${item.symbol}-${index}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectingRef.current = true;
              }}
              onClick={() => handleSelectItem(item)}
              style={{
                width: "100%",
                border: "none",
                borderBottom:
                  index !== results.length - 1 ? "1px solid #eff6ff" : "none",
                background: "#ffffff",
                padding: "12px 14px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#111827",
                      lineHeight: "1.4",
                    }}
                  >
                    {item.name || item.description || item.symbol}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "2px",
                      lineHeight: "1.4",
                    }}
                  >
                    {item.sector || "Sector not available"}
                  </div>
                </div>

                <div
                  style={{
                    flexShrink: 0,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#1d4ed8",
                    background: "#eff6ff",
                    border: "1px solid #dbeafe",
                    borderRadius: "999px",
                    padding: "4px 8px",
                  }}
                >
                  {item.symbol}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && open && query.trim().length > 0 && results.length === 0 && (
        <div
          className="search-results"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #dbeafe",
            borderRadius: "14px",
            boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            No matching company found
          </div>
        </div>
      )}
    </div>
  );
}