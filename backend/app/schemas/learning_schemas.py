"""
JANSETU — Learning & Continuous Calibration Schemas (Phase 10)
Data contracts and governance boundaries for model learning, calibration parameters,
out-of-sample validation, audit trails, and drift monitoring.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.config import settings

# =========================================================================
# PHASE 10: ENUMS & STATUSES
# =========================================================================

class ModelFamily(str, Enum):
    DEMAND_HOTSPOT = "DEMAND_HOTSPOT"
    DEMAND_SHADOW = "DEMAND_SHADOW"
    SILENT_NEED = "SILENT_NEED"
    SCENARIO_SIMULATION = "SCENARIO_SIMULATION"
    IMPACT_FORECAST = "IMPACT_FORECAST"

class CalibrationStatus(str, Enum):
    CANDIDATE = "CANDIDATE"
    UNDER_REVIEW = "UNDER_REVIEW"
    VALIDATED = "VALIDATED"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"
    SUPERSEDED = "SUPERSEDED"
    ROLLED_BACK = "ROLLED_BACK"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    REQUIRES_REVIEW = "REQUIRES_REVIEW"

class LearningAction(str, Enum):
    CREATED = "CREATED"
    VALIDATED = "VALIDATED"
    APPROVED = "APPROVED"
    ACTIVATED = "ACTIVATED"
    ROLLED_BACK = "ROLLED_BACK"
    REJECTED = "REJECTED"
    SUPERSEDED = "SUPERSEDED"

class DriftStatus(str, Enum):
    STABLE = "STABLE"
    WATCH = "WATCH"
    DRIFT_DETECTED = "DRIFT_DETECTED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"

# =========================================================================
# OBSERVATION & PARAMETER SCHEMAS
# =========================================================================

class LearningObservation(BaseModel):
    evaluation_id: str = Field(..., description="Source Phase 9 evaluation ID")
    indicator_id: str = Field(..., description="Controlled indicator code, e.g. IND-WATER-COV-01")
    forecast_value: Optional[float] = Field(None, description="Phase 8 forecasted value")
    observed_value: float = Field(..., description="Audited real-world outcome value")
    baseline_value: Optional[float] = Field(None, description="Pre-intervention baseline value")
    predicted_change: Optional[float] = Field(None, description="Forecasted delta from baseline")
    observed_change: Optional[float] = Field(None, description="Observed empirical delta from baseline")
    prediction_error: Optional[float] = Field(None, description="ObservedChange - ForecastChange")
    relative_prediction_error: Optional[float] = Field(None, description="|Observed - Forecast| / Forecast")
    observation_date: str = Field(..., description="ISO date of field observation")
    data_quality: str = Field(default="VERIFIED", description="VERIFIED, PROXY, MISSING, CONFLICTING")
    is_directionally_aligned: Optional[bool] = Field(None, description="Whether forecast direction matched actual")
    source_scenario_id: Optional[str] = Field(None, description="Associated Phase 8 scenario ID")
    sector: Optional[str] = Field(None, description="Civic infrastructure domain")
    geo_id: Optional[str] = Field(None, description="LGD Geographic ID")

class CalibrationParameter(BaseModel):
    parameter_name: str = Field(..., description="Identifier of the tunable parameter")
    current_value: float = Field(..., description="Value in currently active model version")
    candidate_value: float = Field(..., description="Proposed calibrated parameter value")
    min_value: float = Field(..., description="Lower safety bound")
    max_value: float = Field(..., description="Upper safety bound")
    supported_range: List[float] = Field(default_factory=list, description="[min, max] range")
    description: Optional[str] = Field(None, description="Functional role of parameter in analytical model")
    evidence_count: int = Field(default=0, description="Number of supporting observation records")
    validation_metric: str = Field(default="MAE", description="Primary validation metric used")
    relative_change: Optional[float] = Field(None, description="Percentage shift from current to candidate")

class LearningMetrics(BaseModel):
    sample_size: int = Field(..., description="Number of observations in training window")
    mae_before: float = Field(..., description="Mean absolute error with current parameter")
    mae_candidate: float = Field(..., description="Mean absolute error with candidate parameter")
    mape_before: Optional[float] = Field(None, description="Mean absolute percentage error before")
    mape_candidate: Optional[float] = Field(None, description="Mean absolute percentage error candidate")
    directional_consistency_before: float = Field(..., description="Directional consistency rate before")
    directional_consistency_candidate: float = Field(..., description="Directional consistency rate candidate")
    mean_prediction_error_before: float = Field(default=0.0, description="Mean signed prediction error before")
    mean_prediction_error_candidate: float = Field(default=0.0, description="Mean signed prediction error candidate")
    validation_sample_size: int = Field(default=0, description="Number of held-out validation observations")
    validation_mae_before: Optional[float] = Field(None, description="Held-out validation MAE before")
    validation_mae_candidate: Optional[float] = Field(None, description="Held-out validation MAE candidate")
    validation_directional_consistency_before: Optional[float] = Field(None, description="Held-out consistency before")
    validation_directional_consistency_candidate: Optional[float] = Field(None, description="Held-out consistency candidate")

class LearningCandidate(BaseModel):
    learning_id: str = Field(..., description="Unique calibration candidate ID, e.g. LRN-SCENARIO-001")
    model_family: ModelFamily = Field(..., description="Target model family")
    source_version: str = Field(..., description="Baseline model version, e.g. v8.0-deterministic")
    target_version: str = Field(..., description="Proposed model version tag, e.g. v10.0-candidate-001")
    source_evaluation_ids: List[str] = Field(default_factory=list, description="List of Phase 9 evaluation IDs")
    training_window: Dict[str, str] = Field(..., description="{'start': 'YYYY-MM-DD', 'end': 'YYYY-MM-DD'}")
    validation_window: Dict[str, str] = Field(..., description="{'start': 'YYYY-MM-DD', 'end': 'YYYY-MM-DD'}")
    parameters: List[CalibrationParameter] = Field(default_factory=list, description="Calibrated parameters list")
    metrics: LearningMetrics = Field(..., description="Training and validation performance metrics")
    status: CalibrationStatus = Field(default=CalibrationStatus.CANDIDATE, description="Current lifecycle state")
    created_at: str = Field(..., description="Timestamp of generation")
    updated_at: Optional[str] = Field(None, description="Timestamp of last state change")
    reviewed_by: Optional[str] = Field(None, description="Administrative reviewer user ID")
    review_notes: Optional[str] = Field(None, description="Notes entered during review or approval")
    notes: Optional[str] = Field(None, description="System notes or flags")
    disclaimer: str = Field(
        default="CALIBRATION CANDIDATE — Model estimate derived from historical data. Not an automatically active model. Requires administrative review.",
        description="Mandatory governance disclaimer"
    )

class ModelVersion(BaseModel):
    model_version: str = Field(..., description="Semantic version string, e.g. v8.0-deterministic")
    model_family: ModelFamily = Field(..., description="Model family")
    parameters: Dict[str, float] = Field(..., description="Active parameter key-value dictionary")
    created_at: str = Field(..., description="Timestamp of registration")
    status: CalibrationStatus = Field(default=CalibrationStatus.ACTIVE, description="ACTIVE, SUPERSEDED, ROLLED_BACK")
    parent_version: Optional[str] = Field(None, description="Immediate ancestor version")
    activated_at: Optional[str] = Field(None, description="Timestamp of explicit activation")
    activated_by: Optional[str] = Field(None, description="Administrator who authorized activation")
    description: Optional[str] = Field(None, description="Version descriptor and notes")

class LearningAuditEvent(BaseModel):
    event_id: str = Field(..., description="Unique audit event ID")
    learning_id: Optional[str] = Field(None, description="Related learning candidate ID")
    model_version: Optional[str] = Field(None, description="Related model version tag")
    action: LearningAction = Field(..., description="Lifecycle action executed")
    actor: str = Field(..., description="User or system entity executing action")
    timestamp: str = Field(..., description="ISO timestamp of event")
    previous_status: Optional[str] = Field(None, description="State before transition")
    new_status: Optional[str] = Field(None, description="State after transition")
    reason: Optional[str] = Field(None, description="Stated administrative or operational reason")

# =========================================================================
# MONITORING & DRIFT SCHEMAS
# =========================================================================

class DataQualityBreakdown(BaseModel):
    total_observations: int = Field(default=0)
    verified_observations: int = Field(default=0)
    proxy_observations: int = Field(default=0)
    missing_observations: int = Field(default=0)
    conflicting_observations: int = Field(default=0)
    verified_pct: float = Field(default=0.0)
    proxy_pct: float = Field(default=0.0)
    missing_pct: float = Field(default=0.0)
    conflicting_pct: float = Field(default=0.0)
    overall_quality_score: float = Field(default=1.0)
    quality_status: str = Field(default="HEALTHY")

class DriftReport(BaseModel):
    model_family: ModelFamily = Field(...)
    parameter_name: str = Field(...)
    status: DriftStatus = Field(default=DriftStatus.STABLE)
    historical_mean: float = Field(default=0.0)
    recent_mean: float = Field(default=0.0)
    mean_shift_pct: float = Field(default=0.0)
    variance_shift_pct: float = Field(default=0.0)
    sample_count_recent: int = Field(default=0)
    sample_count_historical: int = Field(default=0)
    message: str = Field(default="")
    timestamp: str = Field(...)

class LearningSummary(BaseModel):
    total_evaluations_ingested: int = Field(default=0)
    total_candidates: int = Field(default=0)
    active_models: int = Field(default=0)
    pending_reviews: int = Field(default=0)
    data_quality: DataQualityBreakdown
    drift_summary: List[DriftReport] = Field(default_factory=list)
    analytical_version: str = Field(default="v10.0-continuous-learning")
    prompt_version: str = Field(default="v10.0-grounded-learning")
    disclaimers: List[str] = Field(default_factory=lambda: [
        "CALIBRATION CANDIDATE — Model estimate derived from historical data. Not an automatically active model.",
        "AI-Derived Analytical Signal — Not Official Policy.",
        "Zero Autonomous Model Modification — All changes require explicit administrative authorization."
    ])

# =========================================================================
# REQUEST & RESPONSE DTOs
# =========================================================================

class GenerateCandidateRequest(BaseModel):
    model_family: ModelFamily = Field(default=ModelFamily.SCENARIO_SIMULATION)
    training_start: Optional[str] = Field(None, description="Start date of training window (YYYY-MM-DD)")
    training_end: Optional[str] = Field(None, description="End date of training window (YYYY-MM-DD)")
    validation_start: Optional[str] = Field(None, description="Start date of validation window (YYYY-MM-DD)")
    validation_end: Optional[str] = Field(None, description="End date of validation window (YYYY-MM-DD)")
    parameter_names: Optional[List[str]] = Field(None, description="Specific parameters to tune")
    min_samples: Optional[int] = Field(None, description="Optional override for min samples threshold")

class ValidateCandidateRequest(BaseModel):
    validation_start: Optional[str] = Field(None, description="Held-out validation start (YYYY-MM-DD)")
    validation_end: Optional[str] = Field(None, description="Held-out validation end (YYYY-MM-DD)")

class ApproveCandidateRequest(BaseModel):
    reviewer: str = Field(default="Administrative Lead", description="User ID or name of approver")
    notes: Optional[str] = Field(None, description="Approval justification notes")

class RejectCandidateRequest(BaseModel):
    reviewer: str = Field(default="Administrative Lead", description="User ID or name of reviewer")
    reason: str = Field(..., description="Reason for rejecting candidate")

class ActivateModelRequest(BaseModel):
    actor: str = Field(default="Administrative Lead", description="Authorizing administrator")
    reason: Optional[str] = Field("Authorized promotion of validated candidate model", description="Justification")

class RollbackModelRequest(BaseModel):
    target_version: Optional[str] = Field(None, description="Specific version to rollback to. Defaults to previous active.")
    actor: str = Field(default="Administrative Lead", description="Authorizing administrator")
    reason: Optional[str] = Field("Manual rollback to previous stable model version", description="Reason")

class LearningExplanationResponse(BaseModel):
    learning_id: str
    prompt_version: str
    grounded_explanation: str
    cited_evaluation_ids: List[str]
    limitations: List[str]
    disclaimer: str
