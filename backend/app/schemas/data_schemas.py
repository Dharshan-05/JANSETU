from typing import List, Dict, Any, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field, model_validator

# ==============================================================================
# 1. CANONICAL GEOGRAPHY MODEL
# ==============================================================================
class GeographyRecord(BaseModel):
    geo_id: str = Field(description="Unique LGD code or hierarchical geo ID, e.g. IND_TN_DHM_HRR")
    parent_geo_id: Optional[str] = Field(default=None, description="Parent geography ID in hierarchy")
    geo_level: int = Field(ge=0, le=4, description="0=Country, 1=State, 2=District, 3=Block, 4=Village/Ward")
    admin_level: Optional[int] = Field(default=None, description="Alias for geo_level")
    geo_name: str = Field(description="Canonical English geographical name")
    name: Optional[str] = Field(default=None, description="Alias for geo_name")
    native_name: Optional[str] = Field(default=None, description="Endonym in official state script")
    state_code: str = Field(description="2-letter state code (e.g. TN, UP, TG, MH, IN)")
    district_code: Optional[str] = Field(default=None)
    block_code: Optional[str] = Field(default=None)
    lgd_code: Optional[str] = Field(default=None, description="Ministry of Panchayati Raj LGD code")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    geometry: Optional[str] = Field(default=None, description="WKT or GeoJSON geometry string")
    centroid: Optional[str] = Field(default=None, description="ST_GEOGPOINT representation")
    population_reference: Optional[int] = Field(default=None, ge=0)
    is_pilot_region: bool = Field(default=False)
    is_synthetic: bool = Field(default=False)
    source: str = Field(default="OFFICIAL_LGD")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "geo_level" not in values and "admin_level" in values:
                values["geo_level"] = values["admin_level"]
            elif "admin_level" not in values and "geo_level" in values:
                values["admin_level"] = values["geo_level"]

            if "geo_name" not in values and "name" in values:
                values["geo_name"] = values["name"]
            elif "name" not in values and "geo_name" in values:
                values["name"] = values["geo_name"]
        return values

# ==============================================================================
# 2. CANONICAL DEMOGRAPHICS MODEL
# ==============================================================================
class DemographicsRecord(BaseModel):
    geo_id: str = Field(description="Foreign key referencing geography.geo_id")
    census_year: int = Field(default=2021)
    total_population: int = Field(ge=0, description="Total population count")
    population: Optional[int] = Field(default=None, ge=0, description="Alias for total_population")
    households: Optional[int] = Field(default=None, ge=0)
    male_population: Optional[int] = Field(default=None, ge=0)
    female_population: Optional[int] = Field(default=None, ge=0)
    sc_st_population: Optional[int] = Field(default=None, ge=0)
    vulnerability_percentage: float = Field(ge=0.0, le=1.0, description="SECC Deprivation index")
    vulnerability_indicators: Optional[Dict[str, Any]] = Field(default=None)
    elderly_percentage: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    literacy_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    digital_penetration_index: float = Field(ge=0.0, le=1.0, description="Smartphone/cellular data penetration")
    primary_livelihood: Optional[str] = Field(default=None)
    data_source: str = Field(default="SECC_CENSUS_INDIA")
    source_date: Optional[date] = None
    is_synthetic: bool = Field(default=False)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "total_population" not in values and "population" in values:
                values["total_population"] = values["population"]
            elif "population" not in values and "total_population" in values:
                values["population"] = values["total_population"]
        return values

