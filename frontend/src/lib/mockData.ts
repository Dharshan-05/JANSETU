import {
  IntakeResponse,
  CommandCenterKPIs,
  DemandShadowZone,
  Hotspot,
  SilentNeedSignal,
  CivicDigitalTwin,
  SimulationResult,
  ImpactMetric,
  SupportedLanguagesResponse,
  CitizenRequestStatus,
  AIPerceptionResult,
  DemandCluster,
  SimilarRequest,
  ControlledTaxonomy,
  HotspotSummary,
  DemandShadowMatrixResponse,
  DemandShadowMatrixItem,
  SilentNeedSummary,
  EvidenceResponse,
  EvidenceRecord,
  EvidenceSummary,
  ScenarioResult,
  ScenarioComparisonResponse,
  ScenarioExplanationResponse,
  ImpactEvaluation,
  ModelValidationSummary,
  IndicatorDefinition,
  LearningCandidate,
  ModelVersion,
  LearningAuditEvent,
  LearningSummary,
  ModelFamily,
  CalibrationStatus,
  LearningAction
} from '../types';

// ============================================================================
// SYSTEM & HEALTH METADATA (Phase 1)
// ============================================================================

export const MOCK_SYSTEM_INFO = {
  name: "JANSETU",
  service: "AI Civic Infrastructure Intelligence Grid",
  version: "v10.0-continuous-learning",
  status: "operational"
};

export const MOCK_HEALTH_STATUS = {
  status: "healthy"
};

export const MOCK_READINESS_STATUS = {
  status: "ready" as const,
  services: {
    bigquery: "ok" as const,
    pubsub: "ok" as const,
    storage: "ok" as const
  }
};

export const MOCK_APIV1_STATUS = {
  version: "v10.0-continuous-learning",
  status: "operational",
  phase: "Phase 10: Civic Intelligence Learning & Continuous Calibration",
  modules: [
    "Phase 1: Foundation Architecture",
    "Phase 2: Canonical Data Engineering (12 Tables)",
    "Phase 3: Multilingual Citizen Intake",
    "Phase 4: AI Perception & Vector Clustering",
    "Phase 5: Hotspots & Demand Shadow Matrix",
    "Phase 6: Potential Silent Need Gap Intelligence",
    "Phase 7: Grounded Evidence Synthesis",
    "Phase 8: Policy Sandbox & Scenario Simulation",
    "Phase 9: Closed-Loop Impact Evaluation",
    "Phase 10: Learning & Model Calibration"
  ]
};

// ============================================================================
// CANONICAL DATA FOUNDATION METADATA (Phase 2)
// ============================================================================

export const MOCK_DATA_STATUS = {
  status: "operational",
  bigquery_connected: true,
  primary_dataset: "jansetu_intel",
  analytics_dataset: "jansetu_analytics",
  canonical_tables_count: 12,
  total_records: 4862,
  table_counts: {
    geography: 240,
    demographics: 240,
    infrastructure: 240,
    investments: 180,
    citizen_requests: 1250,
    citizen_request_embeddings: 1250,
    demand_clusters: 42,
    hotspots: 18,
    silent_need_signals: 14,
    evidence_records: 56,
    policy_scenarios: 8,
    impact_metrics: 12
  }
};

export const MOCK_DATA_QUALITY = {
  status: "healthy",
  data: {
    total_records: 4862,
    table_summaries: {
      geography: { records: 240, valid_geo_ids: 240, completeness: 1.0 },
      demographics: { records: 240, valid_secc_profiles: 240, completeness: 0.98 },
      infrastructure: { records: 240, verified_baselines: 240, completeness: 0.96 },
      investments: { records: 180, verified_expenditure: 180, completeness: 0.94 },
      citizen_requests: { records: 1250, scrubbed_pii: 1250, completeness: 1.0 },
      citizen_request_embeddings: { records: 1250, vector_dim: 768, completeness: 1.0 }
    },
    geographic_hierarchy_valid: true,
    missing_geo_references: 0,
    provenance_sources: [
      "Census of India 2011",
      "Socio-Economic and Caste Census (SECC) 2011",
      "Pradhan Mantri Gram Sadak Yojana (PMGSY) 2024",
      "Jal Jeevan Mission (JJM) Integrated MIS 2024",
      "Health Management Information System (HMIS) 2024",
      "Telecom Regulatory Authority of India (TRAI) 2024"
    ],
    status: "VERIFIED_ACCURATE",
    timestamp: new Date().toISOString()
  }
};

export const MOCK_GEOGRAPHY_NODES: Record<string, any> = {
  "IND_TN_DHM_HRR": {
    record: {
      geo_id: "IND_TN_DHM_HRR",
      name: "Harur",
      local_name: "அரூர்",
      geo_level: "BLOCK",
      parent_geo_id: "IND_TN_DHM",
      state_code: "TN",
      latitude: 12.0622,
      longitude: 78.4984,
      area_sq_km: 432.8
    },
    hierarchy_path: [
      { geo_id: "IND", name: "Republic of India", level: "COUNTRY" },
      { geo_id: "IND_TN", name: "Tamil Nadu", level: "STATE" },
      { geo_id: "IND_TN_DHM", name: "Dharmapuri", level: "DISTRICT" },
      { geo_id: "IND_TN_DHM_HRR", name: "Harur", level: "BLOCK" }
    ],
    subdivisions_count: 34,
    subdivisions: [
      { geo_id: "IND_TN_DHM_HRR_V01", name: "Doddampatti", level: "VILLAGE", population: 4210 },
      { geo_id: "IND_TN_DHM_HRR_V02", name: "Ellapudaiyampatti", level: "VILLAGE", population: 3180 },
      { geo_id: "IND_TN_DHM_HRR_V03", name: "Kombur", level: "VILLAGE", population: 2890 },
      { geo_id: "IND_TN_DHM_HRR_V04", name: "Theerthamalai", level: "VILLAGE", population: 5120 }
    ]
  },
  "IND_MH_PLG_JHW": {
    record: {
      geo_id: "IND_MH_PLG_JHW",
      name: "Jawhar",
      local_name: "जव्हार",
      geo_level: "BLOCK",
      parent_geo_id: "IND_MH_PLG",
      state_code: "MH",
      latitude: 19.9167,
      longitude: 73.2333,
      area_sq_km: 512.4
    },
    hierarchy_path: [
      { geo_id: "IND", name: "Republic of India", level: "COUNTRY" },
      { geo_id: "IND_MH", name: "Maharashtra", level: "STATE" },
      { geo_id: "IND_MH_PLG", name: "Palghar", level: "DISTRICT" },
      { geo_id: "IND_MH_PLG_JHW", name: "Jawhar", level: "BLOCK" }
    ],
    subdivisions_count: 28,
    subdivisions: [
      { geo_id: "IND_MH_PLG_JHW_V01", name: "Khadkhed", level: "VILLAGE", population: 2150 },
      { geo_id: "IND_MH_PLG_JHW_V02", name: "Nyhale", level: "VILLAGE", population: 3410 }
    ]
  }
};

// ============================================================================
// CITIZEN INTAKE & MULTILINGUAL METADATA (Phase 3)
// ============================================================================

