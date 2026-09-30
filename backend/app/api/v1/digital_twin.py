from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Path, HTTPException
from app.db.bigquery_client import db
from app.schemas.response_schemas import BaseAPIResponse
from app.schemas.twin_schemas import (
    CivicDigitalTwin,
    PopulationMetrics,
    CivicHealthRadar,
    IntelligenceSummary,
    ClusterSummary
)
from app.core.exceptions import GeoNotFoundException

router = APIRouter(prefix="/digital-twin", tags=["Civic Digital Twin"])

@router.get("/{geo_id}", response_model=BaseAPIResponse[CivicDigitalTwin])
async def get_civic_digital_twin(
    geo_id: str = Path(..., description="Target Census LGD or Geo ID")
):
    """
    Returns the dynamic Civic Digital Twin for any administrative unit in India
    (State, District, or Block/Taluk), synthesizing live citizen voice, demographic vulnerability,
    infrastructure indices, and active public investments.
    """
    geos = [g for g in db.get_records("geography") if g.get("geo_id") == geo_id]
    if not geos:
        raise GeoNotFoundException(geo_id)
    geo = geos[0]

    # Demographics
    demos = [d for d in db.get_records("demographics") if d.get("geo_id") == geo_id]
    demo = demos[0] if demos else {
        "total_population": 125000,
        "vulnerability_percentage": 0.52,
        "elderly_percentage": 0.12,
        "literacy_rate": 0.68,
        "digital_penetration_index": 0.38,
        "primary_livelihood": "Agriculture & Rural Services"
    }

    # Infrastructure Baseline
    infra = [i for i in db.get_records("infrastructure") if i.get("geo_id") == geo_id]
    def get_cat_health(cat_name: str, fallback: float = 0.55) -> float:
        cat_items = [i for i in infra if i.get("category") == cat_name]
        if cat_items:
            avg_def = sum(i.get("deficit_score", 0.5) for i in cat_items) / len(cat_items)
            return round(max(0.05, 1.0 - avg_def), 2)
        return fallback

    radar = CivicHealthRadar(
        transport_access=get_cat_health("transport", 0.42),
        water_security=get_cat_health("water", 0.58),
        healthcare_proximity=get_cat_health("healthcare", 0.48),
        education_quality=get_cat_health("education", 0.72),
        power_reliability=get_cat_health("electricity", 0.81),
        sanitation_index=get_cat_health("sanitation", 0.50)
    )

    # Citizen requests & clusters
    clusters = [c for c in db.get_records("demand_clusters") if c.get("geo_id") == geo_id]
    cluster_summaries = [
        ClusterSummary(
            cluster_id=c.get("cluster_id"),
            category=c.get("category"),
            title=c.get("cluster_title"),
            request_count=c.get("request_count", 1),
            severity_score=c.get("average_severity", 3.0),
            status=c.get("status", "emerging")
        ) for c in clusters
    ]

    # Silent need signals
    signals = [s for s in db.get_records("silent_need_signals") if s.get("geo_id") == geo_id]

    # Investments
    investments = [p for p in db.get_records("investments") if p.get("geo_id") == geo_id]
    total_budget = sum(p.get("allocated_budget_inr", 0) for p in investments)

    # Intelligence synthesis
    twin = CivicDigitalTwin(
        geo_id=geo_id,
        admin_name=geo.get("name"),
        admin_level=geo.get("admin_level", 3),
        state_name=geo.get("state_code", "India"),
        district_name=geo.get("district_code"),
        latitude=geo.get("latitude", 12.0),
        longitude=geo.get("longitude", 78.0),
        population_metrics=PopulationMetrics(
            total_population=demo.get("total_population", 125000),
            vulnerability_percentage=demo.get("vulnerability_percentage", 0.52),
            elderly_percentage=demo.get("elderly_percentage", 0.12),
            literacy_rate=demo.get("literacy_rate", 0.68),
            digital_penetration_index=demo.get("digital_penetration_index", 0.38),
            primary_livelihood=demo.get("primary_livelihood", "Agriculture")
        ),
        civic_health_radar=radar,
        intelligence_summary=IntelligenceSummary(
            population_exposure="HIGH" if demo.get("vulnerability_percentage", 0) > 0.5 else "MODERATE",
            citizen_demand_level="HIGH" if len(clusters) > 3 else "MODERATE",
            infrastructure_gap="HIGH" if radar.transport_access < 0.5 or radar.water_security < 0.5 else "MODERATE",
            digital_access="LOW" if demo.get("digital_penetration_index", 0) < 0.4 else "MODERATE",
            investment_coverage="LOW" if total_budget < 50000000 else "ADEQUATE",
            emerging_signal=f"TRANSPORT & WATER (Growth: +38% 30d)",
            potential_silent_need_zones=len(signals)
        ),
        active_clusters=cluster_summaries,
        silent_need_count=len(signals),
        active_public_projects_count=len(investments),
        allocated_capex_inr=total_budget,
        last_computed_at=datetime.utcnow().isoformat()
    )

    return BaseAPIResponse(
        message=f"Civic Digital Twin for {geo.get('name')} loaded successfully",
        data=twin
    )

@router.get("/list/all")
async def list_available_digital_twins():
    """Returns directory of all available administrative regions in the Civic Digital Twin system."""
    geos = db.get_records("geography")
    return {
        "success": True,
        "total_regions": len(geos),
        "regions": [
            {
                "geo_id": g.get("geo_id"),
                "name": g.get("name"),
                "state": g.get("state_code"),
                "admin_level": g.get("admin_level"),
                "latitude": g.get("latitude"),
                "longitude": g.get("longitude")
            } for g in geos
        ]
    }
