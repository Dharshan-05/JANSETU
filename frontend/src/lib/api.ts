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
  ScenarioInput,
  ScenarioResult,
  ScenarioComparisonResponse,
  ScenarioExplanationResponse,
  ImpactEvaluation,
  EvaluationCreateInput,
  ObservationInput,
  ModelValidationSummary,
  ImpactExplanationResponse,
  IndicatorDefinition,
  LearningCandidate,
  ModelVersion,
  LearningAuditEvent,
  LearningSummary,
  GenerateCandidateRequest,
  ValidateCandidateRequest,
  ApproveCandidateRequest,
  RejectCandidateRequest,
  ActivateModelRequest,
  RollbackModelRequest,
  LearningExplanationResponse
} from '../types';

import {
  MOCK_SYSTEM_INFO,
  MOCK_HEALTH_STATUS,
  MOCK_READINESS_STATUS,
  MOCK_APIV1_STATUS,
  MOCK_DATA_STATUS,
  MOCK_DATA_QUALITY,
  MOCK_GEOGRAPHY_NODES,
  MOCK_SUPPORTED_LANGUAGES,
  MOCK_CITIZEN_REQUESTS,
  MOCK_CONTROLLED_TAXONOMY,
  MOCK_DEMAND_CLUSTERS,
  MOCK_SIMILAR_REQUESTS,
  MOCK_COMMAND_CENTER_KPIS,
  MOCK_HOTSPOTS,
  MOCK_HOTSPOTS_SUMMARY,
  MOCK_DEMAND_SHADOW_ZONES,
  MOCK_DEMAND_SHADOW_ITEMS,
  MOCK_DEMAND_SHADOW_MATRIX,
  MOCK_SILENT_NEED_SIGNALS,
  MOCK_SILENT_NEED_SUMMARY,
  MOCK_CIVIC_DIGITAL_TWIN,
  MOCK_EVIDENCE_RECORDS,
  MOCK_EVIDENCE_BRIEF,
  MOCK_EVIDENCE_SUMMARY,
  MOCK_SCENARIOS,
  MOCK_CONTROLLED_INDICATORS,
  MOCK_IMPACT_EVALUATIONS,
  MOCK_MODEL_VALIDATION,
  MOCK_LEARNING_CANDIDATES,
  MOCK_MODEL_VERSIONS,
  MOCK_LEARNING_AUDIT_EVENTS,
  MOCK_LEARNING_SUMMARY
} from './mockData';

export interface SystemInfo {
  name: string;
  service: string;
  version: string;
  status: string;
}

export interface HealthStatus {
  status: string;
}

export interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  services: {
    bigquery: 'ok' | 'error';
    pubsub: 'ok' | 'error';
    storage: 'ok' | 'error';
  };
}

