from typing import List, Optional
from pydantic import BaseModel, Field

class ExtractedLocation(BaseModel):
    raw_location_text: str = Field(description="The geographic or local reference as spoken by the citizen")
    matched_village_or_ward: Optional[str] = Field(default=None, description="Inferred or matched village/ward name")
    block_or_taluk: Optional[str] = Field(default=None, description="Taluk / Tehsil / Block name")
    district: Optional[str] = Field(default=None, description="District name")
    state: Optional[str] = Field(default=None, description="State / UT name")
    approximate_latitude: Optional[float] = Field(default=None, description="Approximate latitude if resolvable")
    approximate_longitude: Optional[float] = Field(default=None, description="Approximate longitude if resolvable")

class GeminiRequestExtraction(BaseModel):
    """Structured extraction output contract enforced upon Gemini 2.5."""
    primary_category: str = Field(
        description="One of: transport, water, healthcare, education, electricity, sanitation, roads, flood_drainage"
    )
    subcategory: str = Field(
        description="Granular classification, e.g., evening_bus_service, drinking_water_contamination, phc_doctor_shortage, rural_road_potholes"
    )
    specific_issue: str = Field(
        description="Concise, standardized 2-5 word descriptor of the failure mode"
    )
    location: ExtractedLocation = Field(
        description="Extracted geographic entity and administrative hierarchy resolution"
    )
    severity: int = Field(
        ge=1, le=5,
        description="Impact severity rating: 1=Minor inconvenience, 3=Disruptive public hazard, 5=Critical life/safety emergency"
    )
    urgency_score: float = Field(
        ge=0.0, le=1.0,
        description="0.0 to 1.0 urgency index based on immediate community risk"
    )
    affected_group: str = Field(
        description="Primary impacted demographic: students, women, elderly, farmers, patients, daily_wage_workers, general_population"
    )
    time_pattern: str = Field(
        description="Temporal occurrence: evening, morning, night, monsoon_season, continuous, weekend"
    )
    key_entities: List[str] = Field(
        default_factory=list,
        description="Key infrastructure concepts and named entities mentioned"
    )
    confidence: float = Field(
        default=0.95,
        ge=0.0, le=1.0,
        description="Model extraction confidence"
    )
