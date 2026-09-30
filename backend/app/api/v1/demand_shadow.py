from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query
from app.schemas.response_schemas import BaseAPIResponse, DemandShadowResponse, DemandShadowMatrixItem
from app.services.demand_shadow_service import demand_shadow_service

router = APIRouter(prefix="/demand-shadow", tags=["Demand Shadow"])

@router.get("", response_model=BaseAPIResponse[DemandShadowResponse])
async def get_demand_shadow(
    geo_id: Optional[str] = Query(None, description="Filter by specific geography identifier"),
    geo_level: Optional[str] = Query(None, description="Filter by level: district, subdistrict"),
    category: Optional[str] = Query(None, description="Filter by infrastructure sector: transport, water, etc."),
    state_code: Optional[str] = Query(None, description="Filter by state code: TN, UP, MH, TG"),
    time_window: int = Query(14, ge=1, le=90, description="Time window in days"),
    min_voice: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum voice intensity filter"),
    min_need: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum infrastructure need filter"),
    quadrant: Optional[str] = Query(None, description="Filter by quadrant: HIGH_VOICE_HIGH_NEED, LOW_VOICE_HIGH_NEED, HIGH_VOICE_LOW_NEED, LOW_VOICE_LOW_NEED")
):
    """
    Phase 5 Demand Shadow 2D Matrix Endpoint.
    Analyzes the divergence between citizen voice intensity (Axis X) and infrastructure need deficit (Axis Y).
    Classifies areas into 4 neutral analytical quadrants:
    - HIGH_VOICE_HIGH_NEED (Demand Hotspot)
    - LOW_VOICE_HIGH_NEED (Potential Demand-Need Discrepancy / Candidate for administrative review)
    - HIGH_VOICE_LOW_NEED (Expressed Demand / Lower Baseline Deficit)
    - LOW_VOICE_LOW_NEED (Low Current Signal)

    All results are analytical signals and must not be interpreted as official policy or construction directives.
    """
    res = demand_shadow_service.compute_demand_shadow_matrix(
        geo_id=geo_id,
        geo_level=geo_level,
        category=category,
        state_code=state_code,
        time_window_days=time_window,
        min_voice=min_voice,
        min_need=min_need,
        quadrant_filter=quadrant
    )

    items = [DemandShadowMatrixItem(**m) for m in res["matrix"]]
    data = DemandShadowResponse(
        matrix=items,
        summary=res["summary"],
        disclaimer=res["summary"]["disclaimer"]
    )

    return BaseAPIResponse(
        message=f"Demand Shadow matrix generated for {len(items)} geographies. AI-Derived Analytical Signal — Not Official Policy.",
        data=data
    )