export const MOCK_SUPPORTED_LANGUAGES: SupportedLanguagesResponse = {
  success: true,
  languages: [
    { code: "hi", name: "Hindi", native_name: "हिन्दी", script: "Devanagari", sample_phrase: "हमारे गाँव में पीने के पानी की समस्या है।", chirp_supported: true, translation_supported: true },
    { code: "ta", name: "Tamil", native_name: "தமிழ்", script: "Tamil", sample_phrase: "எங்கள் கிராமத்தில் குடிநீர் குழாய் உடைந்ததால் தண்ணீர் வரவில்லை.", chirp_supported: true, translation_supported: true },
    { code: "te", name: "Telugu", native_name: "తెలుగు", script: "Telugu", sample_phrase: "మా గ్రామంలో తాగునీటి సరఫరా నిలిచిపోయింది.", chirp_supported: true, translation_supported: true },
    { code: "kn", name: "Kannada", native_name: "ಕನ್ನಡ", script: "Kannada", sample_phrase: "ನಮ್ಮ ಊರಿನಲ್ಲಿ ರಸ್ತೆ ದುರಸ್ತಿ ಆಗಬೇಕಾಗಿದೆ.", chirp_supported: true, translation_supported: true },
    { code: "mr", name: "Marathi", native_name: "मराठी", script: "Devanagari", sample_phrase: "गावातील प्राथमिक आरोग्य केंद्रात डॉक्टर उपलब्ध नाहीत.", chirp_supported: true, translation_supported: true },
    { code: "bn", name: "Bengali", native_name: "বাংলা", script: "Bengali", sample_phrase: "আমাদের গ্রামে প্রাথমিক বিদ্যালয়ে পানীয় জলের ব্যবস্থা নেই।", chirp_supported: true, translation_supported: true },
    { code: "en", name: "English", native_name: "English", script: "Latin", sample_phrase: "Drinking water supply has been disrupted for two weeks.", chirp_supported: true, translation_supported: true }
  ],
  supported_codes: ["hi", "ta", "te", "kn", "mr", "bn", "en"],
  default_language: "ta"
};

export const MOCK_CITIZEN_REQUESTS: CitizenRequestStatus[] = [
  {
    request_id: "REQ-TEXT-001",
    status: "PROCESSED",
    channel: "web_portal",
    language: "ta",
    original_transcript: "அரூர் தாலுகா தீர்த்தமலை கிராமத்தில் குடிநீர் குழாயில் கடந்த மூன்று வாரங்களாக தண்ணீர் வரவில்லை. பெண்கள் 2 கிமீ நடந்து தண்ணீர் எடுக்க வேண்டியுள்ளது.",
    normalized_text: "In Theerthamalai village of Harur taluka, drinking water pipes have had no water supply for the past three weeks. Women have to walk 2 km to fetch potable water.",
    geo_id: "IND_TN_DHM_HRR",
    created_at: "2026-09-28T10:14:22Z",
    translation_status: "COMPLETED",
    transcription_status: "COMPLETED"
  },
  {
    request_id: "REQ-TEXT-002",
    status: "PROCESSED",
    channel: "voice_web",
    language: "hi",
    original_transcript: "सोनभद्र जिले के दुद्धी ब्लॉक में प्राथमिक स्वास्थ्य केंद्र में डॉक्टर पिछले दो महीने से उपस्थित नहीं हैं। दवाइयां भी समाप्त हैं।",
    normalized_text: "In Duddhi block of Sonbhadra district, the primary health center has had no doctor for the past two months. Essential medicines are also out of stock.",
    geo_id: "IND_UP_SBR_DUD",
    created_at: "2026-09-29T14:20:11Z",
    translation_status: "COMPLETED",
    transcription_status: "COMPLETED"
  }
];

// ============================================================================
// AI PERCEPTION & CLUSTERING METADATA (Phase 4)
// ============================================================================

export const MOCK_CONTROLLED_TAXONOMY: ControlledTaxonomy = {
  categories: ["water", "healthcare", "roads", "electricity", "sanitation", "education", "transport"],
  subcategories: {
    "water": ["pipeline_breakdown", "borewell_failure", "fluoride_contamination", "tanker_delay"],
    "healthcare": ["doctor_shortage", "medicine_stockout", "subcenter_closure", "ambulance_delay"],
    "roads": ["monsoon_washout", "pothole_cluster", "culvert_breach", "unpaved_track"],
    "electricity": ["transformer_burnout", "low_voltage", "irregular_supply", "broken_pole"],
    "sanitation": ["drain_blockage", "toilet_disrepair", "waste_dumping"],
    "education": ["classroom_damage", "toilet_lack", "drinking_water_gap"],
    "transport": ["bus_route_cancellation", "overcrowding", "terminal_gap"]
  },
  allowed_cohorts: ["rural_women", "scheduled_tribes", "farmers", "elderly", "schoolchildren", "daily_wage_laborers"]
};

export const MOCK_DEMAND_CLUSTERS: DemandCluster[] = [
  {
    cluster_id: "CLS-WATER-001",
    geo_id: "IND_TN_DHM_HRR",
    category: "water",
    subcategory: "pipeline_breakdown",
    title: "Groundwater Depletion & Pipeline Fractures in Harur Taluka",
    representative_issue: "Persistent drinking water unavailability across 14 hamlets in Harur block triggered by summer aquifer drawdown and fractured gravity mains from Theerthamalai ridge.",
    request_count: 68,
    severity_score: 0.88,
    urgency_score: 0.84,
    affected_cohorts: ["rural_women", "scheduled_tribes"],
    request_ids: ["REQ-TEXT-001", "REQ-TEXT-003"],
    status: "ACTIVE",
    first_reported_at: "2026-09-15T08:00:00Z",
    last_updated_at: "2026-09-28T10:14:22Z"
  },
  {
    cluster_id: "CLS-ROAD-002",
    geo_id: "IND_MH_PLG_JHW",
    category: "roads",
    subcategory: "culvert_breach",
    title: "Monsoon Cutoff on PMGSY Hill Tracks in Jawhar Taluka",
    representative_issue: "Severe culvert washouts on forest road connections leaving 4 tribal hamlets isolated from maternal health facilities during rain spells.",
    request_count: 42,
    severity_score: 0.79,
    urgency_score: 0.82,
    affected_cohorts: ["scheduled_tribes", "elderly"],
    request_ids: ["REQ-VOICE-001"],
    status: "ACTIVE",
    first_reported_at: "2026-09-18T11:30:00Z",
    last_updated_at: "2026-09-26T16:00:00Z"
  }
];

export const MOCK_SIMILAR_REQUESTS: SimilarRequest[] = [
  {
    request_id: "REQ-TEXT-001",
    geo_id: "IND_TN_DHM_HRR",
    category: "water",
    original_text: "அரூர் தாலுகா தீர்த்தமலை கிராமத்தில் குடிநீர் குழாயில் கடந்த மூன்று வாரங்களாக தண்ணீர் வரவில்லை.",
    similarity_score: 0.94
  },
  {
    request_id: "REQ-TEXT-003",
    geo_id: "IND_TN_KVP",
    category: "water",
    original_text: "காவேரிப்பட்டினம் அருகே குடிநீர் குழாய் உடைந்து ஒரு வாரமாக தெருவில் வீணாகிறது.",
    similarity_score: 0.87
  }
];

// ============================================================================
// COMMAND CENTER & GEOGRAPHIC KPIS (Phase 5)
// ============================================================================

