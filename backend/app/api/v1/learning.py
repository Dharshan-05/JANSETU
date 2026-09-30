"""
JANSETU — Learning & Continuous Calibration API Router (Phase 10)
Provides endpoints for:
1. Learning overview and model calibration summary (/summary).
2. Generating and listing calibration candidates (/candidates).
3. Validating and approving candidates (/candidates/{id}/validate, /approve).
4. Managing and listing model versions (/models).
5. Activating model versions and performing rollbacks (/models/{version}/activate, /rollback).
6. Grounded Gemini explanations for learning artifacts (/candidates/{id}/explain).
7. Auditing all lifecycle transitions (/audit-events).
"""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.response_schemas import BaseAPIResponse
from app.schemas.learning_schemas import (
    ModelFamily,
    CalibrationStatus,
    LearningCandidate,
    ModelVersion,
    LearningAuditEvent,
    LearningSummary,
    GenerateCandidateRequest,
    ValidateCandidateRequest,
    ApproveCandidateRequest,
    RejectCandidateRequest,
    ActivateModelRequest,
    RollbackModelRequest,
    LearningExplanationResponse
)
from app.services.learning_service import learning_engine_service
from app.db.bigquery_client import learning_repo

router = APIRouter(prefix="/learning", tags=["Continuous Learning & Calibration"])

# =============================================================================
# SUMMARY & TELEMETRY
# =============================================================================

@router.get("/summary", response_model=BaseAPIResponse[LearningSummary])
async def get_learning_summary():
    """
    Returns system-wide telemetry on ingested Phase 9 evaluations,
    active models, candidate calibrations, drift detection, and data quality.
    """
    summary = learning_engine_service.get_summary()
    return BaseAPIResponse(
        message="Retrieved civic intelligence learning and calibration summary",
        data=summary
    )

# =============================================================================
# CANDIDATE LIFECYCLE
# =============================================================================

@router.get("/candidates", response_model=BaseAPIResponse[List[LearningCandidate]])
async def list_candidates(
    model_family: Optional[str] = Query(None, description="Filter by model family"),
    status: Optional[str] = Query(None, description="Filter by candidate status"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return")
):
    """
    Lists candidate calibrations derived from historical observations.
    Candidates require administrative validation and approval before activation.
    """
    raw_list = learning_repo.list_candidates(
        model_family=model_family,
        status=status,
        limit=limit
    )
    candidates = [LearningCandidate(**r) for r in raw_list]
    return BaseAPIResponse(
        message=f"Retrieved {len(candidates)} learning candidates",
        data=candidates
    )

@router.get("/candidates/{learning_id}", response_model=BaseAPIResponse[LearningCandidate])
async def get_candidate(learning_id: str):
    """Retrieves full candidate record with parameters, metrics, and windows."""
    cand_dict = learning_repo.get_candidate(learning_id)
    if not cand_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CANDIDATE_NOT_FOUND: Candidate '{learning_id}' does not exist."
        )
    return BaseAPIResponse(
        message=f"Retrieved learning candidate {learning_id}",
        data=LearningCandidate(**cand_dict)
    )

@router.post("/candidates/generate", response_model=BaseAPIResponse[LearningCandidate], status_code=status.HTTP_201_CREATED)
async def generate_candidate(payload: GenerateCandidateRequest):
    """
    Generates a new candidate model calibration deterministically from historical observations.
    Enforces temporal leakage protection (training_date < validation_date).
    """
    try:
        candidate = learning_engine_service.generate_candidate(payload)
        return BaseAPIResponse(
            message=f"Generated calibration candidate {candidate.learning_id} with status {candidate.status.value}",
            data=candidate
        )
    except ValueError as e:
        err_msg = str(e)
        if "TEMPORAL_LEAKAGE" in err_msg:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

@router.post("/candidates/{learning_id}/validate", response_model=BaseAPIResponse[LearningCandidate])
async def validate_candidate(learning_id: str, payload: ValidateCandidateRequest):
    """
    Evaluates candidate against held-out validation observations.
    Transitions status to VALIDATED upon meeting quality and error bounds.
    """
    try:
        updated = learning_engine_service.validate_candidate(learning_id, payload)
        return BaseAPIResponse(
            message=f"Validated candidate {learning_id}",
            data=updated
        )
    except ValueError as e:
        err_msg = str(e)
        if "NOT_FOUND" in err_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

