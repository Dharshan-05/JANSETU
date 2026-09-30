"""
JANSETU — Policy Sandbox & Scenario Simulation Schemas (Phase 8)
Enforces strict separation of:
  - HISTORICAL FACT (retrieved baseline evidence)
  - MODEL ASSUMPTION (user-supplied / configured simulation inputs)
  - SCENARIO ESTIMATE (deterministic mathematical calculations)
"""

from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class InterventionType(str, Enum):
    SERVICE_COVERAGE_INCREASE = "SERVICE_COVERAGE_INCREASE"
    INFRASTRUCTURE_CAPACITY_INCREASE = "INFRASTRUCTURE_CAPACITY_INCREASE"
    ACCESS_IMPROVEMENT = "ACCESS_IMPROVEMENT"
    DEFICIT_REDUCTION = "DEFICIT_REDUCTION"
    CUSTOM_HYPOTHETICAL_INTERVENTION = "CUSTOM_HYPOTHETICAL_INTERVENTION"


class MetricClassification(str, Enum):
    HISTORICAL_FACT = "HISTORICAL_FACT"
    MODEL_ASSUMPTION = "MODEL_ASSUMPTION"
    SCENARIO_ESTIMATE = "SCENARIO_ESTIMATE"


class CostStatus(str, Enum):
    VERIFIED = "VERIFIED"
    MODEL_ASSUMPTION_USER_PROVIDED = "MODEL_ASSUMPTION — USER PROVIDED"
    UNAVAILABLE = "UNAVAILABLE"


class BaselineMetric(BaseModel):
    """Atomic metric representing historical reality."""
    metric: str
    value: float
    formatted_value: Optional[str] = None
    classification: str = MetricClassification.HISTORICAL_FACT.value
    evidence_ids: List[str] = Field(default_factory=list)
    source: Optional[str] = None
    unit: Optional[str] = None
    provenance: Optional[str] = "VERIFIED"


class ScenarioBaseline(BaseModel):
    """Grounded baseline state derived from Phase 7 Evidence Engine."""
    need_score: float = Field(..., ge=0.0, le=1.0)
    voice_density: float = Field(..., ge=0.0, le=1.0)
    infrastructure_deficit: float = Field(..., ge=0.0, le=1.0)
    discrepancy: float = Field(...)
    population: int = Field(..., ge=0)
    affected_population: Optional[int] = None
    metrics: List[BaselineMetric] = Field(default_factory=list)
    evidence_ids: List[str] = Field(default_factory=list)
    retrieval_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ScenarioAssumptions(BaseModel):
    """User-supplied or configured modeling parameters."""
    coverage_improvement_pct: float = Field(..., ge=0.0, le=100.0, description="Hypothetical service expansion percentage (0-100%)")
    target_population_pct: float = Field(..., ge=0.0, le=100.0, description="Hypothetical target population reach percentage (0-100%)")
    hypothetical_budget: Optional[float] = Field(default=None, ge=0.0, description="User-supplied hypothetical budget in INR")
    implementation_horizon_months: Optional[int] = Field(default=12, ge=1, le=120, description="Execution timeline in months")
    expected_deficit_reduction_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    cost_status: str = Field(default=CostStatus.UNAVAILABLE.value)
    classification: str = MetricClassification.MODEL_ASSUMPTION.value


class ScenarioEstimate(BaseModel):
    """Deterministic mathematical output produced by ScenarioSimulationService."""
    estimated_deficit: float = Field(..., ge=0.0, le=1.0, description="Projected residual infrastructure deficit index (0.0 - 1.0)")
    estimated_gap_reduction: float = Field(..., ge=0.0, le=1.0, description="Absolute reduction in deficit index")
    estimated_affected_population: int = Field(..., ge=0, description="Estimated beneficiaries in intervention reach")
    residual_gap: float = Field(..., ge=0.0, le=1.0, description="Remaining unaddressed deficit")
    projected_accessibility: float = Field(..., ge=0.0, le=1.0, description="Estimated accessibility index (1 - estimated_deficit)")
    classification: str = MetricClassification.SCENARIO_ESTIMATE.value


