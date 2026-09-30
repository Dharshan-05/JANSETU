import pytest
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.bigquery_client import (
    db,
    geography_repo,
    demographics_repo,
    infrastructure_repo,
    investment_repo,
    citizen_request_repo
)
from app.schemas.data_schemas import (
    GeographyRecord,
    DemographicsRecord,
    InfrastructureRecord,
    InvestmentRecord,
    CitizenRequestRecord,
    CitizenRequestEmbeddingRecord,
    DemandClusterRecord,
    HotspotRecord,
    SilentNeedSignalRecord,
    EvidenceRecord,
    PolicyScenarioRecord,
    ImpactMetricRecord
)
from pipelines.validation.validators import DataValidator
from pipelines.validation.quality_reporter import DataQualityAuditor
from pipelines.seed_india_data import seed_india_pilot_data

@pytest.fixture(autouse=True)
def ensure_seed_data():
    """Ensure clean deterministic seed data before each test."""
    seed_india_pilot_data(clear_first=True)

# ==============================================================================
# 1. GEOGRAPHY SCHEMA & HIERARCHY VALIDATION
# ==============================================================================
def test_geography_schema_validation():
    valid_node = {
        "geo_id": "IND_TN_DHM_HRR",
        "parent_geo_id": "IND_TN_DHM",
        "geo_level": 3,
        "geo_name": "Harur Block",
        "state_code": "TN",
        "district_code": "Dharmapuri",
        "block_code": "Harur",
        "lgd_code": "5701",
        "latitude": 12.0622,
        "longitude": 78.4975,
        "is_synthetic": False
    }
    model = GeographyRecord(**valid_node)
    assert model.geo_id == "IND_TN_DHM_HRR"
    assert model.geo_level == 3
    assert model.admin_level == 3  # Alias check

def test_geography_hierarchy_integrity():
    """Verifies that all child nodes reference existing parents up to Country Level 0."""
    geos = db.get_records("geography")
    known_ids = {g["geo_id"] for g in geos}

    for g in geos:
        level = g.get("geo_level", g.get("admin_level"))
        parent_id = g.get("parent_geo_id")
        if level > 0:
            assert parent_id is not None, f"Level {level} node {g['geo_id']} must have parent_geo_id"
            assert parent_id in known_ids, f"Parent {parent_id} of node {g['geo_id']} does not exist"

    # Verify 5 distinct levels exist
    levels_present = {g.get("geo_level") for g in geos}
    assert {0, 1, 2, 3, 4}.issubset(levels_present)

# ==============================================================================
# 2. DEMOGRAPHICS SCHEMA VALIDATION
# ==============================================================================
def test_demographics_schema_validation():
    demo = {
        "geo_id": "IND_TN_DHM_HRR",
        "total_population": 194820,
        "vulnerability_percentage": 0.58,
        "digital_penetration_index": 0.34,
        "data_source": "SECC_CENSUS_INDIA",
        "is_synthetic": False
    }
    model = DemographicsRecord(**demo)
    assert model.total_population == 194820
    assert model.population == 194820  # Alias check
    assert model.vulnerability_percentage == 0.58

# ==============================================================================
# 3. INFRASTRUCTURE SCHEMA VALIDATION
# ==============================================================================
def test_infrastructure_schema_validation():
    infra = {
        "geo_id": "IND_TN_DHM_HRR",
        "category": "transport",
        "indicator_name": "Evening Public Bus Connectivity Gap",
        "indicator_value": 0.38,
        "national_benchmark": 0.80,
        "deficit_score": 0.72,
        "is_synthetic": False
    }
    model = InfrastructureRecord(**infra)
    assert model.category == "transport"
    assert model.infrastructure_type == "transport"  # Alias check
    assert model.deficit_score == 0.72
    assert model.deficit_value == 0.72  # Alias check

# ==============================================================================
# 4. INVESTMENTS SCHEMA VALIDATION
# ==============================================================================
def test_investment_schema_validation():
    inv = {
        "project_id": "PRJ-TN-PMGSY-088",
        "geo_id": "IND_TN_DHM_HRR",
        "project_name": "Harur-Morappur Road Widening",
        "category": "transport",
        "allocated_budget_inr": 85000000,
        "status": "in_progress",
        "is_synthetic": True,
        "source": "JANSETU_SYNTHETIC_DEMO"
    }
    model = InvestmentRecord(**inv)
    assert model.project_id == "PRJ-TN-PMGSY-088"
    assert model.investment_id == "PRJ-TN-PMGSY-088"  # Alias check
    assert model.allocated_budget_inr == 85000000
    assert model.investment_amount == 85000000.0  # Alias check
    assert model.is_synthetic is True

# ==============================================================================
# 5. CITIZEN REQUEST SCHEMA VALIDATION & PRIVACY INVARIANTS
# ==============================================================================
def test_citizen_request_schema_and_privacy():
    req = {
        "request_id": "REQ-001",
        "geo_id": "IND_TN_DHM_HRR",
        "channel": "voice_web",
        "language": "ta",
        "original_transcript": "பேருந்து வசதி இல்லை",
        "english_translation": "No bus service available",
        "primary_category": "transport",
        "subcategory": "evening_bus",
        "specific_issue": "Lack of buses",
        "severity": 4,
        "urgency_score": 0.85,
        "affected_group": "students",
        "is_synthetic": True
    }
    model = CitizenRequestRecord(**req)
    assert model.language == "ta"
    assert model.channel == "voice_web"
    assert model.source_channel == "voice_web"  # Alias
    assert model.severity == 4
    assert model.urgency == 0.85  # Alias