export const MOCK_COMMAND_CENTER_KPIS: CommandCenterKPIs = {
  total_citizen_requests: 1250,
  active_demand_hotspots: 18,
  emerging_signals_count: 7,
  potential_silent_need_signals: 14,
  states_covered: 8,
  districts_monitored: 36,
  public_projects_tracked: 42,
  average_gap_reduction_pct: 32.4,
  category_distribution: {
    "water": 482,
    "roads": 298,
    "healthcare": 215,
    "electricity": 142,
    "sanitation": 64,
    "education": 49
  },
  language_breakdown: {
    "ta": 412,
    "hi": 365,
    "mr": 218,
    "or": 124,
    "te": 76,
    "en": 55
  },
  top_critical_districts: [
    {
      geo_id: "IND_TN_DHM",
      name: "Dharmapuri",
      state: "Tamil Nadu",
      category: "water",
      voice_intensity: 0.88,
      total_requests: 312
    },
    {
      geo_id: "IND_MH_PLG",
      name: "Palghar",
      state: "Maharashtra",
      category: "healthcare",
      voice_intensity: 0.79,
      total_requests: 198
    },
    {
      geo_id: "IND_OD_KLH",
      name: "Kalahandi",
      state: "Odisha",
      category: "roads",
      voice_intensity: 0.74,
      total_requests: 164
    },
    {
      geo_id: "IND_UP_SBR",
      name: "Sonbhadra",
      state: "Uttar Pradesh",
      category: "healthcare",
      voice_intensity: 0.71,
      total_requests: 152
    }
  ],
  data_policy_notice: "AI Civic Infrastructure Intelligence Grid • Public Sector Administrative Signal Only"
};

// ============================================================================
// DEMAND HOTSPOTS (Phase 5)
// ============================================================================

export const MOCK_HOTSPOTS: Hotspot[] = [
  {
    hotspot_id: "HOT-IND-TN-DHM-01",
    geo_id: "IND_TN_DHM_HRR",
    region_name: "Harur Block",
    state_name: "Tamil Nadu",
    category: "water",
    hotspot_level: "CRITICAL",
    voice_intensity_score: 0.88,
    growth_trend: "+34% over 14 days",
    estimated_population_impacted: 48500,
    latitude: 12.0622,
    longitude: 78.4984,
    top_issue: "Chronic piped drinking water deficit across 14 rural revenue villages",
    total_requests: 68,
    status: "ACTIVE",
    hotspot_score: 0.84,
    velocity_score: 0.81,
    concentration_ratio: 0.76,
    confidence_score: 0.94,
    explanation: {
      voice_intensity: 0.88,
      requests_per_1000: 1.40,
      population_exposure: 48500,
      demand_velocity_pct: 34.0,
      trend_direction: "RISING",
      category_concentration_ratio: 0.76,
      weights: {
        voice_intensity: 0.40,
        population_exposure: 0.25,
        demand_velocity: 0.35,
        category_concentration: 0.25
      },
      summary: "Voice intensity of 0.88 reflects persistent demand cluster in Harur with 34% 14-day growth."
    },
    analytical_version: "v5.0-deterministic",
    disclaimer: "AI-Derived Analytical Signal — Not Official Policy"
  },
  {
    hotspot_id: "HOT-IND-MH-PLG-01",
    geo_id: "IND_MH_PLG_JHW",
    region_name: "Jawhar Block",
    state_name: "Maharashtra",
    category: "healthcare",
    hotspot_level: "HIGH",
    voice_intensity_score: 0.79,
    growth_trend: "+21% over 14 days",
    estimated_population_impacted: 32000,
    latitude: 19.9167,
    longitude: 73.2333,
    top_issue: "Lack of 24x7 doctor coverage at primary health centers and maternal clinics",
    total_requests: 42,
    status: "ACTIVE",
    hotspot_score: 0.77,
    velocity_score: 0.74,
    concentration_ratio: 0.71,
    confidence_score: 0.91,
    explanation: {
      voice_intensity: 0.79,
      requests_per_1000: 1.31,
      population_exposure: 32000,
      demand_velocity_pct: 21.0,
      trend_direction: "RISING",
      category_concentration_ratio: 0.71,
      weights: {
        voice_intensity: 0.40,
        population_exposure: 0.25,
        demand_velocity: 0.35,
        category_concentration: 0.25
      },
      summary: "High concentration of healthcare grievances centered on PHC doctor shortages."
    },
    analytical_version: "v5.0-deterministic",
    disclaimer: "AI-Derived Analytical Signal — Not Official Policy"
  }
];

export const MOCK_HOTSPOTS_SUMMARY: HotspotSummary = {
  total_citizen_requests: 1250,
  active_demand_hotspots: 18,
  critical_hotspots_count: 5,
  high_hotspots_count: 9,
  moderate_hotspots_count: 4,
  increasing_demand_areas: 6,
  states_covered: 8,
  districts_monitored: 36,
  total_population_exposure: 342000,
  category_distribution: {
    "water": 7,
    "healthcare": 5,
    "roads": 4,
    "electricity": 2
  },
  calculation_version: "v5.0-deterministic",
  disclaimer: "AI-Derived Analytical Signal — Not Official Policy",
  generated_at: new Date().toISOString()
};

// ============================================================================
// DEMAND SHADOW MATRIX (Phase 5)
// ============================================================================

export const MOCK_DEMAND_SHADOW_ZONES: DemandShadowZone[] = [
  {
    geo_id: "IND_TN_DHM_HRR",
    name: "Harur Block",
    state: "TN",
    latitude: 12.0622,
    longitude: 78.4984,
    population: 142500,
    digital_connectivity: 0.42,
    layer_a_voice_density: 0.88,
    layer_b_infra_need: 0.74,
    discrepancy: -0.14,
    quadrant: "CONFIRMED_DEMAND_HOTSPOT",
    marker_color: "#EF4444",
    total_requests: 68
  },
  {
    geo_id: "IND_TN_DHM_PNG",
    name: "Pennagaram Block",
    state: "TN",
    latitude: 12.1333,
    longitude: 77.9000,
    population: 86400,
    digital_connectivity: 0.22,
    layer_a_voice_density: 0.14,
    layer_b_infra_need: 0.81,
    discrepancy: 0.67,
    quadrant: "POTENTIAL_SILENT_NEED",
    marker_color: "#F59E0B",
    total_requests: 8
  },
  {
    geo_id: "IND_MH_PLG_JHW",
    name: "Jawhar Block",
    state: "MH",
    latitude: 19.9167,
    longitude: 73.2333,
    population: 64200,
    digital_connectivity: 0.18,
    layer_a_voice_density: 0.09,
    layer_b_infra_need: 0.86,
    discrepancy: 0.77,
    quadrant: "POTENTIAL_SILENT_NEED",
    marker_color: "#F59E0B",
    total_requests: 5
  },
  {
    geo_id: "IND_UP_VAR_PND",
    name: "Pindra Block",
    state: "UP",
    latitude: 25.4800,
    longitude: 82.8500,
    population: 184000,
    digital_connectivity: 0.88,
    layer_a_voice_density: 0.62,
    layer_b_infra_need: 0.28,
    discrepancy: -0.34,
    quadrant: "STABILIZED_BASELINE",
    marker_color: "#10B981",
    total_requests: 94
  }
];