@router.post("/candidates/{learning_id}/approve", response_model=BaseAPIResponse[LearningCandidate])
async def approve_candidate(learning_id: str, payload: ApproveCandidateRequest):
    """
    Authorizes administrative approval of a candidate calibration.
    Does NOT automatically activate the candidate into production.
    """
    try:
        approved = learning_engine_service.approve_candidate(learning_id, payload)
        return BaseAPIResponse(
            message=f"Approved candidate {learning_id} by {payload.reviewer}",
            data=approved
        )
    except ValueError as e:
        err_msg = str(e)
        if "NOT_FOUND" in err_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

@router.post("/candidates/{learning_id}/reject", response_model=BaseAPIResponse[LearningCandidate])
async def reject_candidate(learning_id: str, payload: RejectCandidateRequest):
    """Rejects a candidate calibration with an administrative reason."""
    try:
        rejected = learning_engine_service.reject_candidate(learning_id, payload)
        return BaseAPIResponse(
            message=f"Rejected candidate {learning_id}",
            data=rejected
        )
    except ValueError as e:
        err_msg = str(e)
        if "NOT_FOUND" in err_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

# =============================================================================
# MODEL VERSIONS & ACTIVATION
# =============================================================================

@router.get("/models", response_model=BaseAPIResponse[List[ModelVersion]])
async def list_model_versions(
    model_family: Optional[str] = Query(None, description="Filter by model family"),
    status: Optional[str] = Query(None, description="Filter by version status (ACTIVE, SUPERSEDED, ROLLED_BACK)")
):
    """Lists immutable model versions and active production configurations."""
    raw_list = learning_repo.list_model_versions(model_family=model_family, status=status)
    versions = [ModelVersion(**r) for r in raw_list]
    return BaseAPIResponse(
        message=f"Retrieved {len(versions)} model versions",
        data=versions
    )

@router.post("/models/{version}/activate", response_model=BaseAPIResponse[ModelVersion])
async def activate_model(version: str, payload: ActivateModelRequest):
    """
    Authorizes production activation of a model version.
    Marks previously active version in the same family as SUPERSEDED.
    """
    try:
        activated = learning_engine_service.activate_model(version, payload)
        return BaseAPIResponse(
            message=f"Successfully activated model version {version}",
            data=activated
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/models/{version}/rollback", response_model=BaseAPIResponse[ModelVersion])
async def rollback_model(version: str, payload: RollbackModelRequest):
    """
    Rolls back production active version to specified target or previous stable version.
    Never deletes model history. Creates an immutable audit record.
    """
    try:
        rolled_back = learning_engine_service.rollback_model(version, payload)
        return BaseAPIResponse(
            message=f"Successfully rolled back to model version {rolled_back.model_version}",
            data=rolled_back
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# =============================================================================
# EXPLANATION & AUDIT
# =============================================================================

@router.post("/candidates/{learning_id}/explain", response_model=BaseAPIResponse[LearningExplanationResponse])
async def explain_candidate(learning_id: str):
    """
    Generates a grounded natural-language explanation of candidate calibration
    citing verified Phase 9 evaluation IDs and held-out validation metrics.
    """
    try:
        explanation = learning_engine_service.explain_candidate(learning_id)
        return BaseAPIResponse(
            message=f"Generated explanation for candidate {learning_id}",
            data=explanation
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/audit-events", response_model=BaseAPIResponse[List[LearningAuditEvent]])
async def list_audit_events(
    learning_id: Optional[str] = Query(None, description="Filter by candidate ID"),
    model_version: Optional[str] = Query(None, description="Filter by model version"),
    limit: int = Query(50, ge=1, le=200, description="Max audit events")
):
    """Lists immutable audit log of all model lifecycle actions."""
    raw_list = learning_repo.list_audit_events(
        learning_id=learning_id,
        model_version=model_version,
        limit=limit
    )
    events = [LearningAuditEvent(**r) for r in raw_list]
    return BaseAPIResponse(
        message=f"Retrieved {len(events)} learning audit events",
        data=events
    )