class ScenarioInput(BaseModel):
    """Input payload for POST /api/v1/sandbox/simulate."""
    geo_id: str = Field(..., description="Target Census LGD or Geo ID")
    sector: str = Field(..., description="Civic sector: water, transport, healthcare, roads, sanitation, electricity")
    intervention_type: str = Field(
        default=InterventionType.SERVICE_COVERAGE_INCREASE.value,
        description="Controlled taxonomy intervention type"
    )
    scenario_name: Optional[str] = Field(default=None, description="Human-readable scenario title")
    coverage_improvement_pct: Optional[float] = Field(default=25.0, ge=0.0, le=100.0, description="Coverage improvement 0-100%")
    target_population_pct: Optional[float] = Field(default=60.0, ge=0.0, le=100.0, description="Target population 0-100%")
    hypothetical_budget: Optional[float] = Field(default=None, ge=0.0, description="Optional user-provided budget in INR")
    implementation_horizon_months: Optional[int] = Field(default=12, ge=1, le=120)
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Custom intervention parameters")

    @field_validator("sector")
    @classmethod
    def validate_sector(cls, v: str) -> str:
        valid_sectors = {"water", "transport", "healthcare", "roads", "sanitation", "electricity"}
        if v.lower() not in valid_sectors:
            raise ValueError(f"Sector '{v}' is not supported. Must be one of: {', '.join(sorted(valid_sectors))}")
        return v.lower()


class ScenarioResult(BaseModel):
    """Comprehensive Scenario Simulation Output."""
    scenario_id: str = Field(..., description="Deterministic ID formatted as SCN-{GEO}-{CATEGORY}-{HASH}")
    scenario_name: str
    scenario_version: int = Field(default=1, ge=1)
    geo_id: str
    region_name: str
    state_name: str
    sector: str
    intervention_type: str

    baseline: ScenarioBaseline
    assumptions: ScenarioAssumptions
    estimated_result: ScenarioEstimate
    limitations: List[str] = Field(default_factory=list)

    classification: str = MetricClassification.SCENARIO_ESTIMATE.value
    model_version: str = "v8.0-deterministic"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    provenance: Dict[str, Any] = Field(default_factory=dict)
    
    explanation: Optional[str] = None
    is_archived: bool = False

    disclaimer: str = (
        "⚠ HYPOTHETICAL SCENARIO — MODEL ESTIMATE, NOT OFFICIAL POLICY. "
        "AI-Derived Analytical Signal — Not Official Policy. "
        "Scenario estimate — not a guaranteed outcome. "
        "Does not constitute government sanction, budget allocation, or policy directive."
    )

    # =========================================================================
    # BACKWARD COMPATIBILITY FIELDS FOR SimulationResult
    # Ensures existing Phase 1–7 clients and test_sandbox.py continue passing
    # =========================================================================
    simulation_id: Optional[str] = None
    status: str = "COMPLETED"
    estimated_population_benefited: Optional[int] = None
    current_accessibility_index: Optional[float] = None
    projected_accessibility_index: Optional[float] = None
    absolute_gain_pct: Optional[float] = None
    addressed_clusters_count: Optional[int] = 1
    total_clusters_in_sector: Optional[int] = 4
    unaddressed_residual_needs: Optional[List[str]] = None
    estimated_budget_inr: Optional[int] = None
    roi_cost_per_beneficiary_inr: Optional[float] = None
    confidence_interval: Optional[Dict[str, float]] = None


class ScenarioComparisonRequest(BaseModel):
    scenario_ids: List[str] = Field(..., min_length=2, max_length=5, description="2 to 5 scenario IDs to compare side-by-side")
    metrics: Optional[List[str]] = Field(default=None, description="Optional subset of metrics to include in comparison")


class ScenarioComparisonResponse(BaseModel):
    scenarios: List[ScenarioResult]
    comparison_table: List[Dict[str, Any]]
    metrics: List[str]
    disclaimer: str = (
        "⚠ HYPOTHETICAL SCENARIO COMPARISON — Neutral analytical metrics for evaluation. "
        "Does not rank, endorse, or recommend any specific intervention."
    )


class ScenarioExplanationRequest(BaseModel):
    scenario_id: str


class ScenarioExplanationResponse(BaseModel):
    scenario_id: str
    explanation: str
    prompt_version: str
    cited_evidence_ids: List[str]
    model_version: str = "v8.0-deterministic"
    disclaimer: str = "⚠ HYPOTHETICAL SCENARIO — MODEL ESTIMATE, NOT OFFICIAL POLICY"