export const MOCK_DEMAND_SHADOW_ITEMS: DemandShadowMatrixItem[] = [
  {
    geo_id: "IND_TN_DHM_HRR",
    region_name: "Harur Block",
    state_code: "TN",
    geo_level: "BLOCK",
    latitude: 12.0622,
    longitude: 78.4984,
    population: 142500,
    digital_access_score: 0.42,
    voice_intensity: 0.88,
    infrastructure_need: 0.74,
    discrepancy_magnitude: 0.14,
    raw_request_count: 68,
    quadrant: "HIGH_VOICE_HIGH_NEED",
    quadrant_label: "Confirmed Demand Hotspot",
    quadrant_description: "Both expressed citizen demand and audited infrastructure deficit are high.",
    action_guidance: "Priority intervention recommended; community alignment is established.",
    status_color: "#EF4444",
    category: "water",
    time_window_days: 14,
    analytical_version: "v5.0-deterministic",
    disclaimer: "AI-Derived Analytical Signal — Not Official Policy"
  },
  {
    geo_id: "IND_TN_DHM_PNG",
    region_name: "Pennagaram Block",
    state_code: "TN",
    geo_level: "BLOCK",
    latitude: 12.1333,
    longitude: 77.9000,
    population: 86400,
    digital_access_score: 0.22,
    voice_intensity: 0.14,
    infrastructure_need: 0.81,
    discrepancy_magnitude: 0.67,
    raw_request_count: 8,
    quadrant: "LOW_VOICE_HIGH_NEED",
    quadrant_label: "Potential Silent Need (Demand Shadow)",
    quadrant_description: "High infrastructure deficit coexists with low expressed voice due to digital barriers.",
    action_guidance: "Proactive field investigation recommended.",
    status_color: "#F59E0B",
    category: "water",
    time_window_days: 14,
    analytical_version: "v5.0-deterministic",
    disclaimer: "Potential Silent Need Signal — requires administrative field validation."
  },
  {
    geo_id: "IND_MH_PLG_JHW",
    region_name: "Jawhar Block",
    state_code: "MH",
    geo_level: "BLOCK",
    latitude: 19.9167,
    longitude: 73.2333,
    population: 64200,
    digital_access_score: 0.18,
    voice_intensity: 0.09,
    infrastructure_need: 0.86,
    discrepancy_magnitude: 0.77,
    raw_request_count: 5,
    quadrant: "LOW_VOICE_HIGH_NEED",
    quadrant_label: "Potential Silent Need (Demand Shadow)",
    quadrant_description: "Elevated maternal health infrastructure deficit with depressed reporting.",
    action_guidance: "Administrative field validation recommended.",
    status_color: "#F59E0B",
    category: "healthcare",
    time_window_days: 14,
    analytical_version: "v5.0-deterministic",
    disclaimer: "Potential Silent Need Signal — requires administrative field validation."
  },
  {
    geo_id: "IND_UP_VAR_PND",
    region_name: "Pindra Block",
    state_code: "UP",
    geo_level: "BLOCK",
    latitude: 25.4800,
    longitude: 82.8500,
    population: 184000,
    digital_access_score: 0.88,
    voice_intensity: 0.62,
    infrastructure_need: 0.28,
    discrepancy_magnitude: 0.34,
    raw_request_count: 94,
    quadrant: "HIGH_VOICE_LOW_NEED",
    quadrant_label: "Baseline Monitored Zone",
    quadrant_description: "High digital voice density with moderate/low infrastructure deficit.",
    action_guidance: "Routine operational redressal.",
    status_color: "#10B981",
    category: "water",
    time_window_days: 14,
    analytical_version: "v5.0-deterministic",
    disclaimer: "AI-Derived Analytical Signal — Not Official Policy"
  }
];

export const MOCK_DEMAND_SHADOW_MATRIX: DemandShadowMatrixResponse = {
  matrix: MOCK_DEMAND_SHADOW_ITEMS,
  summary: {
    total_geographies_analyzed: 24,
    quadrant_counts: {
      "HIGH_VOICE_HIGH_NEED": 6,
      "LOW_VOICE_HIGH_NEED": 9,
      "HIGH_VOICE_LOW_NEED": 4,
      "LOW_VOICE_LOW_NEED": 5
    },
    average_voice_intensity: 0.43,
    average_need_deficit: 0.61,
    voice_threshold: 0.35,
    need_threshold: 0.50,
    filter_category: "ALL",
    filter_state: "ALL",
    time_window_days: 14,
    analytical_version: "v5.0-deterministic",
    disclaimer: "AI-Derived Analytical Signal — Not Official Policy",
    generated_at: new Date().toISOString()
  },
  disclaimer: "AI-Derived Analytical Signal — Not Official Policy"
};

// ============================================================================
// POTENTIAL SILENT NEED DETECTION (Phase 6)
// ============================================================================

export const MOCK_SILENT_NEED_SIGNALS: SilentNeedSignal[] = [
  {
    signal_id: "SIG-IND-TN-DHM-001",
    geo_id: "IND_TN_DHM_PNG",
    region_name: "Pennagaram Block",
    state_name: "Tamil Nadu",
    category: "water",
    infra_deficit_score: 0.81,
    voice_reporting_score: 0.14,
    digital_access_score: 0.22,
    population_vulnerability: 0.74,
    discrepancy_magnitude: 0.67,
    signal_confidence: 0.94,
    validation_status: "UNVALIDATED",
    latitude: 12.1333,
    longitude: 77.9000,
    why_summary: "High tap water deficit (65.8% unserved) coupled with high tribal deprivation (74% SECC score), yet expressed complaints are suppressed due to 22% cellular reach.",
    supporting_evidence_count: 4,
    infra_deficit: 0.81,
    vulnerability_score: 0.74,
    digital_access: 0.22,
    voice_density: 0.14,
    need_score: 0.78,
    discrepancy: 0.67,
    signal_strength: 0.82,
    signal_class: "STRONG_POTENTIAL",
    triggered: true,
    trigger_reason: "Discrepancy (0.67 >= 0.35), Infra Deficit (0.81 >= 0.50), Digital Access (0.22 <= 0.40)",
    population: 86400,
    request_count: 8,
    infrastructure_indicator_count: 3,
    explanation: {
      summary: "This region exhibits an acute disparity between physical reality and expressed digital voice: Jal Jeevan Mission records confirm tap water coverage is limited to 34.2%, while SECC vulnerability stands at 74%. However, expressed grievances remain suppressed due to poor 22% telecom penetration.",
      drivers: [
        { factor: "Infrastructure Deficit", value: 0.81, contribution: "PRIMARY", evidence_type: "GOVERNMENT_AUDIT" },
        { factor: "Socioeconomic Vulnerability", value: 0.74, contribution: "SECONDARY", evidence_type: "CENSUS_SECC" },
        { factor: "Digital Exclusion", value: 0.22, contribution: "CORROBORATING", evidence_type: "TRAI_TELECOM" },
        { factor: "Citizen Voice Density", value: 0.14, contribution: "COUNTER_EVIDENCE", evidence_type: "JANSETU_AGGREGATOR" }
      ],
      triggers_met: {
        discrepancy_ge_threshold: true,
        infra_deficit_ge_threshold: true,
        digital_access_le_threshold: true
      },
      disclaimer: "Potential Silent Need Signal — requires administrative field validation.",
      validation_requirement: "Mandatory in-person field audit required before policy consideration."
    },
    investment_context: {
      existing_investment_count: 1,
      existing_allocated_budget_inr: 12000000,
      active_project_count: 1,
      completed_project_count: 0
    },
    analytical_version: "v6.0-deterministic",
    generated_at: "2026-09-28T09:00:00Z",
    requires_field_validation: true,
    disclaimer: "AI-Derived Analytical Signal — Not Official Policy",
    validation_requirement: "Potential Silent Need Signal — requires administrative field validation."
  },
  {
    signal_id: "SIG-IND-MH-PLG-002",
    geo_id: "IND_MH_PLG_JHW",
    region_name: "Jawhar Block",
    state_name: "Maharashtra",
    category: "healthcare",
    infra_deficit_score: 0.86,
    voice_reporting_score: 0.09,
    digital_access_score: 0.18,
    population_vulnerability: 0.82,
    discrepancy_magnitude: 0.77,
    signal_confidence: 0.96,
    validation_status: "UNVALIDATED",
    latitude: 19.9167,
    longitude: 73.2333,
    why_summary: "Sub-center maternal care coverage is severely deficient with average hospital distance of 28 km, but cellular connectivity below 18% prevents digital complaint lodgement.",
    supporting_evidence_count: 4,
    infra_deficit: 0.86,
    vulnerability_score: 0.82,
    digital_access: 0.18,
    voice_density: 0.09,
    need_score: 0.85,
    discrepancy: 0.77,
    signal_strength: 0.89,
    signal_class: "STRONG_POTENTIAL",
    triggered: true,
    trigger_reason: "Discrepancy (0.77 >= 0.35), Infra Deficit (0.86 >= 0.50), Digital Access (0.18 <= 0.40)",
    population: 64200,
    request_count: 5,
    infrastructure_indicator_count: 2,
    explanation: {
      summary: "Severe rural health center deficits and tribal deprivation coexist with negligible online complaint traffic due to terrain shadowing and lack of mobile coverage.",
      drivers: [
        { factor: "Infrastructure Deficit", value: 0.86, contribution: "PRIMARY", evidence_type: "GOVERNMENT_AUDIT" },
        { factor: "Socioeconomic Vulnerability", value: 0.82, contribution: "SECONDARY", evidence_type: "CENSUS_SECC" },
        { factor: "Digital Exclusion", value: 0.18, contribution: "CORROBORATING", evidence_type: "TRAI_TELECOM" },
        { factor: "Citizen Voice Density", value: 0.09, contribution: "COUNTER_EVIDENCE", evidence_type: "JANSETU_AGGREGATOR" }
      ],
      triggers_met: {
        discrepancy_ge_threshold: true,
        infra_deficit_ge_threshold: true,
        digital_access_le_threshold: true
      },
      disclaimer: "Potential Silent Need Signal — requires administrative field validation.",
      validation_requirement: "Mandatory in-person field audit required before policy consideration."
    },
    investment_context: {
      existing_investment_count: 1,
      existing_allocated_budget_inr: 8500000,
      active_project_count: 0,
      completed_project_count: 0
    },
    analytical_version: "v6.0-deterministic",
    generated_at: "2026-09-27T10:30:00Z",
    requires_field_validation: true,
    disclaimer: "AI-Derived Analytical Signal — Not Official Policy",
    validation_requirement: "Potential Silent Need Signal — requires administrative field validation."
  }
];

