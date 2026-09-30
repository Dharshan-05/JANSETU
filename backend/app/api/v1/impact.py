from typing import List, Optional
from fastapi import APIRouter, Query
from app.schemas.response_schemas import BaseAPIResponse, ImpactMetricItem
from app.services.impact_service import impact_service

router = APIRouter(prefix="/impact", tags=["Impact Engine"])

@router.get("/evaluations", response_model=BaseAPIResponse[List[ImpactMetricItem]])
async def get_impact_evaluations(
    sector: Optional[str] = Query(None, description="Filter by sector")
):
    """
    FEATURE 10: IMPACT ENGINE
    Tracks the closed-loop governance outcome:
    Citizen request -> Identified need -> Intervention/Project -> Implementation ->
    New field data -> Citizen feedback -> Measured Impact (Before vs. After).
    """
    evaluations = impact_service.get_impact_evaluations(sector=sector)
    return BaseAPIResponse(
        message=f"Retrieved {len(evaluations)} closed-loop impact evaluations",
        data=evaluations
    )
