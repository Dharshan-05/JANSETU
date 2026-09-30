from fastapi import APIRouter
from app.schemas.request_schemas import SandboxSimulationRequest
from app.schemas.response_schemas import BaseAPIResponse, SimulationResult
from app.services.sandbox_service import sandbox_service

router = APIRouter(prefix="/sandbox", tags=["Policy Sandbox"])

@router.post("/simulate", response_model=BaseAPIResponse[SimulationResult])
async def simulate_policy_scenario(payload: SandboxSimulationRequest):
    """
    FEATURE 9: POLICY SANDBOX
    Simulates counterfactual policy interventions (e.g. +10 routes, +solar borewells)
    and computes estimated demographic coverage, gap reduction %, and residual needs.
    """
    result = await sandbox_service.simulate_intervention(
        geo_id=payload.geo_id,
        sector=payload.sector,
        intervention_type=payload.intervention_type,
        parameters=payload.parameters
    )

    return BaseAPIResponse(
        message=f"Intervention simulation for {payload.sector} in {payload.geo_id} executed successfully",
        data=result
    )
