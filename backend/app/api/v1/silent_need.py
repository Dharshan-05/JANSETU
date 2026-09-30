from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, Query, Path, HTTPException, status
from app.db.bigquery_client import db, silent_need_repo
from app.services.silent_need_service import silent_need_service, silent_need_engine
from app.schemas.response_schemas import BaseAPIResponse
from app.schemas.silent_need_schemas import SilentNeedSignalItem, SilentNeedSummary
from app.core.exceptions import GeoNotFoundException

router = APIRouter(prefix="/silent-need", tags=["Silent Need Engine"])

@router.get("", response_model=BaseAPIResponse[List[SilentNeedSignalItem]])
async def list_silent_need_signals(
    geo_id: Optional[str] = Query(None, description="Filter by specific geography ID"),
    geo_level: Optional[Union[str, int]] = Query(None, description="Filter by admin level: district, subdistrict"),
    category: Optional[str] = Query(None, description="Filter by infrastructure sector"),
    state_code: Optional[str] = Query(None, description="Filter by state code: TN, UP, MH, TG"),
    district: Optional[str] = Query(None, description="Filter by district name"),
    block: Optional[str] = Query(None, description="Filter by block/taluk name"),
    min_signal_strength: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum analytical signal strength"),
    signal_class: Optional[str] = Query(None, description="Filter by class: STRONG_POTENTIAL, POTENTIAL, NO_SIGNAL"),
    triggered: Optional[bool] = Query(None, description="Filter by triggered flag"),
    min_discrepancy: Optional[float] = Query(None, description="Minimum discrepancy between need and voice"),
    min_infra_deficit: Optional[float] = Query(None, description="Minimum infrastructure deficit threshold"),
    max_digital_access: Optional[float] = Query(None, description="Maximum digital connectivity threshold"),
    min_confidence: Optional[float] = Query(None, description="Backward-compatible filter for signal confidence"),
    limit: int = Query(100, ge=1, le=500, description="Maximum signals to return")
):
    """
    Returns detected Potential Silent Need Signals where high infrastructure deficit
    and demographic exposure coexist with low citizen voice due to digital access barriers.
    All outputs are analytical signals and require administrative field validation.
    """
    # If warehouse is empty, trigger initial deterministic synchronization
    if silent_need_repo.count() == 0:
        silent_need_service.sync_all_signals()

    # Map min_confidence to min_signal_strength if provided
    effective_min_strength = min_signal_strength
    if effective_min_strength is None and min_confidence is not None:
        effective_min_strength = min_confidence

    # Default to triggered signals if neither triggered nor NO_SIGNAL class is specified
    effective_triggered = triggered
    if effective_triggered is None and (not signal_class or signal_class.upper() != "NO_SIGNAL"):
        effective_triggered = True

    records = silent_need_repo.list(
        geo_id=geo_id,
        geo_level=geo_level,
        category=category,
        state_code=state_code,
        district=district,
        block=block,
        min_signal_strength=effective_min_strength,
        signal_class=signal_class,
        triggered=effective_triggered,
        min_discrepancy=min_discrepancy,
        min_infra_deficit=min_infra_deficit,
        max_digital_access=max_digital_access,
        limit=limit
    )

    items = [SilentNeedSignalItem(**r) for r in records]

    return BaseAPIResponse(
        message=f"Retrieved {len(items)} potential silent need signals (requires administrative field validation). AI-Derived Analytical Signal — Not Official Policy.",
        data=items
    )

@router.get("/summary", response_model=BaseAPIResponse[SilentNeedSummary])
async def get_silent_need_summary():
    """
    Returns high-level summary KPIs and distribution telemetry for Potential Silent Need Signals.
    """
    if silent_need_repo.count() == 0:
        silent_need_service.sync_all_signals()

    sum_data = silent_need_repo.summary()
    return BaseAPIResponse(
        message="Silent Need summary metrics retrieved successfully",
        data=SilentNeedSummary(**sum_data)
    )

@router.get("/{signal_id}", response_model=BaseAPIResponse[SilentNeedSignalItem])
async def get_silent_need_detail(signal_id: str = Path(..., description="Deterministic signal identifier")):
    """
    Retrieves full deterministic factor breakdown, driver contributions, and telemetry for a specific signal.
    """
    record = silent_need_repo.get_by_id(signal_id)
    if not record:
        # Check if full sync discovers it
        if silent_need_repo.count() == 0:
            silent_need_service.sync_all_signals()
            record = silent_need_repo.get_by_id(signal_id)

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Silent Need Signal '{signal_id}' not found."
        )

    return BaseAPIResponse(
        message=f"Silent Need Signal '{signal_id}' retrieved successfully",
        data=SilentNeedSignalItem(**record)
    )

@router.post("/evaluate/{geo_id}", response_model=BaseAPIResponse[List[SilentNeedSignalItem]])
async def evaluate_geo_silent_need(
    geo_id: str = Path(..., description="Target Census LGD or Geo ID to evaluate")
):
    """
    Executes real-time mathematical triangulation on a region's infrastructure deficit,
    demographics, digital access index, and citizen reporting rate to detect silent need.
    Preserved for backward compatibility.
    """
    geos = [g for g in db.get_records("geography") if g.get("geo_id") == geo_id]
    if not geos:
        raise GeoNotFoundException(geo_id)

    signals = await silent_need_service.evaluate_region_silent_need(geo_id)
    items = [SilentNeedSignalItem(**s) for s in signals]

    return BaseAPIResponse(
        message=f"Evaluated {geo_id}: Found {len(items)} potential silent need signals (requires administrative field validation)",
        data=items
    )
