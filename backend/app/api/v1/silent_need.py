from typing import List, Optional
from fastapi import APIRouter, Query, Path
from app.db.bigquery_client import db
from app.services.silent_need_service import silent_need_engine
from app.schemas.response_schemas import BaseAPIResponse, SilentNeedSignalItem
from app.core.exceptions import GeoNotFoundException

router = APIRouter(prefix="/silent-need", tags=["Silent Need Engine"])

@router.get("", response_model=BaseAPIResponse[List[SilentNeedSignalItem]])
async def list_silent_need_signals(
    category: Optional[str] = Query(None, description="Filter by sector"),
    min_confidence: float = Query(0.70, description="Minimum confidence filter")
):
    """
    Returns detected Potential Silent Need Signals where high infrastructure deficit
    and demographic exposure coexist with low citizen voice due to digital barriers.
    """
    signals = silent_need_engine.get_all_signals(category=category)
    filtered = [
        SilentNeedSignalItem(**s) for s in signals
        if s.get("signal_confidence", 0.0) >= min_confidence
    ]

    return BaseAPIResponse(
        message=f"Retrieved {len(filtered)} potential silent need signals (requires administrative validation)",
        data=filtered
    )

@router.post("/evaluate/{geo_id}", response_model=BaseAPIResponse[List[SilentNeedSignalItem]])
async def evaluate_geo_silent_need(
    geo_id: str = Path(..., description="Target Census LGD or Geo ID to evaluate")
):
    """
    Executes real-time mathematical triangulation on a region's infrastructure deficit,
    demographics, digital access index, and citizen reporting rate to detect silent need.
    """
    geos = [g for g in db.get_records("geography") if g.get("geo_id") == geo_id]
    if not geos:
        raise GeoNotFoundException(geo_id)

    signals = await silent_need_engine.evaluate_region_silent_need(geo_id)
    items = [SilentNeedSignalItem(**s) for s in signals]

    return BaseAPIResponse(
        message=f"Evaluated {geo_id}: Found {len(items)} potential silent need signals",
        data=items
    )
