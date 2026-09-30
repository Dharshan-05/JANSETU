from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.response_schemas import BaseAPIResponse, HotspotItem
from app.services.hotspot_service import hotspot_service

router = APIRouter(prefix="/hotspots", tags=["Demand Hotspots"])

@router.get("", response_model=BaseAPIResponse[List[HotspotItem]])
async def list_demand_hotspots(
    category: Optional[str] = Query(None, description="Filter by sector: transport, water, healthcare, etc."),
    hotspot_level: Optional[str] = Query(None, description="Filter by CRITICAL, HIGH, MODERATE"),
    state_code: Optional[str] = Query(None, description="Filter by state: TN, UP, TG, MH"),
    district: Optional[str] = Query(None, description="Filter by district name"),
    block: Optional[str] = Query(None, description="Filter by block/subdistrict name"),
    min_score: Optional[float] = Query(None, description="Filter by minimum deterministic hotspot score"),
    limit: int = Query(100, ge=1, le=500, description="Max results to return")
):
    """
    Returns active geospatial demand hotspots derived from citizen voice intensity,
    spatial population exposure, temporal demand velocity, and category concentration.
    All outputs are analytical signals and include explainability breakdowns.
    """
    raw_hotspots = hotspot_service.list_hotspots(
        category=category,
        hotspot_level=hotspot_level,
        state_code=state_code,
        district=district,
        block=block,
        min_score=min_score,
        limit=limit
    )

    items: List[HotspotItem] = []
    for h in raw_hotspots:
        items.append(HotspotItem(
            hotspot_id=h.get("hotspot_id"),
            geo_id=h.get("geo_id"),
            region_name=h.get("region_name", "Target Region"),
            state_name=h.get("state_name", h.get("state_code", "State")),
            category=h.get("category", "general"),
            hotspot_level=h.get("hotspot_level", "HIGH"),
            voice_intensity_score=float(h.get("voice_intensity_score", h.get("voice_intensity", 0.5))),
            growth_trend=h.get("growth_trend", h.get("trend_direction", "STABLE")),
            estimated_population_impacted=int(h.get("estimated_population_impacted", h.get("population_exposure", 25000))),
            latitude=float(h.get("latitude", 0.0) or 0.0),
            longitude=float(h.get("longitude", 0.0) or 0.0),
            top_issue=h.get("top_issue", "Citizen reported service deficit"),
            total_requests=int(h.get("total_requests", h.get("request_count", 0))),
            status=h.get("status", "active"),
            hotspot_score=float(h.get("hotspot_score", 0.0)),
            velocity_score=float(h.get("demand_velocity", 0.0)) if h.get("demand_velocity") is not None else 0.0,
            concentration_ratio=float(h.get("explanation", {}).get("category_concentration_ratio", 0.0)),
            explanation=h.get("explanation"),
            confidence_score=0.90,
            analytical_version=h.get("calculation_version", "v5.0-deterministic"),
            disclaimer=h.get("disclaimer", "AI-Derived Analytical Signal — Not Official Policy")
        ))

    return BaseAPIResponse(
        message=f"Retrieved {len(items)} demand hotspots. AI-Derived Analytical Signal — Not Official Policy.",
        data=items
    )

@router.get("/summary", response_model=BaseAPIResponse[Dict[str, Any]])
async def get_hotspots_summary():
    """
    Returns high-level Command Center metrics and summary statistics for demand hotspots.
    """
    kpis = hotspot_service.get_summary_kpis()
    return BaseAPIResponse(
        message="Demand hotspots summary retrieved successfully",
        data=kpis
    )

@router.get("/{hotspot_id}", response_model=BaseAPIResponse[HotspotItem])
async def get_hotspot_detail(hotspot_id: str):
    """
    Retrieves full deterministic score breakdown and component-level explainability for a specific hotspot.
    """
    h = hotspot_service.get_hotspot_detail(hotspot_id)
    if not h:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hotspot with ID '{hotspot_id}' not found."
        )

    item = HotspotItem(
        hotspot_id=h.get("hotspot_id"),
        geo_id=h.get("geo_id"),
        region_name=h.get("region_name", "Target Region"),
        state_name=h.get("state_name", h.get("state_code", "State")),
        category=h.get("category", "general"),
        hotspot_level=h.get("hotspot_level", "HIGH"),
        voice_intensity_score=float(h.get("voice_intensity_score", h.get("voice_intensity", 0.5))),
        growth_trend=h.get("growth_trend", h.get("trend_direction", "STABLE")),
        estimated_population_impacted=int(h.get("estimated_population_impacted", h.get("population_exposure", 25000))),
        latitude=float(h.get("latitude", 0.0) or 0.0),
        longitude=float(h.get("longitude", 0.0) or 0.0),
        top_issue=h.get("top_issue", "Citizen reported service deficit"),
        total_requests=int(h.get("total_requests", h.get("request_count", 0))),
        status=h.get("status", "active"),
        hotspot_score=float(h.get("hotspot_score", 0.0)),
        velocity_score=float(h.get("demand_velocity", 0.0)) if h.get("demand_velocity") is not None else 0.0,
        concentration_ratio=float(h.get("explanation", {}).get("category_concentration_ratio", 0.0)),
        explanation=h.get("explanation"),
        confidence_score=0.90,
        analytical_version=h.get("calculation_version", "v5.0-deterministic"),
        disclaimer=h.get("disclaimer", "AI-Derived Analytical Signal — Not Official Policy")
    )

    return BaseAPIResponse(
        message=f"Hotspot {hotspot_id} retrieved successfully",
        data=item
    )
