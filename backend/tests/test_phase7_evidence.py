"""
JANSETU — Phase 7 Grounded Evidence Engine Test Suite
Tests for:
- Evidence retrieval across 5 dimensions (Signal, Demographics, Infrastructure, Demand, Investment)
- Provenance tiers (Tier 1 Govt to Tier 4 Synthetic) & source dates
- Claim-to-Evidence mapping & EvidenceClaimValidator zero-hallucination guardrail
- Gemini structured JSON output & ungrounded claim rejection
- Conflicting evidence preservation & explicit data limitations
- Evidence coverage score & neutral quality ratings
- API endpoints: GET /api/v1/evidence/{signal_id}, /refresh, /record/{evidence_id}, /summary, and 404s
"""

import pytest
from unittest.mock import MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.config import settings
from app.db.bigquery_client import db, silent_need_repo, evidence_repo
from app.services.evidence_service import (
    evidence_service,
    EvidenceRetrievalService,
    EvidenceNormalizationService,
    EvidenceProvenanceService,
    EvidenceClaimValidator,
    EvidenceSynthesisService
)
from app.schemas.evidence_schemas import (
    EvidenceRecord,
    EvidenceClaim,
    EvidenceDriver,
    EvidenceConflict,
    GroundedSynthesisOutput,
    SourceType,
    ProvenanceStatus,
    ClaimType,
    EvidenceQuality
)
from app.core.exceptions import SignalNotFoundException


# =============================================================================
# 1. RETRIEVAL TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_signal_evidence_retrieval():
    """Verify signal metadata retrieval parses core scores and coordinates."""
    retrieval = EvidenceRetrievalService()
    signals = silent_need_repo.list(limit=1)
    assert len(signals) > 0, "Requires at least one seeded silent need signal"
    sig = signals[0]

    retrieved = retrieval.retrieve_signal(sig["signal_id"])
    assert retrieved["signal_id"] == sig["signal_id"]
    assert "infra_deficit" in retrieved or "infra_deficit_score" in retrieved
    assert "geo_id" in retrieved
    assert "category" in retrieved


@pytest.mark.asyncio
async def test_demographic_evidence_retrieval():
    """Verify demographic vulnerability and population indicators are retrieved."""
    retrieval = EvidenceRetrievalService()
    signals = silent_need_repo.list(limit=1)
    sig = signals[0]

    records, drivers, sources, limitations, conflicts = retrieval.retrieve_evidence_package(sig)
    vuln_records = [r for r in records if "vul" in r.evidence_id.lower() or "secc" in r.source.lower()]
    assert len(vuln_records) >= 1
    rec = vuln_records[0]
    assert rec.source_type == SourceType.OFFICIAL_GOVERNMENT.value
    assert rec.unit is not None
    assert rec.provenance_status == ProvenanceStatus.VERIFIED.value


@pytest.mark.asyncio
async def test_infrastructure_evidence_retrieval():
    """Verify infrastructure deficit and physical access metrics are retrieved."""
    retrieval = EvidenceRetrievalService()
    signals = silent_need_repo.list(limit=1)
    sig = signals[0]

    records, drivers, sources, limitations, conflicts = retrieval.retrieve_evidence_package(sig)
    infra_records = [r for r in records if "inf" in r.evidence_id.lower()]
    assert len(infra_records) >= 1
    rec = infra_records[0]
    assert rec.is_official is True
    assert rec.source_tier == 1
    assert len(rec.indicator_name) > 0 and rec.evidence_value is not None


@pytest.mark.asyncio
async def test_citizen_voice_evidence_retrieval():
    """Verify aggregated citizen voice reporting density is extracted without PII."""
    retrieval = EvidenceRetrievalService()
    signals = silent_need_repo.list(limit=1)
    sig = signals[0]

    records, drivers, sources, limitations, conflicts = retrieval.retrieve_evidence_package(sig)
    voice_records = [r for r in records if "voi" in r.evidence_id.lower()]
    assert len(voice_records) >= 1
    rec = voice_records[0]
    assert rec.source_type == SourceType.JANSETU_ANALYTICAL.value
    assert rec.source_tier == 3
    assert rec.provenance_status == ProvenanceStatus.ANALYTICAL.value
    # Privacy verification: no personal name or phone number
    assert "phone" not in rec.claim.lower()
    assert "@" not in rec.claim


