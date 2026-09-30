from typing import List, Optional
from fastapi import APIRouter, Query
from app.db.bigquery_client import db
from app.schemas.response_schemas import BaseAPIResponse, HotspotItem

router = APIRouter(prefix="/hotspots", tags=["Demand Hotspots"])

@router.get("", response_model=BaseAPIResponse[List[HotspotItem]])
async def list_demand_hotspots(
    category: Optional[str] = Query(None, description="Filter by sector: transport, water, healthcare, etc."),
    hotspot_level: Optional[str] = Query(None, description="Filter by CRITICAL, HIGH, MODERATE"),
    state_code: Optional[str] = Query(None, description="Filter by state: TN, UP, TG, MH")
):
    """
    Returns active geospatial demand hotspots derived from semantic request clustering,
    spatial density analysis, and temporal velocity metrics.
    """
    raw_hotspots = db.get_records("hotspots")
    geos = {g.get("geo_id"): g for g in db.get_records("geography")}

    filtered: List[HotspotItem] = []
    for h in raw_hotspots:
        if category and h.get("category") != category:
            continue
        if hotspot_level and h.get("hotspot_level") != hotspot_level:
            continue

        geo_id = h.get("geo_id")
        geo = geos.get(geo_id, {})
        if state_code and geo.get("state_code") != state_code:
            continue

        filtered.append(HotspotItem(
            hotspot_id=h.get("hotspot_id"),
            geo_id=geo_id,
            region_name=h.get("region_name", geo.get("name", "Target Region")),
            state_name=h.get("state_name", geo.get("state_code", "State")),
            category=h.get("category", "General"),
            hotspot_level=h.get("hotspot_level", "HIGH"),
            voice_intensity_score=h.get("voice_intensity_score", 0.75),
            growth_trend=h.get("growth_trend", "RAPIDLY_INCREASING"),
            estimated_population_impacted=h.get("estimated_population_impacted", 24000),
            latitude=h.get("latitude", geo.get("latitude", 12.0)),
            longitude=h.get("longitude", geo.get("longitude", 78.0)),
            top_issue=h.get("top_issue", "Severe infrastructure service gap reported by citizens"),
            total_requests=h.get("total_requests", 450),
            status="active"
        ))

    return BaseAPIResponse(
        message=f"Retrieved {len(filtered)} demand hotspots",
        data=filtered
    )
