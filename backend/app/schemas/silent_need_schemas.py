from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class SilentNeedDriver(BaseModel):
    factor: str
    value: float
    contribution: str
    evidence_type: str

class SilentNeedExplanation(BaseModel):
    summary: str
    drivers: List[SilentNeedDriver]
    triggers_met: Dict[str, bool]
    disclaimer: str = "AI-Derived Analytical Signal — Not Official Policy"
    validation_requirement: str = "Potential Silent Need Signal — requires administrative field validation."

class SilentNeedSignalItem(BaseModel):
    # Core Phase 6 fields
    signal_id: str
    geo_id: str
    region_name: str
    state_name: str
    category: str
    infra_deficit: float
    vulnerability_score: float
    digital_access: float
    voice_density: float
    need_score: float = 0.70
    discrepancy: float
    signal_strength: float = 0.80
    signal_class: str = "POTENTIAL"  # NO_SIGNAL, POTENTIAL, STRONG_POTENTIAL
    triggered: bool = True
    trigger_reason: str = "Mathematical discrepancy, elevated deficit, and limited digital connectivity verified."
    population: int = 50000
    request_count: int = 5
    infrastructure_indicator_count: int = 1
    explanation: Optional[Dict[str, Any]] = None
    investment_context: Optional[Dict[str, Any]] = None
    analytical_version: str = "v6.0-deterministic"
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    requires_field_validation: bool = True
    disclaimer: str = "AI-Derived Analytical Signal — Not Official Policy"
    validation_requirement: str = "Potential Silent Need Signal — requires administrative field validation."

    # Backward-compatibility aliases for Phase 1-5 consumers & tests
    infra_deficit_score: float
    voice_reporting_score: float
    digital_access_score: float
    population_vulnerability: float
    discrepancy_magnitude: float
    signal_confidence: float
    validation_status: str = "POTENTIAL_SIGNAL_UNVALIDATED"
    ai_hypothesis: Optional[str] = "Elevated infrastructure deficit with suppressed citizen reporting due to digital exclusion."
    why_summary: Optional[str] = "High deficit and vulnerability observed with disproportionately low citizen reporting footprint."
    supporting_evidence_count: int = 3
    latitude: float = 0.0
    longitude: float = 0.0

class SilentNeedSummary(BaseModel):
    total_geographies_analyzed: int
    total_signals: int
    potential_signals: int
    strong_potential_signals: int
    categories: Dict[str, int]
    states: Dict[str, int]
    analytical_version: str = "v6.0-deterministic"
    disclaimer: str = "AI-Derived Analytical Signal — Not Official Policy"
