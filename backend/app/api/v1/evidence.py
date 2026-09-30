from fastapi import APIRouter, Path
from app.schemas.response_schemas import BaseAPIResponse, GroundedEvidenceBrief
from app.services.evidence_service import evidence_service

router = APIRouter(prefix="/evidence", tags=["Evidence Engine"])

@router.get("/{signal_id}", response_model=BaseAPIResponse[GroundedEvidenceBrief])
async def get_grounded_evidence(
    signal_id: str = Path(..., description="Target Hotspot ID or Silent Need Signal ID")
):
    """
    FEATURE 8: EVIDENCE ENGINE ("WHY THIS REGION?")
    Returns complete, auditable multi-source evidence trail grounds Gemini in official
    datasets (Census, PMGSY, JJM, HMIS), preventing hallucinations.
    """
    brief = await evidence_service.get_evidence_brief(signal_id)
    return BaseAPIResponse(
        message=f"Grounded evidence trail for {signal_id} generated successfully",
        data=brief
    )