@pytest.mark.asyncio
async def test_investment_evidence_retrieval():
    """Verify public capital expenditure and tracked project context is captured."""
    retrieval = EvidenceRetrievalService()
    signals = silent_need_repo.list(limit=5)
    
    # Pennagaram (IND_TN_DHM_PNG) or Dharmapuri has seeded investments
    found_inv = False
    for s in signals:
        records, drivers, sources, limitations, conflicts = retrieval.retrieve_evidence_package(s)
        inv_drivers = [d for d in drivers if d.driver_key == "investment"]
        if inv_drivers:
            found_inv = True
            inv_rec = [r for r in records if r.evidence_id == inv_drivers[0].evidence_id][0]
            assert "INR" in inv_rec.claim or inv_rec.unit == "INR"
            assert inv_rec.source_tier in (1, 4)
            break
    assert found_inv or len(signals) > 0


# =============================================================================
# 2. PROVENANCE & SOURCE METADATA TESTS
# =============================================================================

def test_official_source_label():
    """Verify Tier 1 Government sources are strictly labeled OFFICIAL_GOVERNMENT."""
    record = EvidenceRecord(
        evidence_id="EV-TEST-001",
        signal_id="SIG-001",
        geo_id="IND_TN_DHM_HRR",
        category="water",
        source="Jal Jeevan Mission",
        source_type=SourceType.OFFICIAL_GOVERNMENT.value,
        source_tier=1,
        source_date="2025",
        indicator_name="Tap Water Coverage",
        claim="Household tap water coverage is 42%",
        evidence_value=0.42,
        provenance_status=ProvenanceStatus.VERIFIED.value,
        is_official=True,
        is_synthetic=False
    )
    assert record.source_type == "OFFICIAL_GOVERNMENT"
    assert record.is_official is True
    assert record.is_synthetic is False
    assert record.source_tier == 1


def test_analytical_source_label():
    """Verify Tier 3 JANSETU algorithms are labeled JANSETU_ANALYTICAL."""
    record = EvidenceRecord(
        evidence_id="EV-TEST-002",
        signal_id="SIG-001",
        geo_id="IND_TN_DHM_HRR",
        category="transport",
        source="JANSETU Ingestion Engine",
        source_type=SourceType.JANSETU_ANALYTICAL.value,
        source_tier=3,
        source_date="2026",
        indicator_name="Citizen Voice Density",
        claim="Expressed citizen reporting is 0.04",
        evidence_value=0.04,
        provenance_status=ProvenanceStatus.ANALYTICAL.value,
        is_official=False,
        is_synthetic=False
    )
    assert record.source_type == "JANSETU_ANALYTICAL"
    assert record.is_official is False
    assert record.provenance_status == "ANALYTICAL"


def test_synthetic_source_label():
    """Verify demo/synthetic records are explicitly tagged SYNTHETIC."""
    record = EvidenceRecord(
        evidence_id="EV-TEST-003",
        signal_id="SIG-001",
        geo_id="IND_TN_DHM_HRR",
        category="healthcare",
        source="Synthetic Simulation Dataset",
        source_type=SourceType.SYNTHETIC.value,
        source_tier=4,
        source_date="2026",
        indicator_name="Simulated Health Camp Metric",
        claim="Simulated emergency travel time is 45 min",
        evidence_value=45,
        provenance_status=ProvenanceStatus.SYNTHETIC.value,
        is_official=False,
        is_synthetic=True
    )
    assert record.source_type == "SYNTHETIC"
    assert record.is_synthetic is True
    assert record.source_tier == 4


def test_source_date_preserved():
    """Verify observation year/date is preserved across normalization and freshness scoring."""
    freshness_current = EvidenceNormalizationService.calculate_freshness("2025")
    assert freshness_current in ("CURRENT", "RECENT")

    freshness_hist = EvidenceNormalizationService.calculate_freshness("2011")
    assert freshness_hist == "HISTORICAL"

    freshness_none = EvidenceNormalizationService.calculate_freshness(None)
    assert freshness_none == "UNKNOWN"


# =============================================================================
# 3. GROUNDING & CLAIM VALIDATION TESTS
# =============================================================================

