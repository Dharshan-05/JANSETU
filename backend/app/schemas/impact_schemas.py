from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.config import settings

# =========================================================================
# PHASE 9: ENUMS & CLASSIFICATIONS
# =========================================================================

class IndicatorDirection(str, Enum):
    HIGHER_IS_BETTER = "HIGHER_IS_BETTER"
    LOWER_IS_BETTER = "LOWER_IS_BETTER"
    TARGET_RANGE = "TARGET_RANGE"
    NEUTRAL = "NEUTRAL"

class EvaluationType(str, Enum):
    DESCRIPTIVE_BEFORE_AFTER = "DESCRIPTIVE_BEFORE_AFTER"
    TARGET_VS_ACTUAL = "TARGET_VS_ACTUAL"
    PRE_POST_TREND = "PRE_POST_TREND"
    CONTROLLED_COMPARISON = "CONTROLLED_COMPARISON"
    CAUSAL_EVALUATION = "CAUSAL_EVALUATION"

class AttributionLevel(str, Enum):
    NOT_ASSESSED = "NOT_ASSESSED"
    DESCRIPTIVE_ONLY = "DESCRIPTIVE_ONLY"
    ASSOCIATION_SUPPORTED = "ASSOCIATION_SUPPORTED"
    CAUSAL_EVIDENCE_AVAILABLE = "CAUSAL_EVIDENCE_AVAILABLE"

