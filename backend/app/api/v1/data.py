from fastapi import APIRouter, HTTPException, status
from app.db.bigquery_client import db, geography_repo
from app.core.exceptions import ResourceNotFoundException
from pipelines.validation.quality_reporter import DataQualityAuditor

data_router = APIRouter(prefix="/data", tags=["Data Engineering Diagnostics"])

@data_router.get("/status")
async def get_data_layer_status():
    """Diagnostic status of BigQuery warehouse, canonical datasets, and table counts."""
    counts = db.get_table_counts()
    total_rows = sum(counts.values())
    return {
        "status": "ok",
        "bigquery_connected": db.check_connectivity(),
        "primary_dataset": db.dataset_id,
        "analytics_dataset": db.analytics_dataset_id,
        "canonical_tables_count": len(db.CANONICAL_TABLES),
        "total_records": total_rows,
        "table_counts": counts
    }

@data_router.get("/geography/{geo_id}")
async def get_geography_node(geo_id: str):
    """Retrieves canonical geography entity, parent hierarchy, and immediate child subdivisions."""
    geo = geography_repo.get_by_geo_id(geo_id)
    if not geo:
        raise ResourceNotFoundException(f"Geographic identifier '{geo_id}' not found.")

    hierarchy = geography_repo.get_hierarchy(geo_id)
    children = geography_repo.get_children(geo_id)

    return {
        "status": "ok",
        "data": {
            "record": geo,
            "hierarchy_path": hierarchy,
            "subdivisions_count": len(children),
            "subdivisions": children
        }
    }

@data_router.get("/quality")
async def get_data_quality_report():
    """Generates a comprehensive data quality and provenance audit report across all 12 tables."""
    report = DataQualityAuditor.audit_store(db._store)
    return {
        "status": "ok",
        "data": report.model_dump()
    }
