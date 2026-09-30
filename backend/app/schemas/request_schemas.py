from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class TextInputRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=5000, description="Raw citizen message in any Indian language or English")
    detected_language: Optional[str] = Field(default=None, description="Optional ISO language code: ta, hi, te, en, etc.")
    source_channel: str = Field(default="text_web", description="Channel: text_web, whatsapp, ivr, mobile_app, bhashini_api")
    declared_state: Optional[str] = Field(default=None, description="Citizen-selected state")
    declared_district: Optional[str] = Field(default=None, description="Citizen-selected district")
    declared_geo_id: Optional[str] = Field(default=None, description="Known Census LGD or Geo ID")
    latitude: Optional[float] = Field(default=None, description="Device GPS latitude if consented")
    longitude: Optional[float] = Field(default=None, description="Device GPS longitude if consented")

class SandboxSimulationRequest(BaseModel):
    geo_id: str = Field(..., description="Target administrative unit, e.g., IND_TN_DHM_HRR")
    sector: str = Field(..., description="Infrastructure sector: transport, water, healthcare, education, electricity, sanitation")
    intervention_type: str = Field(..., description="Type of proposed policy intervention, e.g. ADD_BUS_ROUTES, INSTALL_SOLAR_BOREWELLS")
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dynamic intervention parameters such as count, capacity, schedule, allocated_budget_inr"
    )

class FilterParams(BaseModel):
    state_code: Optional[str] = None
    district_code: Optional[str] = None
    category: Optional[str] = None
    severity_min: Optional[int] = Field(default=1, ge=1, le=5)
    limit: int = Field(default=50, ge=1, le=500)
