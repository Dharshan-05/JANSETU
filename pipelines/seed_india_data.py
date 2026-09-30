import uuid
from datetime import datetime, date
from app.db.bigquery_client import db
from app.core.logging import logger

def seed_india_pilot_data():
    """
    Populates realistic civic intelligence data across 4 Indian states
    (Tamil Nadu, Uttar Pradesh, Telangana, Maharashtra) grounded in official Census LGD,
    PMGSY, and Jal Jeevan Mission parameters.
    """
    logger.info("Initializing JANSETU Pan-India Civic Intelligence Seed Data...")

    # 1. Administrative Geography
    geography_data = [
        # Tamil Nadu - Dharmapuri & Salem
        {
            "geo_id": "IND_TN_DHM_HRR",
            "admin_level": 3,
            "name": "Harur Block",
            "native_name": "அரூர்",
            "state_code": "TN",
            "district_code": "Dharmapuri",
            "block_code": "Harur",
            "latitude": 12.0622,
            "longitude": 78.4975,
            "is_pilot_region": True
        },
        {
            "geo_id": "IND_TN_DHM_PNG",
            "admin_level": 3,
            "name": "Pennagaram Block",
            "native_name": "பெPennagaram",
            "state_code": "TN",
            "district_code": "Dharmapuri",
            "block_code": "Pennagaram",
            "latitude": 12.1333,
            "longitude": 77.8833,
            "is_pilot_region": True
        },
        # Uttar Pradesh - Varanasi & Mirzapur
        {
            "geo_id": "IND_UP_VAR_PND",
            "admin_level": 3,
            "name": "Pindra Block",
            "native_name": "पिंडरा",
            "state_code": "UP",
            "district_code": "Varanasi",
            "block_code": "Pindra",
            "latitude": 25.4833,
            "longitude": 82.8500,
            "is_pilot_region": True
        },
        {
            "geo_id": "IND_UP_VAR_SVP",
            "admin_level": 3,
            "name": "Sevapuri Block",
            "native_name": "सेवापुरी",
            "state_code": "UP",
            "district_code": "Varanasi",
            "block_code": "Sevapuri",
            "latitude": 25.3333,
            "longitude": 82.7833,
            "is_pilot_region": True
        },
        # Telangana - Mahabubnagar & Adilabad
        {
            "geo_id": "IND_TG_MBN_JDC",
            "admin_level": 3,
            "name": "Jadcherla Block",
            "native_name": "జడ్చర్ల",
            "state_code": "TG",
            "district_code": "Mahabubnagar",
            "block_code": "Jadcherla",
            "latitude": 16.7644,
            "longitude": 78.1367,
            "is_pilot_region": True
        },
        # Maharashtra - Gadchiroli (Tribal Forest Belt)
        {
            "geo_id": "IND_MH_GDC_AHR",
            "admin_level": 3,
            "name": "Aheri Tribal Block",
            "native_name": "अहेरी",
            "state_code": "MH",
            "district_code": "Gadchiroli",
            "block_code": "Aheri",
            "latitude": 19.4167,
            "longitude": 80.0000,
            "is_pilot_region": True
        }
    ]
    db.insert_records("geography", geography_data)

    # 2. Demographics & Vulnerability Indices
    demographics_data = [
        {
            "geo_id": "IND_TN_DHM_HRR",
            "census_year": 2021,
            "total_population": 194820,
            "vulnerability_percentage": 0.58,
            "elderly_percentage": 0.14,
            "literacy_rate": 0.68,
            "digital_penetration_index": 0.34,
            "primary_livelihood": "Rainfed Agriculture & Sericulture"
        },
        {
            "geo_id": "IND_TN_DHM_PNG",
            "census_year": 2021,
            "total_population": 162400,
            "vulnerability_percentage": 0.64,
            "elderly_percentage": 0.12,
            "literacy_rate": 0.62,
            "digital_penetration_index": 0.28,
            "primary_livelihood": "Millets & Fishery"
        },
        {
            "geo_id": "IND_UP_VAR_PND",
            "census_year": 2021,
            "total_population": 284100,
            "vulnerability_percentage": 0.52,
            "elderly_percentage": 0.11,
            "literacy_rate": 0.74,
            "digital_penetration_index": 0.58,
            "primary_livelihood": "Intensive Agriculture & Weaving"
        },
        {
            "geo_id": "IND_UP_VAR_SVP",
            "census_year": 2021,
            "total_population": 235600,
            "vulnerability_percentage": 0.49,
            "elderly_percentage": 0.10,
            "literacy_rate": 0.76,
            "digital_penetration_index": 0.62,
            "primary_livelihood": "Dairy & MSME"
        },
        {
            "geo_id": "IND_TG_MBN_JDC",
            "census_year": 2021,
            "total_population": 218900,
            "vulnerability_percentage": 0.54,
            "elderly_percentage": 0.13,
            "literacy_rate": 0.65,
            "digital_penetration_index": 0.48,
            "primary_livelihood": "Cotton, Maize & Pharma Logistics"
        },
        {
            "geo_id": "IND_MH_GDC_AHR",
            "census_year": 2021,
            "total_population": 116500,
            "vulnerability_percentage": 0.82,
            "elderly_percentage": 0.09,
            "literacy_rate": 0.48,
            "digital_penetration_index": 0.16,
            "primary_livelihood": "Minor Forest Produce & Subsistence Farming"
        }
    ]
    db.insert_records("demographics", demographics_data)

    # 3. Infrastructure Audit Baselines
    infra_data = [
        # Harur: High transport deficit, moderate water deficit
        {
            "geo_id": "IND_TN_DHM_HRR",
            "category": "transport",
            "indicator_name": "Evening Public Bus Connectivity Gap",
            "indicator_value": 0.38,
            "national_benchmark": 0.80,
            "deficit_score": 0.72,
            "source_dataset": "State Road Transport Undertaking (TNSTC) Fleet Audit 2024"
        },
        {
            "geo_id": "IND_TN_DHM_HRR",
            "category": "healthcare",
            "indicator_name": "PHC Doctor-to-Population Ratio",
            "indicator_value": 0.45,
            "national_benchmark": 1.00,
            "deficit_score": 0.65,
            "source_dataset": "National Health Mission - Rural Infrastructure 2024"
        },
        {
            "geo_id": "IND_TN_DHM_HRR",
            "category": "water",
            "indicator_name": "Piped Tap Water Reliability (Hours/Day)",
            "indicator_value": 2.4,
            "national_benchmark": 8.0,
            "deficit_score": 0.68,
            "source_dataset": "Jal Jeevan Mission Dashboard 2025"
        },
        # Aheri (Gadchiroli): Acute healthcare & water deficit
        {
            "geo_id": "IND_MH_GDC_AHR",
            "category": "healthcare",
            "indicator_name": "Average Distance to Emergency Trauma Center",
            "indicator_value": 46.2,
            "national_benchmark": 10.0,
            "deficit_score": 0.88,
            "source_dataset": "HMIS Rural Health Statistics 2024"
        },
        {
            "geo_id": "IND_MH_GDC_AHR",
            "category": "water",
            "indicator_name": "Habitations with Potable Safe Drinking Water",
            "indicator_value": 0.28,
            "national_benchmark": 0.95,
            "deficit_score": 0.82,
            "source_dataset": "Jal Jeevan Mission Dashboard 2025"
        },
        # Pindra (Varanasi): High road pothole congestion, good water
        {
            "geo_id": "IND_UP_VAR_PND",
            "category": "roads",
            "indicator_name": "Paved All-Weather Rural Road Connectivity",
            "indicator_value": 0.62,
            "national_benchmark": 0.95,
            "deficit_score": 0.58,
            "source_dataset": "PMGSY Quality Monitoring 2025"
        }
    ]
    db.insert_records("infrastructure", infra_data)

    # 4. Public Investments & Capital Projects
    investments_data = [
        {
            "project_id": "PRJ-TN-PMGSY-088",
            "geo_id": "IND_TN_DHM_HRR",
            "project_name": "Harur-Morappur Feeder Road Widening and Blacktopping",
            "scheme_name": "PMGSY-III",
            "category": "transport",
            "allocated_budget_inr": 85000000,
            "expended_budget_inr": 62000000,
            "status": "in_progress",
            "commenced_date": date(2024, 6, 1),
            "target_completion_date": date(2026, 12, 31),
            "beneficiary_population": 48000
        },
        {
            "project_id": "PRJ-UP-JJM-104",
            "geo_id": "IND_UP_VAR_PND",
            "project_name": "Pindra Har Ghar Jal Piped Water Multi-Village Scheme",
            "scheme_name": "Jal Jeevan Mission",
            "category": "water",
            "allocated_budget_inr": 142000000,
            "expended_budget_inr": 139000000,
            "status": "completed",
            "commenced_date": date(2023, 10, 1),
            "target_completion_date": date(2025, 9, 30),
            "beneficiary_population": 84000
        }
    ]
    db.insert_records("investments", investments_data)

    # 5. Pre-computed Demand Clusters
    clusters_data = [
        {
            "cluster_id": "CLS-TRN-041",
            "geo_id": "IND_TN_DHM_HRR",
            "category": "transport",
            "cluster_title": "Harur Evening Bus Connectivity Deficit for Students",
            "cluster_summary": "1,847 related citizen voice and text reports across 12 villages describing lack of evening public transport after 7:00 PM, impacting school students and women workers.",
            "request_count": 1847,
            "average_severity": 4.2,
            "first_reported_at": "2026-08-10T14:22:00Z",
            "latest_reported_at": "2026-09-30T10:15:00Z",
            "growth_velocity_7d": 42.6,
            "status": "emerging"
        },
        {
            "cluster_id": "CLS-WAT-018",
            "geo_id": "IND_UP_VAR_PND",
            "category": "water",
            "cluster_title": "Pindra Groundwater Salinity & Borewell Motor Failure",
            "cluster_summary": "942 citizen reports regarding summer borehole motor burnouts and untreated alkaline sediment in community supply.",
            "request_count": 942,
            "average_severity": 3.8,
            "first_reported_at": "2026-07-04T08:00:00Z",
            "latest_reported_at": "2026-09-29T18:40:00Z",
            "growth_velocity_7d": 18.2,
            "status": "peak"
        }
    ]
    db.insert_records("demand_clusters", clusters_data)

    # 6. Geospatial Hotspots
    hotspots_data = [
        {
            "hotspot_id": "HOT-TN-001",
            "geo_id": "IND_TN_DHM_HRR",
            "region_name": "Harur Block",
            "state_name": "Tamil Nadu",
            "category": "transport",
            "hotspot_level": "CRITICAL",
            "voice_intensity_score": 0.88,
            "growth_trend": "RAPIDLY_INCREASING",
            "estimated_population_impacted": 84000,
            "latitude": 12.0622,
            "longitude": 78.4975,
            "top_issue": "Evening Bus Service Gap after 7 PM",
            "total_requests": 1847,
            "status": "active"
        },
        {
            "hotspot_id": "HOT-UP-002",
            "geo_id": "IND_UP_VAR_PND",
            "region_name": "Pindra Block",
            "state_name": "Uttar Pradesh",
            "category": "roads",
            "hotspot_level": "HIGH",
            "voice_intensity_score": 0.74,
            "growth_trend": "STEADY",
            "estimated_population_impacted": 62000,
            "latitude": 25.4833,
            "longitude": 82.8500,
            "top_issue": "Hazardous road surface and unpaved arterial junctions",
            "total_requests": 942,
            "status": "active"
        }
    ]
    db.insert_records("hotspots", hotspots_data)

    # 7. Signature Feature: Pre-computed Potential Silent Need Signals
    silent_need_data = [
        {
            "signal_id": "SIG-SILENT-MH-001",
            "geo_id": "IND_MH_GDC_AHR",
            "region_name": "Aheri Tribal Block",
            "state_name": "Maharashtra",
            "category": "healthcare",
            "infra_deficit_score": 0.88,
            "voice_reporting_score": 0.04,
            "digital_access_score": 0.16,
            "population_vulnerability": 0.82,
            "discrepancy_magnitude": 0.84,
            "signal_confidence": 0.92,
            "validation_status": "POTENTIAL_SIGNAL_UNVALIDATED",
            "ai_hypothesis": "Critical emergency healthcare barrier identified across Aheri tribal river belt. Distance to nearest 24/7 PHC is 46.2 km, combined with 82% demographic vulnerability, yet only 4 citizen complaints registered due to 16% smartphone penetration. High probability of silent infrastructure distress.",
            "latitude": 19.4167,
            "longitude": 80.0000,
            "why_summary": "Disproportionate gap: 88% healthcare deficit vs 4% reporting footprint under severe 16% digital exclusion.",
            "supporting_evidence_count": 4
        },
        {
            "signal_id": "SIG-SILENT-TN-002",
            "geo_id": "IND_TN_DHM_PNG",
            "region_name": "Pennagaram Block",
            "state_name": "Tamil Nadu",
            "category": "water",
            "infra_deficit_score": 0.78,
            "voice_reporting_score": 0.08,
            "digital_access_score": 0.28,
            "population_vulnerability": 0.64,
            "discrepancy_magnitude": 0.68,
            "signal_confidence": 0.86,
            "validation_status": "POTENTIAL_SIGNAL_UNVALIDATED",
            "ai_hypothesis": "Fluoride contamination and summer drying of borewells in Pennagaram hill hamlets. High water deficit (0.78) coexists with low digital reporting (0.08) caused by rugged terrain signal shadow. Requires field validation.",
            "latitude": 12.1333,
            "longitude": 77.8833,
            "why_summary": "High drinking water deficit (78%) with minimal digital reporting due to cellular blackspot terrain.",
            "supporting_evidence_count": 3
        }
    ]
    db.insert_records("silent_need_signals", silent_need_data)

    # 8. Impact Engine: Pre/Post Intervention Telemetry
    impact_data = [
        {
            "impact_id": "IMP-UP-001",
            "project_id": "PRJ-UP-JJM-104",
            "geo_id": "IND_UP_VAR_PND",
            "baseline_date": date(2023, 10, 1),
            "evaluation_date": date(2026, 3, 31),
            "before_accessibility_pct": 0.38,
            "after_accessibility_pct": 0.82,
            "before_monthly_requests": 3410,
            "after_monthly_requests": 612,
            "measured_sentiment_delta": 0.54,
            "is_verified_by_audit": True
        }
    ]
    db.insert_records("impact_metrics", impact_data)

    logger.info("JANSETU Civic Intelligence Seed Data successfully loaded.")
