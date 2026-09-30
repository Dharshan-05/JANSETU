"""
JANSETU — Grounded Evidence Schemas (Phase 7)
Strict Pydantic models for atomic evidence records, claims, sources,
provenance tiers, quality ratings, and grounded Gemini synthesis outputs.
"""

from typing import List, Optional, Dict, Any, Union
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime


class SourceType(str, Enum):
    OFFICIAL_GOVERNMENT = "OFFICIAL_GOVERNMENT"
    OFFICIAL_INSTITUTION = "OFFICIAL_INSTITUTION"
    JANSETU_ANALYTICAL = "JANSETU_ANALYTICAL"
    SYNTHETIC = "SYNTHETIC"


class ProvenanceStatus(str, Enum):
    VERIFIED = "VERIFIED"
    ANALYTICAL = "ANALYTICAL"
    SYNTHETIC = "SYNTHETIC"
    UNAVAILABLE = "UNAVAILABLE"


class ClaimType(str, Enum):
    OBSERVED = "OBSERVED"
    CALCULATED = "CALCULATED"
    ANALYTICAL = "ANALYTICAL"
    CONTEXTUAL = "CONTEXTUAL"
    UNAVAILABLE = "UNAVAILABLE"


class EvidenceQuality(str, Enum):
    COMPLETE = "COMPLETE"
    PARTIAL = "PARTIAL"
    LIMITED = "LIMITED"
    INSUFFICIENT = "INSUFFICIENT"


class EvidenceFreshness(str, Enum):
    CURRENT = "CURRENT"
    RECENT = "RECENT"
    HISTORICAL = "HISTORICAL"
    UNKNOWN = "UNKNOWN"


class EvidenceRecord(BaseModel):
    """
    Atomic factual observation.
    Must represent one atomic factual measurement, NOT an interpretation.
    """
    evidence_id: str = Field(..., description="Unique evidence citation identifier e.g. EV-001")
    signal_id: str = Field(..., description="Associated silent need signal ID")
    geo_id: str = Field(..., description="Associated geographic identifier")
    category: str = Field(..., description="Infrastructure sector / taxonomy")
    
    source: str = Field(..., description="Human-readable source organization or scheme name")
    source_type: str = Field(default=SourceType.OFFICIAL_GOVERNMENT.value, description="OFFICIAL_GOVERNMENT, OFFICIAL_INSTITUTION, JANSETU_ANALYTICAL, SYNTHETIC")
    source_tier: int = Field(default=1, ge=1, le=4, description="Tier 1 (Govt), Tier 2 (Inst), Tier 3 (Analytics), Tier 4 (Synthetic)")
    source_date: Optional[str] = Field(default=None, description="Year or ISO date of source observation")
    
    indicator_name: str = Field(..., description="Exact indicator name e.g. households with tap water")
    claim: str = Field(..., description="Atomic factual statement")
    evidence_value: Any = Field(..., description="Measured or calculated value")
    unit: Optional[str] = Field(default=None, description="Measurement unit (%, km, count, ratio, etc.)")
    
    dataset_id: Optional[str] = Field(default=None, description="Official dataset identifier e.g. JJM-DDWS, SECC-2021")
    record_reference: Optional[str] = Field(default=None, description="Specific row, document, or table reference ID")
    
    provenance_status: str = Field(default=ProvenanceStatus.VERIFIED.value, description="VERIFIED, ANALYTICAL, SYNTHETIC, UNAVAILABLE")
    is_official: bool = Field(default=True, description="True if Tier 1 or Tier 2 official data")
    is_synthetic: bool = Field(default=False, description="True if realistic mock/demo data")
    
    retrieval_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    freshness: Optional[str] = Field(default=EvidenceFreshness.CURRENT.value)
    source_url: Optional[str] = Field(default=None, description="Documented official link if verified, else None")


class EvidenceClaim(BaseModel):
    """
    Individual synthesized claim with explicit provenance to one or more evidence IDs.
    """
    claim_id: str = Field(..., description="Claim reference ID e.g. C1")
    text: str = Field(..., description="Factual statement synthesized from evidence")
    claim_type: str = Field(default=ClaimType.OBSERVED.value, description="OBSERVED, CALCULATED, ANALYTICAL, CONTEXTUAL, UNAVAILABLE")
    evidence_ids: List[str] = Field(default_factory=list, description="Must map to existing atomic EvidenceRecord IDs")
    validation_status: Optional[str] = Field(default="VALIDATED", description="VALIDATED or REJECTED")