# ==============================================================================
# 3. CANONICAL INFRASTRUCTURE MODEL
# ==============================================================================
class InfrastructureRecord(BaseModel):
    geo_id: str = Field(description="Foreign key referencing geography.geo_id")
    category: str = Field(description="transport, water, healthcare, education, electricity, sanitation, roads")
    infrastructure_type: Optional[str] = Field(default=None, description="Alias for category")
    indicator_name: str = Field(description="Standardized metric name")
    indicator_value: float = Field(description="Observed measurement value in the field")
    availability_value: Optional[float] = Field(default=None)
    coverage_value: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    national_benchmark: float = Field(description="National or state benchmark")
    deficit_score: float = Field(ge=0.0, le=1.0, description="Normalized gap score 0.0 - 1.0")
    deficit_value: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Alias for deficit_score")
    measurement_unit: Optional[str] = Field(default=None)
    last_audited_at: Optional[date] = None
    source_date: Optional[date] = None
    source_dataset: Optional[str] = Field(default=None)
    source: str = Field(default="GOV_INFRA_AUDIT")
    is_synthetic: bool = Field(default=False)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "category" not in values and "infrastructure_type" in values:
                values["category"] = values["infrastructure_type"]
            elif "infrastructure_type" not in values and "category" in values:
                values["infrastructure_type"] = values["category"]

            if "deficit_score" not in values and "deficit_value" in values:
                values["deficit_score"] = values["deficit_value"]
            elif "deficit_value" not in values and "deficit_score" in values:
                values["deficit_value"] = values["deficit_score"]

            if "source" not in values and "source_dataset" in values:
                values["source"] = values["source_dataset"]
            elif "source_dataset" not in values and "source" in values:
                values["source_dataset"] = values["source"]
        return values

# ==============================================================================
# 4. CANONICAL INVESTMENTS MODEL
# ==============================================================================
class InvestmentRecord(BaseModel):
    project_id: str = Field(description="Project tracking ID")
    investment_id: Optional[str] = Field(default=None, description="Alias for project_id")
    geo_id: str = Field(description="Foreign key referencing geography.geo_id")
    project_name: str = Field(description="Official scheme work title")
    scheme_name: Optional[str] = Field(default=None, description="PMGSY, JJM, AMRUT, etc.")
    category: str = Field(description="transport, water, healthcare, etc.")
    sector: Optional[str] = Field(default=None, description="Alias for category")
    allocated_budget_inr: int = Field(ge=0, description="Sanctioned budget in INR")
    investment_amount: Optional[float] = Field(default=None, ge=0.0, description="Alias for allocated_budget_inr")
    expended_budget_inr: int = Field(default=0, ge=0)
    currency: str = Field(default="INR")
    status: str = Field(description="sanctioned, in_progress, delayed, completed, stalled")
    project_status: Optional[str] = Field(default=None, description="Alias for status")
    planned_date: Optional[date] = None
    commenced_date: Optional[date] = None
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    completion_date: Optional[date] = None
    contractor_name: Optional[str] = None
    beneficiary_population: Optional[int] = Field(default=None, ge=0)
    source: str = Field(default="GOV_BUDGET_PORTAL")
    source_date: Optional[date] = None
    is_synthetic: bool = Field(default=False)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "project_id" not in values and "investment_id" in values:
                values["project_id"] = values["investment_id"]
            elif "investment_id" not in values and "project_id" in values:
                values["investment_id"] = values["project_id"]

            if "category" not in values and "sector" in values:
                values["category"] = values["sector"]
            elif "sector" not in values and "category" in values:
                values["sector"] = values["category"]

            if "allocated_budget_inr" not in values and "investment_amount" in values:
                values["allocated_budget_inr"] = int(values["investment_amount"])
            elif "investment_amount" not in values and "allocated_budget_inr" in values:
                values["investment_amount"] = float(values["allocated_budget_inr"])

            if "status" not in values and "project_status" in values:
                values["status"] = values["project_status"]
            elif "project_status" not in values and "status" in values:
                values["project_status"] = values["status"]
        return values

