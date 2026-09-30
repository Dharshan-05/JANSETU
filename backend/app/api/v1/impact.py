"""
JANSETU — Closed-Loop Impact Measurement & Evaluation API Router (Phase 9)
Provides endpoints for:
1. Creating impact evaluations with frozen baseline snapshots.
2. Recording verified post-intervention observations.
3. Deterministic calculation of absolute, percentage, and target gaps.
4. Comparing Phase 8 hypothetical scenarios with Phase 9 observed outcomes.
5. Grounded Gemini explanations citing verified evidence IDs.
6. Aggregated model validation telemetry.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.response_schemas import BaseAPIResponse
from app.schemas.impact_schemas import (
    ImpactEvaluation,
    EvaluationCreateInput,
    ObservationInput,
    ImpactExplanationResponse,
    ModelValidationSummary,
    IndicatorDefinition
)
from app.services.impact_service import impact_service, CONTROLLED_INDICATORS

router = APIRouter(prefix="/impact", tags=["Impact Engine"])

@router.get("/indicators", response_model=BaseAPIResponse[List[IndicatorDefinition]])
async def get_controlled_indicators():
    """Returns the controlled library of civic infrastructure indicators."""
    indicators = list(CONTROLLED_INDICATORS.values())
    return BaseAPIResponse(
        message=f"Retrieved {len(indicators)} controlled indicators",
        data=indicators
    )

@router.get("/evaluations", response_model=BaseAPIResponse[List[ImpactEvaluation]])
async def list_impact_evaluations(
    geo_id: Optional[str] = Query(None, description="Filter by geographic unit ID"),
    sector: Optional[str] = Query(None, description="Filter by sector (e.g. water_security, road_transport)"),
    evaluation_type: Optional[str] = Query(None, description="Filter by evaluation type"),
    data_quality: Optional[str] = Query(None, description="Filter by data quality"),
    attribution_level: Optional[str] = Query(None, description="Filter by attribution level"),
    limit: int = Query(50, ge=1, le=200, description="Max evaluations to return")
):
    """
    FEATURE 10 (PHASE 9): CLOSED-LOOP IMPACT OBSERVATORY
    Tracks measured governance outcomes before and after interventions,
    comparing observed values with frozen baselines and Phase 8 scenarios.
    """
    evaluations = impact_service.list_evaluations(
        geo_id=geo_id,
        sector=sector,
        evaluation_type=evaluation_type,
        data_quality=data_quality,
        attribution_level=attribution_level,
        limit=limit
    )
    return BaseAPIResponse(
        message=f"Retrieved {len(evaluations)} closed-loop impact evaluations",
        data=evaluations
    )

@router.post("/evaluations", response_model=BaseAPIResponse[ImpactEvaluation], status_code=status.HTTP_201_CREATED)
async def create_impact_evaluation(payload: EvaluationCreateInput):
    """
    Initializes a new impact evaluation record with an immutable baseline snapshot.
    """
    try:
        evaluation = impact_service.create_evaluation(payload)
        return BaseAPIResponse(
            message=f"Created impact evaluation '{evaluation.evaluation_id}' with frozen baseline snapshot",
            data=evaluation
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create evaluation: {e}")

@router.get("/evaluations/{evaluation_id}", response_model=BaseAPIResponse[ImpactEvaluation])
async def get_impact_evaluation_detail(evaluation_id: str):
    """
    Retrieves full evaluation record including baseline snapshot, observation,
    deterministic calculation, scenario comparison, and evidence trail.
    """
    evaluation = impact_service.get_evaluation(evaluation_id)
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"EVALUATION_NOT_FOUND: Evaluation '{evaluation_id}' does not exist."
        )
    return BaseAPIResponse(
        message=f"Retrieved evaluation '{evaluation_id}'",
        data=evaluation
    )

@router.post("/evaluations/{evaluation_id}/observations", response_model=BaseAPIResponse[ImpactEvaluation])
async def record_observation_endpoint(evaluation_id: str, payload: ObservationInput):
    """
    Records a verified post-intervention observation and triggers deterministic
    impact calculations and Phase 8 scenario validation.
    """
    try:
        evaluation = impact_service.record_observation_and_calculate(evaluation_id, payload)
        return BaseAPIResponse(
            message=f"Recorded observation and calculated impact for '{evaluation_id}'",
            data=evaluation
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to record observation: {e}")

@router.post("/evaluations/{evaluation_id}/calculate", response_model=BaseAPIResponse[ImpactEvaluation])
async def recalculate_impact_endpoint(evaluation_id: str):
    """
    Recalculates deterministic impact metrics for an evaluation using its
    frozen baseline snapshot and existing observation.
    """
    evaluation = impact_service.get_evaluation(evaluation_id)
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"EVALUATION_NOT_FOUND: Evaluation '{evaluation_id}' does not exist."
        )
    if not evaluation.observation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OBSERVATION_NOT_FOUND: Cannot calculate impact without recorded observation."
        )

    obs_input = ObservationInput(
        value=evaluation.observation.value,
        unit=evaluation.observation.unit,
        observation_date=evaluation.observation.observation_date,
        source=evaluation.observation.source,
        source_type=evaluation.observation.source_type,
        provenance=evaluation.observation.provenance,
        evidence_ids=evaluation.observation.evidence_ids,
        quality_status=evaluation.observation.quality_status
    )
    updated = impact_service.record_observation_and_calculate(evaluation_id, obs_input)
    return BaseAPIResponse(
        message=f"Recalculated impact for '{evaluation_id}'",
        data=updated
    )

@router.post("/evaluations/{evaluation_id}/explain", response_model=BaseAPIResponse[ImpactExplanationResponse])
async def explain_impact_evaluation(evaluation_id: str):
    """
    Produces grounded natural-language explanation of civic outcomes citing
    verified baseline and observation evidence records.
    """
    try:
        explanation = impact_service.explain_evaluation(evaluation_id)
        return BaseAPIResponse(
            message=f"Generated grounded explanation for '{evaluation_id}'",
            data=explanation
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to explain evaluation: {e}")

@router.get("/model-validation", response_model=BaseAPIResponse[ModelValidationSummary])
async def get_model_validation_metrics():
    """
    Returns aggregate validation telemetry comparing Phase 8 scenario estimates
    against Phase 9 verified outcomes.
    """
    summary = impact_service.get_model_validation()
    return BaseAPIResponse(
        message="Retrieved Phase 8 vs Phase 9 model validation telemetry",
        data=summary
    )
