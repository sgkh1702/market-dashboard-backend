import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";

// ------------------ STYLE CONSTANTS -------------------
const columnStyle = {
  flex: 1,
  minWidth: 260,
  maxWidth: 360,
  margin: "0 6px"
};
const cardStyle = {
  background: "#f8fafc",
  borderRadius: 8,
  padding: "14px 14px 8px 14px",
  boxShadow: "0 2px 6px #e6e9f3",
  marginBottom: 14
};
const headingStyle = {
  fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
  fontWeight: 700,
  margin: "0 0 12px 0",
  color: "#17559c",
  letterSpacing: "0.3px"
};
const tableStyle = {
  marginTop: 8,
  width: "100%",
  fontSize: "0.97rem",
  borderCollapse: "collapse",
  background: "#fff"
};
const thStyle = {
  textAlign: "left",
  fontWeight: 700,
  borderBottom: "2px solid #e0e3eb",
  padding: "2px 8px",
  fontSize: "0.98em",
  background: "#edf1fa"
};
const tdStyle = {
  borderBottom: "1px solid #f0f4f9",
  padding: "2px 8px",
  fontSize: "0.98em",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums"
};
const tdHeaderStyle = {
  ...tdStyle,
  textAlign: "left",
  color: "#194060",
  fontWeight: 600
};

const displayToDataKey = {};

// ------------ HELPERS -------------
function formatNumberColor(value) {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(String(value).replace(/,/g, ""));
  const formatted = num.toLocaleString("en-IN");
  let color = "";
  if (num > 0) color = "green";
  else if (num < 0) color = "red";
  return <span style={{ color }}>{formatted}</span>;
}