class DataQuality(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT = "INSUFFICIENT"

class ObservationQualityStatus(str, Enum):
    VERIFIED = "VERIFIED"
    PARTIAL = "PARTIAL"
    PROXY = "PROXY"
    MISSING = "MISSING"
    CONFLICTING = "CONFLICTING"

class MetricClassification(str, Enum):
    HISTORICAL_FACT = "HISTORICAL_FACT"
    MODEL_ASSUMPTION = "MODEL_ASSUMPTION"
    SCENARIO_ESTIMATE = "SCENARIO_ESTIMATE"
    OBSERVED_OUTCOME = "OBSERVED_OUTCOME"
    IMPACT_ESTIMATE = "IMPACT_ESTIMATE"

# =========================================================================
# INDICATOR & SNAPSHOT SCHEMAS
# =========================================================================

class IndicatorDefinition(BaseModel):
    indicator_id: str = Field(..., description="Unique indicator code, e.g. IND-WATER-COV-01")
    name: str = Field(..., description="Human-readable indicator title")
    sector: str = Field(..., description="Infrastructure domain")
    unit: str = Field(..., description="Unit of measurement, e.g. percentage, hours/day, count")
    direction: IndicatorDirection = Field(default=IndicatorDirection.HIGHER_IS_BETTER)
    baseline_source: str = Field(..., description="Official baseline source dataset")
    observation_source: Optional[str] = Field(None, description="Expected observation source dataset")
    description: Optional[str] = None

class BaselineSnapshot(BaseModel):
    baseline_id: str
    geo_id: str
    sector: str
    indicator: IndicatorDefinition
    value: float
    unit: str
    source: str
    source_date: str
    evidence_ids: List[str] = []
    provenance: str = "VERIFIED"
    classification: MetricClassification = MetricClassification.HISTORICAL_FACT
    snapshot_timestamp: str

class OutcomeObservation(BaseModel):
    observation_id: str
    evaluation_id: str
    geo_id: str
    indicator: IndicatorDefinition
    value: float
    unit: str
    observation_date: str
    source: str
    source_type: str = "OFFICIAL_FIELD_AUDIT"
    provenance: str = "VERIFIED"
    evidence_ids: List[str] = []
    quality_status: ObservationQualityStatus = ObservationQualityStatus.VERIFIED
    classification: MetricClassification = MetricClassification.OBSERVED_OUTCOME
    recorded_at: str

class ConfounderItem(BaseModel):
    factor_type: str = Field(..., description="e.g. population_change, seasonal_variation, extreme_weather")
    description: str
    direction_of_potential_bias: Optional[str] = None
    classification: str = "CONTEXTUAL_FACTOR"

# =========================================================================
# IMPACT & COMPARISON SCHEMAS
# =========================================================================

class ImpactCalculation(BaseModel):
    absolute_change: float
    percentage_change: Optional[float] = None
    target_gap: Optional[float] = None
    target_achievement_pct: Optional[float] = None
    is_improvement: Optional[bool] = None
    classification: MetricClassification = MetricClassification.IMPACT_ESTIMATE

class ScenarioComparisonDetail(BaseModel):
    scenario_id: str
    scenario_estimate: float
    scenario_estimate_classification: MetricClassification = MetricClassification.SCENARIO_ESTIMATE
    observed_outcome: float
    observed_outcome_classification: MetricClassification = MetricClassification.OBSERVED_OUTCOME
    scenario_outcome_difference: float
    predicted_change: float
    observed_change: float
    prediction_error: float
    absolute_prediction_error: float
    relative_prediction_error: Optional[float] = None
    directional_consistency: bool
    label: str = "Scenario-to-Outcome Difference"
    disclaimer: str = "Phase 8 Scenario Estimate — Not an Observed Outcome"

class ImpactEvaluation(BaseModel):
    evaluation_id: str
    geo_id: str
    region_name: str
    state_name: str
    sector: str
    intervention_id: str
    project_name: str
    scenario_id: Optional[str] = None
    baseline_period: str
    observation_period: str
    indicator: IndicatorDefinition
    baseline_snapshot: BaselineSnapshot
    observation: Optional[OutcomeObservation] = None
    calculation: Optional[ImpactCalculation] = None
    scenario_comparison: Optional[ScenarioComparisonDetail] = None
    target_value: Optional[float] = None
    evaluation_type: EvaluationType = EvaluationType.DESCRIPTIVE_BEFORE_AFTER
    attribution_level: AttributionLevel = AttributionLevel.DESCRIPTIVE_ONLY
    attribution_statement: str
    data_quality: DataQuality = DataQuality.HIGH
    confounders: List[ConfounderItem] = []
    evidence_ids: List[str] = []
    limitations: List[str] = []
    is_verified: bool = True
    evaluation_status: str = "COMPLETED"
    model_version: str = settings.IMPACT_ANALYTICAL_VERSION
    created_at: str
    governance_notice: str = "AI-Derived Analytical Signal — Not Official Policy"
    disclaimer: str = "OBSERVED OUTCOME — MEASURED DATA. Causality is descriptive unless explicitly validated."

    # Backward compatibility fields for legacy ImpactMetricItem consumers
    impact_id: Optional[str] = None
    project_id: Optional[str] = None
    commenced_date: Optional[str] = None
    evaluation_date: Optional[str] = None
    before_accessibility_pct: float = 42.0
    after_accessibility_pct: float = 68.0
    accessibility_gain_pct: float = 26.0
    before_monthly_requests: int = 4820
    after_monthly_requests: int = 1904
    request_reduction_pct: float = 60.5
    measured_sentiment_recovery: float = 0.48

    def model_post_init(self, __context: Any) -> None:
        if self.impact_id is None:
            self.impact_id = self.evaluation_id
        if self.project_id is None:
            self.project_id = self.intervention_id
        if self.commenced_date is None:
            self.commenced_date = self.baseline_period
        if self.evaluation_date is None:
            self.evaluation_date = self.observation_period

# =========================================================================
# INPUT PAYLOADS & RESPONSES
# =========================================================================

class EvaluationCreateInput(BaseModel):
    geo_id: str
    sector: str
    intervention_id: str
    project_name: Optional[str] = None
    scenario_id: Optional[str] = None
    indicator_id: str
    baseline_period: str
    observation_period: str
    target_value: Optional[float] = None
    evaluation_type: EvaluationType = EvaluationType.DESCRIPTIVE_BEFORE_AFTER
    confounders: Optional[List[Dict[str, str]]] = None

class ObservationInput(BaseModel):
    value: float
    unit: str
    observation_date: str
    source: str
    source_type: str = "OFFICIAL_FIELD_AUDIT"
    provenance: str = "VERIFIED"
    evidence_ids: List[str] = []
    quality_status: ObservationQualityStatus = ObservationQualityStatus.VERIFIED

class ModelValidationSummary(BaseModel):
    total_scenarios_evaluated: int
    total_evaluations_count: int
    mean_absolute_prediction_error: Optional[float] = None
    directional_consistency_rate: Optional[float] = None
    evaluations_by_sector: Dict[str, int]
    data_quality_distribution: Dict[str, int]
    model_version: str = settings.IMPACT_ANALYTICAL_VERSION
    disclaimer: str = "AI-Derived Analytical Signal — Model Validation Only. Does Not Reflect Single Policy Score."

class ImpactExplanationResponse(BaseModel):
    evaluation_id: str
    grounded_explanation: str
    cited_evidence_ids: List[str]
    cited_sources: List[str]
    attribution_rationale: str
    contextual_factors_noted: List[str]
    limitations_noted: List[str]
    prompt_version: str = settings.IMPACT_PROMPT_VERSION
    generated_at: str
    disclaimer: str = "AI-Derived Analytical Signal — Not Official Policy"