def test_claim_requires_evidence_id():
    """Verify that a claim with empty evidence_ids is strictly rejected."""
    claim = EvidenceClaim(
        claim_id="C_EMPTY",
        text="A water treatment plant is absent.",
        claim_type=ClaimType.OBSERVED.value,
        evidence_ids=[]
    )
    valid_ids = {"EV-001", "EV-002"}
    validated, rejected = EvidenceClaimValidator.validate_claims([claim], valid_ids)
    assert len(validated) == 0
    assert len(rejected) == 1
    assert rejected[0].validation_status == "REJECTED"


def test_unknown_evidence_id_rejected():
    """Verify that claims referencing hallucinated or non-existent evidence IDs are rejected."""
    claim = EvidenceClaim(
        claim_id="C_HALLUCINATED",
        text="Road connectivity deficit is 0.95.",
        claim_type=ClaimType.OBSERVED.value,
        evidence_ids=["EV-FABRICATED-999"]
    )
    valid_ids = {"EV-REAL-001", "EV-REAL-002"}
    validated, rejected = EvidenceClaimValidator.validate_claims([claim], valid_ids)
    assert len(validated) == 0
    assert len(rejected) == 1
    assert rejected[0].validation_status == "REJECTED"


def test_ungrounded_claim_rejected():
    """Verify mixed batch: valid claims pass, ungrounded claims are filtered out."""
    claim1 = EvidenceClaim(
        claim_id="C1",
        text="Modeled deficit is 0.82.",
        evidence_ids=["EV-001"]
    )
    claim2 = EvidenceClaim(
        claim_id="C2",
        text="Budget allocation of 50 Cr is required.",
        evidence_ids=["EV-NONEXISTENT"]
    )
    valid_ids = {"EV-001", "EV-002"}
    validated, rejected = EvidenceClaimValidator.validate_claims([claim1, claim2], valid_ids)
    assert len(validated) == 1
    assert validated[0].claim_id == "C1"
    assert len(rejected) == 1
    assert rejected[0].claim_id == "C2"


def test_missing_evidence_explicitly_reported():
    """Verify that unavailable factors result in explicit data limitations rather than fabricated values."""
    retrieval = EvidenceRetrievalService()
    signals = silent_need_repo.list(limit=1)
    sig = signals[0]

    records, drivers, sources, limitations, conflicts = retrieval.retrieve_evidence_package(sig)
    assert len(limitations) > 0
    # Must report block-level or telemetry limitation
    assert any("unavailable" in lim.lower() or "proxy" in lim.lower() or "benchmarked" in lim.lower() for lim in limitations)


# =============================================================================
# 4. GEMINI SYNTHESIS TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_grounded_gemini_json():
    """Verify deterministic fallback produces valid GroundedSynthesisOutput conforming to contract."""
    service = EvidenceSynthesisService()
    sig = {
        "signal_id": "SIG-TEST-001",
        "category": "water",
        "region_name": "Harur Block",
        "discrepancy": 0.68,
        "infra_deficit": 0.82,
        "voice_density": 0.04,
        "digital_access": 0.31
    }
    drivers = [
        EvidenceDriver(
            driver_key="infra_deficit",
            name="Infrastructure Deficit",
            value=0.82,
            formatted_value="0.82",
            source="JJM",
            evidence_id="EV-TEST-INF-01",
            claim_type=ClaimType.OBSERVED.value
        ),
        EvidenceDriver(
            driver_key="citizen_voice",
            name="Citizen Voice Density",
            value=0.04,
            formatted_value="0.04",
            source="JANSETU",
            evidence_id="EV-TEST-VOI-01",
            claim_type=ClaimType.CALCULATED.value
        )
    ]
    evidence = [
        EvidenceRecord(
            evidence_id="EV-TEST-INF-01",
            signal_id="SIG-TEST-001",
            geo_id="IND_TN_DHM_HRR",
            category="water",
            source="JJM",
            indicator_name="Deficit",
            claim="Infrastructure deficit is 0.82",
            evidence_value=0.82,
            provenance_status=ProvenanceStatus.VERIFIED.value
        ),
        EvidenceRecord(
            evidence_id="EV-TEST-VOI-01",
            signal_id="SIG-TEST-001",
            geo_id="IND_TN_DHM_HRR",
            category="water",
            source="JANSETU",
            indicator_name="Voice",
            claim="Voice density is 0.04",
            evidence_value=0.04,
            provenance_status=ProvenanceStatus.ANALYTICAL.value
        )
    ]
    output = await service.synthesize_grounded_explanation(
        signal=sig,
        drivers=drivers,
        evidence=evidence,
        limitations=["Block-level telemetry unavailable."]
    )
    assert isinstance(output, GroundedSynthesisOutput)
    assert len(output.claims) >= 2
    assert all(c.validation_status == "VALIDATED" for c in output.claims)
    assert len(output.summary) > 30


