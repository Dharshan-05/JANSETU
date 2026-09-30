from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, model_validator

class TextInputRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Raw citizen message in any Indian language or English")
    language: Optional[str] = Field(default=None, description="ISO/BCP-47 language code: ta-IN, hi-IN, te-IN, en-IN, ta, hi, etc.")
    detected_language: Optional[str] = Field(default=None, description="Alias for language")
    channel: str = Field(default="text_web", description="Channel: text_web, whatsapp, ivr, mobile_app, bhashini_api")
    source_channel: Optional[str] = Field(default=None, description="Alias for channel")
    geo_id: Optional[str] = Field(default=None, description="Known Census LGD or Geo ID")
    declared_geo_id: Optional[str] = Field(default=None, description="Alias for geo_id")
    declared_state: Optional[str] = Field(default=None, description="Citizen-selected state")
    declared_district: Optional[str] = Field(default=None, description="Citizen-selected district")
    latitude: Optional[float] = Field(default=None, description="Device GPS latitude if consented")
    longitude: Optional[float] = Field(default=None, description="Device GPS longitude if consented")

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "language" not in values and "detected_language" in values:
                values["language"] = values["detected_language"]
            elif "detected_language" not in values and "language" in values:
                values["detected_language"] = values["language"]

            if "geo_id" not in values and "declared_geo_id" in values:
                values["geo_id"] = values["declared_geo_id"]
            elif "declared_geo_id" not in values and "geo_id" in values:
                values["declared_geo_id"] = values["geo_id"]

            if "channel" not in values and "source_channel" in values:
                values["channel"] = values["source_channel"]
            elif "source_channel" not in values and "channel" in values:
                values["source_channel"] = values["channel"]
        return values


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