export const MOCK_SILENT_NEED_SUMMARY: SilentNeedSummary = {
  total_geographies_analyzed: 24,
  total_signals: 14,
  potential_signals: 9,
  strong_potential_signals: 5,
  categories: {
    "water": 6,
    "healthcare": 4,
    "roads": 3,
    "electricity": 1
  },
  states: {
    "TN": 5,
    "MH": 4,
    "UP": 3,
    "KA": 2
  },
  analytical_version: "v6.0-deterministic",
  disclaimer: "Potential Silent Need Signal — requires administrative field validation."
};

// ============================================================================
// CIVIC DIGITAL TWIN (Phase 6/7)
// ============================================================================

export const MOCK_CIVIC_DIGITAL_TWIN: CivicDigitalTwin = {
  geo_id: "IND_TN_DHM_HRR",
  admin_name: "Harur Block",
  admin_level: 3,
  state_name: "Tamil Nadu",
  district_name: "Dharmapuri",
  latitude: 12.0622,
  longitude: 78.4984,
  population_metrics: {
    total_population: 142500,
    vulnerability_percentage: 74.0,
    elderly_percentage: 12.5,
    literacy_rate: 62.4,
    digital_penetration_index: 0.42,
    primary_livelihood: "Rainfed Agriculture & Sericulture"
  },
  civic_health_radar: {
    transport_access: 58.6,
    water_security: 34.2,
    healthcare_proximity: 48.0,
    education_quality: 51.0,
    power_reliability: 62.0,
    sanitation_index: 44.0
  },
  intelligence_summary: {
    population_exposure: "HIGH",
    citizen_demand_level: "HIGH",
    infrastructure_gap: "HIGH",
    digital_access: "LOW",
    investment_coverage: "MODERATE",
    emerging_signal: "WATER_DEFICIT",
    potential_silent_need_zones: 3
  },
  active_clusters: [
    {
      cluster_id: "CLS-WATER-001",
      category: "water",
      title: "Groundwater Depletion & Pipeline Fractures in Harur Taluka",
      request_count: 68,
      severity_score: 0.88,
      status: "ACTIVE"
    },
    {
      cluster_id: "CLS-ROAD-002",
      category: "roads",
      title: "Monsoon Cutoff on PMGSY Hill Tracks in Jawhar Taluka",
      request_count: 42,
      severity_score: 0.79,
      status: "ACTIVE"
    }
  ],
  silent_need_count: 3,
  active_public_projects_count: 5,
  allocated_capex_inr: 124000000,
  last_computed_at: new Date().toISOString()
};

// ============================================================================
// GROUNDED EVIDENCE ENGINE (Phase 7)
// ============================================================================

export const MOCK_EVIDENCE_RECORDS: EvidenceRecord[] = [
  {
    evidence_id: "EV-5127A0-INF-01",
    signal_id: "SIG-IND-TN-DHM-001",
    geo_id: "IND_TN_DHM_PNG",
    category: "water",
    source: "Jal Jeevan Mission Integrated MIS",
    source_type: "OFFICIAL_GOVERNMENT",
    source_tier: 1,
    source_date: "2024-03-31",
    indicator_name: "Tap Water Household Connection Deficit",
    claim: "Official JJM MIS records indicate 65.8% of households lack functional household tap connections.",
    evidence_value: "34.2% tap coverage (65.8% deficit)",
    unit: "%",
    dataset_id: "DS-GOV-JJM-2024",
    provenance_status: "VERIFIED",
    is_official: true,
    is_synthetic: false,
    retrieval_timestamp: "2026-09-30T10:00:00Z",
    freshness: "RECENT"
  },
  {
    evidence_id: "EV-5127A0-VUL-01",
    signal_id: "SIG-IND-TN-DHM-001",
    geo_id: "IND_TN_DHM_PNG",
    category: "water",
    source: "Socio-Economic and Caste Census (SECC)",
    source_type: "OFFICIAL_GOVERNMENT",
    source_tier: 1,
    source_date: "2011",
    indicator_name: "Multidimensional Deprivation Index",
    claim: "High socioeconomic vulnerability is verified by SECC records documenting 74% household deprivation.",
    evidence_value: "74.0% households in D1-D7 deprivation",
    unit: "%",
    dataset_id: "DS-GOV-SECC-2011",
    provenance_status: "VERIFIED",
    is_official: true,
    is_synthetic: false,
    retrieval_timestamp: "2026-09-30T10:00:00Z",
    freshness: "HISTORICAL"
  },
  {
    evidence_id: "EV-5127A0-VOX-01",
    signal_id: "SIG-IND-TN-DHM-001",
    geo_id: "IND_TN_DHM_PNG",
    category: "water",
    source: "JANSETU Grievance Aggregator",
    source_type: "JANSETU_ANALYTICAL",
    source_tier: 3,
    source_date: "2026-09-28",
    indicator_name: "Expressed Grievance Rate per 1,000 residents",
    claim: "Only 8 citizen requests recorded across 90 days (0.14 per 1,000 residents).",
    evidence_value: "0.14 complaints / 1,000",
    unit: "complaints/1k",
    dataset_id: "DS-JANSETU-VOX-Q3",
    provenance_status: "ANALYTICAL",
    is_official: false,
    is_synthetic: false,
    retrieval_timestamp: "2026-09-30T10:00:00Z",
    freshness: "CURRENT"
  },
  {
    evidence_id: "EV-5127A0-DIG-01",
    signal_id: "SIG-IND-TN-DHM-001",
    geo_id: "IND_TN_DHM_PNG",
    category: "water",
    source: "Telecom Regulatory Authority of India (TRAI)",
    source_type: "OFFICIAL_INSTITUTION",
    source_tier: 2,
    source_date: "2024-06-30",
    indicator_name: "Wireless Telephony Subscription Density",
    claim: "Low expressed complaint density is directly corroborated by low TRAI cellular penetration of 22%.",
    evidence_value: "22.4 active SIM connections per 100 residents",
    unit: "SIMs/100",
    dataset_id: "DS-TRAI-RUR-2024",
    provenance_status: "VERIFIED",
    is_official: true,
    is_synthetic: false,
    retrieval_timestamp: "2026-09-30T10:00:00Z",
    freshness: "RECENT"
  }
];

