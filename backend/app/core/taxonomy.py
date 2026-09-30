"""
JANSETU Controlled Civic Infrastructure Taxonomy.
Centralized, deterministic taxonomy of categories, subcategories, and cohorts.
"""

from typing import Dict, List, Optional

# Controlled primary categories
CATEGORIES: List[str] = [
    "transport",
    "water",
    "healthcare",
    "roads",
    "education",
    "electricity",
    "sanitation",
    "digital_connectivity",
    "agriculture",
    "housing",
    "public_safety",
    "other"
]

# Controlled subcategories per category
SUBCATEGORIES_BY_CATEGORY: Dict[str, List[str]] = {
    "transport": [
        "public_bus",
        "bus_frequency",
        "evening_service",
        "last_mile_access",
        "rail_connectivity",
        "feeder_service",
        "fare_issues"
    ],
    "water": [
        "drinking_water",
        "pipeline_leakage",
        "groundwater_depletion",
        "water_contamination",
        "tanker_dependency",
        "borewell_failure"
    ],
    "healthcare": [
        "primary_health_center",
        "doctor_availability",
        "medicines_shortage",
        "emergency_access",
        "maternal_care",
        "ambulance_delay"
    ],
    "roads": [
        "potholes_and_damage",
        "bridge_construction",
        "arterial_connectivity",
        "drainage_and_flooding",
        "street_lighting",
        "rural_road_paving"
    ],
    "education": [
        "school_infrastructure",
        "teacher_shortage",
        "classroom_overcrowding",
        "sanitation_facilities",
        "student_transport",
        "digital_learning_lab"
    ],
    "electricity": [
        "power_outages",
        "low_voltage",
        "damaged_transformer",
        "loose_hanging_wires",
        "agricultural_feeders",
        "billing_discrepancy"
    ],
    "sanitation": [
        "solid_waste_dumping",
        "open_drainage_overflow",
        "public_toilets",
        "sewage_backflow",
        "vector_breeding",
        "garbage_collection"
    ],
    "digital_connectivity": [
        "cellular_signal_deadzone",
        "broadband_fiber_gap",
        "common_service_center",
        "online_services_access"
    ],
    "agriculture": [
        "irrigation_canal_breach",
        "cold_storage_deficit",
        "mandi_access",
        "crop_damage_relief"
    ],
    "housing": [
        "pmay_housing_delay",
        "slum_rehabilitation",
        "structural_damage",
        "drainage_encroachment"
    ],
    "public_safety": [
        "dark_corridors_lighting",
        "police_patrolling",
        "traffic_signals",
        "stray_animals_hazard"
    ],
    "other": [
        "unclassified_civic_issue",
        "general_grievance"
    ]
}

# Controlled demographic cohorts (strictly non-sensitive)
ALLOWED_COHORTS: List[str] = [
    "students",
    "elderly",
    "women",
    "farmers",
    "children",
    "workers",
    "patients",
    "general_population"
]

# Canonical category synonym mapping
_CATEGORY_SYNONYMS: Dict[str, str] = {
    "bus": "transport",
    "transportation": "transport",
    "transit": "transport",
    "public_transport": "transport",
    "drinking_water": "water",
    "water_supply": "water",
    "pipeline": "water",
    "potable_water": "water",
    "health": "healthcare",
    "hospital": "healthcare",
    "medical": "healthcare",
    "phc": "healthcare",
    "clinic": "healthcare",
    "road": "roads",
    "pothole": "roads",
    "potholes": "roads",
    "highway": "roads",
    "bridge": "roads",
    "school": "education",
    "schools": "education",
    "college": "education",
    "learning": "education",
    "power": "electricity",
    "transformer": "electricity",
    "energy": "electricity",
    "grid": "electricity",
    "drain": "sanitation",
    "drainage": "sanitation",
    "sewage": "sanitation",
    "garbage": "sanitation",
    "waste": "sanitation",
    "cleanliness": "sanitation",
    "telecom": "digital_connectivity",
    "internet": "digital_connectivity",
    "mobile_network": "digital_connectivity",
    "cellular": "digital_connectivity",
    "farming": "agriculture",
    "irrigation": "agriculture",
    "crop": "agriculture",
    "shelter": "housing",
    "pmay": "housing",
    "slum": "housing",
    "safety": "public_safety",
    "police": "public_safety",
    "security": "public_safety",
    "miscellaneous": "other",
    "general": "other"
}

def validate_category(raw_category: Optional[str]) -> str:
    """Normalizes and maps raw category string to controlled JANSETU category."""
    if not raw_category:
        return "other"
    clean = raw_category.strip().lower().replace(" ", "_")
    if clean in CATEGORIES:
        return clean
    if clean in _CATEGORY_SYNONYMS:
        return _CATEGORY_SYNONYMS[clean]
    # Check partial contains
    for syn, target in _CATEGORY_SYNONYMS.items():
        if syn in clean:
            return target
    return "other"

def validate_subcategory(category: str, raw_subcategory: Optional[str]) -> str:
    """Validates subcategory within given category, falling back to primary subcategory."""
    cat = validate_category(category)
    valid_subs = SUBCATEGORIES_BY_CATEGORY.get(cat, SUBCATEGORIES_BY_CATEGORY["other"])
    if not raw_subcategory:
        return valid_subs[0]
    clean = raw_subcategory.strip().lower().replace(" ", "_")
    if clean in valid_subs:
        return clean
    # Check partial matches
    for s in valid_subs:
        if s in clean or clean in s:
            return s
    return valid_subs[0]

def validate_cohort(raw_cohort: Optional[str]) -> str:
    """Validates that extracted cohort belongs to allowed non-sensitive cohorts."""
    if not raw_cohort:
        return "general_population"
    clean = raw_cohort.strip().lower().replace(" ", "_")
    if clean in ALLOWED_COHORTS:
        return clean
    # Map common aliases
    cohort_aliases = {
        "student": "students",
        "youth": "students",
        "elder": "elderly",
        "seniors": "elderly",
        "senior_citizens": "elderly",
        "pensioners": "elderly",
        "woman": "women",
        "mothers": "women",
        "girls": "women",
        "farmer": "farmers",
        "cultivators": "farmers",
        "child": "children",
        "kids": "children",
        "worker": "workers",
        "laborers": "workers",
        "daily_wagers": "workers",
        "patient": "patients",
        "sick": "patients",
        "public": "general_population",
        "citizens": "general_population"
    }
    return cohort_aliases.get(clean, "general_population")

def list_categories() -> List[str]:
    """Returns all controlled primary categories."""
    return list(CATEGORIES)

def get_subcategories(category: str) -> List[str]:
    """Returns valid subcategories for a given category."""
    cat = validate_category(category)
    return list(SUBCATEGORIES_BY_CATEGORY.get(cat, []))

# Canonical aliases and helpers
CIVIC_TAXONOMY = SUBCATEGORIES_BY_CATEGORY
ALLOWED_DEMOGRAPHIC_COHORTS = ALLOWED_COHORTS

def get_taxonomy_summary() -> Dict:
    """Returns structured summary of taxonomy categories, subcategories, and cohorts."""
    return {
        "categories": list(CATEGORIES),
        "subcategories": SUBCATEGORIES_BY_CATEGORY,
        "allowed_cohorts": list(ALLOWED_COHORTS)
    }