export interface ApiV1Status {
  version: string;
  status: string;
  phase: string;
  modules: string[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// In-memory state stores allowing interactive user feedback without external server dependencies
let citizenRequestsStore = [...MOCK_CITIZEN_REQUESTS];
let scenariosStore = [...MOCK_SCENARIOS];
let evaluationsStore = [...MOCK_IMPACT_EVALUATIONS];
let candidatesStore = [...MOCK_LEARNING_CANDIDATES];
let modelVersionsStore = [...MOCK_MODEL_VERSIONS];
let auditEventsStore = [...MOCK_LEARNING_AUDIT_EVENTS];

class ApiClient {
  private tokenProvider: (() => Promise<string | null>) | null = null;

  constructor() {}

  public setTokenProvider(provider: () => Promise<string | null>) {
    this.tokenProvider = provider;
  }

  private async delay(ms: number = 40): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // =========================================================================
  // PHASE 1: FOUNDATION HEALTH & READINESS
  // =========================================================================

  public async getSystemInfo(): Promise<SystemInfo> {
    await this.delay(20);
    return MOCK_SYSTEM_INFO;
  }

  public async getHealthStatus(): Promise<HealthStatus> {
    await this.delay(20);
    return MOCK_HEALTH_STATUS;
  }

  public async getReadinessStatus(): Promise<ReadinessStatus> {
    await this.delay(20);
    return MOCK_READINESS_STATUS;
  }

  public async getApiV1Status(): Promise<ApiV1Status> {
    await this.delay(20);
    return MOCK_APIV1_STATUS;
  }

  // =========================================================================
  // PHASE 2: CANONICAL DATA FOUNDATION
  // =========================================================================

  public async getDataStatus(): Promise<{
    status: string;
    bigquery_connected: boolean;
    primary_dataset: string;
    analytics_dataset: string;
    canonical_tables_count: number;
    total_records: number;
    table_counts: Record<string, number>;
  }> {
    await this.delay(30);
    return MOCK_DATA_STATUS;
  }

  public async getGeographyById(geoId: string): Promise<{
    status: string;
    data: {
      record: any;
      hierarchy_path: any[];
      subdivisions_count: number;
      subdivisions: any[];
    };
  }> {
    await this.delay(30);
    const node = MOCK_GEOGRAPHY_NODES[geoId] || MOCK_GEOGRAPHY_NODES["IND_TN_DHM_HRR"];
    return {
      status: "success",
      data: node
    };
  }

  public async getDataQuality(): Promise<{
    status: string;
    data: {
      total_records: number;
      table_summaries: Record<string, any>;
      geographic_hierarchy_valid: boolean;
      missing_geo_references: number;
      provenance_sources: string[];
      status: string;
      timestamp: string;
    };
  }> {
    await this.delay(30);
    return MOCK_DATA_QUALITY;
  }

  // =========================================================================
  // PHASE 3: CITIZEN INTAKE & MULTILINGUAL VOICE
  // =========================================================================

  public async getSupportedLanguages(): Promise<SupportedLanguagesResponse> {
    await this.delay(20);
    return MOCK_SUPPORTED_LANGUAGES;
  }

  public async submitTextRequest(payload: {
    text: string;
    detected_language?: string;
    declared_state?: string;
    declared_district?: string;
  }): Promise<IntakeResponse> {
    await this.delay(50);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const requestId = `REQ-IND-2026-${randomSuffix}`;

    const newRequest: CitizenRequestStatus = {
      request_id: requestId,
      status: "PROCESSED",
      channel: "web_portal",
      language: payload.detected_language || "ta",
      original_transcript: payload.text,
      normalized_text: payload.text,
      geo_id: "IND_TN_DHM_HRR",
      created_at: new Date().toISOString(),
      translation_status: "COMPLETED",
      transcription_status: "COMPLETED"
    };
    citizenRequestsStore.unshift(newRequest);

    return {
      request_id: requestId,
      status: "PROCESSED",
      source_channel: "WEB_PORTAL",
      detected_language: payload.detected_language || "Tamil (ta-IN)",
      original_text: payload.text,
      english_translation: `Grievance registered: ${payload.text}`,
      extraction: {
        primary_category: "water",
        subcategory: "pipeline_breakdown",
        specific_issue: payload.text.substring(0, 80),
        location: {
          raw_location_text: "Harur Taluk, Dharmapuri",
          matched_village_or_ward: "Theerthamalai",
          block_or_taluk: "Harur",
          district: "Dharmapuri",
          state: "Tamil Nadu",
          approximate_latitude: 12.0622,
          approximate_longitude: 78.4984
        },
        severity: 4,
        urgency_score: 0.88,
        affected_group: "rural_residents",
        time_pattern: "past 3 weeks",
        key_entities: ["drinking water", "pipeline", "potable supply"],
        confidence: 0.94
      },
      matched_geo_id: "IND_TN_DHM_HRR",
      matched_admin_area: "Harur Block, Dharmapuri, Tamil Nadu",
      assigned_cluster_id: "CLS-WATER-001",
      cluster_title: "Groundwater Depletion & Pipeline Fractures in Harur Taluka",
      processing_time_ms: 184,
      is_synthetic: false
    };
  }

  public async submitVoiceRequest(formData: FormData): Promise<IntakeResponse> {
    await this.delay(60);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const requestId = `REQ-VOX-2026-${randomSuffix}`;
    const declaredLang = (formData.get('declared_language') as string) || 'ta-IN';

    const transcript = declaredLang.includes('hi')
      ? "सोनभद्र जिले के दुद्धी ब्लॉक में प्राथमिक स्वास्थ्य केंद्र में डॉक्टर पिछले दो महीने से उपस्थित नहीं हैं।"
      : "அரூர் தாலுகா தீர்த்தமலை கிராமத்தில் குடிநீர் குழாயில் கடந்த மூன்று வாரங்களாக தண்ணீர் வரவில்லை.";

    return {
      request_id: requestId,
      status: "PROCESSED",
      source_channel: "VOICE_PHONE",
      detected_language: declaredLang,
      original_text: transcript,
      english_translation: "In Harur block, drinking water supply from primary gravity mains has been disrupted for three weeks.",
      extraction: {
        primary_category: "water",
        subcategory: "pipeline_breakdown",
        specific_issue: "Drinking water supply disrupted across village habitations",
        location: {
          raw_location_text: "Harur Taluk",
          block_or_taluk: "Harur",
          district: "Dharmapuri",
          state: "Tamil Nadu",
          approximate_latitude: 12.0622,
          approximate_longitude: 78.4984
        },
        severity: 4,
        urgency_score: 0.86,
        affected_group: "rural_residents",
        time_pattern: "3 weeks continuous",
        key_entities: ["water pipeline", "borewell", "handpump"],
        confidence: 0.92
      },
      matched_geo_id: "IND_TN_DHM_HRR",
      matched_admin_area: "Harur Block, Dharmapuri, Tamil Nadu",
      assigned_cluster_id: "CLS-WATER-001",
      cluster_title: "Groundwater Depletion & Pipeline Fractures in Harur Taluka",
      processing_time_ms: 242,
      is_synthetic: false
    };
  }

  public async getRequestStatus(requestId: string): Promise<CitizenRequestStatus> {
    await this.delay(20);
    const existing = citizenRequestsStore.find(r => r.request_id === requestId);
    if (existing) return existing;

    return {
      request_id: requestId,
      status: "PROCESSED",
      channel: "web_portal",
      language: "ta",
      original_transcript: "குடிநீர் தேவை பதிவு செய்யப்பட்டது.",
      normalized_text: "Drinking water demand officially logged and geocoded.",
      geo_id: "IND_TN_DHM_HRR",
      created_at: new Date().toISOString(),
      translation_status: "COMPLETED",
      transcription_status: "COMPLETED"
    };
  }

  // =========================================================================
  // PHASE 4: AI PERCEPTION & CLUSTERING
  // =========================================================================

  public async processAIRequest(requestId: string): Promise<AIPerceptionResult> {
    await this.delay(40);
    return {
      success: true,
      request_id: requestId,
      geo_id: "IND_TN_DHM_HRR",
      category: "water",
      subcategory: "pipeline_breakdown",
      urgency_score: 0.88,
      severity_level: 4,
      affected_demographic: "rural_women",
      actionable_summary: "Severe drinking water deficit caused by fractured main lines near Theerthamalai ridge.",
      extraction: {
        primary_category: "water",
        subcategory: "pipeline_breakdown",
        urgency_score: 0.88,
        severity_level: 4,
        affected_demographic: "rural_women",
        extracted_entities: ["drinking water", "pipeline fracture", "Theerthamalai"],
        infrastructure_gap: "Deep borewell and pipeline conveyance infrastructure deficit",
        actionable_summary: "Replace breached PVC piping and augment solar deep borewell pumps.",
        confidence_score: 0.94,
        hallucination_safeguards_passed: true,
        extracted_at: new Date().toISOString()
      },
      embedding: {
        dimension: 768,
        model: "text-embedding-004",
        subspace_signature: "WATER_INFRA_TAMIL_01",
        preview: [0.034, -0.112, 0.452, 0.089, -0.221, 0.312, 0.178, -0.045]
      },
      cluster: {
        cluster_id: "CLS-WATER-001",
        title: "Groundwater Depletion & Pipeline Fractures in Harur Taluka",
        representative_issue: "Persistent drinking water unavailability across 14 hamlets in Harur block.",
        total_requests: 68,
        created_new: false
      },
      model_provenance: {
        gemini_model: "gemini-2.5-pro",
        embedding_model: "text-embedding-004",
        extraction_version: "v4.0-perception",
        clustering_version: "v4.0-vector-search"
      },
      disclaimer: "AI-Derived Analytical Signal — Not Official Policy"
    };
  }

  public async getAIStatus(requestId: string): Promise<AIPerceptionResult> {
    return this.processAIRequest(requestId);
  }

  public async fetchDemandClusters(params?: {
    geo_id?: string;
    category?: string;
    limit?: number;
  }): Promise<{ total: number; clusters: DemandCluster[] }> {
    await this.delay(30);
    let list = [...MOCK_DEMAND_CLUSTERS];
    if (params?.category && params.category !== 'all') {
      list = list.filter(c => c.category.toLowerCase() === params.category!.toLowerCase());
    }
    return {
      total: list.length,
      clusters: list
    };
  }

  public async fetchClusterDetails(clusterId: string): Promise<DemandCluster> {
    await this.delay(20);
    return MOCK_DEMAND_CLUSTERS.find(c => c.cluster_id === clusterId) || MOCK_DEMAND_CLUSTERS[0];
  }

  public async fetchSimilarRequests(requestId: string, limit: number = 5): Promise<{
    request_id: string;
    total_matches: number;
    matches: SimilarRequest[];
  }> {
    await this.delay(30);
    return {
      request_id: requestId,
      total_matches: MOCK_SIMILAR_REQUESTS.length,
      matches: MOCK_SIMILAR_REQUESTS.slice(0, limit)
    };
  }

  public async fetchTaxonomy(): Promise<ControlledTaxonomy> {
    await this.delay(20);
    return MOCK_CONTROLLED_TAXONOMY;
  }

  // =========================================================================
  // PHASE 5: COMMAND CENTER & DEMAND HOTSPOTS
  // =========================================================================

  public async fetchCommandCenterKPIs(): Promise<CommandCenterKPIs> {
    await this.delay(30);
    return MOCK_COMMAND_CENTER_KPIS;
  }

  public async fetchDemandShadowGrid(): Promise<{ total_zones: number; zones: DemandShadowZone[] }> {
    await this.delay(30);
    return {
      total_zones: MOCK_DEMAND_SHADOW_ZONES.length,
      zones: MOCK_DEMAND_SHADOW_ZONES
    };
  }

  public async fetchHotspots(params?: any): Promise<Hotspot[]> {
    await this.delay(30);
    let list = [...MOCK_HOTSPOTS];
    if (params?.category && params.category !== 'all') {
      list = list.filter(h => h.category.toLowerCase() === params.category.toLowerCase());
    }
    return list;
  }

  public async fetchHotspotDetail(hotspotId: string): Promise<Hotspot> {
    await this.delay(20);
    return MOCK_HOTSPOTS.find(h => h.hotspot_id === hotspotId) || MOCK_HOTSPOTS[0];
  }

  public async fetchHotspotsSummary(): Promise<HotspotSummary> {
    await this.delay(20);
    return MOCK_HOTSPOTS_SUMMARY;
  }

  public async fetchDemandShadowMatrix(params?: any): Promise<DemandShadowMatrixResponse> {
    await this.delay(30);
    let items = [...MOCK_DEMAND_SHADOW_ITEMS];
    if (params?.category && params.category !== 'all') {
      items = items.filter(i => i.category.toLowerCase() === params.category.toLowerCase());
    }
    if (params?.state_code && params.state_code !== 'all') {
      items = items.filter(i => i.state_code === params.state_code);
    }
    if (params?.quadrant && params.quadrant !== 'all') {
      items = items.filter(i => i.quadrant === params.quadrant);
    }
    return {
      matrix: items,
      summary: MOCK_DEMAND_SHADOW_MATRIX.summary,
      disclaimer: MOCK_DEMAND_SHADOW_MATRIX.disclaimer
    };
  }

  // =========================================================================
  // PHASE 6: POTENTIAL SILENT NEED DETECTION
  // =========================================================================

  public async fetchSilentNeedSignals(params?: any): Promise<SilentNeedSignal[]> {
    await this.delay(30);
    let list = [...MOCK_SILENT_NEED_SIGNALS];
    if (params?.category && params.category !== 'all') {
      list = list.filter(s => s.category.toLowerCase() === params.category.toLowerCase());
    }
    if (params?.state_code && params.state_code !== 'all') {
      list = list.filter(s => s.state_name.toLowerCase().includes(params.state_code.toLowerCase()));
    }
    if (params?.signal_class && params.signal_class !== 'all') {
      list = list.filter(s => s.signal_class === params.signal_class);
    }
    return list;
  }

  public async fetchSilentNeedDetail(signalId: string): Promise<SilentNeedSignal> {
    await this.delay(20);
    return MOCK_SILENT_NEED_SIGNALS.find(s => s.signal_id === signalId) || MOCK_SILENT_NEED_SIGNALS[0];
  }

  public async fetchSilentNeedSummary(): Promise<SilentNeedSummary> {
    await this.delay(20);
    return MOCK_SILENT_NEED_SUMMARY;
  }

  public async fetchDigitalTwin(geoId: string): Promise<CivicDigitalTwin> {
    await this.delay(30);
    return {
      ...MOCK_CIVIC_DIGITAL_TWIN,
      geo_id: geoId || "IND_TN_DHM_HRR"
    };
  }

  // =========================================================================
  // PHASE 7: GROUNDED EVIDENCE ENGINE
  // =========================================================================

  public async fetchEvidenceBrief(signalId: string): Promise<EvidenceResponse> {
    await this.delay(30);
    return {
      ...MOCK_EVIDENCE_BRIEF,
      signal_id: signalId || "SIG-IND-TN-DHM-001"
    };
  }

  public async refreshEvidenceBrief(signalId: string): Promise<EvidenceResponse> {
    await this.delay(40);
    return {
      ...MOCK_EVIDENCE_BRIEF,
      signal_id: signalId,
      retrieval_timestamp: new Date().toISOString()
    };
  }

  public async fetchEvidenceRecord(evidenceId: string): Promise<EvidenceRecord> {
    await this.delay(20);
    return MOCK_EVIDENCE_RECORDS.find(r => r.evidence_id === evidenceId) || MOCK_EVIDENCE_RECORDS[0];
  }

  public async fetchEvidenceSummary(): Promise<EvidenceSummary> {
    await this.delay(20);
    return MOCK_EVIDENCE_SUMMARY;
  }

  // =========================================================================
  // PHASE 8: POLICY SANDBOX & SCENARIO SIMULATION
  // =========================================================================

  public async simulateScenario(payload: ScenarioInput): Promise<ScenarioResult> {
    await this.delay(50);
    const baselineDeficit = 0.658;
    const covPct = payload.coverage_improvement_pct ?? 50.0;
    const popRatio = (payload.target_population_pct ?? 40.0) / 100.0;
    const totalPop = 142500;
    const budget = payload.hypothetical_budget_inr ?? 25000000;

    const estimatedDeficit = Math.max(0.0, baselineDeficit * (1.0 - (covPct / 100.0)));
    const estimatedGapReduction = baselineDeficit - estimatedDeficit;
    const affectedPop = Math.round(totalPop * popRatio);
    const costPerBeneficiary = Math.round(budget / Math.max(1, affectedPop));

    const signal = MOCK_SILENT_NEED_SIGNALS.find(s => s.geo_id === payload.geo_id);
    const regionName = signal ? signal.region_name : "Harur Block";
    const stateName = signal ? signal.state_name : "Tamil Nadu";

    const newScenario: ScenarioResult = {
      simulation_id: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      scenario_id: `SCN-${payload.geo_id}-${payload.sector.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      geo_id: payload.geo_id,
      region_name: regionName,
      sector: payload.sector,
      intervention_type: payload.intervention_type,
      status: "COMPLETED",
      estimated_population_benefited: affectedPop,
      current_accessibility_index: 0.342,
      projected_accessibility_index: Number((0.342 + (0.658 * (covPct / 100.0))).toFixed(3)),
      absolute_gain_pct: Number(covPct.toFixed(1)),
      addressed_clusters_count: 2,
      total_clusters_in_sector: 3,
      unaddressed_residual_needs: ["Isolated terrain pockets beyond main pipeline"],
      estimated_budget_inr: budget,
      roi_cost_per_beneficiary_inr: costPerBeneficiary,
      confidence_interval: {
        lower_bound_gain: Number((covPct * 0.9).toFixed(1)),
        upper_bound_gain: Number((covPct * 1.1).toFixed(1)),
        standard_error: 2.1
      },
      baseline: {
        geo_id: payload.geo_id,
        region_name: regionName,
        state_name: stateName,
        sector: payload.sector,
        infra_deficit_score: {
          name: "Tap Water Deficit",
          value: baselineDeficit,
          formatted_value: `${(baselineDeficit * 100).toFixed(1)}% deficit`,
          source_dataset: "Jal Jeevan Mission 2024",
          evidence_ids: ["EV-5127A0-INF-01"],
          classification: "HISTORICAL_FACT"
        },
        population: {
          name: "Total Population",
          value: totalPop,
          formatted_value: `${totalPop.toLocaleString('en-IN')} residents`,
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
        intervention_type: payload.intervention_type,
        sector: payload.sector,
        coverage_improvement_pct: covPct,
        target_population_pct: popRatio * 100,
        hypothetical_budget_inr: budget,
        implementation_timeline_months: payload.implementation_timeline_months || 6,
        notes: payload.notes || "Configured policy simulation",
        assumptions_classification: "MODEL_ASSUMPTION",
        cost_status: "USER_PROVIDED_ASSUMPTION"
      },
      estimates: {
        estimated_coverage_improvement_pct: covPct,
        estimated_infrastructure_deficit_after: Number(estimatedDeficit.toFixed(3)),
        estimated_gap_reduction: Number(estimatedGapReduction.toFixed(3)),
        estimated_gap_reduction_pct: Number(covPct.toFixed(1)),
        estimated_affected_population: affectedPop,
        cost_per_beneficiary_inr: costPerBeneficiary,
        cost_status: "USER_PROVIDED_ASSUMPTION",
        confidence_level: "HIGH",
        sensitivity_range: {
          lower_gap_reduction: Number((estimatedGapReduction * 0.9).toFixed(3)),
          upper_gap_reduction: Number((estimatedGapReduction * 1.1).toFixed(3)),
          margin_pct: 10.0
        },
        classification: "SCENARIO_ESTIMATE"
      },
      limitations: [
        "Assumes standard terrain accessibility during execution horizon.",
        "Model estimate derived from baseline data; does not account for price inflation."
      ],
      disclaimer: "⚠ HYPOTHETICAL SCENARIO — MODEL ESTIMATE, NOT OFFICIAL POLICY",
      policy_notice: "AI-Derived Analytical Signal — Not Official Policy",
      created_at: new Date().toISOString(),
      model_version: "v8.0-deterministic"
    };

    scenariosStore.unshift(newScenario);
    return newScenario;
  }

  public async simulatePolicyScenario(payload: any): Promise<SimulationResult> {
    await this.delay(40);
    return {
      simulation_id: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      geo_id: payload.geo_id || "IND_TN_DHM_HRR",
      region_name: "Harur Block",
      sector: payload.sector || "water",
      intervention_type: payload.intervention_type || "BOREWELL_EXPANSION",
      status: "COMPLETED",
      estimated_population_benefited: 48500,
      current_accessibility_index: 0.342,
      projected_accessibility_index: 0.740,
      absolute_gain_pct: 39.8,
      addressed_clusters_count: 3,
      total_clusters_in_sector: 4,
      unaddressed_residual_needs: ["Isolated hamlets beyond 3km of trunk mains"],
      estimated_budget_inr: 32000000,
      roi_cost_per_beneficiary_inr: 659,
      confidence_interval: {
        lower_bound_gain: 34.5,
        upper_bound_gain: 45.1,
        standard_error: 2.7
      },
      disclaimer: "⚠ HYPOTHETICAL SCENARIO — MODEL ESTIMATE, NOT OFFICIAL POLICY"
    };
  }

  public async fetchScenarios(params?: any): Promise<{ total: number; scenarios: ScenarioResult[] }> {
    await this.delay(30);
    let list = [...scenariosStore];
    if (params?.sector && params.sector !== 'all') {
      list = list.filter(s => s.sector.toLowerCase() === params.sector.toLowerCase());
    }
    return {
      total: list.length,
      scenarios: list
    };
  }

  public async fetchScenarioDetail(scenarioId: string): Promise<ScenarioResult> {
    await this.delay(20);
    return scenariosStore.find(s => s.scenario_id === scenarioId) || scenariosStore[0];
  }

  public async compareScenarios(scenarioIds: string[]): Promise<ScenarioComparisonResponse> {
    await this.delay(40);
    const selected = scenariosStore.filter(s => scenarioIds.includes(s.scenario_id));
    const items = selected.length > 0 ? selected : scenariosStore.slice(0, 2);

    return {
      scenario_ids: items.map(s => s.scenario_id),
      compared_count: items.length,
      comparison_table: [
        {
          metric: "Estimated Gap Reduction",
          classification: "SCENARIO_ESTIMATE",
          values: items.reduce((acc, s) => ({ ...acc, [s.scenario_id]: `-${s.estimates.estimated_gap_reduction_pct}%` }), {})
        },
        {
          metric: "Beneficiaries Impacted",
          classification: "SCENARIO_ESTIMATE",
          values: items.reduce((acc, s) => ({ ...acc, [s.scenario_id]: s.estimates.estimated_affected_population.toLocaleString('en-IN') }), {})
        },
        {
          metric: "Simulated Cost / Beneficiary",
          classification: "SCENARIO_ESTIMATE",
          values: items.reduce((acc, s) => ({ ...acc, [s.scenario_id]: `₹${s.estimates.cost_per_beneficiary_inr}` }), {})
        }
      ],
      neutral_tradeoffs: items.map(s => ({
        scenario_id: s.scenario_id,
        description: `Trade-off profile for ${s.intervention_type}`,
        trade_offs: ["Faster deployment horizon", "Requires localized solar maintenance oversight"],
        unaddressed_dimensions: ["Long-term groundwater recharge variance"]
      })),
      data_limitations: [
        "Budget calculations reflect user-provided assumptions rather than audited bids."
      ],
      disclaimer: "NEUTRAL MODEL COMPARISON — ZERO RANKING BIAS. NOT OFFICIAL POLICY",
      comparative_notice: "AI-Derived Analytical Signal — Not Official Policy",
      compared_at: new Date().toISOString()
    };
  }

  public async explainScenario(scenarioId: string): Promise<ScenarioExplanationResponse> {
    await this.delay(30);
    return {
      scenario_id: scenarioId,
      grounded_explanation: "The counterfactual model simulates a projected gap reduction based on historical Jal Jeevan Mission baseline deficit data (EV-5127A0-INF-01). The 60% coverage improvement parameter directly targets 64,125 residents across unserved hamlets.",
      cited_evidence_ids: ["EV-5127A0-INF-01", "EV-5127A0-VUL-01"],
      cited_sources: ["Jal Jeevan Mission 2024", "Census 2011"],
      key_hypotheses: ["Solar pumping maintains uninterrupted operations across summer"],
      limitations_noted: ["Excludes pipeline maintenance overheads"],
      prompt_version: "v8.0-grounded-simulation",
      generated_at: new Date().toISOString(),
      disclaimer: "⚠ HYPOTHETICAL SCENARIO — MODEL ESTIMATE, NOT OFFICIAL POLICY"
    };
  }

  public async archiveScenario(scenarioId: string): Promise<{ success: boolean; scenario_id: string; is_archived: boolean }> {
    await this.delay(20);
    return {
      success: true,
      scenario_id: scenarioId,
      is_archived: true
    };
  }

  // =========================================================================
  // PHASE 9: CLOSED-LOOP IMPACT EVALUATION
  // =========================================================================

  public async fetchImpactEvaluations(params?: any): Promise<ImpactEvaluation[]> {
    await this.delay(30);
    let list = [...evaluationsStore];
    if (params?.sector && params.sector !== 'all') {
      list = list.filter(e => e.sector.toLowerCase() === params.sector.toLowerCase());
    }
    return list;
  }

  public async createImpactEvaluation(payload: EvaluationCreateInput): Promise<ImpactEvaluation> {
    await this.delay(40);
    const ind = MOCK_CONTROLLED_INDICATORS.find(i => i.indicator_id === payload.indicator_id) || MOCK_CONTROLLED_INDICATORS[0];
    const newEval: ImpactEvaluation = {
      impact_id: `IMP-${Math.floor(100 + Math.random() * 900)}`,
      project_id: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      commenced_date: "2024-04-01",
      evaluation_date: new Date().toISOString().split('T')[0],
      before_accessibility_pct: 34.2,
      after_accessibility_pct: 34.2,
      accessibility_gain_pct: 0,
      before_monthly_requests: 48,
      after_monthly_requests: 48,
      request_reduction_pct: 0,
      measured_sentiment_recovery: 0.5,
      is_verified: false,
      evaluation_id: `EVAL-${Math.floor(100 + Math.random() * 900)}`,
      geo_id: payload.geo_id,
      region_name: "Harur Block",
      state_name: "Tamil Nadu",
      sector: payload.sector,
      intervention_id: payload.intervention_id,
      project_name: payload.project_name || "New Civic Infrastructure Scheme",
      scenario_id: payload.scenario_id,
      baseline_period: payload.baseline_period,
      observation_period: payload.observation_period,
      indicator: ind,
      baseline_snapshot: {
        baseline_id: `BSL-${Math.floor(100 + Math.random() * 900)}`,
        geo_id: payload.geo_id,
        sector: payload.sector,
        indicator: ind,
        value: 34.2,
        unit: ind.unit,
        source: "Jal Jeevan Mission Baseline Audit",
        source_date: "2024-03-31",
        evidence_ids: ["EV-5127A0-INF-01"],
        provenance: "TIER_1_OFFICIAL",
        classification: "HISTORICAL_FACT",
        snapshot_timestamp: new Date().toISOString()
      },
      evaluation_type: payload.evaluation_type || "DESCRIPTIVE_BEFORE_AFTER",
      attribution_level: "DESCRIPTIVE_ONLY",
      attribution_statement: "Evaluation initialized; awaiting physical observation audit.",
      data_quality: "HIGH",
      confounders: [],
      evidence_ids: ["EV-5127A0-INF-01"],
      limitations: ["Preliminary registration"],
      evaluation_status: "REGISTERED",
      model_version: "v9.0-impact-evaluation",
      created_at: new Date().toISOString(),
      governance_notice: "OBSERVED OUTCOME — MEASURED DATA. IMPACT ESTIMATE — DERIVED FROM OBSERVED DATA",
      disclaimer: "AI-Derived Analytical Signal — Not Official Policy"
    };

    evaluationsStore.unshift(newEval);
    return newEval;
  }

  public async fetchImpactEvaluationDetail(evaluationId: string): Promise<ImpactEvaluation> {
    await this.delay(20);
    return evaluationsStore.find(e => e.evaluation_id === evaluationId) || evaluationsStore[0];
  }

  public async recordImpactObservation(evaluationId: string, payload: ObservationInput): Promise<ImpactEvaluation> {
    await this.delay(40);
    const target = evaluationsStore.find(e => e.evaluation_id === evaluationId) || evaluationsStore[0];

    const newObs = {
      observation_id: `OBS-${Math.floor(100 + Math.random() * 900)}`,
      evaluation_id: evaluationId,
      geo_id: target.geo_id,
      indicator: target.indicator,
      value: payload.value,
      unit: payload.unit,
      observation_date: payload.observation_date,
      source: payload.source,
      source_type: payload.source_type || "FIELD_AUDIT",
      provenance: payload.provenance || "VERIFIED_AUDIT",
      evidence_ids: payload.evidence_ids || ["EV-5127A0-INF-01"],
      quality_status: payload.quality_status || "VERIFIED",
      classification: "OBSERVED_OUTCOME",
      recorded_at: new Date().toISOString()
    };

    target.observation = newObs;

    const bVal = target.baseline_snapshot.value;
    const oVal = payload.value;
    const absChange = Number((oVal - bVal).toFixed(2));
    const pctChange = bVal !== 0 ? Number(((absChange / bVal) * 100).toFixed(2)) : 0;

    target.calculation = {
      absolute_change: absChange,
      percentage_change: pctChange,
      target_gap: 0.0,
      target_achievement_pct: 100.0,
      is_improvement: absChange > 0,
      classification: "IMPACT_ESTIMATE"
    };

    return { ...target };
  }

  public async recalculateImpact(evaluationId: string): Promise<ImpactEvaluation> {
    await this.delay(30);
    return this.fetchImpactEvaluationDetail(evaluationId);
  }

  public async explainImpactEvaluation(evaluationId: string): Promise<ImpactExplanationResponse> {
    await this.delay(30);
    return {
      evaluation_id: evaluationId,
      grounded_explanation: "Physical post-intervention audit verified tap water coverage improved from 34.2% to 58.4% (a 70.8% relative gain). The observed indicator matches the direction projected in Phase 8 counterfactual simulations.",
      cited_evidence_ids: ["EV-5127A0-INF-01"],
      cited_sources: ["Departmental Quality Council Physical Verification"],
      attribution_rationale: "Descriptive before-and-after comparison grounds the observed gain without speculative causal overreach.",
      contextual_factors_noted: ["Monsoon recharge in Theerthamalai aquifer"],
      limitations_noted: ["Block-level aggregate; hamlet variances exist."],
      prompt_version: "v9.0-grounded-impact",
      generated_at: new Date().toISOString(),
      disclaimer: "OBSERVED OUTCOME — AUDITED FIELD DATA. NOT OFFICIAL POLICY"
    };
  }

  public async fetchModelValidation(): Promise<ModelValidationSummary> {
    await this.delay(20);
    return MOCK_MODEL_VALIDATION;
  }

  public async fetchControlledIndicators(): Promise<IndicatorDefinition[]> {
    await this.delay(20);
    return MOCK_CONTROLLED_INDICATORS;
  }

  // =========================================================================
  // PHASE 10: CIVIC INTELLIGENCE LEARNING & CALIBRATION
  // =========================================================================

  public async fetchLearningSummary(): Promise<LearningSummary> {
    await this.delay(30);
    return {
      ...MOCK_LEARNING_SUMMARY,
      total_candidates: candidatesStore.length,
      active_models: modelVersionsStore.filter(m => m.status === 'ACTIVE').length
    };
  }

  public async fetchLearningCandidates(params?: any): Promise<LearningCandidate[]> {
    await this.delay(30);
    let list = [...candidatesStore];
    if (params?.model_family && params.model_family !== 'all') {
      list = list.filter(c => c.model_family === params.model_family);
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter(c => c.status === params.status);
    }
    return list;
  }

  public async fetchLearningCandidateDetail(learningId: string): Promise<LearningCandidate> {
    await this.delay(20);
    return candidatesStore.find(c => c.learning_id === learningId) || candidatesStore[0];
  }

  public async generateLearningCandidate(payload: GenerateCandidateRequest): Promise<LearningCandidate> {
    await this.delay(50);
    const family = payload.model_family || "SCENARIO_SIMULATION";
    const candidateId = `LRN-${family.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;

    const newCandidate: LearningCandidate = {
      learning_id: candidateId,
      model_family: family,
      source_version: "v8.0-deterministic",
      target_version: `v10.0-${family.toLowerCase()}-calibrated`,
      source_evaluation_ids: ["EVAL-001"],
      training_window: { start: payload.training_start || "2024-01-01", end: payload.training_end || "2025-05-31" },
      validation_window: { start: payload.validation_start || "2025-06-01", end: payload.validation_end || "2026-03-31" },
      status: "UNDER_REVIEW",
      parameters: [
        {
          parameter_name: "scenario_effectiveness_factor",
          current_value: 1.000,
          candidate_value: 0.915,
          min_value: 0.500,
          max_value: 1.500,
          supported_range: [0.500, 1.500],
          relative_change: -8.5,
          evidence_count: 2,
          validation_metric: "MAE",
          description: "Deterministic shrinkage calibration derived from post-intervention audit error."
        }
      ],
      metrics: {
        sample_size: 12,
        validation_sample_size: 8,
        mae_before: 0.145,
        mae_candidate: 0.078,
        mape_before: 14.5,
        mape_candidate: 7.8,
        directional_consistency_before: 0.667,
        directional_consistency_candidate: 0.833,
        mean_prediction_error_before: 0.048,
        mean_prediction_error_candidate: 0.010,
        validation_mae_before: 0.145,
        validation_mae_candidate: 0.078,
        validation_directional_consistency_before: 0.667,
        validation_directional_consistency_candidate: 0.833
      },
      created_at: new Date().toISOString(),
      disclaimer: "CALIBRATION CANDIDATE — NOT ACTIVE PRODUCTION MODEL"
    };

    candidatesStore.unshift(newCandidate);

    auditEventsStore.unshift({
      event_id: `AUD-LRN-${Math.floor(1000 + Math.random() * 9000)}`,
      learning_id: candidateId,
      model_version: newCandidate.target_version,
      action: "CREATED",
      actor: "gov_admin_pilot",
      timestamp: new Date().toISOString(),
      reason: "Interactive candidate generation via deterministic shrinkage across evaluated outcomes."
    });

    return newCandidate;
  }

  public async validateLearningCandidate(learningId: string, payload: ValidateCandidateRequest = {}): Promise<LearningCandidate> {
    await this.delay(40);
    const target = candidatesStore.find(c => c.learning_id === learningId) || candidatesStore[0];
    target.status = "VALIDATED";

    auditEventsStore.unshift({
      event_id: `AUD-LRN-${Math.floor(1000 + Math.random() * 9000)}`,
      learning_id: learningId,
      model_version: target.target_version,
      action: "VALIDATED",
      actor: "system_validation_runner",
      timestamp: new Date().toISOString(),
      reason: "Held-out validation confirmed lower prediction error without temporal leakage."
    });

    return { ...target };
  }

  public async approveLearningCandidate(learningId: string, payload: ApproveCandidateRequest): Promise<LearningCandidate> {
    await this.delay(40);
    const target = candidatesStore.find(c => c.learning_id === learningId) || candidatesStore[0];
    target.status = "APPROVED";
    target.reviewed_by = payload.reviewer || "gov_admin_lead";
    target.review_notes = payload.notes || "Approved following validation inspection.";

    auditEventsStore.unshift({
      event_id: `AUD-LRN-${Math.floor(1000 + Math.random() * 9000)}`,
      learning_id: learningId,
      model_version: target.target_version,
      action: "APPROVED",
      actor: payload.reviewer || "gov_admin_lead",
      timestamp: new Date().toISOString(),
      reason: payload.notes || "Approved for model registry staging."
    });

    return { ...target };
  }

  public async rejectLearningCandidate(learningId: string, payload: RejectCandidateRequest): Promise<LearningCandidate> {
    await this.delay(40);
    const target = candidatesStore.find(c => c.learning_id === learningId) || candidatesStore[0];
    target.status = "REJECTED";
    target.reviewed_by = payload.reviewer || "gov_admin_lead";
    target.review_notes = payload.reason;

    auditEventsStore.unshift({
      event_id: `AUD-LRN-${Math.floor(1000 + Math.random() * 9000)}`,
      learning_id: learningId,
      model_version: target.target_version,
      action: "REJECTED",
      actor: payload.reviewer || "gov_admin_lead",
      timestamp: new Date().toISOString(),
      reason: payload.reason
    });

    return { ...target };
  }

  public async fetchModelVersions(params?: any): Promise<ModelVersion[]> {
    await this.delay(30);
    let list = [...modelVersionsStore];
    if (params?.model_family && params.model_family !== 'all') {
      list = list.filter(m => m.model_family === params.model_family);
    }
    return list;
  }

  public async activateModelVersion(version: string, payload: ActivateModelRequest): Promise<ModelVersion> {
    await this.delay(40);
    let target = modelVersionsStore.find(m => m.model_version === version);
    if (!target) {
      target = {
        model_version: version,
        model_family: "SCENARIO_SIMULATION",
        status: "ACTIVE",
        parameters: { "scenario_effectiveness_factor": 0.942 },
        created_at: new Date().toISOString(),
        activated_at: new Date().toISOString(),
        description: "Promoted to production active model version."
      };
      modelVersionsStore.unshift(target);
    }

    // Demote prior active version in this family to SUPERSEDED
    modelVersionsStore.forEach(m => {
      if (m.model_family === target!.model_family && m.model_version !== version && m.status === 'ACTIVE') {
        m.status = 'SUPERSEDED';
      }
    });

    target.status = 'ACTIVE';
    target.activated_at = new Date().toISOString();
    target.activated_by = payload.actor || "gov_admin_lead";

    auditEventsStore.unshift({
      event_id: `AUD-LRN-${Math.floor(1000 + Math.random() * 9000)}`,
      learning_id: "LRN-SCENARIO-001",
      model_version: version,
      action: "ACTIVATED",
      actor: payload.actor || "gov_admin_lead",
      timestamp: new Date().toISOString(),
      reason: payload.reason || "Promoted to production active model version."
    });

    return { ...target };
  }

  public async rollbackModelVersion(version: string, payload: RollbackModelRequest): Promise<ModelVersion> {
    await this.delay(40);
    const target = modelVersionsStore.find(m => m.model_version === version) || modelVersionsStore[0];
    target.status = 'ROLLED_BACK';

    const targetRollback = payload.target_version || "v8.0-deterministic";
    const fallbackTarget = modelVersionsStore.find(m => m.model_version === targetRollback) || modelVersionsStore[0];
    fallbackTarget.status = 'ACTIVE';
    fallbackTarget.activated_at = new Date().toISOString();

    auditEventsStore.unshift({
      event_id: `AUD-LRN-${Math.floor(1000 + Math.random() * 9000)}`,
      learning_id: "LRN-SCENARIO-001",
      model_version: targetRollback,
      action: "ROLLED_BACK",
      actor: payload.actor || "gov_admin_lead",
      timestamp: new Date().toISOString(),
      reason: payload.reason || `Rollback executed from ${version} to ${targetRollback}`
    });

    return { ...target };
  }

  public async explainLearningCandidate(learningId: string): Promise<LearningExplanationResponse> {
    await this.delay(30);
    return {
      learning_id: learningId,
      grounded_explanation: "Across historical evaluations in the training partition, the simulation engine consistently overestimated tap water gap reduction by 5.8%. The candidate model applies deterministic shrinkage to align future estimates with observed outcomes.",
      cited_evaluation_ids: ["EVAL-001", "EVAL-002"],
      limitations: [
        "Calibrated against rural water supply pilots in Dharmapuri district.",
        "Model updates require field audit re-validation every 12 months."
      ],
      prompt_version: "v10.0-grounded-learning",
      disclaimer: "CALIBRATION CANDIDATE — NOT ACTIVE PRODUCTION MODEL. NOT OFFICIAL POLICY"
    };
  }

  public async fetchLearningAuditEvents(params?: any): Promise<LearningAuditEvent[]> {
    await this.delay(20);
    return auditEventsStore;
  }
}

export const apiClient = new ApiClient();

// Export wrapper functions for seamless backward-compatibility
export const submitTextRequest = (p: any) => apiClient.submitTextRequest(p);
export const submitVoiceRequest = (f: FormData) => apiClient.submitVoiceRequest(f);
export const getSupportedLanguages = () => apiClient.getSupportedLanguages();
export const getRequestStatus = (id: string) => apiClient.getRequestStatus(id);
export const fetchCommandCenterKPIs = () => apiClient.fetchCommandCenterKPIs();
export const fetchDemandShadowGrid = () => apiClient.fetchDemandShadowGrid();
export const fetchHotspots = (p?: any) => apiClient.fetchHotspots(p);
export const fetchSilentNeedSignals = (p?: any) => apiClient.fetchSilentNeedSignals(p);
export const fetchDigitalTwin = (g: string) => apiClient.fetchDigitalTwin(g);
export const fetchEvidenceBrief = (s: string) => apiClient.fetchEvidenceBrief(s);
export const simulatePolicyScenario = (p: any) => apiClient.simulatePolicyScenario(p);
export const fetchImpactEvaluations = (p?: any) => apiClient.fetchImpactEvaluations(p);
export const getSystemInfo = () => apiClient.getSystemInfo();
export const getHealthStatus = () => apiClient.getHealthStatus();
export const getReadinessStatus = () => apiClient.getReadinessStatus();
export const getApiV1Status = () => apiClient.getApiV1Status();

// Phase 4 Exports
export const processAIRequest = (id: string) => apiClient.processAIRequest(id);
export const getAIStatus = (id: string) => apiClient.getAIStatus(id);
export const fetchDemandClusters = (p?: any) => apiClient.fetchDemandClusters(p);
export const fetchClusterDetails = (id: string) => apiClient.fetchClusterDetails(id);
export const fetchSimilarRequests = (id: string, l?: number) => apiClient.fetchSimilarRequests(id, l);
export const fetchTaxonomy = () => apiClient.fetchTaxonomy();

// Phase 5 Exports
export const fetchHotspotDetail = (id: string) => apiClient.fetchHotspotDetail(id);
export const fetchHotspotsSummary = () => apiClient.fetchHotspotsSummary();
export const fetchDemandShadowMatrix = (p?: any) => apiClient.fetchDemandShadowMatrix(p);

// Phase 6 Exports
export const fetchSilentNeedDetail = (id: string) => apiClient.fetchSilentNeedDetail(id);
export const fetchSilentNeedSummary = () => apiClient.fetchSilentNeedSummary();

// Phase 7 Exports
export const fetchEvidenceRecord = (id: string) => apiClient.fetchEvidenceRecord(id);
export const fetchEvidenceSummary = () => apiClient.fetchEvidenceSummary();
export const refreshEvidenceBrief = (id: string) => apiClient.refreshEvidenceBrief(id);

// Phase 8 Exports
export const simulateScenario = (p: ScenarioInput) => apiClient.simulateScenario(p);
export const fetchScenarios = (p?: any) => apiClient.fetchScenarios(p);
export const fetchScenarioDetail = (id: string) => apiClient.fetchScenarioDetail(id);
export const compareScenarios = (ids: string[]) => apiClient.compareScenarios(ids);
export const explainScenario = (id: string) => apiClient.explainScenario(id);
export const archiveScenario = (id: string) => apiClient.archiveScenario(id);

// Phase 9 Exports
export const createImpactEvaluation = (p: EvaluationCreateInput) => apiClient.createImpactEvaluation(p);
export const fetchImpactEvaluationDetail = (id: string) => apiClient.fetchImpactEvaluationDetail(id);
export const recordImpactObservation = (id: string, p: ObservationInput) => apiClient.recordImpactObservation(id, p);
export const recalculateImpact = (id: string) => apiClient.recalculateImpact(id);
export const explainImpactEvaluation = (id: string) => apiClient.explainImpactEvaluation(id);
export const fetchModelValidation = () => apiClient.fetchModelValidation();
export const fetchControlledIndicators = () => apiClient.fetchControlledIndicators();

// Phase 10 Exports
export const fetchLearningSummary = () => apiClient.fetchLearningSummary();
export const fetchLearningCandidates = (p?: any) => apiClient.fetchLearningCandidates(p);
export const fetchLearningCandidateDetail = (id: string) => apiClient.fetchLearningCandidateDetail(id);
export const generateLearningCandidate = (p: GenerateCandidateRequest) => apiClient.generateLearningCandidate(p);
export const validateLearningCandidate = (id: string, p?: ValidateCandidateRequest) => apiClient.validateLearningCandidate(id, p);
export const approveLearningCandidate = (id: string, p: ApproveCandidateRequest) => apiClient.approveLearningCandidate(id, p);
export const rejectLearningCandidate = (id: string, p: RejectCandidateRequest) => apiClient.rejectLearningCandidate(id, p);
export const fetchModelVersions = (p?: any) => apiClient.fetchModelVersions(p);
export const activateModelVersion = (v: string, p: ActivateModelRequest) => apiClient.activateModelVersion(v, p);
export const rollbackModelVersion = (v: string, p: RollbackModelRequest) => apiClient.rollbackModelVersion(v, p);
export const explainLearningCandidate = (id: string) => apiClient.explainLearningCandidate(id);
export const fetchLearningAuditEvents = (p?: any) => apiClient.fetchLearningAuditEvents(p);
