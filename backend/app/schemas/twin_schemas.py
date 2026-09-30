from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class PopulationMetrics(BaseModel):
    total_population: int
    vulnerability_percentage: float
    elderly_percentage: float
    literacy_rate: float
    digital_penetration_index: float
    primary_livelihood: str

class CivicHealthRadar(BaseModel):
    transport_access: float = Field(ge=0.0, le=1.0)
    water_security: float = Field(ge=0.0, le=1.0)
    healthcare_proximity: float = Field(ge=0.0, le=1.0)
    education_quality: float = Field(ge=0.0, le=1.0)
    power_reliability: float = Field(ge=0.0, le=1.0)
    sanitation_index: float = Field(ge=0.0, le=1.0)

class IntelligenceSummary(BaseModel):
    population_exposure: str
    citizen_demand_level: str
    infrastructure_gap: str
    digital_access: str
    investment_coverage: str
    emerging_signal: str
    potential_silent_need_zones: int

class ClusterSummary(BaseModel):
    cluster_id: str
    category: str
    title: str
    request_count: int
    severity_score: float
    status: str

class CivicDigitalTwin(BaseModel):
    geo_id: str
    admin_name: str
    admin_level: int
    state_name: str
    district_name: Optional[str] = None
    latitude: float
    longitude: float
    population_metrics: PopulationMetrics
    civic_health_radar: CivicHealthRadar
    intelligence_summary: IntelligenceSummary
    active_clusters: List[ClusterSummary]
    silent_need_count: int
    active_public_projects_count: int
    allocated_capex_inr: int
    last_computed_at: str
