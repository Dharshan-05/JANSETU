"""
JANSETU — Policy Sandbox REST API Endpoints (Phase 8)
Supports deterministic simulation, scenario listing, neutral comparison,
grounded Gemini explanation, and scenario archiving.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Path, HTTPException, status
from app.schemas.response_schemas import BaseAPIResponse
from app.schemas.sandbox_schemas import (
    ScenarioInput,
    ScenarioResult,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
    ScenarioExplanationResponse
)
from app.services.sandbox_service import sandbox_service
from app.core.exceptions import JanSetuException

router = APIRouter(prefix="/sandbox", tags=["Policy Sandbox"])


@router.post("/simulate", response_model=BaseAPIResponse[ScenarioResult])
async def simulate_policy_scenario(payload: ScenarioInput):
    """
    Executes a deterministic policy simulation for a target geography and sector.
    Strictly separates HISTORICAL FACT, MODEL ASSUMPTION, and SCENARIO ESTIMATE.
    Output is a hypothetical model estimate, not official policy.
    """
    try:
        result = await sandbox_service.simulate_scenario(payload)
        return BaseAPIResponse(
            message=f"Hypothetical simulation for {payload.sector} in {payload.geo_id} executed successfully",
            data=result
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute scenario simulation: {str(e)}"
        )


@router.get("/scenarios", response_model=BaseAPIResponse[List[Dict[str, Any]]])
async def list_policy_scenarios(
    geo_id: Optional[str] = Query(None, description="Filter by geography ID"),
    sector: Optional[str] = Query(None, description="Filter by civic sector"),
    intervention_type: Optional[str] = Query(None, description="Filter by intervention type"),
    scenario_version: Optional[int] = Query(None, description="Filter by scenario version"),
    limit: int = Query(50, ge=1, le=200, description="Max scenarios to return")
):
    """
    Retrieves history of persisted simulation scenario runs with multi-dimensional filtering.
    """
    scenarios = sandbox_service.list_scenarios(
        geo_id=geo_id,
        sector=sector,
        intervention_type=intervention_type,
        scenario_version=scenario_version,
        limit=limit
    )
    return BaseAPIResponse(
        message="Policy scenarios retrieved successfully",
        data=scenarios
    )


@router.get("/scenarios/{scenario_id}", response_model=BaseAPIResponse[Dict[str, Any]])
async def get_policy_scenario(
    scenario_id: str = Path(..., description="Unique deterministic scenario identifier, e.g. SCN-TN-DHM-WAT-A1B2C3")
):
    """
    Retrieves a single scenario run by identifier, including baseline evidence,
    assumptions, and deterministic estimates.
    """
    sc = sandbox_service.get_scenario(scenario_id)
    if not sc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy scenario '{scenario_id}' was not found in the warehouse."
        )
    return BaseAPIResponse(
        message=f"Policy scenario '{scenario_id}' retrieved successfully",
        data=sc
    )


@router.post("/compare", response_model=BaseAPIResponse[ScenarioComparisonResponse])
async def compare_policy_scenarios(payload: ScenarioComparisonRequest):
    """
    Generates a neutral side-by-side comparison table for 2 to 5 scenarios.
    Strictly prohibits declaring any scenario as 'best', 'optimal', or 'recommended'.
    """
    try:
        comparison = await sandbox_service.compare_scenarios(payload.scenario_ids)
        return BaseAPIResponse(
            message="Neutral scenario comparison generated successfully",
            data=comparison
        )
    except JanSetuException as je:
        raise HTTPException(
            status_code=je.status_code,
            detail=je.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate scenario comparison: {str(e)}"
        )


@router.post("/{scenario_id}/explain", response_model=BaseAPIResponse[ScenarioExplanationResponse])
async def explain_policy_scenario(
    scenario_id: str = Path(..., description="Scenario identifier to explain")
):
    """
    Synthesizes a grounded Gemini narrative explanation for the scenario run.
    Uses prompt version v8.0-grounded-simulation and cites historical baseline evidence IDs.
    """
    try:
        explanation = await sandbox_service.explain_scenario_by_id(scenario_id)
        return BaseAPIResponse(
            message=f"Grounded explanation for scenario '{scenario_id}' generated successfully",
            data=explanation
        )
    except JanSetuException as je:
        raise HTTPException(
            status_code=je.status_code,
            detail=je.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate scenario explanation: {str(e)}"
        )


@router.post("/{scenario_id}/archive", response_model=BaseAPIResponse[Dict[str, Any]])
async def archive_policy_scenario(
    scenario_id: str = Path(..., description="Scenario identifier to archive")
):
    """
    Soft-archives a scenario without physically destroying historical audit logs.
    """
    success = sandbox_service.archive_scenario(scenario_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' was not found or could not be archived."
        )
    return BaseAPIResponse(
        message=f"Scenario '{scenario_id}' soft-archived successfully",
        data={"scenario_id": scenario_id, "is_archived": True}
    )