def test_citizen_request_privacy_leak_rejection():
    """Confirms validator rejects records containing raw unredacted phone numbers."""
    leak_record = {
        "request_id": "REQ-LEAK",
        "geo_id": "IND_TN_DHM_HRR",
        "original_transcript": "My phone number is 9876543210 please call me back.",
        "primary_category": "transport",
        "severity": 3
    }
    is_valid, errors = DataValidator.validate_citizen_request(leak_record)
    assert is_valid is False
    assert any("PRIVACY VIOLATION" in e for e in errors)

# ==============================================================================
# 6. TARGET BIGQUERY 12 CANONICAL TABLES COMPLETENESS
# ==============================================================================
def test_canonical_twelve_tables_present():
    expected_tables = {
        "geography", "demographics", "infrastructure", "investments",
        "citizen_requests", "citizen_request_embeddings", "demand_clusters",
        "hotspots", "silent_need_signals", "evidence_records",
        "policy_scenarios", "impact_metrics"
    }
    assert set(db.CANONICAL_TABLES) == expected_tables
    counts = db.get_table_counts()
    for tbl in expected_tables:
        assert tbl in counts

# ==============================================================================
# 7. SEED PIPELINE REPRODUCIBILITY & IDEMPOTENCY
# ==============================================================================
def test_seed_pipeline_reproducibility_and_idempotency():
    # First seed
    seed_india_pilot_data(clear_first=True)
    counts_first = db.get_table_counts()
    assert counts_first["geography"] >= 15
    assert counts_first["demographics"] >= 6
    assert counts_first["infrastructure"] >= 6
    assert counts_first["investments"] >= 2

    # Second seed with clear_first=True must produce identical counts
    seed_india_pilot_data(clear_first=True)
    counts_second = db.get_table_counts()
    assert counts_first == counts_second

# ==============================================================================
# 8. BIGQUERY GIS FOUNDATION VALIDATION
# ==============================================================================
def test_bigquery_gis_foundation():
    geos = db.get_records("geography")
    for g in geos:
        lat = g.get("latitude")
        lon = g.get("longitude")
        centroid = g.get("centroid")
        if lat is not None and lon is not None:
            assert -90.0 <= lat <= 90.0
            assert -180.0 <= lon <= 180.0
            assert centroid.startswith("POINT(")
            assert str(lon) in centroid or round(lon, 2) in [round(float(x), 2) for x in centroid[6:-1].split()]

# ==============================================================================
# 9. DATA ACCESS LAYER (REPOSITORIES) TESTS
# ==============================================================================
def test_geography_repository():
    node = geography_repo.get_by_geo_id("IND_TN_DHM_HRR")
    assert node is not None
    assert node["geo_name"] == "Harur Block"

    # Test Hierarchy Traversal
    lineage = geography_repo.get_hierarchy("IND_TN_DHM_HRR_V01")
    assert len(lineage) == 5  # Country -> State -> District -> Block -> Village
    assert lineage[0]["geo_id"] == "IND"
    assert lineage[1]["geo_id"] == "IND_TN"
    assert lineage[2]["geo_id"] == "IND_TN_DHM"
    assert lineage[3]["geo_id"] == "IND_TN_DHM_HRR"
    assert lineage[4]["geo_id"] == "IND_TN_DHM_HRR_V01"

    # Test Children
    children = geography_repo.get_children("IND_TN_DHM_HRR")
    assert len(children) >= 2

def test_demographics_and_infrastructure_repositories():
    demo = demographics_repo.get_by_geo_id("IND_TN_DHM_HRR")
    assert demo is not None
    assert demo["total_population"] == 194820

    vulnerable = demographics_repo.get_vulnerable_regions(threshold=0.60)
    assert len(vulnerable) >= 2  # Aheri (0.82) and Pennagaram (0.64)

    infra_items = infrastructure_repo.list_by_geo_id("IND_TN_DHM_HRR")
    assert len(infra_items) >= 3

    high_def = infrastructure_repo.get_high_deficit_areas(min_deficit=0.70)
    assert len(high_def) >= 3

def test_investment_and_citizen_request_repositories():
    capex = investment_repo.get_total_allocated_by_geo("IND_TN_DHM_HRR")
    assert capex == 85000000

    requests = citizen_request_repo.list_by_geo_id("IND_TN_DHM_HRR")
    assert len(requests) >= 1
    assert requests[0]["language"] == "ta"

# ==============================================================================
# 10. DATA QUALITY AUDITOR REPORT VALIDATION
# ==============================================================================
def test_data_quality_report():
    report = DataQualityAuditor.audit_store(db._store)
    assert report.total_records > 0
    assert report.geographic_hierarchy_valid is True
    assert report.missing_geo_references == 0
    assert report.status == "HEALTHY"
    assert "geography" in report.table_summaries
    assert "OFFICIAL_LGD" in report.provenance_sources

# ==============================================================================
# 11. DIAGNOSTIC REST API ENDPOINTS
# ==============================================================================
@pytest.mark.asyncio
async def test_api_data_status_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/data/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["bigquery_connected"] is True
    assert data["canonical_tables_count"] == 12
    assert data["total_records"] > 0
    assert "geography" in data["table_counts"]

@pytest.mark.asyncio
async def test_api_data_geography_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/data/geography/IND_TN_DHM_HRR")
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "ok"
    payload = res["data"]
    assert payload["record"]["geo_id"] == "IND_TN_DHM_HRR"
    assert len(payload["hierarchy_path"]) == 4  # Country -> State -> District -> Block
    assert payload["subdivisions_count"] >= 2

@pytest.mark.asyncio
async def test_api_data_quality_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/data/quality")
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "ok"
    assert res["data"]["geographic_hierarchy_valid"] is True
    assert res["data"]["missing_geo_references"] == 0
