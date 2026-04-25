from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CompanyMini(BaseModel):
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    marketCapCr: Optional[float] = None
    description: Optional[str] = None


class OverviewMini(BaseModel):
    cmp: Optional[float] = None
    change: Optional[float] = None
    changePercent: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    prevClose: Optional[float] = None
    week52High: Optional[float] = None
    week52Low: Optional[float] = None


class TechnicalMini(BaseModel):
    sma20: Optional[float] = None
    sma50: Optional[float] = None
    sma200: Optional[float] = None
    cmpVs20Sma: Optional[bool] = None
    cmpVs50Sma: Optional[bool] = None
    cmpVs200Sma: Optional[bool] = None
    rsi14: Optional[float] = None
    trendLabel: Optional[str] = None
    trendScore: Optional[int] = None


class FinancialMini(BaseModel):
    pe: Optional[float] = None
    pb: Optional[float] = None
    roe: Optional[float] = None
    roce: Optional[float] = None
    debtToEquity: Optional[float] = None
    salesGrowthYoY: Optional[float] = None
    currentRatio: Optional[float] = None
    netMargin: Optional[float] = None
    operatingMargin: Optional[float] = None


class ForensicMini(BaseModel):
    # Old summary fields you no longer need
    score: Optional[int] = None
    grade: Optional[str] = None

    # Metric fields that your backend now builds
    cfoPat: Optional[float] = None
    debtEquity: Optional[float] = None
    opmPrev: Optional[float] = None
    opmCurrent: Optional[float] = None
    recvDaysPrev: Optional[float] = None
    recvDaysCurrent: Optional[float] = None
    invDaysPrev: Optional[float] = None
    invDaysCurrent: Optional[float] = None
    pledgePct: Optional[float] = None


class CandlePoint(BaseModel):
    t: int
    o: float
    h: float
    l: float
    c: float
    v: float


class ChartMini(BaseModel):
    resolution: str
    range: str
    series: List[CandlePoint] = []


class StockResearchMiniResponse(BaseModel):
    symbol: str
    exchange: Optional[str] = "NSE"
    asOf: datetime
    company: CompanyMini
    overview: OverviewMini
    technical: TechnicalMini
    financial: FinancialMini
    forensic: ForensicMini
    chart: ChartMini