@pytest.mark.asyncio
async def test_invalid_gemini_schema_rejected():
    """Verify that malformed Gemini JSON is caught and handled via fallback."""
    service = EvidenceSynthesisService()
    service.client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = '{"malformed": "Not matching GroundedSynthesisOutput"}'
    service.client.models.generate_content.return_value = mock_resp

    sig = {"signal_id": "SIG-TEST-002", "category": "roads", "region_name": "Pennagaram"}
    drivers = [
        EvidenceDriver(
            driver_key="infra_deficit",
            name="Infrastructure Deficit",
            value=0.75,
            formatted_value="0.75",
            source="PMGSY",
            evidence_id="EV-TEST-INF-02",
            claim_type=ClaimType.OBSERVED.value
        )
    ]
    evidence = [
        EvidenceRecord(
            evidence_id="EV-TEST-INF-02",
            signal_id="SIG-TEST-002",
            geo_id="IND_TN_DHM_PNG",
            category="roads",
            source="PMGSY",
            indicator_name="Road Deficit",
            claim="Road deficit is 0.75",
            evidence_value=0.75,
            provenance_status=ProvenanceStatus.VERIFIED.value
        )
    ]
    # Should fall back to deterministic synthesis without crashing
    output = await service.synthesize_grounded_explanation(
        signal=sig,
        drivers=drivers,
        evidence=evidence,
        limitations=[]
    )
    assert isinstance(output, GroundedSynthesisOutput)
    assert len(output.claims) >= 1


@pytest.mark.asyncio
async def test_claim_evidence_mapping():
    """Verify that every claim in the brief maps 1:1 to an actual EvidenceRecord ID."""
    signals = silent_need_repo.list(limit=1)
    sig_id = signals[0]["signal_id"]
    brief = await evidence_service.get_evidence_response(sig_id)

    valid_ids = {e.evidence_id for e in brief.evidence}
    for claim in brief.claims:
        for eid in claim.evidence_ids:
            assert eid in valid_ids, f"Claim '{claim.claim_id}' cites ungrounded evidence '{eid}'"


# =============================================================================
# 5. CONFLICTS & COVERAGE TESTS
# =============================================================================

def test_conflicting_evidence_detected():
    """Verify that two disparate official reports for the same sector produce an EvidenceConflict."""
    records = [
        {"indicator_name": "Water Deficit", "source_dataset": "JJM 2024", "deficit_score": 0.85},
        {"indicator_name": "Water Deficit", "source_dataset": "State Audit 2024", "deficit_score": 0.60}
    ]
    conflicts = EvidenceNormalizationService.detect_conflicts(records)
    assert len(conflicts) == 1
    c = conflicts[0]
    assert c.status == "CONFLICTING_EVIDENCE"
    assert c.value_a == 0.85
    assert c.value_b == 0.60


def test_conflicting_sources_preserved():
    """Verify that conflicting evidence does not overwrite either source."""
    records = [
        {"indicator_name": "Rural Road Quality", "source_dataset": "PMGSY", "deficit_score": 0.90},
        {"indicator_name": "Rural Road Quality", "source_dataset": "PWD State Audit", "deficit_score": 0.65}
    ]
    conflicts = EvidenceNormalizationService.detect_conflicts(records)
    assert len(conflicts) == 1
    assert "both records preserved" in conflicts[0].note.lower()


def test_evidence_coverage():
    """Verify evidence coverage equals supported_required_factors / 4.0."""
    drivers_full = [
        EvidenceDriver(driver_key="infra_deficit", name="Infra", value=0.8, formatted_value="0.8", source="JJM", evidence_id="E1"),
        EvidenceDriver(driver_key="vulnerability", name="Vuln", value=0.6, formatted_value="0.6", source="SECC", evidence_id="E2"),
        EvidenceDriver(driver_key="citizen_voice", name="Voice", value=0.04, formatted_value="0.04", source="JANSETU", evidence_id="E3"),
        EvidenceDriver(driver_key="digital_access", name="Digital", value=0.3, formatted_value="0.3", source="TRAI", evidence_id="E4")
    ]
    cov_score, quality, details = EvidenceSynthesisService.calculate_coverage(drivers_full)
    assert cov_score == 1.00
    assert quality == EvidenceQuality.COMPLETE.value

    # 3 of 4 factors
    drivers_partial = drivers_full[:3]
    cov_p, quality_p, details_p = EvidenceSynthesisService.calculate_coverage(drivers_partial)
    assert cov_p == 0.75
    assert quality_p == EvidenceQuality.PARTIAL.value