export const MOCK_EVIDENCE_BRIEF: EvidenceResponse = {
  signal_id: "SIG-IND-TN-DHM-001",
  geo_id: "IND_TN_DHM_PNG",
  category: "water",
  signal: {
    region_name: "Pennagaram Block",
    state_code: "TN",
    discrepancy: 0.67,
    need_score: 0.78,
    voice_density: 0.14,
    infra_deficit: 0.81,
    digital_access: 0.22,
    vulnerability_score: 0.74,
    signal_class: "STRONG_POTENTIAL"
  },
  drivers: [
    {
      driver_key: "infra_deficit",
      name: "Infrastructure Deficit",
      value: 0.81,
      formatted_value: "65.8% deficit (34.2% tap coverage)",
      source: "Jal Jeevan Mission 2024",
      source_date: "2024-03-31",
      evidence_id: "EV-5127A0-INF-01",
      claim_type: "OBSERVED",
      status: "VERIFIED",
      description: "Official JJM MIS records verify 65.8% tap water unserved rate."
    },
    {
      driver_key: "vulnerability",
      name: "Socioeconomic Vulnerability",
      value: 0.74,
      formatted_value: "74.0% deprivation index",
      source: "Census / SECC 2011",
      source_date: "2011",
      evidence_id: "EV-5127A0-VUL-01",
      claim_type: "OBSERVED",
      status: "VERIFIED",
      description: "SECC data confirms 74% multi-dimensional deprivation and high ST density."
    },
    {
      driver_key: "citizen_voice",
      name: "Citizen Voice Density",
      value: 0.14,
      formatted_value: "0.14 requests / 1k residents (8 total)",
      source: "JANSETU Analytical Layer",
      source_date: "2026-09-28",
      evidence_id: "EV-5127A0-VOX-01",
      claim_type: "ANALYTICAL",
      status: "ANALYTICAL",
      description: "Only 8 citizen requests recorded across 90 days."
    },
    {
      driver_key: "digital_access",
      name: "Digital Connectivity",
      value: 0.22,
      formatted_value: "22.4 active SIMs / 100 residents",
      source: "TRAI Telecom Report 2024",
      source_date: "2024-06-30",
      evidence_id: "EV-5127A0-DIG-01",
      claim_type: "OBSERVED",
      status: "VERIFIED",
      description: "TRAI telecom registry confirms cellular penetration is restricted to 22%."
    }
  ],
  evidence: MOCK_EVIDENCE_RECORDS,
  claims: [
    {
      claim_id: "CLM-001",
      text: "Official JJM MIS records indicate 65.8% of households lack functional household tap connections.",
      claim_type: "OBSERVED",
      evidence_ids: ["EV-5127A0-INF-01"],
      validation_status: "VALIDATED"
    },
    {
      claim_id: "CLM-002",
      text: "High socioeconomic vulnerability is verified by SECC records documenting 74% household deprivation.",
      claim_type: "OBSERVED",
      evidence_ids: ["EV-5127A0-VUL-01"],
      validation_status: "VALIDATED"
    },
    {
      claim_id: "CLM-003",
      text: "Low expressed complaint density is directly corroborated by low TRAI cellular penetration of 22%.",
      claim_type: "ANALYTICAL",
      evidence_ids: ["EV-5127A0-VOX-01", "EV-5127A0-DIG-01"],
      validation_status: "VALIDATED"
    }
  ],
  evidence_coverage: 1.0,
  evidence_quality: "COMPLETE",
  coverage_details: {
    "infra_deficit": "SUPPORTED (EV-5127A0-INF-01)",
    "vulnerability": "SUPPORTED (EV-5127A0-VUL-01)",
    "citizen_voice": "SUPPORTED (EV-5127A0-VOX-01)",
    "digital_access": "SUPPORTED (EV-5127A0-DIG-01)"
  },
  sources: [
    {
      source_name: "Jal Jeevan Mission Integrated MIS",
      dataset_id: "DS-GOV-JJM-2024",
      source_type: "OFFICIAL_GOVERNMENT",
      source_tier: 1,
      source_date: "2024-03-31",
      geographic_level: "BLOCK",
      provenance_status: "VERIFIED",
      is_synthetic: false
    },
    {
      source_name: "Socio-Economic and Caste Census (SECC)",
      dataset_id: "DS-GOV-SECC-2011",
      source_type: "OFFICIAL_GOVERNMENT",
      source_tier: 1,
      source_date: "2011",
      geographic_level: "VILLAGE",
      provenance_status: "VERIFIED",
      is_synthetic: false
    }
  ],
  limitations: [
    "Block-level wireless data is inferred from district-level TRAI telecom operator returns.",
    "SECC vulnerability data relies on Census 2011 baseline projections."
  ],
  conflicts: [],
  validation_required: true,
  analytical_version: "v7.0-deterministic",
  prompt_version: "v7.0-grounded",
  retrieval_timestamp: "2026-09-30T10:00:00Z",
  summary: "This region exhibits an acute disparity between physical reality and expressed digital voice: Jal Jeevan Mission records confirm tap water coverage is limited to 34.2%, while SECC vulnerability stands at 74%. However, expressed grievances remain suppressed due to poor 22% telecom penetration.",
  disclaimer: "AI-Derived Analytical Signal — Not Official Policy",
  validation_requirement: "Potential Silent Need Signal — requires administrative field validation."
};

export const MOCK_EVIDENCE_SUMMARY: EvidenceSummary = {
  total_evidence_records: 56,
  official_sources_count: 42,
  analytical_sources_count: 14,
  synthetic_sources_count: 0,
  verified_coverage_pct: 94.6,
  analytical_version: "v7.0-deterministic",
  disclaimer: "AI-Derived Analytical Signal — Not Official Policy"
};

// ============================================================================
// POLICY SANDBOX & SCENARIOS (Phase 8)
// ============================================================================

