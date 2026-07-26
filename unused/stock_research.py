from __future__ import annotations

from datetime import datetime
from io import StringIO
from typing import Any, Dict, List, Optional

import pandas as pd
import requests
from fastapi import APIRouter
from pydantic import BaseModel, Field

try:
    import yfinance as yf
except Exception:
    yf = None

router = APIRouter(prefix="/api/stock", tags=["stock-research"])

NSE_BASE = "https://www.nseindia.com"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


class InstitutionHolder(BaseModel):
    name: str
    category: str = "Unknown"
    holding_pct: Optional[float] = None
    shares: Optional[float] = None
    qoq_change_pct: Optional[float] = None
    date_reported: Optional[str] = None


class FinancialsBlock(BaseModel):
    revenue_cagr_3y: Optional[float] = None
    revenue_cagr_5y: Optional[float] = None
    pat_cagr_3y: Optional[float] = None
    pat_cagr_5y: Optional[float] = None
    revenue_growth_yoy: Optional[float] = None
    pat_growth_yoy: Optional[float] = None
    roe_latest: Optional[float] = None
    roce_latest: Optional[float] = None
    latest_revenue: Optional[float] = None
    latest_pat: Optional[float] = None
    source: str = "yfinance"


class OwnershipBlock(BaseModel):
    promoter_holding_pct: Optional[float] = None
    promoter_1y_change: Optional[float] = None
    public_holding_pct: Optional[float] = None
    fii_holding_pct: Optional[float] = None
    dii_holding_pct: Optional[float] = None
    institutional_holding_pct: Optional[float] = None
    pledged_pct_of_total: Optional[float] = None
    pledged_pct_of_promoter: Optional[float] = None
    total_encumbered_pct_of_total: Optional[float] = None
    as_on_date: Optional[str] = None
    source: str = "nse"


class GovernanceFlag(BaseModel):
    flag: str
    status: str
    message: str


class ResearchResponse(BaseModel):
    symbol: str
    exchange: str = "NSE"
    generated_at: str
    financials: FinancialsBlock
    ownership: OwnershipBlock
    institutions: List[InstitutionHolder] = Field(default_factory=list)
    governance_flags: List[GovernanceFlag] = Field(default_factory=list)
    notes: List[str] = Field(default_factory=list)


def safe_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip().replace(",", "")
    if s in {"", "-", "--", "None", "nan"}:
        return None
    try:
        return float(s)
    except Exception:
        return None


def pct_change(new: Optional[float], old: Optional[float]) -> Optional[float]:
    if new is None or old is None or old == 0:
        return None
    return ((new - old) / abs(old)) * 100.0


def cagr(series: List[Optional[float]]) -> Optional[float]:
    vals = [v for v in series if v is not None and v > 0]
    if len(vals) < 2:
        return None
    start, end = vals[0], vals[-1]
    periods = len(vals) - 1
    if start <= 0 or periods <= 0:
        return None
    return ((end / start) ** (1 / periods) - 1) * 100.0


def get_yf_ticker(symbol: str):
    if yf is None:
        raise RuntimeError("yfinance is not installed. Run: pip install yfinance")
    yf_symbol = symbol if symbol.endswith(".NS") else f"{symbol}.NS"
    return yf.Ticker(yf_symbol)


def pick_first_existing_row(df: Optional[pd.DataFrame], candidates: List[str]) -> List[Optional[float]]:
    if df is None or df.empty:
        return []
    normalized = {str(idx).strip().lower(): idx for idx in df.index}
    for candidate in candidates:
        key = candidate.strip().lower()
        if key in normalized:
            row = df.loc[normalized[key]]
            values = [safe_float(v) for v in row.tolist()][::-1]
            return values
    return []


