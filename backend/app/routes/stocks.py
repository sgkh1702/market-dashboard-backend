from fastapi import APIRouter, HTTPException, Query

from app.models.stock_research import StockResearchMiniResponse
from app.services.nifty500_service import search_nifty500, get_stock_meta
from app.services.research_data_service import get_stock_research_data

router = APIRouter(prefix="/api/stocks", tags=["stocks"])

@router.get("/search")
async def search_stocks(q: str = Query(..., min_length=1)):
    try:
        return search_nifty500(q, limit=20)
    except Exception as e:
        return {
            "error": str(e),
            "query": q
        }
@router.get("/{symbol}/research", response_model=StockResearchMiniResponse)
async def get_stock_research(symbol: str):
    meta = get_stock_meta(symbol)
    if not meta:
        raise HTTPException(status_code=404, detail="Symbol not found in Nifty 500 list")

    try:
        return get_stock_research_data(symbol, meta, force_refresh=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}/refresh", response_model=StockResearchMiniResponse)
async def refresh_stock_research(symbol: str):
    meta = get_stock_meta(symbol)
    if not meta:
        raise HTTPException(status_code=404, detail="Symbol not found in Nifty 500 list")

    try:
        return get_stock_research_data(symbol, meta, force_refresh=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))