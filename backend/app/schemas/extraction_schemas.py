from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator, model_validator
from app.core.taxonomy import validate_category, validate_subcategory, validate_cohort, CATEGORIES

class ExtractedLocation(BaseModel):
    raw_location_text: str = Field(default="", description="The geographic or local reference as spoken by the citizen")
    matched_village_or_ward: Optional[str] = Field(default=None, description="Inferred or matched village/ward name")
    block_or_taluk: Optional[str] = Field(default=None, description="Taluk / Tehsil / Block name")
    district: Optional[str] = Field(default=None, description="District name")
    state: Optional[str] = Field(default=None, description="State / UT name")
    approximate_latitude: Optional[float] = Field(default=None, description="Approximate latitude if resolvable")
    approximate_longitude: Optional[float] = Field(default=None, description="Approximate longitude if resolvable")

class GeminiRequestExtraction(BaseModel):
    """
    Structured extraction output contract enforced upon Gemini 2.5.
    Validates primary category, subcategory, concrete issue, severity, urgency,
    and non-sensitive affected demographic cohort.
    """
    primary_category: str = Field(
        ...,
        description="Controlled category: transport, water, healthcare, roads, education, electricity, sanitation, digital_connectivity, agriculture, housing, public_safety, other"
    )
    subcategory: str = Field(
        ...,
        description="Controlled subcategory within primary category"
    )
    specific_issue: str = Field(
        ...,
        description="Concise 2-5 word descriptor of concrete infrastructure problem"
    )
    location: ExtractedLocation = Field(
        default_factory=lambda: ExtractedLocation(raw_location_text=""),
        description="Contextual location interpretation (authoritative geo_id remains unchanged)"
    )
    severity: int = Field(
        default=3,
        ge=1, le=5,
        description="Citizen reported severity index: 1 (minor) to 5 (critical disruption)"
    )
    severity_level: Optional[int] = Field(
        default=None,
        ge=1, le=5,
        description="Canonical alias for severity"
    )
    urgency_score: float = Field(
        default=0.7,
        ge=0.0, le=1.0,
        description="Inferred urgency level: 0.0 to 1.0"
    )
    urgency: Optional[float] = Field(
        default=None,
        ge=0.0, le=1.0,
        description="Canonical alias for urgency_score"
    )
    affected_group: str = Field(
        default="general_population",
        description="Primary impacted demographic: students, women, elderly, farmers, patients, workers, children, general_population"
    )
    cohort: Optional[str] = Field(
        default=None,
        description="Canonical alias for affected_group"
    )
    affected_demographic: Optional[str] = Field(
        default=None,
        description="Canonical alias for affected_group"
    )
    time_pattern: str = Field(
        default="continuous",
        description="Temporal pattern: evening, morning, night, monsoon_season, continuous"
    )
    key_entities: List[str] = Field(
        default_factory=list,
        description="Key infrastructure entities and technical terms"
    )
    extracted_entities: Optional[List[str]] = Field(
        default=None,
        description="Canonical alias for key_entities"
    )
    infrastructure_gap: Optional[str] = Field(
        default=None,
        description="Concrete infrastructure gap identified"
    )
    actionable_summary: Optional[str] = Field(
        default=None,
        description="Synthesized 1-2 sentence actionable civic brief"
    )
    raw_location_text: Optional[str] = Field(
        default="",
        description="Contextual location string mentioned by citizen"
    )
    hallucination_safeguards_passed: bool = Field(
        default=True,
        description="Whether strict zero-hallucination verification checks passed"
    )
    confidence: float = Field(
        default=0.95,
        ge=0.0, le=1.0,
        description="Model extraction confidence score"
    )
    confidence_score: Optional[float] = Field(
        default=None,
        ge=0.0, le=1.0,
        description="Canonical alias for confidence"
    )
    model_name: Optional[str] = Field(default="gemini-2.5-pro", description="AI perception model used")
    model_version: Optional[str] = Field(default="v4.0-structured", description="Model deployment version")
    prompt_version: str = Field(default="v4.0", description="Extraction prompt version")

    @model_validator(mode="before")
    @classmethod
    def reconcile_aliases_and_taxonomy(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # 0. Clamping numeric bounds
            if "severity_level" in data and "severity" not in data:
                data["severity"] = data["severity_level"]
            if "severity" in data:
                try:
                    s_val = int(data["severity"])
                    data["severity"] = max(1, min(5, s_val))
                    data["severity_level"] = data["severity"]
                except (ValueError, TypeError):
                    data["severity"] = 3
                    data["severity_level"] = 3

            if "urgency" in data and "urgency_score" not in data:
                data["urgency_score"] = data["urgency"]
            if "urgency_score" in data:
                try:
                    u_val = float(data["urgency_score"])
                    data["urgency_score"] = max(0.0, min(1.0, u_val))
                    data["urgency"] = data["urgency_score"]
                except (ValueError, TypeError):
                    data["urgency_score"] = 0.5
                    data["urgency"] = 0.5

            # 1. Alias reconciliation
            raw_cohort = data.get("affected_demographic") or data.get("cohort") or data.get("affected_group")
            if raw_cohort:
                norm_c = validate_cohort(raw_cohort)
                data["affected_group"] = norm_c
                data["cohort"] = norm_c
                data["affected_demographic"] = norm_c

            if "extracted_entities" in data and "key_entities" not in data:
                data["key_entities"] = data["extracted_entities"]
            elif "key_entities" in data and "extracted_entities" not in data:
                data["extracted_entities"] = data["key_entities"]

            if "confidence" in data and "confidence_score" not in data:
                data["confidence_score"] = data["confidence"]
            elif "confidence_score" in data and "confidence" not in data:
                data["confidence"] = data["confidence_score"]

            if not data.get("specific_issue"):
                data["specific_issue"] = data.get("infrastructure_gap") or data.get("actionable_summary") or "Civic infrastructure issue"

            if not data.get("actionable_summary"):
                data["actionable_summary"] = data.get("specific_issue")

            # 2. Taxonomy normalization
            raw_cat = data.get("primary_category")
            norm_cat = validate_category(raw_cat)
            data["primary_category"] = norm_cat

            raw_sub = data.get("subcategory")
            data["subcategory"] = validate_subcategory(norm_cat, raw_sub)

            # Handle location
            if "location" in data and isinstance(data["location"], dict):
                loc_dict = data["location"]
                if "raw_location_text" in data and not loc_dict.get("raw_location_text"):
                    loc_dict["raw_location_text"] = data["raw_location_text"]
                data["location"] = ExtractedLocation(**loc_dict)
            elif "raw_location_text" in data and "location" not in data:
                data["location"] = ExtractedLocation(raw_location_text=data.get("raw_location_text") or "")
        return data