class EvidenceDriver(BaseModel):
    """
    One of the primary signal drivers (Infra Deficit, Vulnerability, Citizen Voice, Digital Access, Investment)
    with exact backing evidence metadata.
    """
    driver_key: str = Field(..., description="Unique driver key e.g. infra_deficit, vulnerability, citizen_voice, digital_access, investment")
    name: str = Field(..., description="Human-readable driver title")
    value: Any = Field(..., description="Raw metric value")
    formatted_value: str = Field(..., description="Formatted display string")
    source: str = Field(..., description="Dataset or source name")
    source_date: Optional[str] = Field(default=None, description="Observation year or date")
    evidence_id: str = Field(..., description="Backing EvidenceRecord ID")
    claim_type: str = Field(default=ClaimType.OBSERVED.value)
    status: str = Field(default="VERIFIED", description="VERIFIED, ANALYTICAL, PARTIAL, UNAVAILABLE")
    description: Optional[str] = Field(default=None)


class EvidenceSource(BaseModel):
    """
    Metadata about an individual source represented in the evidence package.
    """
    source_name: str
    dataset_id: str
    source_type: str
    source_tier: int
    source_date: Optional[str] = None
    geographic_level: str
    provenance_status: str
    is_synthetic: bool = False
    source_url: Optional[str] = None


class EvidenceLimitation(BaseModel):
    """
    Explicit disclosure of missing data or foundation boundaries.
    """
    limitation_id: str
    factor: str
    description: str
    impact: Optional[str] = None


class EvidenceConflict(BaseModel):
    """
    Discrepancy or conflict between multiple sources.
    Both sources are preserved and surfaced transparently.
    """
    conflict_id: str
    indicator_name: str
    source_a: str
    value_a: Any
    source_b: str
    value_b: Any
    status: str = "CONFLICTING_EVIDENCE"
    note: str = "Available sources report different values; both records preserved without arbitrary override."


class GroundedSynthesisOutput(BaseModel):
    """
    Strict contract enforced on Gemini 2.5 Flash for grounded synthesis.
    Output must be strict JSON matching this structure.
    """
    summary: str = Field(..., description="Concise factual explanation grounded exclusively in supplied evidence")
    claims: List[EvidenceClaim] = Field(..., description="Atomic claims citing evidence IDs")
    limitations: List[str] = Field(default_factory=list, description="Explicit boundaries and unavailable indicators")
    validation_required: bool = True


class EvidenceTrailItem(BaseModel):
    """
    Backwards compatibility trail item.
    """
    evidence_type: str
    dataset_source: str
    metric: str
    observed_value: str
    benchmark: Optional[str] = None
    deficit_percentage: Optional[str] = None


class EvidenceResponse(BaseModel):
    """
    Full Grounded Evidence Brief returned by GET /api/v1/evidence/{signal_id}.
    """
    signal_id: str
    geo_id: str
    category: str
    
    signal: Dict[str, Any]
    drivers: List[EvidenceDriver]
    
    evidence: List[EvidenceRecord]
    claims: List[EvidenceClaim]
    
    evidence_coverage: float = Field(..., ge=0.0, le=1.0, description="Ratio of supported required factors (e.g. 4/4 = 1.0)")
    evidence_quality: str = Field(..., description="COMPLETE, PARTIAL, LIMITED, INSUFFICIENT")
    coverage_details: Optional[Dict[str, str]] = None
    
    sources: Optional[List[EvidenceSource]] = None
    limitations: List[str] = Field(default_factory=list)
    conflicts: List[EvidenceConflict] = Field(default_factory=list)
    
    validation_required: bool = True
    analytical_version: str = "v6.0-deterministic"
    prompt_version: str = "v7.0-grounded"
    retrieval_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    
    # Textual syntheses & UI helpers
    summary: Optional[str] = None
    supported_evidence_ids: Optional[List[str]] = None
    
    # Backwards compatibility fields for legacy clients / tests
    target_region: Optional[str] = None
    ai_hypothesis: Optional[str] = None
    confidence_rating: Optional[float] = 0.90
    confidence_rationale: Optional[str] = "Derived from multi-source cross-referencing between official infrastructure audits and demographic indices."
    grounded_evidence_trail: Optional[List[EvidenceTrailItem]] = None
    gemini_summary: Optional[str] = None
    
    # Mandatory disclaimers
    disclaimer: str = (
        "AI-Derived Analytical Signal — Not Official Policy. "
        "Scenario estimate — not a guaranteed outcome. Inferred analytical signal requiring district field validation. "
        "Does not execute autonomous funding."
    )
    validation_requirement: str = "Potential Silent Need Signal — requires administrative field validation."
    
    audit_trail: Optional[Dict[str, Any]] = None


class EvidenceSummary(BaseModel):
    """
    Evidence warehouse health metrics for monitoring dashboards.
    """
    total_evidence_records: int
    official_sources_count: int
    analytical_sources_count: int
    synthetic_sources_count: int
    verified_coverage_pct: float
    analytical_version: str = "v7.0-grounded"
    disclaimer: str = "AI-Derived Analytical Signal — Not Official Policy"
