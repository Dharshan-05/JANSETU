from typing import List, Optional, Dict, Any, Generic, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.extraction_schemas import GeminiRequestExtraction

T = TypeVar("T")

class BaseAPIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: T
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class IntakeProcessResponse(BaseModel):
    request_id: str
    status: str = "PROCESSED"
    source_channel: str
    detected_language: str
    original_text: str
    english_translation: str
    extraction: GeminiRequestExtraction
    matched_geo_id: str
    matched_admin_area: str
    assigned_cluster_id: Optional[str] = None
    cluster_title: Optional[str] = None
    processing_time_ms: int
    is_synthetic: bool = False

class CommandCenterKPIs(BaseModel):
    total_citizen_requests: int
    active_demand_hotspots: int
    emerging_signals_count: int
    potential_silent_need_signals: int
    states_covered: int
    districts_monitored: int
    public_projects_tracked: int
    average_gap_reduction_pct: float
    category_distribution: Dict[str, int]
    language_breakdown: Dict[str, int]
    top_critical_districts: List[Dict[str, Any]]
    data_policy_notice: str = "Includes benchmarked public datasets (Census, PMGSY, JJM) and labeled realistic synthetic citizen voices."

class HotspotItem(BaseModel):
    hotspot_id: str
    geo_id: str
    region_name: str
    state_name: str
    category: str
    hotspot_level: str
    voice_intensity_score: float
    growth_trend: str
    estimated_population_impacted: int
    latitude: float
    longitude: float
    top_issue: str
    total_requests: int
    status: str

class SilentNeedSignalItem(BaseModel):
    signal_id: str
    geo_id: str
    region_name: str
    state_name: str
    category: str
    infra_deficit_score: float
    voice_reporting_score: float
    digital_access_score: float
    population_vulnerability: float
    discrepancy_magnitude: float
    signal_confidence: float
    validation_status: str
    ai_hypothesis: str
    latitude: float
    longitude: float
    why_summary: str
    supporting_evidence_count: int

class EvidenceTrailItem(BaseModel):
    evidence_type: str
    dataset_source: str
    metric: str
    observed_value: str
    benchmark: Optional[str] = None
    deficit_percentage: Optional[str] = None

class GroundedEvidenceBrief(BaseModel):
    signal_id: str
    target_region: str
    category: str
    ai_hypothesis: str
    confidence_rating: float
    confidence_rationale: str
    grounded_evidence_trail: List[EvidenceTrailItem]
    gemini_summary: str
    disclaimer: str

class SimulationResult(BaseModel):
    simulation_id: str
    geo_id: str
    region_name: str
    sector: str
    intervention_type: str
    status: str = "COMPLETED"
    estimated_population_benefited: int
    current_accessibility_index: float
    projected_accessibility_index: float
    absolute_gain_pct: float
    addressed_clusters_count: int
    total_clusters_in_sector: int
    unaddressed_residual_needs: List[str]
    estimated_budget_inr: int
    roi_cost_per_beneficiary_inr: float
    confidence_interval: Dict[str, float]
    disclaimer: str

class ImpactMetricItem(BaseModel):
    impact_id: str
    project_id: str
    project_name: str
    geo_id: str
    region_name: str
    sector: str
    commenced_date: str
    evaluation_date: str
    before_accessibility_pct: float
    after_accessibility_pct: float
    accessibility_gain_pct: float
    before_monthly_requests: int
    after_monthly_requests: int
    request_reduction_pct: float
    measured_sentiment_recovery: float
    is_verified: bool
