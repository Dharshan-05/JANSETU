from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Path

from app.schemas.response_schemas import BaseAPIResponse
from app.services.ai_perception_service import ai_perception_service
from app.services.clustering_service import clustering_service
from app.services.vector_search_service import vector_search_service
from app.core.taxonomy import list_categories, get_subcategories, ALLOWED_COHORTS, SUBCATEGORIES_BY_CATEGORY

router = APIRouter(prefix="/ai", tags=["AI Perception & Semantic Clustering"])

@router.post("/process/{request_id}", response_model=BaseAPIResponse[Dict[str, Any]])
async def process_citizen_request(
    request_id: str = Path(..., description="Canonical citizen request identifier"),
    force: bool = Query(default=False, description="Force re-extraction and clustering if already completed")
):
    """
    Executes Phase 4 AI perception pipeline on an existing citizen request:
    Gemini structured extraction -> 768-dim multilingual embedding -> semantic demand clustering.
    """
    result = await ai_perception_service.process_request(request_id=request_id, force_reprocess=force)
    return BaseAPIResponse(
        message=f"AI perception successfully executed for request '{request_id}'",
        data=result
    )

@router.get("/status/{request_id}", response_model=BaseAPIResponse[Dict[str, Any]])
async def get_ai_status(
    request_id: str = Path(..., description="Canonical citizen request identifier")
):
    """Retrieves AI extraction parameters, embedding status, and cluster assignment."""
    status_info = ai_perception_service.get_ai_status(request_id=request_id)
    return BaseAPIResponse(
        message="AI status retrieved successfully",
        data=status_info
    )

@router.get("/clusters", response_model=BaseAPIResponse[List[Dict[str, Any]]])
async def list_demand_clusters(
    geo_id: Optional[str] = Query(default=None, description="Filter by administrative geo_id"),
    category: Optional[str] = Query(default=None, description="Filter by infrastructure sector")
):
    """Lists synthesized semantic demand clusters with spatial and sector pre-filtering."""
    clusters = clustering_service.list_clusters(geo_id=geo_id, category=category)
    return BaseAPIResponse(
        message=f"Retrieved {len(clusters)} semantic demand clusters",
        data=clusters
    )

@router.get("/clusters/{cluster_id}", response_model=BaseAPIResponse[Dict[str, Any]])
async def get_cluster_details(
    cluster_id: str = Path(..., description="Unique demand cluster identifier, e.g. CLS-TRN-HRR-01")
):
    """Retrieves full cluster metadata, representative issue, and actual member requests."""
    cluster = clustering_service.get_cluster(cluster_id=cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail=f"Demand cluster '{cluster_id}' not found.")
    return BaseAPIResponse(
        message="Demand cluster details retrieved successfully",
        data=cluster
    )

@router.get("/similar/{request_id}", response_model=BaseAPIResponse[List[Dict[str, Any]]])
async def find_similar_requests(
    request_id: str = Path(..., description="Source citizen request identifier"),
    top_k: int = Query(default=5, ge=1, le=20, description="Maximum number of similar requests to return"),
    threshold: Optional[float] = Query(default=None, ge=0.0, le=1.0, description="Override similarity threshold")
):
    """
    Executes BigQuery Vector Search finding semantically related community complaints
    using 768-dimensional multilingual dense representations.
    """
    matches = vector_search_service.find_similar_to_request(
        request_id=request_id,
        threshold=threshold,
        top_k=top_k
    )
    return BaseAPIResponse(
        message=f"Found {len(matches)} semantically similar citizen requests",
        data=matches
    )

@router.get("/taxonomy", response_model=BaseAPIResponse[Dict[str, Any]])
async def get_controlled_taxonomy():
    """Returns the controlled JANSETU civic taxonomy of categories, subcategories, and cohorts."""
    return BaseAPIResponse(
        message="Controlled civic taxonomy retrieved successfully",
        data={
            "categories": list_categories(),
            "subcategories_by_category": SUBCATEGORIES_BY_CATEGORY,
            "allowed_cohorts": ALLOWED_COHORTS
        }
    )
