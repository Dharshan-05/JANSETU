"""
JANSETU — Grounded Evidence Engine API Endpoints (Phase 7)
Exposes auditable evidence briefs, refresh operations, and atomic evidence record lookups.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Path, Query, HTTPException, status
from app.schemas.response_schemas import BaseAPIResponse
from app.schemas.evidence_schemas import (
    EvidenceResponse,
    EvidenceRecord,
    EvidenceSummary
)
from app.services.evidence_service import evidence_service
from app.core.exceptions import SignalNotFoundException

router = APIRouter(prefix="/evidence", tags=["Evidence Engine"])


@router.get("/summary", response_model=BaseAPIResponse[EvidenceSummary])
async def get_evidence_summary():
    """
    Returns high-level Evidence Warehouse health, provenance breakdown,
    and verified coverage metrics.
    """
    summary = evidence_service.get_summary()
    return BaseAPIResponse(
        message="Evidence warehouse summary retrieved successfully",
        data=summary
    )


@router.get("/record/{evidence_id}", response_model=BaseAPIResponse[Dict[str, Any]])
async def get_atomic_evidence_record(
    evidence_id: str = Path(..., description="Unique atomic evidence citation ID, e.g., EV-001 or EV-A1B2C3-INF-01")
):
    """
    Returns an individual atomic factual observation record with full
    provenance, dataset source, date, and verification status.
    """
    record = evidence_service.get_evidence_record_by_id(evidence_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence record with identifier '{evidence_id}' was not found in the warehouse."
        )
    return BaseAPIResponse(
        message=f"Atomic evidence record '{evidence_id}' retrieved successfully",
        data=record
    )


@router.get("/{signal_id}", response_model=BaseAPIResponse[EvidenceResponse])
async def get_grounded_evidence(
    signal_id: str = Path(..., description="Target Hotspot ID or Silent Need Signal ID")
):
    """
    Returns complete, auditable multi-source evidence brief for a given signal:
    - 4 Core Driver cards with official sources and dates
    - Atomic Evidence Records
    - Grounded Gemini explanation with validated claim-to-evidence mappings
    - Evidence Coverage and Neutral Quality assessment
    - Explicit Data Limitations & Conflicting Evidence preservation
    - Mandatory AI analytical signal disclaimers
    """
    try:
        response = await evidence_service.get_evidence_response(signal_id)
        return BaseAPIResponse(
            message=f"Grounded evidence trail for '{signal_id}' retrieved successfully",
            data=response
        )
    except SignalNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal or Hotspot with identifier '{signal_id}' was not found."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate grounded evidence trail: {str(e)}"
        )


@router.post("/{signal_id}/refresh", response_model=BaseAPIResponse[EvidenceResponse])
async def refresh_grounded_evidence(
    signal_id: str = Path(..., description="Target Hotspot ID or Silent Need Signal ID")
):
    """
    Refreshes the evidence package for a signal by purging stale records and
    re-running grounded synthesis with latest available data.
    Does NOT modify the underlying Phase 6 intelligence score.
    """
    try:
        response = await evidence_service.refresh_evidence(signal_id)
        return BaseAPIResponse(
            message=f"Grounded evidence trail for '{signal_id}' refreshed successfully",
            data=response
        )
    except SignalNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal or Hotspot with identifier '{signal_id}' was not found."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh grounded evidence trail: {str(e)}"
        )
