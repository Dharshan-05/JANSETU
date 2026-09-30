import re
from typing import Dict, Any, List, Tuple, Set, Optional

# Supported Language Codes in India (22 Scheduled + English)
SUPPORTED_LANGUAGES = {"ta", "hi", "te", "kn", "mr", "bn", "gu", "ml", "pa", "or", "as", "ur", "en"}

# Canonical Infrastructure Categories
VALID_INFRA_CATEGORIES = {
    "transport", "water", "healthcare", "education", "electricity", "sanitation", "roads", "flood_drainage"
}

# Valid Investment Project Statuses
VALID_PROJECT_STATUSES = {"sanctioned", "in_progress", "delayed", "completed", "stalled"}

# Regex pattern detecting potential phone numbers (privacy leak check)
PHONE_REGEX = re.compile(r"(\+91[\-\s]?)?[6-9]\d{9}")
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")

class ValidationError(Exception):
    """Raised when record fails strict schema or domain validation."""
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(f"Validation failed on '{field}': {message}")

class DataValidator:
    """
    Validates canonical data records before BigQuery ingestion.
    Enforces geographic hierarchy, field bounds, privacy invariants, and provenance.
    """

    @staticmethod
    def validate_geography(record: Dict[str, Any], known_geo_ids: Optional[Set[str]] = None) -> Tuple[bool, List[str]]:
        errors = []
        geo_id = record.get("geo_id")
        if not geo_id or not isinstance(geo_id, str):
            errors.append("geo_id is required and must be a non-empty string.")

        level = record.get("geo_level", record.get("admin_level"))
        if level is None or not isinstance(level, int) or level < 0 or level > 4:
            errors.append(f"geo_level must be an integer between 0 and 4 (got {level}).")

        # Level 0 (Country) has no parent; Levels 1-4 must have parent_geo_id
        parent_id = record.get("parent_geo_id")
        if level is not None and level > 0:
            if not parent_id:
                errors.append(f"parent_geo_id is required for administrative level {level}.")
            elif known_geo_ids is not None and parent_id not in known_geo_ids:
                errors.append(f"parent_geo_id '{parent_id}' does not exist in known geography hierarchy.")

        # State code required for all Indian sub-national entities
        if level is not None and level >= 1:
            state_code = record.get("state_code")
            if not state_code or len(state_code) < 2:
                errors.append("state_code is required for state, district, block, and village levels.")

        # Lat/Long range
        lat = record.get("latitude")
        lon = record.get("longitude")
        if lat is not None and (lat < -90.0 or lat > 90.0):
            errors.append(f"latitude {lat} out of bounds [-90, 90].")
        if lon is not None and (lon < -180.0 or lon > 180.0):
            errors.append(f"longitude {lon} out of bounds [-180, 180].")

        # Provenance check
        if "is_synthetic" not in record or not isinstance(record.get("is_synthetic"), bool):
            errors.append("is_synthetic must be an explicit boolean value (True or False).")

        return len(errors) == 0, errors

    @staticmethod
    def validate_demographics(record: Dict[str, Any], known_geo_ids: Optional[Set[str]] = None) -> Tuple[bool, List[str]]:
        errors = []
        geo_id = record.get("geo_id")
        if not geo_id:
            errors.append("geo_id is required.")
        elif known_geo_ids is not None and geo_id not in known_geo_ids:
            errors.append(f"Foreign key geo_id '{geo_id}' does not exist in geography table.")

        pop = record.get("total_population", record.get("population"))
        if pop is None or pop < 0:
            errors.append(f"population must be a non-negative integer (got {pop}).")

        vuln = record.get("vulnerability_percentage")
        if vuln is not None and (vuln < 0.0 or vuln > 1.0):
            errors.append(f"vulnerability_percentage must be between 0.0 and 1.0 (got {vuln}).")

        digital = record.get("digital_penetration_index")
        if digital is not None and (digital < 0.0 or digital > 1.0):
            errors.append(f"digital_penetration_index must be between 0.0 and 1.0 (got {digital}).")

        if "is_synthetic" not in record or not isinstance(record.get("is_synthetic"), bool):
            errors.append("is_synthetic must be an explicit boolean value.")

        return len(errors) == 0, errors

    @staticmethod
    def validate_infrastructure(record: Dict[str, Any], known_geo_ids: Optional[Set[str]] = None) -> Tuple[bool, List[str]]:
        errors = []
        geo_id = record.get("geo_id")
        if not geo_id:
            errors.append("geo_id is required.")
        elif known_geo_ids is not None and geo_id not in known_geo_ids:
            errors.append(f"Foreign key geo_id '{geo_id}' does not exist in geography table.")

        category = record.get("category", record.get("infrastructure_type"))
        if not category or category.lower() not in VALID_INFRA_CATEGORIES:
            errors.append(f"category '{category}' must be one of {VALID_INFRA_CATEGORIES}.")

        deficit = record.get("deficit_score", record.get("deficit_value"))
        if deficit is None or deficit < 0.0 or deficit > 1.0:
            errors.append(f"deficit_score must be between 0.0 and 1.0 (got {deficit}).")

        coverage = record.get("coverage_value")
        if coverage is not None and (coverage < 0.0 or coverage > 1.0):
            errors.append(f"coverage_value must be between 0.0 and 1.0 (got {coverage}).")

        if not record.get("source") and not record.get("source_dataset"):
            errors.append("source or source_dataset must be provided for provenance.")

        return len(errors) == 0, errors

    @staticmethod
    def validate_investment(record: Dict[str, Any], known_geo_ids: Optional[Set[str]] = None) -> Tuple[bool, List[str]]:
        errors = []
        proj_id = record.get("project_id", record.get("investment_id"))
        if not proj_id:
            errors.append("project_id / investment_id is required.")

        geo_id = record.get("geo_id")
        if not geo_id:
            errors.append("geo_id is required.")
        elif known_geo_ids is not None and geo_id not in known_geo_ids:
            errors.append(f"Foreign key geo_id '{geo_id}' does not exist in geography table.")

        budget = record.get("allocated_budget_inr", record.get("investment_amount"))
        if budget is None or budget < 0:
            errors.append(f"allocated_budget_inr must be non-negative (got {budget}).")

        status = record.get("status", record.get("project_status"))
        if not status or status.lower() not in VALID_PROJECT_STATUSES:
            errors.append(f"status '{status}' must be one of {VALID_PROJECT_STATUSES}.")

        if "is_synthetic" not in record or not isinstance(record.get("is_synthetic"), bool):
            errors.append("is_synthetic must be explicitly set to True or False.")

        return len(errors) == 0, errors

    @staticmethod
    def validate_citizen_request(record: Dict[str, Any], known_geo_ids: Optional[Set[str]] = None) -> Tuple[bool, List[str]]:
        errors = []
        req_id = record.get("request_id")
        if not req_id:
            errors.append("request_id is required.")

        geo_id = record.get("geo_id")
        if not geo_id:
            errors.append("geo_id is required.")
        elif known_geo_ids is not None and geo_id not in known_geo_ids:
            errors.append(f"Foreign key geo_id '{geo_id}' does not exist in geography table.")

        lang = record.get("language", record.get("detected_language"))
        if lang and lang.lower() not in SUPPORTED_LANGUAGES:
            errors.append(f"Language '{lang}' is not in supported Indian languages {SUPPORTED_LANGUAGES}.")

        sev = record.get("severity")
        if sev is None or not isinstance(sev, int) or sev < 1 or sev > 5:
            errors.append(f"severity must be an integer between 1 and 5 (got {sev}).")

        urgency = record.get("urgency_score", record.get("urgency"))
        if urgency is not None and (urgency < 0.0 or urgency > 1.0):
            errors.append(f"urgency must be between 0.0 and 1.0 (got {urgency}).")

        # Privacy invariant checks
        transcript = record.get("original_transcript", "")
        if PHONE_REGEX.search(transcript):
            errors.append("PRIVACY VIOLATION: Unmasked phone number detected in citizen transcript.")
        if EMAIL_REGEX.search(transcript):
            errors.append("PRIVACY VIOLATION: Email address detected in citizen transcript.")

        return len(errors) == 0, errors