const DataTable = ({ title, data, columns }) => (
  <table style={tableStyle}>
    <thead>
      <tr>
        <th style={thStyle}>{title}</th>
        {columns.slice(1).map((col) => (
          <th key={col} style={thStyle}>
            {col}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.isArray(data) && data.length > 0 ? (
        data.map((row, idx) => (
          <tr key={idx}>
            <td style={tdHeaderStyle}>{row[columns[0]]}</td>
            {columns.slice(1).map((col) => {
              const key = displayToDataKey[col] || col;
              const value = row[key];
              return (
                <td key={col} style={tdStyle}>
                  {typeof value === "number" ||
                  (!isNaN(Number(String(value).replace(/,/g, ""))) &&
                    value !== "")
                    ? formatNumberColor(value)
                    : value}
                </td>
              );
            })}
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={columns.length} style={tdStyle}>
            No Data
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

// parse DD/MM/YYYY safely
const parseDdMmYyyy = (str) => {
  if (!str) return null;
  const parts = String(str).split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (isNaN(d.getTime())) return null;
  return d;
};

// sort ascending by Date field
const sortByDateAsc = (arr) =>
  [...arr].sort((a, b) => {
    const da = parseDdMmYyyy(a.Date);
    const db = parseDdMmYyyy(b.Date);
    if (!da || !db) return 0;
    return da - db;
  });

// ----------------- MAIN TAB COMPONENT -----------------
const FiiDiiTab = ({
  indexFutures = [],
  indexFuturesPosition = [],
  stockFutures = [],
  stockFuturesPosition = [],
  historicalNet = [],
  niftyBniftyNet = [],
  fiiStatistics = []
}) => {
  const sortedHistoricalNet = sortByDateAsc(historicalNet);
  const sortedNiftyBnifty = sortByDateAsc(niftyBniftyNet);

  const cleanedIndexFutures = indexFutures.map((r) => ({
    ...r,
    Long: Number((r.Long || "0").toString().replace(/,/g, "")),
    Short: Number((r.Short || "0").toString().replace(/,/g, ""))
  }));

  const cleanedStockFutures = stockFutures.map((r) => ({
    ...r,
    Long: Number((r.Long || "0").toString().replace(/,/g, "")),
    Short: Number((r.Short || "0").toString().replace(/,/g, ""))
  }));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: "8px",
        justifyContent: "center",
        alignItems: "flex-start",
        width: "100%",
        maxWidth: "1800px",
        margin: "0 auto"
      }}
    >
      {/* COLUMN 1 */}
      <div style={columnStyle}>
        <div style={cardStyle}>
          <div style={headingStyle}>Index Futures (Client-wise)</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={cleanedIndexFutures} layout="vertical">
              <XAxis
                type="number"
                tickFormatter={(v) => Number(v).toLocaleString("en-IN")}
              />
              <YAxis dataKey="Client Type" type="category" />
              <Tooltip formatter={(v) => Number(v).toLocaleString("en-IN")} />
              <Legend />
              <Bar dataKey="Long" fill="#1976d2" />
              <Bar dataKey="Short" fill="#d32f2f" />
            </BarChart>
          </ResponsiveContainer>
          <DataTable
            title="Index Future"
            data={indexFutures}
            columns={["Client Type", "Long", "Short"]}
          />
        </div>

        <div style={cardStyle}>
          <div style={headingStyle}>Index Futures Position</div>
          <DataTable
            title="Index Future"
            data={indexFuturesPosition}
            columns={["Position", "Long", "Short"]}
          />
        </div>
      </div>

      {/* COLUMN 2 */}
      <div style={columnStyle}>
        <div style={cardStyle}>
          <div style={headingStyle}>Stock Futures (Client-wise)</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={cleanedStockFutures} layout="vertical">
              <XAxis
                type="number"
                tickFormatter={(v) => Number(v).toLocaleString("en-IN")}
              />
              <YAxis dataKey="Client Type" type="category" />
              <Tooltip formatter={(v) => Number(v).toLocaleString("en-IN")} />
              <Legend />
              <Bar dataKey="Long" fill="#1976d2" />
              <Bar dataKey="Short" fill="#d32f2f" />
            </BarChart>
          </ResponsiveContainer>
          <DataTable
            title="Stock Future"
            data={stockFutures}
            columns={["Client Type", "Long", "Short"]}
          />
        </div>

        <div style={cardStyle}>
          <div style={headingStyle}>Stock Futures Position</div>
          <DataTable
            title="Stock Future"
            data={stockFuturesPosition}
            columns={["Position", "Long", "Short"]}
          />
        </div>
      </div>

      {/* COLUMN 3 */}
      <div style={columnStyle}>
        <div style={cardStyle}>
          <div style={headingStyle}>Historical Net FII Positions</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={sortedHistoricalNet}>
              <XAxis dataKey="Date" />
              <YAxis
                tickFormatter={(v) => Number(v).toLocaleString("en-IN")}
              />
              <Tooltip formatter={(v) => Number(v).toLocaleString("en-IN")} />
              <CartesianGrid stroke="#e9eef2" />
              <Line
                type="monotone"
                dataKey="difference(Future Index Lor - Future Index Shr)"
                stroke="#388e3c"
                strokeWidth={2}
                dot={true}
              />
            </LineChart>
          </ResponsiveContainer>
          <DataTable
            title="Date"
            data={sortedHistoricalNet}
            columns={[
              "Date",
              "Future Index Lor",
              "Future Index Shr",
              "difference(Future Index Lor - Future Index Shr)"
            ]}
          />
        </div>
      </div>

      {/* COLUMN 4 */}
      <div style={columnStyle}>
        <div style={cardStyle}>
          <div style={headingStyle}>FII Statistics</div>
          <table style={{ ...tableStyle, fontSize: "0.95rem" }}>
            <thead>
              <tr>
                <th style={thStyle}>Instrument</th>
                <th style={thStyle}>Rs in Cr</th>
              </tr>
            </thead>
            <tbody>
              {fiiStatistics.map((item, i) => (
                <tr key={i}>
                  <td style={tdHeaderStyle}>{item["FII Statistics"]}</td>
                  <td style={tdStyle}>
                    {formatNumberColor(item["Rs in Cr"])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              ...headingStyle,
              fontSize: "1.06rem",
              marginTop: 12
            }}
          >
            Nifty/Banknifty Net
          </div>

          <table style={{ ...tableStyle, fontSize: "0.93rem" }}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>NIFTY FUTURES</th>
                <th style={thStyle}>BANKNIFTY FUTURES</th>
              </tr>
            </thead>
            <tbody>
              {sortedNiftyBnifty.map((row, i) => (
                <tr key={i}>
                  <td style={tdHeaderStyle}>{row.Date}</td>
                  <td style={tdStyle}>
                    {formatNumberColor(row["NIFTY FUTURES"])}
                  </td>
                  <td style={tdStyle}>
                    {formatNumberColor(row["BANKNIFTY FUTURES"])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FiiDiiTab;