export const MOCK_SCENARIOS: ScenarioResult[] = [
  {
    simulation_id: "SIM-IND-TN-DHM-01",
    scenario_id: "SCN-IND_TN_DHM_HRR-WATER-7A9B",
    geo_id: "IND_TN_DHM_HRR",
    region_name: "Harur Block",
    sector: "water",
    intervention_type: "DECENTRALIZED_SOLAR_BOREWELL",
    status: "COMPLETED",
    estimated_population_benefited: 64125,
    current_accessibility_index: 0.342,
    projected_accessibility_index: 0.737,
    absolute_gain_pct: 39.5,
    addressed_clusters_count: 2,
    total_clusters_in_sector: 3,
    unaddressed_residual_needs: ["Isolated hamlets beyond ridge pipeline"],
    estimated_budget_inr: 42000000,
    roi_cost_per_beneficiary_inr: 655,
    confidence_interval: {
      lower_bound_gain: 35.5,
      upper_bound_gain: 43.5,
      standard_error: 2.1
    },
    baseline: {
      geo_id: "IND_TN_DHM_HRR",
      region_name: "Harur Taluk, Dharmapuri",
      state_name: "Tamil Nadu",
      sector: "water",
      infra_deficit_score: {
        name: "Tap Water Deficit",
        value: 0.658,
        formatted_value: "65.8% deficit",
        source_dataset: "Jal Jeevan Mission 2024",
        evidence_ids: ["EV-5127A0-INF-01"],
        classification: "HISTORICAL_FACT"
      },
      population: {
        name: "Total Population",
        value: 142500,
        formatted_value: "142,500 residents",
        source_dataset: "Census of India 2011",
        evidence_ids: ["EV-5127A0-VUL-01"],
        classification: "HISTORICAL_FACT"
      },
      vulnerability_score: {
        name: "Socioeconomic Vulnerability",
        value: 0.74,
        formatted_value: "0.740 index",
        source_dataset: "SECC 2011",
        evidence_ids: ["EV-5127A0-VUL-01"],
        classification: "HISTORICAL_FACT"
      },
      digital_access_score: {
        name: "Digital Penetration",
        value: 0.42,
        formatted_value: "42.0% coverage",
        source_dataset: "TRAI 2024",
        evidence_ids: ["EV-5127A0-DIG-01"],
        classification: "HISTORICAL_FACT"
      },
      voice_density: {
        name: "Voice Density",
        value: 0.18,
        formatted_value: "0.18 req/1k",
        source_dataset: "JanSetu Citizen Intake",
        evidence_ids: ["EV-5127A0-VOX-01"],
        classification: "HISTORICAL_FACT"
      },
      active_projects_count: {
        name: "Active Schemes",
        value: 2,
        formatted_value: "2 active projects",
        source_dataset: "State Plan Schemes MIS",
        evidence_ids: ["EV-5127A0-INF-01"],
        classification: "HISTORICAL_FACT"
      },
      total_allocated_budget_inr: {
        name: "Allocated Budget",
        value: 124000000,
        formatted_value: "₹12.4 Cr",
        source_dataset: "Finance Department MIS",
        evidence_ids: ["EV-5127A0-INF-01"],
        classification: "HISTORICAL_FACT"
      },
      analytical_version: "v8.0-deterministic"
    },
    assumptions: {
      intervention_type: "INFRASTRUCTURE_CAPACITY_INCREASE",
      sector: "water",
      coverage_improvement_pct: 60.0,
      target_population_pct: 45.0,
      hypothetical_budget_inr: 42000000,
      implementation_timeline_months: 9,
      notes: "Decentralized deep borewell micro-utilities in high-deficit tribal hamlets",
      assumptions_classification: "MODEL_ASSUMPTION",
      cost_status: "USER_PROVIDED_ASSUMPTION"
    },
    estimates: {
      estimated_coverage_improvement_pct: 60.0,
      estimated_infrastructure_deficit_after: 0.263,
      estimated_gap_reduction: 0.395,
      estimated_gap_reduction_pct: 60.0,
      estimated_affected_population: 64125,
      cost_per_beneficiary_inr: 655,
      cost_status: "USER_PROVIDED_ASSUMPTION",
      confidence_level: "HIGH",
      sensitivity_range: {
        lower_gap_reduction: 0.355,
        upper_gap_reduction: 0.435,
        margin_pct: 10.0
      },
      classification: "SCENARIO_ESTIMATE"
    },
    limitations: [
      "Assumes 100% solar array uptime during summer months.",
      "Excludes pipeline reticulation maintenance overheads."
    ],
    disclaimer: "⚠ HYPOTHETICAL SCENARIO — MODEL ESTIMATE, NOT OFFICIAL POLICY",
    policy_notice: "AI-Derived Analytical Signal — Not Official Policy",
    created_at: "2026-09-28T14:00:00Z",
    model_version: "v8.0-deterministic"
  }
];

// ============================================================================
// CLOSED-LOOP IMPACT MEASUREMENT & EVALUATION (Phase 9)
// ============================================================================

export const MOCK_CONTROLLED_INDICATORS: IndicatorDefinition[] = [
  {
    indicator_id: "IND-WATER-TAP-01",
    name: "Functional Household Tap Connection Coverage",
    sector: "water",
    unit: "%",
    direction: "HIGHER_IS_BETTER",
    baseline_source: "Jal Jeevan Mission Baseline Audit",
    observation_source: "Quality Council Physical Verification",
    description: "Percentage of rural households provided with individual tap connection under JJM."
  },
  {
    indicator_id: "IND-HEALTH-RESP-02",
    name: "Average Emergency Medical Transit Time",
    sector: "healthcare",
    unit: "MINUTES",
    direction: "LOWER_IS_BETTER",
    baseline_source: "District Health Society Records",
    observation_source: "108 Ambulance GPS Telemetry",
    description: "Average minutes required for an ambulance to reach remote hamlets from dispatch."
  }
];

export const MOCK_IMPACT_EVALUATIONS: ImpactEvaluation[] = [
  {
    impact_id: "IMP-001",
    project_id: "PRJ-TN-DHM-01",
    commenced_date: "2024-04-01",
    evaluation_date: "2025-06-30",
    before_accessibility_pct: 34.2,
    after_accessibility_pct: 58.4,
    accessibility_gain_pct: 24.2,
    before_monthly_requests: 48,
    after_monthly_requests: 12,
    request_reduction_pct: 75.0,
    measured_sentiment_recovery: 0.82,
    evaluation_id: "EVAL-001",
    geo_id: "IND_TN_DHM_HRR",
    region_name: "Harur Block",
    state_name: "Tamil Nadu",
    sector: "water",
    intervention_id: "INT-JJM-01",
    project_name: "Harur Block Decentralized Solar Water Purification & Piped Supply Project",
    scenario_id: "SCN-IND_TN_DHM_HRR-WATER-7A9B",
    baseline_period: "2024-Q1",
    observation_period: "2025-Q2",
    indicator: MOCK_CONTROLLED_INDICATORS[0],
    baseline_snapshot: {
      baseline_id: "BSL-001",
      geo_id: "IND_TN_DHM_HRR",
      sector: "water",
      indicator: MOCK_CONTROLLED_INDICATORS[0],
      value: 34.2,
      unit: "%",
      source: "Jal Jeevan Mission Baseline Audit",
      source_date: "2024-03-31",
      evidence_ids: ["EV-5127A0-INF-01"],
      provenance: "TIER_1_OFFICIAL",
      classification: "HISTORICAL_FACT",
      snapshot_timestamp: "2024-03-31T00:00:00Z"
    },
    observation: {
      observation_id: "OBS-001-A",
      evaluation_id: "EVAL-001",
      geo_id: "IND_TN_DHM_HRR",
      indicator: MOCK_CONTROLLED_INDICATORS[0],
      value: 58.4,
      unit: "%",
      observation_date: "2025-06-30",
      source: "Departmental Quality Council Physical Verification",
      source_type: "FIELD_AUDIT",
      provenance: "VERIFIED_AUDIT",
      evidence_ids: ["EV-5127A0-INF-01"],
      quality_status: "VERIFIED",
      classification: "OBSERVED_OUTCOME",
      recorded_at: "2025-07-01T10:00:00Z"
    },
    calculation: {
      absolute_change: 24.2,
      percentage_change: 70.76,
      target_gap: 0.0,
      target_achievement_pct: 100.0,
      is_improvement: true,
      classification: "IMPACT_ESTIMATE"
    },
    scenario_comparison: {
      scenario_id: "SCN-IND_TN_DHM_HRR-WATER-7A9B",
      scenario_estimate: 60.0,
      scenario_estimate_classification: "SCENARIO_ESTIMATE",
      observed_outcome: 58.4,
      observed_outcome_classification: "OBSERVED_OUTCOME",
      scenario_outcome_difference: -1.6,
      predicted_change: 25.8,
      observed_change: 24.2,
      prediction_error: 1.6,
      absolute_prediction_error: 1.6,
      relative_prediction_error: 2.67,
      directional_consistency: true,
      label: "WELL_CALIBRATED",
      disclaimer: "Phase 8 Scenario Estimate - Not an Observed Outcome"
    },
    target_value: 60.0,
    evaluation_type: "DESCRIPTIVE_BEFORE_AFTER",
    attribution_level: "DESCRIPTIVE_ONLY",
    attribution_statement: "The observed indicator changed by 24.2% between baseline and post-intervention measurement.",
    data_quality: "HIGH",
    confounders: [
      {
        factor_type: "WEATHER",
        description: "Monsoon recharge in Theerthamalai aquifer reduced solar pumping load",
        classification: "EXTERNAL_FACTOR"
      }
    ],
    evidence_ids: ["EV-5127A0-INF-01"],
    limitations: ["Block-level aggregate; variation exists across hamlets"],
    is_verified: true,
    evaluation_status: "COMPLETED",
    model_version: "v9.0-impact-evaluation",
    created_at: "2025-07-02T12:00:00Z",
    governance_notice: "OBSERVED OUTCOME — MEASURED DATA. IMPACT ESTIMATE — DERIVED FROM OBSERVED DATA",
    disclaimer: "AI-Derived Analytical Signal — Not Official Policy"
  }
];