def parse_financials(symbol: str, notes: List[str]) -> FinancialsBlock:
    ticker = get_yf_ticker(symbol)

    try:
        income = ticker.get_income_stmt(freq="yearly")
    except Exception as e:
        income = pd.DataFrame()
        notes.append(f"yfinance income statement unavailable: {str(e)}")

    try:
        info = ticker.get_info() or {}
    except Exception as e:
        info = {}
        notes.append(f"yfinance info unavailable: {str(e)}")

    revenue_rows = ["Total Revenue", "Operating Revenue", "Revenue"]
    pat_rows = ["Net Income", "Net Income Common Stockholders", "Normalized Income"]

    yearly_revenue = pick_first_existing_row(income, revenue_rows)
    yearly_pat = pick_first_existing_row(income, pat_rows)

    if not yearly_revenue:
        notes.append("Revenue rows not available from yfinance for this symbol.")
    if not yearly_pat:
        notes.append("PAT rows not available from yfinance for this symbol.")

    revenue_cagr_3y = cagr(yearly_revenue[-4:]) if len(yearly_revenue) >= 4 else None
    revenue_cagr_5y = cagr(yearly_revenue[-6:]) if len(yearly_revenue) >= 6 else None
    pat_cagr_3y = cagr(yearly_pat[-4:]) if len(yearly_pat) >= 4 else None
    pat_cagr_5y = cagr(yearly_pat[-6:]) if len(yearly_pat) >= 6 else None

    revenue_growth_yoy = pct_change(yearly_revenue[-1], yearly_revenue[-2]) if len(yearly_revenue) >= 2 else None
    pat_growth_yoy = pct_change(yearly_pat[-1], yearly_pat[-2]) if len(yearly_pat) >= 2 else None

    roe = safe_float(info.get("returnOnEquity"))
    if roe is not None and abs(roe) <= 1:
        roe *= 100

    roce = safe_float(info.get("returnOnAssets"))
    if roce is not None and abs(roce) <= 1:
        roce *= 100

    return FinancialsBlock(
        revenue_cagr_3y=round(revenue_cagr_3y, 2) if revenue_cagr_3y is not None else None,
        revenue_cagr_5y=round(revenue_cagr_5y, 2) if revenue_cagr_5y is not None else None,
        pat_cagr_3y=round(pat_cagr_3y, 2) if pat_cagr_3y is not None else None,
        pat_cagr_5y=round(pat_cagr_5y, 2) if pat_cagr_5y is not None else None,
        revenue_growth_yoy=round(revenue_growth_yoy, 2) if revenue_growth_yoy is not None else None,
        pat_growth_yoy=round(pat_growth_yoy, 2) if pat_growth_yoy is not None else None,
        roe_latest=round(roe, 2) if roe is not None else None,
        roce_latest=round(roce, 2) if roce is not None else None,
        latest_revenue=yearly_revenue[-1] if yearly_revenue else None,
        latest_pat=yearly_pat[-1] if yearly_pat else None,
        source="yfinance",
    )


class NSEClient:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": UA,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": f"{NSE_BASE}/",
                "Connection": "keep-alive",
            }
        )
        self._warmup()

    def _warmup(self) -> None:
        try:
            self.session.get(f"{NSE_BASE}/", timeout=20)
        except Exception:
            pass

    def get_shareholding_page(self, symbol: str) -> str:
        url = f"{NSE_BASE}/companies-listing/corporate-filings-shareholding-pattern?symbol={symbol}"
        r = self.session.get(url, timeout=30)
        r.raise_for_status()
        return r.text


def load_tables_from_html(html: str) -> List[pd.DataFrame]:
    try:
        tables = pd.read_html(StringIO(html))
        return [df for df in tables if df is not None and not df.empty]
    except Exception:
        return []


def flatten_columns(df: pd.DataFrame) -> List[str]:
    cols = []
    for c in df.columns:
        if isinstance(c, tuple):
            cols.append(" ".join([str(x) for x in c if str(x) != "nan"]).strip().lower())
        else:
            cols.append(str(c).strip().lower())
    return cols


def find_summary_table(tables: List[pd.DataFrame]) -> Optional[pd.DataFrame]:
    for df in tables:
        cols = flatten_columns(df)
        joined = " | ".join(cols)
        if "category" in joined and "shareholding" in joined:
            return df
    return None


def extract_summary_values(df: pd.DataFrame) -> Dict[str, Optional[float]]:
    result = {
        "promoter_holding_pct": None,
        "public_holding_pct": None,
        "institutional_holding_pct": None,
        "as_on_date": None,
    }

    if df is None or df.empty:
        return result

    for _, row in df.iterrows():
        text_row = [str(v).strip().lower() for v in row.tolist()]
        numeric_vals = [safe_float(v) for v in row.tolist() if safe_float(v) is not None]
        if not numeric_vals:
            continue

        whole = " | ".join(text_row)
        if "promoter" in whole and result["promoter_holding_pct"] is None:
            result["promoter_holding_pct"] = numeric_vals[-1]
        elif "public" in whole and result["public_holding_pct"] is None:
            result["public_holding_pct"] = numeric_vals[-1]
        elif "institution" in whole and result["institutional_holding_pct"] is None:
            result["institutional_holding_pct"] = numeric_vals[-1]

    return result


def find_pledge_table(tables: List[pd.DataFrame]) -> Optional[pd.DataFrame]:
    for df in tables:
        cols = flatten_columns(df)
        joined = " | ".join(cols)
        if "pledged" in joined or "encumbered" in joined:
            return df
    return None


def extract_pledge_values(df: Optional[pd.DataFrame]) -> Dict[str, Optional[float]]:
    result = {
        "pledged_pct_of_total": None,
        "pledged_pct_of_promoter": None,
        "total_encumbered_pct_of_total": None,
    }
    if df is None or df.empty:
        return result

    for _, row in df.iterrows():
        whole = " | ".join([str(v).strip().lower() for v in row.tolist()])
        numeric_vals = [safe_float(v) for v in row.tolist() if safe_float(v) is not None]
        if not numeric_vals:
            continue
        if "promoter" in whole:
            result["pledged_pct_of_total"] = numeric_vals[-1]
            break

    return result