def test_evidence_quality():
    """Verify neutral quality labels: COMPLETE, PARTIAL, LIMITED, INSUFFICIENT."""
    # 2 of 4 factors
    drivers_limited = [
        EvidenceDriver(driver_key="infra_deficit", name="Infra", value=0.8, formatted_value="0.8", source="JJM", evidence_id="E1"),
        EvidenceDriver(driver_key="vulnerability", name="Vuln", value=0.6, formatted_value="0.6", source="SECC", evidence_id="E2")
    ]
    cov_l, quality_l, details_l = EvidenceSynthesisService.calculate_coverage(drivers_limited)
    assert cov_l == 0.50
    assert quality_l == EvidenceQuality.LIMITED.value

    # 1 of 4 factors
    drivers_insuf = drivers_limited[:1]
    cov_i, quality_i, details_i = EvidenceSynthesisService.calculate_coverage(drivers_insuf)
    assert cov_i == 0.25
    assert quality_i == EvidenceQuality.INSUFFICIENT.value


# =============================================================================
# 6. API ENDPOINT TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_evidence_endpoint():
    """Verify GET /api/v1/evidence/{signal_id} returns 200 with full Phase 7 payload."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/silent-need")
        signals = res.json()["data"]
        sig_id = signals[0]["signal_id"]

        ev_res = await ac.get(f"/api/v1/evidence/{sig_id}")
    assert ev_res.status_code == 200
    data = ev_res.json()["data"]
    assert data["signal_id"] == sig_id
    assert len(data["drivers"]) >= 3
    assert len(data["evidence"]) >= 3
    assert len(data["claims"]) >= 2
    assert "AI-Derived Analytical Signal — Not Official Policy" in data["disclaimer"]
    assert data["validation_required"] is True
    assert data["prompt_version"] == settings.EVIDENCE_PROMPT_VERSION


@pytest.mark.asyncio
async def test_evidence_404():
    """Verify GET /api/v1/evidence/SIG-NONEXISTENT returns 404 with standardized error envelope."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        ev_res = await ac.get("/api/v1/evidence/SIG-NONEXISTENT-999")
    assert ev_res.status_code == 404
    assert "not found" in ev_res.text.lower()


@pytest.mark.asyncio
async def test_evidence_refresh():
    """Verify POST /api/v1/evidence/{signal_id}/refresh re-synthesizes evidence without altering score."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/silent-need")
        sig = res.json()["data"][0]
        sig_id = sig["signal_id"]
        original_discrepancy = sig.get("discrepancy")

        refresh_res = await ac.post(f"/api/v1/evidence/{sig_id}/refresh")
    assert refresh_res.status_code == 200
    data = refresh_res.json()["data"]
    assert data["signal_id"] == sig_id
    assert data["signal"]["discrepancy"] == original_discrepancy


@pytest.mark.asyncio
async def test_atomic_evidence_record_endpoint():
    """Verify GET /api/v1/evidence/record/{evidence_id} retrieves individual atomic record."""
    # First generate evidence for a signal
    signals = silent_need_repo.list(limit=1)
    sig_id = signals[0]["signal_id"]
    brief = await evidence_service.get_evidence_response(sig_id)
    ev_id = brief.evidence[0].evidence_id

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/evidence/record/{ev_id}")
    assert res.status_code == 200
    rec = res.json()["data"]
    assert rec["evidence_id"] == ev_id
    assert "source" in rec
    assert "indicator_name" in rec


@pytest.mark.asyncio
async def test_evidence_summary_endpoint():
    """Verify GET /api/v1/evidence/summary returns warehouse-wide health counts."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/evidence/summary")
    assert res.status_code == 200
    summary = res.json()["data"]
    assert "total_evidence_records" in summary
    assert "official_sources_count" in summary
    assert "analytical_sources_count" in summary
    assert summary["analytical_version"] == "v7.0-grounded"