# ==============================================================================
# 5. CANONICAL CITIZEN REQUEST MODEL
# ==============================================================================
class CitizenRequestRecord(BaseModel):
    request_id: str = Field(description="Unique deterministic UUID v4")
    user_id: Optional[str] = Field(default=None, description="Pseudonymous hash ID")
    geo_id: str = Field(description="Foreign key referencing geography.geo_id")
    channel: str = Field(default="text_web", description="voice_ivr, voice_web, text_web, whatsapp, bhashini_api")
    source_channel: Optional[str] = Field(default=None, description="Alias for channel")
    language: str = Field(default="en", description="ISO code: ta, hi, te, kn, mr, bn, en")
    detected_language: Optional[str] = Field(default=None, description="Alias for language")
    raw_text_reference: Optional[str] = None
    audio_gcs_uri: Optional[str] = None
    original_transcript: str = Field(description="Citizen verbatim transcript in source language")
    normalized_text: Optional[str] = Field(default=None, description="Standardized English translation")
    english_translation: Optional[str] = Field(default=None, description="Alias for normalized_text")
    primary_category: str = Field(description="transport, water, healthcare, education, electricity, sanitation, roads")
    subcategory: str = Field(description="Granular issue classifier")
    specific_issue: str = Field(description="Concise 2-5 word descriptor of gap")
    extracted_location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_geog: Optional[str] = None
    severity: int = Field(ge=1, le=5, description="1 (minor) to 5 (critical emergency)")
    urgency: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    urgency_score: float = Field(default=0.5, ge=0.0, le=1.0)
    affected_group: str = Field(default="general_population")
    cohort: Optional[str] = Field(default=None, description="Alias for affected_group")
    time_pattern: Optional[str] = None
    entities: List[str] = Field(default_factory=list)
    processing_status: str = Field(default="received")
    confidence_score: float = Field(default=0.95, ge=0.0, le=1.0)
    source: str = Field(default="JANSETU_CITIZEN_INTAKE")
    is_synthetic: bool = Field(default=False)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "channel" not in values and "source_channel" in values:
                values["channel"] = values["source_channel"]
            elif "source_channel" not in values and "channel" in values:
                values["source_channel"] = values["channel"]

            if "language" not in values and "detected_language" in values:
                values["language"] = values["detected_language"]
            elif "detected_language" not in values and "language" in values:
                values["detected_language"] = values["language"]

            if "normalized_text" not in values and "english_translation" in values:
                values["normalized_text"] = values["english_translation"]
            elif "english_translation" not in values and "normalized_text" in values:
                values["english_translation"] = values["normalized_text"]

            if "urgency" not in values and "urgency_score" in values:
                values["urgency"] = values["urgency_score"]
            elif "urgency_score" not in values and "urgency" in values:
                values["urgency_score"] = values["urgency"]

            if "affected_group" not in values and "cohort" in values:
                values["affected_group"] = values["cohort"]
            elif "cohort" not in values and "affected_group" in values:
                values["cohort"] = values["affected_group"]
        return values

# ==============================================================================
# 6. VECTOR EMBEDDINGS SCHEMA MODEL
# ==============================================================================
class CitizenRequestEmbeddingRecord(BaseModel):
    request_id: str
    embedding_model: str = Field(default="text-multilingual-embedding-002")
    embedding_dimension: int = Field(default=768)
    category: Optional[str] = None
    geo_id: Optional[str] = None
    embedding: List[float] = Field(description="768-dim float vector")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

# ==============================================================================
# 7. DEMAND CLUSTERS SCHEMA MODEL
# ==============================================================================
class DemandClusterRecord(BaseModel):
    cluster_id: str
    geo_id: str
    category: str
    cluster_label: Optional[str] = None
    cluster_title: str
    representative_issue: Optional[str] = None
    cluster_summary: str
    request_count: int = Field(ge=0)
    average_severity: float = Field(ge=1.0, le=5.0)
    first_reported_at: Optional[str] = None
    latest_reported_at: Optional[str] = None
    growth_velocity_7d: Optional[float] = None
    status: str = Field(default="emerging")
    centroid_latitude: Optional[float] = None
    centroid_longitude: Optional[float] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