def parse_nse_ownership(symbol: str, notes: List[str]) -> OwnershipBlock:
    try:
        client = NSEClient()
        html = client.get_shareholding_page(symbol)
    except Exception as e:
        notes.append(f"NSE page fetch failed: {str(e)}")
        return OwnershipBlock(source="nse")

    tables = load_tables_from_html(html)
    if not tables:
        notes.append("NSE shareholding tables could not be parsed from the page.")
        return OwnershipBlock(source="nse")

    summary_table = find_summary_table(tables)
    pledge_table = find_pledge_table(tables)

    if summary_table is None:
        notes.append("NSE summary shareholding table not found.")
    if pledge_table is None:
        notes.append("NSE pledge/encumbrance table not found.")

    summary = extract_summary_values(summary_table) if summary_table is not None else {}
    pledge = extract_pledge_values(pledge_table)

    return OwnershipBlock(
        promoter_holding_pct=summary.get("promoter_holding_pct"),
        public_holding_pct=summary.get("public_holding_pct"),
        institutional_holding_pct=summary.get("institutional_holding_pct"),
        pledged_pct_of_total=pledge.get("pledged_pct_of_total"),
        pledged_pct_of_promoter=pledge.get("pledged_pct_of_promoter"),
        total_encumbered_pct_of_total=pledge.get("total_encumbered_pct_of_total"),
        as_on_date=summary.get("as_on_date"),
        source="nse",
    )


def parse_institutional_holders_from_yf(symbol: str, notes: List[str]) -> List[InstitutionHolder]:
    try:
        ticker = get_yf_ticker(symbol)
        df = ticker.get_institutional_holders()
    except Exception as e:
        notes.append(f"Institutional holders unavailable from yfinance: {str(e)}")
        return []

    if df is None or len(df) == 0:
        notes.append("Institutional holders not returned by yfinance.")
        return []

    cols = {str(c).lower(): c for c in df.columns}
    holders: List[InstitutionHolder] = []
    for _, row in df.head(5).iterrows():
        holders.append(
            InstitutionHolder(
                name=str(row.get(cols.get("holder", "Holder"), "Unknown")),
                category="Institution",
                holding_pct=safe_float(row.get(cols.get("% out", "% Out"))),
                shares=safe_float(row.get(cols.get("shares", "Shares"))),
                date_reported=str(row.get(cols.get("date reported", "Date Reported"), "")) or None,
            )
        )
    notes.append("Institutional holders are from yfinance and may not map to NSE FII/DII categories.")
    return holders


def generate_governance_flags(financials: FinancialsBlock, ownership: OwnershipBlock) -> List[GovernanceFlag]:
    flags: List[GovernanceFlag] = []

    if ownership.promoter_holding_pct is not None and ownership.promoter_holding_pct < 40:
        flags.append(GovernanceFlag(
            flag="low_promoter_holding",
            status="warning",
            message=f"Promoter holding is {ownership.promoter_holding_pct:.2f}%."
        ))

    if ownership.pledged_pct_of_total is not None:
        if ownership.pledged_pct_of_total >= 20:
            flags.append(GovernanceFlag(
                flag="high_pledge",
                status="danger",
                message=f"Pledged or encumbered shares are {ownership.pledged_pct_of_total:.2f}% of total equity."
            ))
        elif ownership.pledged_pct_of_total > 0:
            flags.append(GovernanceFlag(
                flag="pledge_exists",
                status="warning",
                message=f"Pledged or encumbered shares are {ownership.pledged_pct_of_total:.2f}% of total equity."
            ))

    if financials.revenue_growth_yoy is not None and financials.revenue_growth_yoy < 0:
        flags.append(GovernanceFlag(
            flag="revenue_decline",
            status="info",
            message=f"Latest annual revenue growth is {financials.revenue_growth_yoy:.2f}%."
        ))

    if financials.pat_growth_yoy is not None and financials.pat_growth_yoy < 0:
        flags.append(GovernanceFlag(
            flag="earnings_decline",
            status="info",
            message=f"Latest annual PAT growth is {financials.pat_growth_yoy:.2f}%."
        ))

    return flags


@router.get("/research/{symbol}", response_model=ResearchResponse)
def get_stock_research(symbol: str):
    clean_symbol = symbol.replace(".NS", "").upper()
    notes: List[str] = []

    try:
        financials = parse_financials(clean_symbol, notes)
    except Exception as e:
        financials = FinancialsBlock(source="yfinance")
        notes.append(f"Financial parsing failed: {str(e)}")

    try:
        ownership = parse_nse_ownership(clean_symbol, notes)
    except Exception as e:
        ownership = OwnershipBlock(source="nse")
        notes.append(f"NSE ownership parsing failed: {str(e)}")

    try:
        institutions = parse_institutional_holders_from_yf(clean_symbol, notes)
    except Exception as e:
        institutions = []
        notes.append(f"Institution parsing failed: {str(e)}")

    governance_flags = generate_governance_flags(financials, ownership)

    return ResearchResponse(
        symbol=f"{clean_symbol}.NS",
        generated_at=datetime.utcnow().isoformat() + "Z",
        financials=financials,
        ownership=ownership,
        institutions=institutions,
        governance_flags=governance_flags,
        notes=notes,
    )