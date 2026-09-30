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
    hotspot_score: Optional[float] = None
    velocity_score: Optional[float] = None
    concentration_ratio: Optional[float] = None
    explanation: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = 0.90
    analytical_version: Optional[str] = "v5.0-deterministic"
    disclaimer: Optional[str] = "AI-Derived Analytical Signal — Not Official Policy"

class HotspotSummaryItem(BaseModel):
    total_hotspots: int
    critical_count: int
    high_count: int
    moderate_count: int
    category_breakdown: Dict[str, int]
    state_breakdown: Dict[str, int]
    analytical_version: str = "v5.0-deterministic"
    disclaimer: str = "AI-Derived Analytical Signal — Not Official Policy"

class DemandShadowMatrixItem(BaseModel):
    geo_id: str
    region_name: str
    state_code: str
    geo_level: Any = "district"
    latitude: float
    longitude: float
    population: int
    digital_access_score: float
    voice_intensity: float
    infrastructure_need: float
    discrepancy_magnitude: float
    raw_request_count: int
    quadrant: str
    quadrant_label: str
    quadrant_description: str
    action_guidance: str
    status_color: str
    category: str
    time_window_days: int
    analytical_version: str = "v5.0-deterministic"
    disclaimer: str = "AI-Derived Analytical Signal — Not Official Policy"

class DemandShadowResponse(BaseModel):
    matrix: List[DemandShadowMatrixItem]
    summary: Dict[str, Any]
    disclaimer: str = "AI-Derived Analytical Signal — Not Official Policy"

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
    validation_status: str = "POTENTIAL_SIGNAL_UNVALIDATED"
    ai_hypothesis: Optional[str] = None
    latitude: float = 0.0
    longitude: float = 0.0
    why_summary: Optional[str] = None
    supporting_evidence_count: int = 3
    # Phase 6 Core additions
    infra_deficit: Optional[float] = None
    vulnerability_score: Optional[float] = None
    digital_access: Optional[float] = None
    voice_density: Optional[float] = None
    need_score: Optional[float] = None
    discrepancy: Optional[float] = None
    signal_strength: Optional[float] = None
    signal_class: Optional[str] = "POTENTIAL"
    triggered: Optional[bool] = True
    trigger_reason: Optional[str] = "Mathematical discrepancy, elevated deficit, and limited digital connectivity verified."
    population: Optional[int] = None
    request_count: Optional[int] = None
    infrastructure_indicator_count: Optional[int] = 1
    explanation: Optional[Dict[str, Any]] = None
    investment_context: Optional[Dict[str, Any]] = None
    analytical_version: str = "v6.0-deterministic"
    requires_field_validation: bool = True
    disclaimer: str = "AI-Derived Analytical Signal — Not Official Policy"
    validation_requirement: str = "Potential Silent Need Signal — requires administrative field validation."


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