# ==============================================================================
# 8. HOTSPOTS SCHEMA MODEL
# ==============================================================================
class HotspotRecord(BaseModel):
    hotspot_id: str
    geo_id: str
    cluster_id: Optional[str] = None
    category: str
    hotspot_level: str = Field(description="CRITICAL, HIGH, MODERATE")
    voice_intensity_score: float = Field(ge=0.0, le=1.0)
    demand_velocity: Optional[float] = None
    growth_trend: str = Field(default="STEADY")
    estimated_population_impacted: int = Field(ge=0)
    population_exposure: Optional[int] = Field(default=None, ge=0)
    request_count: Optional[int] = Field(default=None, ge=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    associated_cluster_ids: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

# ==============================================================================
# 9. SILENT NEED SIGNALS SCHEMA MODEL
# ==============================================================================
class SilentNeedSignalRecord(BaseModel):
    signal_id: str
    geo_id: str
    category: str
    infra_deficit: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    infra_deficit_score: float = Field(ge=0.0, le=1.0)
    vulnerability_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    population_vulnerability: float = Field(ge=0.0, le=1.0)
    voice_density: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    voice_reporting_score: float = Field(ge=0.0, le=1.0)
    digital_access: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    digital_access_score: float = Field(ge=0.0, le=1.0)
    discrepancy: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    discrepancy_magnitude: float = Field(ge=0.0, le=1.0)
    signal_status: str = Field(default="POTENTIAL_SILENT_NEED_SIGNAL")
    signal_confidence: float = Field(ge=0.0, le=1.0)
    validation_status: str = Field(default="POTENTIAL_SIGNAL_UNVALIDATED")
    ai_hypothesis: str
    supporting_evidence_count: int = Field(default=0, ge=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

# ==============================================================================
# 10. EVIDENCE RECORDS SCHEMA MODEL
# ==============================================================================
class EvidenceRecord(BaseModel):
    evidence_id: str
    signal_id: Optional[str] = None
    geo_id: str
    target_entity_type: Optional[str] = None
    target_entity_id: Optional[str] = None
    evidence_type: Optional[str] = None
    record_reference_id: Optional[str] = None
    source: str
    dataset_source: Optional[str] = None
    source_date: Optional[date] = None
    source_reference: Optional[str] = None
    claim: Optional[str] = None
    metric_name: Optional[str] = None
    evidence_value: Optional[str] = None
    observed_value: Optional[str] = None
    benchmark_value: Optional[str] = None
    retrieved_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

# ==============================================================================
# 11. POLICY SCENARIOS SCHEMA MODEL
# ==============================================================================
class PolicyScenarioRecord(BaseModel):
    scenario_id: str
    geo_id: str
    scenario_name: str
    intervention_type: str
    input_parameters: Optional[Dict[str, Any]] = None
    estimated_exposure: Optional[int] = Field(default=None, ge=0)
    estimated_beneficiaries: Optional[int] = Field(default=None, ge=0)
    predicted_gap_reduction_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    estimated_cost_inr: Optional[int] = Field(default=None, ge=0)
    addressed_cluster_count: Optional[int] = Field(default=None, ge=0)
    created_by_user: str = Field(default="system")
    simulation_model_version: str = Field(default="v1.0")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

# ==============================================================================
# 12. IMPACT METRICS SCHEMA MODEL
# ==============================================================================
class ImpactMetricRecord(BaseModel):
    impact_id: str
    geo_id: str
    project_id: str
    metric_name: str
    baseline_value: float
    post_intervention_value: float
    measurement_period: Optional[str] = None
    data_source: str = Field(default="GOV_FIELD_AUDIT")
    baseline_date: Optional[date] = None
    evaluation_date: Optional[date] = None
    before_accessibility_pct: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    after_accessibility_pct: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    before_monthly_requests: Optional[int] = Field(default=None, ge=0)
    after_monthly_requests: Optional[int] = Field(default=None, ge=0)
    measured_sentiment_delta: Optional[float] = None
    is_verified_by_audit: bool = Field(default=False)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

# ==============================================================================
# DATA QUALITY REPORT MODEL
# ==============================================================================
class TableQualitySummary(BaseModel):
    table_name: str
    row_count: int
    valid_rows: int
    invalid_rows: int
    null_rate_percentage: float
    duplicate_count: int
    synthetic_count: int
    official_count: int
    sources: List[str]

class DataQualityReport(BaseModel):
    total_records: int
    table_summaries: Dict[str, TableQualitySummary]
    geographic_hierarchy_valid: bool
    missing_geo_references: int
    provenance_sources: List[str]
    status: str = Field(description="HEALTHY, WARNING, ERROR")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