export const MOCK_MODEL_VALIDATION: ModelValidationSummary = {
  total_scenarios_evaluated: 2,
  total_evaluations_count: 2,
  mean_absolute_prediction_error: 5.94,
  directional_consistency_rate: 1.0,
  evaluations_by_sector: { "water": 1, "healthcare": 1 },
  data_quality_distribution: { "HIGH": 2 },
  model_version: "v9.0-impact-evaluation",
  disclaimer: "AI-Derived Analytical Signal — Not Official Policy"
};

// ============================================================================
// CONTINUOUS CALIBRATION & LEARNING LAB (Phase 10)
// ============================================================================

export const MOCK_LEARNING_CANDIDATES: LearningCandidate[] = [
  {
    learning_id: "LRN-SCENARIO-001",
    model_family: "SCENARIO_SIMULATION",
    source_version: "v8.0-deterministic",
    target_version: "v10.0-calibrated",
    source_evaluation_ids: ["EVAL-001"],
    training_window: { start: "2024-01-01", end: "2025-05-31" },
    validation_window: { start: "2025-06-01", end: "2026-03-31" },
    status: "APPROVED",
    parameters: [
      {
        parameter_name: "scenario_effectiveness_factor",
        current_value: 1.000,
        candidate_value: 0.942,
        min_value: 0.500,
        max_value: 1.500,
        supported_range: [0.500, 1.500],
        relative_change: -5.8,
        evidence_count: 2,
        validation_metric: "MAE",
        description: "Empirically calibrated elasticity factor for projected gap reduction."
      }
    ],
    metrics: {
      sample_size: 12,
      validation_sample_size: 8,
      mae_before: 0.145,
      mae_candidate: 0.082,
      mape_before: 14.5,
      mape_candidate: 8.2,
      directional_consistency_before: 0.667,
      directional_consistency_candidate: 0.833,
      mean_prediction_error_before: 0.048,
      mean_prediction_error_candidate: 0.012,
      validation_mae_before: 0.145,
      validation_mae_candidate: 0.082,
      validation_directional_consistency_before: 0.667,
      validation_directional_consistency_candidate: 0.833
    },
    review_notes: "Approved based on held-out validation showing lower MAE and 83.3% directional consistency across Q1 2026 pilot audits.",
    reviewed_by: "gov_admin_pilot",
    created_at: "2026-09-30T15:20:00Z",
    disclaimer: "CALIBRATION CANDIDATE — NOT ACTIVE PRODUCTION MODEL"
  }
];

export const MOCK_MODEL_VERSIONS: ModelVersion[] = [
  {
    model_version: "v8.0-deterministic",
    model_family: "SCENARIO_SIMULATION",
    status: "ACTIVE",
    parameters: { "scenario_effectiveness_factor": 1.000 },
    created_at: "2026-09-01T00:00:00Z",
    activated_at: "2026-09-01T00:00:00Z",
    description: "Phase 8 deterministic counterfactual baseline model."
  },
  {
    model_version: "v5.0-deterministic",
    model_family: "DEMAND_HOTSPOT",
    status: "ACTIVE",
    parameters: {
      "voice_intensity_weight": 0.400,
      "demand_velocity_weight": 0.350,
      "persistence_weight": 0.250
    },
    created_at: "2026-08-15T00:00:00Z",
    activated_at: "2026-08-15T00:00:00Z",
    description: "Phase 5 spatial demand hotspot detection model."
  },
  {
    model_version: "v6.0-deterministic",
    model_family: "SILENT_NEED",
    status: "ACTIVE",
    parameters: {
      "discrepancy_weight": 0.450,
      "vulnerability_weight": 0.300,
      "deficit_weight": 0.250
    },
    created_at: "2026-08-20T00:00:00Z",
    activated_at: "2026-08-20T00:00:00Z",
    description: "Phase 6 potential silent need discrepancy model."
  },
  {
    model_version: "v10.0-calibrated",
    model_family: "SCENARIO_SIMULATION",
    status: "UNDER_REVIEW",
    parameters: { "scenario_effectiveness_factor": 0.942 },
    created_at: "2026-09-30T15:20:00Z",
    description: "Empirically calibrated model candidate with held-out validation."
  }
];

export const MOCK_LEARNING_AUDIT_EVENTS: LearningAuditEvent[] = [
  {
    event_id: "AUD-LRN-001",
    learning_id: "LRN-SCENARIO-001",
    model_version: "v10.0-calibrated",
    action: "CREATED",
    actor: "system_cron",
    timestamp: "2026-09-30T15:20:00Z",
    reason: "Automated candidate generation via deterministic shrinkage across evaluated outcomes."
  },
  {
    event_id: "AUD-LRN-002",
    learning_id: "LRN-SCENARIO-001",
    model_version: "v10.0-calibrated",
    action: "VALIDATED",
    actor: "system_validation_runner",
    timestamp: "2026-09-30T16:10:00Z",
    reason: "Held-out validation confirmed reduction in prediction error without temporal leakage."
  },
  {
    event_id: "AUD-LRN-003",
    learning_id: "LRN-SCENARIO-001",
    model_version: "v10.0-calibrated",
    action: "APPROVED",
    actor: "gov_admin_pilot",
    timestamp: "2026-09-30T17:45:00Z",
    reason: "Approved by Lead Data Architect for staged production activation."
  }
];

export const MOCK_LEARNING_SUMMARY: LearningSummary = {
  total_evaluations_ingested: 2,
  total_candidates: 1,
  active_models: 3,
  pending_reviews: 1,
  data_quality: {
    total_observations: 2,
    verified_observations: 2,
    proxy_observations: 0,
    missing_observations: 0,
    conflicting_observations: 0,
    verified_pct: 100.0,
    proxy_pct: 0.0,
    missing_pct: 0.0,
    conflicting_pct: 0.0,
    overall_quality_score: 1.0,
    quality_status: "HEALTHY"
  },
  drift_summary: [
    {
      model_family: "SCENARIO_SIMULATION",
      parameter_name: "scenario_effectiveness_factor",
      status: "STABLE",
      historical_mean: 0.95,
      recent_mean: 0.94,
      mean_shift_pct: 1.05,
      variance_shift_pct: 2.10,
      sample_count_recent: 8,
      sample_count_historical: 12,
      message: "Statistical distribution of prediction error is stable within +/- 5% threshold.",
      timestamp: new Date().toISOString()
    }
  ],
  analytical_version: "v10.0-continuous-learning",
  prompt_version: "v10.0-grounded-learning",
  disclaimers: [
    "CALIBRATION CANDIDATE — Model estimate derived from historical data. Not an automatically active model.",
    "AI-Derived Analytical Signal — Not Official Policy.",
    "Zero Autonomous Model Modification — All changes require explicit administrative authorization."
  ]
};
